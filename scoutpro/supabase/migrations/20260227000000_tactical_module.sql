-- Moduł ustawień taktycznych: słownik pozycji, schematy, sloty, przypisanie zawodników.
-- Zgodnie z Materials/Analiza_Modul_Taktyczny_Ustawienia.

-- 1) Słownik pozycji (position_dictionary)
create table if not exists public.position_dictionary (
  id uuid primary key default gen_random_uuid(),
  position_number smallint not null,
  position_code text not null,
  position_name_pl text not null,
  description text,
  is_active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint position_dictionary_number_code_unique unique (position_number, position_code),
  constraint position_dictionary_number_range check (position_number >= 0 and position_number <= 11)
);

create index if not exists idx_position_dictionary_is_active on public.position_dictionary(is_active);
create index if not exists idx_position_dictionary_display_order on public.position_dictionary(display_order);

comment on table public.position_dictionary is 'Słownik pozycji zawodników (1–11 + WB/SW/SS). Używany przez moduł taktyczny.';

-- 2) Schematy taktyczne (formations)
create table if not exists public.formations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null,
  description text,
  is_default boolean not null default false,
  is_system boolean not null default false,
  created_by uuid references public.users(id) on delete set null,
  version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_formations_single_default
  on public.formations ((1)) where (is_default = true);

comment on table public.formations is 'Schematy taktyczne (np. 4-3-3). is_system = szablony tylko do odczytu.';

-- 3) Sloty taktyczne (tactical_slots)
create table if not exists public.tactical_slots (
  id uuid primary key default gen_random_uuid(),
  formation_id uuid not null references public.formations(id) on delete cascade,
  position_id uuid not null references public.position_dictionary(id) on delete restrict,
  slot_label text,
  x smallint not null,
  y smallint not null,
  side text not null default 'C' check (side in ('L','C','R')),
  depth text not null default 'MID' check (depth in ('GK','DEF','MID','ATT')),
  is_required boolean not null default true,
  role_hint text,
  display_order int not null default 0,
  constraint tactical_slots_xy_range check (x >= 0 and x <= 100 and y >= 0 and y <= 100)
);

create index if not exists idx_tactical_slots_formation_id on public.tactical_slots(formation_id);
create index if not exists idx_tactical_slots_position_id on public.tactical_slots(position_id);

comment on table public.tactical_slots is 'Sloty w schemacie taktycznym (11 na schemat).';

-- 4) Przypisanie pozycji do zawodnika (many-to-many)
create table if not exists public.player_position_mapping (
  player_id uuid not null references public.players(id) on delete cascade,
  position_id uuid not null references public.position_dictionary(id) on delete cascade,
  is_primary boolean not null default false,
  primary key (player_id, position_id)
);

create index if not exists idx_player_position_mapping_position_id on public.player_position_mapping(position_id);

comment on table public.player_position_mapping is 'Pozycje zawodnika ze słownika taktycznego (is_primary = preferowana).';

-- 5) RLS
alter table public.position_dictionary enable row level security;
alter table public.formations enable row level security;
alter table public.tactical_slots enable row level security;
alter table public.player_position_mapping enable row level security;

-- position_dictionary: wszyscy authenticated czytają; tylko admin modyfikuje
drop policy if exists "Position dictionary viewable by authenticated" on public.position_dictionary;
create policy "Position dictionary viewable by authenticated"
on public.position_dictionary for select to authenticated using (true);
drop policy if exists "Admin can manage position dictionary" on public.position_dictionary;
create policy "Admin can manage position dictionary"
on public.position_dictionary for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- formations: wszyscy authenticated czytają; tylko admin modyfikuje (schematy systemowe blokowane w app)
drop policy if exists "Formations viewable by authenticated" on public.formations;
create policy "Formations viewable by authenticated"
on public.formations for select to authenticated using (true);
drop policy if exists "Admin can manage formations" on public.formations;
create policy "Admin can manage formations"
on public.formations for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- tactical_slots: jak formations
drop policy if exists "Tactical slots viewable by authenticated" on public.tactical_slots;
create policy "Tactical slots viewable by authenticated"
on public.tactical_slots for select to authenticated using (true);
drop policy if exists "Admin can manage tactical slots" on public.tactical_slots;
create policy "Admin can manage tactical slots"
on public.tactical_slots for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- player_position_mapping: odczyt dla authenticated; zapis admin (lub później rozszerzyć)
drop policy if exists "Player position mapping viewable by authenticated" on public.player_position_mapping;
create policy "Player position mapping viewable by authenticated"
on public.player_position_mapping for select to authenticated using (true);
drop policy if exists "Admin can manage player position mapping" on public.player_position_mapping;
create policy "Admin can manage player position mapping"
on public.player_position_mapping for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 6) RPC: ustawienie schematu domyślnego (BR-05)
create or replace function public.formation_set_default(p_formation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  update public.formations set is_default = false where is_default = true;
  update public.formations set is_default = true, updated_at = now() where id = p_formation_id;
end;
$$;

-- 7) Seed: słownik pozycji (analiza sekcja 2)
insert into public.position_dictionary (position_number, position_code, position_name_pl, description, display_order)
values
  (1, 'GK', 'Bramkarz', 'Jedyna pozycja obligatoryjna w każdym schemacie; obrona bramki', 1),
  (2, 'RB', 'Prawy obrońca', 'Defensywa prawa strona; może wspierać atak skrzydłem', 2),
  (3, 'LB', 'Lewy obrońca', 'Defensywa lewa strona; może wspierać atak skrzydłem', 3),
  (4, 'CB', 'Środkowy obrońca (lewy)', 'Stoper; domyślnie lewa strona osi defensywy', 4),
  (5, 'CB', 'Środkowy obrońca (prawy)', 'Stoper; domyślnie prawa strona osi defensywy', 5),
  (6, 'DM', 'Defensywny środkowy pomocnik', 'Tarcza przed defensywą; „jedynka" lub „szóstka"', 6),
  (7, 'RW', 'Prawy skrzydłowy', 'Atak prawa strona; może grać jako inverted winger', 7),
  (8, 'CM', 'Środkowy pomocnik', 'Box-to-box; balans defensywno-ofensywny', 8),
  (9, 'ST', 'Napastnik', 'Czysty napastnik; gra tyłem lub w głąb', 9),
  (10, 'AM', 'Ofensywny środkowy pomocnik', 'Trequartista / dziesiątka; kreatywność w ataku', 10),
  (11, 'LW', 'Lewy skrzydłowy', 'Atak lewa strona; może grać jako inverted winger', 11),
  (0, 'WB', 'Wahadłowy (wing-back)', 'Schematy 3-5-2, 5-3-2', 12),
  (0, 'SW', 'Libero/Sweeper', 'Historyczne schematy back-3', 13),
  (0, 'SS', 'Drugi napastnik (shadow striker)', 'Warianty 4-4-1-1, 4-3-2-1', 14)
on conflict (position_number, position_code) do nothing;
