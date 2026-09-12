/**
 * V2AISalesWorkspace — AI Sales agent workspace
 * Built from StartupVerse_AI_Sales.html mockup
 */

import React, { useState } from "react";
import { cn } from "../ui/utils";

/* ── Mock data ────────────────────────────────────────────────────────────── */
const PIPELINE_COLS = [
  {
    title: "Contacted", count: 7,
    cards: [
      { id: "p-generic", name: "First Surulere Clinic",  sub: "Outreach queued, awaiting approval",  tagLabel: "Not sent yet",       tagBg: "#FCEBEB", tagColor: "#791F1F" },
      { id: "p-generic", name: "Yaba Family Care",       sub: "Outreach queued, awaiting approval",  tagLabel: "Not sent yet",       tagBg: "#FCEBEB", tagColor: "#791F1F" },
      { id: "p-generic", name: "+ 5 more clinics",       sub: "Full list in outreach queue below",   tagLabel: "",                   tagBg: "", tagColor: "" },
    ],
  },
  {
    title: "Replied", count: 2,
    cards: [
      { id: "p-lagoon-old", name: "Ikeja Health Point", sub: 'Replied "tell me more" — 2 days ago', tagLabel: "Follow-up drafted", tagBg: "#E6F1FB", tagColor: "#0C447C" },
      { id: "p-generic",    name: "VI Medical Centre",  sub: "Asked about pricing — yesterday",      tagLabel: "Follow-up drafted", tagBg: "#E6F1FB", tagColor: "#0C447C" },
    ],
  },
  {
    title: "Call scheduled", count: 1,
    cards: [
      { id: "p-generic", name: "Surulere General", sub: "Demo call — Thursday 2pm", tagLabel: "Founder call needed", tagBg: "#FAEEDA", tagColor: "#633806" },
    ],
  },
  {
    title: "Signed & paying", count: 3,
    cards: [
      { id: "p-reddington", name: "Reddington Clinic, VI",  sub: "Pilot agreement · ₦180K setup + ₦95K/mo", tagLabel: "Active", tagBg: "#EAF3DE", tagColor: "#27500A" },
      { id: "p-lagoon",     name: "Lagoon Hospital Annex",  sub: "₦95K/mo · paid this month",               tagLabel: "Active", tagBg: "#EAF3DE", tagColor: "#27500A" },
      { id: "p-firstcare",  name: "First Care Clinic",      sub: "₦95K/mo · paid this month",               tagLabel: "Active", tagBg: "#EAF3DE", tagColor: "#27500A" },
    ],
  },
];

const OUTREACH = [
  { id: "o-reddington2", initials: "RC", name: "Reddington Clinic — Month 2 renewal outreach", sub: "Existing customer, renewal reminder",   statusLabel: "Draft",  statusBg: "#f3f4f6", statusColor: "#6b7280" },
  { id: "o-surulere",    initials: "FS", name: "First Surulere Clinic",                        sub: "Cold outreach, intake-form pain point",  statusLabel: "Queued", statusBg: "#FCEBEB", statusColor: "#791F1F" },
  { id: "o-yaba",        initials: "YF", name: "Yaba Family Care",                             sub: "Cold outreach, walk-in volume angle",    statusLabel: "Queued", statusBg: "#FCEBEB", statusColor: "#791F1F" },
  { id: "o-more",        initials: "+7", name: "7 more clinics",                               sub: "Same batch, all queued together",        statusLabel: "Queued", statusBg: "#FCEBEB", statusColor: "#791F1F" },
];

const ACTIVITY = [
  { icon: "📣", iconBg: "#E6F1FB", name: "Personalised 10 clinic outreach messages, escalated send",  when: "7:52am today" },
  { icon: "💬", iconBg: "#E6F1FB", name: "Drafted follow-up for Ikeja Health Point's reply",           when: "Yesterday" },
  { icon: "✅", iconBg: "#EAF3DE", name: "First Care Clinic — Month 2 payment logged",                when: "3 days ago" },
  { icon: "🤝", iconBg: "#EAF3DE", name: "Surulere General booked for a demo call — Thursday",        when: "4 days ago" },
];

const MODALS = {
  "p-reddington":  { title: "Reddington Clinic, VI",    sub: "Signed · Active since Week 3",      body: "Pilot agreement signed Week 3 — governs INV-1042 (₦180,000 setup fee). ₦95,000/month recurring after setup." },
  "p-lagoon":      { title: "Lagoon Hospital Annex",    sub: "Signed · Active",                   body: "₦95,000/month, paid on time this month. Onboarded through the original Week 4 outreach batch." },
  "p-firstcare":   { title: "First Care Clinic",        sub: "Signed · Active",                   body: "₦95,000/month, paid on time this month. One of the first three clinics onboarded." },
  "p-lagoon-old":  { title: "Ikeja Health Point",       sub: "Replied · Follow-up drafted",       body: 'Replied "tell me more" to the cold outreach message 2 days ago. AI Sales has drafted a follow-up with pricing and a demo offer, queued for your approval.' },
  "p-generic":     { title: "Pipeline entry",           sub: "Part of the current outreach batch", body: "This clinic is part of the 10-message batch AI Sales personalised this morning — see the full queue below or in the Approval Queue." },
  "o-reddington2": { title: "Reddington Clinic — renewal outreach", sub: "Draft · not yet queued", body: "A friendly renewal reminder for Reddington's Month 2, referencing their actual booking volume since going live." },
  "o-surulere":    { title: "First Surulere Clinic",    sub: "Queued · awaiting your approval",   body: "Cold outreach opening with the intake-form time-loss pain point, same script as the rest of this batch, personalised with their estimated patient volume." },
  "o-yaba":        { title: "Yaba Family Care",         sub: "Queued · awaiting your approval",   body: "Cold outreach referencing their high walk-in volume specifically, drawn from public clinic data." },
  "o-more":        { title: "7 more clinics",           sub: "Same batch, queued together",        body: "All 10 messages in this batch move together — approving the batch in the Approval Queue sends all of them at once." },
  "new-outreach":  { title: "New outreach batch",       sub: "AI Sales will draft and personalise from your pipeline", body: "Tell AI Sales who to reach out to — it will draft personalised messages from your pain-point bank and queue them for your approval before anything sends." },
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
function Modal({ data, onClose, onToast, onNavigate }) {
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
        <div className="px-5 py-4 font-body text-[12px] leading-relaxed text-gray-600">{data.body}</div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-full border border-v2-border px-4 py-1.5 font-body text-[12px] font-medium text-v2-heading hover:bg-gray-50">Close</button>
          {data.title === "New outreach batch" && (
            <button type="button" onClick={() => { onClose(); onToast("AI Sales is drafting the outreach batch"); }} className="rounded-full bg-v2-purple px-4 py-1.5 font-body text-[12px] font-medium text-white hover:opacity-90">Draft batch →</button>
          )}
          {(data.title === "Reddington Clinic, VI") && (
            <button type="button" onClick={() => { onClose(); onNavigate?.("agent-finance"); }} className="rounded-full border border-v2-border px-4 py-1.5 font-body text-[12px] font-medium text-v2-heading hover:bg-gray-50">View in Finance</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
export default function V2AISalesWorkspace({ onBack, onNavigate }) {
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
            <span className="font-body text-[13px] font-medium text-v2-heading">AI Sales</span>
            <span className="text-gray-300">·</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FCEBEB] px-2.5 py-1 font-body text-[11px] font-medium text-[#791F1F]">
              <span className="h-[5px] w-[5px] rounded-full bg-[#791F1F]" />10 messages awaiting send approval
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => onNavigate?.("approval-queue")} className="rounded-full border border-v2-border bg-white px-3 py-1.5 font-body text-[12px] font-medium text-v2-heading hover:bg-gray-50 transition-colors">
              Approval queue
            </button>
            <button type="button" onClick={() => openModal("new-outreach")} className="rounded-full bg-v2-purple px-3 py-1.5 font-body text-[12px] font-medium text-white hover:opacity-90 transition-opacity">
              + New outreach batch
            </button>
          </div>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Active pipeline",  val: "13",  sub: "Clinics in progress",       subColor: "" },
            { label: "Signed & paying",  val: "3",   sub: "₦285K MRR from these",      subColor: "#1D9E75" },
            { label: "Outreach sent",    val: "24",  sub: "This month",                subColor: "" },
            { label: "Response rate",    val: "29%", sub: "↑ 4pts vs last month",      subColor: "#1D9E75" },
          ].map(({ label, val, sub, subColor }) => (
            <div key={label} className="rounded-2xl border border-v2-border bg-white p-4">
              <div className="font-body text-[10px] uppercase tracking-wide text-v2-muted">{label}</div>
              <div className="mt-1.5 font-heading text-[19px] font-medium text-v2-heading">{val}</div>
              <div className="mt-0.5 font-body text-[10px]" style={{ color: subColor || "#6b7280" }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Pipeline board */}
        <div className="rounded-2xl border border-v2-border bg-white p-4">
          <div className="mb-3">
            <div className="font-body text-[13px] font-medium text-v2-heading">Pipeline</div>
            <div className="mt-0.5 font-body text-[11px] text-v2-muted">Every clinic AI Sales is working, by stage</div>
          </div>
          <div className="grid grid-cols-4 gap-2.5">
            {PIPELINE_COLS.map((col) => (
              <div key={col.title} className="min-h-[120px] rounded-[12px] bg-v2-page p-2.5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-body text-[10px] font-semibold uppercase tracking-wide text-v2-muted">{col.title}</span>
                  <span className="rounded-full bg-white px-1.5 py-0.5 font-body text-[10px] font-semibold text-v2-muted">{col.count}</span>
                </div>
                <div className="space-y-1.5">
                  {col.cards.map((card, i) => (
                    <button key={i} type="button" onClick={() => openModal(card.id)} className="w-full rounded-[10px] border border-v2-border bg-white p-2.5 text-left hover:shadow-sm transition-shadow">
                      <div className="font-body text-[11px] font-medium text-v2-heading">{card.name}</div>
                      <div className="mt-0.5 font-body text-[9px] text-v2-muted">{card.sub}</div>
                      {card.tagLabel && (
                        <span className="mt-1.5 inline-block rounded-[5px] px-1.5 py-0.5 font-body text-[8px] font-medium" style={{ background: card.tagBg, color: card.tagColor }}>{card.tagLabel}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Outreach queue */}
        <div className="rounded-2xl border border-v2-border bg-white p-4">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <div className="font-body text-[13px] font-medium text-v2-heading">Outreach queue</div>
              <div className="mt-0.5 font-body text-[11px] text-v2-muted">10 clinic messages, personalised and ready — sending needs your approval</div>
            </div>
            <button type="button" onClick={() => onNavigate?.("approval-queue")} className="font-body text-[11px] text-[#185FA5] hover:underline">Review &amp; send →</button>
          </div>
          <div className="divide-y divide-gray-100">
            {OUTREACH.map((item) => (
              <button key={item.id} type="button" onClick={() => openModal(item.id)} className="flex w-full items-center gap-3 py-2.5 text-left hover:bg-gray-50 transition-colors">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] font-body text-[10px] font-semibold" style={{ background: "#E6F1FB", color: "#0C447C" }}>{item.initials}</div>
                <div className="min-w-0 flex-1">
                  <div className="font-body text-[11px] font-medium text-v2-heading">{item.name}</div>
                  <div className="mt-0.5 font-body text-[10px] text-v2-muted">{item.sub}</div>
                </div>
                <span className="shrink-0 rounded-[6px] px-2.5 py-1 font-body text-[9px] font-medium" style={{ background: item.statusBg, color: item.statusColor }}>{item.statusLabel}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="rounded-2xl border border-v2-border bg-white p-4">
          <div className="mb-3 font-body text-[13px] font-medium text-v2-heading">Recent activity</div>
          <div className="divide-y divide-gray-100">
            {ACTIVITY.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 py-2.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] text-[11px]" style={{ background: item.iconBg }}>{item.icon}</div>
                <div className="min-w-0 flex-1 font-body text-[11px] text-v2-heading">{item.name}</div>
                <div className="shrink-0 font-body text-[9px] text-v2-muted">{item.when}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Right panel ── */}
      <div className="flex w-[320px] shrink-0 flex-col gap-3 overflow-y-auto border-l border-v2-border bg-white p-4">

        {/* Agent card */}
        <div className="rounded-2xl bg-v2-page p-3">
          <div className="mb-2 font-heading text-[11px] font-semibold text-v2-heading">AI Sales</div>
          <div className="mb-2 flex items-center gap-2.5">
            <div className="relative shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-[10px] font-body text-[11px] font-semibold" style={{ background: "#E6F1FB", color: "#0C447C" }}>SA</div>
              <div className="absolute -bottom-1 -right-1 flex h-[13px] w-[13px] items-center justify-center rounded-full border-[1.5px] border-white bg-[#534AB7] text-[7px]">⚡</div>
            </div>
            <div>
              <div className="font-body text-[12px] font-medium text-v2-heading">Outreach &amp; pipeline</div>
              <div className="font-body text-[10px] text-v2-muted">Blocked · needs approval</div>
            </div>
          </div>
          <p className="font-body text-[10px] leading-relaxed text-v2-muted">
            Drafts, personalises, and tracks pipeline freely. Sending anything externally always waits for you — locked in Autonomy Settings, not adjustable.
          </p>
        </div>

        {/* This month */}
        <div className="rounded-2xl bg-v2-page p-3">
          <div className="mb-2 font-heading text-[11px] font-semibold text-v2-heading">This month</div>
          {[
            { k: "Messages sent",       v: "24" },
            { k: "Replies received",    v: "7" },
            { k: "Escalated to you",    v: "3 batches" },
            { k: "Demo calls booked",   v: "1" },
            { k: "New signed clients",  v: "1" },
          ].map(({ k, v }) => (
            <div key={k} className="flex items-center justify-between border-b border-gray-100 py-1.5 last:border-b-0">
              <span className="font-body text-[11px] text-v2-muted">{k}</span>
              <span className="font-body text-[11px] font-medium text-v2-heading">{v}</span>
            </div>
          ))}
        </div>

        {/* Connected */}
        <div className="rounded-2xl bg-v2-page p-3">
          <div className="mb-2 font-heading text-[11px] font-semibold text-v2-heading">Connected</div>
          <div className="divide-y divide-gray-100">
            <div className="flex items-center gap-2 py-1.5">
              <div className="h-6 w-6 shrink-0 rounded-[7px]" style={{ background: "#25D366" }} />
              <span className="flex-1 font-body text-[11px] text-v2-heading">WhatsApp Business (Zikorail)</span>
              <span className="font-body text-[9px] text-[#1D9E75]">● Connected</span>
            </div>
            <div className="flex items-center gap-2 py-1.5">
              <div className="h-6 w-6 shrink-0 rounded-[7px] bg-gray-100" />
              <span className="flex-1 font-body text-[11px] text-v2-heading">Google Calendar</span>
              <span className="font-body text-[9px] text-v2-muted">Not connected</span>
            </div>
          </div>
          <button type="button" onClick={() => onNavigate?.("integrations")} className="mt-2 w-full text-right font-body text-[10px] text-[#185FA5] hover:underline">
            Manage all integrations →
          </button>
        </div>

      </div>

      <Modal data={modal} onClose={closeModal} onToast={showToast} onNavigate={onNavigate} />
      <Toast msg={toast} />
    </div>
  );
}
