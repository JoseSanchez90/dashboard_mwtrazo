import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, Mail, MapPin, Pencil, Phone, UserRound } from "lucide-react";

import { DeleteClientButton } from "@/components/clients/delete-client-button";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { getClientById } from "@/lib/clients/queries";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

export const metadata: Metadata = { title: "Detalle de cliente" };

function DetailItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="py-4">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-1.5 text-sm whitespace-pre-wrap">{value || "—"}</dd>
    </div>
  );
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [client, user] = await Promise.all([getClientById(id), requireAuthenticatedUser()]);
  if (!client) notFound();

  const canDelete = hasPermission(user.profile.role, PERMISSIONS.DELETE_CLIENTS);
  const location = [client.address, client.district, client.city].filter(Boolean).join(", ");
  const document = [client.document_type, client.document_number].filter(Boolean).join(" ");

  return (
    <div>
      <PageHeader
        title={client.name}
        description={client.company || "Cliente de MWTRAZO"}
        actions={
          <>
            <Link href={`/clientes/${client.id}/editar`} className={buttonVariants({ variant: "outline" })}>
              <Pencil />Editar
            </Link>
            {canDelete && <DeleteClientButton id={client.id} name={client.name} />}
          </>
        }
      />

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="rounded-xl border bg-card">
          <div className="flex items-center gap-3 border-b px-5 py-4">
            <UserRound className="size-5 text-brand" />
            <h2 className="font-semibold">Información del cliente</h2>
          </div>
          <dl className="grid divide-y px-5 sm:grid-cols-2 sm:divide-x sm:divide-y-0 sm:[&>div]:px-5 sm:[&>div:first-child]:pl-0">
            <DetailItem label="Documento" value={document || null} />
            <DetailItem label="Empresa" value={client.company} />
          </dl>
          <dl className="grid border-t divide-y px-5 sm:grid-cols-2 sm:divide-x sm:divide-y-0 sm:[&>div]:px-5 sm:[&>div:first-child]:pl-0">
            <DetailItem label="Dirección" value={location || null} />
            <DetailItem label="Notas" value={client.notes} />
          </dl>
        </section>

        <aside className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold">Contacto</h2>
          <div className="mt-5 space-y-4 text-sm">
            <div className="flex gap-3"><Mail className="mt-0.5 size-4 text-muted-foreground" /><span className="break-all">{client.email || "Sin correo"}</span></div>
            <div className="flex gap-3"><Phone className="mt-0.5 size-4 text-muted-foreground" /><span>{client.phone || "Sin teléfono"}</span></div>
            <div className="flex gap-3"><Building2 className="mt-0.5 size-4 text-muted-foreground" /><span>{client.company || "Sin empresa"}</span></div>
            <div className="flex gap-3"><MapPin className="mt-0.5 size-4 text-muted-foreground" /><span>{location || "Sin ubicación"}</span></div>
          </div>
        </aside>
      </div>
    </div>
  );
}

