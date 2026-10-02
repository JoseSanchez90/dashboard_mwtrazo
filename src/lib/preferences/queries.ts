import "server-only";

import { cache } from "react";

import { requireAuthenticatedUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_FORMATTING_PREFERENCES, type FormattingPreferences } from "@/types/preferences";

export const getUserPreferences = cache(async (): Promise<FormattingPreferences> => {
  const user = await requireAuthenticatedUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_preferences")
    .select("timezone, date_format, week_starts_on, currency")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error("No fue posible cargar tus preferencias.");
  return data ?? DEFAULT_FORMATTING_PREFERENCES;
});
