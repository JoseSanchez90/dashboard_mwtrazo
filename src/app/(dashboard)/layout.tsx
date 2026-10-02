import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { FormattingProvider } from "@/components/providers/formatting-provider";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { getAvatarSignedUrl } from "@/lib/profile/queries";
import { getNotificationSummary } from "@/lib/notifications/queries";
import { getUserPreferences } from "@/lib/preferences/queries";
import { getWorkspaceSettings } from "@/lib/workspace-settings/queries";

export default async function DashboardLayout({ children, modal }: { children: React.ReactNode; modal: React.ReactNode }) {
  const currentUser = await requireAuthenticatedUser();
  const [avatarUrl, notificationSummary, preferences, workspace] = await Promise.all([
    getAvatarSignedUrl(currentUser.profile.avatar_url),
    getNotificationSummary(),
    getUserPreferences(),
    getWorkspaceSettings(),
  ]);
  const user = {
    name: currentUser.profile.full_name,
    email: currentUser.email,
    role: currentUser.profile.role,
    avatarUrl,
  };

  return (
    <FormattingProvider preferences={preferences}>
      <div className="flex min-h-screen bg-muted/25">
        <AppSidebar user={user} studio={{ studioName: workspace.settings.studio_name, logoUrl: workspace.logoUrl }} />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader user={user} notifications={notificationSummary.notifications} unreadCount={notificationSummary.unreadCount} studio={{ studioName: workspace.settings.studio_name, logoUrl: workspace.logoUrl }} />
          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
            <div className="mx-auto w-full max-w-[100rem]">{children}</div>
          </main>
        </div>
      </div>
      {modal}
    </FormattingProvider>
  );
}
