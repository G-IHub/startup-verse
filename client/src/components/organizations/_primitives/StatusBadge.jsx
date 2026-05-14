/**
 * StatusBadge
 *
 * Single source of truth for the four tonal status pills used across the
 * Organization subtree. Replaces ad-hoc statusTone() helpers.
 *
 * Props:
 *  - status?: "active" | "slowing" | "stalled" | "completed" | "in-progress"
 *           | "blocked" | "pending" | "excellent" | "good" | "needs-attention"
 *           | "critical" | "info" | "success" | "warning" | "danger"
 *           | "low" | "normal" | "high" | "urgent"
 *           | "submitted" | "under-review" | "approved" | "needs-revision"
 *  - label?: string         (overrides the auto-titlecased status)
 *  - tone?: "info" | "success" | "warning" | "danger"
 *           (overrides the auto-mapped tone from `status`)
 *  - icon?: React.ComponentType<{className}>   (lucide icon rendered inline before label)
 *  - className?: string
 */
import React from "react";
import { cn } from "../../ui/utils";

const TONE_CLASSES = {
  info: "bg-[#e8ebff] text-[#3a5afe]",
  success: "bg-[#d1fae5] text-[#00c896]",
  warning: "bg-[#fef3c7] text-[#ffb300]",
  danger: "bg-[#fff1f2] text-[#ff4f6b]",
};

const STATUS_TO_TONE = {
  active: "success",
  completed: "success",
  excellent: "success",
  good: "success",
  success: "success",
  approved: "success",
  healthy: "success",

  "in-progress": "info",
  pending: "info",
  info: "info",
  submitted: "info",
  "under-review": "info",
  reviewed: "info",
  invited: "info",
  low: "info",
  normal: "info",

  slowing: "warning",
  "needs-attention": "warning",
  warning: "warning",
  "needs-revision": "warning",
  revision_requested: "warning",
  high: "warning",

  stalled: "danger",
  blocked: "danger",
  critical: "danger",
  danger: "danger",
  urgent: "danger",
  rejected: "danger",
};

const STATUS_LABELS = {
  "in-progress": "In Progress",
  "needs-attention": "Needs Attention",
  "under-review": "Under Review",
  "needs-revision": "Needs Revision",
  revision_requested: "Needs Revision",
};

function titlecase(value) {
  if (!value) return "";
  return value
    .toString()
    .split(/[-_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export default function StatusBadge({
  status,
  label,
  tone,
  icon: Icon,
  className,
}) {
  const resolvedTone = tone || STATUS_TO_TONE[status] || "info";
  const toneClasses = TONE_CLASSES[resolvedTone] || TONE_CLASSES.info;
  const resolvedLabel =
    label !== undefined && label !== null
      ? label
      : status
        ? STATUS_LABELS[status] || titlecase(status)
        : "";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border-0 px-[10px] py-[2px] font-body text-[11px] font-semibold capitalize",
        toneClasses,
        className,
      )}
    >
      {Icon && <Icon className="h-3 w-3 shrink-0" />}
      {resolvedLabel}
    </span>
  );
}
