import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { NotificationMenu } from "@/components/notifications/notification-menu";
import { UserMenu } from "@/components/layout/user-menu";
import { GlobalSearch } from "@/components/layout/global-search";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import type { UserRole } from "@/types/auth";
import type { AppNotification } from "@/types/notification";
import type { StudioBranding } from "@/types/workspace-settings";

type AppHeaderProps = {
  user: {
    name: string;
    email: string;
    role: UserRole;
    avatarUrl?: string | null;
  };
  notifications: AppNotification[];
  unreadCount: number;
  studio: StudioBranding;
};

export function AppHeader({
  user,
  notifications,
  unreadCount,
  studio,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80 sm:px-6">
      <MobileSidebar user={user} studio={studio} />
      <div className="min-w-0 flex-1">
        <Breadcrumbs />
      </div>

      <GlobalSearch role={user.role} />
      <NotificationMenu
        notifications={notifications}
        unreadCount={unreadCount}
      />
      <UserMenu user={user} />
    </header>
  );
}
