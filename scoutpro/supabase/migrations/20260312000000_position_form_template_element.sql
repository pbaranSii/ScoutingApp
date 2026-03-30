-- Replace position_form_template_item with unified position_form_template_element (header | criterion).

-- 1) Create elements table
create table if not exists public.position_form_template_element (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.position_form_template(id) on delete cascade,
  element_type text not null check (element_type in ('header', 'criterion')),
  sort_order int not null default 0,
  header_label text,
  evaluation_criterion_id uuid references public.evaluation_criteria(id) on delete cascade,
  is_required boolean,
  constraint position_form_template_element_type_check check (
    (element_type = 'header' and evaluation_criterion_id is null and is_required is null)
    or (element_type = 'criterion' and header_label is null and evaluation_criterion_id is not null and is_required is not null)
  )
);

create index if not exists idx_position_form_template_element_template_id on public.position_form_template_element(template_id);
comment on table public.position_form_template_element is 'Element wzoru: nagłówek (tekst) lub kryterium (odniesienie do evaluation_criteria). Kolejność = sort_order.';

-- 2) Migrate data from position_form_template_item
insert into public.position_form_template_element (template_id, element_type, sort_order, evaluation_criterion_id, is_required)
select template_id, 'criterion', sort_order, evaluation_criterion_id, is_required
from public.position_form_template_item
order by template_id, sort_order;

-- 3) Drop old table and its RLS
drop policy if exists "Form template items viewable by authenticated" on public.position_form_template_item;
drop policy if exists "Admin can manage form template items" on public.position_form_template_item;
drop table if exists public.position_form_template_item;

-- 4) RLS for elements
alter table public.position_form_template_element enable row level security;
drop policy if exists "Form template elements viewable by authenticated" on public.position_form_template_element;
create policy "Form template elements viewable by authenticated"
  on public.position_form_template_element for select to authenticated using (true);
drop policy if exists "Admin can manage form template elements" on public.position_form_template_element;
create policy "Admin can manage form template elements"
  on public.position_form_template_element for all to authenticated using (public.is_admin()) with check (public.is_admin());
