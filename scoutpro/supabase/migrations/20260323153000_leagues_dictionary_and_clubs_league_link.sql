-- Extend leagues dictionary structure and allow optional league assignment to clubs.

alter table public.leagues
  add column if not exists code text,
  add column if not exists country_pl text,
  add column if not exists country_iso text,
  add column if not exists country_en text,
  add column if not exists official_name text,
  add column if not exists name_pl text,
  add column if not exists display_name text,
  add column if not exists group_name text,
  add column if not exists is_observed boolean not null default false,
  add column if not exists area text not null default 'ALL',
  add column if not exists notes text;

create unique index if not exists leagues_code_unique_idx
  on public.leagues (code)
  where code is not null and btrim(code) <> '';

alter table public.clubs
  add column if not exists league_id uuid references public.leagues(id) on delete set null;

create index if not exists clubs_league_id_idx on public.clubs(league_id);

