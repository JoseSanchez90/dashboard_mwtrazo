"use client";

import { createContext, useContext, type ReactNode } from "react";

import { DEFAULT_FORMATTING_PREFERENCES, type FormattingPreferences } from "@/types/preferences";

const FormattingContext = createContext<FormattingPreferences>(DEFAULT_FORMATTING_PREFERENCES);

export function FormattingProvider({ preferences, children }: { preferences: FormattingPreferences; children: ReactNode }) {
  return <FormattingContext.Provider value={preferences}>{children}</FormattingContext.Provider>;
}

export function useFormattingPreferences() {
  return useContext(FormattingContext);
}
