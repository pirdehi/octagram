-- Octagram v1 schema (runs, collections, usage limits) + RLS
-- Notes:
-- - History retention is enforced via `runs.expires_at` (default 30 days).
-- - Collection items store a locked payload so they can persist beyond 30 days.
-- - Apply this in Supabase SQL editor or via Supabase CLI migrations.

-- Required for UUID generation
create extension if not exists "pgcrypto";

-- ===== runs (autosaved history) =====
do $$
begin
  if not exists (select 1 from pg_type where typname = 'run_type') then
    create type public.run_type as enum ('translate', 'rewrite', 'reply');
  end if;
end $$;

create table if not exists public.runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  type public.run_type not null,
  source text not null default 'web',

  input_text text not null,
  output_text text null,
  output_json jsonb null,
  params jsonb not null default '{}'::jsonb,

  model text null,
  token_in integer null,
  token_out integer null,
  token_total integer null,
  latency_ms integer null,

  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);

create index if not exists runs_user_created_idx on public.runs (user_id, created_at desc);
create index if not exists runs_user_type_created_idx on public.runs (user_id, type, created_at desc);
create index if not exists runs_expires_at_idx on public.runs (expires_at);

alter table public.runs enable row level security;

drop policy if exists "runs_select_own" on public.runs;
create policy "runs_select_own"
on public.runs for select
using (user_id = auth.uid());

drop policy if exists "runs_insert_own" on public.runs;
create policy "runs_insert_own"
on public.runs for insert
with check (user_id = auth.uid());

drop policy if exists "runs_update_own" on public.runs;
create policy "runs_update_own"
on public.runs for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "runs_delete_own" on public.runs;
create policy "runs_delete_own"
on public.runs for delete
using (user_id = auth.uid());

-- ===== daily_usage (token budget per day) =====
create table if not exists public.daily_usage (
  user_id uuid not null default auth.uid(),
  day date not null,
  token_total integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

create index if not exists daily_usage_user_day_idx on public.daily_usage (user_id, day desc);

alter table public.daily_usage enable row level security;

drop policy if exists "daily_usage_select_own" on public.daily_usage;
create policy "daily_usage_select_own"
on public.daily_usage for select
using (user_id = auth.uid());

drop policy if exists "daily_usage_insert_own" on public.daily_usage;
create policy "daily_usage_insert_own"
on public.daily_usage for insert
with check (user_id = auth.uid());

drop policy if exists "daily_usage_update_own" on public.daily_usage;
create policy "daily_usage_update_own"
on public.daily_usage for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "daily_usage_delete_own" on public.daily_usage;
create policy "daily_usage_delete_own"
on public.daily_usage for delete
using (user_id = auth.uid());

-- ===== collections (curated sets) =====
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists collections_user_created_idx on public.collections (user_id, created_at desc);
create unique index if not exists collections_user_name_unique on public.collections (user_id, lower(name));

alter table public.collections enable row level security;

drop policy if exists "collections_select_own" on public.collections;
create policy "collections_select_own"
on public.collections for select
using (user_id = auth.uid());

drop policy if exists "collections_insert_own" on public.collections;
create policy "collections_insert_own"
on public.collections for insert
with check (user_id = auth.uid());

drop policy if exists "collections_update_own" on public.collections;
create policy "collections_update_own"
on public.collections for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "collections_delete_own" on public.collections;
create policy "collections_delete_own"
on public.collections for delete
using (user_id = auth.uid());

-- ===== collection_items (locked payload for persistence) =====
create table if not exists public.collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  user_id uuid not null default auth.uid(),

  -- Optional pointer back to a history run (may expire after 30 days)
  run_id uuid null references public.runs(id) on delete set null,

  -- Locked payload so items can persist beyond history retention
  type public.run_type not null,
  source text not null default 'web',
  input_text text not null,
  output_text text null,
  output_json jsonb null,
  params jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists collection_items_collection_created_idx on public.collection_items (collection_id, created_at desc);
create index if not exists collection_items_user_created_idx on public.collection_items (user_id, created_at desc);

alter table public.collection_items enable row level security;

drop policy if exists "collection_items_select_own" on public.collection_items;
create policy "collection_items_select_own"
on public.collection_items for select
using (user_id = auth.uid());

drop policy if exists "collection_items_insert_own" on public.collection_items;
create policy "collection_items_insert_own"
on public.collection_items for insert
with check (user_id = auth.uid());

drop policy if exists "collection_items_update_own" on public.collection_items;
create policy "collection_items_update_own"
on public.collection_items for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "collection_items_delete_own" on public.collection_items;
create policy "collection_items_delete_own"
on public.collection_items for delete
using (user_id = auth.uid());

-- ===== optional retention helper (run manually or schedule) =====
-- Deletes expired history runs. Collection items remain (locked payload).
create or replace function public.delete_expired_runs()
returns void
language sql
security definer
as $$
  delete from public.runs where expires_at < now();
$$;

