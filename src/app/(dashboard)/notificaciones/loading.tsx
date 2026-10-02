import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationsLoading() {
  return <div className="space-y-6"><div className="space-y-2 border-b pb-6"><Skeleton className="h-8 w-52" /><Skeleton className="h-5 w-full max-w-xl" /></div><Skeleton className="h-9 w-56" /><Skeleton className="h-96 w-full rounded-xl" /></div>;
}
