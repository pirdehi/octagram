-- Profiles table + RLS + trigger to create profile on signup
-- Apply in Supabase SQL editor or via Supabase CLI migrations.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  timezone text default 'UTC',
  locale text default 'en',
  bio text,
  website text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Trigger: create profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  name_from_meta text;
  email_prefix text;
begin
  name_from_meta := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name'
  );
  if name_from_meta is null or name_from_meta = '' then
    email_prefix := split_part(coalesce(new.email, 'user'), '@', 1);
    name_from_meta := email_prefix;
  end if;
  insert into public.profiles (id, display_name, updated_at)
  values (new.id, name_from_meta, now());
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: create profiles for existing auth.users that don't have one
insert into public.profiles (id, display_name, updated_at)
select u.id, coalesce(
  u.raw_user_meta_data->>'full_name',
  u.raw_user_meta_data->>'name',
  split_part(coalesce(u.email, 'user'), '@', 1)
), now()
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);
