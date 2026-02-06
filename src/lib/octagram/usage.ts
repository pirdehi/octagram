import type { SupabaseClient } from "@supabase/supabase-js";

export const DAILY_TOKEN_BUDGET = 2000;

function todayUtcDateString(): string {
  // YYYY-MM-DD (UTC) to keep budgeting consistent across clients.
  return new Date().toISOString().slice(0, 10);
}

export async function getTodayTokenTotal(supabase: SupabaseClient) {
  const day = todayUtcDateString();
  const { data, error } = await supabase
    .from("daily_usage")
    .select("token_total")
    .eq("day", day)
    .maybeSingle();

  if (error) throw error;
  return { day, tokenTotal: data?.token_total ?? 0 };
}

export async function addTodayTokens(
  supabase: SupabaseClient,
  deltaTokens: number
) {
  const { day, tokenTotal } = await getTodayTokenTotal(supabase);
  const nextTotal = tokenTotal + Math.max(0, Math.trunc(deltaTokens || 0));

  const { error } = await supabase
    .from("daily_usage")
    .upsert(
      {
        day,
        token_total: nextTotal,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,day" }
    );

  if (error) throw error;
  return { day, tokenTotal: nextTotal };
}

