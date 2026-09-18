/**
 * V2AIStaffShell — owns tab state and sub-page navigation for the entire AI Staff section.
 *
 * Main tabs (shown when subPage === null):
 *   "workroom"     → V2AgentWorkroom
 *   "manage-staff" → V2AIStaffManage
 *
 * Sub-pages (shown fullscreen inside V2AppLayout, replacing the tab content):
 *   "approval-queue"    → V2ApprovalQueue
 *   "autonomy-settings" → V2AutonomySettings
 *   "audit-trail"       → V2AuditTrail
 *   anything else       → V2AIStaffComingSoon (generic placeholder)
 */

import React, { useState } from "react";
import { cn } from "../ui/utils";
import { Bot, Users, Plug, MessageSquare, Rocket } from "lucide-react";
import V2AppLayout from "../layout/V2AppLayout";
import V2AgentWorkroom from "./V2AgentWorkroom";
import V2AIStaffManage from "./V2AIStaffManage";
import V2ApprovalQueue from "./V2ApprovalQueue";
import V2AutonomySettings from "./V2AutonomySettings";
import V2AuditTrail from "./V2AuditTrail";
import V2AIMarketingWorkspace from "./V2AIMarketingWorkspace";
import V2AISalesWorkspace from "./V2AISalesWorkspace";
import V2AIFinanceWorkspace from "./V2AIFinanceWorkspace";
import V2AILegalWorkspace from "./V2AILegalWorkspace";
import V2AIDeveloperWorkspace from "./V2AIDeveloperWorkspace";
import V2AIStaffChat from "./V2AIStaffChat";
import V2Integrations from "./V2Integrations";
import V2ProductViewer from "./V2ProductViewer";

/* ── Tab config ─────────────────────────────────────────────────────────── */
const TABS = [
  { id: "workroom",       label: "Workroom",      Icon: Bot },
  { id: "manage-staff",   label: "Manage Staff",  Icon: Users },
  { id: "chat",           label: "Chat",          Icon: MessageSquare },
  { id: "product-viewer", label: "View Product",  Icon: Rocket },
  { id: "integrations",   label: "Integrations",  Icon: Plug },
];

/* ── Coming-soon placeholder for pages not yet built ───────────────────── */
function V2AIStaffComingSoon({ label, onBack }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-v2-page">
      <div className="flex shrink-0 items-center gap-2 border-b border-v2-border bg-white px-5 py-3">
        <button type="button" onClick={onBack} className="font-body text-[12px] text-v2-muted hover:text-v2-heading transition-colors">← Back</button>
        <span className="text-gray-300">·</span>
        <span className="font-body text-[12px] text-v2-muted">AI Staff</span>
        <span className="text-gray-300">›</span>
        <span className="font-body text-[13px] font-medium text-v2-heading">{label}</span>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EEEDFE]">
            <span className="text-[28px]">🤖</span>
          </div>
          <div>
            <p className="font-heading text-[17px] font-bold text-v2-heading">{label}</p>
            <p className="mt-1 font-body text-[13px] text-v2-muted">This workspace is being built — coming in the next phase.</p>
          </div>
          <button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-full bg-v2-purple px-4 py-2 font-body text-[12px] font-medium text-white hover:opacity-90 transition-opacity">
            ← Back to Workroom
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-page labels (for placeholder title) ────────────────────────────── */
const SUB_PAGE_LABELS = {
  "agent-marketing":  "AI Marketing Workspace",
  "agent-sales":      "AI Sales Workspace",
  "agent-finance":    "AI Finance Workspace",
  "agent-legal":      "AI Legal Workspace",
  "agent-developer":  "AI Developer Workspace",
  "ai-staff-chat":    "AI Staff Chat",
};

/* ── Toast (tab-bar-level actions, e.g. Chat's Download/Share) ──────────── */
function ShellToast({ msg }) {
  if (!msg) return null;
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-gray-900 px-5 py-2.5 font-body text-[12px] font-medium text-white shadow-lg">
      {msg}
    </div>
  );
}

/* ── Shell ──────────────────────────────────────────────────────────────── */
export default function V2AIStaffShell({ user, onPageChange, ...rest }) {
  const [tab, setTab]         = useState("workroom");
  const [subPage, setSubPage] = useState(null); // null = show main tabs
  const [toast, setToast]     = useState("");
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2400); };

  const handleNavigate = (page) => {
    if (page === "manage-staff")  { setSubPage(null); setTab("manage-staff");  return; }
    if (page === "workroom")      { setSubPage(null); setTab("workroom");      return; }
    if (page === "integrations")  { setSubPage(null); setTab("integrations");  return; }
    if (page === "chat" || page === "ai-staff-chat") { setSubPage(null); setTab("chat"); return; }
    if (page === "product-viewer") { setSubPage(null); setTab("product-viewer"); return; }
    // Known sub-pages stay inside the shell
    const internalPages = ["approval-queue","autonomy-settings","audit-trail",
      "agent-marketing","agent-sales","agent-finance","agent-legal","agent-developer"];
    if (internalPages.includes(page)) { setSubPage(page); return; }
    // Everything else → top-level routing
    onPageChange?.(page);
  };

  const handleBack = () => setSubPage(null);

  /* ── Render sub-page (no tab bar shown) ── */
  const renderSubPage = () => {
    switch (subPage) {
      case "approval-queue":
        return <V2ApprovalQueue user={user} onBack={handleBack} onNavigate={handleNavigate} />;
      case "autonomy-settings":
        return <V2AutonomySettings user={user} onBack={handleBack} onNavigate={handleNavigate} />;
      case "audit-trail":
        return <V2AuditTrail user={user} onBack={handleBack} onNavigate={handleNavigate} />;
      case "agent-marketing":
        return <V2AIMarketingWorkspace user={user} onBack={handleBack} onNavigate={handleNavigate} />;
      case "agent-sales":
        return <V2AISalesWorkspace user={user} onBack={handleBack} onNavigate={handleNavigate} />;
      case "agent-finance":
        return <V2AIFinanceWorkspace onBack={handleBack} onNavigate={handleNavigate} />;
      case "agent-legal":
        return <V2AILegalWorkspace onBack={handleBack} onNavigate={handleNavigate} />;
      case "agent-developer":
        return <V2AIDeveloperWorkspace user={user} onBack={handleBack} onNavigate={handleNavigate} />;
      default:
        return (
          <V2AIStaffComingSoon
            label={SUB_PAGE_LABELS[subPage] ?? subPage}
            onBack={handleBack}
          />
        );
    }
  };

  return (
    <V2AppLayout
      user={user}
      currentPage="ai-staff"
      onPageChange={onPageChange}
      mainClassName="overflow-hidden flex flex-col"
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">

        {/* ── Tab bar — hidden while a sub-page is open ── */}
        {!subPage && (
          <div className="flex shrink-0 items-center gap-1 border-b border-v2-border bg-white px-4 pt-2">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-t-xl border-b-2 px-4 pb-2.5 pt-2 font-body text-[12px] font-medium transition-colors",
                  tab === id
                    ? "border-v2-purple text-v2-purple"
                    : "border-transparent text-v2-muted hover:text-v2-heading",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}

            {tab === "workroom" && (
              <button
                type="button"
                onClick={() => setTab("manage-staff")}
                className="ml-auto mb-1.5 flex items-center gap-1 rounded-full bg-v2-purple px-3 py-1.5 font-body text-[11px] font-medium text-white hover:opacity-90 transition-opacity"
              >
                <Users className="h-3 w-3" />
                Hire staff ↗
              </button>
            )}

            {tab === "chat" && (
              <div className="ml-auto mb-1.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => showToast("Outputs downloaded")}
                  className="rounded-full border border-v2-border bg-white px-3 py-1.5 font-body text-[11px] font-medium text-v2-heading hover:bg-gray-50 transition-colors"
                >
                  Download outputs
                </button>
                <button
                  type="button"
                  onClick={() => showToast("Shared with team")}
                  className="rounded-full bg-v2-purple px-3 py-1.5 font-body text-[11px] font-medium text-white hover:opacity-90 transition-opacity"
                >
                  Share with team
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Content ── */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {subPage ? (
            renderSubPage()
          ) : tab === "workroom" ? (
            <V2AgentWorkroom
              user={user}
              onPageChange={onPageChange}
              onNavigate={handleNavigate}
              {...rest}
            />
          ) : tab === "integrations" ? (
            <V2Integrations
              user={user}
              onBack={() => setTab("workroom")}
              onNavigate={handleNavigate}
            />
          ) : tab === "chat" ? (
            <V2AIStaffChat user={user} onNavigate={handleNavigate} />
          ) : tab === "product-viewer" ? (
            <V2ProductViewer user={user} onBack={() => setTab("workroom")} />
          ) : (
            <V2AIStaffManage
              user={user}
              onChat={() => setTab("workroom")}
              onNavigate={handleNavigate}
              {...rest}
            />
          )}
        </div>

      </div>

      <ShellToast msg={toast} />
    </V2AppLayout>
  );
}
