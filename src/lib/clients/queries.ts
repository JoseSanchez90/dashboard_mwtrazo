import "server-only";

import { createClient } from "@/lib/supabase/server";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/permissions/guards";
import { clientIdSchema } from "@/lib/validations/clients";
import type { Client } from "@/types/client";

const clientColumns =
  "id, name, email, phone, document_type, document_number, company, address, district, city, notes, created_by, created_at, updated_at" as const;

export async function listClients(): Promise<Client[]> {
  await requirePermission(PERMISSIONS.VIEW_CLIENTS);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select(clientColumns)
    .order("created_at", { ascending: false });

  if (error) throw new Error("No fue posible cargar los clientes.");
  return data;
}

export async function getClientById(id: string): Promise<Client | null> {
  await requirePermission(PERMISSIONS.VIEW_CLIENTS);
  if (!clientIdSchema.safeParse(id).success) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select(clientColumns)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error("No fue posible cargar el cliente.");
  return data;
}

