"use client";
import { ErrorState } from "@/components/shared/error-state";
export default function FilesError({ reset }: { error: Error; reset: () => void }) { return <ErrorState title="No fue posible cargar los archivos" description="Intenta cargar nuevamente el módulo." onRetry={reset} />; }
