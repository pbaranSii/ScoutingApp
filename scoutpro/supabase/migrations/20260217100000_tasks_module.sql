-- Tasks and invitations module: enum, tables, RLS.
-- Types: task, invitation, observation. task_players links observations to players.

do $$ begin
  create type public.task_type as enum ('task', 'invitation', 'observation');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  type public.task_type not null,
  description text not null,
  assigned_to uuid references public.users(id) on delete set null,
  deadline date not null,
  created_by uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- invitation
  location text,
  meeting_date timestamptz,
  inviter_info text,

  -- observation
  observation_location text,
  observation_date timestamptz,
  observation_source text
);

create index if not exists idx_tasks_deadline on public.tasks(deadline);
create index if not exists idx_tasks_type on public.tasks(type);
create index if not exists idx_tasks_assigned_to on public.tasks(assigned_to);
create index if not exists idx_tasks_created_by on public.tasks(created_by);

create table if not exists public.task_players (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  unique(task_id, player_id)
);

create index if not exists idx_task_players_task_id on public.task_players(task_id);
create index if not exists idx_task_players_player_id on public.task_players(player_id);

alter table public.tasks enable row level security;
alter table public.task_players enable row level security;

drop policy if exists "Tasks viewable by authenticated" on public.tasks;
create policy "Tasks viewable by authenticated"
  on public.tasks for select
  to authenticated
  using (true);

drop policy if exists "Tasks insert by authenticated" on public.tasks;
create policy "Tasks insert by authenticated"
  on public.tasks for insert
  to authenticated
  with check (true);

drop policy if exists "Tasks update by authenticated" on public.tasks;
create policy "Tasks update by authenticated"
  on public.tasks for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Tasks delete by authenticated" on public.tasks;
create policy "Tasks delete by authenticated"
  on public.tasks for delete
  to authenticated
  using (true);

drop policy if exists "Task players viewable by authenticated" on public.task_players;
create policy "Task players viewable by authenticated"
  on public.task_players for select
  to authenticated
  using (true);

drop policy if exists "Task players insert by authenticated" on public.task_players;
create policy "Task players insert by authenticated"
  on public.task_players for insert
  to authenticated
  with check (true);

drop policy if exists "Task players update by authenticated" on public.task_players;
create policy "Task players update by authenticated"
  on public.task_players for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Task players delete by authenticated" on public.task_players;
create policy "Task players delete by authenticated"
  on public.task_players for delete
  to authenticated
  using (true);
