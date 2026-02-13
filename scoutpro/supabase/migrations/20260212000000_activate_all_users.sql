-- Aktywuj wszystkich użytkowników w systemie (ustaw is_active = true)
update public.users
set is_active = true
where is_active = false;
