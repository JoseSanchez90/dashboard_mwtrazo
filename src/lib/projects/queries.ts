import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { requirePermission } from "@/lib/permissions/guards";
import { projectIdSchema } from "@/lib/validations/projects";
import type {
  ProjectEditData,
  ProjectDetail,
  ProjectFormOptions,
  ProjectListItem,
  ProjectMember,
} from "@/types/project";

const listColumns = `
  id, client_id, name, code, description, project_type, service_type,
  address, district, city, area_m2, status, phase, start_date, due_date,
  progress, cover_image, created_by, created_at, updated_at,
  clients!projects_client_id_fkey(name),
  project_members(user_id, participation_role, is_lead,
    profiles!project_members_user_id_fkey(full_name, avatar_url)
  )
` as const;

type JoinedProject = Omit<ProjectListItem, "client_name" | "members"> & {
  clients: { name: string } | null;
  project_members: Array<{
    user_id: string;
    participation_role: string | null;
    is_lead: boolean;
    profiles: { full_name: string; avatar_url: string | null } | null;
  }>;
};

function mapMembers(rows: JoinedProject["project_members"]): ProjectMember[] {
  return rows.flatMap((member) =>
    member.profiles
      ? [{
          user_id: member.user_id,
          full_name: member.profiles.full_name,
          avatar_url: member.profiles.avatar_url,
          participation_role: member.participation_role,
          is_lead: member.is_lead,
        }]
      : [],
  );
}

function mapListProject(row: JoinedProject): ProjectListItem {
  const { clients, project_members, ...project } = row;
  return {
    ...project,
    client_name: clients?.name ?? "Cliente no disponible",
    members: mapMembers(project_members),
  };
}

export async function listProjects(): Promise<ProjectListItem[]> {
  await requirePermission(PERMISSIONS.VIEW_PROJECTS);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(listColumns)
    .order("created_at", { ascending: false });

  if (error) throw new Error("No fue posible cargar los proyectos.");
  return (data as unknown as JoinedProject[]).map(mapListProject);
}

export async function getProjectForEdit(id: string): Promise<ProjectEditData | null> {
  const user = await requirePermission(PERMISSIONS.EDIT_PROJECTS);
  if (!projectIdSchema.safeParse(id).success) return null;

  const isAdmin = hasPermission(user.profile.role, PERMISSIONS.VIEW_PROJECT_FEES);
  const supabase = isAdmin ? createAdminClient() : await createClient();
  const columns = isAdmin ? `${listColumns}, fee` : listColumns;
  const { data, error } = await supabase
    .from("projects")
    .select(columns)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error("No fue posible cargar el proyecto.");
  if (!data) return null;

  const joined = data as unknown as JoinedProject & { fee?: number | null };
  const { clients, project_members, ...project } = joined;
  void clients;
  return {
    ...project,
    fee: isAdmin ? joined.fee ?? null : null,
    members: mapMembers(project_members),
  };
}

export async function getProjectFormOptions(): Promise<ProjectFormOptions> {
  const user = await requirePermission(PERMISSIONS.EDIT_PROJECTS);
  const supabase = await createClient();
  const canAssign = hasPermission(user.profile.role, PERMISSIONS.ASSIGN_PROJECT_MEMBERS);

  const [clientsResult, usersResult] = await Promise.all([
    supabase.from("clients").select("id, name").order("name"),
    canAssign
      ? supabase.from("profiles").select("id, full_name").eq("is_active", true).order("full_name")
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (clientsResult.error || usersResult.error) {
    throw new Error("No fue posible cargar las opciones del proyecto.");
  }

  return {
    clients: clientsResult.data,
    users: usersResult.data,
  };
}

export async function getProjectDetail(id: string): Promise<ProjectDetail | null> {
  const user = await requirePermission(PERMISSIONS.VIEW_PROJECTS);
  if (!projectIdSchema.safeParse(id).success) return null;

  const isAdmin = hasPermission(user.profile.role, PERMISSIONS.VIEW_PROJECT_FEES);
  const projectClient = isAdmin ? createAdminClient() : await createClient();
  const columns = isAdmin ? `${listColumns}, fee` : listColumns;
  const { data, error } = await projectClient
    .from("projects")
    .select(columns)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error("No fue posible cargar el proyecto.");
  if (!data) return null;

  const joined = data as unknown as JoinedProject & { fee?: number | null };
  const supabase = await createClient();
  const [clientResult, phasesResult] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, email, phone, company, address, district, city")
      .eq("id", joined.client_id)
      .single(),
    supabase
      .from("project_phases")
      .select("phase_template_id, name, sort_order, is_active, progress, is_current, completed_at")
      .eq("project_id", id)
      .order("sort_order"),
  ]);

  if (clientResult.error || phasesResult.error) {
    throw new Error("No fue posible cargar el resumen del proyecto.");
  }

  const phases = phasesResult.data.map(({ phase_template_id, ...phase }) => ({
    id: phase_template_id,
    ...phase,
  }));
  const { clients, project_members, ...project } = joined;
  void clients;

  return {
    ...project,
    fee: isAdmin ? joined.fee ?? null : null,
    members: mapMembers(project_members),
    client: clientResult.data,
    phases,
  };
}

