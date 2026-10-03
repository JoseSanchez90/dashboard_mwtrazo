"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  filterFn_includesString,
  flexRender,
  globalFilteringFeature,
  rowPaginationFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  LoaderCircle,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  UserRoundSearch,
} from "lucide-react";
import { toast } from "sonner";

import { deleteClientAction } from "@/app/(dashboard)/clientes/actions";
import { EmptyState } from "@/components/shared/empty-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Client } from "@/types/client";

const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filterFns: { includesString: filterFn_includesString },
});

const columnHelper = createColumnHelper<typeof features, Client>();

function ClientActions({
  client,
  canDelete,
}: {
  client: Client;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function removeClient() {
    startTransition(async () => {
      const result = await deleteClientAction(client.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setConfirmOpen(false);
      toast.success("Cliente eliminado.");
      router.refresh();
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className={buttonVariants({
                variant: "default",
                size: "icon-sm",
                className: "text-white",
              })}
              aria-label={`Acciones para ${client.name}`}
            />
          }
        >
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem render={<Link href={`/clientes/${client.id}`} />}>
            <Eye />
            Ver detalle
          </DropdownMenuItem>
          <DropdownMenuItem
            render={<Link href={`/clientes/${client.id}/editar`} />}
          >
            <Pencil />
            Editar
          </DropdownMenuItem>
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setConfirmOpen(true)}
              >
                <Trash2 />
                Eliminar
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>¿Eliminar a {client.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es permanente y solo se completará si el cliente no
              tiene información relacionada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={removeClient}
            >
              {pending && <LoaderCircle className="animate-spin" />}Eliminar
              cliente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function ClientsTable({
  clients,
  canDelete,
}: {
  clients: Client[];
  canDelete: boolean;
}) {
  const [search, setSearch] = useState("");
  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("name", {
          header: "Cliente",
          cell: ({ row }) => (
            <div>
              <Link
                href={`/clientes/${row.original.id}`}
                className="font-medium hover:text-brand hover:underline"
              >
                {row.original.name}
              </Link>
              {row.original.document_number && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {[row.original.document_type, row.original.document_number]
                    .filter(Boolean)
                    .join(" ")}
                </p>
              )}
            </div>
          ),
        }),
        columnHelper.accessor("phone", {
          header: "Teléfono",
          cell: ({ getValue }) =>
            getValue() || <span className="text-muted-foreground">—</span>,
        }),
        columnHelper.accessor("email", {
          header: "Email",
          cell: ({ getValue }) => {
            const email = getValue();
            return email ? (
              <a href={`mailto:${email}`} className="hover:underline">
                {email}
              </a>
            ) : (
              <span className="text-muted-foreground">—</span>
            );
          },
        }),
        columnHelper.accessor("company", {
          header: "Empresa",
          cell: ({ getValue }) =>
            getValue() || <span className="text-muted-foreground">—</span>,
        }),
        columnHelper.display({
          id: "actions",
          header: () => <span className="sr-only">Acciones</span>,
          cell: ({ row }) => (
            <div className="flex justify-end">
              <ClientActions client={row.original} canDelete={canDelete} />
            </div>
          ),
        }),
      ]),
    [canDelete],
  );

  const table = useTable({
    features,
    data: clients,
    columns,
    state: { globalFilter: search },
    onGlobalFilterChange: setSearch,
    globalFilterFn: "includesString",
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });

  if (clients.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState
          icon={UserRoundSearch}
          title="Aún no hay clientes"
          description="Crea el primer cliente para comenzar a organizar la información del estudio."
          action={
            <Link
              href="/clientes/nuevo"
              className="text-sm font-medium text-brand hover:underline"
            >
              Crear cliente
            </Link>
          }
        />
      </div>
    );
  }

  const rows = table.getRowModel().rows;

  return (
    <div className="mt-8 space-y-4">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nombre, correo, teléfono o empresa…"
          aria-label="Buscar clientes"
          className="pl-9"
        />
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table className="min-w-[720px]">
          <TableHeader className="bg-muted/40 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="px-4 last:text-right">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id} className="px-4">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {rows.length === 0 && (
          <div className="px-6 py-12 text-center">
            <UserRoundSearch className="mx-auto size-6 text-muted-foreground" />
            <p className="mt-3 font-medium">No se encontraron clientes</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Prueba con otro nombre, correo, teléfono o empresa.
            </p>
          </div>
        )}

        {table.getFilteredRowModel().rows.length > 0 && (
          <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              {table.getFilteredRowModel().rows.length} cliente
              {table.getFilteredRowModel().rows.length === 1 ? "" : "s"}
            </p>
            <div className="flex items-center gap-2">
              <span>
                Página {table.state.pagination.pageIndex + 1} de{" "}
                {table.getPageCount()}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Página anterior"
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Página siguiente"
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
