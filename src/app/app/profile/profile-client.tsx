"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Profile } from "@/lib/supabase/get-user-profile";

type ProfileClientProps = {
  userEmail: string;
  initialProfile: Profile | null;
};

export default function ProfileClient({ userEmail, initialProfile }: ProfileClientProps) {
  const [displayName, setDisplayName] = useState(initialProfile?.displayName ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialProfile?.avatarUrl ?? "");
  const [timezone, setTimezone] = useState(initialProfile?.timezone ?? "UTC");
  const [locale, setLocale] = useState(initialProfile?.locale ?? "en");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDisplayName(initialProfile?.displayName ?? "");
    setAvatarUrl(initialProfile?.avatarUrl ?? "");
    setTimezone(initialProfile?.timezone ?? "UTC");
    setLocale(initialProfile?.locale ?? "en");
  }, [initialProfile]);

  async function saveAccount() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          displayName: displayName.trim() || null,
          avatarUrl: avatarUrl.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to update");
      toast.success("Profile updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  async function savePreferences() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ timezone, locale }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to update");
      toast.success("Preferences updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update preferences");
    } finally {
      setSaving(false);
    }
  }

  const timezones =
    typeof Intl !== "undefined" && "supportedValuesOf" in Intl
      ? (Intl.supportedValuesOf("timeZone") as string[])
      : ["UTC", "America/New_York", "Europe/London", "Asia/Tokyo"];
  const locales = ["en", "en-US", "en-GB", "fa", "es", "fr", "de"];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={userEmail} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">Email is managed by your account provider.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="avatarUrl">Avatar URL</Label>
            <Input
              id="avatarUrl"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <Button onClick={saveAccount} disabled={saving}>
            {saving ? "Saving..." : "Save account"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {timezones.slice(0, 80).map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
              {!timezones.includes(timezone) && (
                <option value={timezone}>{timezone}</option>
              )}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="locale">Locale</Label>
            <select
              id="locale"
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {locales.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={savePreferences} disabled={saving}>
            {saving ? "Saving..." : "Save preferences"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Change password, enable 2FA, and manage sessions. (Coming in a later update.)</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Danger zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Permanently delete your account and data. (Coming in a later update.)</p>
        </CardContent>
      </Card>
    </>
  );
}
