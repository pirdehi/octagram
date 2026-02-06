# Octagram – Page audit issues

Audit date: Feb 2, 2025. All app pages and key components were reviewed. Below is a list of issues by severity.

---

## Fixed in this pass

- **Home (`/`)** – Live example section showed literal `\n` in labels (“Formality\n”, “Creativity\n”, “Result\n”). Replaced with proper JSX structure so labels render as “Formality”, “Creativity”, “Result” with values below.

---

## High priority

### 1. No mobile navigation (App layout – `/app/*`)

- **Where:** `src/app/app/layout.tsx`
- **Issue:** Sidebar uses `hidden ... md:flex`, so on viewports below `md` the sidebar is hidden and there is no alternative way to reach Translate, Rewrite, Reply, History, Collections, or Settings.
- **Impact:** Mobile/narrow-screen users cannot navigate the app.
- **Suggestion:** Add a mobile nav (e.g. hamburger menu, bottom nav, or collapsible drawer) that shows the same links on small screens.

### 2. Signup ignores `next` redirect

- **Where:** `src/app/signup/page.tsx`
- **Issue:** After signup, the app always does `router.push("/app")`. If the user arrived via `/login?next=/app/rewrite`, they are sent to `/app` instead of `/app/rewrite`.
- **Impact:** Post-signup flow does not respect intended destination.
- **Suggestion:** Read `next` from `useSearchParams()` (like login) and after signup `router.push(next || "/app")` (and `router.refresh()`).

### 3. Destructive actions without confirmation

- **Where:**
  - `src/app/app/collections/[id]/collection-detail-client.tsx` – “Remove” on a collection item
- **Issue:** Removing an item from a collection is immediate; no “Are you sure?” step.
- **Impact:** Accidental clicks can remove saved content with no way to undo from the UI.
- **Suggestion:** Add a confirmation dialog (or inline confirm) before calling the remove API.

---

## Medium priority

### 4. Inconsistent styling on auth pages

- **Where:** `src/app/login/page.tsx`, `src/app/signup/page.tsx`
- **Issue:** Login and signup use hard-coded zinc colors (`bg-zinc-50`, `text-zinc-900`, `border-zinc-300`, etc.) instead of the design tokens used elsewhere (`bg-background`, `text-foreground`, `border-border`, `text-muted-foreground`, etc.).
- **Impact:** Auth pages look and behave differently from the rest of the app and may not follow theme (e.g. dark mode) if you add it later.
- **Suggestion:** Replace zinc classes with theme-based classes and shared components (e.g. `Input`, `Button`, `Label`) from `@/components/ui` for consistency.

### 5. No “current page” state in sidebar

- **Where:** `src/app/app/layout.tsx`
- **Issue:** Nav links use the same style for all routes; the current page is not visually indicated.
- **Impact:** Users cannot quickly see which section they are in.
- **Suggestion:** Use `usePathname()` (in a client nav component) or pass pathname from layout and apply an active style (e.g. `aria-current="page"`, different background/weight) to the link that matches the current path.

### 6. Copy feedback inconsistency

- **Where:** Translate and Rewrite tools
- **Issue:** Copy buttons do not show a toast. History and Collection detail use `toast.success("Copied")` after copy.
- **Impact:** On Translate/Rewrite, users get no explicit feedback that copy succeeded.
- **Suggestion:** After a successful copy in Translate and Rewrite tools, call `toast.success("Copied")` (or similar) for consistency with History and Collections.

### 7. Landing links to app routes when unauthenticated

- **Where:** `src/app/page.tsx` – “Open Translate”, “Open Rewrite”, “Open Reply” in #features
- **Issue:** These point to `/app/translate`, `/app/rewrite`, `/app/reply`. Unauthenticated users are correctly redirected to `/login?next=...` by middleware, but the links do not make “sign in first” obvious.
- **Impact:** Minor UX; users might expect to land on the tool and then see login.
- **Suggestion:** Optional: add a short line under the CTA like “Sign in to use” or use a single “Open app” that goes to `/app` (or `/login`) so the flow is clearer.

---

## Low priority / polish

### 8. Home page: internal links as `<a>` instead of `Link`

- **Where:** `src/app/page.tsx`
- **Issue:** Nav and CTAs use `<a href="...">` for `/login`, `/signup`, `/app`, and in-page `#features`, `#how-it-works`, `#faq`. For same-origin routes, Next.js recommends `Link` for client-side navigation and prefetching.
- **Impact:** Full page loads instead of client navigation; no prefetch.
- **Suggestion:** Use `Link` from `next/link` for `/login`, `/signup`, `/app`, and keep `<a href="#...">` for in-page anchors (or use `Link` with `href="#section"` if desired).

### 9. Reply tool: Save dialog payload after close

- **Where:** `src/app/app/reply/reply-tool.tsx`
- **Issue:** When the Save dialog is closed, `savePayload` is not cleared; it is only replaced when opening Save for another option. Behavior is correct but state is slightly redundant.
- **Impact:** None for users; optional cleanup for clarity.
- **Suggestion:** Optionally call `setSavePayload(null)` in `onOpenChange` when the dialog closes.

### 10. History: saving one reply option

- **Where:** `src/app/app/history/history-client.tsx` – `openSaveFromRun` for type `"reply"`
- **Issue:** For reply runs, `outputText` passed to the save dialog is `getReplies(run.output_json)[0]` (first reply only). Saving “to collection” therefore saves only one of the three options.
- **Impact:** By design; user explicitly chooses which option to save from the Reply tool. From History they save the first option unless you change the UX.
- **Suggestion:** If you want “save all three” from History, extend the dialog or add a control to choose which reply (1/2/3) to save, or save all three as separate items.

### 11. Accessibility

- **Where:** App-wide
- **Issue:** No skip link; modal focus trapping and return focus not verified; some interactive elements may lack clear labels for screen readers.
- **Impact:** Accessibility and keyboard/screen-reader UX could be improved.
- **Suggestion:** Add a “Skip to main content” link; ensure dialogs trap focus and restore it on close; add `aria-label` or visible labels where needed; run axe or similar and fix reported issues.

### 12. Settings page: usage data freshness

- **Where:** `src/app/app/settings/page.tsx`
- **Issue:** Daily usage is loaded once on the server when the page is rendered. If the user runs Translate/Rewrite/Reply and then navigates to Settings without a full reload, the displayed usage may be stale.
- **Impact:** Users might see an outdated “tokens used” until they refresh.
- **Suggestion:** Optional: make the usage block a client component that fetches `/api/usage/today` on mount (and optionally on focus/interval) so the number updates after using the tools.

---

## Summary

| Severity | Count |
|----------|--------|
| Fixed    | 1     |
| High     | 3     |
| Medium   | 4     |
| Low      | 5     |

**Recommended order to tackle:**  
1) Mobile nav (high).  
2) Signup `next` redirect (high).  
3) Remove confirmation on collection item (high).  
4) Auth page styling and sidebar active state (medium).  
5) Copy toasts and remaining items as needed.
