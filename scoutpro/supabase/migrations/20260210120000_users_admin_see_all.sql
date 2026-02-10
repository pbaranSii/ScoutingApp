-- Allow admins to see all users (including suspended) so they can restore access.
drop policy if exists "Users are viewable by authenticated users" on public.users;
create policy "Users are viewable by authenticated users"
on public.users
for select
to authenticated
using (is_active = true or public.is_admin());
