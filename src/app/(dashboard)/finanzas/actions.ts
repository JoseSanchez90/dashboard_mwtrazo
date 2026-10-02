"use server";

import { revalidatePath } from "next/cache";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/permissions/guards";
import { createClient } from "@/lib/supabase/server";
import { expenseFormSchema, financeIdSchema, paymentFormSchema, type ExpenseFormInput, type PaymentFormInput } from "@/lib/validations/finances";

export type FinanceActionResult = { ok: true; id: string } | { ok: false; error: string };
const nullable = (value: string) => value || null;
const refresh = (projectId: string) => { revalidatePath("/finanzas"); revalidatePath(`/proyectos/${projectId}`); };
function paymentPayload(input: PaymentFormInput) { return { project_id: input.project_id, concept: input.concept.trim(), amount: Number(input.amount), due_date: nullable(input.due_date), paid_at: input.status === "paid" && input.paid_at ? `${input.paid_at}T12:00:00Z` : null, status: input.status, notes: nullable(input.notes.trim()) }; }
function expensePayload(input: ExpenseFormInput) { return { project_id: input.project_id, concept: input.concept.trim(), amount: Number(input.amount), expense_date: input.expense_date, notes: nullable(input.notes.trim()) }; }

export async function savePaymentAction(id: string | null, input: PaymentFormInput): Promise<FinanceActionResult> {
  const user = await requirePermission(PERMISSIONS.MANAGE_FINANCES); const parsed = paymentFormSchema.safeParse(input); const parsedId = id ? financeIdSchema.safeParse(id) : null;
  if (!parsed.success || (parsedId && !parsedId.success)) return { ok: false, error: "Revisa los datos del pago." };
  const supabase = await createClient(); const query = id ? supabase.from("project_payments").update(paymentPayload(parsed.data)).eq("id", id) : supabase.from("project_payments").insert({ ...paymentPayload(parsed.data), created_by: user.id });
  const { data, error } = await query.select("id, project_id").maybeSingle(); if (error || !data) return { ok: false, error: "No fue posible guardar el pago." }; refresh(data.project_id); return { ok: true, id: data.id };
}

export async function deletePaymentAction(id: string): Promise<FinanceActionResult> {
  await requirePermission(PERMISSIONS.MANAGE_FINANCES); const parsed = financeIdSchema.safeParse(id); if (!parsed.success) return { ok: false, error: "Pago inválido." };
  const supabase = await createClient(); const { data, error } = await supabase.from("project_payments").delete().eq("id", parsed.data).select("id, project_id").maybeSingle(); if (error || !data) return { ok: false, error: "No fue posible eliminar el pago." }; refresh(data.project_id); return { ok: true, id: data.id };
}

export async function saveExpenseAction(id: string | null, input: ExpenseFormInput): Promise<FinanceActionResult> {
  const user = await requirePermission(PERMISSIONS.MANAGE_FINANCES); const parsed = expenseFormSchema.safeParse(input); const parsedId = id ? financeIdSchema.safeParse(id) : null;
  if (!parsed.success || (parsedId && !parsedId.success)) return { ok: false, error: "Revisa los datos del gasto." };
  const supabase = await createClient(); const query = id ? supabase.from("project_expenses").update(expensePayload(parsed.data)).eq("id", id) : supabase.from("project_expenses").insert({ ...expensePayload(parsed.data), created_by: user.id });
  const { data, error } = await query.select("id, project_id").maybeSingle(); if (error || !data) return { ok: false, error: "No fue posible guardar el gasto." }; refresh(data.project_id); return { ok: true, id: data.id };
}

export async function deleteExpenseAction(id: string): Promise<FinanceActionResult> {
  await requirePermission(PERMISSIONS.MANAGE_FINANCES); const parsed = financeIdSchema.safeParse(id); if (!parsed.success) return { ok: false, error: "Gasto inválido." };
  const supabase = await createClient(); const { data, error } = await supabase.from("project_expenses").delete().eq("id", parsed.data).select("id, project_id").maybeSingle(); if (error || !data) return { ok: false, error: "No fue posible eliminar el gasto." }; refresh(data.project_id); return { ok: true, id: data.id };
}

