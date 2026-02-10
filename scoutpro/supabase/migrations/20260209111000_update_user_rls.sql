-- Ensure suspended users cannot update their profile.
drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
on public.users
for update
to authenticated
using (id = auth.uid() and is_active = true)
with check (id = auth.uid() and is_active = true);
