-- Add theme preference to profiles (light | dark). Default light.
alter table public.profiles
  add column if not exists theme text not null default 'light';

comment on column public.profiles.theme is 'User UI theme: light or dark';
