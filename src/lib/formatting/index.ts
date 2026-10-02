import type { DateFormat, FormattingPreferences } from "@/types/preferences";

function dateParts(value: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone,
  }).formatToParts(value);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function formattedDate(parts: Record<string, string>, format: DateFormat) {
  if (format === "YYYY-MM-DD") return `${parts.year}-${parts.month}-${parts.day}`;
  if (format === "MM/DD/YYYY") return `${parts.month}/${parts.day}/${parts.year}`;
  return `${parts.day}/${parts.month}/${parts.year}`;
}

export function formatDate(value: string | Date | null, preferences: FormattingPreferences, fallback = "Sin fecha") {
  if (!value) return fallback;
  const normalized = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00Z`)
    : new Date(value);
  return formattedDate(dateParts(normalized, preferences.timezone), preferences.date_format);
}

export function formatDateTime(value: string | Date | null, preferences: FormattingPreferences, fallback = "Sin fecha") {
  if (!value) return fallback;
  const date = new Date(value);
  const day = formattedDate(dateParts(date, preferences.timezone), preferences.date_format);
  const time = new Intl.DateTimeFormat("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: preferences.timezone,
  }).format(date);
  return `${day}, ${time}`;
}

export function formatCurrency(value: number, preferences: FormattingPreferences) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: preferences.currency,
    currencyDisplay: "symbol",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
