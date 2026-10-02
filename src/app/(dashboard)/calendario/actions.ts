"use server";

import { revalidatePath } from "next/cache";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/permissions/guards";
import { createClient } from "@/lib/supabase/server";
import { eventFormSchema, eventIdSchema, type EventFormInput } from "@/lib/validations/events";

export type EventActionResult = { ok: true; id: string } | { ok: false; error: string };
const nullable = (value: string) => value || null;
function refreshEventPaths(projectId?: string | null) { revalidatePath("/calendario"); if (projectId) revalidatePath(`/proyectos/${projectId}`); }
function payload(input: EventFormInput) { return { project_id: nullable(input.project_id), client_id: nullable(input.client_id), title: input.title.trim(), description: nullable(input.description.trim()), type: input.type, start_at: new Date(input.start_at).toISOString(), end_at: new Date(input.end_at).toISOString(), all_day: input.all_day, location: nullable(input.location.trim()), assigned_to: nullable(input.assigned_to) }; }

export async function createEventAction(input: EventFormInput): Promise<EventActionResult> {
  const user = await requirePermission(PERMISSIONS.CREATE_EVENTS); const parsed = eventFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Revisa los datos del evento." };
  const supabase = await createClient(); const { data, error } = await supabase.from("events").insert({ ...payload(parsed.data), created_by: user.id }).select("id, project_id").single();
  if (error || !data) return { ok: false, error: "No fue posible crear el evento." };
  refreshEventPaths(data.project_id); return { ok: true, id: data.id };
}

export async function updateEventAction(id: string, input: EventFormInput): Promise<EventActionResult> {
  await requirePermission(PERMISSIONS.EDIT_EVENTS); const parsedId = eventIdSchema.safeParse(id); const parsed = eventFormSchema.safeParse(input);
  if (!parsedId.success || !parsed.success) return { ok: false, error: "Revisa los datos del evento." };
  const supabase = await createClient(); const { data, error } = await supabase.from("events").update(payload(parsed.data)).eq("id", parsedId.data).select("id, project_id").maybeSingle();
  if (error || !data) return { ok: false, error: "No fue posible actualizar el evento." };
  refreshEventPaths(data.project_id); return { ok: true, id: data.id };
}

export async function deleteEventAction(id: string): Promise<EventActionResult> {
  await requirePermission(PERMISSIONS.DELETE_EVENTS); const parsed = eventIdSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "Evento inválido." };
  const supabase = await createClient(); const { data, error } = await supabase.from("events").delete().eq("id", parsed.data).select("id, project_id").maybeSingle();
  if (error || !data) return { ok: false, error: "No fue posible eliminar el evento." };
  refreshEventPaths(data.project_id); return { ok: true, id: data.id };
}

