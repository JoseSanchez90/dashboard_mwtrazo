"use server";

import { revalidatePath } from "next/cache";

import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/permissions/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createUserSchema,
  deleteUserSchema,
  updateUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from "@/lib/validations/users";

export type UserActionResult = { ok: true; deletedCurrentUser?: boolean } | { ok: false; error: string };

function adminErrorMessage(message: string) {
  if (message.toLowerCase().includes("already")) {
    return "Ya existe una cuenta con ese correo.";
  }
  if (message.toLowerCase().includes("administrador activo")) {
    return "MWTRAZO debe conservar al menos un administrador activo.";
  }
  return "La operación no pudo completarse. Inténtalo nuevamente.";
}

export async function createUserAction(input: CreateUserInput): Promise<UserActionResult> {
  await requirePermission(PERMISSIONS.MANAGE_USERS);
  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Revisa los datos ingresados." };

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.full_name },
  });

  if (error || !data.user) {
    return { ok: false, error: adminErrorMessage(error?.message ?? "") };
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ full_name: parsed.data.full_name, role: parsed.data.role })
    .eq("id", data.user.id)
    .select("id")
    .single();

  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { ok: false, error: adminErrorMessage(profileError.message) };
  }

  revalidatePath("/usuarios");
  return { ok: true };
}

export async function updateUserAction(input: UpdateUserInput): Promise<UserActionResult> {
  await requirePermission(PERMISSIONS.MANAGE_USERS);
  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Revisa los datos ingresados." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      role: parsed.data.role,
      is_active: parsed.data.is_active,
    })
    .eq("id", parsed.data.id);

  if (error) return { ok: false, error: adminErrorMessage(error.message) };

  revalidatePath("/usuarios");
  return { ok: true };
}

export async function deleteUserAction(id: string): Promise<UserActionResult> {
  const currentUser = await requirePermission(PERMISSIONS.MANAGE_USERS);
  const parsed = deleteUserSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "Usuario inválido." };

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("avatar_url")
    .eq("id", parsed.data)
    .maybeSingle();
  if (profileError || !profile) return { ok: false, error: "El usuario no existe." };

  const { error } = await admin.auth.admin.deleteUser(parsed.data);
  if (error) return { ok: false, error: adminErrorMessage(error.message) };

  if (profile.avatar_url) await admin.storage.from("avatars").remove([profile.avatar_url]);
  revalidatePath("/usuarios");
  return { ok: true, deletedCurrentUser: currentUser.id === parsed.data };
}

