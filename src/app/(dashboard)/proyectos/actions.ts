"use server";

import { revalidatePath } from "next/cache";

import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/permissions/guards";
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

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({ ...adminPayload(parsed.data), created_by: user.id })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: projectError(error?.message ?? "") };

  const { error: memberError } = await replaceMembers(
    data.id,
    parsed.data.member_ids,
    parsed.data.lead_id,
  );
  if (memberError) {
    await supabase.from("projects").delete().eq("id", data.id);
    return { ok: false, error: "No fue posible asignar los miembros del proyecto." };
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


