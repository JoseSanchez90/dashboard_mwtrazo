import "server-only";

import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/permissions/guards";
import { createClient } from "@/lib/supabase/server";
import type { CalendarEvent, EventOptions } from "@/types/event";

type EventRow = Omit<CalendarEvent, "project_name" | "client_name" | "assignee_name"> & {
  projects: { name: string } | null; clients: { name: string } | null; profiles: { full_name: string } | null;
};
const columns = "id, project_id, client_id, title, description, type, start_at, end_at, all_day, location, created_by, assigned_to, created_at, updated_at, projects!events_project_id_fkey(name), clients!events_client_id_fkey(name), profiles!events_assigned_to_fkey(full_name)" as const;

export async function listEvents(projectId?: string): Promise<CalendarEvent[]> {
  await requirePermission(PERMISSIONS.VIEW_EVENTS);
  const supabase = await createClient();
  let query = supabase.from("events").select(columns).order("start_at");
  if (projectId) query = query.eq("project_id", projectId);
  const { data, error } = await query;
  if (error) throw new Error("No fue posible cargar los eventos.");
  return (data as unknown as EventRow[]).map(({ projects, clients, profiles, ...event }) => ({ ...event, project_name: projects?.name ?? null, client_name: clients?.name ?? null, assignee_name: profiles?.full_name ?? null }));
}

export async function getEventOptions(): Promise<EventOptions> {
  await requirePermission(PERMISSIONS.CREATE_EVENTS);
  const supabase = await createClient();
  const [projects, clients, users] = await Promise.all([
    supabase.from("projects").select("id, name, client_id").order("name"),
    supabase.from("clients").select("id, name").order("name"),
    supabase.from("profiles").select("id, full_name").eq("is_active", true).order("full_name"),
  ]);
  if (projects.error || clients.error || users.error) throw new Error("No fue posible cargar las opciones del calendario.");
  return { projects: projects.data, clients: clients.data, users: users.data };
}

