create extension if not exists "pgcrypto";

do $$ begin
  create type public.user_role as enum ('admin', 'user');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.pipeline_status as enum ('observed', 'shortlist', 'trial', 'offer', 'signed', 'rejected');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.dominant_foot as enum ('left', 'right', 'both');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.observation_source as enum ('scouting', 'referral', 'application', 'trainer_report', 'scout_report');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.match_type as enum ('live', 'video');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.sync_status as enum ('pending', 'synced', 'failed');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.contact_type as enum ('parent', 'guardian', 'agent', 'other');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.regions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  min_birth_year integer,
  max_birth_year integer,
  created_at timestamptz not null default now()
);

create table if not exists public.leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  level integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.positions (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  category text,
  created_at timestamptz not null default now()
);

create table if not exists public.evaluation_criteria (
  id uuid primary key default gen_random_uuid(),
  position_id uuid not null references public.positions(id) on delete cascade,
  name text not null,
  weight numeric(3,2) not null default 1.0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  region_id uuid references public.regions(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text,
  role public.user_role not null default 'user',
  phone text,
  avatar_url text,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  birth_year integer not null,
  birth_date date,
  club_id uuid references public.clubs(id) on delete set null,
  region_id uuid references public.regions(id) on delete set null,
  primary_position text,
  secondary_positions text[],
  dominant_foot public.dominant_foot,
  height_cm integer,
  weight_kg numeric(4,1),
  nationality text,
  guardian_name text,
  guardian_phone text,
  guardian_email text,
  photo_urls text[],
  video_urls text[],
  pipeline_status public.pipeline_status not null default 'observed',
  decision_status text,
  decision_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  team_home text not null,
  team_away text not null,
  score_home integer,
  score_away integer,
  match_date date not null,
  location text,
  league_id uuid references public.leagues(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  type public.match_type not null default 'live',
  notes text,
  created_by uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.observations (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  match_id uuid references public.matches(id) on delete set null,
  scout_id uuid not null references public.users(id) on delete restrict,
  source public.observation_source not null default 'scouting',
  rank text,
  notes text,
  competition text,
  strengths text,
  weaknesses text,
  overall_rating integer,
  potential_now integer,
  potential_future integer,
  observation_date date not null default current_date,
  status text not null default 'active',
  photo_url text,
  created_by uuid references public.users(id) on delete set null,
  created_by_name text,
  created_by_role text,
  updated_by uuid references public.users(id) on delete set null,
  updated_by_name text,
  updated_by_role text,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  synced_at timestamptz,
  is_offline_created boolean not null default false
);

create table if not exists public.player_contacts (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  contact_type public.contact_type not null default 'parent',
  contact_name text,
  phone text,
  email text,
  is_primary boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.player_evaluations (
  id uuid primary key default gen_random_uuid(),
  observation_id uuid not null references public.observations(id) on delete cascade,
  criteria_id uuid not null references public.evaluation_criteria(id) on delete cascade,
  score integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.pipeline_history (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid not null references public.users(id) on delete restrict,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.offline_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  action_type text not null,
  payload jsonb not null,
  sync_status public.sync_status not null default 'pending',
  synced_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  invited_by uuid references public.users(id) on delete set null,
  token text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
