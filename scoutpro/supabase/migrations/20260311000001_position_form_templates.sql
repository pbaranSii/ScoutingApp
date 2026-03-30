-- Wzory formularzy opisu pozycji (Zadanie 2). Użytkownik definiuje zestaw kryteriów + kolejność + wymagalność.

-- 1) Tabela wzorów
create table if not exists public.position_form_template (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.position_form_template is 'Wzór formularza opisu pozycji (sekcja 4b Senior). Zestaw kryteriów w position_form_template_item.';

-- 2) Pozycje wzoru: odniesienie do evaluation_criteria + wymagalność + kolejność
create table if not exists public.position_form_template_item (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.position_form_template(id) on delete cascade,
  evaluation_criterion_id uuid not null references public.evaluation_criteria(id) on delete cascade,
  is_required boolean not null default false,
  sort_order int not null default 0,
  constraint position_form_template_item_template_criterion_unique unique (template_id, evaluation_criterion_id)
);

create index if not exists idx_position_form_template_item_template_id on public.position_form_template_item(template_id);

comment on table public.position_form_template_item is 'Element wzoru: jedno kryterium z evaluation_criteria, kolejność i czy wymagane w formularzu.';

-- 3) Przypisanie wzoru do pozycji w słowniku
alter table public.position_dictionary
  add column if not exists form_template_id uuid references public.position_form_template(id) on delete set null;

comment on column public.position_dictionary.form_template_id is 'Jeśli ustawiony, sekcja 4b (Senior) używa kryteriów z tego wzoru zamiast criteria_template_position_id.';

create index if not exists idx_position_dictionary_form_template_id on public.position_dictionary(form_template_id);

-- 4) RLS
alter table public.position_form_template enable row level security;
alter table public.position_form_template_item enable row level security;

drop policy if exists "Form templates viewable by authenticated" on public.position_form_template;
create policy "Form templates viewable by authenticated"
  on public.position_form_template for select to authenticated using (true);
drop policy if exists "Admin can manage form templates" on public.position_form_template;
create policy "Admin can manage form templates"
  on public.position_form_template for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Form template items viewable by authenticated" on public.position_form_template_item;
create policy "Form template items viewable by authenticated"
  on public.position_form_template_item for select to authenticated using (true);
drop policy if exists "Admin can manage form template items" on public.position_form_template_item;
create policy "Admin can manage form template items"
  on public.position_form_template_item for all to authenticated using (public.is_admin()) with check (public.is_admin());
