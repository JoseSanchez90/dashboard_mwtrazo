import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactCompiler: true,
  async redirects() {
    return [
      { source: "/dashboard", destination: "/inicio", permanent: true },
      { source: "/login", destination: "/iniciar-sesion", permanent: true },
      { source: "/clients/new", destination: "/clientes/nuevo", permanent: true },
      { source: "/clients/:id/edit", destination: "/clientes/:id/editar", permanent: true },
      { source: "/clients/:id", destination: "/clientes/:id", permanent: true },
      { source: "/clients", destination: "/clientes", permanent: true },
      { source: "/projects/new", destination: "/proyectos/nuevo", permanent: true },
      { source: "/projects/:id/edit", destination: "/proyectos/:id/editar", permanent: true },
      { source: "/projects/:id", destination: "/proyectos/:id", permanent: true },
      { source: "/projects", destination: "/proyectos", permanent: true },
      { source: "/tasks", destination: "/tareas", permanent: true },
      { source: "/calendar", destination: "/calendario", permanent: true },
      { source: "/files", destination: "/archivos", permanent: true },
      { source: "/finances", destination: "/finanzas", permanent: true },
      { source: "/users", destination: "/usuarios", permanent: true },
      { source: "/settings", destination: "/configuracion", permanent: true },
      { source: "/profile", destination: "/perfil", permanent: true },
      { source: "/notifications", destination: "/notificaciones", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "same-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
        ],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
    ];
  },
};

export default nextConfig;
