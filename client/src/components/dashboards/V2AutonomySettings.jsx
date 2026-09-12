/**
 * V2AutonomySettings — per-agent autonomy controls
 * Each agent card expands to show permission toggles (Autonomous / Ask first)
 * Locked permissions (money, contracts, external sends) cannot be changed.
 *
 * Real data as of docs/ai-agent-roadmap.md Phase 0: reads Agent + ActionType
 * (merged with any AutonomySetting override) via agentOrchestrationApi.
 * `adjustable: false` action types are genuinely locked — the toggle is
 * disabled client-side AND the server rejects the PATCH with a 403, so this
 * can't be bypassed by editing the DOM. No real agents exist yet in this
 * environment, so an empty list here is the correct, honest Phase 0 state.
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { cn } from "../ui/utils";
import { ChevronDown } from "lucide-react";
import { useOfficeStore } from "../../state/useOfficeStore";
import { getAgents, getAutonomySettings, updateAutonomySetting } from "../../utils/api/agentOrchestrationApi";
import { paletteForAgent, initialsForAgent, formatEventTime } from "../../utils/agentDisplay";

/* ── Toast ─────────────────────────────────────────────────────────────────── */
function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-gray-900 px-5 py-2.5 font-body text-[12px] font-medium text-white shadow-lg">
      {msg}
    </div>
  );
}

function descriptionFor(actionType) {
  if (actionType.riskCategory === "sensitive_locked") return "Always requires your approval — this can't be made autonomous.";
  if (actionType.riskCategory === "read_only") return "Read-only — no side effects, so this always runs freely.";
  return "Reversible — you decide whether this runs on its own or waits for you.";
}

function summaryFor(types) {
  if (types.length === 0) return { label: "No actions yet", bg: "#f3f4f6", color: "#6b7280" };
  const autoCount = types.filter((t) => t.effectiveMode === "autonomous").length;
  if (autoCount === types.length) return { label: "Fully autonomous", bg: "#EAF3DE", color: "#27500A" };
  if (autoCount === 0) return { label: "Ask first only", bg: "#FCF7EC", color: "#633806" };
  return { label: "Mixed", bg: "#FAEEDA", color: "#633806" };
}

/* ── Main ────────────────────────────────────────────────────────────────── */
export default function V2AutonomySettings({ user, onBack, onNavigate }) {
  const founderId = useOfficeStore((s) => s.founderId);
  const loadWorkspace = useOfficeStore((s) => s.loadWorkspace);
  const resolvedFounderId = founderId || String(user?._id ?? user?.id ?? "");

  const [agents, setAgents] = useState([]);
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(new Set());
  const [savingId, setSavingId] = useState(null);
  const [paused, setPaused] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2400); };

  useEffect(() => { if (user) loadWorkspace(user); }, [user, loadWorkspace]);

  useEffect(() => {
    if (!resolvedFounderId) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([getAgents(resolvedFounderId), getAutonomySettings(resolvedFounderId)])
      .then(([agentRows, settingRows]) => {
        if (cancelled) return;
        setAgents(agentRows || []);
        setSettings(settingRows || []);
        setOpen(new Set((agentRows || []).slice(0, 1).map((a) => a.id)));
        setError("");
      })
      .catch((err) => { if (!cancelled) setError(err?.message || "Could not load autonomy settings."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [resolvedFounderId]);

  const grouped = useMemo(() => {
    const byAgent = new Map();
    agents.forEach((a) => byAgent.set(a.id, { agent: a, types: [] }));
    settings.forEach((t) => {
      const agentId = t.agentId?.id;
      if (!agentId) return;
      if (!byAgent.has(agentId)) byAgent.set(agentId, { agent: t.agentId, types: [] });
      byAgent.get(agentId).types.push(t);
    });
    return Array.from(byAgent.values());
  }, [agents, settings]);

  const recentChanges = useMemo(() => (
    settings
      .filter((t) => t.settingUpdatedAt)
      .sort((a, b) => new Date(b.settingUpdatedAt) - new Date(a.settingUpdatedAt))
      .slice(0, 5)
      .map((t) => ({
        text: `${t.agentId?.name || "Agent"} · ${t.label} → ${t.effectiveMode === "autonomous" ? "Autonomous" : "Ask first"}`,
        when: formatEventTime(t.settingUpdatedAt),
      }))
  ), [settings]);

  const toggleCard = (id) => setOpen((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const setMode = useCallback(async (actionType, mode) => {
    if (!actionType.adjustable || actionType.effectiveMode === mode) return;
    setSavingId(actionType.id);
    try {
      const updated = await updateAutonomySetting(resolvedFounderId, actionType.id, mode);
      setSettings((prev) => prev.map((t) => (t.id === actionType.id ? { ...t, effectiveMode: mode, settingUpdatedAt: updated?.updatedAt || new Date().toISOString() } : t)));
      showToast("Setting updated");
    } catch (err) {
      showToast(err?.message || "Could not update that setting.");
    } finally {
      setSavingId(null);
    }
  }, [resolvedFounderId]);

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
            <span className="font-body text-[13px] font-medium text-v2-heading">Autonomy Settings</span>
            <span className="text-gray-300">·</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF3DE] px-2.5 py-1 font-body text-[11px] font-medium text-[#27500A]">
              <span className="h-[5px] w-[5px] rounded-full bg-[#1D9E75]" />{agents.length} agent{agents.length === 1 ? "" : "s"} configured
            </span>
          </div>
          <button type="button" onClick={onBack} className="flex items-center gap-1.5 rounded-full border border-v2-border bg-white px-3 py-1.5 font-body text-[12px] font-medium text-v2-heading hover:bg-gray-50 transition-colors">
            Agent Workroom
          </button>
        </div>

        <div className="space-y-3 p-5">

          {error && (
            <div className="rounded-2xl border border-[#791F1F]/20 bg-[#FCEBEB] p-3 font-body text-[11px] text-[#791F1F]">{error}</div>
          )}

          {/* Intro */}
          <div className="rounded-2xl border border-v2-border bg-white p-4">
            <div className="mb-1 font-heading text-[13px] font-semibold text-v2-heading">Who decides what</div>
            <p className="font-body text-[11px] leading-relaxed text-v2-muted">
              For each agent, choose what it can do on its own versus what it hands to you. Some actions — anything touching money, contracts, or an outward-facing message — are locked to "Ask first" for every startup on StartupVerse and can't be changed here.
            </p>
          </div>

          {loading && (
            <div className="rounded-2xl border border-v2-border bg-white p-12 text-center font-body text-[12px] text-v2-muted">Loading agents…</div>
          )}

          {!loading && grouped.length === 0 && (
            <div className="rounded-2xl border border-v2-border bg-white p-12 text-center">
              <div className="font-heading text-[14px] font-medium text-v2-heading">No agents yet</div>
              <div className="mt-1 font-body text-[12px] text-v2-muted">Autonomy controls will appear here the moment a real agent exists — see docs/ai-agent-roadmap.md Phase 1.</div>
            </div>
          )}

          {/* Agent cards */}
          {!loading && grouped.map(({ agent, types }) => {
            const palette = paletteForAgent(agent.id || agent.agentKey || agent.name);
            const summary = summaryFor(types);
            return (
              <div key={agent.id} className="overflow-hidden rounded-2xl border border-v2-border bg-white">
                <button
                  type="button"
                  onClick={() => toggleCard(agent.id)}
                  className="flex w-full items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] font-body text-[11px] font-semibold" style={{ background: palette.bg, color: palette.color }}>
                    {initialsForAgent(agent.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-body text-[12px] font-medium text-v2-heading">{agent.name}</div>
                    <div className="font-body text-[10px] text-v2-muted">{agent.role || "AI agent"}</div>
                  </div>
                  <span className="shrink-0 rounded-lg px-2.5 py-1 font-body text-[10px] font-medium" style={{ background: summary.bg, color: summary.color }}>
                    {summary.label}
                  </span>
                  <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform", open.has(agent.id) && "rotate-180")} />
                </button>

                {open.has(agent.id) && (
                  <div className="border-t border-gray-100 px-4 pb-4">
                    {types.length === 0 && (
                      <div className="py-3 font-body text-[11px] text-v2-muted">No configurable actions for this agent yet.</div>
                    )}
                    {types.map((t) => {
                      const locked = !t.adjustable;
                      const lockGreen = t.riskCategory === "read_only";
                      const lockLabel = locked ? (lockGreen ? "✓ Always on" : "🔒 Locked") : null;
                      const value = t.effectiveMode === "autonomous" ? "auto" : "ask";
                      return (
                        <div key={t.id} className="flex items-center justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 font-body text-[12px] font-medium text-v2-heading">
                              {t.label}
                              {lockLabel && (
                                <span className={cn("inline-flex items-center gap-1 rounded-[5px] px-2 py-0.5 font-body text-[9px]", lockGreen ? "bg-[#EAF3DE] text-[#27500A]" : "bg-[#FCEBEB] text-[#791F1F]")}>
                                  {lockLabel}
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 font-body text-[10px] leading-snug text-v2-muted">{descriptionFor(t)}</div>
                          </div>
                          <div className={cn("flex shrink-0 items-center gap-0.5 rounded-full bg-gray-100 p-0.5", (locked || savingId === t.id) && "opacity-60 pointer-events-none")}>
                            {[["auto","Autonomous"],["ask","Ask first"]].map(([val, label]) => (
                              <button
                                key={val}
                                type="button"
                                disabled={locked || savingId === t.id}
                                onClick={() => !locked && setMode(t, val === "auto" ? "autonomous" : "ask_first")}
                                className={cn(
                                  "rounded-full px-3 py-1.5 font-body text-[10px] font-medium whitespace-nowrap transition-colors",
                                  value === val
                                    ? lockGreen ? "bg-[#1D9E75] text-white" : "bg-v2-purple text-white"
                                    : "text-v2-muted hover:text-v2-heading"
                                )}
                              >{label}</button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex w-[320px] shrink-0 flex-col gap-3 overflow-y-auto border-l border-v2-border bg-white p-4">

        {/* Pause all */}
        <div className="rounded-2xl bg-v2-page p-3">
          <div className="mb-1.5 font-heading text-[11px] font-semibold text-v2-heading">Pause everything</div>
          <div className="flex items-center justify-between">
            <span className="font-body text-[11px] text-v2-heading">{paused ? "Agents paused" : "All agents active"}</span>
            <button
              type="button"
              onClick={() => { setPaused((p) => !p); showToast(paused ? "Agents resumed" : "All agents paused"); }}
              className={cn("relative h-6 w-10 rounded-full transition-colors", paused ? "bg-gray-300" : "bg-[#1D9E75]")}
            >
              <div className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", paused ? "left-0.5" : "left-[18px]")} />
            </button>
          </div>
          <p className="mt-2 font-body text-[10px] leading-relaxed text-v2-muted">
            A per-session control, not yet backed by a real kill-switch endpoint — real agents don't exist yet to pause. Stops nothing today; this becomes a real guard alongside the first live agent.
          </p>
        </div>

        {/* Legend */}
        <div className="rounded-2xl bg-v2-page p-3">
          <div className="mb-2 font-heading text-[11px] font-semibold text-v2-heading">Setting guide</div>
          {[
            { dot: "#1D9E75", label: "Autonomous", desc: "Agent completes this without asking — you see it in the Audit Trail afterwards." },
            { dot: "#534AB7", label: "Ask first",  desc: "Agent prepares it fully then puts it in your Approval Queue before doing anything." },
            { dot: "#791F1F", label: "Locked",     desc: "Platform-level rule. Can't be overridden. Protects you from irreversible actions." },
          ].map((r) => (
            <div key={r.label} className="flex items-start gap-2 py-1.5">
              <div className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: r.dot }} />
              <div>
                <span className="font-body text-[10px] font-semibold text-v2-heading">{r.label} </span>
                <span className="font-body text-[10px] text-v2-muted">{r.desc}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Recent changes */}
        <div className="rounded-2xl bg-v2-page p-3">
          <div className="mb-2 font-heading text-[11px] font-semibold text-v2-heading">Recent changes</div>
          {recentChanges.length === 0 && (
            <div className="py-1.5 font-body text-[10px] text-v2-muted">No autonomy changes yet.</div>
          )}
          {recentChanges.map((c, i) => (
            <div key={i} className="flex items-start gap-2 border-b border-gray-100 py-1.5 last:border-b-0">
              <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-v2-purple" />
              <div>
                <div className="font-body text-[10px] text-v2-heading">{c.text}</div>
                <div className="font-body text-[9px] text-v2-muted">{c.when}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Toast msg={toast} />
    </div>
  );
}
