-- Rename transition criteria \"Opis\" to full phase labels
-- and drop duplicate headers from position_form_template_element.

-- 1) Rename criteria names for transition_oa / transition_ao
update public.evaluation_criteria
set name = 'FAZA PRZEJŚCIOWA O→A'
where section = 'transition_oa'
  and name = 'Opis';

update public.evaluation_criteria
set name = 'FAZA PRZEJŚCIOWA A→O'
where section = 'transition_ao'
  and name = 'Opis';

-- 2) Remove headers that duplicate these labels in form templates
delete from public.position_form_template_element
where element_type = 'header'
  and header_label in ('FAZA PRZEJŚCIOWA O→A', 'FAZA PRZEJŚCIOWA A→O');

