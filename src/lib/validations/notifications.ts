import { z } from "zod";

export const notificationIdSchema = z.uuid();

export const notificationPreferencesSchema = z.object({
  task_assigned: z.boolean(),
  task_completed: z.boolean(),
  task_due_soon: z.boolean(),
  task_overdue: z.boolean(),
  event_upcoming: z.boolean(),
  delivery_upcoming: z.boolean(),
  file_uploaded: z.boolean(),
  project_updated: z.boolean(),
  payment_due_soon: z.boolean(),
  payment_overdue: z.boolean(),
});

export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;
