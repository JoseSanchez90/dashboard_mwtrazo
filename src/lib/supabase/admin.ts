import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

function getAdminConfig() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error("Faltan SUPABASE_URL o SUPABASE_SECRET_KEY en el servidor.");
  }

  return { url, secretKey };
}

export function createAdminClient() {
  const { url, secretKey } = getAdminConfig();

  return createClient<Database>(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

