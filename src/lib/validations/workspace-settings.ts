import { z } from "zod";

import { hasValidAvatarSignature, MAX_AVATAR_SIZE, validateAvatarFile } from "@/lib/validations/profile";

const optionalEmail = z.union([z.literal(""), z.string().trim().email("Ingresa un correo válido.").max(254)]);

export const workspaceSettingsSchema = z.object({
  studio_name: z.string().trim().min(2, "El nombre es demasiado corto.").max(120),
  email: optionalEmail,
  phone: z.string().trim().max(40, "El teléfono es demasiado largo.").refine((value) => !value || /^[+\d\s().-]+$/.test(value), "Ingresa un teléfono válido."),
  address: z.string().trim().max(240, "La dirección es demasiado larga."),
  city: z.string().trim().min(2, "Ingresa la ciudad.").max(120),
  country: z.string().trim().min(2, "Ingresa el país.").max(120),
});

export function validateStudioLogo(file: File) {
  return validateAvatarFile(file)?.replace("imagen", "imagen del logo").replace("La imagen", "El logo");
}

export const MAX_STUDIO_LOGO_SIZE = MAX_AVATAR_SIZE;
export const hasValidStudioLogoSignature = hasValidAvatarSignature;
export type WorkspaceSettingsInput = z.infer<typeof workspaceSettingsSchema>;
