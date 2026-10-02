"use client";
import { ErrorState } from "@/components/shared/error-state";
export default function DashboardError({ reset }: { error: Error; reset: () => void }) { return <ErrorState title="No fue posible cargar el dashboard" description="Intenta actualizar nuevamente el resumen del estudio." onRetry={reset} />; }
