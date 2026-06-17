import React from "react";
import { ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { cn } from "../ui/utils";
import CallSidePanel from "./CallSidePanel";

export default function CallCollapsibleSidePanel({
  collapsed = false,
  onToggle,
  activeTab = "participants",
  onTabChange,
  messageCount = 0,
}) {
  return (
    <div className="relative hidden shrink-0 self-stretch md:flex">
      <button
        type="button"
        className="absolute -left-4 top-1/2 z-30 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-surface-border bg-surface-card text-primary shadow-card transition-colors hover:border-primary/40 hover:bg-primary-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        onClick={onToggle}
        aria-expanded={!collapsed}
        aria-controls="call-side-panel"
        aria-label={collapsed ? "Expand messages panel" : "Collapse messages panel"}
        title={collapsed ? "Expand panel" : "Collapse panel"}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" aria-hidden />
        ) : (
          <ChevronLeft className="h-4 w-4" aria-hidden />
        )}
      </button>

      <aside
        className={cn(
          "flex h-full flex-col overflow-hidden border-l border-surface-border bg-surface-card transition-[width] duration-[250ms] ease-in-out",
          collapsed ? "w-12" : "w-[320px]",
        )}
        aria-label="Call side panel"
      >
        {collapsed ? (
          <button
            type="button"
            className="flex h-full w-full flex-col items-center justify-center gap-1 py-4 text-primary transition-colors hover:bg-primary-tint/40"
            onClick={onToggle}
            aria-label="Expand messages and participants panel"
            title="Expand panel"
          >
            <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-primary-tint">
              <MessageSquare className="h-4 w-4" aria-hidden />
              {messageCount > 0 ? (
                <span
                  className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary"
                  aria-hidden
                />
              ) : null}
            </span>
            <span className="sr-only">Messages and participants panel collapsed</span>
          </button>
        ) : (
          <div className="min-h-0 min-w-[320px] flex-1">
            <CallSidePanel
              id="call-side-panel"
              activeTab={activeTab}
              onTabChange={onTabChange}
              messageCount={messageCount}
              onCollapse={onToggle}
            />
          </div>
        )}
      </aside>
    </div>
  );
}
