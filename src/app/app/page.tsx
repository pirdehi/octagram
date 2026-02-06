import Link from "next/link";

export default async function AppPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a tool: translate, rewrite, or generate replies. Everything is
          autosaved to history for 30 days.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/app/translate"
          className="rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:bg-accent"
        >
          <div className="text-sm font-medium">Translate</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Translate any language to English with tone.
          </div>
        </Link>

        <Link
          href="/app/rewrite"
          className="rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:bg-accent"
        >
          <div className="text-sm font-medium">Rewrite</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Rewrite English text with presets and tone.
          </div>
        </Link>

        <Link
          href="/app/reply"
          className="rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:bg-accent"
        >
          <div className="text-sm font-medium">Reply</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Generate 3 reply options from a conversation.
          </div>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/app/history"
          className="rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:bg-accent"
        >
          <div className="text-sm font-medium">History</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Browse autosaved translations, rewrites, and replies (30 days).
          </div>
        </Link>

        <Link
          href="/app/collections"
          className="rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:bg-accent"
        >
          <div className="text-sm font-medium">Collections</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Save important outputs into curated collections (persists).
          </div>
        </Link>
      </div>
    </div>
  );
}
