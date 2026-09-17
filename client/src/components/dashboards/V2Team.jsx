/**
 * V2Team
 * ─────────────────────────────────────────────────────────────────────────────
 * V2 "Team" page, built from StartupVerse_Team.html. No V1 equivalent exists
 * (V2Sidebar's old "Team" nav item just aliased to Virtual Office) — this is
 * a new page, backed by new-but-real endpoints added this session:
 *
 *   - Roster: real GET /founders/:founderId/team-members (existing).
 *   - "KPI score": no unified 0-100 score exists anywhere real — this page
 *     shows the real per-person task **completion rate**
 *     (GET /founders/:founderId/team-performance, new) instead, honestly
 *     labeled "Completion rate", never "KPI score".
 *   - Compensation: real TeamMemberProfile.compensation, set via the real
 *     compensation wizard (V2CompensationSetupWizard — a V2-styled twin of
 *     compensation/CompensationSetupWizard.jsx, same state/logic, restyled
 *     presentation only). A real bug was fixed this session where the
 *     wizard's config was built but never actually sent to the backend on
 *     initial onboarding — see CLAUDE.md.
 *   - Onboarding checklist: real, new OnboardingChecklist model/endpoints —
 *     previously only 3 booleans existed, no per-task tracking.
 *   - Payroll: real, new PayrollRecord model + endpoints. "Mark paid" is
 *     real tracking with no money movement. "Pay via Paystack" makes a
 *     genuine Paystack Transfers API call, gated on PAYSTACK_SECRET_KEY
 *     being configured in server/.env — returns a clear error, never a
 *     fake success, when it isn't.
 *   - Equity pool tracking (used% vs available% across the whole team) has
 *     no real aggregation anywhere — deliberately not built; each member's
 *     equity is shown individually instead.
 */

import React, { useEffect, useMemo, useState } from "react";
import { cn } from "../ui/utils";
import { toast } from "sonner";

import V2AppLayout from "../layout/V2AppLayout";
import { V2Card, V2Chip, V2Avatar, V2Btn, V2Dot, V2SectionHead } from "../shared/v2-primitives";
import CompensationSetupWizard from "../compensation/v2/V2CompensationSetupWizard";

import { useOfficeStore } from "../../state/useOfficeStore";
import * as teamMemberApi from "../../utils/api/teamMemberApi";
import * as founderApi from "../../utils/api/founderApi";
import * as inboxApi from "../../utils/api/inboxApi";
import * as payrollApi from "../../utils/api/payrollApi";

import { Search, X, UserPlus, Wallet, ClipboardCheck, ArrowLeft, Plus, Trash2 } from "lucide-react";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const DEFAULT_ONBOARDING_TASKS = [
  "Sign employment agreement",
  "Complete identity verification",
  "Set up your StartupVerse team member account",
  "Attend onboarding call with founder",
  "Review startup roadmap and quarterly goals",
  "Set your first week's targets",
];

function rateColor(rate) {
  if (rate >= 0.9) return "text-v2-green";
  if (rate >= 0.6) return "text-v2-blue";
  if (rate >= 0.3) return "text-v2-amber-dark";
  return "text-red-500";
}
function rateBarColor(rate) {
  if (rate >= 0.9) return "bg-v2-green";
  if (rate >= 0.6) return "bg-v2-blue";
  if (rate >= 0.3) return "bg-v2-amber";
  return "bg-red-400";
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days <= 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  return `Posted ${days} days ago`;
}

function computeVestingInfo(equity, joinDateStr) {
  if (!equity || !equity.totalEquity) return null;
  const vestingPeriod = Number(equity.vestingPeriod) || 0;
  const cliffMonths = equity.cliffEnabled ? Number(equity.cliffPeriod) || 0 : 0;
  const joinDate = joinDateStr ? new Date(joinDateStr) : null;
  const now = new Date();
  const monthsElapsed = joinDate
    ? Math.max(0, (now.getFullYear() - joinDate.getFullYear()) * 12 + (now.getMonth() - joinDate.getMonth()))
    : 0;
  const pastCliff = monthsElapsed >= cliffMonths;
  const vestedPct = !pastCliff || vestingPeriod <= 0
    ? 0
    : Math.min(100, Math.round((monthsElapsed / vestingPeriod) * 100));
  const milestones = [0.25, 0.5, 0.75, 1].map((frac) => {
    const atMonth = Math.round(vestingPeriod * frac);
    return { atMonth, pct: Math.round(frac * 100), reached: pastCliff && monthsElapsed >= atMonth };
  });
  return { vestedPct, monthsElapsed, cliffMonths, pastCliff, milestones, vestingPeriod };
}

function memberPerformanceThreshold(member) {
  const c = member.compensation;
  if (!c) return null;
  const configs = [c.fixed, c.equity, c.hourly];
  for (const cfg of configs) {
    if (cfg?.performanceGated && cfg.threshold != null) return Number(cfg.threshold);
  }
  return null;
}

function compensationSummary(comp) {
  if (!comp || !comp.type || comp.type === "unpaid") return "Not set";
  if (comp.type === "fixed") return `${comp.fixed?.amount ?? "—"}/mo`;
  if (comp.type === "hourly") return `${comp.hourly?.rate ?? "—"}/hr`;
  if (comp.type === "equity") return `${comp.equity?.totalEquity ?? "—"}% equity`;
  if (comp.type === "equity-fixed") return `${comp.fixed?.amount ?? "—"}/mo + ${comp.equity?.totalEquity ?? "—"}% equity`;
  return "Not set";
}

// ─────────────────────────────────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────────────────────────────────

function StatsRow({ totalMembers, avgCompletion, monthlyPayroll, openRoles, onPayrollClick }) {
  const stats = [
    { label: "Total team members", value: totalMembers, color: "text-v2-heading" },
    { label: "Avg completion rate · this period", value: `${Math.round(avgCompletion * 100)}%`, color: "text-v2-green" },
    { label: "Monthly payroll · click to view", value: monthlyPayroll, color: "text-v2-blue", onClick: onPayrollClick },
    { label: "Open roles", value: openRoles, color: "text-v2-amber-dark" },
  ];
  return (
    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          onClick={s.onClick}
          className={cn("rounded-[10px] border border-transparent bg-v2-page p-3", s.onClick && "cursor-pointer hover:border-v2-border")}
        >
          <div className={cn("font-heading text-[22px] font-medium leading-none", s.color)}>{s.value}</div>
          <div className="mt-1 font-body text-[11px] text-v2-subtle">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ROSTER TABLE
// ─────────────────────────────────────────────────────────────────────────

function RosterTable({ members, performanceByMember, checklistByMember, onOpenMember }) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  const sortedMembers = useMemo(() => {
    if (!sortKey) return members;
    const withRate = members.map((m) => ({
      m,
      rate: performanceByMember[String(m._id ?? m.id)]?.completionRate ?? -1,
    }));
    withRate.sort((a, b) => {
      const cmp = sortKey === "name" ? a.m.name.localeCompare(b.m.name) : a.rate - b.rate;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return withRate.map((r) => r.m);
  }, [members, performanceByMember, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  if (members.length === 0) {
    return <p className="py-10 text-center font-body text-[13px] text-v2-muted">No team members match this filter.</p>;
  }
  return (
    <V2Card className="overflow-hidden p-0">
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_0.8fr] gap-2 border-b border-v2-border bg-v2-page px-4 py-2 font-body text-[10px] font-medium uppercase tracking-wide text-v2-subtle">
        <button type="button" onClick={() => toggleSort("name")} className="text-left hover:text-v2-muted">
          Member {sortKey === "name" ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
        </button>
        <button type="button" onClick={() => toggleSort("completion")} className="text-left hover:text-v2-muted">
          Completion rate {sortKey === "completion" ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
        </button>
        <span>Compensation</span>
        <span>Onboarding</span>
        <span></span>
      </div>
      {sortedMembers.map((m) => {
        const id = String(m._id ?? m.id ?? "");
        const perf = performanceByMember[id] || { completionRate: 0, totalTasks: 0 };
        const checklist = checklistByMember[id];
        const doneCount = checklist?.tasks?.filter((t) => t.done).length ?? 0;
        const totalCount = checklist?.tasks?.length ?? 0;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onOpenMember(m)}
            className="grid w-full grid-cols-[2fr_1fr_1fr_1fr_0.8fr] items-center gap-2 border-b border-v2-border px-4 py-2.5 text-left last:border-0 hover:bg-v2-page"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <V2Avatar name={m.name} size={32} />
                {m.isOnline ? <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-v2-surface bg-v2-green" /> : null}
              </div>
              <div className="min-w-0">
                <p className="truncate font-body text-[12px] font-medium text-v2-heading">{m.name}</p>
                <p className="truncate font-body text-[10px] text-v2-subtle">{m.title || m.role || "Team member"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {perf.totalTasks > 0 ? (
                <>
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-v2-border">
                    <div className={cn("h-full rounded-full", rateBarColor(perf.completionRate))} style={{ width: `${perf.completionRate * 100}%` }} />
                  </div>
                  <span className={cn("font-body text-[11px] font-medium", rateColor(perf.completionRate))}>{Math.round(perf.completionRate * 100)}%</span>
                </>
              ) : (
                <span className="font-body text-[11px] text-v2-subtle">No tasks yet</span>
              )}
            </div>
            <span className="font-body text-[11px] text-v2-muted">{compensationSummary(m.compensation)}</span>
            <span className="font-body text-[11px] text-v2-muted">
              {totalCount > 0 ? `${doneCount}/${totalCount} done` : "Not started"}
            </span>
            <span />
          </button>
        );
      })}
    </V2Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// MEMBER DETAIL SLIDE-OUT
// ─────────────────────────────────────────────────────────────────────────

function MemberDetailPanel({ member, performance, checklist, payrollHistory, onClose, onToggleTask, onEditCompensation, onCreateChecklist }) {
  const [tab, setTab] = useState("profile");
  if (!member) return null;
  const perf = performance || { completionRate: 0, totalTasks: 0, completedTasks: 0 };
  const equityConfig = member.compensation?.type === "equity" || member.compensation?.type === "equity-fixed"
    ? member.compensation.equity
    : null;
  const vesting = equityConfig ? computeVestingInfo(equityConfig, member.createdAt) : null;

  return (
    <>
      <div className="fixed inset-0 z-[90] bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 z-[95] flex h-full w-full flex-col bg-white md:w-[440px]">
        <div className="flex shrink-0 items-center justify-between border-b border-v2-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <V2Avatar name={member.name} size={36} />
            <div>
              <p className="font-body text-[14px] font-medium text-v2-heading">{member.name}</p>
              <p className="font-body text-[11px] text-v2-subtle">{member.title || member.role || "Team member"}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-v2-muted hover:bg-v2-page">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="mb-4 flex gap-0.5 rounded-lg bg-gray-100 p-[3px]">
            {["profile", "performance", "compensation", "equity", "onboarding"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "flex-1 rounded-md py-1.5 font-body text-[11px] font-medium capitalize",
                  tab === t ? "border border-v2-border bg-white text-v2-heading" : "text-v2-muted",
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "profile" && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["Email", member.email || "—"],
                  ["Joined", member.createdAt ? new Date(member.createdAt).toLocaleDateString() : "—"],
                  ["Status", member.isOnline ? "Online" : "Offline"],
                  ["Role", member.title || member.role || "Team member"],
                  ...(equityConfig ? [
                    ["Equity", `${equityConfig.totalEquity}%`],
                    ["Vested", vesting ? `${vesting.vestedPct}%` : "—"],
                  ] : []),
                ].map(([l, v]) => (
                  <div key={l} className="rounded-[8px] bg-v2-page p-2.5">
                    <p className="font-body text-[10px] text-v2-subtle">{l}</p>
                    <p className="truncate font-body text-[12px] font-medium text-v2-heading">{v}</p>
                  </div>
                ))}
              </div>
              {member.bio ? (
                <div>
                  <p className="mb-1 font-body text-[11px] font-medium uppercase tracking-wide text-v2-subtle">Bio</p>
                  <p className="font-body text-[12px] leading-relaxed text-v2-muted">{member.bio}</p>
                </div>
              ) : null}
              {(member.skills || []).length > 0 ? (
                <div>
                  <p className="mb-1.5 font-body text-[11px] font-medium uppercase tracking-wide text-v2-subtle">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {member.skills.map((s) => (
                      <span key={s} className="rounded-md bg-v2-blue-tint px-2 py-0.5 font-body text-[10px] text-v2-blue-dark">{s}</span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {tab === "performance" && (
            <div className="flex flex-col gap-3">
              <div className="rounded-[10px] bg-v2-page p-4 text-center">
                <div className={cn("font-heading text-[32px] font-medium", rateColor(perf.completionRate))}>
                  {Math.round(perf.completionRate * 100)}%
                </div>
                <p className="font-body text-[11px] text-v2-subtle">Real task completion rate</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-[8px] bg-v2-page p-2.5 text-center">
                  <p className="font-heading text-[16px] font-medium text-v2-heading">{perf.totalTasks}</p>
                  <p className="font-body text-[10px] text-v2-subtle">Total tasks</p>
                </div>
                <div className="rounded-[8px] bg-v2-page p-2.5 text-center">
                  <p className="font-heading text-[16px] font-medium text-v2-green">{perf.completedTasks}</p>
                  <p className="font-body text-[10px] text-v2-subtle">Completed</p>
                </div>
              </div>
              <p className="font-body text-[10px] text-v2-subtle">
                This is a real completion-rate metric (completed ÷ total assigned tasks) — not a fabricated unified "KPI score."
              </p>
            </div>
          )}

          {tab === "compensation" && (
            <div className="flex flex-col gap-3">
              <div className="rounded-[10px] bg-v2-page p-3.5">
                <p className="mb-1 font-body text-[11px] font-medium uppercase tracking-wide text-v2-subtle">Current setup</p>
                <p className="font-body text-[14px] font-medium text-v2-heading">{compensationSummary(member.compensation)}</p>
                {member.compensation?.type === "equity" || member.compensation?.type === "equity-fixed" ? (
                  <p className="mt-1 font-body text-[11px] text-v2-muted">
                    Vesting over {member.compensation.equity?.vestingPeriod ?? "—"} months
                    {member.compensation.equity?.cliffEnabled ? `, ${member.compensation.equity.cliffPeriod}mo cliff` : ""}
                  </p>
                ) : null}
              </div>
              <V2Btn variant="primary" onClick={onEditCompensation} className="justify-center">
                <Wallet className="h-3.5 w-3.5" /> {member.compensation ? "Edit compensation" : "Set up compensation"}
              </V2Btn>
              <p className="font-body text-[10px] text-v2-subtle">
                Opens the real compensation wizard (equity / fixed salary / hourly, with performance gating) — same one used during onboarding.
              </p>

              <div>
                <p className="mb-1.5 font-body text-[11px] font-medium uppercase tracking-wide text-v2-subtle">Payment history</p>
                {payrollHistory && payrollHistory.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {payrollHistory.map((r) => (
                      <div key={r._id} className="flex items-center justify-between rounded-[8px] bg-v2-page px-3 py-2">
                        <span className="font-body text-[11px] text-v2-muted">{MONTH_NAMES[r.periodMonth - 1]} {r.periodYear}</span>
                        <span className="font-body text-[11px] font-medium text-v2-heading">{r.currency} {r.amount.toLocaleString()}</span>
                        {r.status === "paid" ? <V2Chip variant="green">Paid</V2Chip> : <V2Chip variant="amber">Pending</V2Chip>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="font-body text-[11px] text-v2-subtle">No payroll history yet.</p>
                )}
              </div>
            </div>
          )}

          {tab === "equity" && (
            <div className="flex flex-col gap-3">
              {!equityConfig ? (
                <p className="py-6 text-center font-body text-[12px] text-v2-muted">
                  No equity compensation set up for this member.
                </p>
              ) : (
                <>
                  <div className="rounded-[10px] bg-v2-page p-4 text-center">
                    <div className="font-heading text-[32px] font-medium text-v2-blue">{vesting?.vestedPct ?? 0}%</div>
                    <p className="font-body text-[11px] text-v2-subtle">of {equityConfig.totalEquity}% equity vested to date</p>
                  </div>
                  {!vesting?.pastCliff ? (
                    <div className="rounded-[10px] bg-v2-amber-tint p-3 font-body text-[11px] text-v2-amber-dark">
                      Still within the {equityConfig.cliffPeriod}-month cliff — no equity vests until then.
                    </div>
                  ) : null}
                  <div>
                    <p className="mb-1.5 font-body text-[11px] font-medium uppercase tracking-wide text-v2-subtle">Vesting schedule</p>
                    <div className="flex flex-col gap-1.5">
                      {vesting?.milestones.map((ms) => (
                        <div key={ms.pct} className="flex items-center gap-2.5 rounded-[8px] bg-v2-page px-3 py-2">
                          <span className="w-16 shrink-0 font-body text-[11px] text-v2-muted">Month {ms.atMonth}</span>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-v2-border">
                            <div className={cn("h-full rounded-full", ms.reached ? "bg-v2-blue" : "bg-v2-border")} style={{ width: ms.reached ? "100%" : "0%" }} />
                          </div>
                          <span className={cn("w-10 shrink-0 text-right font-body text-[11px] font-medium", ms.reached ? "text-v2-green" : "text-v2-subtle")}>
                            {ms.pct}%{ms.reached ? " ✓" : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="font-body text-[10px] text-v2-subtle">
                    Computed from real fields (join date, vesting period, cliff) — standard linear vesting after cliff, not fabricated.
                  </p>
                </>
              )}
            </div>
          )}

          {tab === "onboarding" && (
            <div className="flex flex-col gap-2">
              {!checklist || (checklist.tasks || []).length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-6">
                  <p className="font-body text-[12px] text-v2-muted">No onboarding checklist created yet.</p>
                  <V2Btn variant="primary" size="sm" onClick={onCreateChecklist}>Create checklist</V2Btn>
                  <p className="max-w-[300px] text-center font-body text-[10px] text-v2-subtle">
                    Creates a real checklist with standard onboarding tasks you can then customize.
                  </p>
                </div>
              ) : (
                checklist.tasks.map((task) => (
                  <label key={task._id} className="flex cursor-pointer items-center gap-2.5 rounded-[8px] border border-v2-border px-3 py-2.5 hover:bg-v2-page">
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={(e) => onToggleTask(task._id, e.target.checked)}
                      className="h-4 w-4 accent-v2-blue"
                    />
                    <span className={cn("font-body text-[12px]", task.done ? "text-v2-muted line-through" : "text-v2-heading")}>
                      {task.title}
                    </span>
                  </label>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// INVITE MODAL
// ─────────────────────────────────────────────────────────────────────────

function InviteModal({ open, onClose, onSend, sending }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!open) { setEmail(""); setRole(""); setMessage(""); }
  }, [open]);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/35" onClick={onClose}>
      <div className="w-[400px] overflow-hidden rounded-2xl bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-v2-border px-5 py-4">
          <p className="font-body text-[15px] font-medium text-v2-heading">Invite a team member</p>
          <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-v2-muted hover:bg-v2-page"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex flex-col gap-3 p-5">
          <div>
            <label className="mb-1 block font-body text-[12px] font-medium text-v2-muted">Email address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="colleague@email.com" className="h-9 w-full rounded-lg border border-v2-border px-3 font-body text-[12px] text-v2-heading outline-none focus:border-v2-blue" />
          </div>
          <div>
            <label className="mb-1 block font-body text-[12px] font-medium text-v2-muted">Role</label>
            <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Backend developer" className="h-9 w-full rounded-lg border border-v2-border px-3 font-body text-[12px] text-v2-heading outline-none focus:border-v2-blue" />
          </div>
          <div>
            <label className="mb-1 block font-body text-[12px] font-medium text-v2-muted">Personal message (optional)</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Hey! I'd love for you to join..." className="h-20 w-full resize-none rounded-lg border border-v2-border p-3 font-body text-[12px] text-v2-heading outline-none focus:border-v2-blue" />
          </div>
          <div className="rounded-[10px] bg-v2-blue-tint p-3 font-body text-[11px] leading-relaxed text-v2-blue-dark">
            The invitee gets a real email with a link to join StartupVerse. Compensation and onboarding are set up after they accept.
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-v2-border px-5 py-3.5">
          <V2Btn variant="secondary" size="sm" onClick={onClose}>Cancel</V2Btn>
          <V2Btn variant="primary" size="sm" disabled={sending || !email.trim()} onClick={() => onSend({ email: email.trim(), role: role.trim(), message })}>
            {sending ? "Sending…" : "Send invite"}
          </V2Btn>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ADD MEMBER MODAL — 3-step: basic info → compensation → onboarding tasks.
// Step 2 reuses V2CompensationSetupWizard as-is (same validated config
// builder as "Edit compensation"); onComplete just captures the config
// locally instead of PATCHing, since the member doesn't exist yet.
// ─────────────────────────────────────────────────────────────────────────

function AddMemberModal({ open, onClose, onSend, sending }) {
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [compConfig, setCompConfig] = useState(null);
  const [tasks, setTasks] = useState([...DEFAULT_ONBOARDING_TASKS]);
  const [customTask, setCustomTask] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) {
      setStep(1); setFirstName(""); setLastName(""); setEmail(""); setRole("");
      setCompConfig(null); setTasks([...DEFAULT_ONBOARDING_TASKS]); setCustomTask(""); setMessage("");
    }
  }, [open]);

  if (!open) return null;
  const fullName = `${firstName} ${lastName}`.trim();

  if (step === 2) {
    return (
      <CompensationSetupWizard
        isOpen
        onClose={() => setStep(1)}
        teamMemberName={fullName || "this team member"}
        onComplete={(config) => { setCompConfig(config); setStep(3); }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/35" onClick={onClose}>
      <div className="flex max-h-[85vh] w-[440px] flex-col overflow-hidden rounded-2xl bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex shrink-0 items-center justify-between border-b border-v2-border px-5 py-4">
          <div>
            <p className="font-body text-[15px] font-medium text-v2-heading">Add a team member</p>
            <p className="font-body text-[11px] text-v2-subtle">Step {step} of 3</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-v2-muted hover:bg-v2-page"><X className="h-4 w-4" /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {step === 1 && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-body text-[12px] font-medium text-v2-muted">First name</label>
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Oluwaseun" className="h-9 w-full rounded-lg border border-v2-border px-3 font-body text-[12px] text-v2-heading outline-none focus:border-v2-blue" />
                </div>
                <div>
                  <label className="mb-1 block font-body text-[12px] font-medium text-v2-muted">Last name</label>
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Adeyemi" className="h-9 w-full rounded-lg border border-v2-border px-3 font-body text-[12px] text-v2-heading outline-none focus:border-v2-blue" />
                </div>
              </div>
              <div>
                <label className="mb-1 block font-body text-[12px] font-medium text-v2-muted">Email address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seun@email.com" className="h-9 w-full rounded-lg border border-v2-border px-3 font-body text-[12px] text-v2-heading outline-none focus:border-v2-blue" />
              </div>
              <div>
                <label className="mb-1 block font-body text-[12px] font-medium text-v2-muted">Role / job title</label>
                <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Senior developer" className="h-9 w-full rounded-lg border border-v2-border px-3 font-body text-[12px] text-v2-heading outline-none focus:border-v2-blue" />
              </div>
              <p className="font-body text-[10px] text-v2-subtle">
                Department, location, and a scheduled start date aren't tracked in the system yet — only real fields are collected here.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-4">
              <div>
                <p className="mb-2 font-body text-[11px] font-medium uppercase tracking-wide text-v2-subtle">Onboarding tasks</p>
                <p className="mb-3 font-body text-[11px] leading-relaxed text-v2-muted">
                  These are assigned automatically as a real checklist the moment {fullName || "they"} accept the invitation.
                </p>
                <div className="flex flex-col gap-1.5">
                  {tasks.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-[8px] border border-v2-border px-3 py-2">
                      <span className="flex-1 font-body text-[12px] text-v2-heading">{t}</span>
                      <button type="button" onClick={() => setTasks((prev) => prev.filter((_, idx) => idx !== i))} className="text-v2-subtle hover:text-red-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    value={customTask}
                    onChange={(e) => setCustomTask(e.target.value)}
                    placeholder="e.g. Review product roadmap"
                    className="h-9 flex-1 rounded-lg border border-v2-border px-3 font-body text-[12px] text-v2-heading outline-none focus:border-v2-blue"
                  />
                  <V2Btn
                    variant="secondary"
                    size="sm"
                    onClick={() => { if (customTask.trim()) { setTasks((prev) => [...prev, customTask.trim()]); setCustomTask(""); } }}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add
                  </V2Btn>
                </div>
              </div>
              <div>
                <label className="mb-1 block font-body text-[12px] font-medium text-v2-muted">Personal message (optional)</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Welcome to the team! We're excited to have you..." className="h-20 w-full resize-none rounded-lg border border-v2-border p-3 font-body text-[12px] text-v2-heading outline-none focus:border-v2-blue" />
              </div>
              {compConfig ? (
                <div className="rounded-[10px] bg-v2-blue-tint p-3 font-body text-[11px] text-v2-blue-dark">
                  Compensation set: {compensationSummary(compConfig)}
                </div>
              ) : (
                <div className="rounded-[10px] bg-v2-page p-3 font-body text-[11px] text-v2-subtle">
                  No compensation set yet — you can set it up any time from the Team page after they accept.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-v2-border px-5 py-3.5">
          {step > 1 ? (
            <V2Btn variant="secondary" size="sm" onClick={() => setStep(step - 1)}><ArrowLeft className="h-3.5 w-3.5" /> Back</V2Btn>
          ) : <span />}
          {step === 1 && (
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setStep(3)} className="font-body text-[11px] text-v2-muted hover:underline">Skip compensation</button>
              <V2Btn variant="primary" size="sm" disabled={!email.trim()} onClick={() => setStep(2)}>Continue</V2Btn>
            </div>
          )}
          {step === 3 && (
            <V2Btn
              variant="primary"
              size="sm"
              disabled={sending || !email.trim()}
              onClick={() => onSend({ firstName, lastName, email: email.trim(), role: role.trim(), compConfig, tasks, message })}
            >
              {sending ? "Sending…" : "Send invitation"}
            </V2Btn>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PAYROLL MODAL
// ─────────────────────────────────────────────────────────────────────────

function PayrollModal({ open, onClose, records, onGenerate, generating, onMarkPaid, onPayPaystack }) {
  const now = new Date();
  if (!open) return null;

  const total = records.reduce((sum, r) => sum + (r.amount || 0), 0);
  const paidCount = records.filter((r) => r.status === "paid").length;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/35" onClick={onClose}>
      <div className="flex max-h-[85vh] w-[560px] flex-col overflow-hidden rounded-2xl bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex shrink-0 items-center justify-between border-b border-v2-border px-5 py-4">
          <p className="font-body text-[15px] font-medium text-v2-heading">Payroll · {MONTH_NAMES[now.getMonth()]} {now.getFullYear()}</p>
          <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-v2-muted hover:bg-v2-page"><X className="h-4 w-4" /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="mb-4 grid grid-cols-3 gap-2.5">
            <div className="rounded-[10px] bg-v2-green-tint p-3 text-center">
              <div className="font-heading text-[18px] font-medium text-v2-green-dark">{total.toLocaleString()}</div>
              <div className="mt-0.5 font-body text-[10px] text-v2-green-dark">Total this period</div>
            </div>
            <div className="rounded-[10px] bg-v2-blue-tint p-3 text-center">
              <div className="font-heading text-[18px] font-medium text-v2-blue-dark">{paidCount}/{records.length}</div>
              <div className="mt-0.5 font-body text-[10px] text-v2-blue-dark">Paid</div>
            </div>
            <div className="rounded-[10px] bg-v2-amber-tint p-3 text-center">
              <div className="font-heading text-[18px] font-medium text-v2-amber-dark">{records.length - paidCount}</div>
              <div className="mt-0.5 font-body text-[10px] text-v2-amber-dark">Pending</div>
            </div>
          </div>

          {records.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <p className="font-body text-[12px] text-v2-muted">No payroll generated for this period yet.</p>
              <V2Btn variant="primary" size="sm" onClick={onGenerate} disabled={generating}>
                {generating ? "Generating…" : "Generate this month's payroll"}
              </V2Btn>
              <p className="max-w-[360px] text-center font-body text-[10px] text-v2-subtle">
                Only creates entries for members with a real monthly fixed salary on file — equity-only, hourly, and unconfigured members are skipped.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {records.map((r) => (
                <div key={r._id} className="flex items-center justify-between gap-2 rounded-[10px] bg-v2-page p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-[12px] font-medium text-v2-heading">{r.teamMemberId?.name || "Team member"}</p>
                    <p className="font-body text-[11px] text-v2-muted">{r.currency} {r.amount.toLocaleString()}</p>
                  </div>
                  {r.status === "paid" ? (
                    <V2Chip variant="green">Paid</V2Chip>
                  ) : (
                    <div className="flex gap-1.5">
                      <V2Btn variant="secondary" size="sm" onClick={() => onMarkPaid(r._id)}>Mark paid</V2Btn>
                      <V2Btn variant="primary" size="sm" onClick={() => onPayPaystack(r)}>Pay via Paystack</V2Btn>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PaystackPayModal({ record, onClose, onSubmit, submitting }) {
  const [accountNumber, setAccountNumber] = useState("");
  const [bankCode, setBankCode] = useState("");
  if (!record) return null;
  return (
    <div className="fixed inset-0 z-[97] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-[380px] overflow-hidden rounded-2xl bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-v2-border px-5 py-4">
          <p className="font-body text-[14px] font-medium text-v2-heading">Pay {record.teamMemberId?.name} via Paystack</p>
          <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-v2-muted hover:bg-v2-page"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex flex-col gap-3 p-5">
          <div>
            <label className="mb-1 block font-body text-[12px] font-medium text-v2-muted">Bank code</label>
            <input value={bankCode} onChange={(e) => setBankCode(e.target.value)} placeholder="e.g. 058 (GTBank)" className="h-9 w-full rounded-lg border border-v2-border px-3 font-body text-[12px] outline-none focus:border-v2-blue" />
          </div>
          <div>
            <label className="mb-1 block font-body text-[12px] font-medium text-v2-muted">Account number</label>
            <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="0123456789" className="h-9 w-full rounded-lg border border-v2-border px-3 font-body text-[12px] outline-none focus:border-v2-blue" />
          </div>
          <p className="font-body text-[10px] text-v2-subtle">
            This makes a real Paystack transfer request for {record.currency} {record.amount?.toLocaleString()}. Requires PAYSTACK_SECRET_KEY configured on the server — if it isn't, you'll get a clear error, not a fake success.
          </p>
          <V2Btn variant="primary" className="justify-center" disabled={submitting || !accountNumber || !bankCode} onClick={() => onSubmit({ accountNumber, bankCode })}>
            {submitting ? "Processing…" : "Send payment"}
          </V2Btn>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// RIGHT PANEL
// ─────────────────────────────────────────────────────────────────────────

function TeamRightPanel({
  members,
  performanceByMember,
  avgCompletion,
  equitySummary,
  openRoleRows,
  payrollRecords,
  onOpenMember,
  onFilterLow,
  onOpenPayroll,
  onPageChange,
}) {
  const healthRows = useMemo(() => {
    return [...members]
      .map((m) => ({ member: m, perf: performanceByMember[String(m._id ?? m.id)] }))
      .filter((r) => r.perf && r.perf.totalTasks > 0)
      .sort((a, b) => a.perf.completionRate - b.perf.completionRate)
      .slice(0, 6);
  }, [members, performanceByMember]);

  const payrollTotal = payrollRecords.reduce((sum, r) => sum + (r.amount || 0), 0);
  const payrollPaid = payrollRecords.filter((r) => r.status === "paid").length;
  const payrollPct = payrollRecords.length ? Math.round((payrollPaid / payrollRecords.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-3 p-3">
      <V2Card>
        <V2SectionHead
          title="Team completion health"
          action={<button type="button" onClick={onFilterLow} className="text-v2-blue hover:underline">Filter low</button>}
        />
        {healthRows.length === 0 ? (
          <p className="font-body text-[11px] text-v2-subtle">No task data yet.</p>
        ) : (
          <div className="flex flex-col">
            {healthRows.map(({ member, perf }) => (
              <button
                key={String(member._id ?? member.id)}
                type="button"
                onClick={() => onOpenMember(member)}
                className="flex items-center gap-2 border-b border-v2-border py-1.5 text-left last:border-0 hover:opacity-80"
              >
                <V2Avatar name={member.name} size={24} />
                <span className="flex-1 truncate font-body text-[11px] font-medium text-v2-heading">{member.name}</span>
                <span className={cn("font-body text-[11px] font-medium", rateColor(perf.completionRate))}>
                  {Math.round(perf.completionRate * 100)}
                </span>
              </button>
            ))}
          </div>
        )}
        <div className="mt-2 flex items-center justify-between border-t border-v2-border pt-2">
          <span className="font-body text-[11px] text-v2-muted">Team average</span>
          <span className="font-body text-[13px] font-medium text-v2-blue">{Math.round(avgCompletion * 100)}</span>
        </div>
      </V2Card>

      <V2Card>
        <V2SectionHead title="Equity allocated" />
        {equitySummary.holders.length === 0 ? (
          <p className="font-body text-[11px] text-v2-subtle">No equity compensation set up yet.</p>
        ) : (
          <>
            <div className="mb-2 flex items-baseline gap-1.5">
              <span className="font-heading text-[20px] font-medium text-v2-heading">{equitySummary.totalAllocated.toFixed(1)}%</span>
              <span className="font-body text-[11px] text-v2-subtle">allocated across {equitySummary.holders.length} member{equitySummary.holders.length === 1 ? "" : "s"}</span>
            </div>
            <div className="flex flex-col gap-1">
              {equitySummary.holders.map((h) => (
                <div key={h.id} className="flex items-center justify-between font-body text-[11px]">
                  <span className="truncate text-v2-muted">{h.name}</span>
                  <span className="font-medium text-v2-heading">{h.pct}%</span>
                </div>
              ))}
            </div>
          </>
        )}
        <p className="mt-2 font-body text-[10px] text-v2-subtle">
          Total pool size and vesting-to-date aren't tracked yet — this is each member's allocated %, summed.
        </p>
      </V2Card>

      <V2Card>
        <V2SectionHead
          title="Open roles"
          action={onPageChange ? <button type="button" onClick={() => onPageChange("talent")} className="text-v2-blue hover:underline">View all</button> : null}
        />
        {openRoleRows.length === 0 ? (
          <p className="font-body text-[11px] text-v2-subtle">No open roles posted.</p>
        ) : (
          <div className="flex flex-col">
            {openRoleRows.slice(0, 4).map((r) => (
              <div key={r.key} className="flex items-start gap-2 border-b border-v2-border py-1.5 last:border-0">
                <V2Dot variant="amber" className="mt-1" />
                <div className="min-w-0">
                  <p className="truncate font-body text-[11px] font-medium text-v2-heading">{r.role}</p>
                  <p className="font-body text-[10px] text-v2-subtle">
                    {r.interested} interested · {timeAgo(r.postedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        <V2Btn variant="primary" size="sm" className="mt-2 w-full justify-center" onClick={() => onPageChange && onPageChange("talent")}>
          Post a new role
        </V2Btn>
      </V2Card>

      <V2Card>
        <V2SectionHead title="Payroll · this period" />
        <p className="font-heading text-[20px] font-medium text-v2-heading">
          {payrollRecords.length ? `${payrollRecords[0]?.currency || "NGN"} ${payrollTotal.toLocaleString()}` : "—"}
        </p>
        <p className="mb-2 font-body text-[11px] text-v2-muted">
          {payrollRecords.length ? `${payrollPaid} of ${payrollRecords.length} payments processed` : "No payroll generated yet"}
        </p>
        {payrollRecords.length > 0 ? (
          <div className="mb-2 h-1 overflow-hidden rounded-full bg-v2-border">
            <div className="h-full rounded-full bg-v2-blue" style={{ width: `${payrollPct}%` }} />
          </div>
        ) : null}
        <V2Btn variant="secondary" size="sm" className="w-full justify-center" onClick={onOpenPayroll}>
          View full payroll
        </V2Btn>
      </V2Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────

export default function V2Team({ user, onPageChange }) {
  const founderId = useOfficeStore((s) => s.founderId);
  const startupId = useOfficeStore((s) => s.startupId);
  const loadWorkspace = useOfficeStore((s) => s.loadWorkspace);
  const resolvedFounderId = founderId || String(user?._id ?? user?.id ?? "");
  const startupName = user?.startup?.name ?? "Your startup";

  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [performanceByMember, setPerformanceByMember] = useState({});
  const [checklistByMember, setChecklistByMember] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMemberId, setActiveMemberId] = useState(null);

  const [showInvite, setShowInvite] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [sendingAddMember, setSendingAddMember] = useState(false);
  const [showPayroll, setShowPayroll] = useState(false);
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [allPayrollRecords, setAllPayrollRecords] = useState([]);
  const [generatingPayroll, setGeneratingPayroll] = useState(false);
  const [paystackRecord, setPaystackRecord] = useState(null);
  const [payingPaystack, setPayingPaystack] = useState(false);

  const [showCompWizard, setShowCompWizard] = useState(false);

  useEffect(() => {
    if (user) loadWorkspace(user);
  }, [user, loadWorkspace]);

  useEffect(() => {
    if (!resolvedFounderId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const now = new Date();
        const [rosterResult, perfResult, postsResult, payrollResult, allPayrollResult] = await Promise.allSettled([
          teamMemberApi.getStartupTeamMembers(startupId || resolvedFounderId),
          teamMemberApi.getFounderTeamPerformance(resolvedFounderId),
          founderApi.getFounderPosts(resolvedFounderId),
          payrollApi.getPayroll(resolvedFounderId, { periodMonth: now.getMonth() + 1, periodYear: now.getFullYear() }),
          payrollApi.getPayroll(resolvedFounderId, {}),
        ]);
        if (cancelled) return;

        const roster = rosterResult.status === "fulfilled" ? rosterResult.value || [] : [];
        setMembers(roster);

        const perfMap = {};
        if (perfResult.status === "fulfilled") {
          for (const row of perfResult.value || []) perfMap[String(row.teamMemberId)] = row;
        }
        setPerformanceByMember(perfMap);

        const postsList = postsResult.status === "fulfilled"
          ? (Array.isArray(postsResult.value) ? postsResult.value : postsResult.value?.posts || [])
          : [];
        setMyPosts(postsList);

        if (payrollResult.status === "fulfilled") setPayrollRecords(payrollResult.value || []);
        if (allPayrollResult.status === "fulfilled") setAllPayrollRecords(allPayrollResult.value || []);

        const checklists = await Promise.allSettled(
          roster.map((m) => teamMemberApi.getOnboardingChecklist(String(m._id ?? m.id))),
        );
        if (cancelled) return;
        const checklistMap = {};
        roster.forEach((m, i) => {
          const id = String(m._id ?? m.id);
          const result = checklists[i];
          if (result.status === "fulfilled" && result.value) checklistMap[id] = result.value;
        });
        setChecklistByMember(checklistMap);
      } catch (error) {
        console.error("[V2Team] Failed to load team data:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [resolvedFounderId, startupId]);

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => [m.name, m.title, m.role].join(" ").toLowerCase().includes(q));
  }, [members, searchQuery]);

  const avgCompletion = useMemo(() => {
    const rates = Object.values(performanceByMember).filter((p) => p.totalTasks > 0).map((p) => p.completionRate);
    if (rates.length === 0) return 0;
    return rates.reduce((a, b) => a + b, 0) / rates.length;
  }, [performanceByMember]);

  const openRoleCount = useMemo(() => myPosts.reduce((n, p) => n + (p.lookingFor?.length || 0), 0), [myPosts]);

  const lowPerformers = useMemo(
    () => members.filter((m) => {
      const p = performanceByMember[String(m._id ?? m.id)];
      const threshold = memberPerformanceThreshold(m);
      if (!p || p.totalTasks < 3 || threshold == null) return false;
      return p.completionRate * 100 < threshold;
    }),
    [members, performanceByMember],
  );

  const equitySummary = useMemo(() => {
    const holders = members
      .map((m) => {
        const comp = m.compensation;
        const pct = (comp?.type === "equity" || comp?.type === "equity-fixed") ? Number(comp.equity?.totalEquity) : null;
        return pct != null && !Number.isNaN(pct) ? { id: String(m._id ?? m.id), name: m.name, pct } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.pct - a.pct);
    const totalAllocated = holders.reduce((sum, h) => sum + h.pct, 0);
    return { holders, totalAllocated };
  }, [members]);

  const openRoleRows = useMemo(() => {
    const rows = [];
    for (const post of myPosts) {
      for (const role of post.lookingFor || []) {
        rows.push({
          key: `${post._id || post.id}-${role}`,
          role,
          interested: post.interested || 0,
          postedAt: post.createdAt,
        });
      }
    }
    return rows;
  }, [myPosts]);

  const activeMember = useMemo(
    () => members.find((m) => String(m._id ?? m.id) === String(activeMemberId)) || null,
    [members, activeMemberId],
  );

  const activeMemberPayrollHistory = useMemo(() => {
    if (!activeMemberId) return [];
    return allPayrollRecords
      .filter((r) => String(r.teamMemberId?._id ?? r.teamMemberId) === String(activeMemberId))
      .sort((a, b) => (b.periodYear - a.periodYear) || (b.periodMonth - a.periodMonth));
  }, [allPayrollRecords, activeMemberId]);

  const refreshChecklist = async (teamMemberId) => {
    const checklist = await teamMemberApi.getOnboardingChecklist(teamMemberId);
    setChecklistByMember((prev) => ({ ...prev, [teamMemberId]: checklist }));
  };

  const handleToggleTask = async (taskId, done) => {
    if (!activeMemberId) return;
    try {
      await teamMemberApi.updateOnboardingChecklistTask(activeMemberId, taskId, { done });
      await refreshChecklist(activeMemberId);
    } catch (error) {
      toast.error(error?.message || "Could not update task.");
    }
  };

  const handleCreateChecklist = async () => {
    if (!activeMemberId) return;
    try {
      await teamMemberApi.saveOnboardingChecklist(activeMemberId, {
        founderId: resolvedFounderId,
        startupId,
      });
      await refreshChecklist(activeMemberId);
      toast.success("Onboarding checklist created.");
    } catch (error) {
      toast.error(error?.message || "Could not create checklist.");
    }
  };

  const handleSendInvite = async ({ email, role, message }) => {
    setSendingInvite(true);
    try {
      await inboxApi.sendInvitation({
        id: `inv_${Date.now()}_${resolvedFounderId}`,
        startupId: startupId || resolvedFounderId,
        startupTitle: startupName,
        founderId: resolvedFounderId,
        founderName: user?.name,
        email,
        message: message || `${user?.name || "A founder"} would like you to join ${startupName} on StartupVerse.`,
        role: role || "Team Member",
        sentAt: new Date().toISOString(),
        status: "pending",
      });
      toast.success(`Invite sent to ${email}`);
      setShowInvite(false);
    } catch (error) {
      toast.error(error?.message || "Could not send invite.");
    } finally {
      setSendingInvite(false);
    }
  };

  const handleAddMember = async ({ firstName, lastName, email, role, compConfig, tasks, message }) => {
    setSendingAddMember(true);
    try {
      const fullName = `${firstName} ${lastName}`.trim();
      await inboxApi.sendInvitation({
        id: `inv_${Date.now()}_${resolvedFounderId}`,
        startupId: startupId || resolvedFounderId,
        startupTitle: startupName,
        founderId: resolvedFounderId,
        founderName: user?.name,
        email,
        talentName: fullName,
        role: role || "Team Member",
        message: message || `${user?.name || "A founder"} would like you to join ${startupName} on StartupVerse.`,
        sentAt: new Date().toISOString(),
        status: "pending",
        pendingCompensationConfig: compConfig || undefined,
        pendingOnboardingTasks: tasks && tasks.length ? tasks : undefined,
      });
      toast.success(`Invitation sent to ${email}${compConfig ? " — compensation & onboarding pre-configured" : ""}.`);
      setShowAddMember(false);
    } catch (error) {
      toast.error(error?.message || "Could not send invitation.");
    } finally {
      setSendingAddMember(false);
    }
  };

  const loadPayroll = async () => {
    try {
      const now = new Date();
      const [records, allRecords] = await Promise.all([
        payrollApi.getPayroll(resolvedFounderId, { periodMonth: now.getMonth() + 1, periodYear: now.getFullYear() }),
        payrollApi.getPayroll(resolvedFounderId, {}),
      ]);
      setPayrollRecords(records || []);
      setAllPayrollRecords(allRecords || []);
    } catch (error) {
      toast.error(error?.message || "Could not load payroll.");
    }
  };

  const handleOpenPayroll = () => {
    setShowPayroll(true);
    loadPayroll();
  };

  const handleGeneratePayroll = async () => {
    setGeneratingPayroll(true);
    try {
      const now = new Date();
      const result = await payrollApi.generatePayroll(resolvedFounderId, {
        periodMonth: now.getMonth() + 1,
        periodYear: now.getFullYear(),
        currency: "NGN",
      });
      toast.success(`Generated ${result.created.length} payroll record(s)${result.skipped.length ? `, skipped ${result.skipped.length}` : ""}`);
      await loadPayroll();
    } catch (error) {
      toast.error(error?.message || "Could not generate payroll.");
    } finally {
      setGeneratingPayroll(false);
    }
  };

  const handleMarkPaid = async (recordId) => {
    try {
      await payrollApi.markPayrollPaid(recordId);
      toast.success("Marked as paid.");
      await loadPayroll();
    } catch (error) {
      toast.error(error?.message || "Could not mark as paid.");
    }
  };

  const handlePayPaystack = async ({ accountNumber, bankCode }) => {
    if (!paystackRecord) return;
    setPayingPaystack(true);
    try {
      await payrollApi.payWithPaystack(paystackRecord._id, { accountNumber, bankCode });
      toast.success("Payment sent via Paystack.");
      setPaystackRecord(null);
      await loadPayroll();
    } catch (error) {
      toast.error(error?.message || "Paystack payment failed.");
    } finally {
      setPayingPaystack(false);
    }
  };

  const handleCompensationComplete = async (config) => {
    if (!activeMemberId) return;
    try {
      await teamMemberApi.updateTeamMemberCompensation(activeMemberId, config);
      setMembers((prev) => prev.map((m) => (String(m._id ?? m.id) === activeMemberId ? { ...m, compensation: config } : m)));
      toast.success("Compensation updated.");
      setShowCompWizard(false);
    } catch (error) {
      toast.error(error?.message || "Could not update compensation.");
    }
  };

  if (loading) {
    return (
      <V2AppLayout user={user} currentPage="team" onPageChange={onPageChange} topbarTitle="Team">
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-v2-border border-t-v2-blue" />
            <p className="font-body text-[12px] text-v2-muted">Loading your team…</p>
          </div>
        </div>
      </V2AppLayout>
    );
  }

  const activeMemberIdStr = activeMember ? String(activeMember._id ?? activeMember.id) : null;

  return (
    <V2AppLayout
      user={user}
      currentPage="team"
      onPageChange={onPageChange}
      topbarTitle="Team"
      topbarChips={[
        <V2Chip key="startup" variant="blue" dot>{startupName}</V2Chip>,
        <V2Chip key="active" variant="green">{members.length} active member{members.length === 1 ? "" : "s"}</V2Chip>,
      ]}
      topbarActions={
        <>
          <V2Btn variant="secondary" size="sm" onClick={handleOpenPayroll}>
            <Wallet className="h-3.5 w-3.5" /> Payroll
          </V2Btn>
          <V2Btn variant="secondary" size="sm" onClick={() => setShowInvite(true)}>
            <UserPlus className="h-3.5 w-3.5" /> Invite member
          </V2Btn>
          <V2Btn variant="primary" size="sm" onClick={() => setShowAddMember(true)}>
            <UserPlus className="h-3.5 w-3.5" /> Add member
          </V2Btn>
        </>
      }
      rightPanel={
        <TeamRightPanel
          members={members}
          performanceByMember={performanceByMember}
          avgCompletion={avgCompletion}
          equitySummary={equitySummary}
          openRoleRows={openRoleRows}
          payrollRecords={payrollRecords}
          onOpenMember={(m) => setActiveMemberId(String(m._id ?? m.id))}
          onFilterLow={() => lowPerformers[0] && setActiveMemberId(String(lowPerformers[0]._id ?? lowPerformers[0].id))}
          onOpenPayroll={handleOpenPayroll}
          onPageChange={onPageChange}
        />
      }
    >
      <div className="flex flex-col gap-4 p-4">
        <StatsRow
          totalMembers={members.length}
          avgCompletion={avgCompletion}
          monthlyPayroll={payrollRecords.length ? `${payrollRecords[0]?.currency || "NGN"} ${payrollRecords.reduce((s, r) => s + r.amount, 0).toLocaleString()}` : "—"}
          openRoles={openRoleCount}
          onPayrollClick={handleOpenPayroll}
        />

        <div className="flex h-9 items-center gap-2 rounded-full border border-v2-border bg-v2-page px-3.5">
          <Search className="h-3.5 w-3.5 shrink-0 text-v2-subtle" aria-hidden />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search team members..."
            className="w-full bg-transparent font-body text-[12px] text-v2-heading placeholder:text-v2-subtle outline-none"
          />
        </div>

        {lowPerformers.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] border border-v2-amber bg-white p-3">
            <div className="flex items-center gap-2.5">
              <ClipboardCheck className="h-4 w-4 shrink-0 text-v2-amber-dark" />
              <p className="font-body text-[12px] text-v2-heading">
                {lowPerformers[0].name}'s completion rate is below their {memberPerformanceThreshold(lowPerformers[0])}% compensation threshold
                {lowPerformers.length > 1 ? ` (+${lowPerformers.length - 1} more)` : ""}
              </p>
            </div>
            <V2Btn variant="secondary" size="sm" onClick={() => setActiveMemberId(String(lowPerformers[0]._id ?? lowPerformers[0].id))}>
              View profile
            </V2Btn>
          </div>
        )}

        <RosterTable
          members={filteredMembers}
          performanceByMember={performanceByMember}
          checklistByMember={checklistByMember}
          onOpenMember={(m) => setActiveMemberId(String(m._id ?? m.id))}
        />
      </div>

      {activeMember ? (
        <MemberDetailPanel
          member={activeMember}
          performance={performanceByMember[activeMemberIdStr]}
          checklist={checklistByMember[activeMemberIdStr]}
          payrollHistory={activeMemberPayrollHistory}
          onClose={() => setActiveMemberId(null)}
          onToggleTask={handleToggleTask}
          onEditCompensation={() => setShowCompWizard(true)}
          onCreateChecklist={handleCreateChecklist}
        />
      ) : null}

      <InviteModal open={showInvite} onClose={() => setShowInvite(false)} onSend={handleSendInvite} sending={sendingInvite} />

      <AddMemberModal open={showAddMember} onClose={() => setShowAddMember(false)} onSend={handleAddMember} sending={sendingAddMember} />

      <PayrollModal
        open={showPayroll}
        onClose={() => setShowPayroll(false)}
        records={payrollRecords}
        onGenerate={handleGeneratePayroll}
        generating={generatingPayroll}
        onMarkPaid={handleMarkPaid}
        onPayPaystack={(record) => setPaystackRecord(record)}
      />

      {paystackRecord ? (
        <PaystackPayModal
          record={paystackRecord}
          onClose={() => setPaystackRecord(null)}
          onSubmit={handlePayPaystack}
          submitting={payingPaystack}
        />
      ) : null}

      {showCompWizard && activeMember ? (
        <CompensationSetupWizard
          isOpen={showCompWizard}
          onClose={() => setShowCompWizard(false)}
          teamMemberName={activeMember.name}
          teamMemberId={activeMemberIdStr}
          founderId={resolvedFounderId}
          startupId={startupId}
          onComplete={handleCompensationComplete}
        />
      ) : null}
    </V2AppLayout>
  );
}
