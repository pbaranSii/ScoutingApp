-- Pipeline status (1/2): add new enum values. Must run and commit before using them.
-- Run 20260306000000_pipeline_status_migrate_data.sql after this.

DO $$ BEGIN ALTER TYPE public.pipeline_status ADD VALUE 'in_contact'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.pipeline_status ADD VALUE 'evaluation'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.pipeline_status ADD VALUE 'rejected_by_club'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.pipeline_status ADD VALUE 'rejected_by_player'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.pipeline_status ADD VALUE 'out_of_reach'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
