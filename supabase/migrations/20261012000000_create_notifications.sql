create type public.notification_type as enum (
  'task_assigned',
  'task_completed',
  'task_due_soon',
  'task_overdue',
  'event_upcoming',
  'delivery_upcoming',
  'file_uploaded',
  'project_updated',
  'payment_due_soon',
  'payment_overdue'
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null,
  title text not null check (char_length(trim(title)) between 2 and 120),
  message text not null check (char_length(trim(message)) between 2 and 500),
  entity_type text check (entity_type is null or entity_type in ('task', 'event', 'project', 'file', 'payment')),
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  dedupe_key text not null unique check (char_length(dedupe_key) between 8 and 300),
  constraint notifications_entity_pair check (
    (entity_type is null and entity_id is null)
    or (entity_type is not null and entity_id is not null)
  )
);

create index notifications_user_id_idx on public.notifications (user_id);
create index notifications_read_at_idx on public.notifications (read_at);
create index notifications_created_at_idx on public.notifications (created_at desc);
create index notifications_user_unread_idx
on public.notifications (user_id, created_at desc)
where read_at is null;

alter table public.notifications enable row level security;
revoke all on table public.notifications from anon, authenticated;
grant select on table public.notifications to authenticated;
grant update (read_at) on table public.notifications to authenticated;

create policy "Users read their own notifications"
on public.notifications for select to authenticated
using (
  user_id = (select auth.uid())
  and (select public.current_user_is_active())
  and (
    type not in ('payment_due_soon', 'payment_overdue')
    or (select public.current_user_has_role('admin'))
  )
);

create policy "Users mark their own notifications as read"
on public.notifications for update to authenticated
using (
  user_id = (select auth.uid())
  and (select public.current_user_is_active())
  and (
    type not in ('payment_due_soon', 'payment_overdue')
    or (select public.current_user_has_role('admin'))
  )
)
with check (
  user_id = (select auth.uid())
  and read_at is not null
  and (select public.current_user_is_active())
  and (
    type not in ('payment_due_soon', 'payment_overdue')
    or (select public.current_user_has_role('admin'))
  )
);

create function public.enqueue_notification(
  recipient_id uuid,
  notification_kind public.notification_type,
  notification_title text,
  notification_message text,
  related_entity_type text,
  related_entity_id uuid,
  unique_key text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if notification_kind in ('payment_due_soon', 'payment_overdue') and not exists (
    select 1 from public.profiles
    where id = recipient_id and role = 'admin' and is_active = true
  ) then
    return;
  end if;

  if not exists (select 1 from public.profiles where id = recipient_id and is_active = true) then
    return;
  end if;

  insert into public.notifications (
    user_id, type, title, message, entity_type, entity_id, dedupe_key
  ) values (
    recipient_id, notification_kind, notification_title, notification_message,
    related_entity_type, related_entity_id, unique_key
  )
  on conflict (dedupe_key) do nothing;
end;
$$;

revoke all on function public.enqueue_notification(uuid, public.notification_type, text, text, text, uuid, text)
from public, anon, authenticated;

create function public.generate_action_notifications()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  actor_name text;
  recipient_id uuid;
  project_name text;
begin
  select full_name into actor_name from public.profiles where id = actor_id;
  actor_name := coalesce(actor_name, 'Un usuario');

  if tg_table_name = 'tasks' then
    if new.assigned_to is not null
      and (tg_op = 'INSERT' or new.assigned_to is distinct from old.assigned_to)
      and new.assigned_to is distinct from actor_id then
      perform public.enqueue_notification(
        new.assigned_to, 'task_assigned', 'Nueva tarea asignada',
        'Tienes asignada la tarea ' || new.title || '.',
        'task', new.id,
        'task_assigned:' || new.id || ':' || new.assigned_to || ':' || extract(epoch from new.updated_at)::text
      );
    end if;

    if tg_op = 'UPDATE' and new.status = 'completed' and old.status <> 'completed'
      and new.created_by is distinct from actor_id then
      perform public.enqueue_notification(
        new.created_by, 'task_completed', 'Tarea completada',
        actor_name || ' completó la tarea ' || new.title || '.',
        'task', new.id,
        'task_completed:' || new.id || ':' || extract(epoch from new.completed_at)::text
      );
    end if;

  elsif tg_table_name = 'events' then
    if new.assigned_to is not null and new.assigned_to is distinct from actor_id then
      perform public.enqueue_notification(
        new.assigned_to, 'event_upcoming', 'Nuevo evento asignado',
        'Tienes asignado el evento ' || new.title || '.',
        'event', new.id,
        'event_assigned:' || new.id || ':' || new.assigned_to
      );
    end if;

  elsif tg_table_name = 'project_files' then
    select name into project_name from public.projects where id = new.project_id;
    for recipient_id in
      select member.user_id from public.project_members member where member.project_id = new.project_id
      union
      select project.created_by from public.projects project where project.id = new.project_id
    loop
      if recipient_id is distinct from actor_id then
        perform public.enqueue_notification(
          recipient_id, 'file_uploaded', 'Nuevo archivo',
          actor_name || ' subió ' || new.file_name || ' a ' || coalesce(project_name, 'un proyecto') || '.',
          'file', new.id,
          'file_uploaded:' || new.id || ':' || recipient_id
        );
      end if;
    end loop;

  elsif tg_table_name = 'projects' then
    for recipient_id in
      select member.user_id from public.project_members member where member.project_id = new.id
      union
      select new.created_by
    loop
      if recipient_id is distinct from actor_id then
        perform public.enqueue_notification(
          recipient_id, 'project_updated', 'Proyecto actualizado',
          actor_name || ' actualizó el proyecto ' || new.name || '.',
          'project', new.id,
          'project_updated:' || new.id || ':' || recipient_id || ':' || extract(epoch from new.updated_at)::text
        );
      end if;
    end loop;
  end if;

  return new;
end;
$$;

revoke all on function public.generate_action_notifications()
from public, anon, authenticated;

create trigger tasks_generate_notifications
after insert or update on public.tasks
for each row execute function public.generate_action_notifications();

create trigger events_generate_notifications
after insert on public.events
for each row execute function public.generate_action_notifications();

create trigger project_files_generate_notifications
after insert on public.project_files
for each row execute function public.generate_action_notifications();

create trigger projects_generate_notifications
after update on public.projects
for each row
when (
  old.name is distinct from new.name
  or old.status is distinct from new.status
  or old.phase is distinct from new.phase
  or old.progress is distinct from new.progress
  or old.start_date is distinct from new.start_date
  or old.due_date is distinct from new.due_date
  or old.description is distinct from new.description
)
execute function public.generate_action_notifications();

comment on function public.enqueue_notification(uuid, public.notification_type, text, text, text, uuid, text)
is 'Internal server-side primitive for immediate and future scheduled notification generation.';
