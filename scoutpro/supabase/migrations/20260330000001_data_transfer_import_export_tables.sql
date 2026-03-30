-- Admin data transfer: import/export runs, reports and mappings

create table if not exists public.export_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid references public.users(id) on delete set null,
  bundle_version text not null,
  source_instance text not null,
  stats jsonb not null default '{}'::jsonb
);

create table if not exists public.import_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid references public.users(id) on delete set null,
  bundle_version text not null,
  source_instance text not null,
  status text not null default 'preflight',
  stats jsonb not null default '{}'::jsonb
);

create index if not exists idx_import_runs_created_at on public.import_runs(created_at);

create table if not exists public.import_run_issues (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.import_runs(id) on delete cascade,
  severity text not null, -- info|warning|error
  code text not null,
  message text not null,
  path text,
  count int,
  examples jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_import_run_issues_run_id on public.import_run_issues(run_id);

-- Map source users to target users by email/uuid to preserve authorship.
create table if not exists public.import_user_map (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.import_runs(id) on delete cascade,
  source_user_id uuid,
  source_email text not null,
  target_user_id uuid references public.users(id) on delete set null,
  resolution_status text not null default 'unresolved', -- mapped|created|unresolved
  created_at timestamptz not null default now(),
  unique (run_id, source_email)
);

create index if not exists idx_import_user_map_run_id on public.import_user_map(run_id);

-- Map source entity ids to target entity ids for idempotency and re-runs.
create table if not exists public.import_entity_map (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.import_runs(id) on delete cascade,
  entity_type text not null, -- players|observations
  source_id uuid not null,
  target_id uuid,
  created_at timestamptz not null default now(),
  unique (run_id, entity_type, source_id)
);

create index if not exists idx_import_entity_map_run_id on public.import_entity_map(run_id);

alter table public.export_runs enable row level security;
alter table public.import_runs enable row level security;
alter table public.import_run_issues enable row level security;
alter table public.import_user_map enable row level security;
alter table public.import_entity_map enable row level security;

-- Admin-only access (read/write) for authenticated.
drop policy if exists "Admin can manage export runs" on public.export_runs;
create policy "Admin can manage export runs"
  on public.export_runs for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admin can manage import runs" on public.import_runs;
create policy "Admin can manage import runs"
  on public.import_runs for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admin can manage import run issues" on public.import_run_issues;
create policy "Admin can manage import run issues"
  on public.import_run_issues for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admin can manage import user map" on public.import_user_map;
create policy "Admin can manage import user map"
  on public.import_user_map for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admin can manage import entity map" on public.import_entity_map;
create policy "Admin can manage import entity map"
  on public.import_entity_map for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

