import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ROLE_LABELS, type UserRole } from "@/types/auth";

type SidebarUserProps = {
  collapsed?: boolean;
  name: string;
  role: UserRole;
  avatarUrl?: string | null;
};

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function SidebarUser({ collapsed = false, name, role, avatarUrl }: SidebarUserProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 border-t px-4 py-4",
        collapsed && "justify-center px-2",
      )}
    >
      <Avatar className="size-8">
        {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
        <AvatarFallback className="bg-brand/10 font-semibold text-brand">
          {initials(name)}
        </AvatarFallback>
      </Avatar>
      {!collapsed && (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{ROLE_LABELS[role]}</p>
        </div>
      )}
    </div>
  );
}
