-- Allow independent country assignment for football clubs (dictionary/import use-case).

alter table public.clubs
  add column if not exists country_pl text;

create index if not exists clubs_country_pl_idx on public.clubs(country_pl);
