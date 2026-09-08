/**
 * V2AppLayout — 3-column grid layout for the V2 Autonomous OS design.
 *
 * Layout: 72px sidebar | 1fr main content | 288px right panel
 *
 * Usage:
 *   <V2AppLayout
 *     user={user}
 *     currentPage={page}
 *     onPageChange={setPage}
 *     rightPanel={<MyRightPanel />}   ← optional; omit to hide right column
 *   >
 *     <MyPageContent />
 *   </V2AppLayout>
 *
 * The right panel is optional — pass null/undefined to collapse to 2-column.
 */

import React from "react";
import { cn } from "../ui/utils";
import V2Sidebar from "./V2Sidebar";

/* ── Top bar inside main column ──────────────────────────────────────── */
function V2Topbar({ title, subtitle, actions }) {
  return (
    <div
      className={cn(
        "flex h-14 shrink-0 items-center justify-between",
        "border-b border-v2-border bg-v2-surface px-5",
      )}
    >
      <div className="min-w-0 flex-1">
        {title ? (
          <h1 className="truncate font-heading text-[15px] font-semibold text-v2-heading leading-tight">
            {title}
          </h1>
        ) : null}
        {subtitle ? (
          <p className="truncate font-body text-[11px] text-v2-muted leading-tight">
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex items-center gap-2 pl-3">{actions}</div>
      ) : null}
    </div>
  );
}

/* ── Right panel wrapper ─────────────────────────────────────────────── */
function V2RightPanel({ children }) {
  if (!children) return null;
  return (
    <aside
      className={cn(
        "hidden w-[288px] shrink-0 flex-col overflow-y-auto xl:flex",
        "border-l border-v2-border bg-v2-surface",
      )}
      aria-label="Context panel"
    >
      {children}
    </aside>
  );
}

/* ── Main export ─────────────────────────────────────────────────────── */
export default function V2AppLayout({
  user,
  currentPage,
  onPageChange,
  children,
  rightPanel = null,
  topbarTitle,
  topbarSubtitle,
  topbarActions,
  className,
}) {
  return (
    <div
      className={cn(
        "flex h-screen overflow-hidden bg-v2-page font-body",
        className,
      )}
    >
      {/* Col 1 — 72px icon sidebar */}
      <V2Sidebar
        user={user}
        currentPage={currentPage}
        onPageChange={onPageChange}
      />

      {/* Col 2 — main content (fills remaining width) */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Optional top bar */}
        {(topbarTitle || topbarActions) ? (
          <V2Topbar
            title={topbarTitle}
            subtitle={topbarSubtitle}
            actions={topbarActions}
          />
        ) : null}

        {/* Page content — scrolls independently */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Col 3 — 288px right context panel (optional) */}
      <V2RightPanel>{rightPanel}</V2RightPanel>
    </div>
  );
}

/* ── Named re-exports for convenience ───────────────────────────────── */
export { V2Topbar, V2RightPanel };
