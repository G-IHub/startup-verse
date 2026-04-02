import React, { useState } from "react";
import { HelpCircle, Info } from "lucide-react";
export function HelpTooltip({ content, type = "help", className = "" }) {
  const [isVisible, setIsVisible] = useState(false);
  const Icon = type === "help" ? HelpCircle : Info;
  return (
    <div className="relative inline-block">
      <button
        type="button"
        className={`text-muted-foreground hover:text-foreground transition-colors ${className}`}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
      >
        <Icon className="w-4 h-4" />
      </button>
      {isVisible && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64">
          <div className="bg-popover text-popover-foreground p-3 rounded-lg shadow-lg border text-sm">
            {content}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
              <div className="border-8 border-transparent border-t-popover" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
