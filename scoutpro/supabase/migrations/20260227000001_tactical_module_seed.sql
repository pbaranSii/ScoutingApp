-- Seed wbudowanych schematów taktycznych (analiza sekcja 5).
-- Współrzędne: x 0–100 (0=lewa bramka), y 0–100 (0=dolna linia boiska = własna bramka).

insert into public.formations (name, code, description, is_system)
values ('4-4-2 (płaski)', '4-4-2', 'Zrównoważony, klasyczny system angielski. Dobry do nauki podstaw.', true);
insert into public.tactical_slots (formation_id, position_id, slot_label, x, y, side, depth, display_order)
select f.id, p.id, p.position_code, v.x, v.y, v.side, v.depth, v.ord
from public.formations f
cross join lateral (values
  (1, 'GK', 50, 5, 'C', 'GK', 1),
  (2, 'RB', 85, 18, 'R', 'DEF', 2),
  (5, 'CB', 65, 18, 'R', 'DEF', 3),
  (4, 'CB', 35, 18, 'L', 'DEF', 4),
  (3, 'LB', 15, 18, 'L', 'DEF', 5),
  (7, 'RW', 85, 50, 'R', 'MID', 6),
  (8, 'CM', 65, 50, 'C', 'MID', 7),
  (8, 'CM', 35, 50, 'C', 'MID', 8),
  (11, 'LW', 15, 50, 'L', 'MID', 9),
  (9, 'ST', 65, 85, 'C', 'ATT', 10),
  (9, 'ST', 35, 85, 'C', 'ATT', 11)
) as v(pos_num, code, x, y, side, depth, ord)
join public.position_dictionary p on p.position_number = v.pos_num and p.position_code = v.code
where f.code = '4-4-2' and f.is_system = true;

-- 4-3-3
insert into public.formations (name, code, description, is_system)
values ('4-3-3', '4-3-3', 'Pressing, dominacja posiadania. Popularne w akademiach holenderskich i barcelońskich.', true);
insert into public.tactical_slots (formation_id, position_id, slot_label, x, y, side, depth, display_order)
select f.id, p.id, p.position_code, v.x, v.y, v.side, v.depth, v.ord
from public.formations f
cross join lateral (values
  (1, 'GK', 50, 5, 'C', 'GK', 1),
  (2, 'RB', 85, 18, 'R', 'DEF', 2),
  (5, 'CB', 65, 18, 'R', 'DEF', 3),
  (4, 'CB', 35, 18, 'L', 'DEF', 4),
  (3, 'LB', 15, 18, 'L', 'DEF', 5),
  (8, 'CM', 65, 50, 'C', 'MID', 6),
  (6, 'DM', 50, 50, 'C', 'MID', 7),
  (8, 'CM', 35, 50, 'C', 'MID', 8),
  (7, 'RW', 85, 85, 'R', 'ATT', 9),
  (9, 'ST', 50, 85, 'C', 'ATT', 10),
  (11, 'LW', 15, 85, 'L', 'ATT', 11)
) as v(pos_num, code, x, y, side, depth, ord)
join public.position_dictionary p on p.position_number = v.pos_num and p.position_code = v.code
where f.code = '4-3-3' and f.is_system = true;

-- 4-2-3-1
insert into public.formations (name, code, description, is_system)
values ('4-2-3-1', '4-2-3-1', 'Najczęściej stosowany schemat na poziomie elitarnym (2010–2020). Zrównoważony ofensywnie i defensywnie.', true);
insert into public.tactical_slots (formation_id, position_id, slot_label, x, y, side, depth, display_order)
select f.id, p.id, p.position_code, v.x, v.y, v.side, v.depth, v.ord
from public.formations f
cross join lateral (values
  (1, 'GK', 50, 5, 'C', 'GK', 1),
  (2, 'RB', 85, 18, 'R', 'DEF', 2),
  (5, 'CB', 65, 18, 'R', 'DEF', 3),
  (4, 'CB', 35, 18, 'L', 'DEF', 4),
  (3, 'LB', 15, 18, 'L', 'DEF', 5),
  (6, 'DM', 65, 38, 'R', 'MID', 6),
  (8, 'CM', 35, 38, 'L', 'MID', 7),
  (7, 'RW', 85, 72, 'R', 'ATT', 8),
  (10, 'AM', 50, 72, 'C', 'ATT', 9),
  (11, 'LW', 15, 72, 'L', 'ATT', 10),
  (9, 'ST', 50, 90, 'C', 'ATT', 11)
) as v(pos_num, code, x, y, side, depth, ord)
join public.position_dictionary p on p.position_number = v.pos_num and p.position_code = v.code
where f.code = '4-2-3-1' and f.is_system = true;

-- 4-1-4-1
insert into public.formations (name, code, description, is_system)
values ('4-1-4-1', '4-1-4-1', 'Silna ochrona środka. Dobry pod kontratak.', true);
insert into public.tactical_slots (formation_id, position_id, slot_label, x, y, side, depth, display_order)
select f.id, p.id, p.position_code, v.x, v.y, v.side, v.depth, v.ord
from public.formations f
cross join lateral (values
  (1, 'GK', 50, 5, 'C', 'GK', 1),
  (2, 'RB', 85, 18, 'R', 'DEF', 2),
  (5, 'CB', 65, 18, 'R', 'DEF', 3),
  (4, 'CB', 35, 18, 'L', 'DEF', 4),
  (3, 'LB', 15, 18, 'L', 'DEF', 5),
  (6, 'DM', 50, 38, 'C', 'MID', 6),
  (7, 'RW', 85, 55, 'R', 'MID', 7),
  (8, 'CM', 65, 55, 'C', 'MID', 8),
  (8, 'CM', 35, 55, 'C', 'MID', 9),
  (11, 'LW', 15, 55, 'L', 'MID', 10),
  (9, 'ST', 50, 88, 'C', 'ATT', 11)
) as v(pos_num, code, x, y, side, depth, ord)
join public.position_dictionary p on p.position_number = v.pos_num and p.position_code = v.code
where f.code = '4-1-4-1' and f.is_system = true;

-- 4-3-2-1 (Choinka)
insert into public.formations (name, code, description, is_system)
values ('4-3-2-1 (Choinka)', '4-3-2-1', 'Wąski, centralny. Presja na środek. Wymagający dla skrzydłowych.', true);
insert into public.tactical_slots (formation_id, position_id, slot_label, x, y, side, depth, display_order)
select f.id, p.id, p.position_code, v.x, v.y, v.side, v.depth, v.ord
from public.formations f
cross join lateral (values
  (1, 'GK', 50, 5, 'C', 'GK', 1),
  (2, 'RB', 85, 18, 'R', 'DEF', 2),
  (5, 'CB', 65, 18, 'R', 'DEF', 3),
  (4, 'CB', 35, 18, 'L', 'DEF', 4),
  (3, 'LB', 15, 18, 'L', 'DEF', 5),
  (8, 'CM', 65, 48, 'C', 'MID', 6),
  (6, 'DM', 50, 48, 'C', 'MID', 7),
  (8, 'CM', 35, 48, 'C', 'MID', 8),
  (10, 'AM', 65, 72, 'C', 'ATT', 9),
  (10, 'AM', 35, 72, 'C', 'ATT', 10),
  (9, 'ST', 50, 90, 'C', 'ATT', 11)
) as v(pos_num, code, x, y, side, depth, ord)
join public.position_dictionary p on p.position_number = v.pos_num and p.position_code = v.code
where f.code = '4-3-2-1' and f.is_system = true;

-- 4-4-1-1
insert into public.formations (name, code, description, is_system)
values ('4-4-1-1', '4-4-1-1', 'Hybrydowy; dziesiątka za napastnikiem. Bardziej defensywny niż 4-3-3.', true);
insert into public.tactical_slots (formation_id, position_id, slot_label, x, y, side, depth, display_order)
select f.id, p.id, p.position_code, v.x, v.y, v.side, v.depth, v.ord
from public.formations f
cross join lateral (values
  (1, 'GK', 50, 5, 'C', 'GK', 1),
  (2, 'RB', 85, 18, 'R', 'DEF', 2),
  (5, 'CB', 65, 18, 'R', 'DEF', 3),
  (4, 'CB', 35, 18, 'L', 'DEF', 4),
  (3, 'LB', 15, 18, 'L', 'DEF', 5),
  (7, 'RW', 85, 52, 'R', 'MID', 6),
  (8, 'CM', 65, 52, 'C', 'MID', 7),
  (8, 'CM', 35, 52, 'C', 'MID', 8),
  (11, 'LW', 15, 52, 'L', 'MID', 9),
  (10, 'AM', 50, 72, 'C', 'ATT', 10),
  (9, 'ST', 50, 90, 'C', 'ATT', 11)
) as v(pos_num, code, x, y, side, depth, ord)
join public.position_dictionary p on p.position_number = v.pos_num and p.position_code = v.code
where f.code = '4-4-1-1' and f.is_system = true;

-- 3-5-2
insert into public.formations (name, code, description, is_system)
values ('3-5-2', '3-5-2', 'Dominacja środka boiska. Wahadłowi kluczowi dla szerokości gry.', true);
insert into public.tactical_slots (formation_id, position_id, slot_label, x, y, side, depth, display_order)
select f.id, p.id, p.position_code, v.x, v.y, v.side, v.depth, v.ord
from public.formations f
cross join lateral (values
  (1, 'GK', 50, 5, 'C', 'GK', 1),
  (5, 'CB', 65, 18, 'R', 'DEF', 2),
  (4, 'CB', 50, 18, 'C', 'DEF', 3),
  (4, 'CB', 35, 18, 'L', 'DEF', 4),
  (0, 'WB', 85, 50, 'R', 'MID', 5),
  (8, 'CM', 65, 50, 'C', 'MID', 6),
  (6, 'DM', 50, 50, 'C', 'MID', 7),
  (8, 'CM', 35, 50, 'C', 'MID', 8),
  (0, 'WB', 15, 50, 'L', 'MID', 9),
  (9, 'ST', 65, 88, 'C', 'ATT', 10),
  (9, 'ST', 35, 88, 'C', 'ATT', 11)
) as v(pos_num, code, x, y, side, depth, ord)
join public.position_dictionary p on p.position_number = v.pos_num and p.position_code = v.code
where f.code = '3-5-2' and f.is_system = true;

-- 3-4-3
insert into public.formations (name, code, description, is_system)
values ('3-4-3', '3-4-3', 'Ofensywny. Stosowany przez Guardiolę (Man City). Wymaga wahadłowych-atletów.', true);
insert into public.tactical_slots (formation_id, position_id, slot_label, x, y, side, depth, display_order)
select f.id, p.id, p.position_code, v.x, v.y, v.side, v.depth, v.ord
from public.formations f
cross join lateral (values
  (1, 'GK', 50, 5, 'C', 'GK', 1),
  (5, 'CB', 65, 18, 'R', 'DEF', 2),
  (4, 'CB', 50, 18, 'C', 'DEF', 3),
  (4, 'CB', 35, 18, 'L', 'DEF', 4),
  (0, 'WB', 85, 50, 'R', 'MID', 5),
  (8, 'CM', 65, 50, 'C', 'MID', 6),
  (8, 'CM', 35, 50, 'C', 'MID', 7),
  (0, 'WB', 15, 50, 'L', 'MID', 8),
  (7, 'RW', 85, 85, 'R', 'ATT', 9),
  (9, 'ST', 50, 85, 'C', 'ATT', 10),
  (11, 'LW', 15, 85, 'L', 'ATT', 11)
) as v(pos_num, code, x, y, side, depth, ord)
join public.position_dictionary p on p.position_number = v.pos_num and p.position_code = v.code
where f.code = '3-4-3' and f.is_system = true;

-- 3-4-2-1
insert into public.formations (name, code, description, is_system)
values ('3-4-2-1', '3-4-2-1', 'Wariant 3-4-3 z dwoma dziesiątkami za jednym napastnikiem.', true);
insert into public.tactical_slots (formation_id, position_id, slot_label, x, y, side, depth, display_order)
select f.id, p.id, p.position_code, v.x, v.y, v.side, v.depth, v.ord
from public.formations f
cross join lateral (values
  (1, 'GK', 50, 5, 'C', 'GK', 1),
  (5, 'CB', 65, 18, 'R', 'DEF', 2),
  (4, 'CB', 50, 18, 'C', 'DEF', 3),
  (4, 'CB', 35, 18, 'L', 'DEF', 4),
  (0, 'WB', 85, 50, 'R', 'MID', 5),
  (8, 'CM', 65, 50, 'C', 'MID', 6),
  (8, 'CM', 35, 50, 'C', 'MID', 7),
  (0, 'WB', 15, 50, 'L', 'MID', 8),
  (10, 'AM', 65, 72, 'C', 'ATT', 9),
  (10, 'AM', 35, 72, 'C', 'ATT', 10),
  (9, 'ST', 50, 90, 'C', 'ATT', 11)
) as v(pos_num, code, x, y, side, depth, ord)
join public.position_dictionary p on p.position_number = v.pos_num and p.position_code = v.code
where f.code = '3-4-2-1' and f.is_system = true;

-- 5-3-2
insert into public.formations (name, code, description, is_system)
values ('5-3-2 (defensywny)', '5-3-2', 'Defensywny, trudny do rozbicia. Stosowany w grze o wynik.', true);
insert into public.tactical_slots (formation_id, position_id, slot_label, x, y, side, depth, display_order)
select f.id, p.id, p.position_code, v.x, v.y, v.side, v.depth, v.ord
from public.formations f
cross join lateral (values
  (1, 'GK', 50, 5, 'C', 'GK', 1),
  (5, 'CB', 70, 18, 'R', 'DEF', 2),
  (4, 'CB', 50, 18, 'C', 'DEF', 3),
  (4, 'CB', 30, 18, 'L', 'DEF', 4),
  (0, 'WB', 85, 42, 'R', 'MID', 5),
  (0, 'WB', 15, 42, 'L', 'MID', 6),
  (8, 'CM', 65, 52, 'C', 'MID', 7),
  (6, 'DM', 50, 52, 'C', 'MID', 8),
  (8, 'CM', 35, 52, 'C', 'MID', 9),
  (9, 'ST', 65, 88, 'C', 'ATT', 10),
  (9, 'ST', 35, 88, 'C', 'ATT', 11)
) as v(pos_num, code, x, y, side, depth, ord)
join public.position_dictionary p on p.position_number = v.pos_num and p.position_code = v.code
where f.code = '5-3-2' and f.is_system = true;

-- Ustaw pierwszy schemat (4-3-3) jako domyślny
update public.formations set is_default = true
where code = '4-3-3' and is_system = true
and not exists (select 1 from public.formations where is_default = true);
