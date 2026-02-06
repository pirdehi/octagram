import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function redirectToLogin(reason?: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const url = new URL("/login", base);
  if (reason) url.searchParams.set("reason", reason);
  return NextResponse.redirect(url, { status: 302 });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const url = request.nextUrl.clone();
  const reason = url.searchParams.get("reason") ?? "logged_out";
  return redirectToLogin(reason);
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const url = request.nextUrl.clone();
  const reason = url.searchParams.get("reason") ?? "logged_out";
  return redirectToLogin(reason);
}
