/**
 * V2AIFinanceWorkspace — AI Finance agent workspace
 * Built from StartupVerse_AI_Finance.html mockup
 */

import React, { useState } from "react";
import { cn } from "../ui/utils";

/* ── Mock data ────────────────────────────────────────────────────────────── */
const REVENUE_BARS = [
  { label: "W1", val: "₦210K", height: 52,  blue: "#dbe4fb" },
  { label: "W2", val: "₦260K", height: 64,  blue: "#dbe4fb" },
  { label: "W3", val: "₦310K", height: 76,  blue: "#c3d3f8" },
  { label: "W4", val: "₦380K", height: 92,  blue: "#a9c0f4" },
  { label: "W5", val: "₦445K", height: 106, blue: "#7ea3ef" },
  { label: "W6", val: "₦540K", height: 120, blue: "#1B4FD8" },
];

const INVOICES = [
  { id: "inv-1042", initials: "RC", iconBg: "#FAEEDA", iconColor: "#633806", name: "INV-1042 · Reddington Clinic",       sub: "Pilot integration setup fee · Net 14",     amt: "₦180,000", statusLabel: "Awaiting approval", statusBg: "#FCEBEB", statusColor: "#791F1F" },
  { id: "inv-1041", initials: "LH", iconBg: "#EAF3DE", iconColor: "#27500A", name: "INV-1041 · Lagoon Hospital Annex",   sub: "Monthly platform fee · Paid",              amt: "₦95,000",  statusLabel: "Paid",             statusBg: "#EAF3DE", statusColor: "#27500A" },
  { id: "inv-1040", initials: "FC", iconBg: "#EAF3DE", iconColor: "#27500A", name: "INV-1040 · First Care Clinic",       sub: "Monthly platform fee · Paid",              amt: "₦95,000",  statusLabel: "Paid",             statusBg: "#EAF3DE", statusColor: "#27500A" },
  { id: "inv-1039", initials: "DR", iconBg: "#f3f4f6", iconColor: "#6b7280", name: "INV-1039 · Draft — Reddington Clinic", sub: "Month 2 renewal · not yet sent",         amt: "₦95,000",  statusLabel: "Draft",            statusBg: "#f3f4f6", statusColor: "#6b7280" },
];

const LEDGER = [
  { icon: "💵", iconBg: "#EAF3DE", name: "Lagoon Hospital Annex — payment received",  when: "Today, 6:40am",  amt: "+₦95,000",  amtColor: "#1D9E75" },
  { icon: "💳", iconBg: "#FCEBEB", name: "AI hosting & infra — Vercel + Supabase",    when: "Yesterday",      amt: "-₦38,200",  amtColor: "#791F1F" },
  { icon: "👤", iconBg: "#FCEBEB", name: "James S. — Week 5 compensation",             when: "Yesterday",      amt: "-₦180,000", amtColor: "#791F1F" },
  { icon: "💵", iconBg: "#EAF3DE", name: "First Care Clinic — payment received",      when: "3 days ago",     amt: "+₦95,000",  amtColor: "#1D9E75" },
  { icon: "📣", iconBg: "#FCEBEB", name: "Clinic outreach — WhatsApp Business API",   when: "4 days ago",     amt: "-₦4,500",   amtColor: "#791F1F" },
];

const MODALS = {
  "inv-1042": {
    title: "INV-1042 · Reddington Clinic", sub: "₦180,000 · Awaiting your approval",
    body: "Line item: Pilot integration setup fee — per signed scope, Section 3.2. Terms: Net 14, bank transfer to HealthTrack Ltd account. Generated from the signed pilot agreement — no manual figures entered. All payment-related actions always escalate.",
    approveLabel: "Approve & send →", approveToast: "✓ Sent invoice INV-1042",
  },
  "inv-1041": { title: "INV-1041 · Lagoon Hospital Annex", sub: "₦95,000 · Paid", body: "Paid via Stripe, 6:40am today. Monthly platform fee — recurring, auto-generated on the 1st." },
  "inv-1040": { title: "INV-1040 · First Care Clinic",     sub: "₦95,000 · Paid", body: "Paid via bank transfer, 3 days ago." },
  "inv-1039": {
    title: "INV-1039 · Draft — Reddington Clinic", sub: "₦95,000 · Month 2 renewal",
    body: "Drafted automatically ahead of the renewal date. Not sent yet — AI Finance holds drafts until 3 days before due date unless you approve early.",
    approveLabel: "Send now →", approveToast: "Marked to send now",
  },
  "new-invoice": { title: "New invoice", sub: "AI Finance will draft this from your records", body: "Describe who it's for and what it covers — AI Finance will pull the rate from your existing agreements and draft the invoice for your approval.", newMode: true },
};

/* ── Toast ───────────────────────────────────────────────────────────────── */
function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-gray-900 px-5 py-2.5 font-body text-[12px] font-medium text-white shadow-lg">
      {msg}
    </div>
  );
}

/* ── Modal ───────────────────────────────────────────────────────────────── */
function Modal({ data, onClose, onToast }) {
  if (!data) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5" onClick={onClose}>
      <div className="w-full max-w-[440px] overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <div className="font-body text-[14px] font-medium text-v2-heading">{data.title}</div>
            {data.sub && <div className="mt-0.5 font-body text-[11px] text-v2-muted">{data.sub}</div>}
          </div>
          <button type="button" onClick={onClose} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="px-5 py-4 font-body text-[12px] leading-relaxed text-gray-600">
          {data.body}
          {data.newMode && (
            <div className="mt-3">
              <input placeholder="e.g. Reddington Clinic, Month 3 renewal" className="w-full rounded-lg border border-gray-200 px-3 py-2 font-body text-[12px] outline-none focus:border-v2-purple" />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-full border border-v2-border px-4 py-1.5 font-body text-[12px] font-medium text-v2-heading hover:bg-gray-50">
            {data.newMode ? "Cancel" : "Close"}
          </button>
          {data.approveLabel && (
            <button type="button" onClick={() => { onClose(); onToast(data.approveToast); }} className="rounded-full bg-[#1D9E75] px-4 py-1.5 font-body text-[12px] font-medium text-white hover:opacity-90">
              {data.approveLabel}
            </button>
          )}
          {data.newMode && (
            <button type="button" onClick={() => { onClose(); onToast("AI Finance is drafting the invoice"); }} className="rounded-full bg-v2-purple px-4 py-1.5 font-body text-[12px] font-medium text-white hover:opacity-90">
              Draft invoice →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
export default function V2AIFinanceWorkspace({ onBack, onNavigate }) {
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2400); };
  const openModal = (key) => setModal(MODALS[key] ?? null);
  const closeModal = () => setModal(null);

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-v2-page">

      {/* ── Left scrollable column ── */}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">

        {/* Topbar */}
        <div className="flex shrink-0 items-center justify-between gap-3 rounded-2xl border border-v2-border bg-white px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={onBack} className="font-body text-[12px] text-v2-muted hover:text-v2-heading transition-colors">← Back</button>
            <span className="text-gray-300">·</span>
            <span className="font-body text-[12px] text-v2-muted">AI Staff</span>
            <span className="text-gray-300">›</span>
            <span className="font-body text-[13px] font-medium text-v2-heading">AI Finance</span>
            <span className="text-gray-300">·</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FAEEDA] px-2.5 py-1 font-body text-[11px] font-medium text-[#633806]">
              <span className="h-[5px] w-[5px] rounded-full bg-[#BA7517]" />1 pending your approval
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => onNavigate?.("approval-queue")} className="rounded-full border border-v2-border bg-white px-3 py-1.5 font-body text-[12px] font-medium text-v2-heading hover:bg-gray-50 transition-colors">
              Approval queue
            </button>
            <button type="button" onClick={() => openModal("new-invoice")} className="rounded-full bg-v2-purple px-3 py-1.5 font-body text-[12px] font-medium text-white hover:opacity-90 transition-opacity">
              + New invoice
            </button>
          </div>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Cash on hand",           val: "₦2.4M",    sub: "↑ ₦180K if invoice approved",  subColor: "#1D9E75" },
            { label: "Outstanding invoices",   val: "₦180K",    sub: "1 pending your approval",       subColor: "" },
            { label: "Revenue this month",     val: "₦540K",    sub: "↑ 22% vs last month",           subColor: "#1D9E75" },
            { label: "Runway",                 val: "7.2 mo",   sub: "at current burn rate",          subColor: "" },
          ].map(({ label, val, sub, subColor }) => (
            <div key={label} className="rounded-2xl border border-v2-border bg-white p-4">
              <div className="font-body text-[10px] uppercase tracking-wide text-v2-muted">{label}</div>
              <div className="mt-1.5 font-heading text-[19px] font-medium text-v2-heading">{val}</div>
              <div className="mt-0.5 font-body text-[10px]" style={{ color: subColor || "#6b7280" }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Revenue chart */}
        <div className="rounded-2xl border border-v2-border bg-white p-4">
          <div className="mb-3">
            <div className="font-body text-[13px] font-medium text-v2-heading">Revenue — last 6 weeks</div>
            <div className="mt-0.5 font-body text-[11px] text-v2-muted">AI Finance updates this automatically as invoices are paid</div>
          </div>
          <div className="flex h-[140px] items-end gap-2.5 px-1 pt-2">
            {REVENUE_BARS.map((bar) => (
              <div key={bar.label} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="font-body text-[9px] font-medium text-gray-500">{bar.val}</div>
                <div className="w-full max-w-[28px] rounded-t-[6px]" style={{ height: bar.height, background: bar.blue }} />
                <div className="font-body text-[9px] text-v2-muted">{bar.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Invoices */}
        <div className="rounded-2xl border border-v2-border bg-white p-4">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <div className="font-body text-[13px] font-medium text-v2-heading">Invoices</div>
              <div className="mt-0.5 font-body text-[11px] text-v2-muted">Drafted from signed agreements — sending always needs your approval</div>
            </div>
            <button type="button" onClick={() => onNavigate?.("approval-queue")} className="font-body text-[11px] text-[#185FA5] hover:underline">View in queue →</button>
          </div>
          <div className="divide-y divide-gray-100">
            {INVOICES.map((inv) => (
              <button key={inv.id} type="button" onClick={() => openModal(inv.id)} className="flex w-full items-center gap-3 py-2.5 text-left hover:bg-gray-50 transition-colors">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] font-body text-[10px] font-semibold" style={{ background: inv.iconBg, color: inv.iconColor }}>{inv.initials}</div>
                <div className="min-w-0 flex-1">
                  <div className="font-body text-[12px] font-medium text-v2-heading">{inv.name}</div>
                  <div className="mt-0.5 font-body text-[10px] text-v2-muted">{inv.sub}</div>
                </div>
                <div className="text-right">
                  <div className="font-body text-[12px] font-medium text-v2-heading">{inv.amt}</div>
                  <span className="mt-0.5 inline-block rounded-[6px] px-2 py-0.5 font-body text-[9px] font-medium" style={{ background: inv.statusBg, color: inv.statusColor }}>{inv.statusLabel}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent activity / Ledger */}
        <div className="rounded-2xl border border-v2-border bg-white p-4">
          <div className="mb-3">
            <div className="font-body text-[13px] font-medium text-v2-heading">Recent activity</div>
            <div className="mt-0.5 font-body text-[11px] text-v2-muted">Every entry AI Finance has logged this week</div>
          </div>
          <div className="divide-y divide-gray-100">
            {LEDGER.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 py-2.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] text-[11px]" style={{ background: item.iconBg }}>{item.icon}</div>
                <div className="min-w-0 flex-1 font-body text-[11px] text-v2-heading">{item.name}</div>
                <div className="shrink-0 text-right">
                  <div className="font-body text-[9px] text-v2-muted">{item.when}</div>
                  <div className="font-body text-[11px] font-medium" style={{ color: item.amtColor }}>{item.amt}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Right panel ── */}
      <div className="flex w-[320px] shrink-0 flex-col gap-3 overflow-y-auto border-l border-v2-border bg-white p-4">

        {/* Agent card */}
        <div className="rounded-2xl bg-v2-page p-3">
          <div className="mb-2 font-heading text-[11px] font-semibold text-v2-heading">AI Finance</div>
          <div className="mb-2 flex items-center gap-2.5">
            <div className="relative shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-[10px] font-body text-[11px] font-semibold" style={{ background: "#FAEEDA", color: "#633806" }}>FIN</div>
              <div className="absolute -bottom-1 -right-1 flex h-[13px] w-[13px] items-center justify-center rounded-full border-[1.5px] border-white bg-[#534AB7] text-[7px]">⚡</div>
            </div>
            <div>
              <div className="font-body text-[12px] font-medium text-v2-heading">Invoicing &amp; bookkeeping</div>
              <div className="font-body text-[10px] text-v2-muted">Idle · last action 9:02am</div>
            </div>
          </div>
          <p className="font-body text-[10px] leading-relaxed text-v2-muted">
            Drafts invoices from signed agreements, tracks cash position, and logs every transaction automatically. Sending money or invoices always waits for you — this is fixed, not adjustable in autonomy settings.
          </p>
        </div>

        {/* This month */}
        <div className="rounded-2xl bg-v2-page p-3">
          <div className="mb-2 font-heading text-[11px] font-semibold text-v2-heading">This month</div>
          {[
            { k: "Invoices drafted",          v: "5" },
            { k: "Invoices sent",             v: "4" },
            { k: "Auto-logged transactions",  v: "18" },
            { k: "Escalated to you",          v: "5" },
          ].map(({ k, v }) => (
            <div key={k} className="flex items-center justify-between border-b border-gray-100 py-1.5 last:border-b-0">
              <span className="font-body text-[11px] text-v2-muted">{k}</span>
              <span className="font-body text-[11px] font-medium text-v2-heading">{v}</span>
            </div>
          ))}
        </div>

        {/* Connected accounts */}
        <div className="rounded-2xl bg-v2-page p-3">
          <div className="mb-2 font-heading text-[11px] font-semibold text-v2-heading">Connected accounts</div>
          <div className="divide-y divide-gray-100">
            <div className="flex items-center gap-2 py-1.5">
              <div className="h-6 w-6 shrink-0 rounded-[7px]" style={{ background: "#635BFF" }} />
              <span className="flex-1 font-body text-[11px] text-v2-heading">Stripe</span>
              <span className="font-body text-[9px] text-[#1D9E75]">● Connected</span>
            </div>
            <div className="flex items-center gap-2 py-1.5">
              <div className="h-6 w-6 shrink-0 rounded-[7px]" style={{ background: "#1B4FD8" }} />
              <span className="flex-1 font-body text-[11px] text-v2-heading">GTBank business account</span>
              <span className="font-body text-[9px] text-[#1D9E75]">● Connected</span>
            </div>
            <div className="flex items-center gap-2 py-1.5">
              <div className="h-6 w-6 shrink-0 rounded-[7px] bg-gray-100" />
              <span className="flex-1 font-body text-[11px] text-v2-heading">QuickBooks / bookkeeping export</span>
              <span className="font-body text-[9px] text-v2-muted">Not connected</span>
            </div>
          </div>
          <button type="button" onClick={() => onNavigate?.("integrations")} className="mt-2 w-full text-right font-body text-[10px] text-[#185FA5] hover:underline">
            Manage all integrations →
          </button>
        </div>

      </div>

      <Modal data={modal} onClose={closeModal} onToast={showToast} />
      <Toast msg={toast} />
    </div>
  );
}
