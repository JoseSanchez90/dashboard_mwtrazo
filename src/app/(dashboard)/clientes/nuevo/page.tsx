import type { Metadata } from "next";

import { ClientForm } from "@/components/clients/client-form";
import { PageHeader } from "@/components/shared/page-header";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/permissions/guards";

export const metadata: Metadata = { title: "Nuevo cliente" };

export default async function NewClientPage() {
  await requirePermission(PERMISSIONS.CREATE_CLIENTS);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Nuevo cliente" description="Registra una persona u organización cliente del estudio." />
      <ClientForm />
    </div>
  );
}

