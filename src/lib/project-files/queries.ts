import "server-only";

import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/permissions/guards";
import { createClient } from "@/lib/supabase/server";
import type { ProjectFile, ProjectFileOptions } from "@/types/project-file";

type FileRow = Omit<ProjectFile, "project_name" | "uploader_name"> & { projects: { name: string } | null; profiles: { full_name: string } | null };
const columns = "id, project_id, uploaded_by, file_name, file_path, file_type, file_size, stored_size, compression, category, created_at, projects!project_files_project_id_fkey(name), profiles!project_files_uploaded_by_fkey(full_name)" as const;

export async function listProjectFiles(projectId?: string): Promise<ProjectFile[]> {
  await requirePermission(PERMISSIONS.VIEW_PROJECT_FILES);
  const supabase = await createClient(); let query = supabase.from("project_files").select(columns).order("created_at", { ascending: false });
  if (projectId) query = query.eq("project_id", projectId);
  const { data, error } = await query; if (error) throw new Error("No fue posible cargar los archivos.");
  return (data as unknown as FileRow[]).map(({ projects, profiles, ...file }) => ({ ...file, project_name: projects?.name ?? "Proyecto no disponible", uploader_name: profiles?.full_name ?? "Usuario eliminado" }));
}

export async function getProjectFileOptions(): Promise<ProjectFileOptions> {
  await requirePermission(PERMISSIONS.UPLOAD_PROJECT_FILES);
  const supabase = await createClient(); const { data, error } = await supabase.from("projects").select("id, name").order("name");
  if (error) throw new Error("No fue posible cargar los proyectos."); return { projects: data };
}

