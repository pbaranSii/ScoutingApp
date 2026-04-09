-- Senior import support: raw payload + batch id for rollback

begin;

alter table public.observations
  add column if not exists raw_payload jsonb,
  add column if not exists import_batch_id uuid;

create index if not exists idx_observations_import_batch_id
  on public.observations(import_batch_id);

alter table public.players
  add column if not exists import_batch_id uuid;

create index if not exists idx_players_import_batch_id
  on public.players(import_batch_id);

commit;

