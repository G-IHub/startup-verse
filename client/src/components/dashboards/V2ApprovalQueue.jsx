/**
 * V2ApprovalQueue — full approval queue page for AI Staff
 * Accessed from Workroom topbar "Approval queue" button or ApprovalCard "Open full queue" link
 *
 * Real data as of docs/ai-agent-roadmap.md Phase 0: reads AgentEvent rows via
 * agentOrchestrationApi (status=pending_approval → queue, everything else →
 * history), live-updated over Socket.IO (subscribeToAgentEvents). Approve/
 * Decline call the real resolveApproval endpoint. No real agents exist yet in
 * this environment, so an empty queue here is the correct, honest state, not
 * a bug — it fills in once Phase 1 gives an agent something real to propose.
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { cn } from "../ui/utils";
import { Search, CheckCircle2 } from "lucide-react";
import { useOfficeStore } from "../../state/useOfficeStore";
import { getAgentEvents, resolveAgentEvent } from "../../utils/api/agentOrchestrationApi";
import { subscribeToAgentEvents } from "../../utils/socketIoRealtime";
import { paletteForAgent, initialsForAgent, formatEventTime, riskDisplay } from "../../utils/agentDisplay";

/* ── Agent → real workspace page, mirrors the mockup's clickable avatars ───── */
const AGENT_WORKSPACE_PAGE = {
  "AI Sales": "agent-sales",
  "AI Marketing": "agent-marketing",
  "AI Finance": "agent-finance",
  "AI Legal": "agent-legal",
};

/* ── Mapping real AgentEvent rows → display items ──────────────────────────── */
function toQueueItem(event, currentUserId) {
  const actionType = event.actionTypeId || {};
  const agent = actionType.agentId || {};
  const agentName = agent.name || "Unknown agent";
  const palette = paletteForAgent(agent.id || agent.agentKey || agentName);
  const risk = riskDisplay(actionType.riskCategory);
  const isYou = !event.approverId || String(event.approverId) === String(currentUserId);
  return {
    id: event.id,
    view: isYou ? "you" : "team",
    isFyi: !isYou,
    risk: actionType.riskCategory === "sensitive_locked" ? "high" : "low",
    agent: { initials: initialsForAgent(agentName), bg: palette.bg, color: palette.color },
    title: actionType.label || `${event.targetType || "Action"} pending review`,
    riskLabel: risk.label, riskBg: risk.bg, riskColor: risk.color,
    desc: `Proposed by ${event.actorType === "agent" ? agentName : "a teammate"}${
      event.targetType ? ` · target: ${event.targetType}${event.targetId ? ` (${event.targetId})` : ""}` : ""
    }.`,
    agentName,
    waitingOn: isYou ? "you" : "a teammate",
    time: formatEventTime(event.createdAt),
    createdAt: event.createdAt,
    payload: event.payload,
  };
}

const HISTORY_STATUS_META = {
  autonomous_completed: { icon: "✓", iconBg: "#EAF3DE", status: "Autonomous", statusBg: "#EAF3DE", statusColor: "#27500A" },
  approved: { icon: "✓", iconBg: "#EAF3DE", status: "Approved", statusBg: "#EAF3DE", statusColor: "#27500A" },
  declined: { icon: "✕", iconBg: "#FCEBEB", status: "Declined", statusBg: "#FCEBEB", statusColor: "#791F1F" },
  human_completed: { icon: "✓", iconBg: "#EAF3DE", status: "Completed", statusBg: "#EAF3DE", statusColor: "#27500A" },
  failed: { icon: "✕", iconBg: "#FCEBEB", status: "Failed", statusBg: "#FCEBEB", statusColor: "#791F1F" },
};

function toHistoryItem(event) {
  const actionType = event.actionTypeId || {};
  const agent = actionType.agentId || {};
  const agentName = agent.name || "Unknown agent";
  const meta = HISTORY_STATUS_META[event.status] || { icon: "•", iconBg: "#f3f4f6", status: event.status, statusBg: "#f3f4f6", statusColor: "#6b7280" };
  const actorDesc = event.status === "failed" ? "failed" : event.actorType === "human" ? "human action" : meta.status.toLowerCase();
  const errorSuffix = event.status === "failed" && event.result?.error ? ` — ${event.result.error}` : "";
  return {
    id: event.id,
    icon: meta.icon, iconBg: meta.iconBg,
    title: actionType.label || `${event.targetType || "Agent action"}`,
    sub: `${agentName} · ${actorDesc} · ${formatEventTime(event.resolvedAt || event.createdAt)}${errorSuffix}`,
    status: meta.status, statusBg: meta.statusBg, statusColor: meta.statusColor,
  };
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */
function Av({ initials, bg, color, size = 28, onClick, title }) {
  const style = { width: size, height: size, background: bg, color, fontSize: size * 0.32 };
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={title}
        className="shrink-0 flex items-center justify-center rounded-[9px] font-body font-semibold transition-opacity hover:opacity-80"
        style={style}
      >
        {initials}
      </button>
    );
  }
  return (
    <div className="shrink-0 flex items-center justify-center rounded-[9px] font-body font-semibold" style={style}>
      {initials}
    </div>
  );
}

function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-gray-900 px-5 py-2.5 font-body text-[12px] font-medium text-white shadow-lg">
      {msg}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */
export default function V2ApprovalQueue({ user, onBack, onNavigate }) {
  const founderId = useOfficeStore((s) => s.founderId);
  const loadWorkspace = useOfficeStore((s) => s.loadWorkspace);
  const resolvedFounderId = founderId || String(user?._id ?? user?.id ?? "");
  const currentUserId = String(user?._id ?? user?.id ?? resolvedFounderId ?? "");

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewTab, setViewTab] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [busyIds, setBusyIds] = useState(new Set());
  const [toast, setToast] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  useEffect(() => { if (user) loadWorkspace(user); }, [user, loadWorkspace]);

  const upsertEvent = useCallback((incoming) => {
    if (!incoming?.id) return;
    setEvents((prev) => {
      const idx = prev.findIndex((e) => e.id === incoming.id);
      const next = idx === -1 ? [incoming, ...prev] : prev.map((e) => (e.id === incoming.id ? { ...e, ...incoming } : e));
      return next.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });
  }, []);

  useEffect(() => {
    if (!resolvedFounderId) return;
    let cancelled = false;
    setLoading(true);
    getAgentEvents(resolvedFounderId)
      .then((rows) => { if (!cancelled) { setEvents(rows || []); setError(""); } })
      .catch((err) => { if (!cancelled) setError(err?.message || "Could not load the approval queue."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [resolvedFounderId]);

  useEffect(() => {
    if (!resolvedFounderId) return undefined;
    return subscribeToAgentEvents(resolvedFounderId, upsertEvent);
  }, [resolvedFounderId, upsertEvent]);

  const pendingEvents = useMemo(() => events.filter((e) => e.status === "pending_approval"), [events]);
  const historyEvents = useMemo(() => events.filter((e) => e.status !== "pending_approval"), [events]);

  const items = useMemo(() => pendingEvents.map((e) => toQueueItem(e, currentUserId)), [pendingEvents, currentUserId]);
  const history = useMemo(() => historyEvents.slice(0, 30).map(toHistoryItem), [historyEvents]);

  const agentBreakdown = useMemo(() => {
    const byAgent = new Map();
    items.forEach((item) => {
      const entry = byAgent.get(item.agentName) || { ...item.agent, name: item.agentName, count: 0 };
      entry.count += 1;
      byAgent.set(item.agentName, entry);
    });
    return Array.from(byAgent.values());
  }, [items]);

  const avgWaitLabel = useMemo(() => {
    if (items.length === 0) return "—";
    const now = Date.now();
    const totalMs = items.reduce((sum, item) => sum + Math.max(0, now - new Date(item.createdAt).getTime()), 0);
    const avgMin = Math.round(totalMs / items.length / 60000);
    if (avgMin < 1) return "<1 min";
    if (avgMin < 60) return `${avgMin} min`;
    return `${Math.round(avgMin / 60)}h`;
  }, [items]);

  const resolve = async (id, decision, successMsg) => {
    setBusyIds((prev) => new Set(prev).add(id));
    try {
      const { resolved, execution } = await resolveAgentEvent(id, decision);
      if (resolved) upsertEvent(resolved);
      if (execution) upsertEvent(execution);
      showToast(successMsg);
    } catch (err) {
      showToast(err?.message || "Could not update that item.");
    } finally {
      setBusyIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
      setSelected((prev) => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  const bulkApprove = async () => {
    const ids = items.filter((i) => selected.has(i.id) && i.view === "you").map((i) => i.id);
    if (ids.length === 0) return;
    setSelected(new Set());
    let succeeded = 0;
    for (const id of ids) {
      setBusyIds((prev) => new Set(prev).add(id));
      try {
        const { resolved, execution } = await resolveAgentEvent(id, "approved");
        if (resolved) upsertEvent(resolved);
        if (execution) upsertEvent(execution);
        succeeded += 1;
      } catch {
        // A single failure shouldn't stop the rest; reflected in the final count.
      } finally {
        setBusyIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
      }
    }
    showToast(succeeded ? `✓ Approved ${succeeded} item${succeeded > 1 ? "s" : ""}` : "Could not approve the selected items.");
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const reviewItem = (item) => {
    const hasPayload = item.payload && typeof item.payload === "object" && Object.keys(item.payload).length > 0;
    showToast(hasPayload ? `Payload: ${JSON.stringify(item.payload).slice(0, 140)}` : "No additional detail attached to this action yet.");
  };

  const visible = useMemo(() => {
    let list = items;
    if (viewTab === "you") list = list.filter((i) => i.view === "you");
    if (viewTab === "team") list = list.filter((i) => i.view === "team");
    if (riskFilter === "low") list = list.filter((i) => i.risk === "low");
    if (riskFilter === "high") list = list.filter((i) => i.risk === "high");
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((i) => (i.title + " " + i.desc + " " + i.agentName).toLowerCase().includes(q));
    }
    return list;
  }, [items, viewTab, riskFilter, search]);

  const needsYouCount = items.filter((i) => i.view === "you").length;
  const teamCount = items.filter((i) => i.view === "team").length;

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-v2-page">

      {/* ── Main ── */}
      <div className="min-h-0 flex-1 overflow-y-auto">

        {/* Topbar */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-v2-border bg-white px-5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={onBack} className="font-body text-[12px] text-v2-muted hover:text-v2-heading transition-colors">← Back</button>
            <span className="text-gray-300">·</span>
            <span className="font-body text-[12px] text-v2-muted">AI Staff</span>
            <span className="text-gray-300">›</span>
            <span className="font-body text-[13px] font-medium text-v2-heading">Approval Queue</span>
            <span className="text-gray-300">·</span>
            {items.length > 0
              ? <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FCEBEB] px-2.5 py-1 font-body text-[11px] font-medium text-[#791F1F]"><span className="h-[5px] w-[5px] rounded-full bg-red-500" />{items.length} pending</span>
              : <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF3DE] px-2.5 py-1 font-body text-[11px] font-medium text-[#27500A]">All clear ✓</span>
            }
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={onBack} className="flex items-center gap-1.5 rounded-full border border-v2-border bg-white px-3 py-1.5 font-body text-[12px] font-medium text-v2-heading hover:bg-gray-50 transition-colors">
              Agent Workroom
            </button>
            <button type="button" onClick={() => onNavigate?.("autonomy-settings")} className="flex items-center gap-1.5 rounded-full border border-v2-border bg-white px-3 py-1.5 font-body text-[12px] font-medium text-v2-heading hover:bg-gray-50 transition-colors">
              Autonomy settings
            </button>
          </div>
        </div>

        <div className="space-y-3 p-5">

          {error && (
            <div className="rounded-2xl border border-[#791F1F]/20 bg-[#FCEBEB] p-3 font-body text-[11px] text-[#791F1F]">{error}</div>
          )}

          {/* Filter bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 rounded-full bg-gray-100 p-1">
              {[
                { id: "all",    label: `All · ${items.length}` },
                { id: "you",    label: `Needs you · ${needsYouCount}` },
                { id: "team",   label: `Waiting on teammates · ${teamCount}` },
                { id: "history",label: "History" },
              ].map(({ id, label }) => (
                <button key={id} type="button" onClick={() => setViewTab(id)}
                  className={cn("rounded-full px-3 py-1.5 font-body text-[11px] font-medium whitespace-nowrap transition-colors",
                    viewTab === id ? "bg-white text-v2-heading shadow-sm" : "text-v2-muted hover:text-v2-heading"
                  )}
                >{label}</button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                {[["all","All risk"],["low","Low"],["high","Sensitive"]].map(([id, label]) => (
                  <button key={id} type="button" onClick={() => setRiskFilter(id)}
                    className={cn("rounded-full border px-3 py-1.5 font-body text-[11px] font-medium transition-colors",
                      riskFilter === id ? "border-gray-900 bg-gray-900 text-white" : "border-v2-border bg-white text-v2-muted hover:text-v2-heading"
                    )}
                  >{label}</button>
                ))}
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
                <input
                  type="text" placeholder="Search queue…" value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-44 rounded-full border border-v2-border bg-white py-1.5 pl-7 pr-3 font-body text-[11px] outline-none focus:border-v2-purple"
                />
              </div>
            </div>
          </div>

          {/* Bulk bar */}
          {selected.size > 0 && (
            <div className="flex items-center justify-between rounded-xl bg-[#EEEDFE] px-4 py-2.5">
              <span className="font-body text-[12px] text-[#3C3489]">{selected.size} selected</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setSelected(new Set())} className="rounded-full border border-[#AFA9EC] bg-white px-3 py-1 font-body text-[11px] font-medium text-v2-heading hover:bg-gray-50 transition-colors">Clear</button>
                <button type="button" onClick={bulkApprove} className="rounded-full bg-v2-green px-3 py-1 font-body text-[11px] font-medium text-white hover:opacity-90 transition-opacity">Approve selected →</button>
              </div>
            </div>
          )}

          {/* Queue list */}
          {viewTab !== "history" && (
            <div className="space-y-2.5">
              {loading && (
                <div className="rounded-2xl border border-v2-border bg-white p-12 text-center font-body text-[12px] text-v2-muted">
                  Loading approval queue…
                </div>
              )}
              {!loading && visible.length === 0 && (
                <div className="rounded-2xl border border-v2-border bg-white p-12 text-center">
                  <div className="text-[32px]">✅</div>
                  <div className="mt-2 font-heading text-[14px] font-medium text-v2-heading">Queue clear</div>
                  <div className="mt-1 font-body text-[12px] text-v2-muted">Nothing waiting on you right now — agents will keep working and escalate here if that changes.</div>
                </div>
              )}
              {!loading && visible.map((item) => (
                <div key={item.id} className={cn("rounded-2xl border bg-white p-3.5 flex gap-3 items-start transition-shadow hover:shadow-sm", item.isFyi ? "opacity-80 border-v2-border" : "border-v2-border")}>
                  {/* Checkbox */}
                  {!item.isFyi ? (
                    <button type="button" onClick={() => toggleSelect(item.id)}
                      className={cn("mt-0.5 h-4 w-4 shrink-0 rounded-[5px] border-[1.5px] flex items-center justify-center transition-colors",
                        selected.has(item.id) ? "border-v2-purple bg-v2-purple" : "border-gray-300"
                      )}
                    >
                      {selected.has(item.id) && <CheckCircle2 className="h-2.5 w-2.5 text-white" />}
                    </button>
                  ) : <div className="mt-0.5 h-4 w-4 shrink-0" />}

                  <Av
                    initials={item.agent.initials}
                    bg={item.agent.bg}
                    color={item.agent.color}
                    size={32}
                    onClick={AGENT_WORKSPACE_PAGE[item.agentName] ? () => onNavigate?.(AGENT_WORKSPACE_PAGE[item.agentName]) : undefined}
                    title={AGENT_WORKSPACE_PAGE[item.agentName] ? `Open ${item.agentName} workspace` : undefined}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="font-body text-[13px] font-medium text-v2-heading">{item.title}</span>
                      <span className="rounded-[6px] px-2 py-0.5 font-body text-[9px] font-medium" style={{ background: item.riskBg, color: item.riskColor }}>{item.riskLabel}</span>
                    </div>
                    <p className="mb-2 font-body text-[11px] leading-relaxed text-v2-muted">{item.desc}</p>
                    <div className="flex flex-wrap items-center gap-3 font-body text-[10px] text-gray-400">
                      <span>🤖 <strong className="text-gray-600">{item.agentName}</strong></span>
                      <span>👤 Waiting on <strong className="text-gray-600">{item.waitingOn}</strong></span>
                      <span>{item.time}</span>
                      {AGENT_WORKSPACE_PAGE[item.agentName] && (
                        <button
                          type="button"
                          onClick={() => onNavigate?.(AGENT_WORKSPACE_PAGE[item.agentName])}
                          className="text-v2-purple hover:underline"
                        >
                          Open {item.agentName} workspace →
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button type="button" onClick={() => reviewItem(item)} className="rounded-[9px] border border-gray-200 bg-white px-3 py-1.5 font-body text-[11px] font-medium text-v2-heading hover:bg-gray-50 transition-colors">
                      Review
                    </button>
                    {busyIds.has(item.id) ? (
                      <span className="font-body text-[11px] text-v2-muted">Working…</span>
                    ) : item.isFyi ? (
                      <span className="rounded-[9px] bg-gray-100 px-3 py-1.5 font-body text-[11px] font-medium text-v2-muted whitespace-nowrap">Waiting on a teammate</span>
                    ) : (
                      <>
                        <button type="button" onClick={() => resolve(item.id, "declined", "Declined")} className="rounded-[9px] border border-gray-200 bg-white px-3 py-1.5 font-body text-[11px] font-medium text-v2-heading hover:bg-gray-50 transition-colors">
                          Decline
                        </button>
                        <button type="button" onClick={() => resolve(item.id, "approved", "Approved")} className="rounded-[9px] bg-v2-green px-3 py-1.5 font-body text-[11px] font-medium text-white hover:opacity-90 transition-opacity whitespace-nowrap">
                          Approve →
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* History */}
          {viewTab === "history" && (
            <div className="space-y-2.5">
              <div className="text-right">
                <button type="button" onClick={() => onNavigate?.("audit-trail")} className="font-body text-[11px] text-v2-blue hover:underline">Open full Audit Trail →</button>
              </div>
              {loading && (
                <div className="rounded-2xl border border-v2-border bg-white p-12 text-center font-body text-[12px] text-v2-muted">Loading history…</div>
              )}
              {!loading && history.length === 0 && (
                <div className="rounded-2xl border border-v2-border bg-white p-12 text-center">
                  <div className="font-heading text-[14px] font-medium text-v2-heading">No history yet</div>
                  <div className="mt-1 font-body text-[12px] text-v2-muted">Resolved and autonomous actions will show up here as agents start doing real work.</div>
                </div>
              )}
              {history.map((h) => (
                <div key={h.id} className="flex items-center gap-3 rounded-2xl border border-v2-border bg-white p-3.5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-body text-[11px]" style={{ background: h.iconBg }}>{h.icon}</div>
                  <div className="min-w-0 flex-1">
                    <div className="font-body text-[12px] font-medium text-v2-heading">{h.title}</div>
                    <div className="font-body text-[10px] text-v2-muted">{h.sub}</div>
                  </div>
                  <span className="shrink-0 rounded-lg px-2.5 py-1 font-body text-[9px] font-medium" style={{ background: h.statusBg, color: h.statusColor }}>{h.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex w-[320px] shrink-0 flex-col gap-3 overflow-y-auto border-l border-v2-border bg-white p-4">

        {/* Queue stats */}
        <div className="rounded-2xl bg-v2-page p-3">
          <div className="mb-2 font-heading text-[11px] font-semibold text-v2-heading">Queue stats</div>
          {[
            { k: "Total pending",        v: `${items.length} items` },
            { k: "Needs you",            v: `${needsYouCount} items` },
            { k: "Waiting on teammates", v: `${teamCount} item${teamCount === 1 ? "" : "s"}` },
            { k: "Avg wait time",        v: avgWaitLabel },
          ].map((r) => (
            <div key={r.k} className="flex items-center justify-between border-b border-gray-100 py-1 last:border-b-0">
              <span className="font-body text-[10px] text-v2-muted">{r.k}</span>
              <span className="font-body text-[10px] font-medium text-v2-heading">{r.v}</span>
            </div>
          ))}
        </div>

        {/* Agent breakdown */}
        <div className="rounded-2xl bg-v2-page p-3">
          <div className="mb-2 font-heading text-[11px] font-semibold text-v2-heading">By agent</div>
          {agentBreakdown.length === 0 && (
            <div className="py-1.5 font-body text-[10px] text-v2-muted">Nothing pending right now.</div>
          )}
          {agentBreakdown.map((a) => (
            <div key={a.name} className="flex items-center gap-2 border-b border-gray-100 py-1.5 last:border-b-0">
              <div className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] font-body text-[8px] font-semibold" style={{ background: a.bg, color: a.color }}>{a.initials}</div>
              <span className="flex-1 font-body text-[10px] text-gray-600">{a.name}</span>
              <span className="font-body text-[10px] font-medium text-v2-heading">{a.count} item{a.count === 1 ? "" : "s"}</span>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="rounded-2xl bg-v2-page p-3">
          <div className="mb-2 font-heading text-[11px] font-semibold text-v2-heading">Risk legend</div>
          {[
            { dot: "#6b7280", dotBg: "#f3f4f6", label: "Low risk",       desc: "Safe to approve without reading everything." },
            { dot: "#791F1F", dotBg: "#FCEBEB", label: "Sensitive",      desc: "Touches money, contracts, or external sends — always read first." },
            { dot: "#633806", dotBg: "#f3f4f6", label: "FYI only",       desc: "Routed to a teammate. You can nudge; nothing requires your approval." },
          ].map((r) => (
            <div key={r.label} className="flex items-start gap-2 py-1.5">
              <div className="mt-1 h-2 w-2 shrink-0 rounded-[3px]" style={{ background: r.dotBg, border: `1px solid ${r.dot}` }} />
              <div>
                <span className="font-body text-[10px] font-medium text-v2-heading">{r.label} </span>
                <span className="font-body text-[10px] text-v2-muted">{r.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Toast msg={toast} />
    </div>
  );
}
