import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { SettingsWorkspace } from "@/components/settings/settings-workspace";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { getUserPreferences } from "@/lib/preferences/queries";
import { getNotificationPreferences } from "@/lib/notifications/queries";
import { listProjectPhaseTemplates } from "@/lib/projects/phase-template-queries";
import { getWorkspaceSettings } from "@/lib/workspace-settings/queries";

export const metadata: Metadata = { title: "Configuración" };

export default async function SettingsPage() {
  const user = await requireAuthenticatedUser();
  const [preferences, notificationPreferences, workspace, phaseTemplates] = await Promise.all([
    getUserPreferences(),
    getNotificationPreferences(),
    getWorkspaceSettings(),
    user.profile.role === "admin" ? listProjectPhaseTemplates() : Promise.resolve([]),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración"
        description="Administra tus preferencias personales y la configuración disponible del estudio."
      />
      <SettingsWorkspace role={user.profile.role} preferences={preferences} notificationPreferences={notificationPreferences} workspaceSettings={workspace.settings} logoUrl={workspace.logoUrl} phaseTemplates={phaseTemplates} />
    </div>
  );
}
