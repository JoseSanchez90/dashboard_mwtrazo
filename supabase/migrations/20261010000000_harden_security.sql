-- Defense-in-depth hardening after the phase 13 authorization audit.

-- Prevent a race where two concurrent requests could demote the last two
-- administrators after both observed the other one as active.
create or replace function public.prevent_last_active_admin()
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

  if loses_admin_access then
    perform pg_catalog.pg_advisory_xact_lock(914782631);

    if not exists (
      select 1
      from public.profiles
      where id <> old.id and role = 'admin' and is_active = true
    ) then
      raise exception 'MWTRAZO requiere al menos un administrador activo.'
        using errcode = 'check_violation';
    end if;
  end if;

  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

revoke all on function public.prevent_last_active_admin()
from public, anon, authenticated;

-- Metadata and Storage must use the same canonical, non-guessable path shape:
-- <project UUID>/<object UUID>.<approved extension>.
alter table public.project_files
  add constraint project_files_canonical_path
  check (
    file_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(pdf|jpg|jpeg|png|webp|dwg|dxf|doc|docx|xls|xlsx|zip)$'
  );

drop policy if exists "Active users can upload private project objects"
on storage.objects;

create policy "Active users can upload private project objects"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'project-files'
  and (select public.current_user_is_active())
  and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(pdf|jpg|jpeg|png|webp|dwg|dxf|doc|docx|xls|xlsx|zip)$'
  and exists (
    select 1
    from public.projects project
    where project.id::text = (storage.foldername(name))[1]
  )
);

-- Reassert the intended public surface of helper and RPC functions. Trigger
-- functions are never callable by API roles; only the three explicit business
-- RPCs remain executable by authenticated users and enforce their own role.
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
revoke all on function public.protect_project_admin_fields() from public, anon, authenticated;
revoke all on function public.protect_task_fields() from public, anon, authenticated;
revoke all on function public.protect_event_fields() from public, anon, authenticated;
revoke all on function public.protect_project_financial_fields() from public, anon, authenticated;
revoke all on function public.normalize_project_payment() from public, anon, authenticated;
revoke all on function public.record_activity_log() from public, anon, authenticated;

revoke all on function public.current_user_is_active() from public, anon;
revoke all on function public.current_user_has_role(public.user_role) from public, anon;
revoke all on function public.replace_project_members(uuid, uuid[], uuid) from public, anon;
revoke all on function public.set_project_phase_progress(uuid, uuid, smallint, boolean) from public, anon;
revoke all on function public.configure_project_phase_definitions(uuid[], boolean[]) from public, anon;

grant execute on function public.current_user_is_active() to authenticated;
grant execute on function public.current_user_has_role(public.user_role) to authenticated;
grant execute on function public.replace_project_members(uuid, uuid[], uuid) to authenticated;
grant execute on function public.set_project_phase_progress(uuid, uuid, smallint, boolean) to authenticated;
grant execute on function public.configure_project_phase_definitions(uuid[], boolean[]) to authenticated;
