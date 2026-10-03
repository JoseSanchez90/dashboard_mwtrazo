"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import timeGridPlugin from "@fullcalendar/timegrid";
import esLocale from "@fullcalendar/core/locales/es";
import type { DateSelectArg, EventClickArg } from "@fullcalendar/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarPlus, Check, Clock3, LoaderCircle, MapPin, Pencil, Trash2, UserRound } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { createEventAction, deleteEventAction, updateEventAction } from "@/app/(dashboard)/calendario/actions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppSelect } from "@/components/shared/app-select";
import { useFormattingPreferences } from "@/components/providers/formatting-provider";
import { formatDate, formatDateTime } from "@/lib/formatting";
import { eventFormSchema, type EventFormInput } from "@/lib/validations/events";
import { EVENT_TYPES, EVENT_TYPE_LABELS, type CalendarEvent, type EventOptions, type EventType } from "@/types/event";

const eventColors: Record<EventType, string> = { meeting: "var(--event-meeting)", site_visit: "var(--event-site-visit)", deadline: "var(--event-deadline)", delivery: "var(--event-delivery)", internal: "var(--event-internal)" };
const emptyForm: EventFormInput = { project_id: "", client_id: "", title: "", description: "", type: "internal", start_at: "", end_at: "", all_day: false, location: "", assigned_to: "" };
const calendarViews = [
  { value: "dayGridMonth", label: "Mes" },
  { value: "timeGridWeek", label: "Semana" },
  { value: "timeGridDay", label: "Día" },
  { value: "listMonth", label: "Agenda" },
] as const;
type CalendarView = (typeof calendarViews)[number]["value"];

function isCalendarView(value: string): value is CalendarView {
  return calendarViews.some((view) => view.value === value);
}

function localInput(value: string) { const date = new Date(value); const offset = date.getTimezoneOffset() * 60000; return new Date(date.getTime() - offset).toISOString().slice(0, 16); }
function valuesFor(event?: CalendarEvent, selection?: { start: string; end: string; allDay: boolean }, fixedProjectId?: string): EventFormInput {
  if (event) return { project_id: event.project_id ?? "", client_id: event.client_id ?? "", title: event.title, description: event.description ?? "", type: event.type, start_at: localInput(event.start_at), end_at: localInput(event.end_at), all_day: event.all_day, location: event.location ?? "", assigned_to: event.assigned_to ?? "" };
  return { ...emptyForm, project_id: fixedProjectId ?? "", start_at: selection ? localInput(selection.start) : localInput(new Date().toISOString()), end_at: selection ? localInput(selection.end) : localInput(new Date(Date.now() + 3600000).toISOString()), all_day: selection?.allDay ?? false };
}

function EventFormDialog({ open, onOpenChange, event, selection, options, fixedProjectId }: { open: boolean; onOpenChange: (value: boolean) => void; event?: CalendarEvent; selection?: { start: string; end: string; allDay: boolean }; options: EventOptions; fixedProjectId?: string }) {
  const router = useRouter(); const [pending, startTransition] = useTransition();
  const { register, handleSubmit, control, formState: { errors } } = useForm<EventFormInput>({ resolver: zodResolver(eventFormSchema), values: valuesFor(event, selection, fixedProjectId) });
  const submit = handleSubmit((values) => startTransition(async () => {
    const normalized = { ...values, start_at: new Date(values.start_at).toISOString(), end_at: new Date(values.end_at).toISOString(), client_id: values.client_id || options.projects.find((project) => project.id === values.project_id)?.client_id || "" };
    const result = event ? await updateEventAction(event.id, normalized) : await createEventAction(normalized);
    if (!result.ok) { toast.error(result.error); return; }
    toast.success(event ? "Evento actualizado." : "Evento creado."); onOpenChange(false); router.refresh();
  }));
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{event ? "Editar evento" : "Nuevo evento"}</DialogTitle><DialogDescription>Organiza una reunión, visita, entrega o hito operativo.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-5">
    <div className="grid gap-4 sm:grid-cols-2"><Label className="flex flex-col items-stretch gap-2 text-sm font-medium sm:col-span-2"><span>Título</span><Input {...register("title")} aria-invalid={!!errors.title} />{errors.title && <span className="block text-xs text-destructive">{errors.title.message}</span>}</Label>
    <Label className="flex flex-col items-stretch gap-2 text-sm font-medium"><span>Tipo</span><Controller name="type" control={control} render={({ field }) => <AppSelect value={field.value} onValueChange={field.onChange} options={EVENT_TYPES.map((type) => ({ value: type, label: EVENT_TYPE_LABELS[type] }))} />} /></Label>
    {!fixedProjectId && <Label className="flex flex-col items-stretch gap-2 text-sm font-medium"><span>Proyecto</span><Controller name="project_id" control={control} render={({ field }) => <AppSelect value={field.value} onValueChange={field.onChange} emptyLabel="Sin proyecto" options={options.projects.map((project) => ({ value: project.id, label: project.name }))} />} /></Label>}
    <Label className="flex flex-col items-stretch gap-2 text-sm font-medium"><span>Cliente</span><Controller name="client_id" control={control} render={({ field }) => <AppSelect value={field.value} onValueChange={field.onChange} emptyLabel="Sin cliente" options={options.clients.map((client) => ({ value: client.id, label: client.name }))} />} /><span className="block text-xs font-normal text-muted-foreground">Si no eliges uno, se usará el cliente del proyecto.</span></Label>
    <Label className="flex flex-col items-stretch gap-2 text-sm font-medium"><span>Responsable</span><Controller name="assigned_to" control={control} render={({ field }) => <AppSelect value={field.value} onValueChange={field.onChange} emptyLabel="Sin asignar" options={options.users.map((user) => ({ value: user.id, label: user.full_name }))} />} /></Label>
    <Label className="flex flex-col items-stretch gap-2 text-sm font-medium"><span>Inicio</span><Input type="datetime-local" {...register("start_at")} aria-invalid={!!errors.start_at} /></Label>
    <Label className="flex flex-col items-stretch gap-2 text-sm font-medium"><span>Final</span><Input type="datetime-local" {...register("end_at")} aria-invalid={!!errors.end_at} />{errors.end_at && <span className="block text-xs text-destructive">{errors.end_at.message}</span>}</Label>
    <Controller name="all_day" control={control} render={({ field }) => <Label className="flex items-center gap-2 text-sm font-medium"><Checkbox checked={field.value} onCheckedChange={field.onChange} />Todo el día</Label>} />
    <Label className="flex flex-col items-stretch gap-2 text-sm font-medium sm:col-span-2"><span>Ubicación</span><Input {...register("location")} placeholder="Oficina, dirección o enlace" /></Label>
    <Label className="flex flex-col items-stretch gap-2 text-sm font-medium sm:col-span-2"><span>Descripción</span><Textarea {...register("description")} /></Label></div>
    <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" /> : <Check />}{event ? "Guardar cambios" : "Crear evento"}</Button></DialogFooter>
  </form></DialogContent></Dialog>;
}

function EventDetailDialog({ event, open, onOpenChange, canEdit, canDelete, onEdit }: { event?: CalendarEvent; open: boolean; onOpenChange: (value: boolean) => void; canEdit: boolean; canDelete: boolean; onEdit: () => void }) {
  const formatting = useFormattingPreferences();
  const router = useRouter(); const [confirm, setConfirm] = useState(false); const [pending, startTransition] = useTransition();
  if (!event) return null;
  const remove = () => startTransition(async () => { const result = await deleteEventAction(event.id); if (!result.ok) { toast.error(result.error); return; } toast.success("Evento eliminado."); setConfirm(false); onOpenChange(false); router.refresh(); });
  const eventDate = (value: string) => event.all_day ? formatDate(value, formatting) : formatDateTime(value, formatting);
  return <><Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-lg"><DialogHeader><div className="mb-2 flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ backgroundColor: eventColors[event.type] }} /><span className="text-xs font-medium text-muted-foreground">{EVENT_TYPE_LABELS[event.type]}</span></div><DialogTitle>{event.title}</DialogTitle><DialogDescription>{event.project_name ?? event.client_name ?? "Evento general"}</DialogDescription></DialogHeader><div className="space-y-4 py-2 text-sm"><div className="flex gap-3"><Clock3 className="mt-0.5 size-4 text-muted-foreground" /><div><p>{eventDate(event.start_at)}</p><p className="text-muted-foreground">hasta {eventDate(event.end_at)}</p></div></div>{event.location && <div className="flex gap-3"><MapPin className="mt-0.5 size-4 text-muted-foreground" /><span>{event.location}</span></div>}<div className="flex gap-3"><UserRound className="mt-0.5 size-4 text-muted-foreground" /><span>{event.assignee_name ?? "Sin responsable asignado"}</span></div>{event.description && <p className="whitespace-pre-wrap border-t pt-4 leading-6 text-muted-foreground">{event.description}</p>}</div><DialogFooter>{canDelete && <Button variant="destructive" onClick={() => setConfirm(true)}><Trash2 />Eliminar</Button>}{canEdit && <Button onClick={onEdit}><Pencil />Editar</Button>}</DialogFooter></DialogContent></Dialog>
  <AlertDialog open={confirm} onOpenChange={setConfirm}><AlertDialogContent><AlertDialogHeader><AlertDialogMedia><Trash2 /></AlertDialogMedia><AlertDialogTitle>¿Eliminar {event.title}?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={pending} onClick={remove}>{pending && <LoaderCircle className="animate-spin" />}Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></>;
}

export function CalendarWorkspace({ events, options, canCreate, canEdit, canDelete, fixedProjectId, initialCreate = false }: { events: CalendarEvent[]; options: EventOptions; canCreate: boolean; canEdit: boolean; canDelete: boolean; fixedProjectId?: string; initialCreate?: boolean }) {
  const formatting = useFormattingPreferences();
  const calendarRef = useRef<FullCalendar>(null);
  const [calendarView, setCalendarView] = useState<CalendarView>("dayGridMonth");
  const [selected, setSelected] = useState<CalendarEvent>(); const [detailOpen, setDetailOpen] = useState(false); const [formOpen, setFormOpen] = useState(initialCreate && canCreate); const [editing, setEditing] = useState<CalendarEvent>(); const [selection, setSelection] = useState<{ start: string; end: string; allDay: boolean }>();
  const calendarEvents = useMemo(() => events.map((event) => ({ id: event.id, title: event.title, start: event.start_at, end: event.end_at, allDay: event.all_day, backgroundColor: eventColors[event.type], borderColor: eventColors[event.type] })), [events]);
  const openNew = (value?: DateSelectArg) => { if (!canCreate) return; setEditing(undefined); setSelection(value ? { start: value.startStr, end: value.endStr, allDay: value.allDay } : undefined); setFormOpen(true); };
  const showEvent = (info: EventClickArg) => { const event = events.find((item) => item.id === info.event.id); if (event) { setSelected(event); setDetailOpen(true); } };
  const changeCalendarView = (value: string) => {
    if (!isCalendarView(value)) return;
    setCalendarView(value);
    calendarRef.current?.getApi().changeView(value);
  };

  return <div className="space-y-4"><div className="flex justify-end">{canCreate && <Button onClick={() => openNew()}><CalendarPlus />Nuevo evento</Button>}</div><div className="mw-calendar overflow-hidden rounded-xl border bg-card p-3 sm:p-5"><div className="mb-4 flex justify-end"><Tabs value={calendarView} onValueChange={changeCalendarView}><TabsList aria-label="Vista del calendario">{calendarViews.map((view) => <TabsTrigger key={view.value} value={view.value}>{view.label}</TabsTrigger>)}</TabsList></Tabs></div><FullCalendar ref={calendarRef} plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]} locale={esLocale} firstDay={formatting.week_starts_on} initialView="dayGridMonth" headerToolbar={{ left: "prev,next today", center: "title", right: "" }} buttonText={{ today: "Hoy" }} datesSet={({ view }) => { if (isCalendarView(view.type)) setCalendarView(view.type); }} height="auto" events={calendarEvents} selectable={canCreate} select={openNew} eventClick={showEvent} nowIndicator dayMaxEvents /></div>
  <EventDetailDialog event={selected} open={detailOpen} onOpenChange={setDetailOpen} canEdit={canEdit} canDelete={canDelete} onEdit={() => { setDetailOpen(false); setEditing(selected); setSelection(undefined); setFormOpen(true); }} />
  <EventFormDialog open={formOpen} onOpenChange={setFormOpen} event={editing} selection={selection} options={options} fixedProjectId={fixedProjectId} /></div>;
}
