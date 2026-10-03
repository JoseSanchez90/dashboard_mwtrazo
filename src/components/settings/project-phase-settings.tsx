"use client";

import { ArrowDown, ArrowUp, GripVertical, LoaderCircle, Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  createProjectPhaseTemplateAction,
  renameProjectPhaseTemplateAction,
  reorderProjectPhaseTemplatesAction,
  toggleProjectPhaseTemplateAction,
} from "@/app/(dashboard)/configuracion/project-phase-actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProjectPhaseTemplate } from "@/types/project";

export function ProjectPhaseSettings({ templates }: { templates: ProjectPhaseTemplate[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<"create" | "rename" | null>(null);
  const [selected, setSelected] = useState<ProjectPhaseTemplate | null>(null);
  const [name, setName] = useState("");

  function refresh(message: string) {
    toast.success(message);
    setDialog(null);
    setSelected(null);
    setName("");
    router.refresh();
  }

  function save() {
    startTransition(async () => {
      const result = selected
        ? await renameProjectPhaseTemplateAction(selected.id, name)
        : await createProjectPhaseTemplateAction(name);
      if (!result.ok) return void toast.error(result.error);
      refresh(selected ? "Fase renombrada." : "Fase agregada.");
    });
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= templates.length) return;
    const ids = templates.map((item) => item.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    startTransition(async () => {
      const result = await reorderProjectPhaseTemplatesAction(ids);
      if (!result.ok) return void toast.error(result.error);
      refresh("Orden de fases actualizado.");
    });
  }

  function toggle(template: ProjectPhaseTemplate) {
    startTransition(async () => {
      const result = await toggleProjectPhaseTemplateAction(template.id, !template.is_active);
      if (!result.ok) return void toast.error(result.error);
      refresh(template.is_active ? "Fase desactivada." : "Fase activada.");
    });
  }

  return (
    <section className="rounded-xl border bg-card" aria-labelledby="project-phases-heading">
      <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div><h2 id="project-phases-heading" className="text-base font-semibold">Fases predeterminadas del proyecto</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Los proyectos nuevos reciben una copia de las fases activas. Los cambios no alteran proyectos existentes.</p></div>
        <Button onClick={() => { setSelected(null); setName(""); setDialog("create"); }}><Plus />Agregar fase</Button>
      </div>
      <div className="divide-y">
        {templates.map((template, index) => (
          <div key={template.id} className="flex items-center gap-2 px-4 py-3 sm:px-6">
            <GripVertical className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="flex shrink-0 flex-col">
              <Button variant="ghost" size="icon-xs" disabled={pending || index === 0} onClick={() => move(index, -1)} aria-label={`Subir ${template.name}`}><ArrowUp /></Button>
              <Button variant="ghost" size="icon-xs" disabled={pending || index === templates.length - 1} onClick={() => move(index, 1)} aria-label={`Bajar ${template.name}`}><ArrowDown /></Button>
            </div>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{template.name}</p><p className="text-xs text-muted-foreground">Posición {index + 1}</p></div>
            <span className={`hidden rounded-full border px-2 py-0.5 text-xs sm:inline ${template.is_active ? "text-foreground" : "text-muted-foreground"}`}>{template.is_active ? "Activa" : "Inactiva"}</span>
            <Button variant="ghost" size="icon-sm" disabled={pending} onClick={() => { setSelected(template); setName(template.name); setDialog("rename"); }} aria-label={`Renombrar ${template.name}`}><Pencil /></Button>
            <Button variant="outline" size="sm" disabled={pending} onClick={() => toggle(template)}>{template.is_active ? "Desactivar" : "Activar"}</Button>
          </div>
        ))}
        {templates.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Todavía no hay fases predeterminadas.</p>}
      </div>

      <Dialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{selected ? "Renombrar fase" : "Agregar fase"}</DialogTitle><DialogDescription>El cambio se aplicará a la plantilla para proyectos nuevos, sin modificar el historial existente.</DialogDescription></DialogHeader>
          <Label className="flex flex-col items-stretch gap-2 text-sm font-medium"><span>Nombre</span><Input value={name} maxLength={120} autoFocus onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); save(); } }} /></Label>
          <DialogFooter><Button variant="outline" disabled={pending} onClick={() => setDialog(null)}>Cancelar</Button><Button disabled={pending || name.trim().length < 2} onClick={save}>{pending && <LoaderCircle className="animate-spin" />}Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
