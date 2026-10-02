import type { Metadata } from "next";

import { NotificationsHistory } from "@/components/notifications/notifications-history";
import { PageHeader } from "@/components/shared/page-header";
import { listNotifications } from "@/lib/notifications/queries";

export const metadata: Metadata = { title: "Notificaciones" };

export default async function NotificationsPage() {
  const notifications = await listNotifications();
  return (
    <div className="space-y-6">
      <PageHeader title="Notificaciones" description="Revisa los avisos relacionados con tus tareas, proyectos, eventos y archivos." />
      <NotificationsHistory initialNotifications={notifications} />
    </div>
  );
}
