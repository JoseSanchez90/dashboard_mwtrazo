import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { AuthenticatedUser, Profile } from "@/types/auth";

export const getCurrentUser = cache(async (): Promise<AuthenticatedUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role, is_active, created_at, updated_at")
    .eq("id", user.id)
    .single();

  if (error || !profile) return null;

  return {
    id: user.id,
    email: user.email,
    profile: profile as Profile,
  };
});

export async function requireAuthenticatedUser() {
  const user = await getCurrentUser();

  if (!user) redirect("/iniciar-sesion");
  if (!user.profile.is_active) redirect("/iniciar-sesion?reason=inactive");

  return user;
}

