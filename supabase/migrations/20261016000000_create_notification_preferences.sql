create table public.notification_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  task_assigned boolean not null default true,
  task_completed boolean not null default true,
  task_due_soon boolean not null default true,
  task_overdue boolean not null default true,
  event_upcoming boolean not null default true,
  delivery_upcoming boolean not null default true,
  file_uploaded boolean not null default true,
  project_updated boolean not null default true,
  payment_due_soon boolean not null default true,
  payment_overdue boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger notification_preferences_set_updated_at
before update on public.notification_preferences
for each row execute function public.set_updated_at();

insert into public.notification_preferences (user_id)
select id from public.profiles
on conflict (user_id) do nothing;

create function public.create_default_notification_preferences()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notification_preferences (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function public.create_default_notification_preferences()
from public, anon, authenticated;

create trigger profiles_create_notification_preferences
after insert on public.profiles
for each row execute function public.create_default_notification_preferences();

alter table public.notification_preferences enable row level security;
revoke all on table public.notification_preferences from anon, authenticated;
grant select, insert on table public.notification_preferences to authenticated;
grant update (
  task_assigned, task_completed, task_due_soon, task_overdue,
  event_upcoming, delivery_upcoming, file_uploaded, project_updated,
  payment_due_soon, payment_overdue
) on table public.notification_preferences to authenticated;

create policy "Users read their own notification preferences"
on public.notification_preferences for select to authenticated
using (
  user_id = (select auth.uid())
  and (select public.current_user_is_active())
);

create policy "Users create their own notification preferences"
on public.notification_preferences for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (select public.current_user_is_active())
);

create policy "Users update their own notification preferences"
on public.notification_preferences for update to authenticated
using (
  user_id = (select auth.uid())
  and (select public.current_user_is_active())
)
with check (
  user_id = (select auth.uid())
  and (select public.current_user_is_active())
);

create or replace function public.enqueue_notification(
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
declare
  notifications_enabled boolean;
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

  select case notification_kind
    when 'task_assigned' then preference.task_assigned
    when 'task_completed' then preference.task_completed
    when 'task_due_soon' then preference.task_due_soon
    when 'task_overdue' then preference.task_overdue
    when 'event_upcoming' then preference.event_upcoming
    when 'delivery_upcoming' then preference.delivery_upcoming
    when 'file_uploaded' then preference.file_uploaded
    when 'project_updated' then preference.project_updated
    when 'payment_due_soon' then preference.payment_due_soon
    when 'payment_overdue' then preference.payment_overdue
  end into notifications_enabled
  from public.notification_preferences preference
  where preference.user_id = recipient_id;

  if not coalesce(notifications_enabled, true) then
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

comment on table public.notification_preferences
is 'One row per profile controlling which internal notifications may be generated.';
