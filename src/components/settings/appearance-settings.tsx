"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

const themes = [
  {
    value: "light",
    label: "Claro",
    description: "Usa una interfaz luminosa.",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Oscuro",
    description: "Reduce el brillo en ambientes con poca luz.",
    icon: Moon,
  },
  {
    value: "system",
    label: "Sistema",
    description: "Sigue la apariencia configurada en tu dispositivo.",
    icon: Monitor,
  },
] as const;

function subscribe() {
  return () => undefined;
}

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  return (
    <section className="rounded-xl border bg-card p-5 sm:p-6" aria-labelledby="appearance-heading">
      <div className="max-w-2xl">
        <h2 id="appearance-heading" className="text-base font-semibold">
          Apariencia
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Elige cómo se muestra MWTRAZO. La preferencia se guarda automáticamente en este dispositivo.
        </p>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-sm font-medium">Tema</p>
        <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Tema de la aplicación">
          {themes.map(({ value, label, description, icon: Icon }) => {
            const selected = mounted && theme === value;

            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setTheme(value)}
                className={cn(
                  "group flex min-h-32 flex-col items-start rounded-xl border bg-background p-4 text-left transition-colors hover:border-foreground/20 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  selected && "border-primary bg-primary/5 ring-1 ring-primary/20",
                )}
              >
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg border bg-card text-muted-foreground",
                    selected && "border-primary/25 bg-primary/10 text-primary",
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="mt-4 flex w-full items-center justify-between gap-3">
                  <span className="text-sm font-medium">{label}</span>
                  <span
                    className={cn(
                      "size-3.5 rounded-full border-2 border-muted-foreground/40",
                      selected && "border-primary bg-primary shadow-[inset_0_0_0_3px_var(--background)]",
                    )}
                    aria-hidden="true"
                  />
                </span>
                <span className="mt-1 text-xs leading-5 text-muted-foreground">{description}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
