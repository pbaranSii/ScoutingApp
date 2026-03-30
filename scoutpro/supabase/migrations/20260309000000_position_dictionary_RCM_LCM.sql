-- Add RCM and LCM to position_dictionary (Środkowy pomocnik prawy/lewy). Same form params as CM via API fallback.

INSERT INTO public.position_dictionary (position_number, position_code, position_name_pl, description, display_order)
VALUES
  (8, 'RCM', 'Środkowy pomocnik (prawy)', 'Środkowy pomocnik po prawej stronie linii pomocy', 17),
  (8, 'LCM', 'Środkowy pomocnik (lewy)', 'Środkowy pomocnik po lewej stronie linii pomocy', 18)
ON CONFLICT (position_number, position_code) DO NOTHING;
