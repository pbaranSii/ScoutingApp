-- Add task_status enum and status column to tasks.

do $$ begin
  create type public.task_status as enum ('pending', 'completed', 'cancelled');
exception
  when duplicate_object then null;
end $$;

alter table public.tasks
  add column if not exists status public.task_status not null default 'pending';

create index if not exists idx_tasks_status on public.tasks(status);
