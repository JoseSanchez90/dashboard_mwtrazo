create type public.project_status as enum (
  'draft',
  'active',
  'on_hold',
  'completed',
  'cancelled'
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  name text not null check (char_length(trim(name)) between 2 and 180),
  code text not null check (char_length(trim(code)) between 2 and 40),
  description text check (description is null or char_length(description) <= 4000),
  project_type text check (project_type is null or char_length(project_type) <= 100),
  service_type text check (service_type is null or char_length(service_type) <= 100),
  address text check (address is null or char_length(address) <= 240),
  district text check (district is null or char_length(district) <= 120),
  city text check (city is null or char_length(city) <= 120),
  area_m2 numeric(12, 2) check (area_m2 is null or area_m2 > 0),
  status public.project_status not null default 'draft',
  phase text check (phase is null or char_length(phase) <= 120),
  start_date date,
  due_date date,
  progress smallint not null default 0 check (progress between 0 and 100),
  fee numeric(14, 2) check (fee is null or fee >= 0),
  cover_image text check (cover_image is null or char_length(cover_image) <= 1000),
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint projects_date_order check (
    start_date is null or due_date is null or due_date >= start_date
  )
);

create unique index projects_code_unique_idx on public.projects (lower(code));
create index projects_client_id_idx on public.projects (client_id);
create index projects_status_idx on public.projects (status);
create index projects_due_date_idx on public.projects (due_date) where due_date is not null;
create index projects_created_by_idx on public.projects (created_by);

create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create table public.project_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete restrict,
  participation_role text check (
    participation_role is null or char_length(participation_role) <= 100
  ),
  is_lead boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (project_id, user_id)
);

create unique index project_members_one_lead_idx
on public.project_members (project_id)
where is_lead = true;
create index project_members_user_id_idx on public.project_members (user_id);

create function public.protect_project_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_role public.user_role;
begin
  select role into current_role
  from public.profiles
  where id = (select auth.uid()) and is_active = true;

  if current_role is null then
    raise exception 'Usuario inactivo o sin perfil.' using errcode = 'insufficient_privilege';
  end if;

  if current_role = 'assistant' and (
    new.client_id is distinct from old.client_id
    or new.code is distinct from old.code
    or new.fee is distinct from old.fee
    or new.created_by is distinct from old.created_by
  ) then
    raise exception 'El asistente no puede modificar campos administrativos del proyecto.'
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$$;

create trigger projects_protect_admin_fields
before update on public.projects
for each row execute function public.protect_project_admin_fields();

revoke all on function public.protect_project_admin_fields() from public, anon, authenticated;

alter table public.projects enable row level security;
alter table public.project_members enable row level security;

revoke all on table public.projects from anon, authenticated;
grant select (
  id, client_id, name, code, description, project_type, service_type,
  address, district, city, area_m2, status, phase, start_date, due_date,
  progress, cover_image, created_by, created_at, updated_at
) on public.projects to authenticated;
grant insert, update, delete on table public.projects to authenticated;

revoke all on table public.project_members from anon, authenticated;
grant select, insert, update, delete on table public.project_members to authenticated;

create policy "Active users can read projects"
on public.projects for select to authenticated
using ((select public.current_user_is_active()));

create policy "Admins can create projects"
on public.projects for insert to authenticated
with check (
  (select public.current_user_has_role('admin'))
  and created_by = (select auth.uid())
);

create policy "Active users can update projects"
on public.projects for update to authenticated
using ((select public.current_user_is_active()))
with check ((select public.current_user_is_active()));

create policy "Admins can delete projects"
on public.projects for delete to authenticated
using ((select public.current_user_has_role('admin')));

create policy "Active users can read project members"
on public.project_members for select to authenticated
using ((select public.current_user_is_active()));

create policy "Admins can add project members"
on public.project_members for insert to authenticated
with check ((select public.current_user_has_role('admin')));

create policy "Admins can update project members"
on public.project_members for update to authenticated
using ((select public.current_user_has_role('admin')))
with check ((select public.current_user_has_role('admin')));

create policy "Admins can remove project members"
on public.project_members for delete to authenticated
using ((select public.current_user_has_role('admin')));

create policy "Active users can read active profiles"
on public.profiles for select to authenticated
using (is_active = true and (select public.current_user_is_active()));

create function public.replace_project_members(
  target_project_id uuid,
  member_ids uuid[],
  lead_id uuid default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not (select public.current_user_has_role('admin')) then
    raise exception 'Solo un administrador puede asignar miembros.'
      using errcode = 'insufficient_privilege';
  end if;

  if lead_id is not null and not (lead_id = any(member_ids)) then
    raise exception 'El responsable principal debe ser miembro del proyecto.'
      using errcode = 'check_violation';
  end if;

  delete from public.project_members where project_id = target_project_id;

  insert into public.project_members (project_id, user_id, is_lead)
  select target_project_id, selected.user_id, selected.user_id = lead_id
  from (select distinct unnest(member_ids) as user_id) as selected;
end;
$$;

revoke all on function public.replace_project_members(uuid, uuid[], uuid)
from public, anon;
grant execute on function public.replace_project_members(uuid, uuid[], uuid)
to authenticated;

