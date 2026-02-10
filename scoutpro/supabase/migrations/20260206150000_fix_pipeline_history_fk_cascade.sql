-- Ensure pipeline history rows cascade on player deletion.
alter table if exists public.pipeline_history
  drop constraint if exists pipeline_history_player_id_fkey;

alter table if exists public.pipeline_history
  add constraint pipeline_history_player_id_fkey
  foreign key (player_id)
  references public.players(id)
  on delete cascade;
