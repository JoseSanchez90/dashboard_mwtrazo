create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete restrict,
  entity_type text not null check (entity_type in ('client', 'project', 'task', 'file', 'event', 'payment')),
  entity_id uuid not null,
  action text not null check (action in ('created', 'updated', 'completed', 'uploaded', 'registered')),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default timezone('utc', now())
);

create index activity_logs_created_at_idx on public.activity_logs (created_at desc);
create index activity_logs_entity_idx on public.activity_logs (entity_type, entity_id);
create index activity_logs_user_id_idx on public.activity_logs (user_id);
create index activity_logs_project_metadata_idx on public.activity_logs using gin (metadata jsonb_path_ops);

alter table public.activity_logs enable row level security;
revoke all on table public.activity_logs from anon, authenticated;
grant select on table public.activity_logs to authenticated;

create policy "Active users read permitted activity" on public.activity_logs for select to authenticated
using (
  (select public.current_user_is_active())
  and (entity_type <> 'payment' or (select public.current_user_has_role('admin')))
);

create function public.record_activity_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  log_entity_type text;
  log_entity_id uuid;
  log_action text;
  log_metadata jsonb := '{}'::jsonb;
begin
  if actor_id is null then return new; end if;

  if tg_table_name = 'clients' then
    log_entity_type := 'client'; log_entity_id := new.id;
    log_action := case when tg_op = 'INSERT' then 'created' else 'updated' end;
    log_metadata := jsonb_build_object('name', new.name);
  elsif tg_table_name = 'projects' then
    log_entity_type := 'project'; log_entity_id := new.id;
    log_action := case when tg_op = 'INSERT' then 'created' else 'updated' end;
    log_metadata := jsonb_build_object('name', new.name, 'project_id', new.id);
  elsif tg_table_name = 'tasks' then
    if tg_op = 'UPDATE' and not (new.status = 'completed' and old.status <> 'completed') then return new; end if;
    log_entity_type := 'task'; log_entity_id := new.id;
    log_action := case when tg_op = 'INSERT' then 'created' else 'completed' end;
    log_metadata := jsonb_strip_nulls(jsonb_build_object('title', new.title, 'project_id', new.project_id));
  elsif tg_table_name = 'project_files' then
    log_entity_type := 'file'; log_entity_id := new.id; log_action := 'uploaded';
    log_metadata := jsonb_build_object('file_name', new.file_name, 'project_id', new.project_id);
  elsif tg_table_name = 'events' then
    log_entity_type := 'event'; log_entity_id := new.id; log_action := 'created';
    log_metadata := jsonb_strip_nulls(jsonb_build_object('title', new.title, 'project_id', new.project_id));
  elsif tg_table_name = 'project_payments' then
    log_entity_type := 'payment'; log_entity_id := new.id; log_action := 'registered';
    log_metadata := jsonb_build_object('concept', new.concept, 'project_id', new.project_id);
  else
    return new;
  end if;

  insert into public.activity_logs (user_id, entity_type, entity_id, action, metadata)
  values (actor_id, log_entity_type, log_entity_id, log_action, log_metadata);
  return new;
end;
$$;

revoke all on function public.record_activity_log() from public, anon, authenticated;
create trigger clients_activity_log after insert or update on public.clients for each row execute function public.record_activity_log();
create trigger projects_activity_log after insert or update on public.projects for each row execute function public.record_activity_log();
create trigger tasks_activity_log after insert or update on public.tasks for each row execute function public.record_activity_log();
create trigger project_files_activity_log after insert on public.project_files for each row execute function public.record_activity_log();
create trigger events_activity_log after insert on public.events for each row execute function public.record_activity_log();
create trigger project_payments_activity_log after insert on public.project_payments for each row execute function public.record_activity_log();

