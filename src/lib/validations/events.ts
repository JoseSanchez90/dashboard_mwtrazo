import { z } from "zod";
import { EVENT_TYPES } from "@/types/event";

const optionalUuid = z.union([z.literal(""), z.uuid()]);
export const eventIdSchema = z.uuid();
export const eventFormSchema = z.object({
  project_id: optionalUuid, client_id: optionalUuid,
  title: z.string().trim().min(2, "Ingresa un título.").max(180),
  description: z.string().trim().max(4000), type: z.enum(EVENT_TYPES),
  start_at: z.string().min(1, "Define el inicio."), end_at: z.string().min(1, "Define el final."),
  all_day: z.boolean(), location: z.string().trim().max(240), assigned_to: optionalUuid,
}).superRefine((value, context) => {
  const start = Date.parse(value.start_at); const end = Date.parse(value.end_at);
  if (!Number.isFinite(start)) context.addIssue({ code: "custom", path: ["start_at"], message: "Inicio inválido." });
  if (!Number.isFinite(end)) context.addIssue({ code: "custom", path: ["end_at"], message: "Final inválido." });
  if (Number.isFinite(start) && Number.isFinite(end) && end <= start) context.addIssue({ code: "custom", path: ["end_at"], message: "El final debe ser posterior al inicio." });
});
export type EventFormInput = z.input<typeof eventFormSchema>;

