/**
 * EmptyStateBlock
 *
 * In-panel or full-section empty state.
 *  - variant="compact": one-line message on a surface-page tinted block.
 *    (TeamMemberDashboard.jsx:503-505)
 *  - variant="centered": large icon disc + title + description + optional CTA.
 *    (TeamMemberDashboard.jsx:332-341, TalentDashboard.jsx:511-561)
 *
 * Props:
 *  - variant?: "compact" | "centered"   (default "centered")
 *  - icon?: React.ComponentType<{className}>
 *  - tone?: "info" | "success" | "warning" | "danger"   (icon disc tone)
 *  - title?: string
 *  - description?: string
 *  - action?: React.ReactNode
 *  - className?: string
 */
import React from "react";
import { cn } from "../../ui/utils";

const ICON_TONES = {
  info: "bg-[#e8ebff] text-[#3a5afe]",
  success: "bg-[#d1fae5] text-[#00c896]",
  warning: "bg-[#fef3c7] text-[#ffb300]",
  danger: "bg-[#fff1f2] text-[#ff4f6b]",
};

export default function EmptyStateBlock({
  variant = "centered",
  icon: Icon,
  tone = "info",
  title,
  description,
  action,
  className,
}) {
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "rounded-input bg-surface-page px-4 py-7 text-center",
          className,
        )}
      >
        {title && (
          <p className="font-heading text-[14px] font-semibold text-text-heading">
            {title}
          </p>
        )}
        {description && (
          <p
            className={cn(
              "font-body text-[13px] text-text-muted",
              title && "mt-1",
            )}
          >
            {description}
          </p>
        )}
        {action && <div className="mt-3">{action}</div>}
      </div>
    );
  }

  const iconToneClasses = ICON_TONES[tone] || ICON_TONES.info;

  return (
    <div
      className={cn(
        "flex min-h-[260px] flex-col items-center justify-center rounded-input bg-surface-page px-6 py-10 text-center",
        className,
      )}
    >
      {Icon && (
        <div
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-full",
            iconToneClasses,
          )}
        >
          <Icon className="h-8 w-8" />
        </div>
      )}
      {title && (
        <p
          className={cn(
            "font-heading text-[18px] font-bold text-text-heading",
            Icon && "mt-4",
          )}
        >
          {title}
        </p>
      )}
      {description && (
        <p className="mt-2 max-w-md font-body text-[13px] text-text-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
