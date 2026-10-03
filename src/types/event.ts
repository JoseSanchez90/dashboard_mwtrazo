export const EVENT_TYPES = ["meeting", "site_visit", "deadline", "delivery", "internal"] as const;
export type EventType = (typeof EVENT_TYPES)[number];
export const EVENT_TYPE_LABELS: Record<EventType, string> = { meeting: "Reunión", site_visit: "Visita de obra", deadline: "Vencimiento", delivery: "Entrega", internal: "Interno" };

export type CalendarEvent = {
  id: string; project_id: string | null; client_id: string | null; title: string; description: string | null;
  type: EventType; start_at: string; end_at: string; all_day: boolean; location: string | null;
  created_by: string | null; assigned_to: string | null; created_at: string; updated_at: string;
  project_name: string | null; client_name: string | null; assignee_name: string | null;
};
export type EventOptions = { projects: Array<{ id: string; name: string; client_id: string }>; clients: Array<{ id: string; name: string }>; users: Array<{ id: string; full_name: string }> };

