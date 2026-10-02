import "server-only";

import { cache } from "react";

import { appConfig } from "@/config/app";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { StudioBranding, WorkspaceSettings } from "@/types/workspace-settings";

const fallbackSettings: WorkspaceSettings = {
  id: 1,
  studio_name: appConfig.name,
  logo_path: null,
  email: null,
  phone: null,
  address: null,
  city: "Lima",
  country: "Perú",
  updated_by: null,
  created_at: "",
  updated_at: "",
};

async function signedLogoUrl(client: ReturnType<typeof createAdminClient>, path: string | null) {
  if (!path) return null;
  const { data } = await client.storage.from("studio-assets").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export const getWorkspaceSettings = cache(async () => {
  await requireAuthenticatedUser();
  const supabase = await createClient();
  const { data, error } = await supabase.from("workspace_settings").select("*").eq("id", 1).maybeSingle();
  if (error) throw new Error("No fue posible cargar la información del estudio.");
  const settings = data ?? fallbackSettings;
  const logoUrl = settings.logo_path
    ? (await supabase.storage.from("studio-assets").createSignedUrl(settings.logo_path, 3600)).data?.signedUrl ?? null
    : null;
  return { settings, logoUrl };
});

export const getPublicStudioBranding = cache(async (): Promise<StudioBranding> => {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("workspace_settings").select("studio_name, logo_path").eq("id", 1).maybeSingle();
    return {
      studioName: data?.studio_name ?? appConfig.name,
      logoUrl: await signedLogoUrl(admin, data?.logo_path ?? null),
    };
  } catch {
    return { studioName: appConfig.name, logoUrl: null };
  }
});
