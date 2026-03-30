-- Backfill players.age_category_id when missing.
-- This fixes cases where older records were created with NULL age_category_id
-- and therefore fail RLS "Players area gate insert/update" for non-admin users.

update public.players p
set age_category_id = coalesce(
  -- 1) Akademia by age rules
  (
    select cat.id
    from public.categories cat
    where cat.is_active = true
      and cat.area::text = 'AKADEMIA'
      and (
        (cat.age_under is not null and p.birth_year = extract(year from now())::int - cat.age_under)
        or (
          cat.min_birth_year is not null
          and cat.max_birth_year is not null
          and p.birth_year between cat.min_birth_year and cat.max_birth_year
        )
      )
    order by
      case when cat.age_under is not null then 0 else 1 end,
      cat.max_birth_year desc nulls last,
      cat.min_birth_year desc nulls last
    limit 1
  ),
  -- 2) Senior by age rules
  (
    select cat.id
    from public.categories cat
    where cat.is_active = true
      and cat.area::text = 'SENIOR'
      and (
        (cat.age_under is not null and p.birth_year = extract(year from now())::int - cat.age_under)
        or (
          cat.min_birth_year is not null
          and cat.max_birth_year is not null
          and p.birth_year between cat.min_birth_year and cat.max_birth_year
        )
      )
    order by
      case when cat.age_under is not null then 0 else 1 end,
      cat.max_birth_year desc nulls last,
      cat.min_birth_year desc nulls last
    limit 1
  ),
  -- 3) Fallback: any active Senior category (covers SENIOR categories without age rules)
  (
    select cat.id
    from public.categories cat
    where cat.is_active = true
      and cat.area::text = 'SENIOR'
    order by cat.created_at desc
    limit 1
  ),
  -- 4) Last resort: any active category
  (
    select cat.id
    from public.categories cat
    where cat.is_active = true
    order by cat.created_at desc
    limit 1
  )
)
where p.age_category_id is null;

