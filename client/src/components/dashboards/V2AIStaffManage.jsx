/**
 * V2AIStaffManage — "Manage Staff" tab of the AI Staff section.
 * Shows hired agents, available-to-hire roster (phased), monthly spend, and upgrade CTA.
 */

import React, { useState } from "react";
import { cn } from "../ui/utils";
import { MessageSquare, FileText, Lock, Zap } from "lucide-react";

/* ── Static data ──────────────────────────────────────────────────────────── */
const HIRED = [
  {
    id: "pm", initials: "PM", name: "AI Product Manager", role: "Strategy · Roadmap · Sprint planning",
    bg: "#EEEDFE", color: "#3C3489", price: "$25/mo", priceBg: "#EEEDFE", priceColor: "#3C3489",
    status: "active", statusLabel: "Active now — working", statusColor: "#27500A", statusDot: "#1D9E75",
    task: "Building Week 5 sprint plan based on Week 4 interview outcomes and current blockers",
    output: "Week 5 sprint draft ready — 4 milestones, 12 tasks. Landing page prioritised to resolve James's blocker first.",
  },
  {
    id: "mk", initials: "MK", name: "AI Marketing Agent", role: "Campaigns · Copy · Brand voice",
    bg: "#EAF3DE", color: "#27500A", price: "$20/mo", priceBg: "#EAF3DE", priceColor: "#27500A",
    status: "active", statusLabel: "Active — output ready", statusColor: "#27500A", statusDot: "#1D9E75",
    task: "Drafted launch copy for HealthTrack's waitlist landing page and social media intro posts",
    output: '"Own your health story" — 3 landing page headline variants + 5 Twitter/X launch posts ready for review.',
  },
  {
    id: "ga", initials: "GA", name: "AI Growth Analyst", role: "Metrics · Traction · Analytics",
    bg: "#E6F1FB", color: "#0C447C", price: "$10/mo", priceBg: "#E6F1FB", priceColor: "#0C447C",
    status: "waiting", statusLabel: "Waiting — needs more data", statusColor: "#633806", statusDot: "#BA7517",
    task: "Monitoring traction metrics and weekly execution patterns. Will generate growth report after Week 4 outcome is logged.",
    output: "Interview validation rate is 100% — unusually strong. Recommend adding 5 more interviews before building to deepen signal.",
  },
  {
    id: "fin", initials: "FIN", name: "AI Finance", role: "Invoicing · Cash position · Bookkeeping",
    bg: "#FAEEDA", color: "#633806", price: "$15/mo", priceBg: "#FAEEDA", priceColor: "#633806",
    status: "waiting", statusLabel: "Idle — 1 invoice needs your approval", statusColor: "#633806", statusDot: "#BA7517",
    task: "Drafted invoice INV-1042 for Reddington Clinic from the signed pilot agreement. Sending always waits for you — it's fixed, not adjustable in autonomy settings.",
    output: "₦180,000 invoice ready to send, plus this week's revenue chart and connected Stripe/GTBank cash position, updated automatically.",
  },
  {
    id: "legal", initials: "LGL", name: "AI Legal", role: "Contracts · NDAs · Compliance",
    bg: "#FCEBEB", color: "#791F1F", price: "$20/mo", priceBg: "#FCEBEB", priceColor: "#791F1F",
    status: "waiting", statusLabel: "Idle — 1 document needs your approval", statusColor: "#791F1F", statusDot: "#BA7517",
    task: "Drafted a standard NDA for next week's backend engineer interview from the approved template. No legal document sends without your sign-off.",
    output: "NDA ready to send to the candidate. 7 active contracts on file, 0 open compliance flags as of this morning's check.",
  },
];

const AVAILABLE_PHASES = [
  {
    label: "Phase 2 — available now",
    locked: false,
    lockLabel: null,
    staff: [
      { initials: "DEV", name: "AI Developer Agent",   role: "Code review · Tech decisions · Docs",    bg: "#EEEDFE", color: "#3C3489", price: "$25/mo", task: "Reviews code architecture, suggests tech stack decisions, writes technical documentation, flags complexity risks." },
      { initials: "SA",  name: "AI Sales Agent",       role: "Pipeline · Outreach · Conversion",        bg: "#EAF3DE", color: "#27500A", price: "$20/mo", task: "Builds outreach sequences, drafts sales scripts, tracks pipeline conversations, and suggests when to follow up." },
    ],
  },
  {
    label: "Phase 3 — unlocks Month 9",
    locked: true,
    lockLabel: "Unlocks Month 9",
    staff: [
      { initials: "STR", name: "AI Strategy Advisor", role: "Vision · Pivots · Competitive positioning", bg: "#EEEDFE", color: "#3C3489", price: "$25/mo", task: "Big-picture strategic advice tailored to your stage, market, and execution history. Flags when to pivot." },
      { initials: "DES", name: "AI Designer Agent",   role: "Brand · UX critique · Design briefs",      bg: "#EEEDFE", color: "#3C3489", price: "$15/mo", task: "Writes design briefs, critiques UX flows, suggests brand direction, and reviews Figma links for consistency." },
    ],
  },
  {
    label: "Phase 4 — unlocks Month 10",
    locked: true,
    lockLabel: "Unlocks Month 10",
    staff: [
      { initials: "HR",  name: "AI HR Agent",              role: "Hiring · Culture · Team health",      bg: "#EAF3DE", color: "#27500A", price: "$15/mo", task: "Writes job descriptions, screens applicants, builds onboarding flows, and monitors team health signals." },
      { initials: "IR",  name: "AI Investor Relations",    role: "Updates · Decks · Investor comms",    bg: "#E6F1FB", color: "#0C447C", price: "$25/mo", task: "Drafts investor updates, prepares pitch narrative from your execution data, tracks investor interest signals." },
      { initials: "CS",  name: "AI Customer Success",      role: "Retention · Feedback loops · NPS",    bg: "#FAEEDA", color: "#633806", price: "$15/mo", task: "Builds customer onboarding flows, monitors retention signals, synthesises user feedback, flags churn risks." },
    ],
  },
];

const ACTIVITY = [
  { initials: "PM", bg: "#EEEDFE", color: "#3C3489", name: "AI Product Manager",  text: "Week 5 sprint plan drafted — 4 milestones, 12 tasks. Prioritised landing page to unblock James.", time: "12 min ago" },
  { initials: "MK", bg: "#EAF3DE", color: "#27500A", name: "AI Marketing Agent",  text: '3 landing page headlines + 5 launch posts generated. "Own your health story" ranked highest.',    time: "1 hr ago" },
  { initials: "PM", bg: "#EEEDFE", color: "#3C3489", name: "AI Product Manager",  text: "Blocker alert — flagged James S. landing page risk to execution score. Suggested Figma handoff.",   time: "3 hrs ago" },
  { initials: "GA", bg: "#E6F1FB", color: "#0C447C", name: "AI Growth Analyst",   text: "100% validation rate from 8 interviews is above average. Recommend 5 more before build phase.",    time: "Yesterday" },
  { initials: "MK", bg: "#EAF3DE", color: "#27500A", name: "AI Marketing Agent",  text: "HealthTrack differentiator is data ownership, not convenience. Recommend leading with that in copy.", time: "Yesterday" },
];

const CONTEXT = [
  { k: "Startup",   v: "HealthTrack" },
  { k: "Stage",     v: "Stage 1 of 6" },
  { k: "Week",      v: "Week 4 · Active" },
  { k: "Score",     v: "78 · +12 this week" },
  { k: "Team",      v: "5 members" },
  { k: "Goal",      v: "5 customer interviews" },
  { k: "Blocker",   v: "James S. · landing page" },
  { k: "Traction",  v: "8/8 validation rate" },
  { k: "Revenue",   v: "Pre-revenue" },
];

/* ── Agents with a real dedicated workspace page (else falls back to chat) ── */
const AGENT_WORKSPACE_PAGE = { mk: "agent-marketing", sa: "agent-sales", fin: "agent-finance", legal: "agent-legal" };

/* ── Sub-components ───────────────────────────────────────────────────────── */
function AgentAvatar({ initials, bg, color, size = 40 }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-[10px] font-body font-semibold"
      style={{ width: size, height: size, background: bg, color, fontSize: size * 0.32 }}
    >
      {initials}
    </div>
  );
}

function HiredCard({ agent, onChat, onNavigate }) {
  return (
    <div className={cn("relative rounded-2xl border bg-white p-3.5 transition-shadow hover:shadow-sm", "border-v2-border")}>
      {/* Price tag */}
      <span className="absolute right-3 top-3 rounded-lg px-2 py-0.5 font-body text-[10px] font-semibold" style={{ background: agent.priceBg, color: agent.priceColor }}>
        {agent.price}
      </span>

      {/* Header */}
      <div className="mb-2.5 flex items-start gap-2.5">
        <AgentAvatar initials={agent.initials} bg={agent.bg} color={agent.color} size={38} />
        <div className="min-w-0 flex-1 pr-12">
          <div className="font-body text-[12px] font-semibold text-v2-heading">{agent.name}</div>
          <div className="font-body text-[10px] text-v2-muted">{agent.role}</div>
        </div>
      </div>

      {/* Status */}
      <div className="mb-2 flex items-center gap-1.5">
        <div className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: agent.statusDot }} />
        <span className="font-body text-[10px] font-medium" style={{ color: agent.statusColor }}>{agent.statusLabel}</span>
      </div>

      {/* Task */}
      <p className="mb-2 font-body text-[11px] leading-snug text-v2-muted">{agent.task}</p>

      {/* Latest output */}
      <div className="mb-3 rounded-xl bg-v2-page px-3 py-2">
        <div className="mb-0.5 font-body text-[9px] font-semibold uppercase tracking-wide text-v2-subtle">Latest output</div>
        <p className="font-body text-[11px] leading-snug text-v2-heading">{agent.output}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button type="button" className="flex-1 rounded-xl border border-v2-border bg-white py-1.5 font-body text-[10px] font-medium text-v2-heading hover:bg-v2-page transition-colors">
          Review output
        </button>
        {AGENT_WORKSPACE_PAGE[agent.id] ? (
          <button type="button" onClick={() => onNavigate?.(AGENT_WORKSPACE_PAGE[agent.id])} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-v2-purple py-1.5 font-body text-[10px] font-medium text-white hover:opacity-90 transition-opacity">
            <FileText className="h-3 w-3" /> Open workspace ↗
          </button>
        ) : (
          <button type="button" onClick={() => onNavigate?.("ai-staff-chat")} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-v2-purple py-1.5 font-body text-[10px] font-medium text-white hover:opacity-90 transition-opacity">
            <MessageSquare className="h-3 w-3" /> Chat ↗
          </button>
        )}
      </div>
    </div>
  );
}

function AvailableCard({ agent, locked, lockLabel }) {
  return (
    <div className={cn("relative rounded-2xl border bg-white p-3.5 transition-shadow", locked ? "opacity-60" : "hover:shadow-sm border-v2-border")}>
      <span className="absolute right-3 top-3 rounded-lg px-2 py-0.5 font-body text-[10px] font-semibold" style={{ background: locked ? "#f3f4f6" : "#EEEDFE", color: locked ? "#9ca3af" : "#3C3489" }}>
        {agent.price}
      </span>
      <div className="mb-2.5 flex items-start gap-2.5">
        <AgentAvatar initials={agent.initials} bg={locked ? "#f3f4f6" : agent.bg} color={locked ? "#9ca3af" : agent.color} size={38} />
        <div className="min-w-0 flex-1 pr-12">
          <div className="font-body text-[12px] font-semibold text-v2-heading">{agent.name}</div>
          <div className="font-body text-[10px] text-v2-muted">{agent.role}</div>
        </div>
      </div>
      <p className="mb-3 font-body text-[11px] leading-snug text-v2-muted">{agent.task}</p>
      {locked ? (
        <button type="button" disabled className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 py-2 font-body text-[10px] font-medium text-gray-400">
          <Lock className="h-3 w-3" /> {lockLabel}
        </button>
      ) : (
        <button type="button" className="w-full rounded-xl bg-v2-purple py-2 font-body text-[10px] font-medium text-white hover:opacity-90 transition-opacity">
          Hire · {agent.price} ↗
        </button>
      )}
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
export default function V2AIStaffManage({ onChat, onNavigate }) {
  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-v2-page">

      {/* ── Main content — block container so children keep natural heights ── */}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">

        {/* Hero banner */}
        <div className="rounded-2xl border border-v2-border bg-white p-5">
          <div className="flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#EEEDFE] px-3 py-1 font-body text-[10px] font-semibold text-v2-purple">
                <Zap className="h-3 w-3" /> AI Staff — HealthTrack
              </div>
              <h1 className="mb-1.5 font-heading text-[20px] font-semibold leading-tight text-v2-heading">
                Your AI startup team.<br />Hire for less than $100/month.
              </h1>
              <p className="mb-4 font-body text-[12px] leading-relaxed text-v2-muted">
                Every AI staff member knows your startup's stage, weekly goals, execution history, traction data, and team structure. Not generic AI — contextual AI teammates built around HealthTrack.
              </p>
              <div className="rounded-xl border-l-[3px] border-v2-purple bg-v2-page px-4 py-3">
                <div className="mb-1 font-body text-[9px] font-semibold uppercase tracking-wider text-v2-purple">Current startup context loaded</div>
                <p className="font-body text-[12px] leading-relaxed text-v2-heading">
                  Stage 1 · Idea &amp; Validation · Week 4 · Score 78 · 5 team members · 8 interviews done · Pre-revenue · Lagos, Nigeria · HealthTech
                </p>
              </div>
            </div>

            {/* Bundle box — wider + larger text for better balance */}
            <div className="shrink-0 text-center">
              <div className="w-[188px] rounded-2xl border-2 border-[#AFA9EC] bg-[#EEEDFE] p-5">
                <div className="font-heading text-[38px] font-bold leading-none text-[#3C3489]">$99</div>
                <div className="mt-0.5 font-body text-[12px] text-v2-purple">/month</div>
                <div className="my-2 font-body text-[13px] font-semibold text-[#3C3489]">Full team bundle</div>
                <div className="mb-4 font-body text-[11px] text-v2-purple">All 13 AI staff roles</div>
                <button type="button" className="w-full rounded-xl bg-v2-purple py-2.5 font-body text-[12px] font-medium text-white hover:opacity-90 transition-opacity">
                  Upgrade to bundle
                </button>
              </div>
              <div className="mt-2.5 text-center">
                <div className="font-body text-[10px] text-v2-muted">vs hiring 1 junior employee</div>
                <div className="mt-0.5 font-body text-[13px] font-semibold text-v2-purple">Save $4,900+/mo</div>
              </div>
            </div>
          </div>
        </div>

        {/* Hired staff */}
        <div className="rounded-2xl border border-v2-border bg-white p-4">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <div className="font-heading text-[13px] font-semibold text-v2-heading">Your hired AI staff</div>
              <div className="mt-0.5 font-body text-[11px] text-v2-muted">5 roles active · All aware of HealthTrack context</div>
            </div>
            <span className="rounded-full bg-[#EEEDFE] px-2.5 py-1 font-body text-[10px] font-medium text-v2-purple">Phase 1 · Active</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {HIRED.map((a) => <HiredCard key={a.id} agent={a} onChat={onChat} onNavigate={onNavigate} />)}
          </div>
        </div>

        {/* Available to hire */}
        <div className="rounded-2xl border border-v2-border bg-white p-4">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <div className="font-heading text-[13px] font-semibold text-v2-heading">Available to hire</div>
              <div className="mt-0.5 font-body text-[11px] text-v2-muted">7 roles ready · Phase 2 available now</div>
            </div>
            <span className="rounded-full bg-[#FAEEDA] px-2.5 py-1 font-body text-[10px] font-medium text-[#633806]">Phase 2 · Available now</span>
          </div>

          {AVAILABLE_PHASES.map((phase) => (
            <div key={phase.label} className="mb-5 last:mb-0">
              <div className="mb-3 flex items-center gap-3">
                <span className="shrink-0 font-body text-[10px] font-semibold uppercase tracking-wide text-v2-muted">{phase.label}</span>
                <div className="h-px flex-1 bg-gray-100" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {phase.staff.map((s) => (
                  <AvailableCard key={s.name} agent={s} locked={phase.locked} lockLabel={phase.lockLabel} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex w-[320px] shrink-0 flex-col gap-3 overflow-y-auto border-l border-v2-border bg-white p-4">

        {/* Activity feed */}
        <div className="rounded-2xl bg-v2-page p-3">
          <div className="mb-2 font-heading text-[12px] font-semibold text-v2-heading">AI staff activity feed</div>
          <div className="flex flex-col">
            {ACTIVITY.map((a, i) => (
              <div key={i} className="flex items-start gap-2 border-b border-gray-100 py-2 last:border-b-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-body text-[9px] font-semibold" style={{ background: a.bg, color: a.color }}>
                  {a.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-body text-[11px] font-semibold text-v2-heading">{a.name}</div>
                  <p className="font-body text-[10px] leading-snug text-v2-muted">{a.text}</p>
                  <div className="mt-0.5 font-body text-[9px] text-v2-subtle">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Startup context */}
        <div className="rounded-2xl bg-v2-page p-3">
          <div className="mb-1 font-heading text-[12px] font-semibold text-v2-heading">Startup context loaded</div>
          <p className="mb-2 font-body text-[10px] leading-relaxed text-v2-muted">All AI staff have full awareness of this context. They do not ask for it.</p>
          {CONTEXT.map((r) => (
            <div key={r.k} className="flex items-center justify-between border-b border-gray-100 py-1.5 last:border-b-0">
              <span className="w-16 shrink-0 font-body text-[10px] text-v2-muted">{r.k}</span>
              <span className="font-body text-[10px] font-semibold text-v2-heading">{r.v}</span>
            </div>
          ))}
        </div>

        {/* Monthly spend */}
        <div className="rounded-2xl bg-v2-page p-3">
          <div className="mb-2 font-heading text-[12px] font-semibold text-v2-heading">Monthly AI staff spend</div>
          {[
            { label: "AI Product Manager", val: "$25" },
            { label: "AI Marketing Agent", val: "$20" },
            { label: "AI Growth Analyst",  val: "$10" },
            { label: "AI Finance",         val: "$15" },
            { label: "AI Legal",           val: "$20" },
          ].map((r) => (
            <div key={r.label} className="flex items-center justify-between py-1">
              <span className="font-body text-[11px] text-v2-muted">{r.label}</span>
              <span className="font-body text-[11px] font-semibold text-v2-heading">{r.val}</span>
            </div>
          ))}
          <div className="my-1 h-px bg-gray-200" />
          <div className="flex items-center justify-between py-1">
            <span className="font-body text-[11px] font-semibold text-v2-heading">Current total</span>
            <span className="font-body text-[11px] font-semibold text-v2-purple">$90/mo</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="font-body text-[11px] text-v2-muted">Full bundle (13 roles)</span>
            <span className="font-body text-[11px] font-semibold text-v2-green">$99/mo</span>
          </div>
          <p className="mt-1 font-body text-[10px] text-v2-green">Bundle saves $116+/mo vs hiring individually</p>
        </div>

        {/* Upgrade CTA */}
        <div className="rounded-2xl bg-[#EEEDFE] p-3">
          <div className="mb-1 font-heading text-[12px] font-semibold text-[#3C3489]">Upgrade to full team bundle</div>
          <p className="mb-3 font-body text-[11px] leading-relaxed text-v2-purple">Get all 13 AI staff roles for $99/month. Your Developer Agent alone would unblock James today and save your execution score.</p>
          <button type="button" className="w-full rounded-xl bg-v2-purple py-2.5 font-body text-[11px] font-semibold text-white hover:opacity-90 transition-opacity">
            Upgrade · $99/mo ↗
          </button>
        </div>
      </div>
    </div>
  );
}
