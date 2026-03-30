-- Ensure multimedia table and storage are applied (idempotent).
-- Run this in Supabase SQL Editor if uploads from the observation form do not work.
-- Combines: 20260210160000_add_multimedia_table_and_storage.sql + 20260210160001_storage_bucket_scoutpro_media.sql

-- 1. Enum for multimedia file type
do $$ begin
  create type public.multimedia_file_type as enum ('image', 'video', 'youtube_link');
exception
  when duplicate_object then null;
end $$;

-- 2. Multimedia table
create table if not exists public.multimedia (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  observation_id uuid references public.observations(id) on delete set null,

  file_name text not null default '',
  file_type public.multimedia_file_type not null,
  file_size bigint,
  file_format text,
  storage_path text,

  youtube_url text,
  youtube_video_id text,
  youtube_title text,
  youtube_thumbnail_url text,
  youtube_duration_seconds integer,

  created_by uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sync_status public.sync_status not null default 'synced',
  sync_error_message text
);

create index if not exists idx_multimedia_player_id on public.multimedia(player_id);
create index if not exists idx_multimedia_observation_id on public.multimedia(observation_id);
create index if not exists idx_multimedia_created_at on public.multimedia(created_at desc);
create index if not exists idx_multimedia_sync_status on public.multimedia(sync_status);

alter table public.multimedia enable row level security;

drop policy if exists "Multimedia viewable by authenticated" on public.multimedia;
create policy "Multimedia viewable by authenticated"
  on public.multimedia for select to authenticated using (true);

drop policy if exists "Multimedia insert by authenticated" on public.multimedia;
create policy "Multimedia insert by authenticated"
  on public.multimedia for insert to authenticated
  with check (created_by = auth.uid() or public.is_admin());

drop policy if exists "Multimedia delete by creator or admin" on public.multimedia;
create policy "Multimedia delete by creator or admin"
  on public.multimedia for delete to authenticated
  using (created_by = auth.uid() or public.is_admin());

comment on table public.multimedia is 'Media attachments (images, videos, YouTube links) for players and observations.';

-- 3. Storage bucket (requires Storage enabled in Supabase project)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'scoutpro-media',
  'scoutpro-media',
  true,
  209715200,
  array['image/jpeg', 'image/png', 'image/jpg', 'video/mp4', 'video/quicktime']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "scoutpro_media_select" on storage.objects;
create policy "scoutpro_media_select"
  on storage.objects for select to authenticated
  using (bucket_id = 'scoutpro-media');

drop policy if exists "scoutpro_media_insert" on storage.objects;
create policy "scoutpro_media_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'scoutpro-media');

drop policy if exists "scoutpro_media_delete" on storage.objects;
create policy "scoutpro_media_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'scoutpro-media');
