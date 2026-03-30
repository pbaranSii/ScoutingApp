-- Wymagalność kryteriów pozycyjnych (czerwone w UI). Lista kryteriów is_required = true do uzupełnienia po dostarczeniu listy przez Igora.

ALTER TABLE public.evaluation_criteria ADD COLUMN IF NOT EXISTS is_required boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.evaluation_criteria.is_required IS 'When true, criterion is required on extended form (red star, validation blocks save).';
