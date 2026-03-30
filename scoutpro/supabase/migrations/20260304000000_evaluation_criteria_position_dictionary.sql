-- Migrate evaluation_criteria from positions table to position_dictionary (tactical).
-- After this, "Pozycje zawodników" dictionary is hidden in UI; criteria use Słownik pozycji (taktyka).

-- 1) Add new column (nullable first for backfill)
alter table public.evaluation_criteria
  add column if not exists position_dictionary_id uuid references public.position_dictionary(id) on delete cascade;

-- 2) Map positions.code to position_dictionary.position_code and backfill
-- positions: CDM, CAM, LCB, RCB, LM, RM, LS, RS, etc. -> position_dictionary: DM, AM, CB, CM, ST, ...
update public.evaluation_criteria ec
set position_dictionary_id = (
  select pd.id
  from public.position_dictionary pd
  where pd.position_code = case
    when p.code = 'CDM' then 'DM'
    when p.code = 'CAM' then 'AM'
    when p.code in ('LCB', 'RCB') then 'CB'
    when p.code in ('LM', 'RM') then 'CM'
    when p.code in ('LS', 'RS') then 'ST'
    else p.code
  end
  order by pd.display_order, pd.id
  limit 1
)
from public.positions p
where ec.position_id = p.id
  and ec.position_dictionary_id is null;

-- 3) Drop old FK and column only when all rows have been backfilled; then set not null
do $$
begin
  if not exists (select 1 from public.evaluation_criteria where position_dictionary_id is null) then
    alter table public.evaluation_criteria alter column position_dictionary_id set not null;
    alter table public.evaluation_criteria drop constraint if exists evaluation_criteria_position_id_fkey;
    alter table public.evaluation_criteria drop column if exists position_id;
  end if;
end $$;

comment on column public.evaluation_criteria.position_dictionary_id is 'Position from tactical position_dictionary (replaces legacy positions table).';
