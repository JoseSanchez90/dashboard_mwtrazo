-- Self-service profile editing and private avatar storage.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create function public.protect_profile_self_service_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    return new;
  end if;

  if (select auth.uid()) <> old.id then
    raise exception 'Solo puedes editar tu propio perfil.'
      using errcode = 'insufficient_privilege';
  end if;

  if new.id is distinct from old.id
    or new.role is distinct from old.role
    or new.is_active is distinct from old.is_active
    or new.created_at is distinct from old.created_at then
    raise exception 'No puedes modificar campos administrativos del perfil.'
      using errcode = 'insufficient_privilege';
  end if;

  if new.avatar_url is not null and new.avatar_url !~ (
    '^' || old.id::text ||
    '/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$'
  ) then
    raise exception 'La ruta del avatar no es válida.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger profiles_protect_self_service_fields
before update on public.profiles
for each row execute function public.protect_profile_self_service_fields();

revoke all on function public.protect_profile_self_service_fields()
from public, anon, authenticated;

grant update (full_name, avatar_url) on public.profiles to authenticated;

create policy "Active users can update their own profile"
on public.profiles for update to authenticated
using (
  id = (select auth.uid())
  and (select public.current_user_is_active())
)
with check (
  id = (select auth.uid())
  and (select public.current_user_is_active())
);

create policy "Users can read their own avatar"
on storage.objects for select to authenticated
using (
  bucket_id = 'avatars'
  and (select public.current_user_is_active())
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can upload their own avatar"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (select public.current_user_is_active())
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and storage.filename(name) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$'
);

create policy "Users can delete their own avatar"
on storage.objects for delete to authenticated
using (
  bucket_id = 'avatars'
  and (select public.current_user_is_active())
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
