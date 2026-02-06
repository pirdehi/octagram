export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              O
            </div>
            <div>
              <div className="text-sm font-semibold leading-none">Octagram</div>
              <div className="mt-1 text-xs text-muted-foreground">
                English writing copilot
              </div>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a className="hover:text-foreground" href="#features">
              Features
            </a>
            <a className="hover:text-foreground" href="#how-it-works">
              How it works
            </a>
            <a className="hover:text-foreground" href="#faq">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="/login"
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              Log in
            </a>
            <a
              href="/signup"
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Sign up
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-24 left-1/2 h-72 w-[48rem] -translate-x-1/2 rounded-full bg-muted/60 blur-3xl" />
            <div className="absolute -bottom-24 left-1/3 h-72 w-[48rem] -translate-x-1/2 rounded-full bg-muted/40 blur-3xl" />
          </div>

          <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
                  Web-only MVP • Autosaved history • Collections
                </div>
                <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
                  Write better English in minutes.
                </h1>
                <p className="max-w-xl text-pretty text-base leading-7 text-muted-foreground md:text-lg">
                  Octagram helps you translate to English, rewrite with tone, and
                  generate replies — then keeps everything organized in history
                  and collections for easy reuse.
                </p>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <a
                    href="/signup"
                    className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Start free
                  </a>
                  <a
                    href="/login"
                    className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-5 text-sm font-medium hover:bg-accent"
                  >
                    Log in
                  </a>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full border border-border bg-card px-3 py-1">
                    8-level formality
                  </span>
                  <span className="rounded-full border border-border bg-card px-3 py-1">
                    Translate / Rewrite / Reply
                  </span>
                  <span className="rounded-full border border-border bg-card px-3 py-1">
                    Token budget protection
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Live example</div>
                  <div className="text-xs text-muted-foreground">
                    Translate to English
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  <div className="rounded-lg border border-border bg-background p-3 text-sm text-muted-foreground">
                    <div className="mb-2 text-xs font-medium text-foreground">
                      Input
                    </div>
                    Hi, could you please check on the status of my order?
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                    <div className="mb-2 text-xs font-medium text-foreground">
                      Output
                    </div>
                    Hi, could you please check on the status of my order?
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div className="rounded-md border border-border bg-background px-3 py-2 text-center">
                    <div>Formality</div>
                    <div className="mt-1 text-foreground">Friendly</div>
                  </div>
                  <div className="rounded-md border border-border bg-background px-3 py-2 text-center">
                    <div>Creativity</div>
                    <div className="mt-1 text-foreground">Natural</div>
                  </div>
                  <div className="rounded-md border border-border bg-background px-3 py-2 text-center">
                    <div>Result</div>
                    <div className="mt-1 text-foreground">Copy</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="border-t border-border bg-muted/10">
          <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
            <div className="grid gap-8 md:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="text-sm font-semibold">Translate to English</div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Translate from any language to English and keep the right tone
                  (from highly literary to very street).
                </p>
                <a
                  href="/app/translate"
                  className="mt-4 inline-flex text-sm font-medium text-foreground underline underline-offset-4"
                >
                  Open Translate
                </a>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="text-sm font-semibold">Rewrite with presets</div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Make it clearer, shorter, more formal, more friendly, more
                  persuasive, or street — with consistent formatting.
                </p>
                <a
                  href="/app/rewrite"
                  className="mt-4 inline-flex text-sm font-medium text-foreground underline underline-offset-4"
                >
                  Open Rewrite
                </a>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="text-sm font-semibold">Reply generator</div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Paste a conversation and get exactly 3 reply options tailored
                  by intent, length, and tone.
                </p>
                <a
                  href="/app/reply"
                  className="mt-4 inline-flex text-sm font-medium text-foreground underline underline-offset-4"
                >
                  Open Reply
                </a>
              </div>
            </div>

            <div className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="grid gap-6 md:grid-cols-2 md:items-center">
                <div>
                  <div className="text-sm font-semibold">
                    History + Collections
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Every output is autosaved to history for 30 days. Save the
                    important ones into collections so they stay available.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-border bg-background p-4">
                    <div className="text-xs text-muted-foreground">History</div>
                    <div className="mt-1 font-medium">30 days</div>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-4">
                    <div className="text-xs text-muted-foreground">Collections</div>
                    <div className="mt-1 font-medium">Persist</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-t border-border">
          <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
            <h2 className="text-xl font-semibold tracking-tight">
              How it works
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="text-sm font-semibold">1. Pick a tool</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Translate, rewrite, or generate replies — each has its own
                  dedicated workflow.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="text-sm font-semibold">2. Choose tone</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Set your desired voice with 8-level formality and creativity
                  controls.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="text-sm font-semibold">3. Reuse anytime</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Results autosave to history. Save the best ones into
                  collections for future use.
                </p>
              </div>
            </div>

            <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm md:flex-row md:items-center">
              <div>
                <div className="text-sm font-semibold">
                  Ready to try Octagram?
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Create an account and start free.
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href="/signup"
                  className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Start free
                </a>
                <a
                  href="/login"
                  className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-5 text-sm font-medium hover:bg-accent"
                >
                  Log in
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="border-t border-border bg-muted/10">
          <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
            <h2 className="text-xl font-semibold tracking-tight">FAQ</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="text-sm font-semibold">
                  Is this free to use?
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Yes in v1. We enforce a daily token budget to keep the service
                  reliable while we iterate.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="text-sm font-semibold">
                  Do you store my text?
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Results are autosaved to history for 30 days. You can save
                  important items into collections for longer access.
                </p>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-border">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6">
            <div>© {new Date().getFullYear()} Octagram</div>
            <div className="flex gap-4">
              <a className="hover:text-foreground" href="/login">
                Log in
              </a>
              <a className="hover:text-foreground" href="/signup">
                Sign up
              </a>
              <a className="hover:text-foreground" href="/app">
                App
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
