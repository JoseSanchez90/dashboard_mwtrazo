import { z } from "zod";

import { CURRENCIES, DATE_FORMATS, TIMEZONES } from "@/types/preferences";

export const userPreferencesSchema = z.object({
  timezone: z.enum(TIMEZONES),
  date_format: z.enum(DATE_FORMATS),
  week_starts_on: z.union([z.literal(0), z.literal(1)]),
  currency: z.enum(CURRENCIES),
});

export type UserPreferencesInput = z.input<typeof userPreferencesSchema>;
