import { z } from "zod";
import { PROJECT_FILE_CATEGORIES } from "@/types/project-file";

export const MAX_PROJECT_FILE_SIZE = 25 * 1024 * 1024;
export const ALLOWED_PROJECT_FILE_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "webp", "dwg", "dxf", "doc", "docx", "xls", "xlsx", "zip"] as const;
export const ALLOWED_PROJECT_FILE_MIME_TYPES = new Set([
  "application/pdf", "image/jpeg", "image/png", "image/webp", "application/acad", "application/x-acad", "image/vnd.dwg", "application/dxf", "image/vnd.dxf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/zip", "application/x-zip-compressed", "application/octet-stream",
]);
const MIME_TYPES_BY_EXTENSION: Record<string, readonly string[]> = {
  pdf: ["application/pdf"], jpg: ["image/jpeg"], jpeg: ["image/jpeg"], png: ["image/png"], webp: ["image/webp"],
  dwg: ["application/acad", "application/x-acad", "image/vnd.dwg", "application/octet-stream"],
  dxf: ["application/dxf", "image/vnd.dxf", "application/octet-stream"],
  doc: ["application/msword", "application/octet-stream"], docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/octet-stream"],
  xls: ["application/vnd.ms-excel", "application/octet-stream"], xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/octet-stream"],
  zip: ["application/zip", "application/x-zip-compressed", "application/octet-stream"],
};
export const projectFileIdSchema = z.uuid();
export const projectFileFieldsSchema = z.object({ project_id: z.uuid(), category: z.enum(PROJECT_FILE_CATEGORIES) });
export const projectFileUploadSchema = projectFileFieldsSchema.extend({
  original_name: z.string().min(1).max(180),
  original_type: z.string().min(1).max(150),
  original_size: z.coerce.number().int().positive().max(MAX_PROJECT_FILE_SIZE),
  compression: z.enum(["none", "gzip"]),
});

export function validateProjectFileMetadata(name: string, mime: string, size: number): string | null {
  const normalizedName = name.trim();
  if (!normalizedName || normalizedName.length > 180 || /[\\/\u0000-\u001f]/.test(normalizedName)) return "El nombre del archivo no es válido.";
  const extension = normalizedName.split(".").pop()?.toLowerCase();
  if (!extension || !ALLOWED_PROJECT_FILE_EXTENSIONS.includes(extension as (typeof ALLOWED_PROJECT_FILE_EXTENSIONS)[number])) return "La extensión del archivo no está permitida.";
  const normalizedMime = mime || "application/octet-stream";
  if (!ALLOWED_PROJECT_FILE_MIME_TYPES.has(normalizedMime) || !MIME_TYPES_BY_EXTENSION[extension]?.includes(normalizedMime)) return "La extensión y el tipo MIME del archivo no coinciden.";
  if (!Number.isSafeInteger(size) || size <= 0 || size > MAX_PROJECT_FILE_SIZE) return "El archivo debe pesar como máximo 25 MB.";
  return null;
}

export function validateProjectFile(file: File): string | null {
  return validateProjectFileMetadata(file.name, file.type, file.size);
}

