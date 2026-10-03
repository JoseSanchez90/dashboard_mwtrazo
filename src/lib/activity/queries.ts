import "server-only";

import { requireAuthenticatedUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { ActivityAction, ActivityEntityType, ActivityLog } from "@/types/activity";

type ActivityRow = { id: string; user_id: string | null; entity_type: ActivityEntityType; entity_id: string; action: ActivityAction; metadata: Record<string, unknown>; created_at: string; profiles: { full_name: string } | null };
const labels: Record<ActivityEntityType, Partial<Record<ActivityAction, string>>> = {
  client: { created: "creó el cliente", updated: "editó el cliente" }, project: { created: "creó el proyecto", updated: "actualizó el proyecto" }, task: { created: "creó la tarea", completed: "completó la tarea" }, file: { uploaded: "subió el archivo" }, event: { created: "creó el evento" }, payment: { registered: "registró el pago" },
};
function text(metadata: Record<string, unknown>, key: string) { return typeof metadata[key] === "string" ? metadata[key] : "Registro"; }
export function mapActivityRow(row: ActivityRow): ActivityLog {
  const entityLabel = row.entity_type === "client" || row.entity_type === "project" ? text(row.metadata, "name") : row.entity_type === "file" ? text(row.metadata, "file_name") : row.entity_type === "payment" ? text(row.metadata, "concept") : text(row.metadata, "title");
  const projectId = text(row.metadata, "project_id");
  const href = row.entity_type === "client" ? `/clientes/${row.entity_id}` : row.entity_type === "project" ? `/proyectos/${row.entity_id}` : row.entity_type === "event" ? "/calendario" : row.entity_type === "payment" ? "/finanzas" : projectId !== "Registro" ? `/proyectos/${projectId}` : row.entity_type === "task" ? "/tareas" : "/archivos";
  return { ...row, user_name: row.profiles?.full_name ?? "Usuario eliminado", label: labels[row.entity_type][row.action] ?? "registró actividad", entity_label: entityLabel, href };
}
export async function listActivity(projectId?: string, limit = 20): Promise<ActivityLog[]> {
  await requireAuthenticatedUser(); const supabase = await createClient();
  let query = supabase.from("activity_logs").select("id, user_id, entity_type, entity_id, action, metadata, created_at, profiles!activity_logs_user_id_fkey(full_name)").order("created_at", { ascending: false }).limit(limit);
  if (projectId) query = query.contains("metadata", { project_id: projectId });
  const { data, error } = await query; if (error) throw new Error("No fue posible cargar la actividad.");
  return (data as unknown as ActivityRow[]).map(mapActivityRow);
}

