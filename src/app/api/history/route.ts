import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RunType = "translate" | "rewrite" | "reply";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as RunType | null;
    const q = (searchParams.get("q") || "").trim();
    const collectionId = (searchParams.get("collectionId") || "").trim();
    const notInCollection = searchParams.get("notInCollection") === "1";

    const limitRaw = Number(searchParams.get("limit") || "30");
    const offsetRaw = Number(searchParams.get("offset") || "0");
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 30;
    const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0;

    if (!type || !["translate", "rewrite", "reply"].includes(type)) {
      return NextResponse.json(
        { error: "type must be one of: translate, rewrite, reply" },
        { status: 400 }
      );
    }

    // Collection filters are based on collection_items.run_id (best-effort).
    let runIdsFilter: string[] | null = null;
    let excludeRunIds: string[] | null = null;

    if (collectionId) {
      const { data: items, error } = await supabase
        .from("collection_items")
        .select("run_id")
        .eq("collection_id", collectionId)
        .not("run_id", "is", null);
      if (error) throw error;
      runIdsFilter = (items || [])
        .map((i) => i.run_id as string | null)
        .filter(Boolean) as string[];
    } else if (notInCollection) {
      const { data: items, error } = await supabase
        .from("collection_items")
        .select("run_id")
        .not("run_id", "is", null);
      if (error) throw error;
      excludeRunIds = (items || [])
        .map((i) => i.run_id as string | null)
        .filter(Boolean) as string[];
    }

    let query = supabase
      .from("runs")
      .select(
        "id,type,source,input_text,output_text,output_json,params,model,token_total,latency_ms,created_at"
      )
      .eq("type", type)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (q) {
      const escaped = q.replace(/%/g, "\\%").replace(/_/g, "\\_");
      query = query.or(
        `input_text.ilike.%${escaped}%,output_text.ilike.%${escaped}%`
      );
    }

    if (runIdsFilter) {
      if (runIdsFilter.length === 0) {
        return NextResponse.json({ items: [] });
      }
      query = query.in("id", runIdsFilter);
    }

    if (excludeRunIds && excludeRunIds.length > 0) {
      query = query.not("id", "in", `(${excludeRunIds.map((x) => `"${x}"`).join(",")})`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ items: data ?? [] });
  } catch (error) {
    console.error("History API error:", error);
    const err = error as { message?: string };
    return NextResponse.json(
      { error: err?.message || "History request failed" },
      { status: 500 }
    );
  }
}

