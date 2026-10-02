import "server-only";

import { redirect } from "next/navigation";

import { requireAuthenticatedUser } from "@/lib/auth/session";
import { hasPermission, type Permission } from "@/lib/permissions";

export async function requirePermission(permission: Permission) {
  const user = await requireAuthenticatedUser();

  if (!hasPermission(user.profile.role, permission)) {
    redirect("/inicio");
  }

  return user;
}

