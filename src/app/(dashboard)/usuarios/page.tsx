import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { CreateUserButton, UsersTable } from "@/components/users/user-management";
import { listManagedUsers } from "@/lib/users/queries";

export const metadata: Metadata = { title: "Usuarios" };

export default async function UsersPage() {
  const users = await listManagedUsers();

  return (
    <div>
      <PageHeader
        title="Usuarios"
        description="Administra integrantes, roles y estados de acceso al sistema. La desactivación conserva el historial del estudio."
        actions={<CreateUserButton />}
      />
      <UsersTable users={users} />
    </div>
  );
}
