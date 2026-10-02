import "server-only";

import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/permissions/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { FinanceData, ProjectExpense, ProjectPayment } from "@/types/finance";

export async function getFinanceData(projectId?: string): Promise<FinanceData> {
  await requirePermission(PERMISSIONS.VIEW_FINANCES);
  const admin = createAdminClient(); const supabase = await createClient();
  let projectsQuery = admin.from("projects").select("id, name, code, fee").order("name");
  let paymentsQuery = supabase.from("project_payments").select("id, project_id, concept, amount, due_date, paid_at, status, notes, created_by, created_at, updated_at").order("due_date", { ascending: true, nullsFirst: false });
  let expensesQuery = supabase.from("project_expenses").select("id, project_id, concept, amount, expense_date, notes, created_by, created_at, updated_at").order("expense_date", { ascending: false });
  if (projectId) { projectsQuery = projectsQuery.eq("id", projectId); paymentsQuery = paymentsQuery.eq("project_id", projectId); expensesQuery = expensesQuery.eq("project_id", projectId); }
  const [projects, payments, expenses] = await Promise.all([projectsQuery, paymentsQuery, expensesQuery]);
  if (projects.error || payments.error || expenses.error) throw new Error("No fue posible cargar la información financiera.");
  const names = new Map(projects.data.map((project) => [project.id, project.name])); const today = new Date().toISOString().slice(0, 10);
  return {
    projects: projects.data,
    payments: payments.data.map((payment) => ({ ...payment, status: payment.status === "pending" && payment.due_date && payment.due_date < today ? "overdue" : payment.status, project_name: names.get(payment.project_id) ?? "Proyecto no disponible" })) as ProjectPayment[],
    expenses: expenses.data.map((expense) => ({ ...expense, project_name: names.get(expense.project_id) ?? "Proyecto no disponible" })) as ProjectExpense[],
  };
}

