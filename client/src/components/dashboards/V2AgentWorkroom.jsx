/**
 * V2AgentWorkroom — AI Staff landing page
 * Single sidebar entry; Approval Queue, Autonomy Settings, Audit Trail,
 * and individual agent pages are accessed via buttons/links inside this view.
 */

import React, { useState, useCallback, useEffect } from "react";
import { cn } from "../ui/utils";
import {
  Zap, Users, Clock, CheckCircle2, AlertCircle, ChevronRight,
  Pause, Settings, ArrowRight, X, ExternalLink, FileText,
  TrendingUp, Shield, Activity,
} from "lucide-react";
import { useOfficeStore } from "../../state/useOfficeStore";
import { getAgents, getActionTypes, getAgentEvents, resolveAgentEvent } from "../../utils/api/agentOrchestrationApi";
import { getFounderStartupSafe } from "../../utils/api/founderApi";
import { getStartupTeamMembers } from "../../utils/api/teamMemberApi";
import { formatEventTime } from "../../utils/agentDisplay";
import {
  buildRealFeed, buildRealApprovals, summarizeAgentStatus,
  buildRealDepMap, buildHeroStats, buildAutonomySummary, buildHumansInLoop,
} from "../../utils/agentFeed";

/* ─────────────────────────────────────────────
   Static mock data  (wire to API when ready)
───────────────────────────────────────────── */
const AGENTS = [
  { id: "pm",       initials: "PM",  name: "AI Product Manager",  bg: "#EEEDFE", color: "#534AB7", status: "working",  statusLabel: "Working · sprint plan" },
  { id: "mk",       initials: "MK",  name: "AI Marketing",        bg: "#EAF3DE", color: "#27500A", status: "idle",     statusLabel: "Idle · output delivered" },
  { id: "sa",       initials: "SA",  name: "AI Sales",            bg: "#E6F1FB", color: "#0C447C", status: "blocked",  statusLabel: "Blocked · needs approval" },
  { id: "dev",      initials: "DEV", name: "AI Developer",        bg: "#f3f4f6", color: "#6b7280", status: "blocked",  statusLabel: "Blocked · needs approval" },
  { id: "ga",       initials: "GA",  name: "AI Growth Analyst",   bg: "#E6F1FB", color: "#0C447C", status: "idle",     statusLabel: "Idle · waiting on data" },
];

/* ─────────────────────────────────────────────
   Tiny helpers
───────────────────────────────────────────── */
function Avatar({ initials, bg, color, size = 28, badge }) {
  return (
    <div className="relative shrink-0">
      <div
        className="flex items-center justify-center rounded-full font-body font-semibold"
        style={{ width: size, height: size, background: bg, color, fontSize: size * 0.33 }}
      >
        {initials}
      </div>
      {badge && (
        <div
          className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full border border-white"
          style={{ width: 13, height: 13, background: badge === "agent" ? "#534AB7" : "#1B4FD8", fontSize: 7 }}
        >
          {badge === "agent" ? "⚡" : "👤"}
        </div>
      )}
    </div>
  );
}

function Tag({ label, bg, color }) {
  return (
    <span className="rounded-[5px] px-1.5 py-0.5 font-body text-[9px] font-medium" style={{ background: bg, color }}>
      {label}
    </span>
  );
}

function StatusDot({ status }) {
  const colors = { working: "#1D9E75", idle: "#9ca3af", blocked: "#BA7517", clear: "#1D9E75", pending: "#BA7517" };
  return <div className="h-2 w-2 shrink-0 rounded-full" style={{ background: colors[status] || "#9ca3af" }} />;
}

/* ─────────────────────────────────────────────
   Modal
───────────────────────────────────────────── */
function Modal({ open, onClose, title, subtitle, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="max-h-[82vh] w-full max-w-[460px] overflow-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-gray-100 bg-white px-5 py-4">
          <div>
            <div className="font-heading text-[14px] font-semibold text-v2-heading">{title}</div>
            {subtitle && <div className="mt-0.5 font-body text-[11px] text-v2-muted">{subtitle}</div>}
          </div>
          <button type="button" onClick={onClose} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="px-5 py-4 font-body text-[12px] text-gray-600 leading-relaxed">{children}</div>
        {footer && <div className="sticky bottom-0 flex justify-end gap-2 border-t border-gray-100 bg-white px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

function ModalBtn({ children, variant = "default", onClick }) {
  const cls = {
    default: "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
    primary: "bg-v2-purple text-white hover:opacity-90",
    green: "bg-v2-green text-white hover:opacity-90",
    danger: "bg-red-700 text-white hover:opacity-90",
  };
  return (
    <button type="button" onClick={onClick} className={cn("rounded-xl px-4 py-2 font-body text-[12px] font-medium transition-opacity", cls[variant])}>
      {children}
    </button>
  );
}

/* ─────────────────────────────────────────────
   Toast
───────────────────────────────────────────── */
function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-gray-900 px-5 py-2.5 font-body text-[12px] font-medium text-white shadow-lg">
      {msg}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Overnight Summary Hero
───────────────────────────────────────────── */
function OvernightHero({ agentsPaused, stats }) {
  const { total, agentCount, autonomous, waiting } = stats;
  return (
    <div className="relative overflow-hidden rounded-2xl p-5" style={{ background: "linear-gradient(135deg,#3C3489,#1B4FD8)" }}>
      <div className="mb-1.5 font-body text-[11px]" style={{ color: "#c9c5f0" }}>Real activity · AI Product Manager and AI Developer</div>
      {total === 0 ? (
        <p className="font-body text-[15px] font-medium leading-relaxed text-white" style={{ maxWidth: 600 }}>
          No real activity yet — give AI Developer a task, or chat with AI Product Manager, to get your team started.
        </p>
      ) : (
        <p className="font-body text-[15px] font-medium leading-relaxed text-white" style={{ maxWidth: 600 }}>
          Your team has run <strong>{total} real action{total === 1 ? "" : "s"}</strong> across <strong>{agentCount} real agent{agentCount === 1 ? "" : "s"}</strong>.{" "}
          <strong>{autonomous} completed on {autonomous === 1 ? "its" : "their"} own.</strong>{" "}
          {waiting > 0 ? <strong>{waiting} {waiting === 1 ? "is" : "are"} waiting on you.</strong> : "Nothing is waiting on you right now."}
        </p>
      )}
      {total > 0 && (
        <div className="mt-4 flex flex-wrap gap-6">
          {[
            { val: String(total),      lbl: "real actions" },
            { val: String(agentCount), lbl: "real agents active" },
            { val: String(waiting),    lbl: "waiting in your queue" },
          ].map((s) => (
            <div key={s.lbl}>
              <div className="font-heading text-[22px] font-semibold text-white">{s.val}</div>
              <div className="font-body text-[10px]" style={{ color: "#c9c5f0" }}>{s.lbl}</div>
            </div>
          ))}
        </div>
      )}
      {agentsPaused && (
        <div className="absolute right-4 top-4 rounded-full bg-white/20 px-3 py-1 font-body text-[11px] font-medium text-white">
          ⏸ Agents paused
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Coordination Feed
───────────────────────────────────────────── */
function CoordinationFeed({ items, onViewLog }) {
  return (
    <div className="rounded-2xl border border-v2-border bg-white p-4">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <div className="font-heading text-[13px] font-semibold text-v2-heading">Coordination feed</div>
          <div className="mt-0.5 font-body text-[11px] text-v2-muted">Real activity from AI Product Manager and AI Developer — the only two agents with a real backend so far</div>
        </div>
        <button type="button" onClick={onViewLog} className="shrink-0 font-body text-[11px] text-v2-blue hover:underline">View full log →</button>
      </div>

      {items.length === 0 ? (
        <p className="py-6 text-center font-body text-[12px] text-v2-muted">
          No real activity yet — give AI Developer a task or chat with AI Product Manager to see it here.
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-gray-200">
          {items.map((item) => (
            <div key={item.id} className="flex gap-3 py-3">
              {/* Time above avatars */}
              <div className="flex shrink-0 flex-col items-center gap-1">
                <span className="font-body text-[9px] text-v2-subtle">{item.time}</span>
                <div className="flex items-center gap-1">
                  <Avatar initials={item.from.initials} bg={item.from.bg} color={item.from.color} size={26} badge={item.from.isAgent ? "agent" : "human"} />
                  {item.to && (
                    <>
                      <ArrowRight className="h-3 w-3 text-gray-300" />
                      <Avatar initials={item.to.initials} bg={item.to.bg} color={item.to.color} size={26} badge={item.to.isAgent ? "agent" : "human"} />
                    </>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="min-w-0 flex-1">
                <p className="font-body text-[12px] leading-snug text-v2-heading">{item.text}</p>
                {item.tag && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <Tag {...item.tag} />
                  </div>
                )}
                {item.link && (
                  <a href={item.link} target="_blank" rel="noreferrer" className="mt-1.5 inline-block font-body text-[10px] font-medium text-v2-purple hover:underline">
                    View real PR →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Right Now (dependency map)
───────────────────────────────────────────── */
function RightNowMap({ nodes }) {
  return (
    <div className="rounded-2xl border border-v2-border bg-white p-4">
      <div className="mb-3">
        <div className="font-heading text-[13px] font-semibold text-v2-heading">Right now</div>
        <div className="mt-0.5 font-body text-[11px] text-v2-muted">Real agents and you — who's working, who's blocked, who's waiting on whom</div>
      </div>
      <div className="flex items-stretch gap-0 overflow-x-auto pb-2">
        {nodes.map((node, i) => (
          <React.Fragment key={node.name}>
            <div
              className={cn(
                "min-w-[148px] shrink-0 cursor-pointer rounded-xl border p-3 transition-shadow hover:shadow-sm",
                node.state === "active"   && "border-[#97C459] bg-[#F5FAEE]",
                node.state === "blocked"  && "border-[#EFB0AF] bg-[#FDF3F3]",
                node.state === "waiting"  && "border-[#e5c98a] bg-[#FCF7EC]",
              )}
            >
              <Avatar initials={node.initials} bg={node.bg} color={node.color} size={28} />
              <div className="mt-2 font-body text-[11px] font-medium text-v2-heading">{node.name}</div>
              <div className="mt-0.5 font-body text-[10px] leading-snug text-v2-muted">{node.task}</div>
              <div className="mt-2 inline-block rounded-[5px] px-1.5 py-0.5 font-body text-[9px] font-semibold" style={{ background: node.stateBg, color: node.stateColor }}>
                {node.stateLabel}
              </div>
            </div>
            {i < nodes.length - 1 && (
              <div className="flex w-6 shrink-0 items-center justify-center">
                <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Right Panel — Needs Decision
───────────────────────────────────────────── */
function ApprovalCard({ approvals, onApprove, onViewAll }) {
  const count = approvals.length;
  return (
    <div className={cn("rounded-2xl p-2.5 transition-colors", count === 0 ? "bg-[#EAF3DE]" : "bg-[#FDF3F3]")}>
      <div className="mb-0.5 flex items-center justify-between">
        <span className="font-heading text-[11px] font-semibold" style={{ color: count === 0 ? "#27500A" : "#791F1F" }}>
          {count === 0 ? "All clear ✓" : "Needs a decision"}
        </span>
        {count > 0 && <span className="rounded-full bg-red-500 px-1.5 py-0.5 font-body text-[9px] font-semibold text-white">{count}</span>}
      </div>
      <button type="button" onClick={onViewAll} className="mb-2 font-body text-[9px] text-v2-blue hover:underline">
        Open full queue with filters and history →
      </button>

      <div className="flex flex-col gap-1.5">
        {approvals.map((a) => (
          <div key={a.id} className={cn("rounded-xl border border-gray-100 bg-white p-2", a.isFyi && "opacity-80")}>
            <div className="mb-1 flex items-start gap-1.5">
              <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded font-body text-[7px] font-semibold" style={{ background: a.agent.bg, color: a.agent.color }}>
                {a.agent.initials}
              </div>
              <div className="min-w-0 flex-1 font-body text-[10px] font-semibold leading-snug text-v2-heading">{a.title}</div>
              <span className="shrink-0 rounded px-1 py-0.5 font-body text-[7px] font-medium" style={{ background: a.riskBg, color: a.riskColor }}>{a.risk}</span>
            </div>
            <p className="mb-1 font-body text-[9px] leading-relaxed text-v2-muted">{a.desc}</p>
            <div className="mb-1.5 flex items-center gap-1 font-body text-[8px] text-gray-400">
              <span>👤</span> Waiting on <strong className="text-gray-600 ml-0.5">{a.waitingOn}</strong>
            </div>
            <div className="flex gap-1">
              <button type="button" className="flex-1 rounded-lg border border-gray-200 bg-white py-1 font-body text-[9px] font-medium text-v2-heading hover:bg-gray-50 transition-colors">
                Review
              </button>
              {!a.isFyi ? (
                <button type="button" onClick={() => onApprove(a)} className="flex-1 rounded-lg bg-v2-green py-1 font-body text-[9px] font-medium text-white hover:opacity-90 transition-opacity">
                  {a.primaryLabel}
                </button>
              ) : (
                <button type="button" className="flex-1 rounded-lg bg-[#EEEDFE] py-1 font-body text-[9px] font-medium text-v2-purple hover:opacity-90 transition-opacity">
                  Nudge Chidinma →
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Right Panel — Agents / Humans
───────────────────────────────────────────── */
function AgentsList({ agentsPaused, onOpenAgent, realStatus }) {
  const agents = AGENTS.map((a) => (realStatus[a.id] ? { ...a, ...realStatus[a.id] } : a));
  return (
    <div className="rounded-2xl bg-[#f9fafb] p-2.5">
      <div className="mb-1.5 font-heading text-[11px] font-semibold text-v2-heading">Agents</div>
      <div className="flex flex-col">
        {agents.map((a) => (
          <button key={a.id} type="button" onClick={() => onOpenAgent(a)} className="flex items-center gap-1.5 border-b border-gray-100 py-1.5 text-left last:border-b-0 hover:opacity-80 transition-opacity">
            <Avatar initials={a.initials} bg={a.bg} color={a.color} size={20} badge="agent" />
            <div className="min-w-0 flex-1">
              <div className="font-body text-[10px] font-medium text-v2-heading">{a.name}</div>
              <div className="font-body text-[8px] text-v2-muted">{agentsPaused ? "Paused" : a.statusLabel}</div>
            </div>
            <StatusDot status={agentsPaused ? "idle" : a.status} />
          </button>
        ))}
      </div>
    </div>
  );
}

function HumansList({ humans }) {
  return (
    <div className="rounded-2xl bg-[#f9fafb] p-2.5">
      <div className="mb-1.5 font-heading text-[11px] font-semibold text-v2-heading">Humans in the loop</div>
      <div className="flex flex-col">
        {humans.map((h) => (
          <div key={h.id} className="flex items-center gap-1.5 border-b border-gray-100 py-1.5 last:border-b-0">
            <Avatar initials={h.initials} bg="#EFB0AF" color="#791F1F" size={20} badge="human" />
            <div className="min-w-0 flex-1">
              <div className="font-body text-[10px] font-medium text-v2-heading">{h.name}</div>
              <div className="font-body text-[8px] text-v2-muted">{h.statusLabel}</div>
            </div>
            <StatusDot status={h.status} />
          </div>
        ))}
      </div>
      <p className="mt-1.5 font-body text-[9px] leading-relaxed text-v2-muted">
        {humans.length > 1
          ? "Every real approval still comes to you — routing a decision to a specific team member isn't built yet."
          : "You're the only real human in the loop right now. Add team members on the Team page as your startup grows."}
      </p>
    </div>
  );
}

function AutonomyQuickView({ onOpenSettings, summary }) {
  return (
    <div className="rounded-2xl bg-[#f9fafb] p-2.5">
      <div className="mb-1.5 font-heading text-[11px] font-semibold text-v2-heading">Autonomy — quick view</div>
      {[
        { k: "Runs fully autonomous", v: summary.autonomousLabel },
        { k: "Always escalates",      v: summary.escalatesLabel },
        { k: "So far",                v: summary.soFarLabel },
      ].map((r) => (
        <div key={r.k} className="flex items-center justify-between gap-2 border-b border-gray-100 py-1 last:border-b-0">
          <span className="shrink-0 font-body text-[9px] text-v2-muted">{r.k}</span>
          <span className="truncate text-right font-body text-[9px] font-medium text-v2-heading" title={r.v}>{r.v}</span>
        </div>
      ))}
      <button type="button" onClick={onOpenSettings} className="mt-2 w-full rounded-xl border border-v2-border bg-white py-1.5 font-body text-[10px] font-medium text-v2-heading hover:bg-v2-page transition-colors">
        Adjust per agent →
      </button>
    </div>
  );
}

function ProductCard({ onView }) {
  return (
    <div className="rounded-2xl bg-[#f9fafb] p-2.5">
      <div className="mb-1 font-heading text-[11px] font-semibold text-v2-heading">What's been built</div>
      <p className="mb-2 font-body text-[9px] leading-relaxed text-v2-muted">
        See the live product — app screens, build history, and what's shipped vs. still planned.
      </p>
      <button type="button" onClick={onView} className="w-full rounded-xl border border-v2-border bg-white py-1.5 font-body text-[10px] font-medium text-v2-heading hover:bg-v2-page transition-colors">
        View product →
      </button>
    </div>
  );
}

function AuditCard({ onViewLog }) {
  return (
    <div className="rounded-2xl bg-[#f9fafb] p-2.5">
      <div className="mb-1 font-heading text-[11px] font-semibold text-v2-heading">Audit trail</div>
      <p className="mb-2 font-body text-[9px] leading-relaxed text-v2-muted">
        Every action above is logged with the agent or human, the data used, and the decision — searchable and exportable.
      </p>
      <button type="button" onClick={onViewLog} className="w-full rounded-xl border border-v2-border bg-white py-1.5 font-body text-[10px] font-medium text-v2-heading hover:bg-v2-page transition-colors">
        Open full log →
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
export default function V2AgentWorkroom({ user, onNavigate }) {
  const founderId = useOfficeStore((s) => s.founderId);
  const resolvedFounderId = founderId || String(user?._id ?? user?.id ?? "");

  const [approvals, setApprovals] = useState([]);
  const [feedItems, setFeedItems] = useState([]);
  const [realStatus, setRealStatus] = useState({});
  const [realAgents, setRealAgents] = useState([]);
  const [heroStats, setHeroStats] = useState({ total: 0, agentCount: 0, autonomous: 0, waiting: 0 });
  const [depMapNodes, setDepMapNodes] = useState([]);
  const [autonomySummary, setAutonomySummary] = useState({ autonomousLabel: "None yet", escalatesLabel: "None yet", soFarLabel: "0 auto · 0 waiting" });
  const [teamMembers, setTeamMembers] = useState([]);
  const [agentsPaused, setAgentsPaused] = useState(false);
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState(null); // { type, data }

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2400);
  }, []);

  const refreshRealData = useCallback(() => {
    if (!resolvedFounderId) return;
    Promise.all([getAgents(resolvedFounderId), getAgentEvents(resolvedFounderId), getActionTypes(resolvedFounderId)])
      .then(([agents, events, actionTypes]) => {
        const realAgentList = agents || [];
        const realEvents = events || [];
        const realApprovals = buildRealApprovals(realEvents);
        const stats = buildHeroStats(realAgentList, realEvents, realApprovals.length);
        setRealAgents(realAgentList);
        setFeedItems(buildRealFeed(realEvents));
        setApprovals(realApprovals);
        setRealStatus({
          pm: summarizeAgentStatus("pm", realEvents),
          dev: summarizeAgentStatus("dev", realEvents),
        });
        setHeroStats(stats);
        setDepMapNodes(buildRealDepMap(realAgentList, realEvents, realApprovals.length));
        setAutonomySummary(buildAutonomySummary(actionTypes || [], stats));
      })
      .catch(() => {
        // Real data is a nice-to-have here — the widgets just show their
        // honest empty state if this fails, same as a brand-new founder.
      });
  }, [resolvedFounderId]);

  // Team members change rarely — fetched once, separately from the frequent
  // agent-event refresh above. Combined with the real approvals count into
  // the Humans-in-the-loop list at render time, below.
  useEffect(() => {
    if (!resolvedFounderId) return;
    let cancelled = false;
    getFounderStartupSafe(resolvedFounderId)
      .then((startup) => (startup?._id ? getStartupTeamMembers(resolvedFounderId) : []))
      .then((members) => { if (!cancelled) setTeamMembers(members || []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [resolvedFounderId]);

  useEffect(() => { refreshRealData(); }, [refreshRealData]);

  const handleApprove = useCallback(async (item) => {
    try {
      await resolveAgentEvent(item.id, "approved");
      setApprovals((prev) => prev.filter((a) => a.id !== item.id));
      showToast(`✓ Approved — ${item.title}`);
      refreshRealData();
    } catch (err) {
      showToast(err?.message || "Could not approve — try the full queue.");
    }
  }, [showToast, refreshRealData]);

  const handlePauseAll = useCallback(() => {
    setAgentsPaused(true);
    setModal(null);
    showToast("All agents paused");
  }, [showToast]);

  const queueCount = approvals.length;
  const humans = buildHumansInLoop(user?.name, teamMembers, queueCount);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-v2-page">

      {/* ── Topbar ── */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-v2-border bg-white px-5 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-body text-[12px] text-v2-muted">AI Staff</span>
          <span className="text-gray-300">›</span>
          <span className="font-body text-[13px] font-medium text-v2-heading">Agent Workroom</span>
          <span className="text-gray-300">·</span>
          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-body text-[11px] font-medium", agentsPaused ? "bg-gray-100 text-gray-500" : "bg-[#EAF3DE] text-[#27500A]")}>
            <span className="h-[5px] w-[5px] rounded-full" style={{ background: agentsPaused ? "#9ca3af" : "#1D9E75" }} />
            {agentsPaused ? "Agents paused" : `${realAgents.length} real agent${realAgents.length === 1 ? "" : "s"}`}
          </span>
          {queueCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FAEEDA] px-2.5 py-1 font-body text-[11px] font-medium text-[#633806]">
              {queueCount} waiting on you
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setModal({ type: "pause" })}
            className="flex items-center gap-1.5 rounded-full border border-v2-border bg-white px-3 py-1.5 font-body text-[12px] font-medium text-v2-heading hover:bg-gray-50 transition-colors"
          >
            <Pause className="h-3.5 w-3.5" />
            Pause all agents
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.("autonomy-settings")}
            className="flex items-center gap-1.5 rounded-full border border-v2-border bg-white px-3 py-1.5 font-body text-[12px] font-medium text-v2-heading hover:bg-gray-50 transition-colors"
          >
            <Settings className="h-3.5 w-3.5" />
            Autonomy settings
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.("approval-queue")}
            className="flex items-center gap-1.5 rounded-full bg-v2-purple px-3 py-1.5 font-body text-[12px] font-medium text-white hover:opacity-90 transition-opacity"
          >
            Approval queue · {queueCount}
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex min-h-0 flex-1 overflow-hidden bg-v2-page">

        {/* Main content — block container so children keep natural heights; overflow-y-auto scrolls */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          <OvernightHero agentsPaused={agentsPaused} stats={heroStats} />
          <CoordinationFeed items={feedItems} onViewLog={() => onNavigate?.("audit-trail")} />
          <RightNowMap nodes={depMapNodes} />
        </div>

        {/* Right panel — 320px matches V2AppLayout standard right-panel width */}
        <div className="flex w-[320px] shrink-0 flex-col gap-3 overflow-y-auto border-l border-v2-border bg-white p-4">
          <ApprovalCard
            approvals={approvals}
            onApprove={handleApprove}
            onViewAll={() => onNavigate?.("approval-queue")}
          />
          <AgentsList
            agentsPaused={agentsPaused}
            realStatus={realStatus}
            onOpenAgent={(agent) => {
              // Agents with their own workspace page → navigate there
              // Real bug found while wiring real PM/DEV data into this widget:
              // pm/dev weren't in this map, so clicking them fell through to
              // the generic modal, whose "Open workspace" button navigates to
              // `ai-${id}` — not a real page name anywhere in V2AIStaffShell,
              // so it silently did nothing. Both now go straight to their
              // real page instead.
              const AGENT_PAGES = { mk: "agent-marketing", sa: "agent-sales", dev: "agent-developer", pm: "ai-staff-chat" };
              const page = AGENT_PAGES[agent.id];
              if (page) { onNavigate?.(page); } else { setModal({ type: "agent", data: agent }); }
            }}
          />
          <HumansList humans={humans} />
          <AutonomyQuickView onOpenSettings={() => onNavigate?.("autonomy-settings")} summary={autonomySummary} />
          <ProductCard onView={() => onNavigate?.("product-viewer")} />
          <AuditCard onViewLog={() => onNavigate?.("audit-trail")} />
        </div>
      </div>

      {/* ── Modals ── */}

      {/* Pause confirm */}
      <Modal
        open={modal?.type === "pause"}
        onClose={() => setModal(null)}
        title="Pause all agents?"
        subtitle="Every agent stops picking up new work"
        footer={
          <>
            <ModalBtn onClick={() => setModal(null)}>Cancel</ModalBtn>
            <ModalBtn variant="danger" onClick={handlePauseAll}>Pause all agents</ModalBtn>
          </>
        }
      >
        <p>Agents currently in progress will finish their current step and then stop. Nothing new will be started until you resume. Humans in the loop — James and Chidinma — are not affected.</p>
      </Modal>

      {/* Agent detail */}
      <Modal
        open={modal?.type === "agent"}
        onClose={() => setModal(null)}
        title={modal?.data?.name}
        subtitle="Agent · click to open full workspace"
        footer={
          <>
            <ModalBtn onClick={() => setModal(null)}>Close</ModalBtn>
            <ModalBtn variant="primary" onClick={() => { setModal(null); onNavigate?.(`ai-${modal?.data?.id}`); }}>
              Open workspace →
            </ModalBtn>
          </>
        }
      >
        <div className="flex items-center gap-3">
          <Avatar initials={modal?.data?.initials} bg={modal?.data?.bg} color={modal?.data?.color} size={40} badge="agent" />
          <div>
            <div className="font-body text-[13px] font-semibold text-v2-heading">{modal?.data?.name}</div>
            <div className="font-body text-[11px] text-v2-muted">{modal?.data?.statusLabel}</div>
          </div>
        </div>
      </Modal>

      {/* Toast */}
      <Toast msg={toast} />
    </div>
  );
}
