import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_DISPLAY_NAME = 100;
const MAX_BIO = 500;
const MAX_WEBSITE = 500;
const MAX_USERNAME = 50;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;

export type ProfileRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  timezone: string | null;
  locale: string | null;
  bio: string | null;
  website: string | null;
  username: string | null;
  public_profile: boolean;
  theme: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileJson = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  timezone: string | null;
  locale: string | null;
  bio: string | null;
  website: string | null;
  username: string | null;
  publicProfile: boolean;
  theme: "light" | "dark";
  createdAt: string;
  updatedAt: string;
};

function toJson(row: ProfileRow): ProfileJson {
  return {
    id: row.id,
    displayName: row.display_name ?? null,
    avatarUrl: row.avatar_url ?? null,
    timezone: row.timezone ?? null,
    locale: row.locale ?? null,
    bio: row.bio ?? null,
    website: row.website ?? null,
    username: row.username ?? null,
    publicProfile: row.public_profile ?? false,
    theme: row.theme === "dark" ? "dark" : "light",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("profiles")
      .select("id,display_name,avatar_url,timezone,locale,bio,website,username,public_profile,theme,created_at,updated_at")
      .eq("id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      }
      throw error;
    }

    const profile = toJson((data ?? {}) as ProfileRow);
    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Profile GET error:", error);
    const err = error as { message?: string };
    return NextResponse.json(
      { error: err?.message || "Failed to load profile" },
      { status: 500 }
    );
  }
}

type PatchBody = {
  displayName?: string;
  avatarUrl?: string;
  timezone?: string;
  locale?: string;
  bio?: string;
  website?: string;
  username?: string;
  publicProfile?: boolean;
  theme?: "light" | "dark";
};

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body: PatchBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.displayName !== undefined) {
      const v = String(body.displayName).trim();
      if (v.length > MAX_DISPLAY_NAME) {
        return NextResponse.json(
          { error: `displayName must be ${MAX_DISPLAY_NAME} characters or less` },
          { status: 400 }
        );
      }
      updates.display_name = v || null;
    }
    if (body.avatarUrl !== undefined) {
      const v = typeof body.avatarUrl === "string" ? body.avatarUrl.trim() : "";
      if (v.length > 2048) {
        return NextResponse.json({ error: "avatarUrl too long" }, { status: 400 });
      }
      updates.avatar_url = v || null;
    }
    if (body.timezone !== undefined) {
      updates.timezone = typeof body.timezone === "string" ? body.timezone.trim() || "UTC" : "UTC";
    }
    if (body.locale !== undefined) {
      updates.locale = typeof body.locale === "string" ? body.locale.trim() || "en" : "en";
    }
    if (body.bio !== undefined) {
      const v = String(body.bio).trim();
      if (v.length > MAX_BIO) {
        return NextResponse.json(
          { error: `bio must be ${MAX_BIO} characters or less` },
          { status: 400 }
        );
      }
      updates.bio = v || null;
    }
    if (body.website !== undefined) {
      const v = String(body.website).trim();
      if (v.length > MAX_WEBSITE) {
        return NextResponse.json(
          { error: `website must be ${MAX_WEBSITE} characters or less` },
          { status: 400 }
        );
      }
      updates.website = v || null;
    }
    if (body.username !== undefined) {
      const v = String(body.username).trim().toLowerCase();
      if (v.length > MAX_USERNAME) {
        return NextResponse.json(
          { error: `username must be ${MAX_USERNAME} characters or less` },
          { status: 400 }
        );
      }
      if (v && !USERNAME_REGEX.test(v)) {
        return NextResponse.json(
          { error: "username can only contain letters, numbers, underscores, and hyphens" },
          { status: 400 }
        );
      }
      updates.username = v || null;
    }
    if (body.publicProfile !== undefined) {
      updates.public_profile = Boolean(body.publicProfile);
    }
    if (body.theme !== undefined) {
      updates.theme = body.theme === "dark" ? "dark" : "light";
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select("id,display_name,avatar_url,timezone,locale,bio,website,username,public_profile,theme,created_at,updated_at")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
      }
      throw error;
    }

    const profile = toJson((data ?? {}) as ProfileRow);
    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Profile PATCH error:", error);
    const err = error as { message?: string };
    return NextResponse.json(
      { error: err?.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}
