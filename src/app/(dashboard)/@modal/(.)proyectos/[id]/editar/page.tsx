import { notFound } from "next/navigation";

import { ProjectForm } from "@/components/projects/project-form";
import { RouteModal } from "@/components/shared/route-modal";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { getProjectForEdit, getProjectFormOptions } from "@/lib/projects/queries";

export default async function EditProjectModal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [project, options, user] = await Promise.all([
    getProjectForEdit(id),
    getProjectFormOptions(),
    requireAuthenticatedUser(),
  ]);
  if (!project) notFound();

  return (
    <RouteModal
      title="Editar proyecto"
      description={`Actualiza la información operativa de ${project.name}.`}
      className="max-h-[92dvh] overflow-y-auto sm:max-w-4xl"
    >
      <ProjectForm
        project={project}
        options={options}
        canAdminister={hasPermission(user.profile.role, PERMISSIONS.ASSIGN_PROJECT_MEMBERS)}
        modal
      />
    </RouteModal>
  );
}
