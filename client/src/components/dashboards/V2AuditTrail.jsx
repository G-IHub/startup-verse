/**
 * V2AuditTrail — searchable, filterable log of every agent + human action
 *
 * Real data as of docs/ai-agent-roadmap.md Phase 0: reads every AgentEvent
 * (any status, not just pending) via agentOrchestrationApi, live-updated over
 * Socket.IO. No real agents exist yet in this environment, so an empty log
 * here is the correct, honest Phase 0 state — it fills in the moment a real
 * agent starts acting.
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { cn } from "../ui/utils";
import { Search } from "lucide-react";
import { useOfficeStore } from "../../state/useOfficeStore";
import { getAgentEvents } from "../../utils/api/agentOrchestrationApi";
import { subscribeToAgentEvents } from "../../utils/socketIoRealtime";
import { paletteForAgent, initialsForAgent, formatEventTime } from "../../utils/agentDisplay";

const STATUS_META = {
  pending_approval: { label: "Awaiting you", bg: "#FCEBEB", color: "#791F1F", filterKey: "awaiting" },
  autonomous_completed: { label: "Autonomous", bg: "#f3f4f6", color: "#6b7280", filterKey: "auto" },
  approved: { label: "Approved", bg: "#EAF3DE", color: "#27500A", filterKey: "approved" },
  declined: { label: "Declined", bg: "#FCEBEB", color: "#791F1F", filterKey: "declined" },
  human_completed: { label: "Completed", bg: "#EAF3DE", color: "#27500A", filterKey: "human" },
  failed: { label: "Failed", bg: "#FCEBEB", color: "#791F1F", filterKey: "failed" },
};

const STATUS_FILTERS = [
  ["all", "All"],
  ["awaiting", "Awaiting"],
  ["auto", "Autonomous"],
  ["approved", "Approved"],
  ["declined", "Declined"],
  ["human", "Completed"],
  ["failed", "Failed"],
];

function toLogEntry(event, currentUserId) {
  const actionType = event.actionTypeId || {};
  const agent = actionType.agentId || {};
  const isAgent = event.actorType === "agent";
  const isYou = String(event.actorId) === String(currentUserId);
  const agentName = agent.name || "Unknown agent";
  const name = isAgent ? agentName : isYou ? "You" : "A teammate";
  const actorKey = isAgent ? `agent:${agent.id || agentName}` : `human:${event.actorId || "unknown"}`;
  const palette = paletteForAgent(isAgent ? (agent.id || agentName) : actorKey);
  const meta = STATUS_META[event.status] || { label: event.status, bg: "#f3f4f6", color: "#6b7280", filterKey: "other" };
  const createdAt = new Date(event.createdAt);
  const now = new Date();

  return {
    id: event.id,
    createdAt: event.createdAt,
    time: formatEventTime(event.createdAt),
    isToday: createdAt.toDateString() === now.toDateString(),
    isThisWeek: now - createdAt < 7 * 24 * 60 * 60 * 1000,
    actorKey,
    actorType: event.actorType,
    av: { initials: isAgent ? initialsForAgent(agentName) : "👤", bg: palette.bg, color: palette.color },
    name,
    desc: (actionType.label
      ? `${actionType.label}${event.targetType ? ` · ${event.targetType}${event.targetId ? ` (${event.targetId})` : ""}` : ""}`
      : (event.targetType || "Agent action")) + (event.status === "failed" && event.result?.error ? ` — ${event.result.error}` : ""),
    status: event.status,
    statusLabel: meta.label,
    statusBg: meta.bg,
    statusColor: meta.color,
    filterKey: meta.filterKey,
    showLink: event.status === "pending_approval",
  };
}

/* ── Toast ─────────────────────────────────────────────────────────────────── */
function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-gray-900 px-5 py-2.5 font-body text-[12px] font-medium text-white shadow-lg">
      {msg}
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────────────────── */
export default function V2AuditTrail({ user, onBack, onNavigate }) {
  const founderId = useOfficeStore((s) => s.founderId);
  const loadWorkspace = useOfficeStore((s) => s.loadWorkspace);
  const resolvedFounderId = founderId || String(user?._id ?? user?.id ?? "");
  const currentUserId = String(user?._id ?? user?.id ?? resolvedFounderId ?? "");

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [range, setRange] = useState("all");
  const [actor, setActor] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [actorOpen, setActorOpen] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2400); };

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
      .catch((err) => { if (!cancelled) setError(err?.message || "Could not load the audit trail."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [resolvedFounderId]);

  useEffect(() => {
    if (!resolvedFounderId) return undefined;
    return subscribeToAgentEvents(resolvedFounderId, upsertEvent);
  }, [resolvedFounderId, upsertEvent]);

  const entries = useMemo(() => events.map((e) => toLogEntry(e, currentUserId)), [events, currentUserId]);

  const actorOptions = useMemo(() => {
    const map = new Map();
    entries.forEach((e) => {
      if (!map.has(e.actorKey)) map.set(e.actorKey, { id: e.actorKey, label: `${e.actorType === "agent" ? "🤖" : "👤"} ${e.name}` });
    });
    return [{ id: "all", label: "All actors" }, ...Array.from(map.values())];
  }, [entries]);

  const filtered = useMemo(() => {
    let list = entries;
    if (range === "today") list = list.filter((e) => e.isToday);
    if (range === "week") list = list.filter((e) => e.isThisWeek);
    if (actor !== "all") list = list.filter((e) => e.actorKey === actor);
    if (status !== "all") list = list.filter((e) => e.filterKey === status);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((e) => (e.name + " " + e.desc).toLowerCase().includes(q));
    }
    return list;
  }, [entries, range, actor, status, search]);

  const todayEntries = filtered.filter((e) => e.isToday);
  const prevEntries = filtered.filter((e) => !e.isToday);
  const actorLabel = actorOptions.find((o) => o.id === actor)?.label ?? "All";

  const weekEntries = useMemo(() => entries.filter((e) => e.isThisWeek), [entries]);
  const weekStats = useMemo(() => ({
    total: weekEntries.length,
    autonomous: weekEntries.filter((e) => e.filterKey === "auto").length,
    escalated: weekEntries.filter((e) => ["awaiting", "approved", "declined"].includes(e.filterKey)).length,
    routedToTeammates: weekEntries.filter((e) => e.actorType === "human" && e.name === "A teammate").length,
    declined: weekEntries.filter((e) => e.filterKey === "declined").length,
  }), [weekEntries]);

  const agentBreakdown = useMemo(() => {
    const byAgent = new Map();
    weekEntries.filter((e) => e.actorType === "agent").forEach((e) => {
      const entry = byAgent.get(e.name) || { ...e.av, name: e.name, count: 0 };
      entry.count += 1;
      byAgent.set(e.name, entry);
    });
    return Array.from(byAgent.values()).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [weekEntries]);

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
            <span className="font-body text-[13px] font-medium text-v2-heading">Audit Trail</span>
            <span className="text-gray-300">·</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF3DE] px-2.5 py-1 font-body text-[11px] font-medium text-[#27500A]">
              <span className="h-[5px] w-[5px] rounded-full bg-[#1D9E75]" />{filtered.length} entries
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={onBack} className="flex items-center gap-1.5 rounded-full border border-v2-border bg-white px-3 py-1.5 font-body text-[12px] font-medium text-v2-heading hover:bg-gray-50 transition-colors">
              Agent Workroom
            </button>
            <button type="button" onClick={() => showToast("CSV export isn't wired up yet — it's next on the list once there's real volume to export.")} className="flex items-center gap-1.5 rounded-full bg-v2-purple px-3 py-1.5 font-body text-[12px] font-medium text-white hover:opacity-90 transition-opacity">
              Export CSV →
            </button>
          </div>
        </div>

        <div className="space-y-3 p-5">

          {error && (
            <div className="rounded-2xl border border-[#791F1F]/20 bg-[#FCEBEB] p-3 font-body text-[11px] text-[#791F1F]">{error}</div>
          )}

          {/* Filter bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">

              {/* Date range */}
              <div className="flex items-center gap-0.5 rounded-full bg-gray-100 p-0.5">
                {[["all","All time"],["week","This week"],["today","Today"]].map(([id, label]) => (
                  <button key={id} type="button" onClick={() => setRange(id)}
                    className={cn("rounded-full px-3 py-1.5 font-body text-[11px] font-medium transition-colors",
                      range === id ? "bg-white text-v2-heading shadow-sm" : "text-v2-muted hover:text-v2-heading"
                    )}
                  >{label}</button>
                ))}
              </div>

              {/* Actor dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActorOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full border border-v2-border bg-white px-3 py-1.5 font-body text-[11px] font-medium text-v2-heading hover:bg-gray-50 transition-colors"
                >
                  Actor: <span className="text-v2-muted">{actor === "all" ? "All" : actorLabel.replace(/^[🤖👤]\s/,"")}</span>
                  <svg width="9" height="6" viewBox="0 0 9 6" fill="none"><path d="M1 1l3.5 3.5L8 1" stroke="#6b7280" strokeWidth="1.3"/></svg>
                </button>
                {actorOpen && (
                  <div className="absolute left-0 top-9 z-20 max-h-64 w-52 overflow-y-auto rounded-xl border border-v2-border bg-white py-1.5 shadow-lg">
                    {actorOptions.map((opt) => (
                      <button key={opt.id} type="button"
                        onClick={() => { setActor(opt.id); setActorOpen(false); }}
                        className={cn("flex w-full items-center gap-2 px-3 py-1.5 font-body text-[11px] text-left hover:bg-gray-50 transition-colors",
                          actor === opt.id ? "bg-[#EEEDFE] font-medium text-v2-purple" : "text-v2-heading"
                        )}
                      >{opt.label}</button>
                    ))}
                  </div>
                )}
              </div>

              {/* Status filters */}
              <div className="flex gap-1.5">
                {STATUS_FILTERS.map(([id, label]) => (
                  <button key={id} type="button" onClick={() => setStatus(id)}
                    className={cn("rounded-full border px-3 py-1.5 font-body text-[11px] font-medium transition-colors",
                      status === id ? "border-gray-900 bg-gray-900 text-white" : "border-v2-border bg-white text-v2-muted hover:text-v2-heading"
                    )}
                  >{label}</button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
              <input
                type="text" placeholder="Search log…" value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-44 rounded-full border border-v2-border bg-white py-1.5 pl-7 pr-3 font-body text-[11px] outline-none focus:border-v2-purple"
              />
            </div>
          </div>

          {loading && (
            <div className="rounded-2xl border border-v2-border bg-white p-12 text-center font-body text-[12px] text-v2-muted">Loading audit trail…</div>
          )}

          {/* Today */}
          {!loading && todayEntries.length > 0 && (
            <>
              <div className="flex items-center gap-3">
                <span className="shrink-0 font-body text-[10px] font-semibold uppercase tracking-wider text-v2-muted">Today</span>
                <div className="h-px flex-1 bg-v2-border" />
              </div>
              <div className="overflow-hidden rounded-2xl border border-v2-border bg-white">
                {todayEntries.map((entry, i) => (
                  <LogRow key={entry.id} entry={entry} last={i === todayEntries.length - 1} onNavigate={onNavigate} />
                ))}
              </div>
            </>
          )}

          {/* Earlier */}
          {!loading && prevEntries.length > 0 && (
            <>
              <div className="flex items-center gap-3">
                <span className="shrink-0 font-body text-[10px] font-semibold uppercase tracking-wider text-v2-muted">Earlier</span>
                <div className="h-px flex-1 bg-v2-border" />
              </div>
              <div className="overflow-hidden rounded-2xl border border-v2-border bg-white">
                {prevEntries.map((entry, i) => (
                  <LogRow key={entry.id} entry={entry} last={i === prevEntries.length - 1} onNavigate={onNavigate} />
                ))}
              </div>
            </>
          )}

          {!loading && filtered.length === 0 && (
            <div className="rounded-2xl border border-v2-border bg-white p-12 text-center">
              <div className="font-heading text-[14px] font-medium text-v2-heading">
                {entries.length === 0 ? "No activity logged yet" : "No entries match your filters"}
              </div>
              <div className="mt-1 font-body text-[12px] text-v2-muted">
                {entries.length === 0
                  ? "Every agent and human action will show up here — real agents haven't started acting yet."
                  : "Try changing the date range or removing filters."}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex w-[320px] shrink-0 flex-col gap-3 overflow-y-auto border-l border-v2-border bg-white p-4">

        {/* Summary stats */}
        <div className="rounded-2xl bg-v2-page p-3">
          <div className="mb-2 font-heading text-[11px] font-semibold text-v2-heading">This week</div>
          {[
            { k: "Total actions",       v: `${weekStats.total} entries` },
            { k: "Autonomous",          v: `${weekStats.autonomous} actions` },
            { k: "Escalated to you",    v: `${weekStats.escalated} decisions` },
            { k: "Routed to teammates", v: `${weekStats.routedToTeammates} items` },
            { k: "Declined",            v: `${weekStats.declined} items` },
          ].map((r) => (
            <div key={r.k} className="flex items-center justify-between border-b border-gray-100 py-1 last:border-b-0">
              <span className="font-body text-[10px] text-v2-muted">{r.k}</span>
              <span className="font-body text-[10px] font-medium text-v2-heading">{r.v}</span>
            </div>
          ))}
        </div>

        {/* By agent */}
        <div className="rounded-2xl bg-v2-page p-3">
          <div className="mb-2 font-heading text-[11px] font-semibold text-v2-heading">Actions by agent</div>
          {agentBreakdown.length === 0 && (
            <div className="py-1.5 font-body text-[10px] text-v2-muted">No agent activity this week.</div>
          )}
          {agentBreakdown.map((a) => (
            <div key={a.name} className="flex items-center gap-2 border-b border-gray-100 py-1.5 last:border-b-0">
              <div className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] font-body text-[8px] font-semibold" style={{ background: a.bg, color: a.color }}>{a.initials}</div>
              <span className="flex-1 font-body text-[10px] text-gray-600">{a.name}</span>
              <span className="font-body text-[10px] font-medium text-v2-heading">{a.count}</span>
            </div>
          ))}
        </div>

        {/* Why this log matters */}
        <div className="rounded-2xl bg-v2-page p-3">
          <div className="mb-1.5 font-heading text-[11px] font-semibold text-v2-heading">Why this log matters</div>
          <p className="font-body text-[10px] leading-relaxed text-v2-muted">
            Every entry captures the agent or human who acted, the data they used, and what they decided. Nothing runs silently — you have a complete record you can search, filter, and (soon) export.
          </p>
        </div>
      </div>

      <Toast msg={toast} />
    </div>
  );
}

/* ── Log row sub-component ─────────────────────────────────────────────────── */
function LogRow({ entry, last, onNavigate }) {
  return (
    <div className={cn("flex items-center gap-3 px-4 py-3 transition-colors", !last && "border-b border-gray-100", entry.showLink && "hover:bg-gray-50")}>
      <span className="w-[52px] shrink-0 font-body text-[10px] text-v2-muted">{entry.time}</span>
      <div className="relative shrink-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-[8px] font-body text-[9px] font-semibold" style={{ background: entry.av.bg, color: entry.av.color }}>{entry.av.initials}</div>
        <div className={cn("absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full border border-white text-[6px]", entry.actorType === "agent" ? "bg-[#534AB7] text-white" : "bg-[#1B4FD8] text-white")}>
          {entry.actorType === "agent" ? "⚡" : "👤"}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-body text-[11px] font-medium text-v2-heading">{entry.name}</div>
        <div className="font-body text-[11px] text-v2-muted">{entry.desc}</div>
      </div>
      <span className="shrink-0 rounded-lg px-2 py-0.5 font-body text-[9px] font-medium whitespace-nowrap" style={{ background: entry.statusBg, color: entry.statusColor }}>{entry.statusLabel}</span>
      {entry.showLink && (
        <button type="button" onClick={() => onNavigate?.("approval-queue")} className="shrink-0 font-body text-[10px] text-v2-blue hover:underline">
          Approval Queue →
        </button>
      )}
    </div>
  );
}
