import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { ClientsTable } from "@/components/clients/clients-table";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { listClients } from "@/lib/clients/queries";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

export const metadata: Metadata = { title: "Clientes" };

export default async function ClientsPage() {
  const [clients, user] = await Promise.all([listClients(), requireAuthenticatedUser()]);

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Organiza los datos de contacto y la información comercial del estudio."
        actions={
          <Link href="/clientes/nuevo" className={buttonVariants()}>
            <Plus />Nuevo cliente
          </Link>
        }
      />
      <ClientsTable
        clients={clients}
        canDelete={hasPermission(user.profile.role, PERMISSIONS.DELETE_CLIENTS)}
      />
    </div>
  );
}
