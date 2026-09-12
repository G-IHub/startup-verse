/**
 * V2AILegalWorkspace — AI Legal agent workspace
 * Built from StartupVerse_AI_Legal.html mockup
 */

import React, { useState } from "react";
import { cn } from "../ui/utils";

/* ── Mock data ────────────────────────────────────────────────────────────── */
const DOCUMENTS = [
  { id: "doc-nda",       icon: "📄", iconBg: "#FCEBEB", name: "NDA — Backend Engineer candidate",  sub: "Standard mutual NDA template · interview next week",               statusLabel: "Awaiting approval", statusBg: "#FCEBEB", statusColor: "#791F1F" },
  { id: "doc-reddington",icon: "✅", iconBg: "#EAF3DE", name: "Pilot Agreement — Reddington Clinic", sub: "Signed Week 3 · governs INV-1042",                               statusLabel: "Signed",           statusBg: "#EAF3DE", statusColor: "#27500A" },
  { id: "doc-james",     icon: "✅", iconBg: "#EAF3DE", name: "Contractor Agreement — James S.",     sub: "Signed Week 1 · Engineering, equity + monthly comp",            statusLabel: "Signed",           statusBg: "#EAF3DE", statusColor: "#27500A" },
  { id: "doc-tos",       icon: "📝", iconBg: "#f3f4f6", name: "Terms of Service — v2",              sub: "Drafted, redlined by AI Legal after NDPR review · not yet published", statusLabel: "Draft",        statusBg: "#f3f4f6", statusColor: "#6b7280" },
];

const TEMPLATES = [
  { id: "tpl-nda",        icon: "📄", name: "Mutual NDA",              sub: "Reviewed Week 1" },
  { id: "tpl-contractor", icon: "🖋️", name: "Contractor Agreement",    sub: "Reviewed Week 1" },
  { id: "tpl-clinic",     icon: "🏥", name: "Clinic Pilot Agreement",  sub: "Reviewed Week 3" },
  { id: "tpl-tos",        icon: "📝", name: "Terms of Service",        sub: "Under revision" },
  { id: "tpl-privacy",    icon: "🔒", name: "Privacy Policy",          sub: "NDPR-aligned" },
];

const ACTIVITY = [
  { icon: "📄", iconBg: "#FCEBEB", name: "Drafted NDA for backend candidate, escalated to you",      when: "9:10am today" },
  { icon: "📝", iconBg: "#f3f4f6", name: "Redlined Terms of Service v2 after NDPR compliance check", when: "Yesterday" },
  { icon: "✅", iconBg: "#EAF3DE", name: "Reddington Clinic pilot agreement countersigned",          when: "Week 3" },
  { icon: "✅", iconBg: "#EAF3DE", name: "James S. contractor agreement countersigned",              when: "Week 1" },
];

const COMPLIANCE = [
  { done: true,  text: "NDPR data privacy — policy drafted, published" },
  { done: true,  text: "CAC business registration — on file" },
  { done: true,  text: "Standard NDA in use for all hires" },
  { done: false, text: "Health-data handling addendum — in review with lawyer" },
];

const MODALS = {
  "doc-nda": {
    title: "NDA — Backend Engineer candidate", sub: "Standard mutual NDA template · Awaiting your approval",
    body: "Candidate: Backend Engineer applicant, interview scheduled next week. Template: unmodified from the version your lawyer reviewed in Week 1. Only name, role, and date fields were filled — no clauses changed. All legal documents always escalate before sending.",
    approveLabel: "Approve & send →", approveToast: "✓ Sent NDA to candidate",
  },
  "doc-reddington": { title: "Pilot Agreement — Reddington Clinic", sub: "Signed Week 3", body: "Governs the ₦180,000 pilot integration fee currently in AI Finance's invoice queue (INV-1042), plus the ₦95,000/month renewal terms. Countersigned via DocuSign, Week 3." },
  "doc-james":      { title: "Contractor Agreement — James S.",     sub: "Signed Week 1", body: "Engineering role, monthly compensation plus equity vesting schedule — matches the terms shown on James's team member profile. Countersigned via DocuSign, Week 1." },
  "doc-tos":        { title: "Terms of Service — v2", sub: "Draft · redlined after NDPR review", body: "AI Legal flagged two clauses in v1 that didn't fully match NDPR (Nigeria Data Protection Regulation) requirements around health data. Redlines are in, awaiting your lawyer's final pass before you approve publishing." },
  "tpl-nda":        { title: "Mutual NDA template",             sub: "Reviewed by Ojo & Partners · Week 1", body: "Used for candidates, contractors, and any external party seeing confidential product or financial information. AI Legal fills in names and dates only — no clause edits allowed without a human." },
  "tpl-contractor": { title: "Contractor Agreement template",   sub: "Reviewed · Week 1",                   body: "Standard template for team members joining on equity + compensation, like James S.'s agreement. Covers IP assignment, vesting, and termination terms." },
  "tpl-clinic":     { title: "Clinic Pilot Agreement template", sub: "Reviewed · Week 3",                   body: "Used for every clinic partnership — pilot fee structure, monthly renewal terms, and data-sharing scope. Reddington's agreement was drafted from this template." },
  "tpl-tos":        { title: "Terms of Service template",       sub: "Under revision",                       body: "Currently being redlined for NDPR alignment on health-data clauses — see the v2 draft in Documents above." },
  "tpl-privacy":    { title: "Privacy Policy template",         sub: "NDPR-aligned",                         body: "Covers patient data handling, consent, and retention — written to match Nigeria's Data Protection Regulation for a HealthTech product." },
  "new-doc":        { title: "New document", sub: "AI Legal will draft this from an approved template", body: "Describe who it's for and which template applies — AI Legal will draft it and hold it for your approval before anything is sent.", newMode: true },
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
        <div className="px-5 py-4 font-body text-[12px] leading-relaxed text-gray-600">
          {data.body}
          {data.newMode && (
            <div className="mt-3">
              <input placeholder="e.g. NDA for new mentor, Contractor agreement for designer" className="w-full rounded-lg border border-gray-200 px-3 py-2 font-body text-[12px] outline-none focus:border-v2-purple" />
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
          {data.title === "Pilot Agreement — Reddington Clinic" && (
            <button type="button" onClick={() => { onClose(); onNavigate?.("agent-finance"); }} className="rounded-full border border-v2-border px-4 py-1.5 font-body text-[12px] font-medium text-v2-heading hover:bg-gray-50">Open Finance workspace</button>
          )}
          {data.newMode && (
            <button type="button" onClick={() => { onClose(); onToast("AI Legal is drafting the document"); }} className="rounded-full bg-v2-purple px-4 py-1.5 font-body text-[12px] font-medium text-white hover:opacity-90">
              Draft document →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
export default function V2AILegalWorkspace({ onBack, onNavigate }) {
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
            <span className="font-body text-[13px] font-medium text-v2-heading">AI Legal</span>
            <span className="text-gray-300">·</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FCEBEB] px-2.5 py-1 font-body text-[11px] font-medium text-[#791F1F]">
              <span className="h-[5px] w-[5px] rounded-full bg-[#791F1F]" />1 pending your approval
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => onNavigate?.("approval-queue")} className="rounded-full border border-v2-border bg-white px-3 py-1.5 font-body text-[12px] font-medium text-v2-heading hover:bg-gray-50 transition-colors">
              Approval queue
            </button>
            <button type="button" onClick={() => openModal("new-doc")} className="rounded-full bg-v2-purple px-3 py-1.5 font-body text-[12px] font-medium text-white hover:opacity-90 transition-opacity">
              + New document
            </button>
          </div>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Active contracts",    val: "7",       sub: "Clinics, vendors, hires",       subColor: "" },
            { label: "Pending signature",   val: "1",       sub: "Awaiting your approval to send", subColor: "" },
            { label: "Drafted this month",  val: "4",       sub: "All from approved templates",    subColor: "" },
            { label: "Compliance flags",    val: "0 open",  sub: "Last check: this morning",      subColor: "#1D9E75" },
          ].map(({ label, val, sub, subColor }) => (
            <div key={label} className="rounded-2xl border border-v2-border bg-white p-4">
              <div className="font-body text-[10px] uppercase tracking-wide text-v2-muted">{label}</div>
              <div className="mt-1.5 font-heading text-[19px] font-medium" style={{ color: subColor && label === "Compliance flags" ? "#1D9E75" : "var(--v2-heading)" }}>{val}</div>
              <div className="mt-0.5 font-body text-[10px] text-v2-muted">{sub}</div>
            </div>
          ))}
        </div>

        {/* Documents */}
        <div className="rounded-2xl border border-v2-border bg-white p-4">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <div className="font-body text-[13px] font-medium text-v2-heading">Documents</div>
              <div className="mt-0.5 font-body text-[11px] text-v2-muted">Drafted by AI Legal from approved templates — sending always needs you</div>
            </div>
            <button type="button" onClick={() => onNavigate?.("approval-queue")} className="font-body text-[11px] text-[#185FA5] hover:underline">View in queue →</button>
          </div>
          <div className="divide-y divide-gray-100">
            {DOCUMENTS.map((doc) => (
              <button key={doc.id} type="button" onClick={() => openModal(doc.id)} className="flex w-full items-center gap-3 py-2.5 text-left hover:bg-gray-50 transition-colors">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-[13px]" style={{ background: doc.iconBg }}>{doc.icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="font-body text-[12px] font-medium text-v2-heading">{doc.name}</div>
                  <div className="mt-0.5 font-body text-[10px] text-v2-muted">{doc.sub}</div>
                </div>
                <span className="shrink-0 rounded-[6px] px-2.5 py-1 font-body text-[9px] font-medium" style={{ background: doc.statusBg, color: doc.statusColor }}>{doc.statusLabel}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Templates */}
        <div className="rounded-2xl border border-v2-border bg-white p-4">
          <div className="mb-3">
            <div className="font-body text-[13px] font-medium text-v2-heading">Templates</div>
            <div className="mt-0.5 font-body text-[11px] text-v2-muted">Approved once, reused by AI Legal for every new draft</div>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {TEMPLATES.map((tpl) => (
              <button key={tpl.id} type="button" onClick={() => openModal(tpl.id)} className="rounded-[11px] bg-v2-page p-3 text-left hover:bg-gray-100 transition-colors">
                <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-[#FCEBEB] text-[12px]">{tpl.icon}</div>
                <div className="font-body text-[11px] font-medium text-v2-heading">{tpl.name}</div>
                <div className="mt-0.5 font-body text-[9px] text-v2-muted">{tpl.sub}</div>
              </button>
            ))}
            <div className="rounded-[11px] bg-v2-page p-3 opacity-50">
              <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-[#FCEBEB] text-[12px]">➕</div>
              <div className="font-body text-[11px] font-medium text-v2-heading">Request new template</div>
              <div className="mt-0.5 font-body text-[9px] text-v2-muted">Ask your lawyer to add one</div>
            </div>
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
          <div className="mb-2 font-heading text-[11px] font-semibold text-v2-heading">AI Legal</div>
          <div className="mb-2 flex items-center gap-2.5">
            <div className="relative shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-[10px] font-body text-[11px] font-semibold" style={{ background: "#FCEBEB", color: "#791F1F" }}>LGL</div>
              <div className="absolute -bottom-1 -right-1 flex h-[13px] w-[13px] items-center justify-center rounded-full border-[1.5px] border-white bg-[#534AB7] text-[7px]">⚡</div>
            </div>
            <div>
              <div className="font-body text-[12px] font-medium text-v2-heading">Contracts &amp; compliance</div>
              <div className="font-body text-[10px] text-v2-muted">Idle · last action 9:10am</div>
            </div>
          </div>
          <p className="font-body text-[10px] leading-relaxed text-v2-muted">
            Drafts from templates your lawyer already approved, flags compliance risks, tracks signature status. Never sends or files anything without you — fixed, not adjustable in autonomy settings.
          </p>
        </div>

        {/* This month */}
        <div className="rounded-2xl bg-v2-page p-3">
          <div className="mb-2 font-heading text-[11px] font-semibold text-v2-heading">This month</div>
          {[
            { k: "Documents drafted",       v: "4" },
            { k: "Sent for signature",      v: "3" },
            { k: "Escalated to you",        v: "4" },
            { k: "Compliance flags raised", v: "1" },
          ].map(({ k, v }) => (
            <div key={k} className="flex items-center justify-between border-b border-gray-100 py-1.5 last:border-b-0">
              <span className="font-body text-[11px] text-v2-muted">{k}</span>
              <span className="font-body text-[11px] font-medium text-v2-heading">{v}</span>
            </div>
          ))}
        </div>

        {/* Compliance checklist */}
        <div className="rounded-2xl bg-v2-page p-3">
          <div className="mb-2 font-heading text-[11px] font-semibold text-v2-heading">Compliance checklist</div>
          <div className="space-y-1">
            {COMPLIANCE.map((item, i) => (
              <div key={i} className="flex items-start gap-2 font-body text-[10px] leading-relaxed text-gray-600">
                <span className="shrink-0">{item.done ? "✅" : "⏳"}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Connected */}
        <div className="rounded-2xl bg-v2-page p-3">
          <div className="mb-2 font-heading text-[11px] font-semibold text-v2-heading">Connected</div>
          <div className="divide-y divide-gray-100">
            <div className="flex items-center gap-2 py-1.5">
              <div className="h-6 w-6 shrink-0 rounded-[7px]" style={{ background: "#635BFF" }} />
              <span className="flex-1 font-body text-[11px] text-v2-heading">DocuSign</span>
              <span className="font-body text-[9px] text-[#1D9E75]">● Connected</span>
            </div>
            <div className="flex items-center gap-2 py-1.5">
              <div className="h-6 w-6 shrink-0 rounded-[7px] bg-gray-100" />
              <span className="flex-1 font-body text-[11px] text-v2-heading">External counsel review</span>
              <span className="font-body text-[9px] text-v2-muted">Ojo &amp; Partners</span>
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
