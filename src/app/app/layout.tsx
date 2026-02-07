import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/supabase/get-user-profile";
import { SyncProfileTheme } from "@/components/sync-profile-theme";

const NAV = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/translate", label: "Translate" },
  { href: "/app/rewrite", label: "Rewrite" },
  { href: "/app/reply", label: "Reply" },
  { href: "/app/history", label: "History" },
  { href: "/app/collections", label: "Collections" },
  { href: "/app/profile", label: "Profile" },
  { href: "/app/settings", label: "Settings" },
] as const;

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getUserProfile();

  if (!user) {
    redirect("/login");
  }

  const displayLabel = profile?.displayName?.trim() || user.email || "Account";
  const showConfirmBanner = !user.email_confirmed_at;

  const theme = profile?.theme ?? "light";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SyncProfileTheme profileTheme={theme} />
      <div className="mx-auto flex min-h-screen max-w-6xl">
        <aside className="hidden w-64 flex-col border-r border-border bg-card px-4 py-6 md:flex">
          <div className="mb-6">
            <div className="text-lg font-semibold tracking-tight">Octagram</div>
            <div className="mt-1 text-xs text-muted-foreground">
              English writing copilot
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-6 border-t border-border pt-4">
            <div className="flex items-center gap-2">
              {profile?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarUrl}
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  {displayLabel.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1 truncate text-sm font-medium">{displayLabel}</div>
            </div>
            <form action="/auth/logout" method="POST" className="mt-3">
              <button
                type="submit"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
              >
                Logout
              </button>
            </form>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-border bg-card px-4 py-4 md:px-6">
            <div className="hidden text-sm text-muted-foreground md:block">
              {displayLabel}
            </div>
          </header>
          {showConfirmBanner && (
            <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
              Please confirm your email. Check your inbox for the confirmation link.
            </div>
          )}
          <main className="flex-1 px-4 py-6 md:px-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
