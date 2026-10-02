create table public.project_phase_definitions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(trim(name)) between 2 and 120),
  sort_order integer not null check (sort_order >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index project_phase_definitions_order_idx
on public.project_phase_definitions (sort_order, name);

create trigger project_phase_definitions_set_updated_at
before update on public.project_phase_definitions
for each row execute function public.set_updated_at();

insert into public.project_phase_definitions (name, sort_order) values
  ('Contacto inicial', 10),
  ('Propuesta', 20),
  ('Contrato', 30),
  ('Levantamiento', 40),
  ('Anteproyecto', 50),
  ('Desarrollo', 60),
  ('Expediente', 70),
  ('Ejecución', 80),
  ('Entrega', 90);

create table public.project_phases (
  project_id uuid not null references public.projects (id) on delete cascade,
  phase_definition_id uuid not null references public.project_phase_definitions (id) on delete restrict,
  progress smallint not null default 0 check (progress between 0 and 100),
  is_current boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (project_id, phase_definition_id)
);

create unique index project_phases_one_current_idx
on public.project_phases (project_id)
where is_current = true;
create index project_phases_definition_idx
on public.project_phases (phase_definition_id);

create trigger project_phases_set_updated_at
before update on public.project_phases
for each row execute function public.set_updated_at();

alter table public.project_phase_definitions enable row level security;
alter table public.project_phases enable row level security;

revoke all on table public.project_phase_definitions from anon, authenticated;
grant select, insert, update, delete on table public.project_phase_definitions to authenticated;

revoke all on table public.project_phases from anon, authenticated;
grant select, insert, update, delete on table public.project_phases to authenticated;

create policy "Active users can read phase definitions"
on public.project_phase_definitions for select to authenticated
using ((select public.current_user_is_active()));

create policy "Admins can create phase definitions"
on public.project_phase_definitions for insert to authenticated
with check ((select public.current_user_has_role('admin')));

create policy "Admins can update phase definitions"
on public.project_phase_definitions for update to authenticated
using ((select public.current_user_has_role('admin')))
with check ((select public.current_user_has_role('admin')));

create policy "Admins can delete phase definitions"
on public.project_phase_definitions for delete to authenticated
using ((select public.current_user_has_role('admin')));

create policy "Active users can read project phases"
on public.project_phases for select to authenticated
using ((select public.current_user_is_active()));

create policy "Active users can create project phase progress"
on public.project_phases for insert to authenticated
with check ((select public.current_user_is_active()));

create policy "Active users can update project phase progress"
on public.project_phases for update to authenticated
using ((select public.current_user_is_active()))
with check ((select public.current_user_is_active()));

create policy "Admins can delete project phase progress"
on public.project_phases for delete to authenticated
using ((select public.current_user_has_role('admin')));

create function public.set_project_phase_progress(
  target_project_id uuid,
  target_phase_definition_id uuid,
  phase_progress smallint,
  make_current boolean
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  phase_name text;
  overall_progress smallint;
begin
  if not (select public.current_user_is_active()) then
    raise exception 'Usuario inactivo.' using errcode = 'insufficient_privilege';
  end if;

  if phase_progress < 0 or phase_progress > 100 then
    raise exception 'El progreso debe estar entre 0 y 100.' using errcode = 'check_violation';
  end if;

  select name into phase_name
  from public.project_phase_definitions
  where id = target_phase_definition_id and is_active = true;

  if phase_name is null then
    raise exception 'La fase no existe o está inactiva.' using errcode = 'check_violation';
  end if;

  if make_current then
    update public.project_phases
    set is_current = false
    where project_id = target_project_id and is_current = true;
  end if;

  insert into public.project_phases (
    project_id, phase_definition_id, progress, is_current, completed_at
  ) values (
    target_project_id,
    target_phase_definition_id,
    phase_progress,
    make_current,
    case when phase_progress = 100 then timezone('utc', now()) else null end
  )
  on conflict (project_id, phase_definition_id) do update set
    progress = excluded.progress,
    is_current = case when make_current then true else public.project_phases.is_current end,
    completed_at = excluded.completed_at;

  select round(avg(coalesce(pp.progress, 0)))::smallint
  into overall_progress
  from public.project_phase_definitions definitions
  left join public.project_phases pp
    on pp.phase_definition_id = definitions.id
    and pp.project_id = target_project_id
  where definitions.is_active = true;

  update public.projects
  set
    phase = case when make_current then phase_name else phase end,
    progress = coalesce(overall_progress, 0)
  where id = target_project_id;
end;
$$;

create function public.configure_project_phase_definitions(
  definition_ids uuid[],
  active_flags boolean[]
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  item_index integer;
begin
  if not (select public.current_user_has_role('admin')) then
    raise exception 'Solo un administrador puede configurar las fases.'
      using errcode = 'insufficient_privilege';
  end if;

  if cardinality(definition_ids) <> cardinality(active_flags) then
    raise exception 'Configuración de fases inválida.' using errcode = 'check_violation';
  end if;

  if coalesce(cardinality(definition_ids), 0) = 0 then
    raise exception 'Debe proporcionarse al menos una fase.' using errcode = 'check_violation';
  end if;

  for item_index in 1..cardinality(definition_ids) loop
    update public.project_phase_definitions
    set sort_order = item_index * 10, is_active = active_flags[item_index]
    where id = definition_ids[item_index];
  end loop;

  update public.project_phases progress
  set is_current = false
  from public.project_phase_definitions definitions
  where progress.phase_definition_id = definitions.id
    and definitions.is_active = false
    and progress.is_current = true;

  update public.projects project
  set
    phase = (
      select definitions.name
      from public.project_phases progress
      join public.project_phase_definitions definitions
        on definitions.id = progress.phase_definition_id
      where progress.project_id = project.id
        and progress.is_current = true
        and definitions.is_active = true
      limit 1
    ),
    progress = coalesce((
      select round(avg(coalesce(progress.progress, 0)))::smallint
      from public.project_phase_definitions definitions
      left join public.project_phases progress
        on progress.phase_definition_id = definitions.id
        and progress.project_id = project.id
      where definitions.is_active = true
    ), 0);
end;
$$;

revoke all on function public.set_project_phase_progress(uuid, uuid, smallint, boolean)
from public, anon;
grant execute on function public.set_project_phase_progress(uuid, uuid, smallint, boolean)
to authenticated;

revoke all on function public.configure_project_phase_definitions(uuid[], boolean[])
from public, anon;
grant execute on function public.configure_project_phase_definitions(uuid[], boolean[])
to authenticated;

