import { z } from "zod";

import { USER_ROLES } from "@/types/auth";

const fullName = z
  .string()
  .trim()
  .min(3, "El nombre debe tener al menos 3 caracteres.")
  .max(120, "El nombre no puede superar 120 caracteres.");

export const createUserSchema = z.object({
  full_name: fullName,
  email: z.email("Ingresa un correo válido."),
  password: z
    .string()
    .min(12, "La contraseña temporal debe tener al menos 12 caracteres.")
    .max(72, "La contraseña no puede superar 72 caracteres."),
  role: z.enum(USER_ROLES),
});

export const updateUserSchema = z.object({
  id: z.uuid(),
  full_name: fullName,
  role: z.enum(USER_ROLES),
  is_active: z.boolean(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

