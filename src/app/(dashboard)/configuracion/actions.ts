"use server";

import { revalidatePath } from "next/cache";

import { requireAuthenticatedUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { userPreferencesSchema, type UserPreferencesInput } from "@/lib/validations/preferences";

export type PreferencesActionResult = { ok: true } | { ok: false; error: string };

export async function saveUserPreferencesAction(input: UserPreferencesInput): Promise<PreferencesActionResult> {
  const user = await requireAuthenticatedUser();
  const parsed = userPreferencesSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Revisa las preferencias seleccionadas." };
  const supabase = await createClient();
  const { error } = await supabase.from("user_preferences").upsert({
    user_id: user.id,
    ...parsed.data,
  }, { onConflict: "user_id" });
  if (error) return { ok: false, error: "No fue posible guardar tus preferencias." };
  revalidatePath("/configuracion");
  revalidatePath("/", "layout");
  return { ok: true };
}
