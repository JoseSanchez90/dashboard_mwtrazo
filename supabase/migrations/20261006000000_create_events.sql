create type public.event_type as enum ('meeting', 'site_visit', 'deadline', 'delivery', 'internal');

create table public.events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects (id) on delete restrict,
  client_id uuid references public.clients (id) on delete restrict,
  title text not null check (char_length(trim(title)) between 2 and 180),
  description text check (description is null or char_length(description) <= 4000),
  type public.event_type not null default 'internal',
  start_at timestamptz not null,
  end_at timestamptz not null,
  all_day boolean not null default false,
  location text check (location is null or char_length(location) <= 240),
  created_by uuid not null references public.profiles (id) on delete restrict,
  assigned_to uuid references public.profiles (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint events_date_order check (end_at > start_at)
);

create index events_project_id_idx on public.events (project_id) where project_id is not null;
create index events_client_id_idx on public.events (client_id) where client_id is not null;
create index events_assigned_to_idx on public.events (assigned_to) where assigned_to is not null;
create index events_start_at_idx on public.events (start_at);
create index events_type_idx on public.events (type);
create index events_created_by_idx on public.events (created_by);

create trigger events_set_updated_at before update on public.events
for each row execute function public.set_updated_at();

create function public.protect_event_fields()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not (select public.current_user_is_active()) then
    raise exception 'Usuario inactivo o sin perfil.' using errcode = 'insufficient_privilege';
  end if;
  if tg_op = 'UPDATE' and new.created_by is distinct from old.created_by then
    raise exception 'No se puede cambiar el creador del evento.' using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

create trigger events_protect_fields before insert or update on public.events
for each row execute function public.protect_event_fields();
revoke all on function public.protect_event_fields() from public, anon, authenticated;

alter table public.events enable row level security;
revoke all on table public.events from anon, authenticated;
grant select, insert, update, delete on table public.events to authenticated;

create policy "Active users can read events" on public.events for select to authenticated
using ((select public.current_user_is_active()));
create policy "Active users can create events" on public.events for insert to authenticated
with check ((select public.current_user_is_active()) and created_by = (select auth.uid()));
create policy "Active users can update events" on public.events for update to authenticated
using ((select public.current_user_is_active())) with check ((select public.current_user_is_active()));
create policy "Admins can delete events" on public.events for delete to authenticated
using ((select public.current_user_has_role('admin')));

