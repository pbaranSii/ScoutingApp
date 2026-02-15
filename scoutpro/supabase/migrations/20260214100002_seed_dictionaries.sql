-- Seed dict_preferred_foot (foot_code matches dominant_foot enum: left, right, both)
insert into public.dict_preferred_foot (foot_code, name_pl, name_en, display_order)
values
  ('right', 'Prawa', 'Right', 1),
  ('left', 'Lewa', 'Left', 2),
  ('both', 'Obie', 'Both', 3)
on conflict (foot_code) do nothing;

-- Seed dict_player_sources (source_code aligned with observation_source where applicable)
insert into public.dict_player_sources (source_code, name_pl, name_en, description, display_order)
values
  ('scouting', 'Skauting', 'Scouting', 'Zawodnik znaleziony przez skauta klubu podczas obserwacji meczów', 1),
  ('referral', 'Polecenie', 'Referral', 'Zawodnik polecony przez trenera, rodzica lub inną osobę', 2),
  ('application', 'Zgłoszenie', 'Self-application', 'Zawodnik lub rodzic zgłosił się samodzielnie do klubu', 3),
  ('trainer_report', 'Raport trenera', 'Trainer report', 'Zawodnik wskazany przez trenera', 4),
  ('scout_report', 'Raport skauta', 'Scout report', 'Zawodnik wskazany w raporcie skauta', 5),
  ('agency', 'Agencja menedżerska', 'Agent/Agency', 'Zawodnik przedstawiony przez agencję lub agenta', 6),
  ('mass_trials', 'Testowanie masowe', 'Mass trials', 'Zawodnik zauważony podczas otwartych testów lub naboru', 7),
  ('tournament', 'Turniej', 'Tournament', 'Zawodnik zauważony podczas turnieju', 8)
on conflict (source_code) do nothing;

-- Seed dict_recruitment_decisions (decision_code aligned with pipeline_status where applicable)
insert into public.dict_recruitment_decisions (decision_code, name_pl, name_en, decision_category, display_order)
values
  ('unassigned', 'Nieprzypisany', 'Unassigned', 'in_progress', 0),
  ('observed', 'Obserwowany', 'Observed', 'in_progress', 1),
  ('shortlist', 'Na liście', 'Shortlist', 'in_progress', 2),
  ('trial', 'Testy', 'Trial', 'in_progress', 3),
  ('offer', 'Oferta', 'Offer', 'in_progress', 4),
  ('signed', 'Podpisał kontrakt', 'Signed', 'positive', 5),
  ('rejected', 'Odrzucony', 'Rejected', 'negative', 6)
on conflict (decision_code) do nothing;

-- Seed regions (województwa) with code and display_order if not already present
-- Using short codes; only insert if regions table is empty or missing codes
do $$
begin
  if not exists (select 1 from public.regions limit 1) then
    insert into public.regions (id, name, is_active, display_order, code)
    values
      (gen_random_uuid(), 'Dolnośląskie', true, 1, 'DOL'),
      (gen_random_uuid(), 'Kujawsko-Pomorskie', true, 2, 'KUJ'),
      (gen_random_uuid(), 'Lubelskie', true, 3, 'LUB'),
      (gen_random_uuid(), 'Lubuskie', true, 4, 'LBS'),
      (gen_random_uuid(), 'Łódzkie', true, 5, 'LOD'),
      (gen_random_uuid(), 'Małopolskie', true, 6, 'MAL'),
      (gen_random_uuid(), 'Mazowieckie', true, 7, 'MAZ'),
      (gen_random_uuid(), 'Opolskie', true, 8, 'OPO'),
      (gen_random_uuid(), 'Podkarpackie', true, 9, 'PKR'),
      (gen_random_uuid(), 'Podlaskie', true, 10, 'PDL'),
      (gen_random_uuid(), 'Pomorskie', true, 11, 'POM'),
      (gen_random_uuid(), 'Śląskie', true, 12, 'SLA'),
      (gen_random_uuid(), 'Świętokrzyskie', true, 13, 'SWI'),
      (gen_random_uuid(), 'Warmińsko-Mazurskie', true, 14, 'WAR'),
      (gen_random_uuid(), 'Wielkopolskie', true, 15, 'WIE'),
      (gen_random_uuid(), 'Zachodniopomorskie', true, 16, 'ZAC');
  end if;
end $$;
