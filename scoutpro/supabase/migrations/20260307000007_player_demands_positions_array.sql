-- Multi-position support for player_demands: add positions text[] and backfill from position.
alter table public.player_demands
  add column if not exists positions text[] not null default '{}';

update public.player_demands
set positions = array[position]
where position is not null and position <> '' and (positions is null or positions = '{}');

-- Keep position column for backward compatibility (first position); optionally sync via trigger or app.
comment on column public.player_demands.positions is 'List of position codes (e.g. LW, ST). Replaces single position for multi-select.';
        