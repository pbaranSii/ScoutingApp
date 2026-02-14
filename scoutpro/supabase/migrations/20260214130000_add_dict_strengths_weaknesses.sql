-- Mocne strony / Słabe strony - słowniki tagów do obserwacji zawodnika
create table if not exists public.dict_strengths (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_pl text not null,
  name_en text not null,
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dict_weaknesses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_pl text not null,
  name_en text not null,
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_dict_strengths_active on public.dict_strengths(is_active);
create index if not exists idx_dict_strengths_display_order on public.dict_strengths(display_order);
create index if not exists idx_dict_weaknesses_active on public.dict_weaknesses(is_active);
create index if not exists idx_dict_weaknesses_display_order on public.dict_weaknesses(display_order);

alter table public.dict_strengths enable row level security;
alter table public.dict_weaknesses enable row level security;

create policy "Dict strengths viewable by authenticated"
on public.dict_strengths for select to authenticated using (true);
create policy "Admin can manage dict strengths"
on public.dict_strengths for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Dict weaknesses viewable by authenticated"
on public.dict_weaknesses for select to authenticated using (true);
create policy "Admin can manage dict weaknesses"
on public.dict_weaknesses for all to authenticated
using (public.is_admin()) with check (public.is_admin());
