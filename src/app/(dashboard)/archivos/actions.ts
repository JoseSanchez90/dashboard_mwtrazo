"use server";

import { revalidatePath } from "next/cache";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/permissions/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { projectFileIdSchema } from "@/lib/validations/project-files";

export type ProjectFileActionResult = { ok: true; url?: string } | { ok: false; error: string };

export async function getProjectFileDownloadUrlAction(id: string): Promise<ProjectFileActionResult> {
  await requirePermission(PERMISSIONS.DOWNLOAD_PROJECT_FILES); const parsed = projectFileIdSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "Archivo inválido." };
  const supabase = await createClient(); const { data: file } = await supabase.from("project_files").select("file_path, file_name").eq("id", parsed.data).maybeSingle();
  if (!file) return { ok: false, error: "El archivo no existe o no está disponible." };
  const { data, error } = await supabase.storage.from("project-files").createSignedUrl(file.file_path, 60, { download: file.file_name });
  if (error || !data) return { ok: false, error: "No fue posible preparar la descarga." };
  return { ok: true, url: data.signedUrl };
}

export async function deleteProjectFileAction(id: string): Promise<ProjectFileActionResult> {
  await requirePermission(PERMISSIONS.DELETE_PROJECT_FILES); const parsed = projectFileIdSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "Archivo inválido." };
  const supabase = await createClient(); const { data: file } = await supabase.from("project_files").select("file_path, project_id").eq("id", parsed.data).maybeSingle();
  if (!file) return { ok: false, error: "El archivo no existe." };
  const admin = createAdminClient(); const { error: storageError } = await admin.storage.from("project-files").remove([file.file_path]);
  if (storageError) return { ok: false, error: "No fue posible eliminar el objeto almacenado." };
  const { error } = await admin.from("project_files").delete().eq("id", parsed.data);
  if (error) return { ok: false, error: "El objeto se eliminó, pero no fue posible retirar sus metadatos." };
  revalidatePath("/archivos"); revalidatePath(`/proyectos/${file.project_id}`); return { ok: true };
}

