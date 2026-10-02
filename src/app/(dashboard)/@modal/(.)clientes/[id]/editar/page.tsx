import { notFound } from "next/navigation";

import { ClientForm } from "@/components/clients/client-form";
import { RouteModal } from "@/components/shared/route-modal";
import { getClientById } from "@/lib/clients/queries";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/permissions/guards";

export default async function EditClientModal({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(PERMISSIONS.EDIT_CLIENTS);
  const { id } = await params;
  const client = await getClientById(id);
  if (!client) notFound();

  return (
    <RouteModal
      title="Editar cliente"
      description={`Actualiza la información de ${client.name}.`}
      className="max-h-[92dvh] overflow-y-auto sm:max-w-3xl"
    >
      <ClientForm client={client} modal />
    </RouteModal>
  );
}
