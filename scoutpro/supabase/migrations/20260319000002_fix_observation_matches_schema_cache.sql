-- Ensure observation_matches has formation columns on all envs
-- and refresh PostgREST schema cache (fixes PGRST204).

alter table if exists public.observation_matches
  add column if not exists home_team_formation text null;

alter table if exists public.observation_matches
  add column if not exists away_team_formation text null;

-- PostgREST listens on NOTIFY channel "pgrst" for cache reload.
do $$
begin
  perform pg_notify('pgrst', 'reload schema');
exception
  when others then
    -- ignore if not permitted/available
    null;
end $$;

