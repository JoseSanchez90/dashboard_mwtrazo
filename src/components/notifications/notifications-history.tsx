"use client";

import { Bell, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { markAllNotificationsReadAction, markNotificationReadAction } from "@/app/(dashboard)/notificaciones/actions";
import { NotificationItem } from "@/components/notifications/notification-item";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AppNotification } from "@/types/notification";

export function NotificationsHistory({ initialNotifications }: { initialNotifications: AppNotification[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isPending, startTransition] = useTransition();
  const unreadCount = notifications.filter((item) => !item.read_at).length;
  const visible = useMemo(() => filter === "unread" ? notifications.filter((item) => !item.read_at) : notifications, [filter, notifications]);

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
      toast.success("Notificaciones marcadas como leídas.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={filter} onValueChange={(value) => setFilter(value as "all" | "unread")}>
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="unread">No leídas {unreadCount > 0 && `(${unreadCount})`}</TabsTrigger>
          </TabsList>
        </Tabs>
        {unreadCount > 0 && <Button variant="outline" onClick={markAllRead} disabled={isPending}><CheckCheck /> Marcar todas como leídas</Button>}
      </div>

      <section className="overflow-hidden rounded-xl border bg-card" aria-label="Historial de notificaciones">
        {visible.length > 0 ? (
          <div className="divide-y">{visible.map((notification) => <NotificationItem key={notification.id} notification={notification} onOpen={openNotification} pending={isPending} />)}</div>
        ) : (
          <div className="px-6 py-16 text-center">
            <Bell className="mx-auto size-6 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">{filter === "unread" ? "No tienes notificaciones sin leer" : "Todavía no tienes notificaciones"}</p>
            <p className="mt-1 text-sm text-muted-foreground">{filter === "unread" ? "Has revisado todos tus avisos." : "Los avisos relacionados con tu trabajo aparecerán aquí."}</p>
          </div>
        )}
      </section>
    </div>
  );
}
