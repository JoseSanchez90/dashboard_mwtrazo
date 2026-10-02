import Link from "next/link";
import { Activity } from "lucide-react";
import type { ActivityLog } from "@/types/activity";

function relativeDate(value: string) { const seconds = Math.round((Date.parse(value) - Date.now()) / 1000); const formatter = new Intl.RelativeTimeFormat("es", { numeric: "auto" }); if (Math.abs(seconds) < 60) return formatter.format(seconds, "second"); const minutes = Math.round(seconds / 60); if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute"); const hours = Math.round(minutes / 60); if (Math.abs(hours) < 24) return formatter.format(hours, "hour"); const days = Math.round(hours / 24); return formatter.format(days, "day"); }
export function ActivityFeed({ activity }: { activity: ActivityLog[] }) {
  if (activity.length === 0) return <div className="rounded-xl border border-dashed px-6 py-12 text-center"><Activity className="mx-auto size-6 text-muted-foreground" /><p className="mt-3 text-sm font-medium">Todavía no hay actividad registrada</p></div>;
  return <div className="overflow-hidden rounded-xl border bg-card"><div className="divide-y">{activity.map((item) => <Link href={item.href} key={item.id} className="flex gap-3 px-5 py-4 hover:bg-muted/20"><span className="mt-1 size-2 shrink-0 rounded-full bg-brand" /><div className="min-w-0 flex-1"><p className="text-sm"><strong>{item.user_name}</strong> {item.label}</p><p className="mt-1 truncate text-xs text-muted-foreground">{item.entity_label}</p></div><time dateTime={item.created_at} title={new Intl.DateTimeFormat("es-PE", { dateStyle: "long", timeStyle: "short" }).format(new Date(item.created_at))} className="shrink-0 text-xs text-muted-foreground">{relativeDate(item.created_at)}</time></Link>)}</div></div>;
}
