"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImageIcon, Link2, LoaderCircle, Save, Sparkles, Upload, UsersRound } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import {
  createProjectAction,
  updateProjectAction,
} from "@/app/(dashboard)/proyectos/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { AppSelect } from "@/components/shared/app-select";
import {
  DEFAULT_PROJECT_COVER,
  isProjectCoverReference,
} from "@/lib/projects/cover";
import { cn } from "@/lib/utils";
import { validateProjectCoverFile } from "@/lib/validations/project-cover";
import { projectFormSchema, type ProjectFormInput } from "@/lib/validations/projects";
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  type ProjectEditData,
  type ProjectFormOptions,
} from "@/types/project";

type CoverMode = "default" | "url" | "upload";

function coverModeFromValue(value: string | null | undefined): CoverMode {
  if (isProjectCoverReference(value)) return "upload";
  return value ? "url" : "default";
}

async function uploadProjectCover(file: File) {
  const formData = new FormData();
  formData.set("cover", file);
  const response = await fetch("/api/project-covers", { method: "POST", body: formData });
  const body = await response.json() as { reference?: string; error?: string };
  if (!response.ok || !body.reference) {
    throw new Error(body.error ?? "No fue posible subir la portada.");
  }
  return body.reference;
}

async function discardUploadedCover(reference: string) {
  await fetch("/api/project-covers", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ reference }),
  });
}

const emptyValues: ProjectFormInput = {
  client_id: "",
  name: "",
  code: "",
  description: "",
  project_type: "",
  service_type: "",
  address: "",
  district: "",
  city: "",
  area_m2: "",
  status: "draft",
  phase: "",
  start_date: "",
  due_date: "",
  progress: 0,
  fee: "",
  cover_image: "",
  member_ids: [],
  lead_id: "",
};

function valuesFromProject(project: ProjectEditData): ProjectFormInput {
  return {
    client_id: project.client_id,
    name: project.name,
    code: project.code,
    description: project.description ?? "",
    project_type: project.project_type ?? "",
    service_type: project.service_type ?? "",
    address: project.address ?? "",
    district: project.district ?? "",
    city: project.city ?? "",
    area_m2: project.area_m2?.toString() ?? "",
    status: project.status,
    phase: project.phase ?? "",
    start_date: project.start_date ?? "",
    due_date: project.due_date ?? "",
    progress: project.progress,
    fee: project.fee?.toString() ?? "",
    cover_image: project.cover_image ?? "",
    member_ids: project.members.map((member) => member.user_id),
    lead_id: project.members.find((member) => member.is_lead)?.user_id ?? "",
  };
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <Label className="flex flex-col items-stretch gap-2 text-sm font-medium">
      <span>{label}</span>
      {children}
      {error && <span className="block text-xs font-normal text-destructive">{error}</span>}
    </Label>
  );
}

export function ProjectForm({
  project,
  options,
  canAdminister,
  modal = false,
}: {
  project?: ProjectEditData;
  options: ProjectFormOptions;
  canAdminister: boolean;
  modal?: boolean;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [coverMode, setCoverMode] = useState<CoverMode>(() => coverModeFromValue(project?.cover_image));
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverFileError, setCoverFileError] = useState("");
  const [localCoverPreview, setLocalCoverPreview] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ProjectFormInput>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: project
      ? valuesFromProject(project)
      : { ...emptyValues, phase: options.phases[0]?.name ?? "" },
  });
  const progress = useWatch({ control, name: "progress" });
  const selectedMembers = useWatch({ control, name: "member_ids" });
  const coverValue = useWatch({ control, name: "cover_image" });

  useEffect(() => () => {
    if (localCoverPreview?.startsWith("blob:")) URL.revokeObjectURL(localCoverPreview);
  }, [localCoverPreview]);

  function changeCoverMode(mode: CoverMode) {
    setCoverMode(mode);
    setCoverFile(null);
    setCoverFileError("");
    setLocalCoverPreview(null);
    if (mode === "default") setValue("cover_image", "", { shouldValidate: true });
    if (mode === "url" && isProjectCoverReference(coverValue)) {
      setValue("cover_image", "", { shouldValidate: true });
    }
    if (mode === "upload" && !isProjectCoverReference(coverValue)) {
      setValue("cover_image", "", { shouldValidate: true });
    }
  }

  function selectCoverFile(file: File | null) {
    setCoverFileError("");
    setCoverFile(file);
    setLocalCoverPreview(null);
    if (!file) return;
    const error = validateProjectCoverFile(file);
    if (error) {
      setCoverFileError(error);
      setCoverFile(null);
      return;
    }
    setLocalCoverPreview(URL.createObjectURL(file));
  }

  const submit = handleSubmit((values) => {
    setServerError("");
    startTransition(async () => {
      let uploadedReference: string | null = null;
      let coverImage = coverMode === "url" ? values.cover_image : "";

      try {
        if (coverMode === "upload") {
          if (coverFile) {
            uploadedReference = await uploadProjectCover(coverFile);
            coverImage = uploadedReference;
          } else if (isProjectCoverReference(values.cover_image)) {
            coverImage = values.cover_image;
          }
        }

        const result = project
          ? await updateProjectAction(project.id, { ...values, cover_image: coverImage })
          : await createProjectAction({ ...values, cover_image: coverImage });

        if (!result.ok) {
          if (uploadedReference) await discardUploadedCover(uploadedReference);
          setServerError(result.error);
          toast.error(result.error);
          return;
        }

        toast.success(project ? "Proyecto actualizado." : "Proyecto creado.");
        router.push("/proyectos");
        router.refresh();
      } catch (error) {
        if (uploadedReference) await discardUploadedCover(uploadedReference);
        const message = error instanceof Error ? error.message : "No fue posible guardar el proyecto.";
        setServerError(message);
        toast.error(message);
      }
    });
  });

  const clientName = options.clients.find((client) => client.id === project?.client_id)?.name;
  const phaseOptions = project?.phase && !options.phases.some((phase) => phase.name === project.phase)
    ? [{ id: `historical-${project.id}`, name: project.phase }, ...options.phases]
    : options.phases;
  const coverPreview = localCoverPreview
    ?? (coverMode === "upload" ? project?.cover_image_preview_url : null)
    ?? (coverMode === "url" && coverValue ? coverValue : DEFAULT_PROJECT_COVER);

  return (
    <form onSubmit={submit} className={modal ? "space-y-5" : "mt-8 space-y-8"} noValidate>
      <section className={cn("rounded-xl border bg-card", modal && "border-0 bg-transparent")}>
        {!modal && (
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Información general</h2>
            <p className="mt-1 text-sm text-muted-foreground">Identificación, cliente y alcance principal del proyecto.</p>
          </div>
        )}
        <div className={cn("grid gap-5 p-5 md:grid-cols-2", modal && "px-0 pt-1")}>
          <Field label="Nombre *" error={errors.name?.message}>
            <Input autoFocus aria-invalid={Boolean(errors.name)} {...register("name")} />
          </Field>
          <Field label="Código *" error={errors.code?.message}>
            {canAdminister ? (
              <Input className="uppercase" aria-invalid={Boolean(errors.code)} {...register("code")} />
            ) : (
              <><Input type="hidden" {...register("code")} /><div className="flex h-8 items-center rounded-lg border bg-muted/40 px-2.5 text-sm">{project?.code}</div></>
            )}
          </Field>
          <Field label="Cliente *" error={errors.client_id?.message}>
            {canAdminister ? (
              <Controller name="client_id" control={control} render={({ field }) => <AppSelect value={field.value} onValueChange={field.onChange} emptyLabel="Seleccionar cliente" options={options.clients.map((client) => ({ value: client.id, label: client.name }))} className="w-full" />} />
            ) : (
              <><Input type="hidden" {...register("client_id")} /><div className="flex h-8 items-center rounded-lg border bg-muted/40 px-2.5 text-sm">{clientName ?? "Cliente"}</div></>
            )}
          </Field>
          <Field label="Estado" error={errors.status?.message}>
            <Controller name="status" control={control} render={({ field }) => <AppSelect value={field.value} onValueChange={field.onChange} options={PROJECT_STATUSES.map((status) => ({ value: status, label: PROJECT_STATUS_LABELS[status] }))} className="w-full" />} />
          </Field>
          <Field label="Tipo de proyecto" error={errors.project_type?.message}>
            <Input placeholder="Residencial, comercial…" {...register("project_type")} />
          </Field>
          <Field label="Tipo de servicio" error={errors.service_type?.message}>
            <Input placeholder="Diseño, supervisión…" {...register("service_type")} />
          </Field>
          <Field label="Descripción" error={errors.description?.message}>
            <Textarea {...register("description")} />
          </Field>
          <div className="space-y-3 md:col-span-2">
            <div>
              <Label className="text-sm font-medium">Portada del proyecto</Label>
              <p className="mt-1 text-xs text-muted-foreground">Elige una imagen propia, usa una URL o conserva la portada predeterminada de MWTRAZO.</p>
            </div>
            <div className="grid gap-3 lg:grid-cols-[14rem_minmax(0,1fr)]">
              <div
                className="aspect-[16/9] overflow-hidden rounded-lg border bg-muted bg-cover bg-center"
                style={{ backgroundImage: `linear-gradient(to top, rgb(0 0 0 / 0.24), transparent 65%), url(${JSON.stringify(coverPreview)})` }}
                role="img"
                aria-label="Vista previa de la portada del proyecto"
              />
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <Button type="button" variant={coverMode === "default" ? "secondary" : "outline"} onClick={() => changeCoverMode("default")} aria-pressed={coverMode === "default"}><Sparkles />Predeterminada</Button>
                  <Button type="button" variant={coverMode === "url" ? "secondary" : "outline"} onClick={() => changeCoverMode("url")} aria-pressed={coverMode === "url"}><Link2 />Usar URL</Button>
                  <Button type="button" variant={coverMode === "upload" ? "secondary" : "outline"} onClick={() => changeCoverMode("upload")} aria-pressed={coverMode === "upload"}><Upload />Subir imagen</Button>
                </div>

                {coverMode === "url" ? (
                  <div className="space-y-2">
                    <Label htmlFor="project-cover-url">URL de la portada</Label>
                    <Input id="project-cover-url" type="url" placeholder="https://…" aria-invalid={Boolean(errors.cover_image)} {...register("cover_image")} />
                  </div>
                ) : (
                  <Input type="hidden" {...register("cover_image")} />
                )}

                {coverMode === "upload" && (
                  <div className="space-y-2">
                    <Label htmlFor="project-cover-file">Archivo de imagen</Label>
                    <Input id="project-cover-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => selectCoverFile(event.target.files?.[0] ?? null)} />
                    <p className="text-xs text-muted-foreground">JPG, PNG o WebP, máximo 5 MB. Se guardará de forma privada.</p>
                  </div>
                )}
                {coverMode === "default" && <p className="flex items-center gap-2 text-sm text-muted-foreground"><ImageIcon className="size-4 text-brand" />Se utilizará la portada arquitectónica predeterminada.</p>}
                {(errors.cover_image?.message || coverFileError) && <p className="text-xs text-destructive">{coverFileError || errors.cover_image?.message}</p>}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={cn("rounded-xl border bg-card", modal && "border-0 bg-transparent")}>
        <div className={cn("border-b px-5 py-4", modal && "px-0")}>
          <h2 className={cn("font-semibold", modal && "text-xs tracking-wide text-muted-foreground uppercase")}>Planificación y ubicación</h2>
          {!modal && <p className="mt-1 text-sm text-muted-foreground">Fechas, fase, avance y datos del predio.</p>}
        </div>
        <div className={cn("grid gap-5 p-5 md:grid-cols-2 lg:grid-cols-3", modal && "px-0")}>
          <Field label="Fase" error={errors.phase?.message}>
            <Controller
              name="phase"
              control={control}
              render={({ field }) => (
                <AppSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  emptyLabel="Seleccionar fase"
                  options={phaseOptions.map((phase) => ({ value: phase.name, label: phase.name }))}
                  className="w-full"
                  ariaLabel="Fase del proyecto"
                />
              )}
            />
          </Field>
          <Field label="Fecha de inicio" error={errors.start_date?.message}><Input type="date"  {...register("start_date")} /></Field>
          <Field label="Fecha de entrega" error={errors.due_date?.message}><Input type="date"  {...register("due_date")} /></Field>
          <Field label="Dirección" error={errors.address?.message}><Input {...register("address")} /></Field>
          <Field label="Distrito" error={errors.district?.message}><Input {...register("district")} /></Field>
          <Field label="Ciudad" error={errors.city?.message}><Input {...register("city")} /></Field>
          <Field label="Área (m²)" error={errors.area_m2?.message}><Input type="number" min="0.01" step="0.01"  {...register("area_m2")} /></Field>
          {canAdminister && (
            <Field label="Honorarios" error={errors.fee?.message}><Input type="number" min="0" step="0.01"  {...register("fee")} /></Field>
          )}
          {!canAdminister && <Input type="hidden" {...register("fee")} />}
          <Field label={`Progreso (${progress}%)`} error={errors.progress?.message}>
            <Controller name="progress" control={control} render={({ field }) => <Slider className="mt-4" min={0} max={100} step={1} value={[field.value]} onValueChange={(value) => field.onChange(Number(Array.isArray(value) ? value[0] ?? 0 : value))} aria-label="Progreso del proyecto" />} />
          </Field>
        </div>
      </section>

      {canAdminister && (
        <section className={cn("rounded-xl border bg-card", modal && "border-0 bg-transparent")}>
          <div className={cn("flex items-center gap-3 border-b px-5 py-4", modal && "px-0")}>
            <UsersRound className={cn("size-5 text-brand", modal && "size-4")} />
            <div><h2 className={cn("font-semibold", modal && "text-xs tracking-wide text-muted-foreground uppercase")}>Equipo del proyecto</h2>{!modal && <p className="mt-1 text-sm text-muted-foreground">Asigna integrantes y un responsable principal opcional.</p>}</div>
          </div>
          <div className={cn("grid gap-5 p-5 md:grid-cols-2", modal && "px-0")}>
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium">Miembros</legend>
              {options.users.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay usuarios activos disponibles.</p>
              ) : options.users.map((user) => (
                <Controller key={user.id} name="member_ids" control={control} render={({ field }) => <Label className="flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm"><Checkbox checked={field.value.includes(user.id)} onCheckedChange={(checked) => field.onChange(checked ? [...field.value, user.id] : field.value.filter((id) => id !== user.id))} aria-label={`Asignar a ${user.full_name}`} />{user.full_name}</Label>} />
              ))}
            </fieldset>
            <Field label="Responsable principal" error={errors.lead_id?.message}>
              <Controller name="lead_id" control={control} render={({ field }) => <AppSelect value={field.value} onValueChange={field.onChange} emptyLabel="Sin responsable principal" options={options.users.filter((user) => selectedMembers.includes(user.id)).map((user) => ({ value: user.id, label: user.full_name }))} className="w-full" />} />
            </Field>
          </div>
        </section>
      )}
      {!canAdminister && <><Input type="hidden" {...register("lead_id")} />{selectedMembers.map((id) => <Input key={id} type="hidden" value={id} {...register("member_ids")} />)}</>}

      {serverError && <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{serverError}</p>}

      <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
        {modal ? (
          <Button type="button" variant="outline" size="lg" className="sm:min-w-28" onClick={() => router.back()}>Cancelar</Button>
        ) : (
          <Link href="/proyectos" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "sm:min-w-28")}>Cancelar</Link>
        )}
        <Button type="submit" size="lg" disabled={pending} className="sm:min-w-36">
          {pending ? <LoaderCircle className="animate-spin" /> : <Save />}
          {project ? "Guardar cambios" : "Crear proyecto"}
        </Button>
      </div>
    </form>
  );
}

