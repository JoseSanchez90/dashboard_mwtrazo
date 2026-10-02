export type UserRole = "admin" | "assistant";

export const USER_ROLES = ["admin", "assistant"] as const satisfies readonly UserRole[];

export type Profile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AuthenticatedUser = {
  id: string;
  email: string;
  profile: Profile;
};

export type ManagedUser = Profile & {
  email: string;
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  assistant: "Asistente",
};

