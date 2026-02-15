-- Dictionary tables for Settings: preferred foot, player sources, recruitment decisions.
-- Positions, regions (wojewodztwa), clubs, categories remain existing tables and are shown in Settings.

-- 1. dict_preferred_foot (aligned with dominant_foot enum: left, right, both)
create table if not exists public.dict_preferred_foot (
  id uuid primary key default gen_random_uuid(),
  foot_code text not null unique,
  name_pl text not null,
  name_en text not null,
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_dict_preferred_foot_active on public.dict_preferred_foot(is_active);
create index if not exists idx_dict_preferred_foot_display_order on public.dict_preferred_foot(display_order);

-- 2. dict_player_sources (sources of player acquisition)
create table if not exists public.dict_player_sources (
  id uuid primary key default gen_random_uuid(),
  source_code text not null unique,
  name_pl text not null,
  name_en text not null,
  description text,
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_dict_player_sources_active on public.dict_player_sources(is_active);
create index if not exists idx_dict_player_sources_display_order on public.dict_player_sources(display_order);

-- 3. dict_recruitment_decisions (maps to pipeline_status conceptually)
create table if not exists public.dict_recruitment_decisions (
  id uuid primary key default gen_random_uuid(),
  decision_code text not null unique,
  name_pl text not null,
  name_en text not null,
  decision_category text,
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_dict_recruitment_decisions_active on public.dict_recruitment_decisions(is_active);
create index if not exists idx_dict_recruitment_decisions_display_order on public.dict_recruitment_decisions(display_order);

-- RLS
alter table public.dict_preferred_foot enable row level security;
alter table public.dict_player_sources enable row level security;
alter table public.dict_recruitment_decisions enable row level security;

create policy "Dict preferred foot viewable by authenticated"
on public.dict_preferred_foot for select to authenticated using (true);
create policy "Admin can manage dict preferred foot"
on public.dict_preferred_foot for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Dict player sources viewable by authenticated"
on public.dict_player_sources for select to authenticated using (true);
create policy "Admin can manage dict player sources"
on public.dict_player_sources for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Dict recruitment decisions viewable by authenticated"
on public.dict_recruitment_decisions for select to authenticated using (true);
create policy "Admin can manage dict recruitment decisions"
on public.dict_recruitment_decisions for all to authenticated
using (public.is_admin()) with check (public.is_admin());
