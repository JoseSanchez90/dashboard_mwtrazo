import type { Metadata } from "next";
import { FinanceWorkspace } from "@/components/finances/finance-workspace";
import { PageHeader } from "@/components/shared/page-header";
import { getFinanceData } from "@/lib/finances/queries";

export const metadata: Metadata = { title: "Finanzas" };

export default async function FinancesPage() {
  const data = await getFinanceData();
  return <div className="space-y-7"><PageHeader title="Finanzas" description="Control operativo de honorarios, cobros, vencimientos y gastos por proyecto." /><FinanceWorkspace data={data} /></div>;
}
