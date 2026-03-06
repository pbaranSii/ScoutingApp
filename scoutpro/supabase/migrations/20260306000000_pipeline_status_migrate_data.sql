-- Pipeline status (2/2): migrate data and replace enum. Run after 20260306000000_pipeline_status_add_enum_values.sql.

-- 1. pipeline_history (from_status, to_status are text)
UPDATE public.pipeline_history SET from_status = 'in_contact' WHERE from_status = 'shortlist';
UPDATE public.pipeline_history SET from_status = 'evaluation' WHERE from_status = 'trial';
UPDATE public.pipeline_history SET from_status = 'rejected_by_club' WHERE from_status = 'rejected';

UPDATE public.pipeline_history SET to_status = 'in_contact' WHERE to_status = 'shortlist';
UPDATE public.pipeline_history SET to_status = 'evaluation' WHERE to_status = 'trial';
UPDATE public.pipeline_history SET to_status = 'rejected_by_club' WHERE to_status = 'rejected';

-- 2. Update players to new codes (new enum values already committed in previous migration)
UPDATE public.players SET pipeline_status = 'in_contact' WHERE pipeline_status = 'shortlist';
UPDATE public.players SET pipeline_status = 'evaluation' WHERE pipeline_status = 'trial';
UPDATE public.players SET pipeline_status = 'rejected_by_club' WHERE pipeline_status = 'rejected';

-- 3. Replace enum: rename old type, create new type with only 9 values, alter column, drop old type
ALTER TABLE public.players ALTER COLUMN pipeline_status DROP DEFAULT;

ALTER TYPE public.pipeline_status RENAME TO pipeline_status_old;

CREATE TYPE public.pipeline_status AS ENUM (
  'unassigned',
  'observed',
  'in_contact',
  'evaluation',
  'offer',
  'signed',
  'rejected_by_club',
  'rejected_by_player',
  'out_of_reach'
);

ALTER TABLE public.players
  ALTER COLUMN pipeline_status TYPE public.pipeline_status
  USING (
    CASE pipeline_status::text
      WHEN 'shortlist' THEN 'in_contact'::public.pipeline_status
      WHEN 'trial' THEN 'evaluation'::public.pipeline_status
      WHEN 'rejected' THEN 'rejected_by_club'::public.pipeline_status
      WHEN 'unassigned' THEN 'unassigned'::public.pipeline_status
      WHEN 'observed' THEN 'observed'::public.pipeline_status
      WHEN 'offer' THEN 'offer'::public.pipeline_status
      WHEN 'signed' THEN 'signed'::public.pipeline_status
      WHEN 'in_contact' THEN 'in_contact'::public.pipeline_status
      WHEN 'evaluation' THEN 'evaluation'::public.pipeline_status
      WHEN 'rejected_by_club' THEN 'rejected_by_club'::public.pipeline_status
      WHEN 'rejected_by_player' THEN 'rejected_by_player'::public.pipeline_status
      WHEN 'out_of_reach' THEN 'out_of_reach'::public.pipeline_status
      ELSE 'observed'::public.pipeline_status
    END
  );

ALTER TABLE public.players ALTER COLUMN pipeline_status SET DEFAULT 'unassigned'::public.pipeline_status;

DROP TYPE public.pipeline_status_old;
