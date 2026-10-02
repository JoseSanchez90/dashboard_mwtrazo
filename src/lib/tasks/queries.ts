import "server-only";

import { requirePermission } from "@/lib/permissions/guards";
import { PERMISSIONS } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import type { TaskListItem, TaskOptions } from "@/types/task";

type TaskRow = Omit<TaskListItem, "project_name" | "assignee_name"> & {
  projects: { name: string } | null;
  profiles: { full_name: string } | null;
};

const columns = "id, project_id, title, description, assigned_to, created_by, status, priority, start_date, due_date, completed_by, completed_at, created_at, updated_at, projects!tasks_project_id_fkey(name), profiles!tasks_assigned_to_fkey(full_name)" as const;

export async function listTasks(projectId?: string): Promise<TaskListItem[]> {
  await requirePermission(PERMISSIONS.VIEW_TASKS);
  const supabase = await createClient();
  let query = supabase.from("tasks").select(columns).order("created_at", { ascending: false });
  if (projectId) query = query.eq("project_id", projectId);
  const { data, error } = await query;
  if (error) throw new Error("No fue posible cargar las tareas.");
  return (data as unknown as TaskRow[]).map(({ projects, profiles, ...task }) => ({ ...task, project_name: projects?.name ?? null, assignee_name: profiles?.full_name ?? null }));
}

export async function getTaskOptions(): Promise<TaskOptions> {
  await requirePermission(PERMISSIONS.CREATE_TASKS);
  const supabase = await createClient();
  const [projects, users] = await Promise.all([
    supabase.from("projects").select("id, name").order("name"),
    supabase.from("profiles").select("id, full_name").eq("is_active", true).order("full_name"),
  ]);
  if (projects.error || users.error) throw new Error("No fue posible cargar las opciones de tareas.");
  return { projects: projects.data, users: users.data };
}

