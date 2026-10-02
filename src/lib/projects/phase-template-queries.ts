import "server-only";

import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/permissions/guards";
import { createClient } from "@/lib/supabase/server";
import type { ProjectPhaseTemplate } from "@/types/project";

export async function listProjectPhaseTemplates(): Promise<ProjectPhaseTemplate[]> {
  await requirePermission(PERMISSIONS.MANAGE_PROJECT_PHASES);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_phase_templates")
    .select("id, name, sort_order, is_active, created_at, updated_at")
    .order("sort_order")
    .order("name");

  if (error) throw new Error("No fue posible cargar las fases predeterminadas.");
  return data;
}
