import type { LucideIcon } from "lucide-react";
import {
  Archive,
  CalendarDays,
  FolderKanban,
  Landmark,
  LayoutDashboard,
  ListTodo,
  Settings,
  UserCog,
  UsersRound,
} from "lucide-react";

export type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

export type NavigationSection = {
  label: string;
  items: NavigationItem[];
};

export const navigationSections: NavigationSection[] = [
  {
    label: "General",
    items: [{ label: "Inicio", href: "/inicio", icon: LayoutDashboard }],
  },
  {
    label: "Gestión",
    items: [
      { label: "Proyectos", href: "/proyectos", icon: FolderKanban },
      { label: "Clientes", href: "/clientes", icon: UsersRound },
      { label: "Tareas", href: "/tareas", icon: ListTodo },
      { label: "Calendario", href: "/calendario", icon: CalendarDays },
    ],
  },
  {
    label: "Administración",
    items: [
      { label: "Archivos", href: "/archivos", icon: Archive },
      { label: "Finanzas", href: "/finanzas", icon: Landmark, adminOnly: true },
    ],
  },
  {
    label: "Sistema",
    items: [
      {
        label: "Usuarios",
        href: "/usuarios",
        icon: UserCog,
        adminOnly: true,
      },
      { label: "Configuración", href: "/configuracion", icon: Settings },
    ],
  },
];
