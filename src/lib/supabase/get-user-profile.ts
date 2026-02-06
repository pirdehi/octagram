import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export type Theme = "light" | "dark";

export type Profile = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  timezone: string | null;
  locale: string | null;
  bio: string | null;
  website: string | null;
  username: string | null;
  publicProfile: boolean;
  theme: Theme;
  createdAt: string;
  updatedAt: string;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  timezone: string | null;
  locale: string | null;
  bio: string | null;
  website: string | null;
  username?: string | null;
  public_profile?: boolean;
  theme?: string | null;
  created_at: string;
  updated_at: string;
};

export async function getUserProfile(): Promise<{
  user: User | null;
  profile: Profile | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, profile: null };

  const { data: row } = await supabase
    .from("profiles")
    .select("id,display_name,avatar_url,timezone,locale,bio,website,username,public_profile,theme,created_at,updated_at")
    .eq("id", user.id)
    .single();

  if (!row) {
    return {
      user,
      profile: null,
    };
  }

  const r = row as ProfileRow;
  const theme = r.theme === "dark" ? "dark" : "light";
  const profile: Profile = {
    id: r.id,
    displayName: r.display_name ?? null,
    avatarUrl: r.avatar_url ?? null,
    timezone: r.timezone ?? null,
    locale: r.locale ?? null,
    bio: r.bio ?? null,
    website: r.website ?? null,
    username: r.username ?? null,
    publicProfile: r.public_profile ?? false,
    theme,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };

  return { user, profile };
}
