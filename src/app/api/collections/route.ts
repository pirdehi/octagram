import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_NAME_LEN = 60;

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("collections")
      .select("id,name,created_at,collection_items(count)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    type CollectionRow = {
      id: string;
      name: string;
      created_at: string;
      collection_items?: { count: number }[];
    };

    const rows = (data ?? []) as unknown as CollectionRow[];
    const items =
      rows.map((c) => ({
        id: c.id,
        name: c.name,
        createdAt: c.created_at,
        itemCount: c.collection_items?.[0]?.count ?? 0,
      })) ?? [];

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Collections GET error:", error);
    const err = error as { message?: string };
    return NextResponse.json(
      { error: err?.message || "Collections request failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body: { name?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const name = (body.name || "").trim();
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (name.length > MAX_NAME_LEN) {
      return NextResponse.json(
        { error: `name must be ${MAX_NAME_LEN} characters or less` },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("collections")
      .insert({ name })
      .select("id,name,created_at")
      .single();

    if (error) throw error;

    return NextResponse.json({
      item: { id: data.id, name: data.name, createdAt: data.created_at },
    });
  } catch (error) {
    console.error("Collections POST error:", error);
    const err = error as { message?: string };
    return NextResponse.json(
      { error: err?.message || "Create collection failed" },
      { status: 500 }
    );
  }
}

