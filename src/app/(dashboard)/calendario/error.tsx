"use client";
import { ErrorState } from "@/components/shared/error-state";
export default function CalendarError({ reset }: { error: Error; reset: () => void }) { return <ErrorState title="No fue posible cargar el calendario" description="Intenta cargar nuevamente los eventos." onRetry={reset} />; }
