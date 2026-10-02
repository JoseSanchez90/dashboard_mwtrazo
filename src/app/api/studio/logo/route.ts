import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { hasValidStudioLogoSignature, MAX_STUDIO_LOGO_SIZE, validateStudioLogo } from "@/lib/validations/workspace-settings";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.profile.is_active) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  if (!hasPermission(user.profile.role, PERMISSIONS.MANAGE_SETTINGS)) return NextResponse.json({ error: "No tienes permiso para cambiar el logo." }, { status: 403 });
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_STUDIO_LOGO_SIZE + 64 * 1024) return NextResponse.json({ error: "El logo supera el límite de 2 MB." }, { status: 413 });

  let formData: FormData;
  try { formData = await request.formData(); } catch { return NextResponse.json({ error: "No fue posible leer la imagen." }, { status: 400 }); }
  const file = formData.get("logo");
  if (!(file instanceof File)) return NextResponse.json({ error: "Selecciona un logo válido." }, { status: 400 });
  const fileError = validateStudioLogo(file);
  if (fileError || !(await hasValidStudioLogoSignature(file))) return NextResponse.json({ error: fileError ?? "El contenido del logo no es válido." }, { status: 400 });

  const extension = file.name.split(".").pop()!.toLowerCase();
  const newPath = `branding/${crypto.randomUUID()}.${extension}`;
  const supabase = await createClient();
  const { data: current } = await supabase.from("workspace_settings").select("logo_path").eq("id", 1).maybeSingle();
  const { error: uploadError } = await supabase.storage.from("studio-assets").upload(newPath, file, { contentType: file.type, upsert: false });
  if (uploadError) return NextResponse.json({ error: "No fue posible guardar el logo." }, { status: 500 });
  const { data, error } = await supabase.from("workspace_settings").update({ logo_path: newPath }).eq("id", 1).select("id").maybeSingle();
  if (error || !data) {
    await supabase.storage.from("studio-assets").remove([newPath]);
    return NextResponse.json({ error: "No fue posible actualizar la configuración." }, { status: 500 });
  }
  if (current?.logo_path) await supabase.storage.from("studio-assets").remove([current.logo_path]);
  revalidatePath("/configuracion");
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
