-- Źródła pozyskania: tylko 5 pozycji widocznych (Skauting, Polecenie, Zgłoszenie, Raport trenera, Raport skauta).
-- Pozostałe (agencja, testowanie masowe, turniej) ustaw jako nieaktywne.
update public.dict_player_sources
set is_active = false
where source_code in ('agency', 'mass_trials', 'tournament');

-- Upewnij się, że nazwy PL są dokładnie jak w kontrolce
update public.dict_player_sources set name_pl = 'Skauting' where source_code = 'scouting';
update public.dict_player_sources set name_pl = 'Polecenie' where source_code = 'referral';
update public.dict_player_sources set name_pl = 'Zgłoszenie' where source_code = 'application';
update public.dict_player_sources set name_pl = 'Raport trenera' where source_code = 'trainer_report';
update public.dict_player_sources set name_pl = 'Raport skauta' where source_code = 'scout_report';
