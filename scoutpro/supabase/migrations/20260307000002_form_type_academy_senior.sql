-- Form type: add academy and senior for match observation (per-player form).
-- Run in separate transaction so new values are committed before use.

DO $$ BEGIN ALTER TYPE public.form_type ADD VALUE 'academy'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.form_type ADD VALUE 'senior'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
