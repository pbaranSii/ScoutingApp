-- Favorite lists (Listy ulubionych): lists, members, collaborators.
-- Optional: users.region_id for regional sharing.

-- 1. Optional: add region_id to users for "udostępnienie regionalne"
alter table if exists public.users
  add column if not exists region_id uuid references public.regions(id) on delete set null;
create index if not exists idx_users_region_id on public.users(region_id);

-- 2. Tables
create table if not exists public.favorite_lists (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) <= 100),
  description text check (description is null or char_length(description) <= 500),
  owner_id uuid not null references public.users(id) on delete cascade,
  formation text not null default '4-4-2' check (formation in ('4-4-2', '4-3-3', '3-5-2', '4-2-3-1', '5-3-2')),
  region_id uuid references public.regions(id) on delete set null,
  last_used_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.favorite_list_members (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.favorite_lists(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  added_by uuid not null references public.users(id) on delete restrict,
  added_at timestamptz not null default now(),
  unique(list_id, player_id)
);

create table if not exists public.favorite_list_collaborators (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.favorite_lists(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  added_at timestamptz not null default now(),
  unique(list_id, user_id)
);

-- 3. Indexes
create index if not exists idx_favorite_lists_owner_id on public.favorite_lists(owner_id);
create index if not exists idx_favorite_lists_last_used_at on public.favorite_lists(last_used_at desc);
create index if not exists idx_favorite_lists_region_id on public.favorite_lists(region_id);
create index if not exists idx_favorite_list_members_list_id on public.favorite_list_members(list_id);
create index if not exists idx_favorite_list_members_player_id on public.favorite_list_members(player_id);
create index if not exists idx_favorite_list_collaborators_list_id on public.favorite_list_collaborators(list_id);
create index if not exists idx_favorite_list_collaborators_user_id on public.favorite_list_collaborators(user_id);

-- 4. RLS
alter table public.favorite_lists enable row level security;
alter table public.favorite_list_members enable row level security;
alter table public.favorite_list_collaborators enable row level security;

-- Helper: user can view list (owner, collaborator, or region match)
create or replace function public.favorite_list_can_view(list_row public.favorite_lists)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    list_row.owner_id = auth.uid()
    or exists (
      select 1 from public.favorite_list_collaborators c
      where c.list_id = list_row.id and c.user_id = auth.uid()
    )
    or (
      list_row.region_id is not null
      and exists (
        select 1 from public.users u
        where u.id = auth.uid() and u.region_id = list_row.region_id
      )
    )
    or public.is_admin();
$$;

-- Helper: user can edit list (owner or collaborator; admin cannot edit others' lists per spec)
create or replace function public.favorite_list_can_edit(list_row public.favorite_lists)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    list_row.owner_id = auth.uid()
    or exists (
      select 1 from public.favorite_list_collaborators c
      where c.list_id = list_row.id and c.user_id = auth.uid()
    );
$$;

-- favorite_lists policies
drop policy if exists "Favorite lists select" on public.favorite_lists;
create policy "Favorite lists select"
  on public.favorite_lists for select to authenticated
  using (public.favorite_list_can_view(favorite_lists));

drop policy if exists "Favorite lists insert" on public.favorite_lists;
create policy "Favorite lists insert"
  on public.favorite_lists for insert to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "Favorite lists update" on public.favorite_lists;
create policy "Favorite lists update"
  on public.favorite_lists for update to authenticated
  using (public.favorite_list_can_edit(favorite_lists))
  with check (public.favorite_list_can_edit(favorite_lists));

drop policy if exists "Favorite lists delete" on public.favorite_lists;
create policy "Favorite lists delete"
  on public.favorite_lists for delete to authenticated
  using (owner_id = auth.uid());

-- favorite_list_members: full access if user can edit the list
drop policy if exists "Favorite list members select" on public.favorite_list_members;
create policy "Favorite list members select"
  on public.favorite_list_members for select to authenticated
  using (
    exists (
      select 1 from public.favorite_lists fl
      where fl.id = favorite_list_members.list_id and public.favorite_list_can_view(fl)
    )
  );

drop policy if exists "Favorite list members insert" on public.favorite_list_members;
create policy "Favorite list members insert"
  on public.favorite_list_members for insert to authenticated
  with check (
    added_by = auth.uid()
    and exists (
      select 1 from public.favorite_lists fl
      where fl.id = favorite_list_members.list_id and public.favorite_list_can_edit(fl)
    )
  );

drop policy if exists "Favorite list members delete" on public.favorite_list_members;
create policy "Favorite list members delete"
  on public.favorite_list_members for delete to authenticated
  using (
    exists (
      select 1 from public.favorite_lists fl
      where fl.id = favorite_list_members.list_id and public.favorite_list_can_edit(fl)
    )
  );

-- favorite_list_collaborators: select if can view list; insert/delete only owner
drop policy if exists "Favorite list collaborators select" on public.favorite_list_collaborators;
create policy "Favorite list collaborators select"
  on public.favorite_list_collaborators for select to authenticated
  using (
    exists (
      select 1 from public.favorite_lists fl
      where fl.id = favorite_list_collaborators.list_id and public.favorite_list_can_view(fl)
    )
  );

drop policy if exists "Favorite list collaborators insert" on public.favorite_list_collaborators;
create policy "Favorite list collaborators insert"
  on public.favorite_list_collaborators for insert to authenticated
  with check (
    exists (
      select 1 from public.favorite_lists fl
      where fl.id = favorite_list_collaborators.list_id and fl.owner_id = auth.uid()
    )
  );

drop policy if exists "Favorite list collaborators delete" on public.favorite_list_collaborators;
create policy "Favorite list collaborators delete"
  on public.favorite_list_collaborators for delete to authenticated
  using (
    exists (
      select 1 from public.favorite_lists fl
      where fl.id = favorite_list_collaborators.list_id and fl.owner_id = auth.uid()
    )
  );

-- Trigger: updated_at
create or replace function public.favorite_lists_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists favorite_lists_updated_at on public.favorite_lists;
create trigger favorite_lists_updated_at
  before update on public.favorite_lists
  for each row execute function public.favorite_lists_updated_at();
