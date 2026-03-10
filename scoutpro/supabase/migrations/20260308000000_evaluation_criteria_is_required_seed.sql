-- Set is_required = true for position-specific criteria per plan (Formularze obserwacji).
-- Uses position_dictionary.position_code and evaluation_criteria.name (exact match to seed).
-- Runs only when evaluation_criteria.position_dictionary_id exists (after 20260304000000).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'evaluation_criteria' AND column_name = 'position_dictionary_id'
  ) THEN
    RETURN;
  END IF;

  -- 2, 3 (RB, LB)
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

  -- 4, 5 (CB)
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

  -- 6 (DM)
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

  -- 7, 11 (RW, LW)
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

  -- 8, 10 (CM, AM)
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

  -- 9 (ST)
  UPDATE public.evaluation_criteria ec
  SET is_required = true
  FROM public.position_dictionary pd
  WHERE ec.position_dictionary_id = pd.id
    AND pd.position_code = 'ST'
    AND ec.name = 'Gra tyłem do bramki (ochrona piłki, podanie zwrotne, przyjęcie pod presją)';
END $$;
