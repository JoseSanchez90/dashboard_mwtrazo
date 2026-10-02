import Link from "next/link";
import { UserRoundX } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";

export default function ClientNotFound() {
  return (
    <EmptyState
      icon={UserRoundX}
      title="Cliente no encontrado"
      description="El registro no existe, fue eliminado o no está disponible."
      action={<Link href="/clientes" className={buttonVariants({ variant: "outline" })}>Volver a clientes</Link>}
    />
  );
}

