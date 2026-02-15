-- Seed Mocne strony / Słabe strony (identyczny zestaw cech na start)
with v (code, name_pl, name_en, display_order) as (
  values
    ('szybkosc', 'Szybkość', 'Szybkość', 1),
    ('technika', 'Technika', 'Technika', 2),
    ('pozycjonowanie', 'Pozycjonowanie', 'Pozycjonowanie', 3),
    ('gra_glowa', 'Gra głową', 'Gra głową', 4),
    ('sila_fizyczna', 'Siła fizyczna', 'Siła fizyczna', 5),
    ('koncentracja', 'Koncentracja', 'Koncentracja', 6),
    ('drybling', 'Drybling', 'Drybling', 7),
    ('podania', 'Podania', 'Podania', 8),
    ('strzaly', 'Strzały', 'Strzały', 9),
    ('przyjecie_pilki', 'Przyjęcie piłki', 'Przyjęcie piłki', 10),
    ('wytrzymalosc', 'Wytrzymałość', 'Wytrzymałość', 11),
    ('agresywnosc', 'Agresywność', 'Agresywność', 12),
    ('wizja_gry', 'Wizja gry', 'Wizja gry', 13),
    ('finalizacja', 'Finalizacja', 'Finalizacja', 14),
    ('dosrodkowania', 'Dośrodkowania', 'Dośrodkowania', 15),
    ('gra_1_na_1', 'Gra 1 na 1', 'Gra 1 na 1', 16),
    ('pressing', 'Pressing', 'Pressing', 17),
    ('gra_bez_pilki', 'Gra bez piłki', 'Gra bez piłki', 18),
    ('komunikacja', 'Komunikacja', 'Komunikacja', 19),
    ('mentalnosc', 'Mentalność', 'Mentalność', 20),
    ('przywodztwo', 'Przywództwo', 'Przywództwo', 21),
    ('kreatywnosc', 'Kreatywność', 'Kreatywność', 22),
    ('taktyka', 'Taktyka', 'Taktyka', 23),
    ('wspolpraca_z_zespolem', 'Współpraca z zespołem', 'Współpraca z zespołem', 24),
    ('odwaga', 'Odwaga', 'Odwaga', 25),
    ('pewnosc_siebie', 'Pewność siebie', 'Pewność siebie', 26),
    ('zwinosc', 'Zwinność', 'Zwinność', 27),
    ('refleks', 'Refleks', 'Refleks', 28),
    ('gra_nogami', 'Gra nogami', 'Gra nogami', 29),
    ('wyjscia_z_bramki', 'Wyjścia z bramki', 'Wyjścia z bramki', 30)
)
insert into public.dict_strengths (code, name_pl, name_en, display_order)
select code, name_pl, name_en, display_order from v
on conflict (code) do update set name_pl = excluded.name_pl, name_en = excluded.name_en, display_order = excluded.display_order;

insert into public.dict_weaknesses (code, name_pl, name_en, display_order)
select code, name_pl, name_en, display_order from (
  values
    ('szybkosc', 'Szybkość', 'Szybkość', 1),
    ('technika', 'Technika', 'Technika', 2),
    ('pozycjonowanie', 'Pozycjonowanie', 'Pozycjonowanie', 3),
    ('gra_glowa', 'Gra głową', 'Gra głową', 4),
    ('sila_fizyczna', 'Siła fizyczna', 'Siła fizyczna', 5),
    ('koncentracja', 'Koncentracja', 'Koncentracja', 6),
    ('drybling', 'Drybling', 'Drybling', 7),
    ('podania', 'Podania', 'Podania', 8),
    ('strzaly', 'Strzały', 'Strzały', 9),
    ('przyjecie_pilki', 'Przyjęcie piłki', 'Przyjęcie piłki', 10),
    ('wytrzymalosc', 'Wytrzymałość', 'Wytrzymałość', 11),
    ('agresywnosc', 'Agresywność', 'Agresywność', 12),
    ('wizja_gry', 'Wizja gry', 'Wizja gry', 13),
    ('finalizacja', 'Finalizacja', 'Finalizacja', 14),
    ('dosrodkowania', 'Dośrodkowania', 'Dośrodkowania', 15),
    ('gra_1_na_1', 'Gra 1 na 1', 'Gra 1 na 1', 16),
    ('pressing', 'Pressing', 'Pressing', 17),
    ('gra_bez_pilki', 'Gra bez piłki', 'Gra bez piłki', 18),
    ('komunikacja', 'Komunikacja', 'Komunikacja', 19),
    ('mentalnosc', 'Mentalność', 'Mentalność', 20),
    ('przywodztwo', 'Przywództwo', 'Przywództwo', 21),
    ('kreatywnosc', 'Kreatywność', 'Kreatywność', 22),
    ('taktyka', 'Taktyka', 'Taktyka', 23),
    ('wspolpraca_z_zespolem', 'Współpraca z zespołem', 'Współpraca z zespołem', 24),
    ('odwaga', 'Odwaga', 'Odwaga', 25),
    ('pewnosc_siebie', 'Pewność siebie', 'Pewność siebie', 26),
    ('zwinosc', 'Zwinność', 'Zwinność', 27),
    ('refleks', 'Refleks', 'Refleks', 28),
    ('gra_nogami', 'Gra nogami', 'Gra nogami', 29),
    ('wyjscia_z_bramki', 'Wyjścia z bramki', 'Wyjścia z bramki', 30)
) as v(code, name_pl, name_en, display_order)
on conflict (code) do update set name_pl = excluded.name_pl, name_en = excluded.name_en, display_order = excluded.display_order;
