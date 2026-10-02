"use server";

import { revalidatePath } from "next/cache";

import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/permissions/guards";
import { createClient } from "@/lib/supabase/server";
import {
  projectIdSchema,
  projectPhaseTemplateNameSchema,
  projectPhaseTemplateOrderSchema,
} from "@/lib/validations/projects";

type Result = { ok: true } | { ok: false; error: string };

function errorMessage(message: string) {
  return message.includes("duplicate") || message.includes("unique")
    ? "Ya existe una fase con ese nombre."
    : "No fue posible guardar la fase.";
}

export async function createProjectPhaseTemplateAction(name: string): Promise<Result> {
  await requirePermission(PERMISSIONS.MANAGE_PROJECT_PHASES);
  const parsed = projectPhaseTemplateNameSchema.safeParse({ name });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Nombre inválido." };
  const supabase = await createClient();
  const { data: last } = await supabase.from("project_phase_templates").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("project_phase_templates").insert({ name: parsed.data.name, sort_order: (last?.sort_order ?? 0) + 10 });
  if (error) return { ok: false, error: errorMessage(error.message) };
  revalidatePath("/configuracion");
  return { ok: true };
}

export async function renameProjectPhaseTemplateAction(id: string, name: string): Promise<Result> {
  await requirePermission(PERMISSIONS.MANAGE_PROJECT_PHASES);
  const parsedId = projectIdSchema.safeParse(id);
  const parsedName = projectPhaseTemplateNameSchema.safeParse({ name });
  if (!parsedId.success || !parsedName.success) return { ok: false, error: "La fase no es válida." };
  const supabase = await createClient();
  const { error } = await supabase.from("project_phase_templates").update({ name: parsedName.data.name }).eq("id", parsedId.data);
  if (error) return { ok: false, error: errorMessage(error.message) };
  revalidatePath("/configuracion");
  return { ok: true };
}

export async function toggleProjectPhaseTemplateAction(id: string, isActive: boolean): Promise<Result> {
  await requirePermission(PERMISSIONS.MANAGE_PROJECT_PHASES);
  const parsedId = projectIdSchema.safeParse(id);
  if (!parsedId.success || typeof isActive !== "boolean") return { ok: false, error: "La fase no es válida." };
  const supabase = await createClient();
  const { error } = await supabase.from("project_phase_templates").update({ is_active: isActive }).eq("id", parsedId.data);
  if (error) return { ok: false, error: errorMessage(error.message) };
  revalidatePath("/configuracion");
  return { ok: true };
}

export async function reorderProjectPhaseTemplatesAction(ids: string[]): Promise<Result> {
  await requirePermission(PERMISSIONS.MANAGE_PROJECT_PHASES);
  const parsed = projectPhaseTemplateOrderSchema.safeParse(ids);
  if (!parsed.success) return { ok: false, error: "El orden de fases no es válido." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("reorder_project_phase_templates", { template_ids: parsed.data });
  if (error) return { ok: false, error: "No fue posible cambiar el orden." };
  revalidatePath("/configuracion");
  return { ok: true };
}
