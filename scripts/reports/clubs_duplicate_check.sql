-- Detect duplicate clubs by normalized (name, city).
-- Normalization: lower + trim + NBSP->space + tab->space + collapse whitespace; city NULL treated as ''.
with norm as (
  select
    id,
    name,
    city,
    regexp_replace(lower(trim(replace(replace(name, chr(160), ' '), chr(9), ' '))), '\s+', ' ', 'g') as name_norm,
    regexp_replace(lower(trim(replace(replace(coalesce(city, ''), chr(160), ' '), chr(9), ' '))), '\s+', ' ', 'g') as city_norm
  from public.clubs
)
select
  name_norm,
  city_norm,
  count(*) as cnt,
  json_agg(json_build_object('id', id, 'name', name, 'city', city) order by id) as rows
from norm
group by 1,2
having count(*) > 1
order by cnt desc, name_norm, city_norm;

