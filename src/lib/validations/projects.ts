import { z } from "zod";

import { PROJECT_STATUSES } from "@/types/project";

const optionalText = (label: string, maximum: number) =>
  z.string().trim().max(maximum, `${label} no puede superar ${maximum} caracteres.`);

const optionalNumber = (label: string, minimum: number) =>
  z.string().trim().refine(
    (value) => value === "" || (Number.isFinite(Number(value)) && Number(value) >= minimum),
    `${label} debe ser un número mayor o igual a ${minimum}.`,
  );

export const projectFormSchema = z
  .object({
    client_id: z.uuid("Selecciona un cliente válido."),
    name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres.").max(180),
    code: z.string().trim().min(2, "El código debe tener al menos 2 caracteres.").max(40),
    description: optionalText("La descripción", 4000),
    project_type: optionalText("El tipo de proyecto", 100),
    service_type: optionalText("El tipo de servicio", 100),
    address: optionalText("La dirección", 240),
    district: optionalText("El distrito", 120),
    city: optionalText("La ciudad", 120),
    area_m2: optionalNumber("El área", 0.01),
    status: z.enum(PROJECT_STATUSES),
    phase: optionalText("La fase", 120),
    start_date: z.string().refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), "Fecha inválida."),
    due_date: z.string().refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), "Fecha inválida."),
    progress: z.number().int().min(0).max(100),
    fee: optionalNumber("Los honorarios", 0),
    cover_image: z.string().trim().max(1000).refine(
      (value) => value === "" || z.url().safeParse(value).success,
      "Ingresa una URL válida.",
    ),
    member_ids: z.array(z.uuid()).max(50),
    lead_id: z.union([z.literal(""), z.uuid()]),
  })
  .refine(
    (data) => !data.start_date || !data.due_date || data.due_date >= data.start_date,
    { path: ["due_date"], message: "La fecha de entrega no puede ser anterior al inicio." },
  )
  .refine(
    (data) => data.lead_id === "" || data.member_ids.includes(data.lead_id),
    { path: ["lead_id"], message: "El responsable principal debe ser miembro del proyecto." },
  );

export const projectIdSchema = z.uuid();
export type ProjectFormInput = z.infer<typeof projectFormSchema>;

export const projectPhaseProgressSchema = z.object({
  phase_definition_id: z.uuid(),
  progress: z.number().int().min(0).max(100),
  is_current: z.boolean(),
});

export const projectPhaseTemplateNameSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres.").max(120),
});

export const projectPhaseTemplateOrderSchema = z
  .array(z.uuid())
  .min(1)
  .max(100)
  .refine((items) => new Set(items).size === items.length, {
    message: "Las fases no pueden repetirse.",
  });

export type ProjectPhaseProgressInput = z.infer<typeof projectPhaseProgressSchema>;

export function optionalNumberValue(value: string) {
  return value === "" ? null : Number(value);
}

