import Link from "next/link";
import { FolderX } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";

export default function ProjectNotFound() {
  return <EmptyState icon={FolderX} title="Proyecto no encontrado" description="El proyecto no existe, fue eliminado o no está disponible." action={<Link href="/proyectos" className={buttonVariants({ variant: "outline" })}>Volver a proyectos</Link>} />;
}

