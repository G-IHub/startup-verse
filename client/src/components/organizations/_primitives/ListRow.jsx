/**
 * ListRow
 *
 * Tinted row used inside SectionCard for lists of tasks, startups, events, etc.
 * Reference: TeamMemberDashboard.jsx:344-365.
 *
 * Props:
 *  - leading?: React.ReactNode             (icon, avatar, or status badge)
 *  - title?: React.ReactNode
 *  - description?: React.ReactNode
 *  - meta?: React.ReactNode                (chips/inline metadata under description)
 *  - trailing?: React.ReactNode            (action buttons or trailing badge)
 *  - onClick?: () => void                  (whole row clickable)
 *  - className?: string
 *  - children?: React.ReactNode            (for fully custom rows)
 */
import React from "react";
import { cn } from "../../ui/utils";

export default function ListRow({
  leading,
  title,
  description,
  meta,
  trailing,
  onClick,
  className,
  children,
}) {
  const isInteractive = typeof onClick === "function";

  if (children) {
    return (
      <div
        onClick={onClick}
        className={cn(
          "rounded-[12px] bg-surface-page p-3 transition-colors duration-150 ease-in-out",
          isInteractive && "cursor-pointer hover:bg-primary-tint/40",
          className,
        )}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-[12px] bg-surface-page p-3 transition-colors duration-150 ease-in-out",
        isInteractive && "cursor-pointer hover:bg-primary-tint/40",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {leading && <div className="flex-shrink-0">{leading}</div>}
          <div className="min-w-0 flex-1 space-y-1">
            {title && (
              <p className="font-heading text-[14px] font-semibold text-text-heading">
                {title}
              </p>
            )}
            {description && (
              <p className="font-body text-[12px] text-text-muted">
                {description}
              </p>
            )}
            {meta && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {meta}
              </div>
            )}
          </div>
        </div>
        {trailing && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {trailing}
          </div>
        )}
      </div>
    </div>
  );
}
