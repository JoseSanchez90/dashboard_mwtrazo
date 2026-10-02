export const NOTIFICATION_TYPES = [
  "task_assigned",
  "task_completed",
  "task_due_soon",
  "task_overdue",
  "event_upcoming",
  "delivery_upcoming",
  "file_uploaded",
  "project_updated",
  "payment_due_soon",
  "payment_overdue",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
export type NotificationEntityType = "task" | "event" | "project" | "file" | "payment";

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  entity_type: NotificationEntityType | null;
  entity_id: string | null;
  read_at: string | null;
  created_at: string;
  href: string | null;
};

export const FINANCIAL_NOTIFICATION_TYPES: readonly NotificationType[] = [
  "payment_due_soon",
  "payment_overdue",
];

export type NotificationPreferences = Record<NotificationType, boolean>;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  task_assigned: true,
  task_completed: true,
  task_due_soon: true,
  task_overdue: true,
  event_upcoming: true,
  delivery_upcoming: true,
  file_uploaded: true,
  project_updated: true,
  payment_due_soon: true,
  payment_overdue: true,
};
