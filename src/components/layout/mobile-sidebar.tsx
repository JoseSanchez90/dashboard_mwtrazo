"use client";

import { useState } from "react";
import { Menu } from "lucide-react";

import { SidebarNavigation } from "@/components/layout/sidebar-navigation";
import { SidebarUser } from "@/components/layout/sidebar-user";
import { StudioMark } from "@/components/shared/studio-mark";
import { buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { UserRole } from "@/types/auth";
import type { StudioBranding } from "@/types/workspace-settings";

type MobileSidebarProps = { user: { name: string; role: UserRole; avatarUrl?: string | null }; studio: StudioBranding };

export function MobileSidebar({ user, studio }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<button type="button" className={buttonVariants({ variant: "ghost", size: "icon", className: "lg:hidden" })} />}
      >
        <Menu />
        <span className="sr-only">Abrir navegación</span>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[19rem] max-w-[86vw] gap-0 bg-sidebar p-0"
      >
        <SheetHeader className="flex h-16 justify-center border-b px-4 py-0 text-left">
          <SheetTitle className="flex items-center gap-3">
            <StudioMark name={studio.studioName} logoUrl={studio.logoUrl} />
            <span className="text-sm font-semibold tracking-[0.16em]">
              {studio.studioName}
            </span>
          </SheetTitle>
          <SheetDescription className="sr-only">
            Navegación principal de {studio.studioName}
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <SidebarNavigation role={user.role} onNavigate={() => setOpen(false)} />
        </div>
        <SidebarUser name={user.name} role={user.role} avatarUrl={user.avatarUrl} />
      </SheetContent>
    </Sheet>
  );
}
