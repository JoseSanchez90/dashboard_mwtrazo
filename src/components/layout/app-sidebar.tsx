"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { SidebarNavigation } from "@/components/layout/sidebar-navigation";
import { SidebarUser } from "@/components/layout/sidebar-user";
import { StudioMark } from "@/components/shared/studio-mark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/auth";
import type { StudioBranding } from "@/types/workspace-settings";

type AppSidebarProps = {
  user: { name: string; role: UserRole; avatarUrl?: string | null };
  studio: StudioBranding;
};

export function AppSidebar({ user, studio }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200 lg:flex",
        collapsed ? "w-[4.5rem]" : "w-64",
      )}
    >
      <div className="flex h-16 items-center border-b px-4">
        <div
          className={cn(
            "flex min-w-0 items-center gap-3",
            collapsed && "mx-auto",
          )}
        >
          <StudioMark name={studio.studioName} logoUrl={studio.logoUrl} />
          {!collapsed && (
            <span className="truncate text-sm font-semibold tracking-[0.16em]">
              {studio.studioName}
            </span>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <SidebarNavigation collapsed={collapsed} role={user.role} />
      </div>

      <div className="relative">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? "Expandir navegación" : "Contraer navegación"}
          className="absolute -top-3 -right-3 z-10 hidden rounded-full border-black bg-black text-white shadow-xs hover:bg-black hover:text-white lg:inline-flex dark:border-white dark:bg-white dark:text-black dark:hover:bg-white dark:hover:text-black"
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </Button>
        <SidebarUser
          collapsed={collapsed}
          name={user.name}
          role={user.role}
          avatarUrl={user.avatarUrl}
        />
      </div>
    </aside>
  );
}
