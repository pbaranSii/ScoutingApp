-- Zadanie 1: Deduplikacja kryteriów po migracji LCB/RCB/CB -> jeden position_dictionary_id (CB).
-- Dla każdego (position_dictionary_id, section, code) zostawiamy jeden wiersz (najmniejszy id).
-- Następnie korygujemy nazwy kryteriów dla CB do wymaganego brzmienia.

-- 1) Usuń duplikaty: zostaw jeden wiersz na (position_dictionary_id, section, code)
DELETE FROM public.evaluation_criteria ec
WHERE ec.id IN (
  SELECT id FROM (
    SELECT id,
      row_number() OVER (
        PARTITION BY position_dictionary_id, section, COALESCE(code, name)
        ORDER BY id
      ) AS rn
    FROM public.evaluation_criteria
  ) sub
  WHERE sub.rn > 1
);

-- 2) Korekta nazw dla kryteriów przypisanych do pozycji CB
UPDATE public.evaluation_criteria ec
SET name = CASE ec.name
  WHEN '1v1 z przeciwnikiem przodem i plecami do obrońcy'
    THEN '1v1 w defensywie z przeciwnikiem przodem i plecami do obrońcy'
  WHEN 'Wyprowadzenie piłki pod presją (prowadzeniem lub podaniem)'
    THEN 'Wyprowadzenie piłki pod presją przeciwnika (prowadzeniem lub podaniem)'
  ELSE ec.name
END
FROM public.position_dictionary pd
WHERE ec.position_dictionary_id = pd.id
  AND pd.position_code = 'CB'
  AND ec.name IN (
    '1v1 z przeciwnikiem przodem i plecami do obrońcy',
    'Wyprowadzenie piłki pod presją (prowadzeniem lub podaniem)'
  );
