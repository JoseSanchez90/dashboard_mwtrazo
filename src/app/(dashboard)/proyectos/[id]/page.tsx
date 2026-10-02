import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  CalendarDays,
  CheckSquare2,
  FileText,
  Landmark,
  Mail,
  MapPin,
  Pencil,
  Phone,
  UserRound,
  UsersRound,
} from "lucide-react";

import { ProjectPhaseTimeline } from "@/components/projects/project-phase-timeline";
import { TaskWorkspace } from "@/components/tasks/task-workspace";
import { CalendarWorkspace } from "@/components/calendar/calendar-workspace";
import { FilesWorkspace } from "@/components/files/files-workspace";
import { FinanceWorkspace } from "@/components/finances/finance-workspace";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { getProjectDetail } from "@/lib/projects/queries";
import { getTaskOptions, listTasks } from "@/lib/tasks/queries";
import { getEventOptions, listEvents } from "@/lib/events/queries";
import { getProjectFileOptions, listProjectFiles } from "@/lib/project-files/queries";
import { getFinanceData } from "@/lib/finances/queries";
import { listActivity } from "@/lib/activity/queries";
import { formatCurrency, formatDate } from "@/lib/formatting";
import { getUserPreferences } from "@/lib/preferences/queries";
import { PROJECT_STATUS_LABELS, type ProjectStatus } from "@/types/project";

export const metadata: Metadata = { title: "Detalle de proyecto" };

const statusStyles: Record<ProjectStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-status-success/10 text-status-success",
  on_hold: "bg-status-warning/10 text-status-warning",
  completed: "bg-status-info/10 text-status-info",
  cancelled: "bg-destructive/10 text-destructive",
};
function DataItem({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="py-3"><dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</dt><dd className="mt-1.5 text-sm">{value || "—"}</dd></div>;
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireAuthenticatedUser();
  const canViewFinances = hasPermission(user.profile.role, PERMISSIONS.VIEW_FINANCES);
  const [project, tasks, taskOptions, events, eventOptions, files, fileOptions, financeData, activity, preferences] = await Promise.all([getProjectDetail(id), listTasks(id), getTaskOptions(), listEvents(id), getEventOptions(), listProjectFiles(id), getProjectFileOptions(), canViewFinances ? getFinanceData(id) : Promise.resolve(null), listActivity(id, 50), getUserPreferences()]);
  if (!project) notFound();

  const canEditPhases = hasPermission(user.profile.role, PERMISSIONS.EDIT_PROJECT_PHASES);
  const canViewFee = hasPermission(user.profile.role, PERMISSIONS.VIEW_PROJECT_FEES);
  const canCreateTasks = hasPermission(user.profile.role, PERMISSIONS.CREATE_TASKS);
  const canAssignTasks = hasPermission(user.profile.role, PERMISSIONS.ASSIGN_TASKS);
  const canDeleteTasks = hasPermission(user.profile.role, PERMISSIONS.DELETE_TASKS);
  const canCreateEvents = hasPermission(user.profile.role, PERMISSIONS.CREATE_EVENTS);
  const canEditEvents = hasPermission(user.profile.role, PERMISSIONS.EDIT_EVENTS);
  const canDeleteEvents = hasPermission(user.profile.role, PERMISSIONS.DELETE_EVENTS);
  const canUploadFiles = hasPermission(user.profile.role, PERMISSIONS.UPLOAD_PROJECT_FILES);
  const canDeleteFiles = hasPermission(user.profile.role, PERMISSIONS.DELETE_PROJECT_FILES);
  const location = [project.address, project.district, project.city].filter(Boolean).join(", ");

  return (
    <div className="space-y-7">
      <header className="overflow-hidden rounded-xl border bg-card">
        <div className="relative min-h-44 bg-muted bg-cover bg-center p-5 sm:min-h-52 sm:p-7" style={project.cover_image ? { backgroundImage: `linear-gradient(to top, rgb(0 0 0 / 0.76), rgb(0 0 0 / 0.08)), url(${JSON.stringify(project.cover_image)})` } : undefined}>
          {!project.cover_image && <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--muted),var(--background))]" />}
          <div className="relative flex h-full min-h-34 flex-col justify-between sm:min-h-38">
            <div className="flex justify-end"><Link href={`/proyectos/${project.id}/editar`} className={buttonVariants({ variant: "outline" })}><Pencil />Editar proyecto</Link></div>
            <div className={project.cover_image ? "text-white" : "text-foreground"}>
              <div className="flex flex-wrap items-center gap-2"><span className="rounded-md bg-background/90 px-2 py-1 font-mono text-xs font-medium text-foreground">{project.code}</span><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[project.status]}`}>{PROJECT_STATUS_LABELS[project.status]}</span></div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{project.name}</h1>
              <p className={project.cover_image ? "mt-2 text-sm text-white/75" : "mt-2 text-sm text-muted-foreground"}>{project.client.name}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-x-6 gap-y-4 border-t p-5 sm:grid-cols-2 lg:grid-cols-4 lg:p-6">
          <div><p className="text-xs text-muted-foreground">Tipo de proyecto</p><p className="mt-1 text-sm font-medium">{project.project_type || "—"}</p></div>
          <div><p className="text-xs text-muted-foreground">Servicio</p><p className="mt-1 text-sm font-medium">{project.service_type || "—"}</p></div>
          <div><p className="text-xs text-muted-foreground">Ubicación</p><p className="mt-1 text-sm font-medium">{location || "—"}</p></div>
          <div><p className="text-xs text-muted-foreground">Fechas</p><p className="mt-1 text-sm font-medium">{formatDate(project.start_date, preferences, "Sin definir")} — {formatDate(project.due_date, preferences, "Sin definir")}</p></div>
          <div className="sm:col-span-2 lg:col-span-3"><div className="mb-2 flex justify-between text-xs"><span className="text-muted-foreground">Progreso general</span><span className="font-semibold">{project.progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-brand" style={{ width: `${project.progress}%` }} /></div></div>
          <div><p className="text-xs text-muted-foreground">Equipo asignado</p><div className="mt-2 flex -space-x-2">{project.members.length === 0 ? <span className="text-sm">Sin asignar</span> : project.members.slice(0, 5).map((member) => <span key={member.user_id} title={member.full_name} className="flex size-8 items-center justify-center rounded-full border-2 border-card bg-brand/10 text-[0.65rem] font-semibold text-brand">{member.full_name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("")}</span>)}</div></div>
        </div>
      </header>

      <Tabs defaultValue="summary">
        <div className="overflow-x-auto border-b"><TabsList variant="line" className="min-w-max justify-start px-0">
          <TabsTrigger value="summary"><UserRound />Resumen</TabsTrigger>
          <TabsTrigger value="tasks"><CheckSquare2 />Tareas</TabsTrigger>
          <TabsTrigger value="calendar"><CalendarDays />Calendario</TabsTrigger>
          <TabsTrigger value="files"><FileText />Archivos</TabsTrigger>
          <TabsTrigger value="finances"><Landmark />Finanzas</TabsTrigger>
          <TabsTrigger value="activity"><Activity />Actividad</TabsTrigger>
        </TabsList></div>

        <TabsContent value="summary" className="space-y-6 pt-4">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.75fr)]">
            <div className="space-y-6">
              <section className="rounded-xl border bg-card">
                <div className="border-b px-5 py-4"><h2 className="font-semibold">Datos del proyecto</h2></div>
                <dl className="grid gap-x-8 px-5 sm:grid-cols-2 lg:grid-cols-3">
                  <DataItem label="Código" value={<span className="font-mono">{project.code}</span>} />
                  <DataItem label="Estado" value={PROJECT_STATUS_LABELS[project.status]} />
                  <DataItem label="Fase actual" value={project.phase} />
                  <DataItem label="Área" value={project.area_m2 ? `${project.area_m2.toLocaleString("es-PE")} m²` : null} />
                  <DataItem label="Inicio" value={formatDate(project.start_date, preferences, "Sin definir")} />
                  <DataItem label="Entrega" value={formatDate(project.due_date, preferences, "Sin definir")} />
                </dl>
                <div className="border-t px-5 py-4"><p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Descripción</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{project.description || "Sin descripción."}</p></div>
              </section>

              <ProjectPhaseTimeline projectId={project.id} phases={project.phases} canEdit={canEditPhases} />
            </div>

            <div className="space-y-6">
              <section className="rounded-xl border bg-card p-5">
                <h2 className="font-semibold">Cliente</h2>
                <p className="mt-4 font-medium">{project.client.name}</p>
                {project.client.company && <p className="mt-1 text-sm text-muted-foreground">{project.client.company}</p>}
                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex gap-3"><Mail className="mt-0.5 size-4 text-muted-foreground" /><span className="break-all">{project.client.email || "Sin correo"}</span></div>
                  <div className="flex gap-3"><Phone className="mt-0.5 size-4 text-muted-foreground" /><span>{project.client.phone || "Sin teléfono"}</span></div>
                  <div className="flex gap-3"><MapPin className="mt-0.5 size-4 text-muted-foreground" /><span>{[project.client.address, project.client.district, project.client.city].filter(Boolean).join(", ") || "Sin ubicación"}</span></div>
                </div>
                <Link href={`/clientes/${project.client.id}`} className="mt-5 inline-flex text-sm font-medium text-brand hover:underline">Ver cliente</Link>
              </section>

              <section className="rounded-xl border bg-card p-5">
                <div className="flex items-center gap-2"><UsersRound className="size-5 text-brand" /><h2 className="font-semibold">Miembros</h2></div>
                <div className="mt-4 space-y-3">{project.members.length === 0 ? <p className="text-sm text-muted-foreground">No hay usuarios asignados.</p> : project.members.map((member) => <div key={member.user_id} className="flex items-center gap-3"><span className="flex size-8 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">{member.full_name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("")}</span><div className="min-w-0"><p className="truncate text-sm font-medium">{member.full_name}</p><p className="text-xs text-muted-foreground">{member.is_lead ? "Responsable principal" : member.participation_role || "Miembro"}</p></div></div>)}</div>
              </section>

              {canViewFee && project.fee !== null && (
                <section className="rounded-xl border bg-card p-5"><div className="flex items-center gap-2"><Landmark className="size-5 text-brand" /><h2 className="font-semibold">Honorarios</h2></div><p className="mt-4 text-2xl font-semibold">{formatCurrency(project.fee, preferences)}</p><p className="mt-1 text-xs text-muted-foreground">Honorarios contratados en {preferences.currency}.</p></section>
              )}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="tasks" className="pt-5"><TaskWorkspace tasks={tasks} options={taskOptions} currentUserId={user.id} canCreate={canCreateTasks} canAssign={canAssignTasks} canDelete={canDeleteTasks} fixedProjectId={project.id} /></TabsContent>
        <TabsContent value="calendar" className="pt-5"><CalendarWorkspace events={events} options={eventOptions} canCreate={canCreateEvents} canEdit={canEditEvents} canDelete={canDeleteEvents} fixedProjectId={project.id} /></TabsContent>
        <TabsContent value="files" className="pt-5"><FilesWorkspace files={files} options={fileOptions} canUpload={canUploadFiles} canDelete={canDeleteFiles} fixedProjectId={project.id} /></TabsContent>
        <TabsContent value="finances" className="pt-5">{financeData ? <FinanceWorkspace data={financeData} fixedProjectId={project.id} /> : <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">No tienes permiso para consultar información financiera.</div>}</TabsContent>
        <TabsContent value="activity" className="pt-5"><ActivityFeed activity={activity} /></TabsContent>
      </Tabs>
    </div>
  );
}

