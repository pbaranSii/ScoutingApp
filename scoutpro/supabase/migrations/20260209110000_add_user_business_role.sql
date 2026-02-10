-- Add business roles for users (separate from admin/user role).
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_business_role') then
    create type public.user_business_role as enum (
      'scout',
      'coach',
      'director',
      'suspended',
      'admin'
    );
  end if;
end$$;

alter table if exists public.users
  add column if not exists business_role public.user_business_role not null default 'scout';

-- Map current admins to business role admin.
update public.users
set business_role = 'admin'
where role = 'admin';
