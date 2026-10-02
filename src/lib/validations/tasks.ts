import { z } from "zod";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/types/task";

const optionalUuid = z.union([z.literal(""), z.uuid()]);
const optionalDate = z.union([z.literal(""), z.iso.date()]);

export const taskIdSchema = z.uuid();
export const taskFormSchema = z.object({
  project_id: optionalUuid,
  title: z.string().trim().min(2, "Ingresa un título.").max(180),
  description: z.string().trim().max(4000),
  assigned_to: optionalUuid,
  status: z.enum(TASK_STATUSES),
  priority: z.enum(TASK_PRIORITIES),
  start_date: optionalDate,
  due_date: optionalDate,
}).superRefine((value, context) => {
  if (value.start_date && value.due_date && value.due_date < value.start_date) context.addIssue({ code: "custom", path: ["due_date"], message: "La fecha límite no puede ser anterior al inicio." });
});
export type TaskFormInput = z.input<typeof taskFormSchema>;

export const taskStatusSchema = z.object({ status: z.enum(TASK_STATUSES) });
export const taskPrioritySchema = z.object({ priority: z.enum(TASK_PRIORITIES) });

