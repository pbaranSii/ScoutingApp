-- Step 1: Add 'unassigned' to pipeline_status enum (must run in its own transaction).
-- PostgreSQL does not allow using a newly added enum value in the same transaction.
DO $$
BEGIN
  ALTER TYPE public.pipeline_status ADD VALUE 'unassigned';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;
