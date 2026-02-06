"use client";

import { useTheme } from "@/components/theme-provider";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type Theme = "light" | "dark";

export function AppearanceCard() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleThemeChange(value: string) {
    if (value !== "light" && value !== "dark") return;
    const newTheme: Theme = value;
    setTheme(newTheme);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ theme: newTheme }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to save theme");
      toast.success("Theme updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save theme");
    }
  }

  if (!mounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const current = (resolvedTheme ?? theme ?? "light") as Theme;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Appearance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Label className="text-sm">Theme</Label>
        <ToggleGroup
          type="single"
          value={current}
          onValueChange={handleThemeChange}
          className="inline-flex w-full sm:w-auto"
        >
          <ToggleGroupItem value="light" aria-label="Light" className="flex items-center gap-2 px-4">
            <Sun className="h-4 w-4" />
            Light
          </ToggleGroupItem>
          <ToggleGroupItem value="dark" aria-label="Dark" className="flex items-center gap-2 px-4">
            <Moon className="h-4 w-4" />
            Dark
          </ToggleGroupItem>
        </ToggleGroup>
        <p className="text-xs text-muted-foreground">
          Choose how Octagram looks. Light is the default.
        </p>
      </CardContent>
    </Card>
  );
}
