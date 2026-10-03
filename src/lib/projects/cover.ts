export const DEFAULT_PROJECT_COVER = "/images/project-cover-default.png";
export const PROJECT_COVER_BUCKET = "project-covers";
export const PROJECT_COVER_REFERENCE_PREFIX = "project-cover:";

const projectCoverPathPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|jpeg|png|webp)$/i;

export function projectCoverReference(path: string) {
  return `${PROJECT_COVER_REFERENCE_PREFIX}${path}`;
}

export function projectCoverPath(value: string | null | undefined) {
  if (!value?.startsWith(PROJECT_COVER_REFERENCE_PREFIX)) return null;
  const path = value.slice(PROJECT_COVER_REFERENCE_PREFIX.length);
  return projectCoverPathPattern.test(path) ? path : null;
}

export function isProjectCoverReference(value: string | null | undefined) {
  return projectCoverPath(value) !== null;
}

export function projectCoverBackground(value: string | null | undefined) {
  const primary = value || DEFAULT_PROJECT_COVER;
  return `linear-gradient(to top, rgb(0 0 0 / 0.38), transparent 62%), url(${JSON.stringify(primary)}), url(${JSON.stringify(DEFAULT_PROJECT_COVER)})`;
}
