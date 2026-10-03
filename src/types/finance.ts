export const PAYMENT_STATUSES = ["pending", "paid", "overdue", "cancelled"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = { pending: "Pendiente", paid: "Pagado", overdue: "Vencido", cancelled: "Cancelado" };
export type ProjectPayment = { id: string; project_id: string; concept: string; amount: number; due_date: string | null; paid_at: string | null; status: PaymentStatus; notes: string | null; created_by: string | null; created_at: string; updated_at: string; project_name: string };
export type ProjectExpense = { id: string; project_id: string; concept: string; amount: number; expense_date: string; notes: string | null; created_by: string | null; created_at: string; updated_at: string; project_name: string };
export type FinanceProject = { id: string; name: string; code: string; fee: number | null };
export type FinanceData = { projects: FinanceProject[]; payments: ProjectPayment[]; expenses: ProjectExpense[] };

