"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function ClientsError({ reset }: { reset: () => void }) {
  return <ErrorState title="No pudimos cargar Clientes" description="Ocurrió un problema al consultar la información. Inténtalo nuevamente." onRetry={reset} />;
}

