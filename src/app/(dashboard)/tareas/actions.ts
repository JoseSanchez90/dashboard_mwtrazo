"use server";

import { revalidatePath } from "next/cache";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/permissions/guards";
import { createClient } from "@/lib/supabase/server";
import { taskFormSchema, taskIdSchema, taskPrioritySchema, taskStatusSchema, type TaskFormInput } from "@/lib/validations/tasks";

export type TaskActionResult = { ok: true; id: string } | { ok: false; error: string };
const nullable = (value: string) => value || null;
const refreshTaskPaths = (projectId?: string | null) => { revalidatePath("/tareas"); if (projectId) revalidatePath(`/proyectos/${projectId}`); };

export async function createTaskAction(input: TaskFormInput): Promise<TaskActionResult> {
  const user = await requirePermission(PERMISSIONS.CREATE_TASKS);
  const parsed = taskFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Revisa los datos de la tarea." };
  const canAssign = hasPermission(user.profile.role, PERMISSIONS.ASSIGN_TASKS);
  const supabase = await createClient();
  const { data, error } = await supabase.from("tasks").insert({
    project_id: nullable(parsed.data.project_id), title: parsed.data.title.trim(), description: nullable(parsed.data.description.trim()),
    assigned_to: canAssign ? nullable(parsed.data.assigned_to) : null, created_by: user.id, status: parsed.data.status,
    priority: parsed.data.priority, start_date: nullable(parsed.data.start_date), due_date: nullable(parsed.data.due_date),
  }).select("id, project_id").single();
  if (error || !data) return { ok: false, error: "No fue posible crear la tarea." };
  refreshTaskPaths(data.project_id); return { ok: true, id: data.id };
}

export async function updateTaskAction(id: string, input: TaskFormInput): Promise<TaskActionResult> {
  const user = await requirePermission(PERMISSIONS.EDIT_TASKS);
  const parsedId = taskIdSchema.safeParse(id); const parsed = taskFormSchema.safeParse(input);
  if (!parsedId.success || !parsed.success) return { ok: false, error: "Revisa los datos de la tarea." };
  const supabase = await createClient();
  const canAssign = hasPermission(user.profile.role, PERMISSIONS.ASSIGN_TASKS);
  const payload = {
    project_id: nullable(parsed.data.project_id), title: parsed.data.title.trim(), description: nullable(parsed.data.description.trim()),
    status: parsed.data.status, priority: parsed.data.priority, start_date: nullable(parsed.data.start_date), due_date: nullable(parsed.data.due_date),
    ...(canAssign ? { assigned_to: nullable(parsed.data.assigned_to) } : {}),
  };
  const { data, error } = await supabase.from("tasks").update(payload).eq("id", parsedId.data).select("id, project_id").maybeSingle();
  if (error || !data) return { ok: false, error: "No fue posible actualizar la tarea." };
  refreshTaskPaths(data.project_id); return { ok: true, id: data.id };
}

export async function changeTaskStatusAction(id: string, status: unknown): Promise<TaskActionResult> {
  await requirePermission(PERMISSIONS.EDIT_TASKS);
  const parsedId = taskIdSchema.safeParse(id); const parsed = taskStatusSchema.safeParse({ status });
  if (!parsedId.success || !parsed.success) return { ok: false, error: "Estado inválido." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("tasks").update({ status: parsed.data.status }).eq("id", parsedId.data).select("id, project_id").maybeSingle();
  if (error || !data) return { ok: false, error: "No fue posible cambiar el estado." };
  refreshTaskPaths(data.project_id); return { ok: true, id: data.id };
}

export async function changeTaskPriorityAction(id: string, priority: unknown): Promise<TaskActionResult> {
  await requirePermission(PERMISSIONS.EDIT_TASKS);
  const parsedId = taskIdSchema.safeParse(id); const parsed = taskPrioritySchema.safeParse({ priority });
  if (!parsedId.success || !parsed.success) return { ok: false, error: "Prioridad inválida." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("tasks").update({ priority: parsed.data.priority }).eq("id", parsedId.data).select("id, project_id").maybeSingle();
  if (error || !data) return { ok: false, error: "No fue posible cambiar la prioridad." };
  refreshTaskPaths(data.project_id); return { ok: true, id: data.id };
}

export async function deleteTaskAction(id: string): Promise<TaskActionResult> {
  await requirePermission(PERMISSIONS.DELETE_TASKS);
  const parsed = taskIdSchema.safeParse(id); if (!parsed.success) return { ok: false, error: "Tarea inválida." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("tasks").delete().eq("id", parsed.data).select("id, project_id").maybeSingle();
  if (error || !data) return { ok: false, error: "No fue posible eliminar la tarea." };
  refreshTaskPaths(data.project_id); return { ok: true, id: data.id };
}

