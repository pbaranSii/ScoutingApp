-- RPC: return player_ids whose latest observation matches optional recommendation and potential_now range.
-- Used by players list filters (rekomendacja, performance).
create or replace function public.get_player_ids_by_last_observation(
  p_recommendation text default null,
  p_potential_now_min int default null,
  p_potential_now_max int default null
)
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select distinct o.player_id
  from observations o
  inner join (
    select player_id, max(observation_date) as last_date
    from observations
    group by player_id
  ) latest on o.player_id = latest.player_id and o.observation_date = latest.last_date
  where (p_recommendation is null or o.recommendation::text = p_recommendation)
    and (p_potential_now_min is null or (o.potential_now is not null and o.potential_now >= p_potential_now_min))
    and (p_potential_now_max is null or (o.potential_now is not null and o.potential_now <= p_potential_now_max));
$$;

comment on function public.get_player_ids_by_last_observation is 'Returns player IDs whose most recent observation matches the given recommendation and/or potential_now range. Used for player list filters.';
