-- Prevent RLS recursion by removing dependency on public.is_admin()
-- from the policy on public.users.
--
-- Root cause:
-- - public.users SELECT policy calls public.is_admin()
-- - public.is_admin() queries public.users
-- -> infinite recursion (42P17).

drop policy if exists "Users are viewable by authenticated users" on public.users;

create policy "Users are viewable by authenticated users"
on public.users
for select
to authenticated
using (
  -- Everyone can see active users...
  is_active = true
  -- ...and the current user can always see themselves if they are admin.
  or (
    id = auth.uid()
    and role = 'admin'
    and is_active = true
  )
);

