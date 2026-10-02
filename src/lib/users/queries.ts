import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/permissions/guards";
import type { ManagedUser, Profile } from "@/types/auth";

export async function listManagedUsers(): Promise<ManagedUser[]> {
  await requirePermission(PERMISSIONS.MANAGE_USERS);
  const admin = createAdminClient();

  const [{ data: authData, error: authError }, { data: profiles, error: profileError }] =
    await Promise.all([
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      admin.from("profiles").select("*").order("created_at", { ascending: true }),
    ]);

  if (authError || profileError) {
    throw new Error("No fue posible cargar los usuarios.");
  }

  const profilesById = new Map(
    (profiles as Profile[]).map((profile) => [profile.id, profile]),
  );

  return authData.users.flatMap((authUser) => {
    const profile = profilesById.get(authUser.id);
    if (!profile || !authUser.email) return [];
    return [{ ...profile, email: authUser.email }];
  });
}

