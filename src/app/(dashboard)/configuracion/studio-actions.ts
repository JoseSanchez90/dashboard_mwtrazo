"use server";

import { revalidatePath } from "next/cache";

import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/permissions/guards";
import { createClient } from "@/lib/supabase/server";
import { workspaceSettingsSchema, type WorkspaceSettingsInput } from "@/lib/validations/workspace-settings";

export type WorkspaceSettingsActionResult = { ok: true } | { ok: false; error: string };

const nullable = (value: string) => value.trim() || null;

export async function saveWorkspaceSettingsAction(input: WorkspaceSettingsInput): Promise<WorkspaceSettingsActionResult> {
  await requirePermission(PERMISSIONS.MANAGE_SETTINGS);
  const parsed = workspaceSettingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Revisa la información del estudio." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("workspace_settings").update({
    studio_name: parsed.data.studio_name,
    email: nullable(parsed.data.email),
    phone: nullable(parsed.data.phone),
    address: nullable(parsed.data.address),
    city: parsed.data.city,
    country: parsed.data.country,
  }).eq("id", 1).select("id").maybeSingle();
  if (error || !data) return { ok: false, error: "No fue posible guardar la información del estudio." };
  revalidatePath("/configuracion");
  revalidatePath("/", "layout");
  return { ok: true };
}
