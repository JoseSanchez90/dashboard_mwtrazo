"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { markAllNotificationsReadAction, markNotificationReadAction } from "@/app/(dashboard)/notificaciones/actions";
import { NotificationItem } from "@/components/notifications/notification-item";
import { Button, buttonVariants } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { AppNotification } from "@/types/notification";

type NotificationMenuProps = { notifications: AppNotification[]; unreadCount: number };

export function NotificationMenu({ notifications: initialNotifications, unreadCount: initialUnreadCount }: NotificationMenuProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [isPending, startTransition] = useTransition();

  function openNotification(notification: AppNotification) {
    startTransition(async () => {
      if (!notification.read_at) {
        const result = await markNotificationReadAction(notification.id);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        const readAt = new Date().toISOString();
        setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read_at: readAt } : item));
        setUnreadCount((current) => Math.max(0, current - 1));
      }
      if (notification.href) router.push(notification.href);
      router.refresh();
    });
  }

  function markAllRead() {
    startTransition(async () => {
      const result = await markAllNotificationsReadAction();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const readAt = new Date().toISOString();
      setNotifications((current) => current.map((item) => ({ ...item, read_at: item.read_at ?? readAt })));
      setUnreadCount(0);
      toast.success("Notificaciones marcadas como leídas.");
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<button type="button" aria-label={unreadCount ? `Notificaciones: ${unreadCount} sin leer` : "Notificaciones"} className={buttonVariants({ variant: "ghost", size: "icon", className: "relative" })} />}>
        <Bell />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex min-w-4.5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(24rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notificaciones</p>
            <p className="text-xs text-muted-foreground">{unreadCount ? `${unreadCount} sin leer` : "Todo al día"}</p>
          </div>
          {unreadCount > 0 && (
            <Button type="button" variant="ghost" size="sm" onClick={markAllRead} disabled={isPending}>
              <CheckCheck /> Todas leídas
            </Button>
          )}
        </div>
        <div className="max-h-[min(28rem,65vh)] divide-y overflow-y-auto">
          {notifications.length > 0 ? notifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} onOpen={openNotification} compact pending={isPending} />
          )) : (
            <div className="px-5 py-10 text-center">
              <Bell className="mx-auto size-5 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">No tienes notificaciones</p>
              <p className="mt-1 text-xs text-muted-foreground">Los avisos de tu actividad aparecerán aquí.</p>
            </div>
          )}
        </div>
        <div className="border-t p-2">
          <Button nativeButton={false} variant="ghost" className="w-full" render={<Link href="/notificaciones" />}>
            Ver todas las notificaciones
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
