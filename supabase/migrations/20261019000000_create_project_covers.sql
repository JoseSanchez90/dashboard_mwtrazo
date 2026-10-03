insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-covers', 'project-covers', false, 5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Active users read project covers"
on storage.objects for select to authenticated
using (
  bucket_id = 'project-covers'
  and (select public.current_user_is_active())
);

create policy "Active project editors upload own covers"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'project-covers'
  and (select public.current_user_is_active())
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$'
);

create policy "Users delete own uncommitted project covers"
on storage.objects for delete to authenticated
using (
  bucket_id = 'project-covers'
  and (select public.current_user_is_active())
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
