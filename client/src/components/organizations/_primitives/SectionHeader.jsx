/**
 * SectionHeader
 *
 * Inline section header used outside a SectionCard.
 * Reference: TalentDashboard.jsx:473-483.
 *
 * Props:
 *  - icon?: React.ComponentType<{className}>
 *  - title: string
 *  - description?: string
 *  - tone?: "info" | "success" | "warning" | "danger"   (icon color)
 *  - action?: React.ReactNode
 *  - className?: string
 */
import React from "react";
import { cn } from "../../ui/utils";

const ICON_TONES = {
  info: "text-primary",
  success: "text-[#00c896]",
  warning: "text-[#ffb300]",
  danger: "text-[#ff4f6b]",
};

export default function SectionHeader({
  icon: Icon,
  title,
  description,
  tone = "info",
  action,
  className,
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {Icon && (
            <Icon className={cn("h-4 w-4", ICON_TONES[tone] || ICON_TONES.info)} />
          )}
          <h2 className="font-heading text-base font-bold text-text-heading">
            {title}
          </h2>
        </div>
        {description && (
          <p className="mt-0.5 font-body text-[13px] text-text-body">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
