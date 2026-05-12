/**
 * GradientHero
 *
 * Hero/welcome panel using the canonical brand gradient. Lifted from
 * TeamMemberDashboard.jsx:218-248 and FounderDashboard.jsx:1803-1820.
 *
 * Props:
 *  - eyebrow?: string                          (small uppercase-ish date/context line)
 *  - title:   string                           (hero headline)
 *  - subtitle?: string                         (single-line description)
 *  - icon?: React.ComponentType<{className}>   (lucide icon for the inset disc)
 *  - actions?: Array<{
 *      label: string,
 *      onClick?: () => void,
 *      icon?: React.ComponentType<{className}>,
 *      variant?: "white" | "glass",
 *    }>
 *  - trailing?: React.ReactNode               (custom slot to the right of actions
 *                                               — e.g. status badges)
 *  - className?: string
 */
import React from "react";
import { cn } from "../../ui/utils";

export default function GradientHero({
  eyebrow,
  title,
  subtitle,
  icon: Icon,
  actions = [],
  trailing,
  className,
}) {
  return (
    <section
      className={cn(
        "rounded-card bg-[linear-gradient(135deg,#3a5afe_0%,#7c4dff_100%)] px-4 py-5 shadow-[0_4px_24px_rgba(58,90,254,0.18)] md:px-5",
        className,
      )}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-input bg-white/15">
              <Icon className="h-5 w-5 text-white" />
            </div>
          )}
          <div className="space-y-1">
            {eyebrow && (
              <p className="font-body text-[13px] font-normal text-[rgba(255,255,255,0.70)]">
                {eyebrow}
              </p>
            )}
            <h2 className="font-heading text-[20px] font-bold leading-tight text-white md:text-[22px]">
              {title}
            </h2>
            {subtitle && (
              <p className="max-w-2xl font-body text-[13px] text-[rgba(255,255,255,0.80)]">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {(actions.length > 0 || trailing) && (
          <div className="flex flex-wrap items-center gap-2">
            {actions.map((action, index) => {
              const ActionIcon = action.icon;
              const isWhite = (action.variant || "white") === "white";
              return (
                <button
                  key={`${action.label}-${index}`}
                  type="button"
                  onClick={action.onClick}
                  className={cn(
                    "inline-flex h-9 items-center gap-2 rounded-input px-3 font-body text-[13px] font-semibold transition-colors duration-200 ease-in-out",
                    isWhite
                      ? "border border-white bg-white text-[#3a5afe] hover:bg-[#e8ebff]"
                      : "border-[1.5px] border-white/40 bg-white/15 text-white backdrop-blur-[4px] hover:bg-white/25",
                  )}
                >
                  {ActionIcon && <ActionIcon className="h-4 w-4" />}
                  {action.label}
                </button>
              );
            })}
            {trailing}
          </div>
        )}
      </div>
    </section>
  );
}
