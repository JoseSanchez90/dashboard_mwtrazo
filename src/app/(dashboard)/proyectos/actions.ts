"use server";

import { revalidatePath } from "next/cache";

import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/permissions/guards";
import { PROJECT_COVER_BUCKET, projectCoverPath } from "@/lib/projects/cover";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  optionalNumberValue,
  projectFormSchema,
  projectIdSchema,
  projectPhaseProgressSchema,
  type ProjectFormInput,
  type ProjectPhaseProgressInput,
} from "@/lib/validations/projects";

export type ProjectActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

function optional(value: string) {
  const normalized = value.trim();
  return normalized === "" ? null : normalized;
}

function operationalPayload(input: ProjectFormInput) {
  return {
    name: input.name.trim(),
    description: optional(input.description),
    project_type: optional(input.project_type),
    service_type: optional(input.service_type),
    address: optional(input.address),
    district: optional(input.district),
    city: optional(input.city),
    area_m2: optionalNumberValue(input.area_m2),
    status: input.status,
    phase: optional(input.phase),
    start_date: optional(input.start_date),
    due_date: optional(input.due_date),
    progress: input.progress,
    cover_image: optional(input.cover_image),
  };
}

function adminPayload(input: ProjectFormInput) {
  return {
    ...operationalPayload(input),
    client_id: input.client_id,
    code: input.code.trim().toUpperCase(),
    fee: optionalNumberValue(input.fee),
  };
}

function projectError(message: string) {
  if (message.includes("projects_code_unique_idx") || message.includes("duplicate")) {
    return "Ya existe un proyecto con ese código.";
  }
  return "No fue posible guardar el proyecto.";
}

async function removeStoredProjectCover(reference: string | null | undefined) {
  const path = projectCoverPath(reference);
  if (!path) return;
  await createAdminClient().storage.from(PROJECT_COVER_BUCKET).remove([path]);
}

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function isAllowedProjectPhase(
  supabase: ServerSupabaseClient,
  phase: string,
  projectId?: string,
  historicalPhase?: string | null,
) {
  if (!phase || phase === historicalPhase) return true;
  const result = projectId
    ? await supabase
        .from("project_phases")
        .select("name")
        .eq("project_id", projectId)
        .eq("is_active", true)
        .eq("name", phase)
        .maybeSingle()
    : await supabase
        .from("project_phase_templates")
        .select("name")
        .eq("is_active", true)
        .eq("name", phase)
        .maybeSingle();
  return !result.error && Boolean(result.data);
}

async function syncProjectCurrentPhase(
  supabase: ServerSupabaseClient,
  projectId: string,
  phase: string,
) {
  if (!phase) {
    return supabase
      .from("project_phases")
      .update({ is_current: false })
      .eq("project_id", projectId)
      .eq("is_current", true);
  }

  const { data: selectedPhase, error: phaseError } = await supabase
    .from("project_phases")
    .select("phase_template_id")
    .eq("project_id", projectId)
    .eq("is_active", true)
    .eq("name", phase)
    .maybeSingle();
  if (phaseError || !selectedPhase) {
    return { error: phaseError ?? new Error("La fase no pertenece al proyecto.") };
  }

  const { error: clearError } = await supabase
    .from("project_phases")
    .update({ is_current: false })
    .eq("project_id", projectId)
    .eq("is_current", true);
  if (clearError) return { error: clearError };

  return supabase
    .from("project_phases")
    .update({ is_current: true })
    .eq("project_id", projectId)
    .eq("phase_template_id", selectedPhase.phase_template_id);
}

async function replaceMembers(
  projectId: string,
  memberIds: string[],
  leadId: string,
) {
  const supabase = await createClient();
  return supabase.rpc("replace_project_members", {
    target_project_id: projectId,
    member_ids: memberIds,
    lead_id: leadId || null,
  });
}

export async function createProjectAction(
  input: ProjectFormInput,
): Promise<ProjectActionResult> {
  const user = await requirePermission(PERMISSIONS.CREATE_PROJECTS);
  const parsed = projectFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Revisa los datos ingresados." };
  const coverPath = projectCoverPath(parsed.data.cover_image);
  if (coverPath && !coverPath.startsWith(`${user.id}/`)) {
    return { ok: false, error: "La portada seleccionada no es válida." };
  }

  const supabase = await createClient();
  if (!(await isAllowedProjectPhase(supabase, parsed.data.phase))) {
    await removeStoredProjectCover(parsed.data.cover_image);
    return { ok: false, error: "Selecciona una fase válida." };
  }
  const { data, error } = await supabase
    .from("projects")
    .insert({ ...adminPayload(parsed.data), created_by: user.id })
    .select("id")
    .single();

  if (error || !data) {
    await removeStoredProjectCover(parsed.data.cover_image);
    return { ok: false, error: projectError(error?.message ?? "") };
  }

  const { error: memberError } = await replaceMembers(
    data.id,
    parsed.data.member_ids,
    parsed.data.lead_id,
  );
  if (memberError) {
    await supabase.from("projects").delete().eq("id", data.id);
    await removeStoredProjectCover(parsed.data.cover_image);
    return { ok: false, error: "No fue posible asignar los miembros del proyecto." };
  }

  const { error: phaseError } = await syncProjectCurrentPhase(
    supabase,
    data.id,
    parsed.data.phase,
  );
  if (phaseError) {
    await supabase.from("projects").delete().eq("id", data.id);
    await removeStoredProjectCover(parsed.data.cover_image);
    return { ok: false, error: "No fue posible establecer la fase inicial del proyecto." };
  }

  revalidatePath("/proyectos");
  return { ok: true, id: data.id };
}

export async function updateProjectAction(
  id: string,
  input: ProjectFormInput,
): Promise<ProjectActionResult> {
  const user = await requirePermission(PERMISSIONS.EDIT_PROJECTS);
  const [parsedId, parsedInput] = [
    projectIdSchema.safeParse(id),
    projectFormSchema.safeParse(input),
  ];
  if (!parsedId.success || !parsedInput.success) {
    return { ok: false, error: "Revisa los datos ingresados." };
  }

  const canAdminister = hasPermission(
    user.profile.role,
    PERMISSIONS.ASSIGN_PROJECT_MEMBERS,
  );
  const supabase = await createClient();
  const { data: currentProject } = await supabase
    .from("projects")
    .select("cover_image, phase")
    .eq("id", parsedId.data)
    .maybeSingle();
  const newCoverPath = projectCoverPath(parsedInput.data.cover_image);
  if (
    newCoverPath
    && parsedInput.data.cover_image !== currentProject?.cover_image
    && !newCoverPath.startsWith(`${user.id}/`)
  ) {
    return { ok: false, error: "La portada seleccionada no es válida." };
  }
  if (!(await isAllowedProjectPhase(
    supabase,
    parsedInput.data.phase,
    parsedId.data,
    currentProject?.phase,
  ))) {
    return { ok: false, error: "Selecciona una fase válida." };
  }
  const payload = canAdminister
    ? adminPayload(parsedInput.data)
    : operationalPayload(parsedInput.data);
  const { data, error } = await supabase
    .from("projects")
    .update(payload)
    .eq("id", parsedId.data)
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: projectError(error.message) };
  if (!data) return { ok: false, error: "El proyecto ya no existe." };

  if (currentProject?.cover_image !== parsedInput.data.cover_image) {
    await removeStoredProjectCover(currentProject?.cover_image);
  }

  if (currentProject?.phase !== parsedInput.data.phase) {
    const { error: phaseError } = await syncProjectCurrentPhase(
      supabase,
      parsedId.data,
      parsedInput.data.phase,
    );
    if (phaseError) {
      return { ok: false, error: "El proyecto se actualizó, pero no fue posible establecer su fase actual." };
    }
  }

  if (canAdminister) {
    const { error: memberError } = await replaceMembers(
      parsedId.data,
      parsedInput.data.member_ids,
      parsedInput.data.lead_id,
    );
    if (memberError) {
      return { ok: false, error: "El proyecto se actualizó, pero no fue posible asignar sus miembros." };
    }
  }

  revalidatePath("/proyectos");
  revalidatePath(`/proyectos/${parsedId.data}/editar`);
  return { ok: true, id: data.id };
}

export async function deleteProjectAction(id: string): Promise<ProjectActionResult> {
  await requirePermission(PERMISSIONS.DELETE_PROJECTS);
  const parsed = projectIdSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "El proyecto no es válido." };

  const supabase = await createClient();
  const { data: currentProject } = await supabase
    .from("projects")
    .select("cover_image")
    .eq("id", parsed.data)
    .maybeSingle();
  const { data, error } = await supabase
    .from("projects")
    .delete()
    .eq("id", parsed.data)
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, error: "No se puede eliminar el proyecto porque tiene información relacionada." };
  }
  if (!data) return { ok: false, error: "El proyecto no existe o no puedes eliminarlo." };

  await removeStoredProjectCover(currentProject?.cover_image);

  revalidatePath("/proyectos");
  return { ok: true, id: data.id };
}

export async function updateProjectPhaseAction(
  projectId: string,
  input: ProjectPhaseProgressInput,
): Promise<ProjectActionResult> {
  await requirePermission(PERMISSIONS.EDIT_PROJECT_PHASES);
  const [parsedProjectId, parsedInput] = [
    projectIdSchema.safeParse(projectId),
    projectPhaseProgressSchema.safeParse(input),
  ];
  if (!parsedProjectId.success || !parsedInput.success) {
    return { ok: false, error: "La información de la fase no es válida." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_project_phase_progress", {
    target_project_id: parsedProjectId.data,
    target_phase_definition_id: parsedInput.data.phase_definition_id,
    phase_progress: parsedInput.data.progress,
    make_current: parsedInput.data.is_current,
  });

  if (error) return { ok: false, error: "No fue posible actualizar la fase." };

  revalidatePath("/proyectos");
  revalidatePath(`/proyectos/${parsedProjectId.data}`);
  return { ok: true, id: parsedProjectId.data };
}


