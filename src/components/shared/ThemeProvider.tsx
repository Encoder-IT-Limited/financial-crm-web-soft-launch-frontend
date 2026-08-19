"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "mrm-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  // Read the initial preference in an effect, not during render — localStorage
  // and matchMedia don't exist on the server, so reading them during render
  // would cause an SSR/CSR markup mismatch.
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    const preferred =
      stored ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    // One-time hydration sync: localStorage/matchMedia don't exist during SSR,
    // so the real preference can only be read after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(preferred);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark", theme === "dark");
    return () => {
      // Unmounting (e.g. navigating back to the public site) always leaves
      // the public site in light mode regardless of the stored preference.
      document.body.classList.remove("dark");
    };
  }, [theme]);

  function setTheme(next: Theme) {
    setThemeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
