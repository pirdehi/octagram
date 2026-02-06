import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RunType = "translate" | "rewrite" | "reply";

function isRunType(value: unknown): value is RunType {
  return value === "translate" || value === "rewrite" || value === "reply";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: collectionId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body: {
      runId?: string;
      type?: RunType;
      source?: string;
      inputText?: string;
      outputText?: string;
      outputJson?: unknown;
      params?: unknown;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const runId = (body.runId || "").trim();

    // Preferred path: lock from an existing run (server-trusted payload)
    if (runId) {
      const { data: run, error: runErr } = await supabase
        .from("runs")
        .select("id,type,source,input_text,output_text,output_json,params,created_at")
        .eq("id", runId)
        .single();
      if (runErr) throw runErr;

      const { data: inserted, error } = await supabase
        .from("collection_items")
        .insert({
          collection_id: collectionId,
          run_id: run.id,
          type: run.type,
          source: run.source,
          input_text: run.input_text,
          output_text: run.output_text,
          output_json: run.output_json,
          params: run.params,
          created_at: run.created_at,
        })
        .select("id")
        .single();

      if (error) throw error;
      return NextResponse.json({ id: inserted.id });
    }

    // Fallback: lock from provided payload (used when runId isn't available)
    if (!isRunType(body.type)) {
      return NextResponse.json(
        { error: "type is required (translate|rewrite|reply)" },
        { status: 400 }
      );
    }

    const source = (body.source || "web").trim() || "web";
    const inputText = (body.inputText || "").trim();
    const outputText =
      typeof body.outputText === "string" ? body.outputText.trim() : null;

    if (!inputText) {
      return NextResponse.json({ error: "inputText is required" }, { status: 400 });
    }

    const paramsObj = (body.params && typeof body.params === "object")
      ? body.params
      : {};

    const outputJsonObj =
      body.outputJson && typeof body.outputJson === "object" ? body.outputJson : null;

    const { data: inserted, error } = await supabase
      .from("collection_items")
      .insert({
        collection_id: collectionId,
        run_id: null,
        type: body.type,
        source,
        input_text: inputText,
        output_text: outputText,
        output_json: outputJsonObj,
        params: paramsObj,
      })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({ id: inserted.id });
  } catch (error) {
    console.error("Collection item POST error:", error);
    const err = error as { message?: string };
    return NextResponse.json(
      { error: err?.message || "Add to collection failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: collectionId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body: { itemId?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const itemId = (body.itemId || "").trim();
    if (!itemId) return NextResponse.json({ error: "itemId is required" }, { status: 400 });

    const { error } = await supabase
      .from("collection_items")
      .delete()
      .eq("collection_id", collectionId)
      .eq("id", itemId);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Collection item DELETE error:", error);
    const err = error as { message?: string };
    return NextResponse.json(
      { error: err?.message || "Remove from collection failed" },
      { status: 500 }
    );
  }
}

