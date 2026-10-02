import type { Metadata } from "next";

import { ProjectForm } from "@/components/projects/project-form";
import { PageHeader } from "@/components/shared/page-header";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/permissions/guards";
import { getProjectFormOptions } from "@/lib/projects/queries";

export const metadata: Metadata = { title: "Nuevo proyecto" };

export default async function NewProjectPage() {
  await requirePermission(PERMISSIONS.CREATE_PROJECTS);
  const options = await getProjectFormOptions();

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Nuevo proyecto" description="Registra el alcance, planificación y equipo inicial del proyecto." />
      <ProjectForm options={options} canAdminister />
    </div>
  );
}

