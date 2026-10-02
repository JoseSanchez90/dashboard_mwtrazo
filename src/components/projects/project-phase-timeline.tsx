"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Circle, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { updateProjectPhaseAction } from "@/app/(dashboard)/proyectos/actions";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ProjectPhase } from "@/types/project";

export function ProjectPhaseTimeline({
  projectId,
  phases,
  canEdit,
}: {
  projectId: string;
  phases: ProjectPhase[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<ProjectPhase | null>(null);
  const [progress, setProgress] = useState(0);
  const [isCurrent, setIsCurrent] = useState(false);
  const [pending, startTransition] = useTransition();
  const activePhases = phases.filter((phase) => phase.is_active);

  function openPhase(phase: ProjectPhase) {
    setSelected(phase);
    setProgress(phase.progress);
    setIsCurrent(phase.is_current);
  }

  function savePhase() {
    if (!selected) return;
    startTransition(async () => {
      const result = await updateProjectPhaseAction(projectId, {
        phase_definition_id: selected.id,
        progress,
        is_current: isCurrent,
      });
      if (!result.ok) return void toast.error(result.error);
      toast.success("Progreso de la fase actualizado.");
      setSelected(null);
      router.refresh();
    });
  }

  return (
    <section className="rounded-xl border bg-card">
      <div className="flex items-center justify-between gap-4 border-b px-5 py-4">
        <div>
          <h2 className="font-semibold">Fases del proyecto</h2>
          <p className="mt-1 text-sm text-muted-foreground">Secuencia operativa y avance de cada etapa.</p>
        </div>
      </div>

      <div className="p-5">
        {activePhases.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No hay fases activas configuradas.</p>
        ) : (
          <ol className="relative space-y-0">
            {activePhases.map((phase, index) => (
              <li key={phase.id} className="relative flex gap-4 pb-7 last:pb-0">
                {index < activePhases.length - 1 && <span className="absolute top-7 bottom-0 left-[0.68rem] w-px bg-border" />}
                <span className={`relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border ${phase.is_current ? "border-brand bg-brand text-brand-foreground" : phase.progress === 100 ? "border-status-success bg-status-success text-background" : "bg-background text-muted-foreground"}`}>
                  {phase.progress === 100 ? <Check className="size-3.5" /> : phase.is_current ? <Circle className="size-2 fill-current" /> : <span className="size-1.5 rounded-full bg-current" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div><p className="font-medium">{phase.name}</p>{phase.is_current && <p className="mt-0.5 text-xs font-medium text-brand">Fase actual</p>}</div>
                    {canEdit && <Button variant="ghost" size="sm" onClick={() => openPhase(phase)}>Actualizar</Button>}
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-brand" style={{ width: `${phase.progress}%` }} /></div>
                    <span className="w-9 text-right text-xs font-medium">{phase.progress}%</span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Actualizar {selected?.name}</DialogTitle><DialogDescription>Registra el avance y define si es la fase actual del proyecto.</DialogDescription></DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-3 text-sm font-medium"><span>Progreso: {progress}%</span><Slider min={0} max={100} step={1} value={[progress]} onValueChange={(value) => setProgress(Number(Array.isArray(value) ? value[0] ?? 0 : value))} aria-label="Progreso de la fase" /></div>
            <div className="flex items-center justify-between rounded-lg border p-3"><span><span className="block text-sm font-medium">Fase actual</span><span className="text-xs text-muted-foreground">Reemplazará la fase actual anterior.</span></span><Switch checked={isCurrent} onCheckedChange={setIsCurrent} aria-label="Marcar como fase actual" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setSelected(null)} disabled={pending}>Cancelar</Button><Button onClick={savePhase} disabled={pending}>{pending && <LoaderCircle className="animate-spin" />}Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

