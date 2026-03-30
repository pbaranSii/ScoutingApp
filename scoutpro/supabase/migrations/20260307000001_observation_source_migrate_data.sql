-- Observation source: migrate data to new values; context_type no longer used in UI.

-- 1. match_observations: derive source from context_type where needed, then migrate old source values
UPDATE public.match_observations SET source = 'tournament' WHERE context_type = 'tournament';
UPDATE public.match_observations SET source = 'live_match' WHERE source = 'scouting';
UPDATE public.match_observations SET source = 'video_match' WHERE source = 'video_analysis';

-- 2. observations: same mapping (for standalone and match-linked)
UPDATE public.observations SET source = 'live_match' WHERE source = 'scouting';
UPDATE public.observations SET source = 'video_match' WHERE source = 'video_analysis';

-- 3. context_type: make nullable so form no longer depends on it (column kept for legacy reads)
ALTER TABLE public.match_observations ALTER COLUMN context_type DROP NOT NULL;
