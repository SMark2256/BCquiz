"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminTheme } from "@/components/providers/admin-theme-provider";

export function AdminThemeToggle() {
  const { theme, mounted, toggleTheme } = useAdminTheme();
  // Until mounted, render a stable label so server and client HTML match.
  const isDark = !mounted || theme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={isDark ? "Váltás világos módra" : "Váltás sötét módra"}
      title={isDark ? "Világos mód" : "Sötét mód"}
      className="relative size-10 shrink-0 text-muted-foreground sm:size-10 transition-all duration-300 ease-in-out p-0"
    >
      <Sun className="size-8 scale-120 rotate-0 transition-all dark:scale-0 dark:-rotate-90 duration-500 linear" />
      <Moon className="absolute size-8 scale-0 rotate-90 transition-all dark:scale-120 dark:rotate-0 duration-500 linear" />
      <span className="sr-only">Téma váltása</span>
    </Button>
  );
}
