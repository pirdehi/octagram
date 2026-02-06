import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const redirectTo = next.startsWith("/") ? new URL(next, origin).toString() : next;
      return NextResponse.redirect(redirectTo);
    }
    console.error("Auth callback exchange error:", error);
  }

  return NextResponse.redirect(new URL("/login?error=auth_callback", origin));
}
