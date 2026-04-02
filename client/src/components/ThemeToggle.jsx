import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { Button } from "./ui/button";
export default function ThemeToggle({
  variant = "ghost",
  size = "icon",
  showLabel = false,
  className = "",
}) {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button
      variant={variant}
      size={size === "sm" ? "sm" : size}
      onClick={toggleTheme}
      className={`material-ripple ${size === "sm" ? "h-8 w-8 p-0 flex-shrink-0 rounded-full cursor-pointer" : ""} ${className}`}
      title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      {theme === "light" ? (
        <>
          <Moon className={size === "sm" ? "h-3 w-3" : "h-5 w-5"} />
          {showLabel && <span className="ml-2">Dark</span>}
        </>
      ) : (
        <>
          <Sun className={size === "sm" ? "h-3 w-3" : "h-5 w-5"} />
          {showLabel && <span className="ml-2">Light</span>}
        </>
      )}
    </Button>
  );
}
