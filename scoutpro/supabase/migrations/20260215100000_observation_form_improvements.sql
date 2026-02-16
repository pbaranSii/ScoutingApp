-- Faza 1: Rozszerzenie observations, słownik team_roles, rozszerzenie observation_source

-- 1.1 Nowe kolumny w observations
alter table public.observations
  add column if not exists match_result varchar(10),
  add column if not exists location varchar(200),
  add column if not exists recommendations text,
  add column if not exists team_role varchar(50),
  add column if not exists technical_rating smallint check (technical_rating >= 1 and technical_rating <= 5),
  add column if not exists speed_rating smallint check (speed_rating >= 1 and speed_rating <= 5),
  add column if not exists motor_rating smallint check (motor_rating >= 1 and motor_rating <= 5),
  add column if not exists tactical_rating smallint check (tactical_rating >= 1 and tactical_rating <= 5),
  add column if not exists mental_rating smallint check (mental_rating >= 1 and mental_rating <= 5);

comment on column public.observations.match_result is 'Format X-Y, e.g. 2-1';
comment on column public.observations.team_role is 'Code from dict_team_roles';

-- 1.2 Tabela dict_team_roles (Rola w drużynie)
create table if not exists public.dict_team_roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_pl text not null,
  name_en text not null,
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_dict_team_roles_active on public.dict_team_roles(is_active);
create index if not exists idx_dict_team_roles_display_order on public.dict_team_roles(display_order);

alter table public.dict_team_roles enable row level security;
create policy "Dict team roles viewable by authenticated"
  on public.dict_team_roles for select to authenticated using (true);
create policy "Admin can manage dict team roles"
  on public.dict_team_roles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Seed dict_team_roles
insert into public.dict_team_roles (code, name_pl, name_en, display_order, is_active)
values
  ('main', 'Główny zawodnik', 'First team player', 1, true),
  ('reserve', 'Rezerwowy', 'Reserve', 2, true),
  ('squad', 'Kadra', 'Squad', 3, true),
  ('youth', 'Młodzieżowiec', 'Youth', 4, true),
  ('trial', 'Testowany', 'On trial', 5, true),
  ('new', 'Nowy w drużynie', 'New in team', 6, true)
on conflict (code) do update set
  name_pl = excluded.name_pl,
  name_en = excluded.name_en,
  display_order = excluded.display_order,
  is_active = true,
  updated_at = now();

-- 1.3 Rozszerzenie enum observation_source (Analiza video, Turniej, Obóz treningowy)
alter type public.observation_source add value if not exists 'video_analysis';
alter type public.observation_source add value if not exists 'tournament';
alter type public.observation_source add value if not exists 'training_camp';

-- 1.4 Seed nowych źródeł w dict_player_sources
insert into public.dict_player_sources (source_code, name_pl, name_en, display_order, is_active)
values
  ('video_analysis', 'Analiza video', 'Video analysis', 6, true),
  ('tournament', 'Turniej', 'Tournament', 7, true),
  ('training_camp', 'Obóz treningowy', 'Training camp', 8, true)
on conflict (source_code) do update set
  name_pl = excluded.name_pl,
  name_en = excluded.name_en,
  display_order = excluded.display_order,
  is_active = true;
