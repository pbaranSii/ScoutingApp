-- Categories: is_active for deactivate/delete in UI; age_under for current-season rocznik (e.g. U10 = currentYear - 10).

-- 1) is_active for soft delete / deactivate
alter table public.categories
  add column if not exists is_active boolean not null default true;

comment on column public.categories.is_active is 'When false, category is hidden from observation forms and filters.';

-- 2) age_under: e.g. 10 for U10; reference_birth_year = current_year - age_under (computed in app)
alter table public.categories
  add column if not exists age_under smallint;

comment on column public.categories.age_under is 'Age limit for category (e.g. 10 for U10). Reference birth year = current year - age_under. Null = use min_birth_year/max_birth_year.';
