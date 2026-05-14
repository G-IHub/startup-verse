/**
 * StatTile
 *
 * Compact KPI tile with tinted icon disc + heading-style value.
 * Lifted from TeamMemberDashboard.jsx:266-305.
 *
 * Props:
 *  - icon: React.ComponentType<{className}>
 *  - label: string
 *  - value: string | number
 *  - unit?: string                 (small text shown next to the value)
 *  - note?: string                 (small grey description below)
 *  - tone?: "info" | "success" | "warning" | "danger"  (default "info")
 *  - progress?: number             (0-100, renders a BrandProgress under the note)
 *  - onClick?: () => void          (makes the whole tile clickable)
 *  - className?: string
 */
import React from "react";
import { Card, CardContent } from "../../ui/card";
import BrandProgress from "./BrandProgress";
import { cn } from "../../ui/utils";

const TONES = {
  info: "bg-[#e8ebff] text-[#3a5afe]",
  success: "bg-[#d1fae5] text-[#00c896]",
  warning: "bg-[#fef3c7] text-[#ffb300]",
  danger: "bg-[#fff1f2] text-[#ff4f6b]",
};

export default function StatTile({
  icon: Icon,
  label,
  value,
  unit,
  note,
  tone = "info",
  progress,
  onClick,
  className,
}) {
  const isInteractive = typeof onClick === "function";
  const discClasses = TONES[tone] || TONES.info;

  return (
    <Card
      onClick={onClick}
      className={cn(
        "rounded-card border-0 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-shadow duration-200 ease-in-out",
        isInteractive &&
          "cursor-pointer hover:shadow-[0_4px_24px_rgba(58,90,254,0.08)]",
        className,
      )}
    >
      <CardContent className="flex items-center gap-3 p-4 sm:px-4">
        {Icon && (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-input",
              discClasses,
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-baseline gap-1">
            <span className="font-heading text-[28px] font-extrabold leading-none text-text-heading">
              {value}
            </span>
            {unit && (
              <span className="font-body text-[12px] font-normal text-text-muted">
                {unit}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-body text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
              {label}
            </p>
            {note && (
              <p className="mt-0.5 font-body text-[12px] text-text-muted">
                {note}
              </p>
            )}
          </div>
        </div>
        {typeof progress === "number" && (
          <div className="ml-auto w-20 flex-shrink-0">
            <BrandProgress value={progress} className="h-1" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
