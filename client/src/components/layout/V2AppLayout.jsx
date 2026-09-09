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
/**
 * Breadcrumb + title + chips (left), chips + buttons (right) — matches the
 * `.topbar` pattern in the StartupVerse V2 HTML mockups (e.g.
 * `StartupVerse › Founder Dashboard · [stage chip]` ... `[week chip] [btn] [btn]`).
 */
function V2Topbar({ breadcrumb = "StartupVerse", title, chips = [], actions }) {
  return (
    <div
      className={cn(
        "flex h-14 shrink-0 items-center justify-between gap-3",
        "border-b border-v2-border bg-v2-surface px-5",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
        <span className="shrink-0 font-body text-[13px] text-v2-muted">
          {breadcrumb}
        </span>
        {title ? (
          <>
            <span className="shrink-0 font-body text-[13px] text-v2-subtle">›</span>
            <h1 className="shrink-0 truncate font-heading text-[17px] font-semibold text-v2-heading">
              {title}
            </h1>
          </>
        ) : null}
        {chips.length > 0 ? (
          <>
            <span className="shrink-0 font-body text-[13px] text-v2-subtle">·</span>
            <div className="flex items-center gap-1.5 overflow-x-auto">{chips}</div>
          </>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2 pl-3">{actions}</div>
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
  topbarBreadcrumb,
  topbarTitle,
  topbarChips,
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
        {(topbarTitle || topbarChips?.length || topbarActions) ? (
          <V2Topbar
            breadcrumb={topbarBreadcrumb}
            title={topbarTitle}
            chips={topbarChips}
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
