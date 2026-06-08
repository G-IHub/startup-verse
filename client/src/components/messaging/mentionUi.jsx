import React from "react";
import { cn } from "../ui/utils";

const STATUS_TONE = {
  pending: "bg-slate-100 text-slate-700 ring-slate-200/80",
  "in-progress": "bg-sky-50 text-sky-700 ring-sky-200/80",
  "in progress": "bg-sky-50 text-sky-700 ring-sky-200/80",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200/80",
  blocked: "bg-rose-50 text-rose-700 ring-rose-200/80",
};

const PRIORITY_TONE = {
  high: "bg-rose-50 text-rose-700 ring-rose-200/80",
  medium: "bg-amber-50 text-amber-800 ring-amber-200/80",
  low: "bg-slate-100 text-slate-600 ring-slate-200/80",
};

function normalizeKey(value) {
  return String(value || "pending").trim().toLowerCase().replace(/_/g, "-");
}

export function formatStatusLabel(value) {
  return normalizeKey(value).replace(/-/g, " ");
}

export function MentionStatusBadge({ value, compact = false, onDark = false }) {
  const key = normalizeKey(value);
  const tone = STATUS_TONE[key] || STATUS_TONE.pending;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md font-medium capitalize ring-1 ring-inset",
        compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]",
        onDark ? "bg-white/15 text-white ring-white/20" : tone,
      )}
    >
      {formatStatusLabel(value)}
    </span>
  );
}

export function MentionPriorityBadge({ value, compact = false, onDark = false }) {
  const key = normalizeKey(value);
  const tone = PRIORITY_TONE[key] || PRIORITY_TONE.medium;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md font-medium capitalize ring-1 ring-inset",
        compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]",
        onDark ? "bg-white/15 text-white ring-white/20" : tone,
      )}
    >
      {formatStatusLabel(value)}
    </span>
  );
}

export function MentionMetaText({ children, muted = false, onDark = false }) {
  return (
    <span
      className={cn(
        "font-body text-[11px] leading-none",
        onDark ? "text-white/75" : muted ? "text-slate-500" : "text-slate-700",
      )}
    >
      {children}
    </span>
  );
}

export function MentionMetaRow({ items = [] }) {
  const visible = items.filter(Boolean);
  if (visible.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {visible.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 ? (
            <span className="text-[10px] text-slate-300" aria-hidden="true">
              &middot;
            </span>
          ) : null}
          {item}
        </React.Fragment>
      ))}
    </div>
  );
}

export function MentionIconBox({ icon: Icon, tone = "primary" }) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
        tone === "primary" && "bg-primary/10 text-primary",
        tone === "neutral" && "bg-surface-muted text-text-muted",
      )}
    >
      <Icon className="h-4 w-4" />
    </div>
  );
}

export function MentionTypeLabel({ children }) {
  return (
    <span className="block font-body text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
      {children}
    </span>
  );
}

export function mentionPickerRowClass(isHighlighted) {
  return cn(
    "mx-1.5 flex cursor-pointer items-start gap-3 rounded-xl px-2.5 py-2.5 transition-colors",
    "hover:bg-surface-muted/70",
    "data-[selected=true]:bg-transparent data-[selected=true]:text-inherit",
    isHighlighted && "bg-primary/[0.07] ring-1 ring-primary/15",
  );
}

export function mentionPickerShellClass() {
  return cn(
    "absolute bottom-full left-0 right-0 z-20 mb-2 overflow-hidden",
    "rounded-2xl border border-surface-border/80 bg-white",
    "shadow-[0_12px_40px_rgba(15,23,42,0.12)]",
  );
}

export function mentionCardClass(isMe) {
  return cn(
    "group mt-2.5 w-full min-w-[220px] max-w-full rounded-2xl p-3.5 text-left transition-all",
    isMe
      ? "bg-white text-slate-950 shadow-[0_6px_18px_rgba(15,23,42,0.16)] hover:shadow-[0_8px_22px_rgba(15,23,42,0.18)]"
      : "border border-slate-200 bg-white text-slate-950 shadow-sm hover:border-primary/20 hover:bg-primary/[0.02]",
  );
}

/** Style mention tokens inside message body copy. */
export function MessageMentionText({ text, isMe = false }) {
  const value = String(text || "");
  if (!value.includes("@")) {
    return <p className="wrap-break-word">{value}</p>;
  }

  const parts = value.split(/(@[^\s@][^\n@]*)/g).filter(Boolean);
  return (
    <p className="wrap-break-word leading-relaxed">
      {parts.map((part, index) => {
        if (!part.startsWith("@")) {
          return <span key={index}>{part}</span>;
        }
        return (
          <span
            key={index}
            className={cn(
              "mx-0.5 inline-flex rounded-md px-1.5 py-0.5 font-medium",
              isMe
                ? "bg-white/15 text-white ring-1 ring-white/20"
                : "bg-primary/10 text-primary ring-1 ring-primary/15",
            )}
          >
            {part.slice(1) || part}
          </span>
        );
      })}
    </p>
  );
}
