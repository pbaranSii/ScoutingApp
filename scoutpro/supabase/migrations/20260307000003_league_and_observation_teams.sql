-- Liga (match + individual) and home_team/away_team/match_result on observations (individual).

-- 1. League on match_observations
ALTER TABLE public.match_observations ADD COLUMN IF NOT EXISTS league text;

-- 2. League on observations (individual context)
ALTER TABLE public.observations ADD COLUMN IF NOT EXISTS league text;

-- 3. Optional match context on observations (for individual: gospodarz, gość, wynik)
ALTER TABLE public.observations ADD COLUMN IF NOT EXISTS home_team text;
ALTER TABLE public.observations ADD COLUMN IF NOT EXISTS away_team text;
-- match_result may already exist on observations from older migration; add if not exists is safe
ALTER TABLE public.observations ADD COLUMN IF NOT EXISTS match_result text;
