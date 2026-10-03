alter table public.project_files
  add column if not exists stored_size bigint,
  add column if not exists compression text not null default 'none';

update public.project_files
set stored_size = file_size
where stored_size is null;

alter table public.project_files
  alter column stored_size set not null,
  add constraint project_files_stored_size_valid
    check (stored_size > 0 and stored_size <= 26214400),
  add constraint project_files_compression_valid
    check (compression in ('none', 'gzip')),
  add constraint project_files_compressed_size_valid
    check (compression = 'none' or stored_size < file_size);

comment on column public.project_files.file_size is 'Tamaño original del archivo en bytes.';
comment on column public.project_files.stored_size is 'Tamaño realmente ocupado en Storage, después de compresión.';
comment on column public.project_files.compression is 'Codificación aplicada al objeto privado: none o gzip.';
