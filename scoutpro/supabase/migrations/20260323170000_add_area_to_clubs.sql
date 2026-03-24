-- Add area access marker to clubs dictionary and backfill existing rows.

alter table public.clubs
  add column if not exists area text not null default 'AKADEMIA';

update public.clubs
set area = 'AKADEMIA'
where area is null or btrim(area) = '';

create index if not exists clubs_area_idx on public.clubs(area);

