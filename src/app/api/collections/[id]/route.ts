import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: collection, error: colErr } = await supabase
      .from("collections")
      .select("id,name,created_at")
      .eq("id", id)
      .single();
    if (colErr) throw colErr;

    const { data: items, error: itemsErr } = await supabase
      .from("collection_items")
      .select(
        "id,type,source,input_text,output_text,output_json,params,created_at,run_id"
      )
      .eq("collection_id", id)
      .order("created_at", { ascending: false });
    if (itemsErr) throw itemsErr;

    return NextResponse.json({
      collection: {
        id: collection.id,
        name: collection.name,
        createdAt: collection.created_at,
      },
      items: items ?? [],
    });
  } catch (error) {
    console.error("Collection GET error:", error);
    const err = error as { message?: string };
    return NextResponse.json(
      { error: err?.message || "Collection request failed" },
      { status: 500 }
    );
  }
}

