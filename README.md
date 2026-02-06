# Octagram

English writing copilot: translate to English, rewrite with tone, and generate replies — with history and collections.

## Getting Started

1. Copy `.env.example` to `.env.local` and add your Supabase and OpenAI keys.
2. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Stack

- Next.js (App Router), React, TypeScript
- Supabase (auth, database)
- OpenAI for translate/rewrite/reply

## Deploy on Vercel

1. Push your code to GitHub (e.g. `github.com/pirdehi/octagram`).
2. Go to [vercel.com](https://vercel.com) → **Add New…** → **Project** → Import the `octagram` repo.
3. Add **Environment Variables** (from `.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
4. Click **Deploy**. After deploy, set your Vercel URL (e.g. `https://octagram.vercel.app`) in Supabase → **Authentication** → **URL Configuration** → **Site URL** and **Redirect URLs** (`https://your-app.vercel.app/**`, `https://your-app.vercel.app/auth/callback`).
