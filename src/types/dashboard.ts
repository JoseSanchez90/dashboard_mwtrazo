import type { EventType } from "@/types/event";
import type { ProjectFileCategory } from "@/types/project-file";
import type { ProjectStatus } from "@/types/project";
import type { TaskPriority, TaskStatus } from "@/types/task";

export type DashboardProject = { id: string; name: string; code: string; status: ProjectStatus; phase: string | null; progress: number; due_date: string | null; updated_at: string; client_name: string };
export type DashboardTask = { id: string; title: string; status: TaskStatus; priority: TaskPriority; due_date: string | null; assigned_to: string | null; updated_at: string; project_name: string | null };
export type DashboardEvent = { id: string; title: string; type: EventType; start_at: string; assigned_to: string | null; created_at: string; project_name: string | null };
export type DashboardFile = { id: string; file_name: string; category: ProjectFileCategory; project_id: string; created_at: string; project_name: string };
export type DashboardActivity = { id: string; label: string; detail: string; occurred_at: string; href: string };
export type DashboardData = {
  projects: DashboardProject[]; tasks: DashboardTask[]; events: DashboardEvent[]; files: DashboardFile[]; activity: DashboardActivity[];
  kpis: { activeProjects: number; pendingTasks: number; overdueTasks: number; upcomingEvents: number; upcomingDeliveries: number; pendingCollection: number | null };
  projectStatusCounts: Array<{ status: ProjectStatus; count: number }>;
};

