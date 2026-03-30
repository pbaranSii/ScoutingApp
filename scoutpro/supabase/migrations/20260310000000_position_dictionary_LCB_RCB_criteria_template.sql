-- LCB and RCB (position numbers 4 and 5) use the same Senior observation form as CB.
-- Set criteria_template_position_id so fetchEvaluationCriteriaByPositionCode returns CB's criteria.

UPDATE public.position_dictionary
SET criteria_template_position_id = (
  SELECT id
  FROM public.position_dictionary
  WHERE position_code = 'CB'
  ORDER BY display_order, id
  LIMIT 1
)
WHERE position_code IN ('LCB', 'RCB');
