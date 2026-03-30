-- Pipeline status (patch): backfill legacy codes without relying on legacy enum labels.
-- This is safe on already-migrated dev DBs (will update 0 rows).

update public.pipeline_history set from_status = 'in_contact' where from_status = 'shortlist';
update public.pipeline_history set from_status = 'evaluation' where from_status = 'trial';
update public.pipeline_history set from_status = 'rejected_by_club' where from_status = 'rejected';

update public.pipeline_history set to_status = 'in_contact' where to_status = 'shortlist';
update public.pipeline_history set to_status = 'evaluation' where to_status = 'trial';
update public.pipeline_history set to_status = 'rejected_by_club' where to_status = 'rejected';

-- players.pipeline_status is enum; compare using ::text to avoid invalid enum literals
update public.players set pipeline_status = 'in_contact' where pipeline_status::text = 'shortlist';
update public.players set pipeline_status = 'evaluation' where pipeline_status::text = 'trial';
update public.players set pipeline_status = 'rejected_by_club' where pipeline_status::text = 'rejected';

