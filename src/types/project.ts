export const PROJECT_STATUSES = [
  "draft",
  "active",
  "on_hold",
  "completed",
  "cancelled",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: "Borrador",
  active: "Activo",
  on_hold: "En pausa",
  completed: "Completado",
  cancelled: "Cancelado",
};

export type Project = {
  id: string;
  client_id: string;
  name: string;
  code: string;
  description: string | null;
  project_type: string | null;
  service_type: string | null;
  address: string | null;
  district: string | null;
  city: string | null;
  area_m2: number | null;
  status: ProjectStatus;
  phase: string | null;
  start_date: string | null;
  due_date: string | null;
  progress: number;
  fee: number | null;
  cover_image: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectMember = {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  participation_role: string | null;
  is_lead: boolean;
};

export type ProjectListItem = Omit<Project, "fee"> & {
  client_name: string;
  members: ProjectMember[];
};

export type ProjectEditData = Project & {
  members: ProjectMember[];
};

export type ProjectFormOptions = {
  clients: Array<{ id: string; name: string }>;
  users: Array<{ id: string; full_name: string }>;
};

export type ProjectPhase = {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  progress: number;
  is_current: boolean;
  completed_at: string | null;
};

export type ProjectPhaseTemplate = {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProjectClientSummary = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  district: string | null;
  city: string | null;
};

export type ProjectDetail = ProjectEditData & {
  client: ProjectClientSummary;
  phases: ProjectPhase[];
};

