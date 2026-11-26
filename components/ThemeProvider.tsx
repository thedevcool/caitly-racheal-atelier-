"use client";

import { ThemeProvider as NextThemes } from "next-themes";
import type { ReactNode } from "react";

/**
 * Dark is the approved reference; light is the ivory gallery-wall version.
 * The visitor's choice is remembered; the first-visit default comes from
 * SiteSettings.defaultTheme (dark | light | system).
 */
export function ThemeProvider({ children, defaultTheme }: { children: ReactNode; defaultTheme: string }) {
  return (
    <NextThemes
      attribute="data-theme"
      themes={["dark", "light"]}
      defaultTheme={defaultTheme}
      enableSystem={defaultTheme === "system"}
      storageKey="atelier-theme"
    >
      {children}
    </NextThemes>
  );
}
