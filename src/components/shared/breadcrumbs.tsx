"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

const labels: Record<string, string> = {
  inicio: "Inicio",
  proyectos: "Proyectos",
  clientes: "Clientes",
  tareas: "Tareas",
  calendario: "Calendario",
  archivos: "Archivos",
  finanzas: "Finanzas",
  usuarios: "Usuarios",
  configuracion: "Configuración",
  perfil: "Mi perfil",
  notificaciones: "Notificaciones",
  nuevo: "Nuevo",
  editar: "Editar",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-sm">
        <li className="hidden text-muted-foreground sm:block">
          <Link href="/inicio" className="transition-colors hover:text-foreground">
            MWTRAZO
          </Link>
        </li>
        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join("/")}`;
          const isLast = index === segments.length - 1;

          return (
            <li key={href} className="flex min-w-0 items-center gap-1.5">
              <ChevronRight
                aria-hidden="true"
                className="hidden size-3.5 shrink-0 text-muted-foreground/60 sm:block"
              />
              {isLast ? (
                <span className="truncate font-medium text-foreground">
                  {labels[segment] ?? segment}
                </span>
              ) : (
                <Link
                  href={href}
                  className="truncate text-muted-foreground transition-colors hover:text-foreground"
                >
                  {labels[segment] ?? segment}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
