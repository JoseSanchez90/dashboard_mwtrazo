import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  hasValidAvatarSignature,
  MAX_AVATAR_SIZE,
  validateAvatarFile,
} from "@/lib/validations/profile";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.profile.is_active) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_AVATAR_SIZE + 64 * 1024) {
    return NextResponse.json({ error: "La imagen supera el límite de 2 MB." }, { status: 413 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "No fue posible leer la imagen." }, { status: 400 });
  }

  const file = formData.get("avatar");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Selecciona una imagen válida." }, { status: 400 });
  }

  const fileError = validateAvatarFile(file);
  if (fileError || !(await hasValidAvatarSignature(file))) {
    return NextResponse.json({ error: fileError ?? "El contenido de la imagen no es válido." }, { status: 400 });
  }

  const extension = file.name.split(".").pop()!.toLowerCase();
  const newPath = `${user.id}/${crypto.randomUUID()}.${extension}`;
  const supabase = await createClient();
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(newPath, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: "No fue posible guardar la imagen." }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ avatar_url: newPath })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    await supabase.storage.from("avatars").remove([newPath]);
    return NextResponse.json({ error: "No fue posible actualizar el perfil." }, { status: 500 });
  }

  if (user.profile.avatar_url) {
    await supabase.storage.from("avatars").remove([user.profile.avatar_url]);
  }

  revalidatePath("/perfil");
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
