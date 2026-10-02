"use server";

import { revalidatePath } from "next/cache";

import { requireAuthenticatedUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { notificationIdSchema } from "@/lib/validations/notifications";

export type NotificationActionResult = { ok: true } | { ok: false; error: string };

function refreshNotifications() {
  revalidatePath("/notificaciones");
  revalidatePath("/", "layout");
}

export async function markNotificationReadAction(id: string): Promise<NotificationActionResult> {
  const user = await requireAuthenticatedUser();
  const parsed = notificationIdSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "Notificación inválida." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", parsed.data)
    .eq("user_id", user.id)
    .is("read_at", null)
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, error: "No fue posible marcar la notificación." };
  if (data) refreshNotifications();
  return { ok: true };
}

export async function markAllNotificationsReadAction(): Promise<NotificationActionResult> {
  const user = await requireAuthenticatedUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);
  if (error) return { ok: false, error: "No fue posible marcar las notificaciones." };
  refreshNotifications();
  return { ok: true };
}
