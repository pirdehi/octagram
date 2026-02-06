import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DAILY_TOKEN_BUDGET, getTodayTokenTotal } from "@/lib/octagram/usage";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { day, tokenTotal } = await getTodayTokenTotal(supabase);

    return NextResponse.json({
      day,
      tokenTotal,
      budget: DAILY_TOKEN_BUDGET,
      remaining: Math.max(0, DAILY_TOKEN_BUDGET - tokenTotal),
    });
  } catch (error) {
    console.error("Usage today API error:", error);
    return NextResponse.json({ error: "Usage request failed" }, { status: 500 });
  }
}

