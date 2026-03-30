-- Area split: AKADEMIA / SENIOR
-- Adds area metadata to categories/users/players and enforces area visibility in RLS.

do $$ begin
  create type public.area_type as enum ('AKADEMIA', 'SENIOR');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.area_access_type as enum ('AKADEMIA', 'SENIOR', 'ALL');
exception
  when duplicate_object then null;
end $$;

alter table public.categories
  add column if not exists area public.area_type;

-- Backfill categories area
update public.categories
set area = case
  when lower(name) like 'senior%' then 'SENIOR'::public.area_type
  else 'AKADEMIA'::public.area_type
end
where area is null;

alter table public.categories
  alter column area set not null;

alter table public.users
  add column if not exists area_access public.area_access_type not null default 'AKADEMIA';

-- Backfill users area_access
update public.users
set area_access = case
  when role = 'admin' then 'ALL'::public.area_access_type
  else 'AKADEMIA'::public.area_access_type
end
where area_access is null;

alter table public.players
  add column if not exists age_category_id uuid references public.categories(id) on delete set null;

create index if not exists idx_players_age_category_id on public.players(age_category_id);
create index if not exists idx_categories_area on public.categories(area);
create index if not exists idx_users_area_access on public.users(area_access);

-- Best effort backfill for players.age_category_id using age_under or min/max birth year.
update public.players p
set age_category_id = (
  select cat.id
  from public.categories cat
  where cat.is_active = true
    and cat.area is not null
    and (
      (cat.age_under is not null and p.birth_year = extract(year from now())::int - cat.age_under)
      or (
        cat.min_birth_year is not null
        and cat.max_birth_year is not null
        and p.birth_year between cat.min_birth_year and cat.max_birth_year
      )
    )
  order by
    case when cat.age_under is not null then 0 else 1 end,
    cat.max_birth_year desc nulls last,
    cat.min_birth_year desc nulls last
  limit 1
)
where p.age_category_id is null;

create or replace function public.current_area_access()
returns public.area_access_type
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select u.area_access from public.users u where u.id = auth.uid()),
    'AKADEMIA'::public.area_access_type
  );
$$;

-- Ensure only admin can assign ALL in users table.
drop policy if exists "Users area_access admin guard" on public.users;
create policy "Users area_access admin guard"
on public.users
as restrictive
for update
to authenticated
using (true)
with check (
  area_access <> 'ALL'::public.area_access_type
  or public.is_admin()
);

-- Restrictive area gate for players SELECT
drop policy if exists "Players area gate select" on public.players;
create policy "Players area gate select"
on public.players
as restrictive
for select
to authenticated
using (
  public.is_admin()
  or public.current_area_access() = 'ALL'::public.area_access_type
  or exists (
    select 1
    from public.categories c
    where c.id = players.age_category_id
      and c.area::text = public.current_area_access()::text
  )
);

-- Restrictive area gate for players INSERT
drop policy if exists "Players area gate insert" on public.players;
create policy "Players area gate insert"
on public.players
as restrictive
for insert
to authenticated
with check (
  public.is_admin()
  or public.current_area_access() = 'ALL'::public.area_access_type
  or exists (
    select 1
    from public.categories c
    where c.id = players.age_category_id
      and c.area::text = public.current_area_access()::text
  )
);

-- Restrictive area gate for players UPDATE
drop policy if exists "Players area gate update" on public.players;
create policy "Players area gate update"
on public.players
as restrictive
for update
to authenticated
using (
  public.is_admin()
  or public.current_area_access() = 'ALL'::public.area_access_type
  or exists (
    select 1
    from public.categories c
    where c.id = players.age_category_id
      and c.area::text = public.current_area_access()::text
  )
)
with check (
  public.is_admin()
  or public.current_area_access() = 'ALL'::public.area_access_type
  or exists (
    select 1
    from public.categories c
    where c.id = players.age_category_id
      and c.area::text = public.current_area_access()::text
  )
);

-- Restrictive area gate for observations SELECT
drop policy if exists "Observations area gate select" on public.observations;
create policy "Observations area gate select"
on public.observations
as restrictive
for select
to authenticated
using (
  public.is_admin()
  or public.current_area_access() = 'ALL'::public.area_access_type
  or exists (
    select 1
    from public.players p
    join public.categories c on c.id = p.age_category_id
    where p.id = observations.player_id
      and c.area::text = public.current_area_access()::text
  )
);

-- Restrictive area gate for observations INSERT
drop policy if exists "Observations area gate insert" on public.observations;
create policy "Observations area gate insert"
on public.observations
as restrictive
for insert
to authenticated
with check (
  public.is_admin()
  or public.current_area_access() = 'ALL'::public.area_access_type
  or exists (
    select 1
    from public.players p
    join public.categories c on c.id = p.age_category_id
    where p.id = observations.player_id
      and c.area::text = public.current_area_access()::text
  )
);

-- Restrictive area gate for observations UPDATE
drop policy if exists "Observations area gate update" on public.observations;
create policy "Observations area gate update"
on public.observations
as restrictive
for update
to authenticated
using (
  public.is_admin()
  or public.current_area_access() = 'ALL'::public.area_access_type
  or exists (
    select 1
    from public.players p
    join public.categories c on c.id = p.age_category_id
    where p.id = observations.player_id
      and c.area::text = public.current_area_access()::text
  )
)
with check (
  public.is_admin()
  or public.current_area_access() = 'ALL'::public.area_access_type
  or exists (
    select 1
    from public.players p
    join public.categories c on c.id = p.age_category_id
    where p.id = observations.player_id
      and c.area::text = public.current_area_access()::text
  )
);
