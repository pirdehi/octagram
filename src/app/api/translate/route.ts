import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { CREATIVITY_MAP, FORMALITY_MAP, isIntInRange } from "@/lib/octagram/tone";
import {
  addTodayTokens,
  DAILY_TOKEN_BUDGET,
  getTodayTokenTotal,
} from "@/lib/octagram/usage";

const MAX_TEXT_CHARS = 5000;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { text?: string; formality?: number; creativity?: number };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { text, formality, creativity } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    if (text.length > MAX_TEXT_CHARS) {
      return NextResponse.json(
        { error: `Text must be ${MAX_TEXT_CHARS} characters or less` },
        { status: 400 }
      );
    }

    if (!isIntInRange(formality, 1, 8)) {
      return NextResponse.json(
        { error: "Formality must be an integer from 1 to 8" },
        { status: 400 }
      );
    }

    if (!isIntInRange(creativity, 1, 4)) {
      return NextResponse.json(
        { error: "Creativity must be an integer from 1 to 4" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const { tokenTotal } = await getTodayTokenTotal(supabase);
    if (tokenTotal >= DAILY_TOKEN_BUDGET) {
      return NextResponse.json(
        { error: "Daily limit reached. Please come back tomorrow." },
        { status: 429 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const formalityDesc = FORMALITY_MAP[formality];
    const creativityDesc = CREATIVITY_MAP[creativity];

    const systemPrompt = `You are a translator. Translate the user's text into English.

Rules:
- Output ONLY the English translation. No explanations, notes, or metadata.
- Tone: ${formalityDesc}
- Translation style: ${creativityDesc}
- Preserve paragraph structure and formatting.
- If the text is already in English, still apply the tone and style adjustments.`;

    const startedAt = Date.now();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      stream: false,
    });
    const latencyMs = Date.now() - startedAt;

    const translation =
      completion.choices[0]?.message?.content?.trim() ?? "";

    const usage = completion.usage;
    const tokenIn = usage?.prompt_tokens ?? null;
    const tokenOut = usage?.completion_tokens ?? null;
    const tokenTotalNew = usage?.total_tokens ?? null;

    // Accounting + logging (best-effort)
    let runId: string | null = null;
    try {
      if (tokenTotalNew != null) {
        await addTodayTokens(supabase, tokenTotalNew);
      }

      const { data: runRow } = await supabase
        .from("runs")
        .insert({
          type: "translate",
          source: "web",
          input_text: text,
          output_text: translation,
          params: { formality, creativity },
          model: "gpt-4o-mini",
          token_in: tokenIn,
          token_out: tokenOut,
          token_total: tokenTotalNew,
          latency_ms: latencyMs,
        })
        .select("id")
        .single();

      runId = runRow?.id ?? null;
    } catch (logError) {
      console.warn("Translate logging error:", logError);
    }

    return NextResponse.json({ translation, runId });
  } catch (error) {
    console.error("Translate API error:", error);
    const err = error as { message?: string; code?: string };
    let message = "Translation failed";
    if (err?.message) message = err.message;
    if (err?.code === "insufficient_quota")
      message = "OpenAI quota exceeded. Check your plan and billing.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
