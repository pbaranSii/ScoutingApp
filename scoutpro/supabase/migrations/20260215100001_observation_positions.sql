-- Store observed positions per observation (array of position codes)
alter table public.observations
  add column if not exists positions text[] default '{}';

comment on column public.observations.positions is 'Position codes observed (e.g. CAM, CM). primary_position is the main one.';
