"use client";

import { Bell, Building2, FolderKanban, Palette, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { AppearanceSettings } from "@/components/settings/appearance-settings";
import { NotificationPreferencesSettings } from "@/components/settings/notification-preferences-settings";
import { PreferencesSettings } from "@/components/settings/preferences-settings";
import { ProjectPhaseSettings } from "@/components/settings/project-phase-settings";
import { StudioSettings } from "@/components/settings/studio-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { UserRole } from "@/types/auth";
import type { NotificationPreferences } from "@/types/notification";
import type { FormattingPreferences } from "@/types/preferences";
import type { ProjectPhaseTemplate } from "@/types/project";
import type { WorkspaceSettings } from "@/types/workspace-settings";

const personalSections = [
  { value: "appearance", label: "Apariencia", icon: Palette },
  { value: "preferences", label: "Preferencias", icon: SlidersHorizontal },
  { value: "notifications", label: "Notificaciones", icon: Bell },
] as const;
const globalSections = [
  { value: "studio", label: "Estudio", icon: Building2, description: "Datos institucionales y parámetros generales del estudio." },
  { value: "projects", label: "Proyectos", icon: FolderKanban, description: "Valores predeterminados y criterios globales para proyectos." },
] as const;

export function SettingsWorkspace({ role, preferences, notificationPreferences, workspaceSettings, logoUrl, phaseTemplates }: { role: UserRole; preferences: FormattingPreferences; notificationPreferences: NotificationPreferences; workspaceSettings: WorkspaceSettings; logoUrl: string | null; phaseTemplates: ProjectPhaseTemplate[] }) {
  const [section, setSection] = useState("appearance");
  const isAdmin = role === "admin";
  return (
    <Tabs value={section} onValueChange={setSection} className="gap-5">
      <div className="overflow-x-auto pb-1">
        <TabsList className="h-auto min-w-max" aria-label="Secciones de configuración">
          {personalSections.map(({ value, label, icon: Icon }) => <TabsTrigger key={value} value={value} className="gap-2 px-3 py-1.5"><Icon />{label}</TabsTrigger>)}
          {isAdmin && globalSections.map(({ value, label, icon: Icon }) => <TabsTrigger key={value} value={value} className="gap-2 px-3 py-1.5"><Icon />{label}</TabsTrigger>)}
        </TabsList>
      </div>
      <TabsContent value="appearance"><AppearanceSettings /></TabsContent>
      <TabsContent value="preferences"><PreferencesSettings preferences={preferences} /></TabsContent>
      <TabsContent value="notifications"><NotificationPreferencesSettings role={role} preferences={notificationPreferences} /></TabsContent>
      {isAdmin && <TabsContent value="studio"><StudioSettings settings={workspaceSettings} logoUrl={logoUrl} /></TabsContent>}
      {isAdmin && <TabsContent value="projects"><ProjectPhaseSettings templates={phaseTemplates} /></TabsContent>}
    </Tabs>
  );
}
