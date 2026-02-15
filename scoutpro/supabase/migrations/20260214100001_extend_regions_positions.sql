-- Extend regions (wojewodztwa) with display_order and code for dictionary management.
-- Extend positions with display_order for consistent ordering in Settings.

alter table public.regions
  add column if not exists display_order int not null default 0,
  add column if not exists code text;

create index if not exists idx_regions_display_order on public.regions(display_order);

alter table public.positions
  add column if not exists display_order int not null default 0;

create index if not exists idx_positions_display_order on public.positions(display_order);
