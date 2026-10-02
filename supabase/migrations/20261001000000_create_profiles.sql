create type public.user_role as enum ('admin', 'assistant');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 3 and 120),
  avatar_url text,
  role public.user_role not null default 'assistant',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.profiles is 'Perfil empresarial uno a uno para cada usuario de Supabase Auth.';
comment on column public.profiles.role is 'Rol autorizado por el servidor; nunca se deriva de metadatos enviados por el cliente.';

create index profiles_role_idx on public.profiles (role);
create index profiles_active_idx on public.profiles (is_active) where is_active = true;

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_name text;
begin
  profile_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Usuario MWTRAZO'
  );

  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    profile_name,
    nullif(trim(new.raw_user_meta_data ->> 'avatar_url'), '')
  );

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create function public.prevent_last_active_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  loses_admin_access boolean;
begin
  if old.role <> 'admin' or not old.is_active then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;

  if tg_op = 'DELETE' then
    loses_admin_access := true;
  else
    loses_admin_access := new.role <> 'admin' or not new.is_active;
  end if;

  if loses_admin_access and not exists (
    select 1
    from public.profiles
    where id <> old.id and role = 'admin' and is_active = true
  ) then
    raise exception 'MWTRAZO requiere al menos un administrador activo.'
      using errcode = 'check_violation';
  end if;

  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

create trigger profiles_keep_active_admin
before update or delete on public.profiles
for each row execute function public.prevent_last_active_admin();

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
revoke all on function public.prevent_last_active_admin() from public, anon, authenticated;

alter table public.profiles enable row level security;

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

