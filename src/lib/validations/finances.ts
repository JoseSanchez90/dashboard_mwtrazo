import { z } from "zod";
import { PAYMENT_STATUSES } from "@/types/finance";

const amount = z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Ingresa un importe válido.").refine((value) => Number(value) > 0, "El importe debe ser mayor que cero.");
export const financeIdSchema = z.uuid();
export const paymentFormSchema = z.object({ project_id: z.uuid(), concept: z.string().trim().min(2).max(180), amount, due_date: z.union([z.literal(""), z.iso.date()]), paid_at: z.union([z.literal(""), z.iso.date()]), status: z.enum(PAYMENT_STATUSES), notes: z.string().trim().max(2000) }).superRefine((value, context) => {
  if (value.status === "overdue" && !value.due_date) context.addIssue({ code: "custom", path: ["due_date"], message: "Un pago vencido necesita fecha de vencimiento." });
});
export const expenseFormSchema = z.object({ project_id: z.uuid(), concept: z.string().trim().min(2).max(180), amount, expense_date: z.iso.date(), notes: z.string().trim().max(2000) });
export type PaymentFormInput = z.input<typeof paymentFormSchema>;
export type ExpenseFormInput = z.input<typeof expenseFormSchema>;

