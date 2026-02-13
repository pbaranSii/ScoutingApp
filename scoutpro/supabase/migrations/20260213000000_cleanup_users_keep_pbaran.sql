-- Czyszczenie użytkowników: zostaw tylko pbaran@sii.pl (cel: testowanie aplikacji).
-- Uruchom ręcznie lub przez: supabase db push

do $$
declare
  keeper_id uuid;
  users_to_delete uuid[];
begin
  -- Pobierz id użytkownika do zachowania
  select id into keeper_id from public.users where email = 'pbaran@sii.pl' limit 1;
  if keeper_id is null then
    raise exception 'Użytkownik pbaran@sii.pl nie istnieje w public.users. Utwórz go najpierw.';
  end if;

  -- Zbierz id użytkowników do usunięcia
  select array_agg(id) into users_to_delete
  from public.users
  where id != keeper_id;

  if users_to_delete is null or array_length(users_to_delete, 1) is null then
    return; -- brak innych użytkowników
  end if;

  -- Przypisz referencje do użytkownika keeper (gdzie FK to restrict)
  -- players nie ma created_by/scout_id
  update public.matches set created_by = keeper_id where created_by = any(users_to_delete);

  update public.observations set scout_id = keeper_id where scout_id = any(users_to_delete);
  update public.observations set created_by = keeper_id where created_by = any(users_to_delete);
  update public.observations set updated_by = keeper_id where updated_by = any(users_to_delete);

  update public.pipeline_history set changed_by = keeper_id where changed_by = any(users_to_delete);

  update public.multimedia set created_by = keeper_id where created_by = any(users_to_delete);

  update public.invitations set invited_by = keeper_id where invited_by = any(users_to_delete);

  -- Usuń z public.users (offline_queue ma on delete cascade)
  delete from public.users where id = any(users_to_delete);

  -- Usuń z auth.users (wymaga uprawnień do schematu auth)
  delete from auth.users where id = any(users_to_delete);
end $$;
