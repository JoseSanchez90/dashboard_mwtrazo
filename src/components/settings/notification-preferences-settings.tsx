"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Bell, Check, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { saveNotificationPreferencesAction } from "@/app/(dashboard)/configuracion/notification-actions";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { notificationPreferencesSchema, type NotificationPreferencesInput } from "@/lib/validations/notifications";
import type { UserRole } from "@/types/auth";
import type { NotificationType } from "@/types/notification";

const operationalOptions: Array<{ key: NotificationType; label: string; description: string }> = [
  { key: "task_assigned", label: "Tarea asignada", description: "Cuando te asignen una tarea." },
  { key: "task_completed", label: "Tarea completada", description: "Cuando se complete una tarea que creaste." },
  { key: "task_due_soon", label: "Tarea próxima a vencer", description: "Avisos programados antes del vencimiento." },
  { key: "task_overdue", label: "Tarea vencida", description: "Avisos programados sobre tareas atrasadas." },
  { key: "event_upcoming", label: "Evento próximo", description: "Asignaciones y recordatorios de eventos." },
  { key: "delivery_upcoming", label: "Entrega próxima", description: "Avisos programados de entregas de proyecto." },
  { key: "file_uploaded", label: "Archivo subido", description: "Cuando se agregue un archivo a uno de tus proyectos." },
  { key: "project_updated", label: "Proyecto actualizado", description: "Cambios relevantes en tus proyectos." },
];

const financialOptions: Array<{ key: NotificationType; label: string; description: string }> = [
  { key: "payment_due_soon", label: "Pago próximo a vencer", description: "Avisos programados antes del vencimiento de un pago." },
  { key: "payment_overdue", label: "Pago vencido", description: "Avisos programados sobre pagos atrasados." },
];

function PreferenceRows({ options, control }: { options: typeof operationalOptions; control: ReturnType<typeof useForm<NotificationPreferencesInput>>["control"] }) {
  return (
    <div className="divide-y rounded-xl border">
      {options.map((option) => (
        <Controller key={option.key} name={option.key} control={control} render={({ field }) => (
          <div className="flex items-center gap-4 px-4 py-3.5 sm:px-5">
            <div className="min-w-0 flex-1"><p className="text-sm font-medium">{option.label}</p><p className="mt-0.5 text-xs leading-5 text-muted-foreground">{option.description}</p></div>
            <Switch checked={field.value} onCheckedChange={field.onChange} aria-label={`${field.value ? "Desactivar" : "Activar"} ${option.label}`} />
          </div>
        )} />
      ))}
    </div>
  );
}

export function NotificationPreferencesSettings({ role, preferences }: { role: UserRole; preferences: NotificationPreferencesInput }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm<NotificationPreferencesInput>({ resolver: zodResolver(notificationPreferencesSchema), defaultValues: preferences });
  const submit = form.handleSubmit((values) => startTransition(async () => {
    const result = await saveNotificationPreferencesAction(values);
    if (!result.ok) return void toast.error(result.error);
    form.reset(values);
    toast.success("Preferencias de notificación guardadas.");
    router.refresh();
  }));

  return (
    <section className="rounded-xl border bg-card p-5 sm:p-6" aria-labelledby="notification-preferences-heading">
      <div className="flex items-start gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background text-primary"><Bell className="size-4" /></span><div><h2 id="notification-preferences-heading" className="text-base font-semibold">Notificaciones internas</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Elige qué avisos puede generar MWTRAZO para tu cuenta. Los cambios no eliminan notificaciones existentes.</p></div></div>
      <form onSubmit={submit} className="mt-6 space-y-6">
        <div><h3 className="mb-3 text-sm font-semibold">Operación</h3><PreferenceRows options={operationalOptions} control={form.control} /></div>
        {role === "admin" && <div><h3 className="mb-3 text-sm font-semibold">Finanzas</h3><PreferenceRows options={financialOptions} control={form.control} /></div>}
        <div className="flex justify-end"><Button type="submit" disabled={pending || !form.formState.isDirty}>{pending ? <LoaderCircle className="animate-spin" /> : <Check />}Guardar preferencias</Button></div>
      </form>
    </section>
  );
}
