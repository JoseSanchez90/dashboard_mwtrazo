"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navigationSections } from "@/config/navigation";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/auth";

type SidebarNavigationProps = {
  collapsed?: boolean;
  onNavigate?: () => void;
  role: UserRole;
};

export function SidebarNavigation({
  collapsed = false,
  onNavigate,
  role,
}: SidebarNavigationProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegación principal" className="space-y-6 px-3 py-5">
      {navigationSections.map((section) => (
        <div key={section.label}>
          {!collapsed && (
            <p className="mb-2 px-2 text-[0.68rem] font-semibold tracking-[0.14em] text-muted-foreground/80 uppercase">
              {section.label}
            </p>
          )}
          <ul className="space-y-1">
            {section.items.filter((item) => !item.adminOnly || hasPermission(role, PERMISSIONS.MANAGE_USERS)).map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    aria-label={collapsed ? item.label : undefined}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "group relative flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                      collapsed && "justify-center px-0",
                      isActive && "bg-muted text-foreground",
                    )}
                  >
                    {isActive && (
                      <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-brand" />
                    )}
                    <Icon
                      aria-hidden="true"
                      className={cn(
                        "size-[1.05rem] shrink-0 transition-colors",
                        isActive ? "text-brand" : "group-hover:text-foreground",
                      )}
                      strokeWidth={1.8}
                    />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
