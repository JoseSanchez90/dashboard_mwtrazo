import type { Metadata } from "next";
import { FilesWorkspace } from "@/components/files/files-workspace";
import { PageHeader } from "@/components/shared/page-header";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { getProjectFileOptions, listProjectFiles } from "@/lib/project-files/queries";

export const metadata: Metadata = { title: "Archivos" };

export default async function FilesPage() {
  const [files, options, user] = await Promise.all([listProjectFiles(), getProjectFileOptions(), requireAuthenticatedUser()]);
  return <div className="space-y-7"><PageHeader title="Archivos" description="Centraliza planos, contratos, entregables y documentos privados del estudio." /><FilesWorkspace files={files} options={options} canUpload={hasPermission(user.profile.role, PERMISSIONS.UPLOAD_PROJECT_FILES)} canDelete={hasPermission(user.profile.role, PERMISSIONS.DELETE_PROJECT_FILES)} /></div>;
}
