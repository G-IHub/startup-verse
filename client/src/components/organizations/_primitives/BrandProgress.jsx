/**
 * BrandProgress
 *
 * Thin progress bar with brand-gradient fill (default) or a solid tonal fill
 * (success / warning / danger / info). Wraps shadcn Progress and uses the
 * [&_[data-slot=progress-indicator]] selector to override the indicator.
 *
 * Props:
 *  - value: number (0-100)
 *  - tone?: "brand" | "success" | "warning" | "danger" | "info"  (default "brand")
 *  - className?: string  (apply height / width here, e.g. "h-1.5")
 */
import React from "react";
import { Progress } from "../../ui/progress";
import { cn } from "../../ui/utils";

const TONE_FILLS = {
  brand:
    "[&_[data-slot=progress-indicator]]:!bg-[linear-gradient(90deg,#3a5afe_0%,#7c4dff_100%)]",
  success: "[&_[data-slot=progress-indicator]]:!bg-[#00c896]",
  warning: "[&_[data-slot=progress-indicator]]:!bg-[#ffb300]",
  danger: "[&_[data-slot=progress-indicator]]:!bg-[#ff4f6b]",
  info: "[&_[data-slot=progress-indicator]]:!bg-[#3a5afe]",
};

export default function BrandProgress({ value, tone = "brand", className }) {
  return (
    <Progress
      value={value}
      className={cn(
        "h-1.5 border-0 bg-[#e2e4f0]",
        TONE_FILLS[tone] || TONE_FILLS.brand,
        className,
      )}
    />
  );
}
