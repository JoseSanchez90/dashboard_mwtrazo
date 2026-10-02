import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { TaskWorkspace } from "@/components/tasks/task-workspace";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { getTaskOptions, listTasks } from "@/lib/tasks/queries";

export const metadata: Metadata = { title: "Tareas" };

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ nuevo?: string }> }) {
  const query = await searchParams;
  const [tasks, options, user] = await Promise.all([listTasks(), getTaskOptions(), requireAuthenticatedUser()]);
  return <div className="space-y-7"><PageHeader title="Tareas" description="Coordina pendientes, responsables, prioridades y fechas del trabajo operativo." /><TaskWorkspace tasks={tasks} options={options} currentUserId={user.id} canCreate={hasPermission(user.profile.role, PERMISSIONS.CREATE_TASKS)} canAssign={hasPermission(user.profile.role, PERMISSIONS.ASSIGN_TASKS)} canDelete={hasPermission(user.profile.role, PERMISSIONS.DELETE_TASKS)} initialCreate={query.nuevo === "1"} /></div>;
}
