import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  fetchClientPreferences,
  mergeClientPreferencesPatch,
} from "../utils/api/clientPreferencesApi";

const ThemeContext = createContext(undefined);

export function ThemeProvider({ children, userId, authReady = true }) {
  const [theme, setThemeState] = useState("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!authReady) return;

    let cancelled = false;

    const apply = (t) => {
      const next = t === "dark" ? "dark" : "light";
      setThemeState(next);
      document.documentElement.classList.toggle("dark", next === "dark");
    };

    const run = async () => {
      let initial = "light";
      if (userId) {
        try {
          const prefs = await fetchClientPreferences(userId);
          const t = prefs?.startupverse_theme;
          if (t === "dark" || t === "light") initial = t;
        } catch {
          /* keep default */
        }
      }
      if (!cancelled) {
        apply(initial);
        setMounted(true);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [userId, authReady]);

  const setTheme = useCallback(
    async (newTheme) => {
      const next = newTheme === "dark" ? "dark" : "light";
      setThemeState(next);
      document.documentElement.classList.toggle("dark", next === "dark");
      if (userId) {
        try {
          await mergeClientPreferencesPatch(userId, {
            startupverse_theme: next,
          });
        } catch {
          /* non-fatal */
        }
      }
    },
    [userId],
  );

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === "light" ? "dark" : "light";
      document.documentElement.classList.toggle("dark", next === "dark");
      if (userId) {
        mergeClientPreferencesPatch(userId, {
          startupverse_theme: next,
        }).catch(() => {});
      }
      return next;
    });
  }, [userId]);

  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
