"use client";

import { useTheme } from "@/components/theme-provider";
import { useEffect } from "react";

type Theme = "light" | "dark";

/**
 * Syncs the theme from user profile to next-themes when the user is logged in.
 * Call this inside ThemeProvider, only when profile is available (e.g. in app layout).
 */
export function SyncProfileTheme({ profileTheme }: { profileTheme: Theme }) {
  const { setTheme, theme } = useTheme();

  useEffect(() => {
    if (profileTheme && theme !== profileTheme) {
      setTheme(profileTheme);
    }
  }, [profileTheme, setTheme, theme]);

  return null;
}
