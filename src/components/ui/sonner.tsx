"use client";

import { Toaster as Sonner } from "sonner";
import { useTheme } from "next-themes";

export function Toaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="top-right"
      closeButton
      richColors
      toastOptions={{
        classNames: {
          toast: "rounded-xl border bg-popover text-popover-foreground shadow-lg",
          description: "text-muted-foreground",
        },
      }}
    />
  );
}

