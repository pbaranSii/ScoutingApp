-- Niezależne pole opisu dla mocnych/słabych stron (tekst dowolny, bez wpływu na tagi)
alter table public.observations
  add column if not exists strengths_notes text,
  add column if not exists weaknesses_notes text;
