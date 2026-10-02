"use client";

import { Bell, CalendarDays, CheckCircle2, Clock3, FileUp, FolderKanban, WalletCards } from "lucide-react";

import { cn } from "@/lib/utils";
import { useFormattingPreferences } from "@/components/providers/formatting-provider";
import { formatDateTime } from "@/lib/formatting";
import type { AppNotification, NotificationType } from "@/types/notification";

const icons: Record<NotificationType, typeof Bell> = {
  task_assigned: Bell,
  task_completed: CheckCircle2,
  task_due_soon: Clock3,
  task_overdue: Clock3,
  event_upcoming: CalendarDays,
  delivery_upcoming: CalendarDays,
  file_uploaded: FileUp,
  project_updated: FolderKanban,
  payment_due_soon: WalletCards,
  payment_overdue: WalletCards,
};

type NotificationItemProps = {
  notification: AppNotification;
  onOpen: (notification: AppNotification) => void;
  compact?: boolean;
  pending?: boolean;
};

export function NotificationItem({ notification, onOpen, compact = false, pending = false }: NotificationItemProps) {
  const formatting = useFormattingPreferences();
  const Icon = icons[notification.type];
  const unread = notification.read_at === null;

  return (
    <button
      type="button"
      onClick={() => onOpen(notification)}
      disabled={pending}
      className={cn(
        "flex w-full items-start gap-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:opacity-60",
        compact ? "px-3 py-3" : "px-4 py-4 sm:px-5",
        unread && "bg-primary/[0.055]",
      )}
    >
      <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground", unread && "border-primary/20 text-primary")}>
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span className={cn("text-sm", unread ? "font-semibold" : "font-medium")}>{notification.title}</span>
          {unread && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-label="No leída" />}
        </span>
        <span className="mt-0.5 block text-sm leading-5 text-muted-foreground">{notification.message}</span>
        <time className="mt-1.5 block text-xs text-muted-foreground" dateTime={notification.created_at}>
          {formatDateTime(notification.created_at, formatting)}
        </time>
      </span>
    </button>
  );
}
