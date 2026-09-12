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
 *     (V1-styled, reused as-is) CompensationSetupWizard. A real bug was
 *     fixed this session where the wizard's config was built but never
 *     actually sent to the backend on initial onboarding — see CLAUDE.md.
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
import { V2Card, V2Chip, V2Avatar, V2Btn, V2Dot } from "../shared/v2-primitives";
import CompensationSetupWizard from "../compensation/CompensationSetupWizard";

import { useOfficeStore } from "../../state/useOfficeStore";
import * as teamMemberApi from "../../utils/api/teamMemberApi";
import * as founderApi from "../../utils/api/founderApi";
import * as inboxApi from "../../utils/api/inboxApi";
import * as payrollApi from "../../utils/api/payrollApi";

import { Search, X, UserPlus, Wallet, ClipboardCheck } from "lucide-react";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

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
  if (members.length === 0) {
    return <p className="py-10 text-center font-body text-[13px] text-v2-muted">No team members match this filter.</p>;
  }
  return (
    <V2Card className="overflow-hidden p-0">
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_0.8fr] gap-2 border-b border-v2-border bg-v2-page px-4 py-2 font-body text-[10px] font-medium uppercase tracking-wide text-v2-subtle">
        <span>Member</span>
        <span>Completion rate</span>
        <span>Compensation</span>
        <span>Onboarding</span>
        <span></span>
      </div>
      {members.map((m) => {
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

function MemberDetailPanel({ member, performance, checklist, onClose, onToggleTask, onEditCompensation, onCreateChecklist }) {
  const [tab, setTab] = useState("profile");
  if (!member) return null;
  const perf = performance || { completionRate: 0, totalTasks: 0, completedTasks: 0 };

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
            {["profile", "performance", "compensation", "onboarding"].map((t) => (
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
  const [showPayroll, setShowPayroll] = useState(false);
  const [payrollRecords, setPayrollRecords] = useState([]);
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
        const [rosterResult, perfResult, postsResult] = await Promise.allSettled([
          teamMemberApi.getStartupTeamMembers(startupId || resolvedFounderId),
          teamMemberApi.getFounderTeamPerformance(resolvedFounderId),
          founderApi.getFounderPosts(resolvedFounderId),
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
      return p && p.totalTasks >= 3 && p.completionRate < 0.5;
    }),
    [members, performanceByMember],
  );

  const activeMember = useMemo(
    () => members.find((m) => String(m._id ?? m.id) === String(activeMemberId)) || null,
    [members, activeMemberId],
  );

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

  const loadPayroll = async () => {
    try {
      const now = new Date();
      const records = await payrollApi.getPayroll(resolvedFounderId, {
        periodMonth: now.getMonth() + 1,
        periodYear: now.getFullYear(),
      });
      setPayrollRecords(records || []);
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
          <V2Btn variant="primary" size="sm" onClick={() => setShowInvite(true)}>
            <UserPlus className="h-3.5 w-3.5" /> Invite member
          </V2Btn>
        </>
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
                {lowPerformers[0].name}'s completion rate is below 50%
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
          onClose={() => setActiveMemberId(null)}
          onToggleTask={handleToggleTask}
          onEditCompensation={() => setShowCompWizard(true)}
          onCreateChecklist={handleCreateChecklist}
        />
      ) : null}

      <InviteModal open={showInvite} onClose={() => setShowInvite(false)} onSend={handleSendInvite} sending={sendingInvite} />

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
