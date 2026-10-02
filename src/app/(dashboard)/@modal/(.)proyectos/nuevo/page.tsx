import { ProjectForm } from "@/components/projects/project-form";
import { RouteModal } from "@/components/shared/route-modal";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/permissions/guards";
import { getProjectFormOptions } from "@/lib/projects/queries";

export default async function NewProjectModal() {
  await requirePermission(PERMISSIONS.CREATE_PROJECTS);
  const options = await getProjectFormOptions();

  return (
    <RouteModal
      title="Nuevo proyecto"
      description="Registra el alcance, planificación y equipo inicial del proyecto."
      className="max-h-[92dvh] overflow-y-auto sm:max-w-4xl"
    >
      <ProjectForm options={options} canAdminister modal />
    </RouteModal>
  );
}
