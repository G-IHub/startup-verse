import React from "react";

/**
 * Suspense fallback for lazy dashboard routes.
 * Page-shaped token skeleton — no spinner copy.
 */
export default function PageLoadingFallback() {
  return (
    <div
      className="w-full space-y-6 p-1 sm:p-2"
      aria-busy="true"
      aria-label="Loading page"
    >
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-40 rounded bg-surface-border/50" />
        <div className="h-3 w-64 max-w-full rounded bg-surface-border/40" />
      </div>

      <div className="animate-pulse grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="h-20 rounded-card border border-surface-border bg-surface-card shadow-soft"
          >
            <div className="flex h-full flex-col justify-center gap-2 px-4">
              <div className="h-3 w-1/3 rounded bg-surface-border/40" />
              <div className="h-5 w-1/2 rounded bg-surface-border/50" />
            </div>
          </div>
        ))}
      </div>

      <div className="animate-pulse grid gap-4 lg:grid-cols-3">
        <div className="min-h-[220px] rounded-card border border-surface-border bg-surface-card p-5 shadow-soft lg:col-span-2">
          <div className="mb-4 h-4 w-1/3 rounded bg-surface-border/50" />
          <div className="space-y-3">
            <div className="h-3 w-full rounded bg-surface-border/40" />
            <div className="h-3 w-5/6 rounded bg-surface-border/35" />
            <div className="h-3 w-4/6 rounded bg-surface-border/30" />
            <div className="mt-6 h-28 w-full rounded-input bg-surface-border/25" />
          </div>
        </div>
        <div className="min-h-[220px] rounded-card border border-surface-border bg-surface-card p-5 shadow-soft">
          <div className="mb-4 h-4 w-1/2 rounded bg-surface-border/50" />
          <div className="space-y-3">
            <div className="h-10 w-full rounded-input bg-surface-border/35" />
            <div className="h-10 w-full rounded-input bg-surface-border/30" />
            <div className="h-10 w-full rounded-input bg-surface-border/25" />
          </div>
        </div>
      </div>
    </div>
  );
}
