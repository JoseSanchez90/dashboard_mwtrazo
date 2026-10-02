"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { saveUserPreferencesAction } from "@/app/(dashboard)/configuracion/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AppSelect } from "@/components/shared/app-select";
import { formatCurrency, formatDate } from "@/lib/formatting";
import { userPreferencesSchema } from "@/lib/validations/preferences";
import {
  CURRENCIES,
  CURRENCY_LABELS,
  DATE_FORMATS,
  TIMEZONES,
  TIMEZONE_LABELS,
  type FormattingPreferences,
} from "@/types/preferences";

type PreferencesFormValues = z.infer<typeof userPreferencesSchema>;

export function PreferencesSettings({ preferences }: { preferences: FormattingPreferences }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { handleSubmit, control, formState: { errors, isDirty } } = useForm<PreferencesFormValues>({
    resolver: zodResolver(userPreferencesSchema),
    defaultValues: preferences,
  });
  const current = useWatch({ control });
  const preview = userPreferencesSchema.safeParse(current);
  const previewPreferences = preview.success ? preview.data : preferences;

  const submit = handleSubmit((values) => startTransition(async () => {
    const result = await saveUserPreferencesAction(values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Preferencias guardadas.");
    router.refresh();
  }));

  return (
    <section className="rounded-xl border bg-card p-5 sm:p-6" aria-labelledby="preferences-heading">
      <div className="max-w-2xl">
        <h2 id="preferences-heading" className="text-base font-semibold">Preferencias personales</h2>
        <p className="mt-1 text-sm text-muted-foreground">Estos ajustes se guardan en tu cuenta y no afectan a otros usuarios.</p>
      </div>
      <form onSubmit={submit} className="mt-6 space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Label className="block space-y-2 text-sm font-medium"><span>Zona horaria</span><Controller name="timezone" control={control} render={({ field }) => <AppSelect value={field.value} onValueChange={field.onChange} options={TIMEZONES.map((value) => ({ value, label: TIMEZONE_LABELS[value] }))} />} /></Label>
          <Label className="block space-y-2 text-sm font-medium"><span>Formato de fecha</span><Controller name="date_format" control={control} render={({ field }) => <AppSelect value={field.value} onValueChange={field.onChange} options={DATE_FORMATS.map((value) => ({ value, label: value.replace("YYYY", "AAAA") }))} />} /></Label>
          <Label className="block space-y-2 text-sm font-medium"><span>Primer día de la semana</span><Controller name="week_starts_on" control={control} render={({ field }) => <AppSelect value={String(field.value)} onValueChange={(value) => field.onChange(Number(value))} options={[{ value: "1", label: "Lunes" }, { value: "0", label: "Domingo" }]} />} /></Label>
          <Label className="block space-y-2 text-sm font-medium"><span>Moneda</span><Controller name="currency" control={control} render={({ field }) => <AppSelect value={field.value} onValueChange={field.onChange} options={CURRENCIES.map((value) => ({ value, label: CURRENCY_LABELS[value] }))} />} /></Label>
        </div>
        {Object.keys(errors).length > 0 && <p className="text-sm text-destructive">Revisa los valores seleccionados.</p>}
        <div className="rounded-lg border bg-muted/30 p-4 text-sm">
          <p className="font-medium">Vista previa</p>
          <div className="mt-2 flex flex-wrap gap-x-8 gap-y-1 text-muted-foreground"><span>Fecha: {formatDate("2026-10-02", previewPreferences)}</span><span>Importe: {formatCurrency(1250, previewPreferences)}</span></div>
        </div>
        <div className="flex justify-end"><Button type="submit" disabled={pending || !isDirty}>{pending ? <LoaderCircle className="animate-spin" /> : <Check />}Guardar preferencias</Button></div>
      </form>
    </section>
  );
}
