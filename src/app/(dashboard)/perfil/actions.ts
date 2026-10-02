"use server";

import { revalidatePath } from "next/cache";

import { requireAuthenticatedUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  passwordChangeSchema,
  profileNameSchema,
  type PasswordChangeInput,
  type ProfileNameInput,
} from "@/lib/validations/profile";

export type ProfileActionResult = { ok: true } | { ok: false; error: string };

function refreshProfile() {
  revalidatePath("/perfil");
  revalidatePath("/", "layout");
}

export async function updateOwnProfileAction(
  input: ProfileNameInput,
): Promise<ProfileActionResult> {
  const user = await requireAuthenticatedUser();
  const parsed = profileNameSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Revisa el nombre ingresado." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.full_name })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) return { ok: false, error: "No fue posible actualizar el perfil." };
  refreshProfile();
  return { ok: true };
}

export async function changeOwnPasswordAction(
  input: PasswordChangeInput,
): Promise<ProfileActionResult> {
  await requireAuthenticatedUser();
  const parsed = passwordChangeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Revisa la contraseña ingresada." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) return { ok: false, error: "No fue posible cambiar la contraseña." };
  return { ok: true };
}

export async function removeOwnAvatarAction(): Promise<ProfileActionResult> {
  const user = await requireAuthenticatedUser();
  const oldPath = user.profile.avatar_url;
  if (!oldPath) return { ok: true };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) return { ok: false, error: "No fue posible eliminar el avatar." };

  const { error: storageError } = await supabase.storage.from("avatars").remove([oldPath]);
  if (storageError) {
    return { ok: false, error: "El avatar se retiró del perfil, pero no fue posible limpiar el archivo anterior." };
  }

  refreshProfile();
  return { ok: true };
}
