import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { StudioMark } from "@/components/shared/studio-mark";
import { getCurrentUser } from "@/lib/auth/session";
import { getPublicStudioBranding } from "@/lib/workspace-settings/queries";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default async function LoginPage({ searchParams }: PageProps<"/iniciar-sesion">) {
  const currentUser = await getCurrentUser();
  if (currentUser?.profile.is_active) redirect("/inicio");

  const params = await searchParams;
  const studio = await getPublicStudioBranding();

  return (
    <main className="grid min-h-screen bg-muted/25 lg:grid-cols-[minmax(0,1fr)_minmax(28rem,0.72fr)]">
      <section className="relative isolate hidden overflow-hidden border-r border-white/10 p-12 lg:flex lg:flex-col lg:justify-between">
        <Image
          src="/images/login-image.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 58vw, 0px"
          className="-z-20 object-cover"
        />
        <div
          className="absolute inset-0 -z-10 bg-black/45 backdrop-blur-xs"
          aria-hidden="true"
        />
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-white">
            {studio.studioName}
          </span>
        </div>
        <div className="max-w-xl">
          <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
            Estudio de arquitectura
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-balance text-white">
            El trabajo del estudio, en un solo lugar.
          </h1>
          <p className="mt-4 max-w-lg leading-7 text-white/75">
            Gestión interna de proyectos, clientes, tareas y documentación de{" "}
            {studio.studioName}.
          </p>
        </div>
        <p className="text-xs text-white/65">
          Acceso privado · {studio.studioName}
        </p>
      </section>

      <section className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <StudioMark
              name={studio.studioName}
              logoUrl={studio.logoUrl}
              className="size-9"
            />
            <span className="text-sm font-semibold tracking-[0.16em]">
              {studio.studioName}
            </span>
          </div>
          <p className="text-sm font-medium text-brand">Bienvenido</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            Inicia sesión
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Usa las credenciales asignadas por el administrador.
          </p>
          <LoginForm inactive={params.reason === "inactive"} />
        </div>
      </section>
    </main>
  );
}
