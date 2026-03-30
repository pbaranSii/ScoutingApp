-- Add LCB and RCB to position_dictionary (L = lewy, R = prawy). CM (8) already exists.

INSERT INTO public.position_dictionary (position_number, position_code, position_name_pl, description, display_order)
VALUES
  (4, 'LCB', 'Środkowy obrońca lewy', 'Stoper lewa strona osi defensywy', 15),
  (5, 'RCB', 'Środkowy obrońca prawy', 'Stoper prawa strona osi defensywy', 16)
ON CONFLICT (position_number, position_code) DO NOTHING;
