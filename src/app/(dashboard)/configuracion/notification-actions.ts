"use server";

import { revalidatePath } from "next/cache";

import { requireAuthenticatedUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { notificationPreferencesSchema, type NotificationPreferencesInput } from "@/lib/validations/notifications";

type Result = { ok: true } | { ok: false; error: string };

export async function saveNotificationPreferencesAction(input: NotificationPreferencesInput): Promise<Result> {
  const user = await requireAuthenticatedUser();
  const parsed = notificationPreferencesSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Revisa las preferencias seleccionadas." };

  const safePreferences = user.profile.role === "admin"
    ? parsed.data
    : { ...parsed.data, payment_due_soon: false, payment_overdue: false };
  const supabase = await createClient();
  const { error } = await supabase.from("notification_preferences").upsert(
    { user_id: user.id, ...safePreferences },
    { onConflict: "user_id" },
  );
  if (error) return { ok: false, error: "No fue posible guardar tus preferencias de notificación." };
  revalidatePath("/configuracion");
  return { ok: true };
}
