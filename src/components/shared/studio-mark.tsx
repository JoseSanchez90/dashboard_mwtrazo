"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function StudioMark({ name, logoUrl, className }: { name: string; logoUrl?: string | null; className?: string }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "MW";
  return (
    <Avatar className={cn("size-8 rounded-lg", className)}>
      {logoUrl && <AvatarImage src={logoUrl} alt={`Logo de ${name}`} className="rounded-lg bg-white object-contain" />}
      <AvatarFallback className="rounded-lg bg-brand text-xs font-bold text-brand-foreground">{initials}</AvatarFallback>
    </Avatar>
  );
}
