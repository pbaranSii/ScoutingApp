-- Przypisania zawodników do slotów na boisku (ręczne ustawienie).
-- slot_assignments: { "slotKey": "player_id" }, np. "f_<formation_id>_0" lub "l_<formation>_0".

alter table public.favorite_lists
  add column if not exists slot_assignments jsonb not null default '{}';

comment on column public.favorite_lists.slot_assignments is 'Ręczne przypisania zawodników do slotów: slotKey -> player_id. slotKey: f_<formation_id>_<index> lub l_<formation>_<index>.';

create index if not exists idx_favorite_lists_slot_assignments on public.favorite_lists using gin (slot_assignments);
