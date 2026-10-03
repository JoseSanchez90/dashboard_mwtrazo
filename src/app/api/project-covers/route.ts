import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import {
  PROJECT_COVER_BUCKET,
  projectCoverPath,
  projectCoverReference,
} from "@/lib/projects/cover";
import { createClient } from "@/lib/supabase/server";
import {
  hasValidProjectCoverSignature,
  MAX_PROJECT_COVER_SIZE,
  validateProjectCoverFile,
} from "@/lib/validations/project-cover";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.profile.is_active) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  if (!hasPermission(user.profile.role, PERMISSIONS.EDIT_PROJECTS)) {
    return NextResponse.json({ error: "No tienes permiso para subir portadas." }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_PROJECT_COVER_SIZE + 64 * 1024) {
    return NextResponse.json({ error: "La portada supera el límite de 5 MB." }, { status: 413 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "No fue posible leer la imagen." }, { status: 400 });
  }

  const file = formData.get("cover");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Selecciona una portada válida." }, { status: 400 });
  }
  const fileError = validateProjectCoverFile(file);
  if (fileError || !(await hasValidProjectCoverSignature(file))) {
    return NextResponse.json({ error: fileError ?? "El contenido de la imagen no es válido." }, { status: 400 });
  }

  const extension = file.name.split(".").pop()!.toLowerCase();
  const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
  const supabase = await createClient();
  const { error } = await supabase.storage
    .from(PROJECT_COVER_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    return NextResponse.json({ error: "No fue posible guardar la portada." }, { status: 500 });
  }

  return NextResponse.json({ reference: projectCoverReference(path) });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user?.profile.is_active) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  if (!hasPermission(user.profile.role, PERMISSIONS.EDIT_PROJECTS)) {
    return NextResponse.json({ error: "No tienes permiso para eliminar portadas." }, { status: 403 });
  }

  let reference = "";
  try {
    const body = await request.json() as { reference?: unknown };
    reference = typeof body.reference === "string" ? body.reference : "";
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const path = projectCoverPath(reference);
  if (!path || !path.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "La portada no es válida." }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.storage.from(PROJECT_COVER_BUCKET).remove([path]);
  if (error) {
    return NextResponse.json({ error: "No fue posible eliminar la portada temporal." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
