"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createColumnHelper,
  createPaginatedRowModel,
  flexRender,
  rowPaginationFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Grid2X2,
  List,
  LoaderCircle,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { deleteProjectAction } from "@/app/(dashboard)/proyectos/actions";
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
import { AppSelect } from "@/components/shared/app-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFormattingPreferences } from "@/components/providers/formatting-provider";
import { formatDate } from "@/lib/formatting";
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  type ProjectListItem,
  type ProjectStatus,
} from "@/types/project";

const features = tableFeatures({
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
});
const columnHelper = createColumnHelper<typeof features, ProjectListItem>();

const statusStyles: Record<ProjectStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-status-success/10 text-status-success",
  on_hold: "bg-status-warning/10 text-status-warning",
  completed: "bg-status-info/10 text-status-info",
  cancelled: "bg-destructive/10 text-destructive",
};

function StatusBadge({ status }: { status: ProjectStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[status]}`}>{PROJECT_STATUS_LABELS[status]}</span>;
}

function ProjectActions({ project, canDelete }: { project: ProjectListItem; canDelete: boolean }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function removeProject() {
    startTransition(async () => {
      const result = await deleteProjectAction(project.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setConfirmOpen(false);
      toast.success("Proyecto eliminado.");
      router.refresh();
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<button type="button" className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label={`Acciones para ${project.name}`} />}>
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem render={<Link href={`/proyectos/${project.id}/editar`} />}><Pencil />Editar</DropdownMenuItem>
          {canDelete && <><DropdownMenuSeparator /><DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}><Trash2 />Eliminar</DropdownMenuItem></>}
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia><Trash2 /></AlertDialogMedia>
            <AlertDialogTitle>¿Eliminar {project.name}?</AlertDialogTitle>
            <AlertDialogDescription>La operación es permanente y solo se completará si no existe información relacionada.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={pending} onClick={removeProject}>{pending && <LoaderCircle className="animate-spin" />}Eliminar proyecto</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Progress({ value }: { value: number }) {
  return (
    <div className="min-w-24">
      <div className="mb-1.5 flex justify-between text-xs"><span className="text-muted-foreground">Avance</span><span className="font-medium">{value}%</span></div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Avance del proyecto" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}><div className="h-full rounded-full bg-brand" style={{ width: `${value}%` }} /></div>
    </div>
  );
}

function ProjectCard({ project, canDelete }: { project: ProjectListItem; canDelete: boolean }) {
  const formatting = useFormattingPreferences();
  return (
    <article className="group overflow-hidden rounded-xl border bg-card transition-colors hover:border-foreground/20">
      <div
        className="relative aspect-[16/9] bg-muted bg-cover bg-center"
        style={project.cover_image ? { backgroundImage: `linear-gradient(to top, rgb(0 0 0 / 0.28), transparent 55%), url(${JSON.stringify(project.cover_image)})` } : undefined}
      >
        {!project.cover_image && <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--muted),var(--background))]" />}
        <div className="absolute top-3 right-3 rounded-lg bg-background/90 backdrop-blur"><ProjectActions project={project} canDelete={canDelete} /></div>
        <span className="absolute bottom-3 left-3 rounded-md bg-background/90 px-2 py-1 font-mono text-xs font-medium backdrop-blur">{project.code}</span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0"><Link href={`/proyectos/${project.id}`} className="truncate font-semibold hover:text-brand hover:underline">{project.name}</Link><p className="mt-1 truncate text-sm text-muted-foreground">{project.client_name}</p></div>
          <StatusBadge status={project.status} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div><p className="text-muted-foreground">Distrito</p><p className="mt-1 truncate font-medium">{project.district || "—"}</p></div>
          <div><p className="text-muted-foreground">Fase</p><p className="mt-1 truncate font-medium">{project.phase || "—"}</p></div>
        </div>
        <div className="mt-4"><Progress value={project.progress} /></div>
        <div className="mt-4 flex items-center gap-2 border-t pt-3 text-xs text-muted-foreground"><CalendarClock className="size-3.5" />Entrega: {formatDate(project.due_date, formatting)}</div>
      </div>
    </article>
  );
}

export function ProjectsExplorer({ projects, canCreate, canDelete }: { projects: ProjectListItem[]; canCreate: boolean; canDelete: boolean }) {
  const formatting = useFormattingPreferences();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [clientId, setClientId] = useState("");
  const [userId, setUserId] = useState("");

  const clients = useMemo(() => Array.from(new Map(projects.map((project) => [project.client_id, project.client_name])).entries()).sort((a, b) => a[1].localeCompare(b[1])), [projects]);
  const users = useMemo(() => Array.from(new Map(projects.flatMap((project) => project.members.map((member) => [member.user_id, member.full_name] as const))).entries()).sort((a, b) => a[1].localeCompare(b[1])), [projects]);
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es");
    return projects.filter((project) =>
      (!term || [project.name, project.code, project.client_name].some((value) => value.toLocaleLowerCase("es").includes(term))) &&
      (!status || project.status === status) &&
      (!clientId || project.client_id === clientId) &&
      (!userId || project.members.some((member) => member.user_id === userId)),
    );
  }, [projects, search, status, clientId, userId]);

  const columns = useMemo(() => columnHelper.columns([
    columnHelper.accessor("name", { header: "Proyecto", cell: ({ row }) => <div><Link href={`/proyectos/${row.original.id}`} className="font-medium hover:text-brand hover:underline">{row.original.name}</Link><p className="mt-0.5 font-mono text-xs text-muted-foreground">{row.original.code}</p></div> }),
    columnHelper.accessor("client_name", { header: "Cliente" }),
    columnHelper.accessor("status", { header: "Estado", cell: ({ getValue }) => <StatusBadge status={getValue()} /> }),
    columnHelper.accessor("phase", { header: "Fase", cell: ({ getValue }) => getValue() || "—" }),
    columnHelper.accessor("progress", { header: "Progreso", cell: ({ getValue }) => <Progress value={getValue()} /> }),
    columnHelper.accessor("due_date", { header: "Entrega", cell: ({ getValue }) => <span className="text-muted-foreground">{formatDate(getValue(), formatting)}</span> }),
    columnHelper.display({ id: "actions", header: () => <span className="sr-only">Acciones</span>, cell: ({ row }) => <div className="flex justify-end"><ProjectActions project={row.original} canDelete={canDelete} /></div> }),
  ]), [canDelete, formatting]);
  const table = useTable({ features, data: filtered, columns, initialState: { pagination: { pageIndex: 0, pageSize: 10 } } });

  if (projects.length === 0) {
    return <div className="mt-8"><EmptyState icon={Grid2X2} title="Aún no hay proyectos" description="Crea el primer proyecto para comenzar a organizar el trabajo del estudio." action={canCreate ? <Link href="/proyectos/nuevo" className="text-sm font-medium text-brand hover:underline">Crear proyecto</Link> : undefined} /></div>;
  }

  return (
    <div className="mt-8 space-y-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative min-w-0 flex-1 xl:max-w-md"><Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre, código o cliente…" aria-label="Buscar proyectos" className="pl-9" /></div>
        <div className="grid gap-2 sm:grid-cols-3 xl:flex">
          <AppSelect ariaLabel="Filtrar proyectos por estado" value={status} onValueChange={setStatus} emptyLabel="Todos los estados" options={PROJECT_STATUSES.map((item) => ({ value: item, label: PROJECT_STATUS_LABELS[item] }))} />
          <AppSelect ariaLabel="Filtrar proyectos por cliente" value={clientId} onValueChange={setClientId} emptyLabel="Todos los clientes" options={clients.map(([id, name]) => ({ value: id, label: name }))} />
          <AppSelect ariaLabel="Filtrar proyectos por responsable" value={userId} onValueChange={setUserId} emptyLabel="Todos los responsables" options={users.map(([id, name]) => ({ value: id, label: name }))} />
        </div>
        <div className="flex rounded-lg border p-1"><Button variant={view === "grid" ? "secondary" : "ghost"} size="icon-sm" onClick={() => setView("grid")} aria-label="Vista grid"><Grid2X2 /></Button><Button variant={view === "list" ? "secondary" : "ghost"} size="icon-sm" onClick={() => setView("list")} aria-label="Vista lista"><List /></Button></div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Search} title="No se encontraron proyectos" description="Ajusta el buscador o los filtros seleccionados." />
      ) : view === "grid" ? (
        <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">{filtered.map((project) => <ProjectCard key={project.id} project={project} canDelete={canDelete} />)}</div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table className="min-w-[900px]"><TableHeader className="bg-muted/40 text-xs tracking-wide text-muted-foreground uppercase">{table.getHeaderGroups().map((group) => <TableRow key={group.id}>{group.headers.map((header) => <TableHead key={header.id} className="px-4 last:text-right">{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>)}</TableRow>)}</TableHeader><TableBody>{table.getRowModel().rows.map((row) => <TableRow key={row.id}>{row.getAllCells().map((cell) => <TableCell key={cell.id} className="px-4">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>)}</TableBody></Table>
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground"><span>{filtered.length} proyecto{filtered.length === 1 ? "" : "s"}</span><div className="flex items-center gap-2"><span>Página {table.state.pagination.pageIndex + 1} de {table.getPageCount()}</span><Button variant="outline" size="icon-sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label="Página anterior"><ChevronLeft /></Button><Button variant="outline" size="icon-sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label="Página siguiente"><ChevronRight /></Button></div></div>
        </div>
      )}
    </div>
  );
}

