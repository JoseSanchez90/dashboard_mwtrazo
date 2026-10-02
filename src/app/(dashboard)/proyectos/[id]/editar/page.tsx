import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProjectForm } from "@/components/projects/project-form";
import { PageHeader } from "@/components/shared/page-header";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { getProjectForEdit, getProjectFormOptions } from "@/lib/projects/queries";

export const metadata: Metadata = { title: "Editar proyecto" };

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [project, options, user] = await Promise.all([
    getProjectForEdit(id),
    getProjectFormOptions(),
    requireAuthenticatedUser(),
  ]);
  if (!project) notFound();

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Editar proyecto" description={`Actualiza la información operativa de ${project.name}.`} />
      <ProjectForm
        project={project}
        options={options}
        canAdminister={hasPermission(user.profile.role, PERMISSIONS.ASSIGN_PROJECT_MEMBERS)}
      />
    </div>
  );
}

