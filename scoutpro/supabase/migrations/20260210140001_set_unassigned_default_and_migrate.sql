-- Step 2: Set default and migrate data (runs after enum value is committed).
ALTER TABLE public.players ALTER COLUMN pipeline_status SET DEFAULT 'unassigned';

UPDATE public.players SET pipeline_status = 'unassigned' WHERE pipeline_status = 'observed';
