"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, LoaderCircle, LogOut, UserRound } from "lucide-react";

import { logoutAction } from "@/app/(auth)/iniciar-sesion/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLE_LABELS, type UserRole } from "@/types/auth";

type UserMenuProps = { user: { name: string; email: string; role: UserRole; avatarUrl?: string | null } };

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function UserMenu({ user }: UserMenuProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!isLoggingOut) return;

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [isLoggingOut]);

  function handleLogout() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    startTransition(async () => {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await logoutAction();
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className={buttonVariants({ variant: "ghost", className: "h-10 gap-2 px-1.5 sm:px-2" })}
              aria-label="Abrir menú de usuario"
            />
          }
        >
          <Avatar className="size-7">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
            <AvatarFallback className="bg-brand/10 text-xs font-semibold text-brand">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-28 truncate text-sm font-medium xl:inline">
            {user.name.split(" ")[0]}
          </span>
          <ChevronDown className="hidden size-3.5 text-muted-foreground xl:block" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              <span className="block truncate text-foreground">{user.name}</span>
              <span className="mt-0.5 block truncate font-normal">{user.email}</span>
              <span className="mt-0.5 block font-normal">{ROLE_LABELS[user.role]}</span>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem render={<Link href="/perfil" />}>
            <UserRound />
            Mi perfil
          </DropdownMenuItem>
          <Button
            type="button"
            variant="ghost"
            className="h-auto w-full justify-start rounded-md px-2 py-1.5 font-normal"
            disabled={isLoggingOut}
            onClick={handleLogout}
          >
            <LogOut className="size-4" />
            Cerrar sesión
          </Button>
        </DropdownMenuContent>
      </DropdownMenu>

      {isLoggingOut && createPortal(
        <div
          className="fixed inset-0 z-[9999] isolate grid h-dvh w-screen touch-none place-items-center overflow-hidden overscroll-none px-4"
          role="status"
          aria-live="polite"
          aria-label="Cerrando sesión"
        >
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" aria-hidden="true" />
          <div className="relative z-10 flex flex-col items-center gap-4 text-center">
            <div className="relative grid size-14 place-items-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
              <span className="absolute inset-1 rounded-full border border-primary/25" />
              <LoaderCircle className="relative size-8 animate-spin text-primary" aria-hidden="true" />
            </div>
            <p className="text-base font-semibold text-foreground">Cerrando sesión...</p>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
