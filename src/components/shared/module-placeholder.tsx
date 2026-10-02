import type { LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";

type ModulePlaceholderProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export function ModulePlaceholder({
  title,
  description,
  icon,
}: ModulePlaceholderProps) {
  return (
    <div className="space-y-8">
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={icon}
        title={`${title} estará disponible próximamente`}
        description="La estructura visual está lista. Los datos y las acciones se incorporarán en una fase posterior."
      />
    </div>
  );
}
