-- Separate the global template catalogue from the immutable phase snapshots
-- already associated with each project. Existing projects are backfilled and
-- never changed by later template edits.

alter table public.project_phase_definitions rename to project_phase_templates;
alter index public.project_phase_definitions_order_idx rename to project_phase_templates_order_idx;
alter table public.project_phases rename column phase_definition_id to phase_template_id;
alter table public.project_phases rename constraint project_phases_phase_definition_id_fkey to project_phases_phase_template_id_fkey;
alter index public.project_phases_definition_idx rename to project_phases_template_idx;
alter trigger project_phase_definitions_set_updated_at on public.project_phase_templates rename to project_phase_templates_set_updated_at;

alter table public.project_phases
  add column name text,
  add column sort_order integer,
  add column is_active boolean not null default true;

update public.project_phases phase
set
  name = template.name,
  sort_order = template.sort_order,
  is_active = template.is_active
from public.project_phase_templates template
where template.id = phase.phase_template_id;

insert into public.project_phases (
  project_id, phase_template_id, name, sort_order, is_active, progress, is_current
)
select project.id, template.id, template.name, template.sort_order, template.is_active, 0, false
from public.projects project
cross join public.project_phase_templates template
on conflict (project_id, phase_template_id) do nothing;

alter table public.project_phases
  alter column name set not null,
  alter column sort_order set not null,
  add constraint project_phases_name_length check (char_length(trim(name)) between 2 and 120),
  add constraint project_phases_sort_order_check check (sort_order >= 0);

create unique index project_phase_templates_name_unique_idx
on public.project_phase_templates (lower(name));

drop policy if exists "Admins can delete phase definitions" on public.project_phase_templates;
revoke delete on table public.project_phase_templates from authenticated;

-- Phase snapshots are created by the trusted project trigger. Authenticated
-- users may only change their operational progress through the RPC below.
revoke insert, update, delete on table public.project_phases from authenticated;
grant update (progress, is_current, completed_at) on table public.project_phases to authenticated;

create function public.instantiate_project_phases()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.project_phases (
    project_id, phase_template_id, name, sort_order, is_active, progress, is_current
  )
  select new.id, template.id, template.name, template.sort_order, true, 0, false
  from public.project_phase_templates template
  where template.is_active = true
  order by template.sort_order, template.name;
  return new;
end;
$$;

revoke all on function public.instantiate_project_phases() from public, anon, authenticated;

create trigger projects_instantiate_phases
after insert on public.projects
for each row execute function public.instantiate_project_phases();

create or replace function public.set_project_phase_progress(
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
  from public.project_phases
  where project_id = target_project_id
    and phase_template_id = target_phase_definition_id
    and is_active = true;
  if phase_name is null then
    raise exception 'La fase no existe en este proyecto.' using errcode = 'check_violation';
  end if;

  if make_current then
    update public.project_phases set is_current = false
    where project_id = target_project_id and is_current = true;
  end if;

  update public.project_phases
  set
    progress = phase_progress,
    is_current = case when make_current then true else is_current end,
    completed_at = case when phase_progress = 100 then timezone('utc', now()) else null end
  where project_id = target_project_id and phase_template_id = target_phase_definition_id;

  select round(avg(progress))::smallint into overall_progress
  from public.project_phases
  where project_id = target_project_id and is_active = true;

  update public.projects
  set
    phase = case when make_current then phase_name else phase end,
    progress = coalesce(overall_progress, 0)
  where id = target_project_id;
end;
$$;

drop function if exists public.configure_project_phase_definitions(uuid[], boolean[]);

create function public.reorder_project_phase_templates(template_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  item_index integer;
  expected_count integer;
begin
  if not (select public.current_user_has_role('admin')) then
    raise exception 'Solo un administrador puede ordenar las fases.' using errcode = 'insufficient_privilege';
  end if;
  select count(*) into expected_count from public.project_phase_templates;
  if cardinality(template_ids) <> expected_count
    or (select count(distinct id) from unnest(template_ids) as ids(id)) <> expected_count
    or exists (
      select 1 from unnest(template_ids) as ids(id)
      where not exists (select 1 from public.project_phase_templates template where template.id = ids.id)
    ) then
    raise exception 'El orden de fases no es válido.' using errcode = 'check_violation';
  end if;
  for item_index in 1..cardinality(template_ids) loop
    update public.project_phase_templates
    set sort_order = item_index * 10
    where id = template_ids[item_index];
  end loop;
end;
$$;

revoke all on function public.reorder_project_phase_templates(uuid[]) from public, anon;
grant execute on function public.reorder_project_phase_templates(uuid[]) to authenticated;
