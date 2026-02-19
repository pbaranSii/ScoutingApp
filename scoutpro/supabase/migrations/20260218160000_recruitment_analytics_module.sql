-- Recruitment Analytics & Pipeline Metrics (Module 1 only)
-- Scope: pipeline analytics, admin settings, and supporting columns.
-- Excludes: system usage metrics, user satisfaction, sessions/activity logs.

-- 1) Extend pipeline_history to support richer analytics.
alter table if exists public.pipeline_history
  add column if not exists observation_id uuid references public.observations(id) on delete set null,
  add column if not exists days_in_previous_status integer,
  add column if not exists notes text;

create index if not exists pipeline_history_player_id_created_at_idx
  on public.pipeline_history (player_id, created_at desc);

create index if not exists pipeline_history_created_at_idx
  on public.pipeline_history (created_at desc);

-- 2) Observations: first contact date (defaults to created_at semantics).
alter table if exists public.observations
  add column if not exists first_contact_date timestamptz;

update public.observations
   set first_contact_date = created_at
 where first_contact_date is null;

alter table public.observations
  alter column first_contact_date set not null,
  alter column first_contact_date set default now();

create index if not exists observations_first_contact_date_idx
  on public.observations (first_contact_date desc);

-- 3) Players: pipeline analytics helper columns.
alter table if exists public.players
  add column if not exists entered_pipeline_at timestamptz,
  add column if not exists last_status_change timestamptz,
  add column if not exists days_in_current_status integer;

-- Backfill entered_pipeline_at using earliest observation for a player (first contact).
with first_obs as (
  select o.player_id, min(o.first_contact_date) as entered_at
    from public.observations o
   group by o.player_id
)
update public.players p
   set entered_pipeline_at = coalesce(p.entered_pipeline_at, f.entered_at, p.created_at)
  from first_obs f
 where p.id = f.player_id;

-- If a player has no observations yet, default entered_pipeline_at to created_at.
update public.players p
   set entered_pipeline_at = coalesce(p.entered_pipeline_at, p.created_at)
 where p.entered_pipeline_at is null;

-- Backfill last_status_change from latest pipeline_history entry, else entered_pipeline_at.
with last_change as (
  select h.player_id, max(h.created_at) as last_changed_at
    from public.pipeline_history h
   group by h.player_id
)
update public.players p
   set last_status_change = coalesce(p.last_status_change, lc.last_changed_at, p.entered_pipeline_at)
  from last_change lc
 where p.id = lc.player_id;

update public.players p
   set last_status_change = coalesce(p.last_status_change, p.entered_pipeline_at, p.updated_at, p.created_at)
 where p.last_status_change is null;

-- Backfill days_in_current_status (approx, can be re-computed by job later).
update public.players p
   set days_in_current_status = greatest(0, floor(extract(epoch from (now() - p.last_status_change)) / 86400))::int
 where p.days_in_current_status is null;

create index if not exists players_pipeline_status_idx
  on public.players (pipeline_status);

create index if not exists players_last_status_change_idx
  on public.players (last_status_change desc);

create index if not exists players_entered_pipeline_at_idx
  on public.players (entered_pipeline_at desc);

-- 4) Admin settings for analytics.
create table if not exists public.analytics_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key varchar not null unique,
  setting_value text,
  updated_by uuid references public.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.analytics_settings enable row level security;

drop policy if exists "Analytics settings are viewable by authenticated users" on public.analytics_settings;
create policy "Analytics settings are viewable by authenticated users"
on public.analytics_settings
for select
to authenticated
using (true);

drop policy if exists "Only admins can manage analytics settings" on public.analytics_settings;
create policy "Only admins can manage analytics settings"
on public.analytics_settings
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Helpful index for key-based lookups.
create index if not exists analytics_settings_key_idx
  on public.analytics_settings (setting_key);

