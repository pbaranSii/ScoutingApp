-- Seed evaluation_criteria with section and code for extended form "Kryteria pozycyjne".
-- Positions table uses codes: GK, LB, LCB, CB, RCB, RB, CDM, LM, CM, RM, CAM, LW, RW, LS, ST, RS.
-- Only insert for positions that have section/code columns (added in 20260229100000); skip if rows exist.

-- ST (Napastnik) - G-9.1 to G-9.11
insert into public.evaluation_criteria (position_id, name, weight, sort_order, section, code)
select p.id, v.name, 1.0, v.ord, v.section::public.criterion_section, v.code
from public.positions p
cross join lateral (values
  (1, 'Skok pressingowy', 'defense', 'def_pressing_jump'),
  (2, 'Opadanie pod linię piłki', 'defense', 'def_drop_to_ball_line'),
  (3, 'Atak z góry', 'defense', 'def_attack_from_above'),
  (4, 'Zamykanie podania w poprzek', 'defense', 'def_closing_cross_pass'),
  (5, 'Gra tyłem do bramki (ochrona piłki, podanie zwrotne, przyjęcie pod presją)', 'offense', 'off_back_to_goal'),
  (6, 'Gra głową', 'offense', 'off_heading'),
  (7, 'Jakość finalizacji', 'offense', 'off_finishing_quality'),
  (8, 'Pozycjonowanie w polu karnym', 'offense', 'off_box_positioning'),
  (9, 'Gra frontalna', 'offense', 'off_frontal_play'),
  (10, 'Opis', 'transition_oa', 'transition_oa'),
  (11, 'Opis', 'transition_ao', 'transition_ao')
) as v(ord, name, section, code)
where p.code = 'ST'
  and not exists (select 1 from public.evaluation_criteria ec where ec.position_id = p.id and ec.section is not null);

-- CDM (Defensywny pomocnik) - G-6.1 to G-6.10
insert into public.evaluation_criteria (position_id, name, weight, sort_order, section, code)
select p.id, v.name, 1.0, v.ord, v.section::public.criterion_section, v.code
from public.positions p
cross join lateral (values
  (1, 'Gra w defensywie (odbiór, doskok, pierwsze metry)', 'defense', 'def_defensive_play'),
  (2, 'Gra 1v1 w powietrzu', 'defense', 'def_aerial_duels'),
  (3, 'Asekuracja i uzupełnianie linii obrony', 'defense', 'def_cover_backline'),
  (4, 'Utrzymywanie pozycji w sektorze centralnym przed ŚO', 'defense', 'def_central_position'),
  (5, 'Obrona pola karnego (kontrola przeciwnika)', 'defense', 'def_penalty_area_control'),
  (6, 'Podanie progresywne po ziemi i górne', 'offense', 'off_progressive_pass'),
  (7, 'Gra pod presją przeciwnika', 'offense', 'off_play_under_pressure'),
  (8, 'Opcja do zmiany centrum gry', 'offense', 'off_switch_play'),
  (9, 'Opis', 'transition_oa', 'transition_oa'),
  (10, 'Opis', 'transition_ao', 'transition_ao')
) as v(ord, name, section, code)
where p.code = 'CDM'
  and not exists (select 1 from public.evaluation_criteria ec where ec.position_id = p.id and ec.section is not null);

-- CAM (Ofensywny pomocnik) - G-8.1 to G-8.14 (subset)
insert into public.evaluation_criteria (position_id, name, weight, sort_order, section, code)
select p.id, v.name, 1.0, v.ord, v.section::public.criterion_section, v.code
from public.positions p
cross join lateral (values
  (1, 'Gra w defensywie (odbiór)', 'defense', 'def_tackling'),
  (2, 'Zbieranie drugich piłek', 'defense', 'def_second_balls'),
  (3, 'Wspieranie obrony w niskim pressingu', 'defense', 'def_low_block_support'),
  (4, 'Skoki pressingowe', 'defense', 'def_pressing_jumps'),
  (5, 'Umiejętność wygrywania pojedynków w ofensywie', 'offense', 'off_offensive_duels'),
  (6, 'Podanie progresywne', 'offense', 'off_progressive_pass'),
  (7, 'Podania kluczowe (otwierające)', 'offense', 'off_key_passes'),
  (8, 'Strzał z dystansu', 'offense', 'off_long_range_shot'),
  (9, 'Pozycjonowanie w półprzestrzeniach', 'offense', 'off_half_space_positioning'),
  (10, 'Wypełnienie pola karnego', 'offense', 'off_box_arrival'),
  (11, 'Gra pod presją przeciwnika', 'offense', 'off_play_under_pressure'),
  (12, 'Zdobywanie przestrzeni z piłką', 'offense', 'off_ball_carrying'),
  (13, 'Opis', 'transition_oa', 'transition_oa'),
  (14, 'Opis', 'transition_ao', 'transition_ao')
) as v(ord, name, section, code)
where p.code = 'CAM'
  and not exists (select 1 from public.evaluation_criteria ec where ec.position_id = p.id and ec.section is not null);

-- LB (Obrońca lewy) - G-2.1 to G-2.12
insert into public.evaluation_criteria (position_id, name, weight, sort_order, section, code)
select p.id, v.name, 1.0, v.ord, v.section::public.criterion_section, v.code
from public.positions p
cross join lateral (values
  (1, '1v1 w defensywie', 'defense', 'def_1v1'),
  (2, 'Obrona pola karnego (kontrola i gra w kontakcie)', 'defense', 'def_penalty_area'),
  (3, 'Blokowanie dośrodkowań', 'defense', 'def_crossing_block'),
  (4, 'Współpraca ze skrzydłowym', 'defense', 'def_winger_cooperation'),
  (5, 'Reakcja na piłkę otwartą', 'defense', 'def_open_ball_reaction'),
  (6, 'Dośrodkowanie w pełnym biegu', 'offense', 'off_crossing_full_speed'),
  (7, 'Łamanie pressingu', 'offense', 'off_pressing_break'),
  (8, 'Jakość podania pod presją', 'offense', 'off_pass_under_pressure'),
  (9, 'Wsparcie ataku (obiegi zewnętrzne i wewnętrzne)', 'offense', 'off_attack_support'),
  (10, 'Umiejętność gry w półprzestrzeni w budowaniu', 'offense', 'off_half_space_play'),
  (11, 'Opis', 'transition_oa', 'transition_oa'),
  (12, 'Opis', 'transition_ao', 'transition_ao')
) as v(ord, name, section, code)
where p.code = 'LB'
  and not exists (select 1 from public.evaluation_criteria ec where ec.position_id = p.id and ec.section is not null);

-- RB (Obrońca prawy) - G-2.1 to G-2.12
insert into public.evaluation_criteria (position_id, name, weight, sort_order, section, code)
select p.id, v.name, 1.0, v.ord, v.section::public.criterion_section, v.code
from public.positions p
cross join lateral (values
  (1, '1v1 w defensywie', 'defense', 'def_1v1'),
  (2, 'Obrona pola karnego (kontrola i gra w kontakcie)', 'defense', 'def_penalty_area'),
  (3, 'Blokowanie dośrodkowań', 'defense', 'def_crossing_block'),
  (4, 'Współpraca ze skrzydłowym', 'defense', 'def_winger_cooperation'),
  (5, 'Reakcja na piłkę otwartą', 'defense', 'def_open_ball_reaction'),
  (6, 'Dośrodkowanie w pełnym biegu', 'offense', 'off_crossing_full_speed'),
  (7, 'Łamanie pressingu', 'offense', 'off_pressing_break'),
  (8, 'Jakość podania pod presją', 'offense', 'off_pass_under_pressure'),
  (9, 'Wsparcie ataku (obiegi zewnętrzne i wewnętrzne)', 'offense', 'off_attack_support'),
  (10, 'Umiejętność gry w półprzestrzeni w budowaniu', 'offense', 'off_half_space_play'),
  (11, 'Opis', 'transition_oa', 'transition_oa'),
  (12, 'Opis', 'transition_ao', 'transition_ao')
) as v(ord, name, section, code)
where p.code = 'RB'
  and not exists (select 1 from public.evaluation_criteria ec where ec.position_id = p.id and ec.section is not null);

-- LCB (Środkowy obrońca lewy) - G-4.1 to G-4.8
insert into public.evaluation_criteria (position_id, name, weight, sort_order, section, code)
select p.id, v.name, 1.0, v.ord, v.section::public.criterion_section, v.code
from public.positions p
cross join lateral (values
  (1, '1v1 z przeciwnikiem przodem i plecami do obrońcy', 'defense', 'def_1v1_front_back'),
  (2, 'Gra 1v1 w powietrzu', 'defense', 'def_aerial_duels'),
  (3, 'Reakcja na piłkę otwartą', 'defense', 'def_open_ball_reaction'),
  (4, 'Obrona pola karnego (kontrola przeciwnika)', 'defense', 'def_penalty_area_control'),
  (5, 'Wyprowadzenie piłki pod presją (prowadzeniem lub podaniem)', 'offense', 'off_ball_progression'),
  (6, 'Prowadzenie do skupienia przeciwnika', 'offense', 'off_ball_carry_attract'),
  (7, 'Opis', 'transition_oa', 'transition_oa'),
  (8, 'Opis', 'transition_ao', 'transition_ao')
) as v(ord, name, section, code)
where p.code = 'LCB'
  and not exists (select 1 from public.evaluation_criteria ec where ec.position_id = p.id and ec.section is not null);

-- RCB (Środkowy obrońca prawy) - G-4.1 to G-4.8
insert into public.evaluation_criteria (position_id, name, weight, sort_order, section, code)
select p.id, v.name, 1.0, v.ord, v.section::public.criterion_section, v.code
from public.positions p
cross join lateral (values
  (1, '1v1 z przeciwnikiem przodem i plecami do obrońcy', 'defense', 'def_1v1_front_back'),
  (2, 'Gra 1v1 w powietrzu', 'defense', 'def_aerial_duels'),
  (3, 'Reakcja na piłkę otwartą', 'defense', 'def_open_ball_reaction'),
  (4, 'Obrona pola karnego (kontrola przeciwnika)', 'defense', 'def_penalty_area_control'),
  (5, 'Wyprowadzenie piłki pod presją (prowadzeniem lub podaniem)', 'offense', 'off_ball_progression'),
  (6, 'Prowadzenie do skupienia przeciwnika', 'offense', 'off_ball_carry_attract'),
  (7, 'Opis', 'transition_oa', 'transition_oa'),
  (8, 'Opis', 'transition_ao', 'transition_ao')
) as v(ord, name, section, code)
where p.code = 'RCB'
  and not exists (select 1 from public.evaluation_criteria ec where ec.position_id = p.id and ec.section is not null);

-- CB (Środkowy obrońca) - G-4.1 to G-4.8
insert into public.evaluation_criteria (position_id, name, weight, sort_order, section, code)
select p.id, v.name, 1.0, v.ord, v.section::public.criterion_section, v.code
from public.positions p
cross join lateral (values
  (1, '1v1 z przeciwnikiem przodem i plecami do obrońcy', 'defense', 'def_1v1_front_back'),
  (2, 'Gra 1v1 w powietrzu', 'defense', 'def_aerial_duels'),
  (3, 'Reakcja na piłkę otwartą', 'defense', 'def_open_ball_reaction'),
  (4, 'Obrona pola karnego (kontrola przeciwnika)', 'defense', 'def_penalty_area_control'),
  (5, 'Wyprowadzenie piłki pod presją (prowadzeniem lub podaniem)', 'offense', 'off_ball_progression'),
  (6, 'Prowadzenie do skupienia przeciwnika', 'offense', 'off_ball_carry_attract'),
  (7, 'Opis', 'transition_oa', 'transition_oa'),
  (8, 'Opis', 'transition_ao', 'transition_ao')
) as v(ord, name, section, code)
where p.code = 'CB'
  and not exists (select 1 from public.evaluation_criteria ec where ec.position_id = p.id and ec.section is not null);

-- LW (Skrzydłowy lewy) - G-7.1 to G-7.11
insert into public.evaluation_criteria (position_id, name, weight, sort_order, section, code)
select p.id, v.name, 1.0, v.ord, v.section::public.criterion_section, v.code
from public.positions p
cross join lateral (values
  (1, 'Zamykanie środka', 'defense', 'def_closing_center'),
  (2, 'Gra w pressingu', 'defense', 'def_pressing'),
  (3, 'Wsparcie bocznego obrońcy', 'defense', 'def_fullback_support'),
  (4, 'Gra 1v1 (drybling)', 'offense', 'off_dribbling_1v1'),
  (5, 'Skuteczna decyzyjność w 3. tercji', 'offense', 'off_final_third_decisions'),
  (6, 'Szybkość z piłką i bez piłki', 'offense', 'off_speed_on_off_ball'),
  (7, 'Atak wolnej przestrzeni bez piłki', 'offense', 'off_run_into_space'),
  (8, 'Pozycjonowanie w polu karnym', 'offense', 'off_box_positioning'),
  (9, 'Różnorodność dośrodkowań', 'offense', 'off_crossing_variety'),
  (10, 'Opis', 'transition_oa', 'transition_oa'),
  (11, 'Opis', 'transition_ao', 'transition_ao')
) as v(ord, name, section, code)
where p.code = 'LW'
  and not exists (select 1 from public.evaluation_criteria ec where ec.position_id = p.id and ec.section is not null);

-- RW (Skrzydłowy prawy) - G-7.1 to G-7.11
insert into public.evaluation_criteria (position_id, name, weight, sort_order, section, code)
select p.id, v.name, 1.0, v.ord, v.section::public.criterion_section, v.code
from public.positions p
cross join lateral (values
  (1, 'Zamykanie środka', 'defense', 'def_closing_center'),
  (2, 'Gra w pressingu', 'defense', 'def_pressing'),
  (3, 'Wsparcie bocznego obrońcy', 'defense', 'def_fullback_support'),
  (4, 'Gra 1v1 (drybling)', 'offense', 'off_dribbling_1v1'),
  (5, 'Skuteczna decyzyjność w 3. tercji', 'offense', 'off_final_third_decisions'),
  (6, 'Szybkość z piłką i bez piłki', 'offense', 'off_speed_on_off_ball'),
  (7, 'Atak wolnej przestrzeni bez piłki', 'offense', 'off_run_into_space'),
  (8, 'Pozycjonowanie w polu karnym', 'offense', 'off_box_positioning'),
  (9, 'Różnorodność dośrodkowań', 'offense', 'off_crossing_variety'),
  (10, 'Opis', 'transition_oa', 'transition_oa'),
  (11, 'Opis', 'transition_ao', 'transition_ao')
) as v(ord, name, section, code)
where p.code = 'RW'
  and not exists (select 1 from public.evaluation_criteria ec where ec.position_id = p.id and ec.section is not null);

-- CM (Pomocnik środkowy) - G-8.1 to G-8.14
insert into public.evaluation_criteria (position_id, name, weight, sort_order, section, code)
select p.id, v.name, 1.0, v.ord, v.section::public.criterion_section, v.code
from public.positions p
cross join lateral (values
  (1, 'Gra w defensywie (odbiór)', 'defense', 'def_tackling'),
  (2, 'Zbieranie drugich piłek', 'defense', 'def_second_balls'),
  (3, 'Wspieranie obrony w niskim pressingu', 'defense', 'def_low_block_support'),
  (4, 'Skoki pressingowe', 'defense', 'def_pressing_jumps'),
  (5, 'Umiejętność wygrywania pojedynków w ofensywie', 'offense', 'off_offensive_duels'),
  (6, 'Podanie progresywne', 'offense', 'off_progressive_pass'),
  (7, 'Podania kluczowe (otwierające)', 'offense', 'off_key_passes'),
  (8, 'Strzał z dystansu', 'offense', 'off_long_range_shot'),
  (9, 'Pozycjonowanie w półprzestrzeniach', 'offense', 'off_half_space_positioning'),
  (10, 'Wypełnienie pola karnego', 'offense', 'off_box_arrival'),
  (11, 'Gra pod presją przeciwnika', 'offense', 'off_play_under_pressure'),
  (12, 'Zdobywanie przestrzeni z piłką', 'offense', 'off_ball_carrying'),
  (13, 'Opis', 'transition_oa', 'transition_oa'),
  (14, 'Opis', 'transition_ao', 'transition_ao')
) as v(ord, name, section, code)
where p.code = 'CM'
  and not exists (select 1 from public.evaluation_criteria ec where ec.position_id = p.id and ec.section is not null);
