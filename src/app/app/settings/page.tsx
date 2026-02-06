import { createClient } from "@/lib/supabase/server";
import { DAILY_TOKEN_BUDGET, getTodayTokenTotal } from "@/lib/octagram/usage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppearanceCard } from "./appearance-card";

export default async function SettingsPage() {
  const supabase = await createClient();

  let tokenTotal = 0;
  let day = new Date().toISOString().slice(0, 10);
  try {
    const res = await getTodayTokenTotal(supabase);
    tokenTotal = res.tokenTotal;
    day = res.day;
  } catch {
    // If the table/migration isn't applied yet, avoid breaking the page.
  }

  const remaining = Math.max(0, DAILY_TOKEN_BUDGET - tokenTotal);
  const pct = Math.min(100, Math.round((tokenTotal / DAILY_TOKEN_BUDGET) * 100));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Usage, retention, and product info.
        </p>
      </div>

      <AppearanceCard />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">Day (UTC): {day}</div>
          <div className="flex items-center justify-between text-sm">
            <span>
              Tokens used: <span className="font-medium text-foreground">{tokenTotal}</span> /{" "}
              {DAILY_TOKEN_BUDGET}
            </span>
            <span className="text-muted-foreground">{pct}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            Remaining today: <span className="font-medium text-foreground">{remaining}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            When you hit the daily budget, Octagram blocks new runs until the next day.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data retention</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            History is stored for <span className="font-medium text-foreground">30 days</span>.
          </p>
          <p>
            Items you save to <span className="font-medium text-foreground">Collections</span> persist beyond
            the history window.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

