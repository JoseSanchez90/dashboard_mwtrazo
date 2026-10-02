create type public.task_status as enum ('todo', 'in_progress', 'completed');
create type public.task_priority as enum ('low', 'medium', 'high', 'urgent');

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects (id) on delete restrict,
  title text not null check (char_length(trim(title)) between 2 and 180),
  description text check (description is null or char_length(description) <= 4000),
  assigned_to uuid references public.profiles (id) on delete restrict,
  created_by uuid not null references public.profiles (id) on delete restrict,
  status public.task_status not null default 'todo',
  priority public.task_priority not null default 'medium',
  start_date date,
  due_date date,
  completed_by uuid references public.profiles (id) on delete restrict,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint tasks_date_order check (start_date is null or due_date is null or due_date >= start_date),
  constraint tasks_completed_at_consistency check (
    (status = 'completed' and completed_at is not null and completed_by is not null)
    or (status <> 'completed' and completed_at is null and completed_by is null)
  )
);

create index tasks_project_id_idx on public.tasks (project_id) where project_id is not null;
create index tasks_assigned_to_idx on public.tasks (assigned_to) where assigned_to is not null;
create index tasks_status_idx on public.tasks (status);
create index tasks_priority_idx on public.tasks (priority);
create index tasks_due_date_idx on public.tasks (due_date) where due_date is not null;
create index tasks_created_by_idx on public.tasks (created_by);

create trigger tasks_set_updated_at before update on public.tasks
for each row execute function public.set_updated_at();

create function public.protect_task_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select public.current_user_is_active()) then
    raise exception 'Usuario inactivo o sin perfil.' using errcode = 'insufficient_privilege';
  end if;

  if tg_op = 'UPDATE' and new.created_by is distinct from old.created_by then
    raise exception 'No se puede cambiar el creador de la tarea.' using errcode = 'insufficient_privilege';
  end if;

  if tg_op = 'INSERT' and new.assigned_to is not null
    and not (select public.current_user_has_role('admin')) then
    raise exception 'Solo un administrador puede asignar tareas.' using errcode = 'insufficient_privilege';
  end if;

  if tg_op = 'UPDATE' and new.assigned_to is distinct from old.assigned_to
    and not (select public.current_user_has_role('admin')) then
    raise exception 'Solo un administrador puede asignar tareas.' using errcode = 'insufficient_privilege';
  end if;

  if new.status = 'completed' and (tg_op = 'INSERT' or old.status <> 'completed') then
    new.completed_at = timezone('utc', now());
    new.completed_by = (select auth.uid());
  elsif new.status = 'completed' then
    new.completed_at = old.completed_at;
    new.completed_by = old.completed_by;
  elsif new.status <> 'completed' then
    new.completed_at = null;
    new.completed_by = null;
  end if;

  return new;
end;
$$;

create trigger tasks_protect_fields before insert or update on public.tasks
for each row execute function public.protect_task_fields();

revoke all on function public.protect_task_fields() from public, anon, authenticated;

alter table public.tasks enable row level security;
revoke all on table public.tasks from anon, authenticated;
grant select, insert, update, delete on table public.tasks to authenticated;

create policy "Active users can read tasks" on public.tasks for select to authenticated
using ((select public.current_user_is_active()));
create policy "Active users can create tasks" on public.tasks for insert to authenticated
with check ((select public.current_user_is_active()) and created_by = (select auth.uid()));
create policy "Active users can update tasks" on public.tasks for update to authenticated
using ((select public.current_user_is_active())) with check ((select public.current_user_is_active()));
create policy "Admins can delete tasks" on public.tasks for delete to authenticated
using ((select public.current_user_has_role('admin')));

