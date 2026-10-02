import "server-only";

import { requireAuthenticatedUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { listActivity } from "@/lib/activity/queries";
import { PROJECT_STATUSES, type ProjectStatus } from "@/types/project";
import type { DashboardData, DashboardEvent, DashboardFile, DashboardProject, DashboardTask } from "@/types/dashboard";

type ProjectRow = Omit<DashboardProject, "client_name"> & { clients: { name: string } | null; project_members: Array<{ user_id: string }> };
type TaskRow = Omit<DashboardTask, "project_name"> & { projects: { name: string } | null };
type EventRow = Omit<DashboardEvent, "project_name"> & { projects: { name: string } | null };
type FileRow = Omit<DashboardFile, "project_name"> & { projects: { name: string } | null };

export async function getDashboardData(): Promise<DashboardData> {
  const user = await requireAuthenticatedUser(); const supabase = await createClient(); const isAdmin = hasPermission(user.profile.role, PERMISSIONS.VIEW_FINANCES);
  const projectColumns = `id, name, code, status, phase, progress, due_date, updated_at, clients!projects_client_id_fkey(name), ${isAdmin ? "project_members(user_id)" : "project_members!inner(user_id)"}` as const;
  let projectsQuery = supabase.from("projects").select(projectColumns).order("updated_at", { ascending: false });
  let tasksQuery = supabase.from("tasks").select("id, title, status, priority, due_date, assigned_to, updated_at, projects!tasks_project_id_fkey(name)").neq("status", "completed").order("due_date", { ascending: true, nullsFirst: false });
  let eventsQuery = supabase.from("events").select("id, title, type, start_at, assigned_to, created_at, projects!events_project_id_fkey(name)").gte("start_at", new Date().toISOString()).order("start_at");
  const filesQuery = supabase.from("project_files").select("id, file_name, category, project_id, created_at, projects!project_files_project_id_fkey(name)").order("created_at", { ascending: false }).limit(10);
  if (!isAdmin) {
    projectsQuery = projectsQuery.eq("project_members.user_id", user.id);
    tasksQuery = tasksQuery.eq("assigned_to", user.id);
    eventsQuery = eventsQuery.eq("assigned_to", user.id);
  }
  const financePromise = isAdmin ? Promise.all([
    createAdminClient().from("projects").select("fee"),
    supabase.from("project_payments").select("amount, status"),
  ]) : Promise.resolve(null);
  const [projectsResult, tasksResult, eventsResult, filesResult, finance, activityLogs] = await Promise.all([projectsQuery, tasksQuery, eventsQuery, filesQuery, financePromise, listActivity(undefined, 6)]);
  if (projectsResult.error || tasksResult.error || eventsResult.error || filesResult.error || (finance && (finance[0].error || finance[1].error))) throw new Error("No fue posible cargar el dashboard.");

  const projects = (projectsResult.data as unknown as ProjectRow[]).map(({ clients, project_members, ...project }) => { void project_members; return { ...project, client_name: clients?.name ?? "Cliente no disponible" }; });
  const tasks = (tasksResult.data as unknown as TaskRow[]).map(({ projects, ...task }) => ({ ...task, project_name: projects?.name ?? null }));
  const events = (eventsResult.data as unknown as EventRow[]).map(({ projects, ...event }) => ({ ...event, project_name: projects?.name ?? null }));
  const files = (filesResult.data as unknown as FileRow[]).map(({ projects, ...file }) => ({ ...file, project_name: projects?.name ?? "Proyecto no disponible" }));
  const today = new Date().toISOString().slice(0, 10); const weekEnd = new Date(Date.now() + 7 * 86400000).toISOString(); const activeProjects = projects.filter((project) => project.status === "active");
  const pendingCollection = finance ? Math.max((finance[0].data ?? []).reduce((sum, project) => sum + (project.fee ?? 0), 0) - (finance[1].data ?? []).filter((payment) => payment.status === "paid").reduce((sum, payment) => sum + payment.amount, 0), 0) : null;
  const activity = activityLogs.map((item) => ({ id: item.id, label: `${item.user_name} ${item.label}`, detail: item.entity_label, occurred_at: item.created_at, href: item.href }));
  return {
    projects, tasks, events, files, activity,
    kpis: { activeProjects: activeProjects.length, pendingTasks: tasks.length, overdueTasks: tasks.filter((task) => task.due_date && task.due_date < today).length, upcomingEvents: events.filter((event) => event.start_at <= weekEnd).length, upcomingDeliveries: projects.filter((project) => project.due_date && project.due_date >= today && project.status !== "completed" && project.status !== "cancelled").length, pendingCollection },
    projectStatusCounts: PROJECT_STATUSES.map((status) => ({ status, count: projects.filter((project) => project.status === status).length })).filter((item) => item.count > 0) as Array<{ status: ProjectStatus; count: number }>,
  };
}

