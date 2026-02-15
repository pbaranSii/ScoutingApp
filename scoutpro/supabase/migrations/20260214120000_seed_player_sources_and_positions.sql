-- 1) Źródła pozyskania: 5 pozycji, nazwa PL i EN taka sama
insert into public.dict_player_sources (source_code, name_pl, name_en, display_order, is_active)
values
  ('scouting', 'Skauting', 'Skauting', 1, true),
  ('referral', 'Polecenie', 'Polecenie', 2, true),
  ('application', 'Zgłoszenie', 'Zgłoszenie', 3, true),
  ('trainer_report', 'Raport trenera', 'Raport trenera', 4, true),
  ('scout_report', 'Raport skauta', 'Raport skauta', 5, true)
on conflict (source_code) do update set
  name_pl = excluded.name_pl,
  name_en = excluded.name_en,
  display_order = excluded.display_order,
  is_active = true;

update public.dict_player_sources set is_active = false
where source_code in ('agency', 'mass_trials', 'tournament');

-- 2) Pozycje zawodników: aktualizacja istniejących po code, wstaw brakujących
with v (code, name, display_order) as (
  values
    ('GK', 'Bramkarz (GK)', 1),
    ('LB', 'Obrońca lewy (LB)', 2),
    ('LCB', 'Środkowy obrońca lewy (LCB)', 3),
    ('CB', 'Środkowy obrońca (CB)', 4),
    ('RCB', 'Środkowy obrońca prawy (RCB)', 5),
    ('RB', 'Obrońca prawy (RB)', 6),
    ('CDM', 'Defensywny pomocnik (CDM)', 7),
    ('LM', 'Pomocnik lewy (LM)', 8),
    ('CM', 'Pomocnik środkowy (CM)', 9),
    ('RM', 'Pomocnik prawy (RM)', 10),
    ('CAM', 'Ofensywny pomocnik (CAM)', 11),
    ('LW', 'Skrzydłowy lewy (LW)', 12),
    ('RW', 'Skrzydłowy prawy (RW)', 13),
    ('LS', 'Napastnik lewy (LS)', 14),
    ('ST', 'Napastnik środkowy (ST)', 15),
    ('RS', 'Napastnik prawy (RS)', 16)
)
update public.positions p set name = v.name, display_order = v.display_order
from v where p.code = v.code;

insert into public.positions (code, name, display_order)
select v.code, v.name, v.display_order from (
  values
    ('GK', 'Bramkarz (GK)', 1),
    ('LB', 'Obrońca lewy (LB)', 2),
    ('LCB', 'Środkowy obrońca lewy (LCB)', 3),
    ('CB', 'Środkowy obrońca (CB)', 4),
    ('RCB', 'Środkowy obrońca prawy (RCB)', 5),
    ('RB', 'Obrońca prawy (RB)', 6),
    ('CDM', 'Defensywny pomocnik (CDM)', 7),
    ('LM', 'Pomocnik lewy (LM)', 8),
    ('CM', 'Pomocnik środkowy (CM)', 9),
    ('RM', 'Pomocnik prawy (RM)', 10),
    ('CAM', 'Ofensywny pomocnik (CAM)', 11),
    ('LW', 'Skrzydłowy lewy (LW)', 12),
    ('RW', 'Skrzydłowy prawy (RW)', 13),
    ('LS', 'Napastnik lewy (LS)', 14),
    ('ST', 'Napastnik środkowy (ST)', 15),
    ('RS', 'Napastnik prawy (RS)', 16)
) as v(code, name, display_order)
where not exists (select 1 from public.positions p where p.code = v.code);
