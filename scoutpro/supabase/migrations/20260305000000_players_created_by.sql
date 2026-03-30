-- Add created_by to players for Rozliczenia (admin_usage_monthly_breakdown counts players per user).
-- Backfill: set created_by from the first observation (scout_id) for each player.

alter table public.players
  add column if not exists created_by uuid references public.users(id) on delete set null;

comment on column public.players.created_by is 'User who first registered the player; used for settlement stats.';

-- Backfill: first observation (by created_at) per player
update public.players p
set created_by = (
  select o.scout_id
  from public.observations o
  where o.player_id = p.id
  order by o.created_at asc
  limit 1
)
where p.created_by is null;

create index if not exists idx_players_created_by on public.players(created_by);
create index if not exists idx_players_created_at on public.players(created_at);
