import { z } from "zod";

const optionalText = (label: string, maximum: number) =>
  z.string().trim().max(maximum, `${label} no puede superar ${maximum} caracteres.`);

export const clientFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(160, "El nombre no puede superar 160 caracteres."),
  email: z
    .string()
    .trim()
    .max(254, "El correo es demasiado largo.")
    .refine((value) => value === "" || z.email().safeParse(value).success, {
      message: "Ingresa un correo válido.",
    }),
  phone: z
    .string()
    .trim()
    .max(30, "El teléfono no puede superar 30 caracteres.")
    .refine((value) => value === "" || /^[0-9+() .-]{6,30}$/.test(value), {
      message: "Ingresa un teléfono válido.",
    }),
  document_type: optionalText("El tipo de documento", 40),
  document_number: optionalText("El número de documento", 40),
  company: optionalText("La empresa", 160),
  address: optionalText("La dirección", 240),
  district: optionalText("El distrito", 120),
  city: optionalText("La ciudad", 120),
  notes: optionalText("Las notas", 2000),
});

export const clientIdSchema = z.uuid();

export type ClientFormInput = z.infer<typeof clientFormSchema>;

export function emptyToNull(value: string) {
  const normalized = value.trim();
  return normalized === "" ? null : normalized;
}

