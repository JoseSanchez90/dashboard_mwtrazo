"use client";
import { ErrorState } from "@/components/shared/error-state";
export default function TasksError({ reset }: { error: Error; reset: () => void }) { return <ErrorState title="No fue posible cargar las tareas" description="Intenta cargar nuevamente el módulo." onRetry={reset} />; }
