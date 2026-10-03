-- Allow Auth users to be deleted without destroying business history.
-- Operational assignments disappear; historical author references become null.

alter table public.project_members drop constraint project_members_user_id_fkey;
alter table public.project_members
  add constraint project_members_user_id_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;

alter table public.tasks drop constraint tasks_assigned_to_fkey;
alter table public.tasks drop constraint tasks_created_by_fkey;
alter table public.tasks drop constraint tasks_completed_by_fkey;
alter table public.tasks alter column created_by drop not null;
alter table public.tasks drop constraint tasks_completed_at_consistency;
alter table public.tasks
  add constraint tasks_assigned_to_fkey foreign key (assigned_to) references public.profiles (id) on delete set null,
  add constraint tasks_created_by_fkey foreign key (created_by) references public.profiles (id) on delete set null,
  add constraint tasks_completed_by_fkey foreign key (completed_by) references public.profiles (id) on delete set null,
  add constraint tasks_completed_at_consistency check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed' and completed_at is null and completed_by is null)
  );

alter table public.events drop constraint events_created_by_fkey;
alter table public.events drop constraint events_assigned_to_fkey;
alter table public.events alter column created_by drop not null;
alter table public.events
  add constraint events_created_by_fkey foreign key (created_by) references public.profiles (id) on delete set null,
  add constraint events_assigned_to_fkey foreign key (assigned_to) references public.profiles (id) on delete set null;

alter table public.clients drop constraint clients_created_by_fkey;
alter table public.clients alter column created_by drop not null;
alter table public.clients
  add constraint clients_created_by_fkey foreign key (created_by) references public.profiles (id) on delete set null;

alter table public.projects drop constraint projects_created_by_fkey;
alter table public.projects alter column created_by drop not null;
alter table public.projects
  add constraint projects_created_by_fkey foreign key (created_by) references public.profiles (id) on delete set null;

alter table public.project_files drop constraint project_files_uploaded_by_fkey;
alter table public.project_files alter column uploaded_by drop not null;
alter table public.project_files
  add constraint project_files_uploaded_by_fkey foreign key (uploaded_by) references public.profiles (id) on delete set null;

alter table public.project_payments drop constraint project_payments_created_by_fkey;
alter table public.project_payments alter column created_by drop not null;
alter table public.project_payments
  add constraint project_payments_created_by_fkey foreign key (created_by) references public.profiles (id) on delete set null;

alter table public.project_expenses drop constraint project_expenses_created_by_fkey;
alter table public.project_expenses alter column created_by drop not null;
alter table public.project_expenses
  add constraint project_expenses_created_by_fkey foreign key (created_by) references public.profiles (id) on delete set null;

alter table public.activity_logs drop constraint activity_logs_user_id_fkey;
alter table public.activity_logs alter column user_id drop not null;
alter table public.activity_logs
  add constraint activity_logs_user_id_fkey foreign key (user_id) references public.profiles (id) on delete set null;

comment on column public.activity_logs.user_id is
  'Actor de la actividad; queda nulo si la cuenta fue eliminada para conservar el historial.';

-- Foreign-key SET NULL actions run update triggers without an authenticated
-- application user. Permit those trusted database/service operations while
-- retaining the existing checks for normal authenticated requests.
create or replace function public.protect_project_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_role public.user_role;
begin
  if (select auth.uid()) is null then return new; end if;
  select role into current_role from public.profiles
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
    raise exception 'El asistente no puede modificar campos administrativos del proyecto.' using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

create or replace function public.protect_task_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then return new; end if;
  if not (select public.current_user_is_active()) then
    raise exception 'Usuario inactivo o sin perfil.' using errcode = 'insufficient_privilege';
  end if;
  if tg_op = 'UPDATE' and new.created_by is distinct from old.created_by then
    raise exception 'No se puede cambiar el creador de la tarea.' using errcode = 'insufficient_privilege';
  end if;
  if tg_op = 'INSERT' and new.assigned_to is not null and not (select public.current_user_has_role('admin')) then
    raise exception 'Solo un administrador puede asignar tareas.' using errcode = 'insufficient_privilege';
  end if;
  if tg_op = 'UPDATE' and new.assigned_to is distinct from old.assigned_to and not (select public.current_user_has_role('admin')) then
    raise exception 'Solo un administrador puede asignar tareas.' using errcode = 'insufficient_privilege';
  end if;
  if new.status = 'completed' and (tg_op = 'INSERT' or old.status <> 'completed') then
    new.completed_at = timezone('utc', now()); new.completed_by = (select auth.uid());
  elsif new.status = 'completed' then
    new.completed_at = old.completed_at; new.completed_by = old.completed_by;
  else
    new.completed_at = null; new.completed_by = null;
  end if;
  return new;
end;
$$;

create or replace function public.protect_event_fields()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then return new; end if;
  if not (select public.current_user_is_active()) then
    raise exception 'Usuario inactivo o sin perfil.' using errcode = 'insufficient_privilege';
  end if;
  if tg_op = 'UPDATE' and new.created_by is distinct from old.created_by then
    raise exception 'No se puede cambiar el creador del evento.' using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

create or replace function public.protect_project_financial_fields()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then return new; end if;
  if not (select public.current_user_has_role('admin')) then
    raise exception 'Solo un administrador puede gestionar finanzas.' using errcode = 'insufficient_privilege';
  end if;
  if tg_op = 'UPDATE' and new.created_by is distinct from old.created_by then
    raise exception 'No se puede cambiar el creador del registro.' using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

revoke all on function public.protect_project_admin_fields() from public, anon, authenticated;
revoke all on function public.protect_task_fields() from public, anon, authenticated;
revoke all on function public.protect_event_fields() from public, anon, authenticated;
revoke all on function public.protect_project_financial_fields() from public, anon, authenticated;
