import { z } from "zod";

export const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
export const AVATAR_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;

const avatarMimeByExtension: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export const profileNameSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(3, "El nombre debe tener al menos 3 caracteres.")
    .max(120, "El nombre no puede superar 120 caracteres."),
});

export const passwordChangeSchema = z
  .object({
    password: z
      .string()
      .min(12, "La contraseña debe tener al menos 12 caracteres.")
      .max(72, "La contraseña no puede superar 72 caracteres."),
    confirm_password: z.string(),
  })
  .refine((value) => value.password === value.confirm_password, {
    message: "Las contraseñas no coinciden.",
    path: ["confirm_password"],
  });

export function validateAvatarFile(file: File): string | null {
  const name = file.name.trim();
  const extension = name.split(".").pop()?.toLowerCase();

  if (!extension || !AVATAR_EXTENSIONS.includes(extension as (typeof AVATAR_EXTENSIONS)[number])) {
    return "Utiliza una imagen JPG, PNG o WebP.";
  }
  if (avatarMimeByExtension[extension] !== file.type) {
    return "La extensión y el tipo de la imagen no coinciden.";
  }
  if (file.size <= 0 || file.size > MAX_AVATAR_SIZE) {
    return "La imagen debe pesar como máximo 2 MB.";
  }
  return null;
}

export async function hasValidAvatarSignature(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
    .every((value, index) => bytes[index] === value);
  const isWebp = String.fromCharCode(...bytes.slice(0, 4)) === "RIFF"
    && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";

  return isJpeg || isPng || isWebp;
}

export type ProfileNameInput = z.infer<typeof profileNameSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
