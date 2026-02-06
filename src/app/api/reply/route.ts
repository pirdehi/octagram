import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { FORMALITY_MAP, isIntInRange } from "@/lib/octagram/tone";
import {
  addTodayTokens,
  DAILY_TOKEN_BUDGET,
  getTodayTokenTotal,
} from "@/lib/octagram/usage";

const MAX_CONTEXT_CHARS = 8000;

const INTENTS = [
  "Confirm",
  "Decline",
  "Apologize",
  "Follow up",
  "Ask clarification",
  "Thank you",
] as const;

const LENGTHS = ["Short", "Medium", "Long"] as const;

type Intent = (typeof INTENTS)[number];
type ReplyLength = (typeof LENGTHS)[number];

function isIntent(value: unknown): value is Intent {
  return typeof value === "string" && (INTENTS as readonly string[]).includes(value);
}

function isReplyLength(value: unknown): value is ReplyLength {
  return typeof value === "string" && (LENGTHS as readonly string[]).includes(value);
}

function safeParseReplies(content: string): string[] | null {
  const trimmed = content.trim();

  const tryParse = (s: string): string[] | null => {
    const obj: unknown = JSON.parse(s);
    if (!obj || typeof obj !== "object") return null;
    const repliesValue = (obj as Record<string, unknown>)["replies"];
    if (!Array.isArray(repliesValue)) return null;
    const replies = repliesValue
      .map((r) => (typeof r === "string" ? r.trim() : ""))
      .filter(Boolean);
    return replies.length === 3 ? replies : null;
  };

  // 1) Direct JSON
  try {
    const parsed = tryParse(trimmed);
    if (parsed) return parsed;
  } catch {
    // ignore
  }

  // 2) Extract first {...} block
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const block = trimmed.slice(firstBrace, lastBrace + 1);
    try {
      const parsed = tryParse(block);
      if (parsed) return parsed;
    } catch {
      // ignore
    }
  }

  // 3) Fallback: split lines/bullets, take first 3 non-empty
  const lines = trimmed
    .split("\n")
    .map((l) => l.replace(/^\s*[\-\*\d\.\)\:]+\s*/, "").trim())
    .filter(Boolean);
  if (lines.length >= 3) return lines.slice(0, 3);

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: {
      conversationContext?: string;
      intent?: Intent | string;
      length?: ReplyLength | string;
      formality?: number;
      whatIWantToSay?: string;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { conversationContext, intent, length, formality, whatIWantToSay } =
      body;

    if (
      !conversationContext ||
      typeof conversationContext !== "string" ||
      conversationContext.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "conversationContext is required" },
        { status: 400 }
      );
    }

    if (conversationContext.length > MAX_CONTEXT_CHARS) {
      return NextResponse.json(
        { error: `conversationContext must be ${MAX_CONTEXT_CHARS} characters or less` },
        { status: 400 }
      );
    }

    if (!isIntent(intent)) {
      return NextResponse.json(
        { error: `intent must be one of: ${INTENTS.join(", ")}` },
        { status: 400 }
      );
    }

    if (!isReplyLength(length)) {
      return NextResponse.json(
        { error: `length must be one of: ${LENGTHS.join(", ")}` },
        { status: 400 }
      );
    }

    if (!isIntInRange(formality, 1, 8)) {
      return NextResponse.json(
        { error: "Formality must be an integer from 1 to 8" },
        { status: 400 }
      );
    }

    if (whatIWantToSay && typeof whatIWantToSay !== "string") {
      return NextResponse.json(
        { error: "whatIWantToSay must be a string" },
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

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const formalityDesc = FORMALITY_MAP[formality];

    const userContent = [
      `Conversation context:\n${conversationContext}`,
      whatIWantToSay?.trim()
        ? `\nWhat I want to say:\n${whatIWantToSay.trim()}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const systemPrompt = `You are an assistant that drafts replies in English.

Rules:
- Output MUST be valid JSON with the exact shape: {"replies":["...","...","..."]}.
- The replies must be in English.
- Provide exactly 3 replies.
- No extra keys, no commentary, no markdown.
- Intent: ${intent}
- Length: ${length}
- Tone: ${formalityDesc}
- Keep replies aligned with the conversation and intent.`;

    const startedAt = Date.now();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      stream: false,
      temperature: 0.7,
    });
    const latencyMs = Date.now() - startedAt;

    const content = completion.choices[0]?.message?.content ?? "";
    const replies = safeParseReplies(content);
    if (!replies || replies.length !== 3) {
      return NextResponse.json(
        { error: "Model returned an invalid reply format. Please try again." },
        { status: 502 }
      );
    }

    const usage = completion.usage;
    const tokenIn = usage?.prompt_tokens ?? null;
    const tokenOut = usage?.completion_tokens ?? null;
    const tokenTotalNew = usage?.total_tokens ?? null;

    let runId: string | null = null;
    try {
      if (tokenTotalNew != null) await addTodayTokens(supabase, tokenTotalNew);

      const { data: runRow } = await supabase
        .from("runs")
        .insert({
          type: "reply",
          source: "web",
          input_text: userContent,
          output_json: { replies },
          params: { intent, length, formality },
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
      console.warn("Reply logging error:", logError);
    }

    return NextResponse.json({ replies, runId });
  } catch (error) {
    console.error("Reply API error:", error);
    const err = error as { message?: string; code?: string };
    let message = "Reply generation failed";
    if (err?.message) message = err.message;
    if (err?.code === "insufficient_quota")
      message = "OpenAI quota exceeded. Check your plan and billing.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

