"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

/**
 * Toggles between light and dark theme. Uses resolvedTheme to avoid hydration
 * mismatch (undefined during SSR / before hydration, then "light" or "dark").
 */
export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();

  // resolvedTheme is undefined until client-side; show placeholder to avoid mismatch
  if (typeof resolvedTheme !== "string") {
    return (
      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Toggle theme">
        <span className="h-4 w-4" aria-hidden />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}
