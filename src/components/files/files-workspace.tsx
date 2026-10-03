"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Download, FileArchive, FileImage, FileText, LoaderCircle, MoreHorizontal, Plus, Search, Trash2, UploadCloud } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { deleteProjectFileAction, getProjectFileDownloadUrlAction } from "@/app/(dashboard)/archivos/actions";
import { EmptyState } from "@/components/shared/empty-state";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppSelect } from "@/components/shared/app-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MAX_PROJECT_FILE_SIZE, projectFileFieldsSchema } from "@/lib/validations/project-files";
import { PROJECT_FILE_CATEGORIES, PROJECT_FILE_CATEGORY_LABELS, type ProjectFile, type ProjectFileCategory, type ProjectFileOptions } from "@/types/project-file";

type UploadFields = { project_id: string; category: ProjectFileCategory };
type UploadPhase = "idle" | "compressing" | "uploading";
function formatBytes(value: number) { if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`; return `${(value / 1024 / 1024).toFixed(1)} MB`; }
function formatDate(value: string) { return new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function FileIcon({ mime }: { mime: string }) { if (mime.startsWith("image/")) return <FileImage />; if (mime.includes("zip")) return <FileArchive />; return <FileText />; }

async function compressForStorage(file: File): Promise<{ payload: Blob; compression: "none" | "gzip" }> {
  if (!("CompressionStream" in window)) return { payload: file, compression: "none" };
  const compressed = await new Response(file.stream().pipeThrough(new CompressionStream("gzip"))).blob();
  return compressed.size < file.size ? { payload: compressed, compression: "gzip" } : { payload: file, compression: "none" };
}

async function saveDownload(url: string, fileName: string, fileType: string, compression: "none" | "gzip") {
  if (compression === "none") { window.location.assign(url); return; }
  if (!("DecompressionStream" in window)) throw new Error("Este navegador no permite descomprimir el archivo.");
  const response = await fetch(url);
  if (!response.ok || !response.body) throw new Error("No fue posible descargar el archivo.");
  const blob = await new Response(response.body.pipeThrough(new DecompressionStream("gzip"))).blob();
  const objectUrl = URL.createObjectURL(new Blob([blob], { type: fileType }));
  const link = document.createElement("a"); link.href = objectUrl; link.download = fileName; link.click();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

function UploadDialog({ open, onOpenChange, options, fixedProjectId }: { open: boolean; onOpenChange: (value: boolean) => void; options: ProjectFileOptions; fixedProjectId?: string }) {
  const router = useRouter(); const [file, setFile] = useState<File>(); const [progress, setProgress] = useState(0); const [phase, setPhase] = useState<UploadPhase>("idle");
  const busy = phase !== "idle";
  const { handleSubmit, control, formState: { errors } } = useForm<UploadFields>({ resolver: zodResolver(projectFileFieldsSchema), values: { project_id: fixedProjectId ?? "", category: "others" } });
  const submit = handleSubmit(async (values) => {
    if (!file) { toast.error("Selecciona un archivo."); return; }
    if (file.size > MAX_PROJECT_FILE_SIZE) { toast.error("El archivo supera el límite de 25 MB."); return; }
    setPhase("compressing"); setProgress(0);
    let prepared: Awaited<ReturnType<typeof compressForStorage>>;
    try { prepared = await compressForStorage(file); } catch { setPhase("idle"); toast.error("No fue posible preparar el archivo."); return; }
    const body = new FormData(); body.set("file", prepared.payload, file.name); body.set("project_id", values.project_id); body.set("category", values.category); body.set("original_name", file.name); body.set("original_type", file.type || "application/octet-stream"); body.set("original_size", String(file.size)); body.set("compression", prepared.compression);
    const request = new XMLHttpRequest(); request.open("POST", "/api/project-files"); setPhase("uploading");
    request.upload.onprogress = (event) => { if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100)); };
    request.onload = () => { setPhase("idle"); let response: { error?: string } = {}; try { response = JSON.parse(request.responseText || "{}") as { error?: string }; } catch { /* An upstream error can return a non-JSON response. */ } if (request.status < 200 || request.status >= 300) { toast.error(response.error ?? "No fue posible subir el archivo."); return; } const saved = file.size - prepared.payload.size; toast.success(saved > 0 ? `Archivo subido. Se ahorraron ${formatBytes(saved)}.` : "Archivo subido sin compresión adicional."); onOpenChange(false); setFile(undefined); setProgress(0); router.refresh(); };
    request.onerror = () => { setPhase("idle"); toast.error("La conexión se interrumpió durante la subida."); };
    request.send(body);
  });
  return <Dialog open={open} onOpenChange={(value) => { if (!busy) onOpenChange(value); }}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Subir archivo</DialogTitle><DialogDescription>MWTRAZO intentará comprimirlo antes de subirlo y conservará el original si la compresión no ahorra espacio. Máximo 25 MB.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-5">
    {!fixedProjectId && <Label className="flex flex-col items-stretch gap-2 text-sm font-medium"><span>Proyecto</span><Controller name="project_id" control={control} render={({ field }) => <AppSelect value={field.value} onValueChange={field.onChange} emptyLabel="Selecciona un proyecto" options={options.projects.map((project) => ({ value: project.id, label: project.name }))} />} />{errors.project_id && <span className="text-xs text-destructive">Selecciona un proyecto.</span>}</Label>}
    <Label className="flex flex-col items-stretch gap-2 text-sm font-medium"><span>Categoría</span><Controller name="category" control={control} render={({ field }) => <AppSelect value={field.value} onValueChange={field.onChange} options={PROJECT_FILE_CATEGORIES.map((category) => ({ value: category, label: PROJECT_FILE_CATEGORY_LABELS[category] }))} />} /></Label>
    <Label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-5 text-center hover:bg-muted/40"><UploadCloud className="mb-3 size-7 text-brand" /><span className="text-sm font-medium">{file?.name ?? "Seleccionar archivo"}</span><span className="mt-1 text-xs text-muted-foreground">{file ? formatBytes(file.size) : "Haz clic para explorar"}</span><Input type="file" className="sr-only" accept=".pdf,.jpg,.jpeg,.png,.webp,.dwg,.dxf,.doc,.docx,.xls,.xlsx,.zip" onChange={(event) => setFile(event.target.files?.[0])} /></Label>
    {busy && <div aria-live="polite"><div className="mb-1.5 flex justify-between text-xs"><span>{phase === "compressing" ? "Comprimiendo…" : "Subiendo…"}</span><span>{phase === "uploading" ? `${progress}%` : "Preparando"}</span></div><div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={phase === "compressing" ? "Compresión del archivo" : "Progreso de subida"} aria-valuemin={0} aria-valuemax={100} aria-valuenow={phase === "uploading" ? progress : undefined}><div className={`h-full rounded-full bg-brand transition-[width] ${phase === "compressing" ? "w-2/3 animate-pulse" : ""}`} style={phase === "uploading" ? { width: `${progress}%` } : undefined} /></div></div>}
    <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Cancelar</Button><Button type="submit" disabled={busy || !file}>{busy ? <LoaderCircle className="animate-spin" /> : <UploadCloud />}{phase === "compressing" ? "Comprimiendo" : phase === "uploading" ? "Subiendo" : "Subir archivo"}</Button></DialogFooter>
  </form></DialogContent></Dialog>;
}

function FileActions({ file, canDelete }: { file: ProjectFile; canDelete: boolean }) {
  const router = useRouter(); const [confirm, setConfirm] = useState(false); const [pending, startTransition] = useTransition();
  const download = () => startTransition(async () => { const result = await getProjectFileDownloadUrlAction(file.id); if (!result.ok || !result.url || !result.fileName || !result.fileType || !result.compression) { toast.error(result.ok ? "No se recibió una URL de descarga." : result.error); return; } try { await saveDownload(result.url, result.fileName, result.fileType, result.compression); } catch (error) { toast.error(error instanceof Error ? error.message : "No fue posible descargar el archivo."); } });
  const remove = () => startTransition(async () => { const result = await deleteProjectFileAction(file.id); if (!result.ok) { toast.error(result.error); return; } toast.success("Archivo eliminado."); setConfirm(false); router.refresh(); });
  return <><DropdownMenu><DropdownMenuTrigger render={<button type="button" className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label={`Acciones para ${file.file_name}`} />}><MoreHorizontal /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={download}><Download />Descargar</DropdownMenuItem>{canDelete && <><DropdownMenuSeparator /><DropdownMenuItem variant="destructive" onClick={() => setConfirm(true)}><Trash2 />Eliminar</DropdownMenuItem></>}</DropdownMenuContent></DropdownMenu>
  <AlertDialog open={confirm} onOpenChange={setConfirm}><AlertDialogContent><AlertDialogHeader><AlertDialogMedia><Trash2 /></AlertDialogMedia><AlertDialogTitle>¿Eliminar {file.file_name}?</AlertDialogTitle><AlertDialogDescription>Se eliminarán el objeto privado y sus metadatos. Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={pending} onClick={remove}>{pending && <LoaderCircle className="animate-spin" />}Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></>;
}

export function FilesWorkspace({ files, options, canUpload, canDelete, fixedProjectId }: { files: ProjectFile[]; options: ProjectFileOptions; canUpload: boolean; canDelete: boolean; fixedProjectId?: string }) {
  const [search, setSearch] = useState(""); const [project, setProject] = useState(fixedProjectId ?? ""); const [category, setCategory] = useState(""); const [uploadOpen, setUploadOpen] = useState(false);
  const filtered = useMemo(() => files.filter((file) => (!search || file.file_name.toLocaleLowerCase("es").includes(search.toLocaleLowerCase("es"))) && (!project || file.project_id === project) && (!category || file.category === category)), [files, search, project, category]);
  return <div className="space-y-5"><div className="flex flex-col gap-3 sm:flex-row sm:justify-between"><div className="grid flex-1 gap-2 sm:grid-cols-3"><div className="relative"><Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar archivo…" aria-label="Buscar archivos" className="pl-9" /></div>{!fixedProjectId && <AppSelect ariaLabel="Filtrar archivos por proyecto" value={project} onValueChange={setProject} emptyLabel="Todos los proyectos" options={options.projects.map((item) => ({ value: item.id, label: item.name }))} />}<AppSelect ariaLabel="Filtrar archivos por categoría" value={category} onValueChange={setCategory} emptyLabel="Todas las categorías" options={PROJECT_FILE_CATEGORIES.map((item) => ({ value: item, label: PROJECT_FILE_CATEGORY_LABELS[item] }))} /></div>{canUpload && <Button onClick={() => setUploadOpen(true)}><Plus />Subir archivo</Button>}</div>
  {filtered.length === 0 ? <EmptyState icon={FileText} title={files.length === 0 ? "Aún no hay archivos" : "No se encontraron archivos"} description={files.length === 0 ? "Sube documentos, planos o entregables vinculados a un proyecto." : "Ajusta la búsqueda o los filtros seleccionados."} /> : <div className="overflow-hidden rounded-xl border bg-card"><Table className="min-w-[760px]"><TableHeader className="bg-muted/40 text-xs uppercase text-muted-foreground"><TableRow>{["Archivo", "Proyecto", "Categoría", "Tamaño", "Subido por", "Fecha"].map((heading) => <TableHead key={heading} className="px-4">{heading}</TableHead>)}<TableHead className="px-4"><span className="sr-only">Acciones</span></TableHead></TableRow></TableHeader><TableBody>{filtered.map((file) => <TableRow key={file.id}><TableCell className="px-4"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-lg bg-brand/10 text-brand"><FileIcon mime={file.file_type} /></span><div className="min-w-0"><p className="max-w-64 truncate font-medium" title={file.file_name}>{file.file_name}</p><p className="text-xs text-muted-foreground">{file.file_type}</p></div></div></TableCell><TableCell className="px-4">{file.project_name}</TableCell><TableCell className="px-4"><span className="rounded-full bg-muted px-2.5 py-1 text-xs">{PROJECT_FILE_CATEGORY_LABELS[file.category]}</span></TableCell><TableCell className="px-4 text-muted-foreground"><span>{formatBytes(file.stored_size)}</span>{file.compression === "gzip" && <span className="mt-0.5 block text-xs text-status-success">Original: {formatBytes(file.file_size)}</span>}</TableCell><TableCell className="px-4">{file.uploader_name}</TableCell><TableCell className="px-4 text-muted-foreground">{formatDate(file.created_at)}</TableCell><TableCell className="px-4"><FileActions file={file} canDelete={canDelete} /></TableCell></TableRow>)}</TableBody></Table></div>}
  <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} options={options} fixedProjectId={fixedProjectId} /></div>;
}
