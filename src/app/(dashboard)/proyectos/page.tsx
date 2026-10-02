import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { ProjectsExplorer } from "@/components/projects/projects-explorer";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { listProjects } from "@/lib/projects/queries";

export const metadata: Metadata = { title: "Proyectos" };

export default async function ProjectsPage() {
  const [projects, user] = await Promise.all([listProjects(), requireAuthenticatedUser()]);
  const canCreate = hasPermission(user.profile.role, PERMISSIONS.CREATE_PROJECTS);
  const canDelete = hasPermission(user.profile.role, PERMISSIONS.DELETE_PROJECTS);

  return (
    <div>
      <PageHeader
        title="Proyectos"
        description="Planifica y da seguimiento al trabajo arquitectónico del estudio."
        actions={canCreate ? <Link href="/proyectos/nuevo" className={buttonVariants()}><Plus />Nuevo proyecto</Link> : undefined}
      />
      <ProjectsExplorer projects={projects} canCreate={canCreate} canDelete={canDelete} />
    </div>
  );
}
