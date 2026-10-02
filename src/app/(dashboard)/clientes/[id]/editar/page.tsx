import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ClientForm } from "@/components/clients/client-form";
import { PageHeader } from "@/components/shared/page-header";
import { getClientById } from "@/lib/clients/queries";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/permissions/guards";

export const metadata: Metadata = { title: "Editar cliente" };

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(PERMISSIONS.EDIT_CLIENTS);
  const { id } = await params;
  const client = await getClientById(id);
  if (!client) notFound();

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Editar cliente" description={`Actualiza la información de ${client.name}.`} />
      <ClientForm client={client} />
    </div>
  );
}

