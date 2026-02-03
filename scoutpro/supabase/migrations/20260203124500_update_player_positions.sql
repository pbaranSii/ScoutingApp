update public.players
set primary_position = case primary_position
  when '1' then 'GK'
  when '2' then 'RB'
  when '3' then 'LB'
  when '4' then 'CB'
  when '6' then 'CDM'
  when '7' then 'RW'
  when '8' then 'CM'
  when '9' then 'ST'
  when '10' then 'CAM'
  when '11' then 'LW'
  else primary_position
end
where primary_position in ('1', '2', '3', '4', '6', '7', '8', '9', '10', '11');
