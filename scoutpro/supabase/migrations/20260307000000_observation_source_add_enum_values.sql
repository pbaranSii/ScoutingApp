-- Observation source: add new enum values. Must commit before using in same session.
-- Run 20260307000001_observation_source_migrate_data.sql after this.

DO $$ BEGIN ALTER TYPE public.observation_source ADD VALUE 'live_match'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.observation_source ADD VALUE 'video_match'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.observation_source ADD VALUE 'video_clips'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
