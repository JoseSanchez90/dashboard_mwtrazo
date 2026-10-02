import { ClientForm } from "@/components/clients/client-form";
import { RouteModal } from "@/components/shared/route-modal";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/permissions/guards";

export default async function NewClientModal() {
  await requirePermission(PERMISSIONS.CREATE_CLIENTS);

  return (
    <RouteModal
      title="Nuevo cliente"
      description="Registra una persona u organización cliente del estudio."
      className="max-h-[92dvh] overflow-y-auto sm:max-w-3xl"
    >
      <ClientForm modal />
    </RouteModal>
  );
}
