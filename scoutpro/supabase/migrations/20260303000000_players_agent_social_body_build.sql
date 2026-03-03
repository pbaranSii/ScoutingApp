-- Agent contact fields and social links on players
alter table public.players
  add column if not exists agent_name text,
  add column if not exists agent_phone text,
  add column if not exists agent_email text,
  add column if not exists transfermarkt_url text,
  add column if not exists facebook_url text,
  add column if not exists instagram_url text,
  add column if not exists other_social_url text;

comment on column public.players.agent_name is 'Agent contact: name';
comment on column public.players.agent_phone is 'Agent contact: phone';
comment on column public.players.agent_email is 'Agent contact: email';
comment on column public.players.transfermarkt_url is 'TransferMarkt profile URL';
comment on column public.players.facebook_url is 'Facebook profile URL';
comment on column public.players.instagram_url is 'Instagram profile URL';
comment on column public.players.other_social_url is 'Other social/media URL';

-- Dictionary: body build (budowa ciała)
create table if not exists public.dict_body_build (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_pl text not null,
  name_en text,
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_dict_body_build_active on public.dict_body_build(is_active);
create index if not exists idx_dict_body_build_display_order on public.dict_body_build(display_order);

alter table public.dict_body_build enable row level security;

create policy "Dict body build viewable by authenticated"
  on public.dict_body_build for select to authenticated using (true);
create policy "Admin can manage dict body build"
  on public.dict_body_build for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Seed body build values
insert into public.dict_body_build (code, name_pl, name_en, display_order, is_active)
values
  ('atletyczna', 'Atletyczna', 'Athletic', 1, true),
  ('szczupla', 'Szczupła', 'Slim', 2, true),
  ('masywna', 'Masywna', 'Stocky', 3, true),
  ('srednia', 'Średnia', 'Average', 4, true)
on conflict (code) do nothing;
