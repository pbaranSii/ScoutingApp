-- Security hardening:
-- - Fix linter 0011: function_search_path_mutable (set immutable search_path on functions)
-- - Fix linter 0024: permissive RLS policies for DML (avoid USING/WITH CHECK (true))

-- 0011_function_search_path_mutable
create or replace function public.favorite_lists_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.player_demands_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 0024_permissive_rls_policy (DML)

-- Players
drop policy if exists "Users can insert players" on public.players;
create policy "Users can insert players"
on public.players
for insert
to authenticated
with check (public.is_admin() or created_by = auth.uid());

drop policy if exists "Users can update players" on public.players;
create policy "Users can update players"
on public.players
for update
to authenticated
using (
  public.is_admin()
  or created_by = auth.uid()
  or exists (
    select 1
    from public.observations o
    where o.player_id = players.id and o.scout_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or created_by = auth.uid()
  or exists (
    select 1
    from public.observations o
    where o.player_id = players.id and o.scout_id = auth.uid()
  )
);

drop policy if exists "allow_delete_players_authenticated" on public.players;
create policy "allow_delete_players_authenticated"
on public.players
for delete
to authenticated
using (
  public.is_admin()
  or created_by = auth.uid()
  or exists (
    select 1
    from public.observations o
    where o.player_id = players.id and o.scout_id = auth.uid()
  )
);

-- Observations
drop policy if exists "allow_delete_observations_authenticated" on public.observations;
create policy "allow_delete_observations_authenticated"
on public.observations
for delete
to authenticated
using (public.is_admin() or scout_id = auth.uid());

-- Player contacts
drop policy if exists "Users can manage player contacts" on public.player_contacts;
create policy "Users can manage player contacts"
on public.player_contacts
for all
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.players p
    where p.id = player_contacts.player_id
      and (
        p.created_by = auth.uid()
        or exists (
          select 1
          from public.observations o
          where o.player_id = p.id and o.scout_id = auth.uid()
        )
      )
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.players p
    where p.id = player_contacts.player_id
      and (
        p.created_by = auth.uid()
        or exists (
          select 1
          from public.observations o
          where o.player_id = p.id and o.scout_id = auth.uid()
        )
      )
  )
);

-- Player evaluations
drop policy if exists "Users can manage player evaluations" on public.player_evaluations;
create policy "Users can manage player evaluations"
on public.player_evaluations
for all
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.observations o
    where o.id = player_evaluations.observation_id and o.scout_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.observations o
    where o.id = player_evaluations.observation_id and o.scout_id = auth.uid()
  )
);

-- Pipeline history
drop policy if exists "Allow insert pipeline history authenticated" on public.pipeline_history;
create policy "Allow insert pipeline history authenticated"
on public.pipeline_history
for insert
to authenticated
with check (public.is_admin() or changed_by = auth.uid());

-- Player demand candidates
drop policy if exists "Player demand candidates delete" on public.player_demand_candidates;
create policy "Player demand candidates delete"
on public.player_demand_candidates
for delete
to authenticated
using (public.demand_can_manage() or assigned_by = auth.uid());

-- Tasks
drop policy if exists "Tasks insert by authenticated" on public.tasks;
create policy "Tasks insert by authenticated"
on public.tasks
for insert
to authenticated
with check (public.is_admin() or created_by = auth.uid());

drop policy if exists "Tasks update by authenticated" on public.tasks;
create policy "Tasks update by authenticated"
on public.tasks
for update
to authenticated
using (public.is_admin() or created_by = auth.uid() or assigned_to = auth.uid())
with check (public.is_admin() or created_by = auth.uid() or assigned_to = auth.uid());

drop policy if exists "Tasks delete by authenticated" on public.tasks;
create policy "Tasks delete by authenticated"
on public.tasks
for delete
to authenticated
using (public.is_admin() or created_by = auth.uid() or assigned_to = auth.uid());

-- Task players
drop policy if exists "Task players insert by authenticated" on public.task_players;
create policy "Task players insert by authenticated"
on public.task_players
for insert
to authenticated
with check (
  exists (
    select 1
    from public.tasks t
    where t.id = task_players.task_id
      and (public.is_admin() or t.created_by = auth.uid() or t.assigned_to = auth.uid())
  )
);

drop policy if exists "Task players update by authenticated" on public.task_players;
create policy "Task players update by authenticated"
on public.task_players
for update
to authenticated
using (
  exists (
    select 1
    from public.tasks t
    where t.id = task_players.task_id
      and (public.is_admin() or t.created_by = auth.uid() or t.assigned_to = auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.tasks t
    where t.id = task_players.task_id
      and (public.is_admin() or t.created_by = auth.uid() or t.assigned_to = auth.uid())
  )
);

drop policy if exists "Task players delete by authenticated" on public.task_players;
create policy "Task players delete by authenticated"
on public.task_players
for delete
to authenticated
using (
  exists (
    select 1
    from public.tasks t
    where t.id = task_players.task_id
      and (public.is_admin() or t.created_by = auth.uid() or t.assigned_to = auth.uid())
  )
);

-- Observation v2 extension tables: motor_evaluations, observation_criterion_notes
drop policy if exists "Motor evaluations insert by authenticated" on public.motor_evaluations;
create policy "Motor evaluations insert by authenticated"
  on public.motor_evaluations for insert to authenticated
  with check (
    exists (
      select 1
      from public.observations o
      where o.id = motor_evaluations.observation_id
        and (public.is_admin() or o.scout_id = auth.uid())
    )
  );

drop policy if exists "Motor evaluations update by authenticated" on public.motor_evaluations;
create policy "Motor evaluations update by authenticated"
  on public.motor_evaluations for update to authenticated
  using (
    exists (
      select 1
      from public.observations o
      where o.id = motor_evaluations.observation_id
        and (public.is_admin() or o.scout_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.observations o
      where o.id = motor_evaluations.observation_id
        and (public.is_admin() or o.scout_id = auth.uid())
    )
  );

drop policy if exists "Motor evaluations delete by authenticated" on public.motor_evaluations;
create policy "Motor evaluations delete by authenticated"
  on public.motor_evaluations for delete to authenticated
  using (
    exists (
      select 1
      from public.observations o
      where o.id = motor_evaluations.observation_id
        and (public.is_admin() or o.scout_id = auth.uid())
    )
  );

drop policy if exists "Observation criterion notes insert by authenticated" on public.observation_criterion_notes;
create policy "Observation criterion notes insert by authenticated"
  on public.observation_criterion_notes for insert to authenticated
  with check (
    exists (
      select 1
      from public.observations o
      where o.id = observation_criterion_notes.observation_id
        and (public.is_admin() or o.scout_id = auth.uid())
    )
  );

drop policy if exists "Observation criterion notes update by authenticated" on public.observation_criterion_notes;
create policy "Observation criterion notes update by authenticated"
  on public.observation_criterion_notes for update to authenticated
  using (
    exists (
      select 1
      from public.observations o
      where o.id = observation_criterion_notes.observation_id
        and (public.is_admin() or o.scout_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.observations o
      where o.id = observation_criterion_notes.observation_id
        and (public.is_admin() or o.scout_id = auth.uid())
    )
  );

drop policy if exists "Observation criterion notes delete by authenticated" on public.observation_criterion_notes;
create policy "Observation criterion notes delete by authenticated"
  on public.observation_criterion_notes for delete to authenticated
  using (
    exists (
      select 1
      from public.observations o
      where o.id = observation_criterion_notes.observation_id
        and (public.is_admin() or o.scout_id = auth.uid())
    )
  );

