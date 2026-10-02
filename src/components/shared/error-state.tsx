"use client";

import { CircleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = "No pudimos cargar esta sección",
  description = "Ocurrió un problema inesperado. Inténtalo nuevamente.",
  onRetry,
}: ErrorStateProps) {
  return (
    <section className="flex min-h-80 flex-col items-center justify-center rounded-xl border bg-card px-6 py-14 text-center">
      <div className="flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
        <CircleAlert className="size-5" />
      </div>
      <h2 className="mt-4 text-base font-semibold">{title}</h2>
      <p className="mt-1.5 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {onRetry && (
        <Button variant="outline" className="mt-5" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </section>
  );
}
