insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'studio-assets', 'studio-assets', false, 2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table public.workspace_settings (
  id smallint primary key default 1 check (id = 1),
  studio_name text not null default 'MWTRAZO'
    check (char_length(trim(studio_name)) between 2 and 120),
  logo_path text check (
    logo_path is null
    or logo_path ~ '^branding/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$'
  ),
  email text check (email is null or char_length(email) <= 254),
  phone text check (phone is null or char_length(phone) <= 40),
  address text check (address is null or char_length(address) <= 240),
  city text not null default 'Lima' check (char_length(trim(city)) between 2 and 120),
  country text not null default 'Perú' check (char_length(trim(country)) between 2 and 120),
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.workspace_settings (id, studio_name, city, country)
values (1, 'MWTRAZO', 'Lima', 'Perú')
on conflict (id) do nothing;

create function public.protect_workspace_settings()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.id <> 1 then
    raise exception 'Solo existe una configuración global.' using errcode = 'check_violation';
  end if;
  if (select auth.uid()) is not null then
    new.updated_by := (select auth.uid());
  end if;
  return new;
end;
$$;

create trigger workspace_settings_protect
before insert or update on public.workspace_settings
for each row execute function public.protect_workspace_settings();

create trigger workspace_settings_set_updated_at
before update on public.workspace_settings
for each row execute function public.set_updated_at();

revoke all on function public.protect_workspace_settings() from public, anon, authenticated;

alter table public.workspace_settings enable row level security;
revoke all on table public.workspace_settings from anon, authenticated;
grant select on table public.workspace_settings to authenticated;
grant update (studio_name, logo_path, email, phone, address, city, country) on table public.workspace_settings to authenticated;

create policy "Active users read workspace settings"
on public.workspace_settings for select to authenticated
using ((select public.current_user_is_active()));

create policy "Admins update workspace settings"
on public.workspace_settings for update to authenticated
using ((select public.current_user_has_role('admin')))
with check ((select public.current_user_has_role('admin')) and id = 1);

create policy "Active users read studio assets"
on storage.objects for select to authenticated
using (bucket_id = 'studio-assets' and (select public.current_user_is_active()));

create policy "Admins upload studio assets"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'studio-assets'
  and (select public.current_user_has_role('admin'))
  and name ~ '^branding/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$'
);

create policy "Admins delete studio assets"
on storage.objects for delete to authenticated
using (
  bucket_id = 'studio-assets'
  and (select public.current_user_has_role('admin'))
  and name ~ '^branding/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$'
);
