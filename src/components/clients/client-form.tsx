"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  createClientAction,
  updateClientAction,
} from "@/app/(dashboard)/clientes/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AppSelect } from "@/components/shared/app-select";
import { cn } from "@/lib/utils";
import {
  clientFormSchema,
  type ClientFormInput,
} from "@/lib/validations/clients";
import { CLIENT_DOCUMENT_TYPES, type Client } from "@/types/client";

const emptyValues: ClientFormInput = {
  name: "",
  email: "",
  phone: "",
  document_type: "",
  document_number: "",
  company: "",
  address: "",
  district: "",
  city: "",
  notes: "",
};

function valuesFromClient(client: Client): ClientFormInput {
  return {
    name: client.name,
    email: client.email ?? "",
    phone: client.phone ?? "",
    document_type: client.document_type ?? "",
    document_number: client.document_number ?? "",
    company: client.company ?? "",
    address: client.address ?? "",
    district: client.district ?? "",
    city: client.city ?? "",
    notes: client.notes ?? "",
  };
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <Label className="flex flex-col items-stretch gap-2 text-sm font-medium">
      <span>{label}</span>
      {children}
      {error && <span className="block text-xs font-normal text-destructive">{error}</span>}
    </Label>
  );
}

export function ClientForm({ client, modal = false }: { client?: Client; modal?: boolean }) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ClientFormInput>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: client ? valuesFromClient(client) : emptyValues,
  });

  const submit = handleSubmit((values) => {
    setServerError("");
    startTransition(async () => {
      const result = client
        ? await updateClientAction(client.id, values)
        : await createClientAction(values);

      if (!result.ok) {
        setServerError(result.error);
        toast.error(result.error);
        return;
      }

      toast.success(client ? "Cliente actualizado." : "Cliente creado.");
      router.push(`/clientes/${result.id}`);
      router.refresh();
    });
  });

  return (
    <form onSubmit={submit} className={modal ? "space-y-5" : "mt-8 space-y-8"} noValidate>
      <section className={cn("rounded-xl border bg-card", modal && "border-0 bg-transparent")}>
        <div className={cn("border-b px-5 py-4", modal && "px-0 pt-1")}>
          <h2 className="font-semibold">Información principal</h2>
          <p className="mt-1 text-sm text-muted-foreground">Datos de identificación y contacto del cliente.</p>
        </div>
        <div className={cn("grid gap-5 p-5 md:grid-cols-2", modal && "px-0")}>
          <Field label="Nombre *" error={errors.name?.message}>
            <Input autoFocus aria-invalid={Boolean(errors.name)} {...register("name")} />
          </Field>
          <Field label="Empresa" error={errors.company?.message}>
            <Input aria-invalid={Boolean(errors.company)} {...register("company")} />
          </Field>
          <Field label="Correo electrónico" error={errors.email?.message}>
            <Input type="email"  aria-invalid={Boolean(errors.email)} {...register("email")} />
          </Field>
          <Field label="Teléfono" error={errors.phone?.message}>
            <Input type="tel"  aria-invalid={Boolean(errors.phone)} {...register("phone")} />
          </Field>
          <Field label="Tipo de documento" error={errors.document_type?.message}>
            <Controller
              name="document_type"
              control={control}
              render={({ field }) => (
                <AppSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  emptyLabel="Seleccionar tipo de documento"
                  options={CLIENT_DOCUMENT_TYPES}
                  className="w-full"
                  ariaLabel="Tipo de documento"
                />
              )}
            />
          </Field>
          <Field label="Número de documento" error={errors.document_number?.message}>
            <Input aria-invalid={Boolean(errors.document_number)} {...register("document_number")} />
          </Field>
        </div>
      </section>

      <section className={cn("rounded-xl border bg-card", modal && "border-0 bg-transparent")}>
        <div className={cn("border-b px-5 py-4", modal && "px-0")}>
          <h2 className="font-semibold">Ubicación y notas</h2>
          <p className="mt-1 text-sm text-muted-foreground">Información complementaria para el trabajo del estudio.</p>
        </div>
        <div className={cn("grid gap-5 p-5 md:grid-cols-2", modal && "px-0")}>
          <Field label="Dirección" error={errors.address?.message}>
            <Input aria-invalid={Boolean(errors.address)} {...register("address")} />
          </Field>
          <Field label="Distrito" error={errors.district?.message}>
            <Input aria-invalid={Boolean(errors.district)} {...register("district")} />
          </Field>
          <Field label="Ciudad" error={errors.city?.message}>
            <Input aria-invalid={Boolean(errors.city)} {...register("city")} />
          </Field>
          <Field label="Notas" error={errors.notes?.message}>
            <Textarea
              aria-invalid={Boolean(errors.notes)}
              {...register("notes")}
            />
          </Field>
        </div>
      </section>

      {serverError && (
        <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
        {modal ? (
          <Button type="button" variant="outline" size="lg" className="sm:min-w-28" onClick={() => router.back()}>Cancelar</Button>
        ) : (
          <Link href={client ? `/clientes/${client.id}` : "/clientes"} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "sm:min-w-28")}>
            Cancelar
          </Link>
        )}
        <Button type="submit" size="lg" disabled={pending} className="sm:min-w-36">
          {pending ? <LoaderCircle className="animate-spin" /> : <Save />}
          {client ? "Guardar cambios" : "Crear cliente"}
        </Button>
      </div>
    </form>
  );
}

