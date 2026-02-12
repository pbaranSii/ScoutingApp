-- Create storage bucket for scoutpro media (images, videos).
-- If running locally or with storage schema available.

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

-- Allow authenticated users to read all objects in scoutpro-media
drop policy if exists "scoutpro_media_select" on storage.objects;
create policy "scoutpro_media_select"
on storage.objects for select
to authenticated
using (bucket_id = 'scoutpro-media');

-- Allow authenticated users to upload (insert) to scoutpro-media
drop policy if exists "scoutpro_media_insert" on storage.objects;
create policy "scoutpro_media_insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'scoutpro-media');

-- Allow authenticated users to delete their uploads (or we could allow all authenticated)
drop policy if exists "scoutpro_media_delete" on storage.objects;
create policy "scoutpro_media_delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'scoutpro-media');
