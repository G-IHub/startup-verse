import React, { createContext, useContext } from "react";

const ThemeContext = createContext({ theme: "light" });

/** Light-only passthrough; dark mode deferred to docs/FUTURE_DARK_MODE.md */
export function ThemeProvider({ children }) {
  return (
    <ThemeContext.Provider value={{ theme: "light" }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
