export const MAX_PROJECT_COVER_SIZE = 5 * 1024 * 1024;
export const PROJECT_COVER_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;

const mimeByExtension: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export function validateProjectCoverFile(file: File): string | null {
  const extension = file.name.trim().split(".").pop()?.toLowerCase();
  if (!extension || !PROJECT_COVER_EXTENSIONS.includes(extension as (typeof PROJECT_COVER_EXTENSIONS)[number])) {
    return "Utiliza una imagen JPG, PNG o WebP.";
  }
  if (mimeByExtension[extension] !== file.type) {
    return "La extensión y el tipo de la imagen no coinciden.";
  }
  if (file.size <= 0 || file.size > MAX_PROJECT_COVER_SIZE) {
    return "La portada debe pesar como máximo 5 MB.";
  }
  return null;
}

export async function hasValidProjectCoverSignature(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
    .every((value, index) => bytes[index] === value);
  const isWebp = String.fromCharCode(...bytes.slice(0, 4)) === "RIFF"
    && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  return isJpeg || isPng || isWebp;
}
