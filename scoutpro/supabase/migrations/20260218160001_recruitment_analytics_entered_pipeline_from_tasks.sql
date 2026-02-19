-- Backfill players.entered_pipeline_at considering observation tasks as first contact.

with first_contact as (
  select x.player_id, min(x.fc_at) as entered_at
    from (
      -- Observation tasks linked to player
      select tp.player_id, t.created_at as fc_at
        from public.tasks t
        join public.task_players tp on tp.task_id = t.id
       where t.type = 'observation'
      union all
      -- Observations (first contact date)
      select o.player_id, o.first_contact_date as fc_at
        from public.observations o
    ) x
   group by x.player_id
)
update public.players p
   set entered_pipeline_at = coalesce(p.entered_pipeline_at, fc.entered_at, p.created_at)
  from first_contact fc
 where p.id = fc.player_id
   and (p.entered_pipeline_at is null or p.entered_pipeline_at > fc.entered_at);

