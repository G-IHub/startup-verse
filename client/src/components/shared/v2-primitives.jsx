/**
 * V2 Design Primitives
 * Shared atomic components used across all V2 screens.
 * Matches the design system defined in the HTML mockups.
 *
 * Typography scale (matches mockup):
 *   Section heads   14px semi-bold
 *   Body / labels   13–14px
 *   Small labels    12px
 *   Chips           12px medium
 *   Buttons sm      13px  md 13px  lg 14px
 *
 * Exports:
 *   V2Card        — white bordered card
 *   V2Chip        — inline status chip (color variants)
 *   V2Badge       — small count/label badge
 *   V2ScoreRing   — circular execution score gauge
 *   V2SectionHead — card section header row
 *   V2Btn         — button (primary / secondary / ghost)
 *   V2Avatar      — initials avatar
 *   V2Dot         — small status dot
 */

import React from "react";
import { cn } from "../ui/utils";

/* ── Card ─────────────────────────────────────────────────────────────── */
export function V2Card({ children, className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-[14px] border border-v2-border bg-v2-surface p-5",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ── Section header inside a card ────────────────────────────────────── */
export function V2SectionHead({ title, action, className }) {
  return (
    <div className={cn("mb-4 flex items-center justify-between", className)}>
      <span className="font-body text-[14px] font-semibold text-v2-heading">
        {title}
      </span>
      {action ? (
        <span className="font-body text-[12px] text-v2-muted">{action}</span>
      ) : null}
    </div>
  );
}

/* ── Chip variants ───────────────────────────────────────────────────── */
const CHIP_VARIANTS = {
  blue:   "bg-v2-blue-tint   text-v2-blue-dark",
  purple: "bg-v2-purple-tint text-v2-purple-dark",
  green:  "bg-v2-green-tint  text-v2-green-dark",
  amber:  "bg-v2-amber-tint  text-v2-amber-dark",
  grey:   "bg-gray-100       text-gray-600",
  red:    "bg-red-50         text-red-700",
};

export function V2Chip({ children, variant = "grey", dot = false, className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1",
        "font-body text-[12px] font-medium leading-none",
        CHIP_VARIANTS[variant] ?? CHIP_VARIANTS.grey,
        className,
      )}
    >
      {dot ? (
        <span
          className={cn(
            "h-[6px] w-[6px] shrink-0 rounded-full",
            variant === "green"  ? "bg-v2-green"  :
            variant === "blue"   ? "bg-v2-blue"   :
            variant === "purple" ? "bg-v2-purple" :
            variant === "amber"  ? "bg-v2-amber"  :
            variant === "red"    ? "bg-red-500"   : "bg-gray-400",
          )}
        />
      ) : null}
      {children}
    </span>
  );
}

/* ── Badge (small count) ─────────────────────────────────────────────── */
export function V2Badge({ children, variant = "blue", className }) {
  return (
    <span
      className={cn(
        "inline-flex min-w-[20px] items-center justify-center rounded-full px-2 py-0.5",
        "font-body text-[11px] font-semibold leading-none",
        CHIP_VARIANTS[variant] ?? CHIP_VARIANTS.blue,
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ── Execution Score Ring ────────────────────────────────────────────── */
export function V2ScoreRing({ score = 0, size = 80, strokeWidth = 6, className }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = ((score ?? 0) / 100) * circumference;

  const color =
    score >= 80 ? "#1D9E75" :
    score >= 60 ? "#534AB7" :
    score >= 40 ? "#BA7517" : "#EF4444";

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference - filled}`}
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      {/* Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-heading font-bold leading-none text-v2-heading"
          style={{ fontSize: size * 0.22 }}
        >
          {score ?? 0}
        </span>
        <span
          className="font-body text-v2-muted leading-none"
          style={{ fontSize: size * 0.13 }}
        >
          score
        </span>
      </div>
    </div>
  );
}

/* ── Button ──────────────────────────────────────────────────────────── */
const BTN_VARIANTS = {
  primary:   "bg-v2-blue text-white hover:bg-v2-blue-dark border-transparent",
  purple:    "bg-v2-purple text-white hover:bg-v2-purple-dark border-transparent",
  secondary: "bg-v2-surface text-v2-heading border-v2-border hover:bg-v2-page",
  ghost:     "bg-transparent text-v2-muted border-transparent hover:bg-v2-page hover:text-v2-heading",
  danger:    "bg-red-600 text-white border-transparent hover:bg-red-700",
};

export function V2Btn({
  children,
  variant = "secondary",
  size = "md",
  className,
  ...props
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full border",
        "font-body font-medium leading-none transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v2-blue/30",
        "disabled:pointer-events-none disabled:opacity-50",
        size === "sm" ? "px-3.5 py-2 text-[13px]" :
        size === "lg" ? "px-6 py-3 text-[14px]"   :
                        "px-4 py-2.5 text-[13px]",
        BTN_VARIANTS[variant] ?? BTN_VARIANTS.secondary,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* ── Avatar ──────────────────────────────────────────────────────────── */
export function V2Avatar({ name, size = 32, className }) {
  const initials = (name || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full",
        "bg-v2-blue-tint font-body font-semibold text-v2-blue-dark",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.375 }}
      aria-label={name}
    >
      {initials}
    </div>
  );
}

/* ── Status dot ──────────────────────────────────────────────────────── */
export function V2Dot({ variant = "grey", className }) {
  const colors = {
    green:  "bg-v2-green",
    blue:   "bg-v2-blue",
    purple: "bg-v2-purple",
    amber:  "bg-v2-amber",
    red:    "bg-red-500",
    grey:   "bg-gray-400",
  };
  return (
    <span
      className={cn("inline-block h-2 w-2 rounded-full", colors[variant] ?? colors.grey, className)}
      aria-hidden
    />
  );
}
