import "server-only";

import { requireAuthenticatedUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  FINANCIAL_NOTIFICATION_TYPES,
  type AppNotification,
  type NotificationEntityType,
  type NotificationPreferences,
} from "@/types/notification";
import { cache } from "react";

type NotificationRow = Omit<AppNotification, "href">;

function notificationHref(entityType: NotificationEntityType | null, entityId: string | null) {
  if (!entityType || !entityId) return null;
  if (entityType === "project") return `/proyectos/${entityId}`;
  if (entityType === "task") return "/tareas";
  if (entityType === "event") return "/calendario";
  if (entityType === "file") return "/archivos";
  if (entityType === "payment") return "/finanzas";
  return null;
}

function mapNotification(row: NotificationRow): AppNotification {
  return { ...row, href: notificationHref(row.entity_type, row.entity_id) };
}

function permittedTypes(role: "admin" | "assistant") {
  return role === "admin" ? null : FINANCIAL_NOTIFICATION_TYPES;
}

export async function listNotifications(): Promise<AppNotification[]> {
  const user = await requireAuthenticatedUser();
  const supabase = await createClient();
  let query = supabase
    .from("notifications")
    .select("id, type, title, message, entity_type, entity_id, read_at, created_at")
    .order("created_at", { ascending: false });
  const excluded = permittedTypes(user.profile.role);
  if (excluded) query = query.not("type", "in", `(${excluded.join(",")})`);
  const { data, error } = await query;
  if (error) throw new Error("No fue posible cargar las notificaciones.");
  return (data as NotificationRow[]).map(mapNotification);
}

export async function getNotificationSummary() {
  const user = await requireAuthenticatedUser();
  const supabase = await createClient();
  const excluded = permittedTypes(user.profile.role);
  let recentQuery = supabase
    .from("notifications")
    .select("id, type, title, message, entity_type, entity_id, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(8);
  let countQuery = supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  if (excluded) {
    const filter = `(${excluded.join(",")})`;
    recentQuery = recentQuery.not("type", "in", filter);
    countQuery = countQuery.not("type", "in", filter);
  }
  const [recent, unread] = await Promise.all([recentQuery, countQuery]);
  if (recent.error || unread.error) throw new Error("No fue posible cargar las notificaciones.");
  return {
    notifications: (recent.data as NotificationRow[]).map(mapNotification),
    unreadCount: unread.count ?? 0,
  };
}

export const getNotificationPreferences = cache(async (): Promise<NotificationPreferences> => {
  const user = await requireAuthenticatedUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("task_assigned, task_completed, task_due_soon, task_overdue, event_upcoming, delivery_upcoming, file_uploaded, project_updated, payment_due_soon, payment_overdue")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error("No fue posible cargar tus preferencias de notificación.");
  return data ?? DEFAULT_NOTIFICATION_PREFERENCES;
});
