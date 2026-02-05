-- Fix RLS recursion by using a SECURITY DEFINER helper for admin checks.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'admin'
      and is_active = true
  );
$$;

-- Users: admin checks should not query users under RLS.
drop policy if exists "Only admins can modify users" on public.users;
create policy "Only admins can modify users"
on public.users
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Observations: avoid recursive users lookup in policy.
drop policy if exists "Users can update own observations" on public.observations;
create policy "Users can update own observations"
on public.observations
for update
to authenticated
using (
  scout_id = auth.uid()
  or public.is_admin()
);
