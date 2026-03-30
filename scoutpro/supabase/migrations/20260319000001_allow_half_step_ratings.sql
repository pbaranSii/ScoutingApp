-- Allow half-step ratings (e.g. 3.5) for Performance / Potential fields.
-- We store them as numeric with one decimal to support 0.5 increments.

alter table public.observations
  alter column potential_now type numeric(3,1)
    using potential_now::numeric(3,1);

alter table public.observations
  alter column potential_future type numeric(3,1)
    using potential_future::numeric(3,1);

alter table public.observations
  alter column match_performance_rating type numeric(3,1)
    using match_performance_rating::numeric(3,1);

