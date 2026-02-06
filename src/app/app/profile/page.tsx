import { getUserProfile } from "@/lib/supabase/get-user-profile";
import { redirect } from "next/navigation";
import ProfileClient from "./profile-client";
import type { Profile } from "@/lib/supabase/get-user-profile";

export default async function ProfilePage() {
  const { user, profile } = await getUserProfile();

  if (!user) {
    redirect("/login");
  }

  const initialProfile: Profile | null = profile;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account, preferences, and security.
        </p>
      </div>

      <ProfileClient
        userEmail={user.email ?? ""}
        initialProfile={initialProfile}
      />
    </div>
  );
}
