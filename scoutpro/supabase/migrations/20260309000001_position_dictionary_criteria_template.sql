-- Allow a position to use another position's evaluation criteria (Senior form) as template.

ALTER TABLE public.position_dictionary
  ADD COLUMN IF NOT EXISTS criteria_template_position_id uuid REFERENCES public.position_dictionary(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.position_dictionary.criteria_template_position_id IS 'If set, observation form (Senior) uses this position''s evaluation criteria instead of this position''s own.';
