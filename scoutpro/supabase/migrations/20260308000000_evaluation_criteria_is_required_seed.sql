-- Set is_required = true for position-specific criteria per plan (Formularze obserwacji).
-- Uses position_dictionary.position_code and evaluation_criteria.name (exact match to seed).

-- 2, 3 (RB, LB): 1v1 w defensywie; Obrona pola karnego (kontrola i gra w kontakcie); Dośrodkowanie w pełnym biegu
UPDATE public.evaluation_criteria ec
SET is_required = true
FROM public.position_dictionary pd
WHERE ec.position_dictionary_id = pd.id
  AND pd.position_code IN ('RB', 'LB')
  AND ec.name IN (
    '1v1 w defensywie',
    'Obrona pola karnego (kontrola i gra w kontakcie)',
    'Dośrodkowanie w pełnym biegu'
  );

-- 4, 5 (CB): 1v1 z przeciwnikiem przodem i plecami do obrońcy; Gra 1v1 w powietrzu; Wyprowadzenie piłki pod presją (prowadzeniem lub podaniem)
UPDATE public.evaluation_criteria ec
SET is_required = true
FROM public.position_dictionary pd
WHERE ec.position_dictionary_id = pd.id
  AND pd.position_code = 'CB'
  AND ec.name IN (
    '1v1 z przeciwnikiem przodem i plecami do obrońcy',
    'Gra 1v1 w powietrzu',
    'Wyprowadzenie piłki pod presją (prowadzeniem lub podaniem)'
  );

-- 6 (DM): Gra w defensywie (odbiór, doskok, pierwsze metry); Gra 1v1 w powietrzu; Podanie progresywne po ziemi i górne
UPDATE public.evaluation_criteria ec
SET is_required = true
FROM public.position_dictionary pd
WHERE ec.position_dictionary_id = pd.id
  AND pd.position_code = 'DM'
  AND ec.name IN (
    'Gra w defensywie (odbiór, doskok, pierwsze metry)',
    'Gra 1v1 w powietrzu',
    'Podanie progresywne po ziemi i górne'
  );

-- 7, 11 (RW, LW): Gra 1v1 (drybling); Skuteczna decyzyjność w 3. tercji; Szybkość z piłką i bez piłki
UPDATE public.evaluation_criteria ec
SET is_required = true
FROM public.position_dictionary pd
WHERE ec.position_dictionary_id = pd.id
  AND pd.position_code IN ('RW', 'LW')
  AND ec.name IN (
    'Gra 1v1 (drybling)',
    'Skuteczna decyzyjność w 3. tercji',
    'Szybkość z piłką i bez piłki'
  );

-- 8, 10 (CM, AM): Gra w defensywie (odbiór); Zbieranie drugich piłek; Umiejętność wygrywania pojedynków w ofensywie; Podanie progresywne
UPDATE public.evaluation_criteria ec
SET is_required = true
FROM public.position_dictionary pd
WHERE ec.position_dictionary_id = pd.id
  AND pd.position_code IN ('CM', 'AM')
  AND ec.name IN (
    'Gra w defensywie (odbiór)',
    'Zbieranie drugich piłek',
    'Umiejętność wygrywania pojedynków w ofensywie',
    'Podanie progresywne'
  );

-- 9 (ST): Gra tyłem do bramki (ochrona piłki, podanie zwrotne, przyjęcie pod presją)
UPDATE public.evaluation_criteria ec
SET is_required = true
FROM public.position_dictionary pd
WHERE ec.position_dictionary_id = pd.id
  AND pd.position_code = 'ST'
  AND ec.name = 'Gra tyłem do bramki (ochrona piłki, podanie zwrotne, przyjęcie pod presją)';
