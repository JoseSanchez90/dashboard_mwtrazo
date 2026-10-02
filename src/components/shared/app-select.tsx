"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type AppSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  emptyLabel?: string;
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "default";
};

export function AppSelect({ value, onValueChange, options, emptyLabel, placeholder, ariaLabel, disabled, className = "w-full", size = "default" }: AppSelectProps) {
  const items = emptyLabel
    ? [{ value: null, label: emptyLabel }, ...options]
    : options;

  return (
    <Select items={items} value={value || null} onValueChange={(next) => onValueChange(next === null ? "" : String(next))} disabled={disabled}>
      <SelectTrigger className={className} size={size} aria-label={ariaLabel}>
        <SelectValue placeholder={placeholder ?? emptyLabel ?? "Seleccionar"} />
      </SelectTrigger>
      <SelectContent>
        {emptyLabel && <SelectItem value={null}>{emptyLabel}</SelectItem>}
        {options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
