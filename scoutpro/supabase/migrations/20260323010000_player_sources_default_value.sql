-- Add default marker for player sources dictionary
alter table if exists public.dict_player_sources
  add column if not exists is_default boolean not null default false;

-- Ensure only one default source at a time
create unique index if not exists dict_player_sources_one_default_idx
  on public.dict_player_sources ((is_default))
  where is_default = true;

-- Set "Mecz na żywo" as default source
update public.dict_player_sources
set is_default = false
where is_default = true;

update public.dict_player_sources
set is_default = true
where source_code = 'live_match';
