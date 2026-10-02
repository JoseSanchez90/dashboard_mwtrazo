import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const user = await getCurrentUser(); if (!user?.profile.is_active) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 100) ?? "";
  if (query.length < 2) return NextResponse.json({ projects: [], clients: [], tasks: [] });
  const safeQuery = query.replace(/[,().]/g, " ");
  const pattern = `%${safeQuery.replace(/[\\%_]/g, (value) => `\\${value}`)}%`; const supabase = await createClient();
  const [projects, clients, tasks] = await Promise.all([
    hasPermission(user.profile.role, PERMISSIONS.VIEW_PROJECTS) ? supabase.from("projects").select("id, name, code").or(`name.ilike.${pattern},code.ilike.${pattern}`).limit(5) : Promise.resolve({ data: [], error: null }),
    hasPermission(user.profile.role, PERMISSIONS.VIEW_CLIENTS) ? supabase.from("clients").select("id, name, company").or(`name.ilike.${pattern},company.ilike.${pattern}`).limit(5) : Promise.resolve({ data: [], error: null }),
    hasPermission(user.profile.role, PERMISSIONS.VIEW_TASKS) ? supabase.from("tasks").select("id, title, project_id, projects!tasks_project_id_fkey(name)").ilike("title", pattern).limit(5) : Promise.resolve({ data: [], error: null }),
  ]);
  if (projects.error || clients.error || tasks.error) return NextResponse.json({ error: "No fue posible completar la búsqueda." }, { status: 500 });
  return NextResponse.json({ projects: projects.data, clients: clients.data, tasks: tasks.data });
}

