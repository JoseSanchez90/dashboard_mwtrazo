"use client";
import { ErrorState } from "@/components/shared/error-state";
export default function FinancesError({ reset }: { error: Error; reset: () => void }) { return <ErrorState title="No fue posible cargar las finanzas" description="Intenta cargar nuevamente la información financiera." onRetry={reset} />; }
