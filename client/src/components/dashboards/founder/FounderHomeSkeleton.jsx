import React from "react";

/**
 * Layout-shaped cold-load skeleton for Founder Home.
 * Mirrors hero + metrics + focus + quick actions — no full-page spinner.
 */
export default function FounderHomeSkeleton() {
  return (
    <div
      className="flex min-h-screen flex-col bg-surface-page pb-12 pt-2 font-body md:pb-16"
      role="status"
      aria-live="polite"
      aria-label="Loading founder home"
    >
      <div className="mx-auto w-full max-w-[1400px] animate-pulse space-y-4 px-1 sm:px-0">
        <div className="rounded-card border border-surface-border bg-surface-card px-4 py-5 shadow-soft md:px-5">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 shrink-0 rounded-input bg-surface-border/80" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-28 rounded bg-surface-border/70" />
              <div className="h-5 w-44 rounded bg-surface-border" />
              <div className="h-3 w-72 max-w-full rounded bg-surface-border/60" />
            </div>
            <div className="hidden h-9 w-28 shrink-0 rounded-input bg-surface-border/70 sm:block" />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-card border border-surface-border bg-surface-card p-4 shadow-soft"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 rounded-input bg-surface-border/80" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-3 w-16 rounded bg-surface-border/70" />
                  <div className="h-7 w-12 rounded bg-surface-border" />
                  <div className="h-1.5 w-full rounded bg-surface-border/50" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-card border border-surface-border bg-surface-card p-4 shadow-soft sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-5 w-40 rounded bg-surface-border" />
              <div className="h-3 w-64 max-w-full rounded bg-surface-border/70" />
            </div>
            <div className="h-8 w-24 shrink-0 rounded-input bg-surface-border/70" />
          </div>
          <div className="space-y-3">
            <div className="h-16 rounded-input bg-surface-border/50" />
            <div className="h-16 rounded-input bg-surface-border/40" />
            <div className="flex gap-2 pt-2">
              <div className="h-10 flex-1 rounded-input bg-surface-border/60" />
              <div className="h-10 w-36 rounded-input bg-surface-border/50" />
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-[72px] rounded-card border border-surface-border bg-surface-card shadow-soft"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
