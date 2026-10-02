"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Camera, Check, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { saveWorkspaceSettingsAction } from "@/app/(dashboard)/configuracion/studio-actions";
import { StudioMark } from "@/components/shared/studio-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { workspaceSettingsSchema, type WorkspaceSettingsInput } from "@/lib/validations/workspace-settings";
import type { WorkspaceSettings } from "@/types/workspace-settings";

export function StudioSettings({ settings, logoUrl }: { settings: WorkspaceSettings; logoUrl: string | null }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<WorkspaceSettingsInput>({
    resolver: zodResolver(workspaceSettingsSchema),
    defaultValues: {
      studio_name: settings.studio_name,
      email: settings.email ?? "",
      phone: settings.phone ?? "",
      address: settings.address ?? "",
      city: settings.city,
      country: settings.country,
    },
  });

  const submit = handleSubmit((values) => startTransition(async () => {
    const result = await saveWorkspaceSettingsAction(values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Información del estudio actualizada.");
    reset(values);
    router.refresh();
  }));

  async function uploadLogo(file: File) {
    setUploading(true);
    try {
      const body = new FormData();
      body.set("logo", file);
      const response = await fetch("/api/studio/logo", { method: "POST", body });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        toast.error(result.error ?? "No fue posible actualizar el logo.");
        return;
      }
      toast.success("Logo actualizado.");
      router.refresh();
    } catch {
      toast.error("No fue posible actualizar el logo.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <section className="rounded-xl border bg-card p-5 sm:p-6" aria-labelledby="studio-settings-heading">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background text-primary"><Building2 className="size-4" /></span>
        <div><h2 id="studio-settings-heading" className="text-base font-semibold">Información del estudio</h2><p className="mt-1 text-sm text-muted-foreground">Identidad y datos generales compartidos por MWTRAZO.</p></div>
      </div>

      <div className="mt-6 flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center">
        <StudioMark name={settings.studio_name} logoUrl={logoUrl} className="size-20" />
        <div><p className="text-sm font-medium">Logo</p><p className="mt-1 text-xs leading-5 text-muted-foreground">JPG, PNG o WebP. Máximo 2 MB. Se almacena de forma privada.</p><Input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadLogo(file); }} /><Button type="button" variant="outline" className="mt-3" disabled={uploading} onClick={() => fileRef.current?.click()}>{uploading ? <LoaderCircle className="animate-spin" /> : <Camera />}{logoUrl ? "Reemplazar logo" : "Subir logo"}</Button></div>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Label className="block space-y-2 text-sm font-medium sm:col-span-2"><span>Nombre del estudio</span><Input {...register("studio_name")} aria-invalid={!!errors.studio_name} />{errors.studio_name && <span className="block text-xs text-destructive">{errors.studio_name.message}</span>}</Label>
          <Label className="block space-y-2 text-sm font-medium"><span>Correo</span><Input type="email" {...register("email")} placeholder="Sin definir" aria-invalid={!!errors.email} />{errors.email && <span className="block text-xs text-destructive">{errors.email.message}</span>}</Label>
          <Label className="block space-y-2 text-sm font-medium"><span>Teléfono</span><Input {...register("phone")} placeholder="Sin definir" aria-invalid={!!errors.phone} />{errors.phone && <span className="block text-xs text-destructive">{errors.phone.message}</span>}</Label>
          <Label className="block space-y-2 text-sm font-medium sm:col-span-2"><span>Dirección</span><Input {...register("address")} placeholder="Sin definir" aria-invalid={!!errors.address} />{errors.address && <span className="block text-xs text-destructive">{errors.address.message}</span>}</Label>
          <Label className="block space-y-2 text-sm font-medium"><span>Ciudad</span><Input {...register("city")} aria-invalid={!!errors.city} />{errors.city && <span className="block text-xs text-destructive">{errors.city.message}</span>}</Label>
          <Label className="block space-y-2 text-sm font-medium"><span>País</span><Input {...register("country")} aria-invalid={!!errors.country} />{errors.country && <span className="block text-xs text-destructive">{errors.country.message}</span>}</Label>
        </div>
        <div className="flex justify-end"><Button type="submit" disabled={saving || !isDirty}>{saving ? <LoaderCircle className="animate-spin" /> : <Check />}Guardar información</Button></div>
      </form>
    </section>
  );
}
