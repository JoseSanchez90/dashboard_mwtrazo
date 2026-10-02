export const TIMEZONES = ["America/Lima", "America/Bogota", "America/Mexico_City", "Europe/Madrid", "UTC"] as const;
export const DATE_FORMATS = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"] as const;
export const WEEK_START_DAYS = [0, 1] as const;
export const CURRENCIES = ["PEN", "USD"] as const;

export type Timezone = (typeof TIMEZONES)[number];
export type DateFormat = (typeof DATE_FORMATS)[number];
export type WeekStartsOn = (typeof WEEK_START_DAYS)[number];
export type Currency = (typeof CURRENCIES)[number];

export type UserPreferences = {
  user_id: string;
  timezone: Timezone;
  date_format: DateFormat;
  week_starts_on: WeekStartsOn;
  currency: Currency;
  created_at: string;
  updated_at: string;
};

export type FormattingPreferences = Pick<UserPreferences, "timezone" | "date_format" | "week_starts_on" | "currency">;

export const DEFAULT_FORMATTING_PREFERENCES: FormattingPreferences = {
  timezone: "America/Lima",
  date_format: "DD/MM/YYYY",
  week_starts_on: 1,
  currency: "PEN",
};

export const TIMEZONE_LABELS: Record<Timezone, string> = {
  "America/Lima": "Lima (UTC-5)",
  "America/Bogota": "Bogotá (UTC-5)",
  "America/Mexico_City": "Ciudad de México",
  "Europe/Madrid": "Madrid",
  UTC: "UTC",
};

export const CURRENCY_LABELS: Record<Currency, string> = {
  PEN: "Sol peruano (PEN)",
  USD: "Dólar estadounidense (USD)",
};
