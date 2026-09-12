/**
 * V2AgentWorkroom — AI Staff landing page
 * Single sidebar entry; Approval Queue, Autonomy Settings, Audit Trail,
 * and individual agent pages are accessed via buttons/links inside this view.
 */

import React, { useState, useCallback } from "react";
import { cn } from "../ui/utils";
import {
  Zap, Users, Clock, CheckCircle2, AlertCircle, ChevronRight,
  Pause, Settings, ArrowRight, X, ExternalLink, FileText,
  TrendingUp, Shield, Activity,
} from "lucide-react";

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

const HUMANS = [
  { id: "james",    initials: "JS", name: "James S.",     role: "Engineering", bg: "#E6F1FB", color: "#0C447C", status: "clear",   statusLabel: "Cleared M1 · nothing pending" },
  { id: "chidinma", initials: "CA", name: "Chidinma A.",  role: "Marketing",   bg: "#FAEEDA", color: "#633806", status: "pending", statusLabel: "1 pending · email tone review" },
];

const FEED_ITEMS = [
  { time: "6:02am", from: { initials: "DEV", bg: "#f3f4f6", color: "#6b7280", isAgent: true },  to: { initials: "DS",  bg: "#FAEEDA", color: "#633806", isAgent: true },  text: "AI Developer opened PR #14 (landing page hero section) and tagged AI Designer for an asset review before merging.", tags: [{ label: "Autonomous", bg: "#f3f4f6", color: "#6b7280" }, { label: "Milestone M1 · Landing page", bg: "#E6F1FB", color: "#0C447C" }] },
  { time: "6:14am", from: { initials: "DS",  bg: "#FAEEDA", color: "#633806", isAgent: true },  to: { initials: "DEV", bg: "#f3f4f6", color: "#6b7280", isAgent: true },  text: "AI Designer approved the hero assets and handed PR #14 back to AI Developer — brand colours and image compression fixed.", tags: [{ label: "Autonomous", bg: "#f3f4f6", color: "#6b7280" }], artifact: { name: "hero-final-v3.png + 2 more", sub: "Design review notes attached", iconBg: "#EEEDFE", iconColor: "#534AB7" } },
  { time: "6:22am", from: { initials: "DEV", bg: "#f3f4f6", color: "#6b7280", isAgent: true },  to: { initials: "JS",  bg: "#E6F1FB", color: "#0C447C", isAgent: false }, text: "AI Developer merged PR #14 and deployed to staging, then handed off to James S. — go-live and DNS need a human with deploy access.", tags: [{ label: "Blocker cleared", bg: "#EAF3DE", color: "#27500A" }, { label: "Waiting on James · Engineering", bg: "#FCF7EC", color: "#633806" }], artifact: { name: "staging.healthtrack.app", sub: "Deployed · awaiting James's publish", iconBg: "#EAF3DE", iconColor: "#1D9E75", viewPage: "product-viewer" } },
  { time: "7:03am", from: { initials: "JS",  bg: "#E6F1FB", color: "#0C447C", isAgent: false }, to: { initials: "PM",  bg: "#EEEDFE", color: "#534AB7", isAgent: true },  text: "James S. pointed the domain live from his phone and told AI Product Manager to mark the milestone complete — a human closing the loop an agent couldn't finish alone.", tags: [{ label: "Human action · Milestone M1 done", bg: "#EAF3DE", color: "#27500A" }] },
  { time: "7:40am", from: { initials: "MK",  bg: "#EAF3DE", color: "#27500A", isAgent: true },  to: { initials: "SA",  bg: "#E6F1FB", color: "#0C447C", isAgent: true },  text: "AI Marketing drafted 10 clinic outreach messages using the Vezeeta Blueprint's supply-first approach, then handed them to AI Sales to personalise and queue.", tags: [{ label: "Autonomous", bg: "#f3f4f6", color: "#6b7280" }, { label: "Blueprint milestone · 0 of 10 clinics", bg: "#FAEEDA", color: "#633806" }] },
  { time: "7:52am", from: { initials: "SA",  bg: "#E6F1FB", color: "#0C447C", isAgent: true },  to: { initials: "AO",  bg: "#EFB0AF", color: "#791F1F", isAgent: false }, text: "AI Sales personalised all 10 messages and queued them — then escalated to you because sending is external-facing and outside its autonomy setting.", tags: [{ label: "Escalated · needs approval", bg: "#FCEBEB", color: "#791F1F" }] },
  { time: "7:58am", from: { initials: "MK",  bg: "#EAF3DE", color: "#27500A", isAgent: true },  to: { initials: "CA",  bg: "#FAEEDA", color: "#633806", isAgent: false }, text: "AI Marketing drafted the Week 5 nurture email sequence and routed it to Chidinma A. — brand voice calls go to the human on the marketing role, not to you.", tags: [{ label: "Waiting on Chidinma · Marketing", bg: "#FCF7EC", color: "#633806" }] },
  { time: "8:10am", from: { initials: "GA",  bg: "#E6F1FB", color: "#0C447C", isAgent: true },  to: { initials: "PM",  bg: "#EEEDFE", color: "#534AB7", isAgent: true },  text: "AI Growth Analyst flagged that 8/8 interviews validated the core pain point — unusually strong — and passed the pattern to AI Product Manager.", tags: [{ label: "Autonomous", bg: "#f3f4f6", color: "#6b7280" }] },
  { time: "8:15am", from: { initials: "PM",  bg: "#EEEDFE", color: "#534AB7", isAgent: true },  to: null, text: "AI Product Manager rebuilt the Week 5 priority stack around the cleared blocker and the Growth Analyst's signal, and queued the plan for your review.", tags: [{ label: "Escalated · needs approval", bg: "#FCEBEB", color: "#791F1F" }] },
];

const DEP_MAP = [
  { initials: "PM",  bg: "#EEEDFE", color: "#534AB7", name: "AI Product Manager",   task: "Rebuilding Week 5 sprint plan",      state: "active",   stateLabel: "Working",         stateBg: "#EAF3DE", stateColor: "#27500A" },
  { initials: "AO",  bg: "#EFB0AF", color: "#791F1F", name: "You (Adaeze) · Founder", task: "4 approvals waiting",              state: "waiting",  stateLabel: "Needs decision",  stateBg: "#FCEBEB", stateColor: "#791F1F" },
  { initials: "SA",  bg: "#E6F1FB", color: "#0C447C", name: "AI Sales",               task: "Outreach queued, can't send",      state: "blocked",  stateLabel: "Blocked on you",  stateBg: "#FCEBEB", stateColor: "#791F1F" },
  { initials: "CA",  bg: "#FAEEDA", color: "#633806", name: "Chidinma A. · Marketing", task: "Reviewing nurture email tone",     state: "waiting",  stateLabel: "Human review",    stateBg: "#FCF7EC", stateColor: "#633806" },
  { initials: "GA",  bg: "#E6F1FB", color: "#0C447C", name: "AI Growth Analyst",      task: "Waiting on Week 5 interview log",  state: "active",   stateLabel: "Idle · no data",  stateBg: "#FCF7EC", stateColor: "#633806" },
];

const INITIAL_APPROVALS = [
  { id: "appr-1", agent: { initials: "SA", bg: "#E6F1FB", color: "#0C447C" }, title: "Send 10 clinic outreach messages", risk: "Low risk", riskBg: "#f3f4f6", riskColor: "#6b7280", desc: "AI Sales personalised and queued all 10 — Lagos Island + VI, Vezeeta supply-first script.", waitingOn: "you", primaryLabel: "Send all →", primaryAction: "Sent 10 messages" },
  { id: "appr-2", agent: { initials: "DEV", bg: "#f3f4f6", color: "#6b7280" }, title: "Merge PR #15 — pricing page", risk: "Touches billing", riskBg: "#FCEBEB", riskColor: "#791F1F", desc: "Updates the Stripe price IDs. AI Developer flagged this itself and won't merge without a human.", waitingOn: "you", primaryLabel: "Approve merge", primaryAction: "Merged PR #15" },
  { id: "appr-3", agent: { initials: "PM", bg: "#EEEDFE", color: "#534AB7" }, title: "Week 5 sprint plan", risk: "Low risk", riskBg: "#f3f4f6", riskColor: "#6b7280", desc: "4 milestones, 11 tasks, rebuilt around the cleared blocker and this week's interview signal.", waitingOn: "you", primaryLabel: "Push to engine", primaryAction: "Pushed sprint plan to Execution Engine" },
  { id: "appr-4", agent: { initials: "CA", bg: "#FAEEDA", color: "#633806" }, title: "Nurture email tone review", risk: "FYI only", riskBg: "#f3f4f6", riskColor: "#6b7280", desc: "Routed to Chidinma, not you — brand-voice calls go to the marketing role holder.", waitingOn: "Chidinma A.", isFyi: true },
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
function OvernightHero({ agentsPaused }) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-5" style={{ background: "linear-gradient(135deg,#3C3489,#1B4FD8)" }}>
      <div className="mb-1.5 font-body text-[11px]" style={{ color: "#c9c5f0" }}>While you were away · 11:42pm – 8:15am</div>
      <p className="font-body text-[15px] font-medium leading-relaxed text-white" style={{ maxWidth: 600 }}>
        Your team ran <strong>11 coordinated actions</strong> across 4 agents and 2 human teammates overnight.{" "}
        <strong>6 completed autonomously.</strong>{" "}
        <strong>5 are waiting on a person</strong> — some on you, some on James and Chidinma.
      </p>
      <div className="mt-4 flex flex-wrap gap-6">
        {[
          { val: "78 → 91", lbl: "projected score if approved" },
          { val: "6",       lbl: "agents + humans coordinated" },
          { val: "1",       lbl: "blocker cleared without you" },
          { val: "4",       lbl: "waiting in your queue" },
        ].map((s) => (
          <div key={s.lbl}>
            <div className="font-heading text-[22px] font-semibold text-white">{s.val}</div>
            <div className="font-body text-[10px]" style={{ color: "#c9c5f0" }}>{s.lbl}</div>
          </div>
        ))}
      </div>
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
function CoordinationFeed({ onViewLog, onNavigate }) {
  return (
    <div className="rounded-2xl border border-v2-border bg-white p-4">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <div className="font-heading text-[13px] font-semibold text-v2-heading">Coordination feed</div>
          <div className="mt-0.5 font-body text-[11px] text-v2-muted">Agents hand work to each other — and to whichever teammate actually has the role for it</div>
        </div>
        <button type="button" onClick={onViewLog} className="shrink-0 font-body text-[11px] text-v2-blue hover:underline">View full log →</button>
      </div>

      <div className="flex flex-col divide-y divide-gray-200">
        {FEED_ITEMS.map((item, i) => (
          <div key={i} className="flex gap-3 py-3">
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
              {item.tags?.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {item.tags.map((t) => <Tag key={t.label} {...t} />)}
                </div>
              )}
              {item.artifact && (
                <button
                  type="button"
                  disabled={!item.artifact.viewPage}
                  onClick={() => item.artifact.viewPage && onNavigate?.(item.artifact.viewPage)}
                  className={cn(
                    "mt-2 flex w-full items-center gap-2.5 rounded-xl border border-transparent bg-gray-50 px-3 py-2 text-left transition-colors",
                    item.artifact.viewPage ? "cursor-pointer hover:border-gray-200 hover:bg-gray-100" : "cursor-default",
                  )}
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: item.artifact.iconBg }}>
                    <FileText className="h-3.5 w-3.5" style={{ color: item.artifact.iconColor }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-body text-[11px] font-medium text-v2-heading">{item.artifact.name}</div>
                    <div className="font-body text-[10px] text-v2-muted">{item.artifact.sub}</div>
                  </div>
                  {item.artifact.viewPage && <span className="shrink-0 font-body text-[10px] text-v2-purple">View →</span>}
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
   Right Now (dependency map)
───────────────────────────────────────────── */
function RightNowMap() {
  return (
    <div className="rounded-2xl border border-v2-border bg-white p-4">
      <div className="mb-3">
        <div className="font-heading text-[13px] font-semibold text-v2-heading">Right now</div>
        <div className="mt-0.5 font-body text-[11px] text-v2-muted">Agents and teammates — who's working, who's blocked, who's waiting on whom</div>
      </div>
      <div className="flex items-stretch gap-0 overflow-x-auto pb-2">
        {DEP_MAP.map((node, i) => (
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
            {i < DEP_MAP.length - 1 && (
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
                <button type="button" onClick={() => onApprove(a.id, a.primaryAction)} className="flex-1 rounded-lg bg-v2-green py-1 font-body text-[9px] font-medium text-white hover:opacity-90 transition-opacity">
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
function AgentsList({ agentsPaused, onOpenAgent }) {
  return (
    <div className="rounded-2xl bg-[#f9fafb] p-2.5">
      <div className="mb-1.5 font-heading text-[11px] font-semibold text-v2-heading">Agents</div>
      <div className="flex flex-col">
        {AGENTS.map((a) => (
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

function HumansList() {
  return (
    <div className="rounded-2xl bg-[#f9fafb] p-2.5">
      <div className="mb-1.5 font-heading text-[11px] font-semibold text-v2-heading">Humans in the loop</div>
      <div className="flex flex-col">
        {HUMANS.map((h) => (
          <div key={h.id} className="flex items-center gap-1.5 border-b border-gray-100 py-1.5 last:border-b-0">
            <Avatar initials={h.initials} bg={h.bg} color={h.color} size={20} badge="human" />
            <div className="min-w-0 flex-1">
              <div className="font-body text-[10px] font-medium text-v2-heading">{h.name} · {h.role}</div>
              <div className="font-body text-[8px] text-v2-muted">{h.statusLabel}</div>
            </div>
            <StatusDot status={h.status} />
          </div>
        ))}
      </div>
      <p className="mt-1.5 font-body text-[9px] leading-relaxed text-v2-muted">
        Agents route work to whichever human holds the relevant role — not everything comes to the founder.
      </p>
    </div>
  );
}

function AutonomyQuickView({ onOpenSettings }) {
  return (
    <div className="rounded-2xl bg-[#f9fafb] p-2.5">
      <div className="mb-1.5 font-heading text-[11px] font-semibold text-v2-heading">Autonomy — quick view</div>
      {[
        { k: "Runs fully autonomous", v: "Drafts, code, research" },
        { k: "Always escalates",      v: "Sending, payments, contracts" },
        { k: "This week",             v: "6 auto · 5 escalated" },
      ].map((r) => (
        <div key={r.k} className="flex items-center justify-between border-b border-gray-100 py-1 last:border-b-0">
          <span className="font-body text-[9px] text-v2-muted">{r.k}</span>
          <span className="font-body text-[9px] font-medium text-v2-heading">{r.v}</span>
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
export default function V2AgentWorkroom({ onNavigate }) {
  const [approvals, setApprovals] = useState(INITIAL_APPROVALS);
  const [agentsPaused, setAgentsPaused] = useState(false);
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState(null); // { type, data }

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2400);
  }, []);

  const handleApprove = useCallback((id, msg) => {
    setApprovals((prev) => prev.filter((a) => a.id !== id));
    showToast("✓ " + msg);
  }, [showToast]);

  const handlePauseAll = useCallback(() => {
    setAgentsPaused(true);
    setModal(null);
    showToast("All agents paused");
  }, [showToast]);

  const queueCount = approvals.length;

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
            {agentsPaused ? "Agents paused" : "5 active — 4 agents, 1 human"}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#FAEEDA] px-2.5 py-1 font-body text-[11px] font-medium text-[#633806]">
            4 waiting on someone
          </span>
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
          <OvernightHero agentsPaused={agentsPaused} />
          <CoordinationFeed onViewLog={() => onNavigate?.("audit-trail")} onNavigate={onNavigate} />
          <RightNowMap />
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
            onOpenAgent={(agent) => {
              // Agents with their own workspace page → navigate there
              const AGENT_PAGES = { mk: "agent-marketing", sa: "agent-sales" };
              const page = AGENT_PAGES[agent.id];
              if (page) { onNavigate?.(page); } else { setModal({ type: "agent", data: agent }); }
            }}
          />
          <HumansList />
          <AutonomyQuickView onOpenSettings={() => onNavigate?.("autonomy-settings")} />
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
