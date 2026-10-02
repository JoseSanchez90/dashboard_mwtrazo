import type { Metadata } from "next";
import { CalendarWorkspace } from "@/components/calendar/calendar-workspace";
import { PageHeader } from "@/components/shared/page-header";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { getEventOptions, listEvents } from "@/lib/events/queries";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

export const metadata: Metadata = { title: "Calendario" };

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ nuevo?: string }> }) {
  const query = await searchParams;
  const [events, options, user] = await Promise.all([listEvents(), getEventOptions(), requireAuthenticatedUser()]);
  return <div className="space-y-7"><PageHeader title="Calendario" description="Consulta reuniones, visitas, entregas y próximos hitos del estudio." /><CalendarWorkspace events={events} options={options} canCreate={hasPermission(user.profile.role, PERMISSIONS.CREATE_EVENTS)} canEdit={hasPermission(user.profile.role, PERMISSIONS.EDIT_EVENTS)} canDelete={hasPermission(user.profile.role, PERMISSIONS.DELETE_EVENTS)} initialCreate={query.nuevo === "1"} /></div>;
}
