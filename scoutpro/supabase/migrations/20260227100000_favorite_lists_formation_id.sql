-- Ulubione: powiązanie z schematami taktycznymi z panelu admina.
-- Dodanie formation_id (FK do formations); formation (text) zostaje jako fallback.

alter table public.favorite_lists
  add column if not exists formation_id uuid references public.formations(id) on delete set null;

-- Usuń constraint check na formation, żeby móc przechowywać dowolny kod (np. z klonów).
alter table public.favorite_lists
  drop constraint if exists favorite_lists_formation_check;

create index if not exists idx_favorite_lists_formation_id on public.favorite_lists(formation_id);

-- Uzupełnij formation_id tam, gdzie formation (text) zgadza się z code w formations (schematy systemowe).
update public.favorite_lists fl
set formation_id = (
  select f.id from public.formations f
  where f.code = fl.formation and f.is_system = true
  limit 1
)
where fl.formation_id is null
  and fl.formation in ('4-4-2', '4-3-3', '3-5-2', '4-2-3-1', '5-3-2');

comment on column public.favorite_lists.formation_id is 'Schemat taktyczny z Ustawienia → Schematy taktyczne; null = używaj formation (text).';
