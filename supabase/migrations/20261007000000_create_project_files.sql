create type public.project_file_category as enum ('plans', 'renders', 'contracts', 'budgets', 'references', 'deliverables', 'others');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-files', 'project-files', false, 26214400,
  array[
    'application/pdf', 'image/jpeg', 'image/png', 'image/webp',
    'application/acad', 'application/x-acad', 'image/vnd.dwg', 'application/dxf', 'image/vnd.dxf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip', 'application/x-zip-compressed', 'application/octet-stream'
  ]
)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create table public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete restrict,
  uploaded_by uuid not null references public.profiles (id) on delete restrict,
  file_name text not null check (char_length(trim(file_name)) between 1 and 180),
  file_path text not null unique check (char_length(file_path) between 10 and 500),
  file_type text not null check (char_length(file_type) between 3 and 150),
  file_size bigint not null check (file_size > 0 and file_size <= 26214400),
  category public.project_file_category not null default 'others',
  created_at timestamptz not null default timezone('utc', now()),
  constraint project_files_path_matches_project check (file_path like project_id::text || '/%')
);

create index project_files_project_id_idx on public.project_files (project_id);
create index project_files_uploaded_by_idx on public.project_files (uploaded_by);
create index project_files_category_idx on public.project_files (category);
create index project_files_created_at_idx on public.project_files (created_at desc);

alter table public.project_files enable row level security;
revoke all on table public.project_files from anon, authenticated;
grant select, insert, delete on table public.project_files to authenticated;

create policy "Active users can read project files" on public.project_files for select to authenticated
using ((select public.current_user_is_active()));
create policy "Active users can register project files" on public.project_files for insert to authenticated
with check ((select public.current_user_is_active()) and uploaded_by = (select auth.uid()));
create policy "Admins can delete project files" on public.project_files for delete to authenticated
using ((select public.current_user_has_role('admin')));

create policy "Active users can read private project objects" on storage.objects for select to authenticated
using (bucket_id = 'project-files' and (select public.current_user_is_active()));
create policy "Active users can upload private project objects" on storage.objects for insert to authenticated
with check (
  bucket_id = 'project-files'
  and (select public.current_user_is_active())
  and array_length(storage.foldername(name), 1) >= 2
  and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
  and exists (
    select 1 from public.projects project
    where project.id::text = (storage.foldername(name))[1]
  )
);
create policy "Admins can delete private project objects" on storage.objects for delete to authenticated
using (bucket_id = 'project-files' and (select public.current_user_has_role('admin')));

