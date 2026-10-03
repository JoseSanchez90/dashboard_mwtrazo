import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { MAX_PROJECT_FILE_SIZE, projectFileUploadSchema, validateProjectFileMetadata } from "@/lib/validations/project-files";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.profile.is_active) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  if (!hasPermission(user.profile.role, PERMISSIONS.UPLOAD_PROJECT_FILES)) return NextResponse.json({ error: "No tienes permiso para subir archivos." }, { status: 403 });
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_PROJECT_FILE_SIZE + 1024 * 1024) return NextResponse.json({ error: "El archivo supera el límite de 25 MB." }, { status: 413 });

  let formData: FormData;
  try { formData = await request.formData(); } catch { return NextResponse.json({ error: "No fue posible leer la subida." }, { status: 400 }); }
  const file = formData.get("file");
  const parsed = projectFileUploadSchema.safeParse({
    project_id: formData.get("project_id"),
    category: formData.get("category"),
    original_name: formData.get("original_name"),
    original_type: formData.get("original_type"),
    original_size: formData.get("original_size"),
    compression: formData.get("compression"),
  });
  if (!(file instanceof File) || !parsed.success) return NextResponse.json({ error: "La información de la subida no es válida." }, { status: 400 });
  const fileError = validateProjectFileMetadata(parsed.data.original_name, parsed.data.original_type, parsed.data.original_size);
  if (fileError) return NextResponse.json({ error: fileError }, { status: 400 });
  if (file.size <= 0 || file.size > MAX_PROJECT_FILE_SIZE || (parsed.data.compression === "gzip" && file.size >= parsed.data.original_size)) {
    return NextResponse.json({ error: "El contenido comprimido no es válido." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: project } = await supabase.from("projects").select("id").eq("id", parsed.data.project_id).maybeSingle();
  if (!project) return NextResponse.json({ error: "El proyecto no existe o no está disponible." }, { status: 404 });

  const extension = parsed.data.original_name.split(".").pop()!.toLowerCase();
  const filePath = `${parsed.data.project_id}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from("project-files").upload(filePath, file, { contentType: parsed.data.compression === "gzip" ? "application/octet-stream" : parsed.data.original_type, upsert: false });
  if (uploadError) return NextResponse.json({ error: "No fue posible almacenar el archivo." }, { status: 500 });

  const { data, error } = await supabase.from("project_files").insert({ project_id: parsed.data.project_id, uploaded_by: user.id, file_name: parsed.data.original_name.trim(), file_path: filePath, file_type: parsed.data.original_type, file_size: parsed.data.original_size, stored_size: file.size, compression: parsed.data.compression, category: parsed.data.category }).select("id").single();
  if (error || !data) { await createAdminClient().storage.from("project-files").remove([filePath]); return NextResponse.json({ error: "No fue posible registrar el archivo." }, { status: 500 }); }
  revalidatePath("/archivos"); revalidatePath(`/proyectos/${parsed.data.project_id}`);
  return NextResponse.json({ id: data.id }, { status: 201 });
}

