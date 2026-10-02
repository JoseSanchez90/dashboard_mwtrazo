export const TASK_STATUSES = ["todo", "in_progress", "completed"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = { todo: "Pendiente", in_progress: "En progreso", completed: "Completado" };

export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = { low: "Baja", medium: "Media", high: "Alta", urgent: "Urgente" };

export type Task = {
  id: string; project_id: string | null; title: string; description: string | null;
  assigned_to: string | null; created_by: string; status: TaskStatus; priority: TaskPriority;
  start_date: string | null; due_date: string | null; completed_by: string | null; completed_at: string | null;
  created_at: string; updated_at: string;
};

export type TaskListItem = Task & { project_name: string | null; assignee_name: string | null };
export type TaskOptions = { projects: Array<{ id: string; name: string }>; users: Array<{ id: string; full_name: string }> };

