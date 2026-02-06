import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { password?: string; confirm?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (body.confirm !== "DELETE") {
      return NextResponse.json(
        { error: 'Type "DELETE" in the confirmation field to proceed' },
        { status: 400 }
      );
    }

    const password = typeof body.password === "string" ? body.password.trim() : "";
    if (!password) {
      return NextResponse.json(
        { error: "Password is required to delete your account" },
        { status: 400 }
      );
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email ?? "",
      password,
    });

    if (signInError) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    const admin = createAdminClient();
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error("Delete account error:", deleteError);
      return NextResponse.json(
        { error: deleteError.message || "Failed to delete account" },
        { status: 500 }
      );
    }

    await supabase.auth.signOut();

    return NextResponse.json({ ok: true, redirect: "/login" });
  } catch (error) {
    if (String(error).includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return NextResponse.json(
        { error: "Account deletion is not configured. Please contact support." },
        { status: 503 }
      );
    }
    console.error("Delete account error:", error);
    const err = error as { message?: string };
    return NextResponse.json(
      { error: err?.message || "Failed to delete account" },
      { status: 500 }
    );
  }
}
