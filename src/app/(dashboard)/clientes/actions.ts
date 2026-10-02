"use server";

import { revalidatePath } from "next/cache";

import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/permissions/guards";
import { createClient } from "@/lib/supabase/server";
import {
  clientFormSchema,
  clientIdSchema,
  emptyToNull,
  type ClientFormInput,
} from "@/lib/validations/clients";

export type ClientActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

function toClientPayload(input: ClientFormInput) {
  return {
    name: input.name.trim(),
    email: emptyToNull(input.email)?.toLowerCase() ?? null,
    phone: emptyToNull(input.phone),
    document_type: emptyToNull(input.document_type),
    document_number: emptyToNull(input.document_number),
    company: emptyToNull(input.company),
    address: emptyToNull(input.address),
    district: emptyToNull(input.district),
    city: emptyToNull(input.city),
    notes: emptyToNull(input.notes),
  };
}

export async function createClientAction(
  input: ClientFormInput,
): Promise<ClientActionResult> {
  const user = await requirePermission(PERMISSIONS.CREATE_CLIENTS);
  const parsed = clientFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Revisa los datos ingresados." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({ ...toClientPayload(parsed.data), created_by: user.id })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: "No fue posible crear el cliente." };
  }

  revalidatePath("/clientes");
  return { ok: true, id: data.id };
}

export async function updateClientAction(
  id: string,
  input: ClientFormInput,
): Promise<ClientActionResult> {
  await requirePermission(PERMISSIONS.EDIT_CLIENTS);
  const [parsedId, parsedInput] = [
    clientIdSchema.safeParse(id),
    clientFormSchema.safeParse(input),
  ];
  if (!parsedId.success || !parsedInput.success) {
    return { ok: false, error: "Revisa los datos ingresados." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .update(toClientPayload(parsedInput.data))
    .eq("id", parsedId.data)
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: "No fue posible actualizar el cliente." };
  if (!data) return { ok: false, error: "El cliente ya no existe." };

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${parsedId.data}`);
  return { ok: true, id: data.id };
}

export async function deleteClientAction(id: string): Promise<ClientActionResult> {
  await requirePermission(PERMISSIONS.DELETE_CLIENTS);
  const parsed = clientIdSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "El cliente no es válido." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .delete()
    .eq("id", parsed.data)
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      error: "No se puede eliminar el cliente porque tiene información relacionada.",
    };
  }
  if (!data) return { ok: false, error: "El cliente no existe o no puedes eliminarlo." };

  revalidatePath("/clientes");
  return { ok: true, id: data.id };
}

