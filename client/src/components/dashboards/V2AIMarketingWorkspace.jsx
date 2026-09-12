/**
 * V2AIMarketingWorkspace — AI Marketing agent workspace
 * Built from StartupVerse_AI_Marketing.html mockup
 */

import React, { useState } from "react";
import { cn } from "../ui/utils";

/* ── Mock data ────────────────────────────────────────────────────────────── */
const PIPELINE = [
  {
    id: "c-nurture",
    icon: "✉️", iconBg: "#FAEEDA",
    name: "Week 5 nurture email sequence",
    sub: "3-email series for post-booking clinics · routed to Chidinma",
    statusLabel: "Awaiting Chidinma",
    statusBg: "#FCF7EC", statusColor: "#633806",
  },
  {
    id: "c-landing",
    icon: "🌐", iconBg: "#EAF3DE",
    name: "Landing page hero copy — v3",
    sub: "Vezeeta-style positioning · shipped with PR #14",
    statusLabel: "Published",
    statusBg: "#EAF3DE", statusColor: "#27500A",
  },
  {
    id: "c-clinic-post",
    icon: "📝", iconBg: "#EAF3DE",
    name: 'Blog: "How Reddington Clinic cut wait times by 40%"',
    sub: "Case study drawn from validated interview data",
    statusLabel: "Published",
    statusBg: "#EAF3DE", statusColor: "#27500A",
  },
  {
    id: "c-social",
    icon: "📱", iconBg: "#f3f4f6",
    name: "LinkedIn — Week 5 traction update",
    sub: "Drafted, scheduled for Friday 10am",
    statusLabel: "Scheduled",
    statusBg: "#E6F1FB", statusColor: "#0C447C",
  },
  {
    id: "c-outreach-ref",
    icon: "📣", iconBg: "#E6F1FB",
    name: "Clinic outreach message templates",
    sub: "Handed to AI Sales — 10 messages personalised and queued",
    statusLabel: "Handed off",
    statusBg: "#f3f4f6", statusColor: "#6b7280",
  },
];

const LIBRARY = [
  { id: "lib-voice",   icon: "🎙️", name: "Brand voice guide",       sub: "Approved Week 1" },
  { id: "lib-pain",    icon: "💊", name: "Clinic pain-point bank",   sub: "From 8 validated interviews" },
  { id: "lib-vezeeta", icon: "🗺️", name: "Vezeeta messaging kit",    sub: "From the installed blueprint" },
  { id: "lib-logo",    icon: "🎨", name: "Brand assets & logo kit",  sub: "Maintained with AI Designer" },
  { id: "lib-faq",     icon: "❓", name: "Objection & FAQ answers",  sub: "Updated from clinic replies" },
];

const ACTIVITY = [
  { icon: "✉️", iconBg: "#FCF7EC", name: "Drafted Week 5 nurture sequence, routed to Chidinma for tone",  when: "7:58am today" },
  { icon: "📣", iconBg: "#EAF3DE", name: "Drafted 10 clinic outreach messages, handed to AI Sales",         when: "7:40am today" },
  { icon: "🌐", iconBg: "#EAF3DE", name: "Landing page hero copy shipped with PR #14",                      when: "6:02am today" },
  { icon: "📝", iconBg: "#EAF3DE", name: "Published Reddington Clinic case study blog post",                when: "3 days ago" },
];

const MODALS = {
  "c-nurture": {
    title: "Week 5 nurture email sequence", sub: "3 emails · awaiting Chidinma",
    body: "A 3-email post-booking sequence: (1) Welcome to HealthTrack, (2) Your records, always with you, (3) Refer a friend. Publishing routes to Chidinma A. (Marketing role) for a brand-voice check.",
  },
  "c-landing": {
    title: "Landing page hero copy — v3", sub: "Published · shipped with PR #14",
    body: '"Book a clinic visit in under 2 minutes" — headline built around the intake-form time-loss pain point validated in 8/8 interviews. Live on healthtrack.app since 7:03am today.',
  },
  "c-clinic-post": {
    title: "Blog: Reddington Clinic case study", sub: "Published 3 days ago",
    body: "Drawn from Reddington's actual booking data since going live — a real case study built to support the next wave of clinic outreach.",
  },
  "c-social": {
    title: "LinkedIn — Week 5 traction update", sub: "Scheduled for Friday 10am",
    body: "Draft post sharing the Week 5 numbers: 3 paying clinics, 10 more in active outreach, score up to 91. Written in founder voice, ready for Adaeze to review before it posts.",
  },
  "c-outreach-ref": {
    title: "Clinic outreach message templates", sub: "Handed off to AI Sales · 7:40am",
    body: "AI Marketing drafted the base templates using the Vezeeta Blueprint's supply-first approach; AI Sales personalised each one per clinic and queued them for sending.",
  },
  "lib-voice":   { title: "Brand voice guide",       sub: "Approved Week 1",              body: "Warm, direct, never clinical-jargon-heavy. Speaks to Nigerian clinic administrators and patients in plain language. Every piece of content checks against this before it's drafted." },
  "lib-pain":    { title: "Clinic pain-point bank",   sub: "From 8 validated interviews",  body: "Intake-form time loss, manual scheduling conflicts, and lost patient records are the three most-cited pain points — every outreach message and landing page draws from this list." },
  "lib-vezeeta": { title: "Vezeeta messaging kit",    sub: "From the installed blueprint", body: "The supply-first positioning language and clinic-facing value props adapted from the Vezeeta Blueprint for HealthTrack's specific market." },
  "lib-logo":    { title: "Brand assets & logo kit",  sub: "Maintained with AI Designer",  body: "Logo files, color palette, and icon set — the same visual system used across the app and website." },
  "lib-faq":     { title: "Objection & FAQ answers",  sub: "Updated from clinic replies",  body: "Common questions and pushback from clinic outreach replies, with tested responses — updated every time AI Sales logs a new objection." },
  "new-content": { title: "New content", sub: "AI Marketing will draft from your brand library", body: "Describe what you need — AI Marketing will draft it using your brand voice and messaging library, then route it for review before anything goes live." },
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
        <div className="px-5 py-4 font-body text-[12px] leading-relaxed text-gray-600">{data.body}</div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-full border border-v2-border px-4 py-1.5 font-body text-[12px] font-medium text-v2-heading hover:bg-gray-50">Close</button>
          {data.title === "New content" && (
            <button type="button" onClick={() => { onClose(); onToast("AI Marketing is drafting the content"); }} className="rounded-full bg-v2-purple px-4 py-1.5 font-body text-[12px] font-medium text-white hover:opacity-90">Draft content →</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
export default function V2AIMarketingWorkspace({ onBack, onNavigate }) {
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
            <span className="font-body text-[13px] font-medium text-v2-heading">AI Marketing</span>
            <span className="text-gray-300">·</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FAEEDA] px-2.5 py-1 font-body text-[11px] font-medium text-[#633806]">
              <span className="h-[5px] w-[5px] rounded-full bg-[#BA7517]" />1 waiting on Chidinma
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => onNavigate?.("approval-queue")} className="rounded-full border border-v2-border bg-white px-3 py-1.5 font-body text-[12px] font-medium text-v2-heading hover:bg-gray-50 transition-colors">
              Approval queue
            </button>
            <button type="button" onClick={() => openModal("new-content")} className="rounded-full bg-v2-purple px-3 py-1.5 font-body text-[12px] font-medium text-white hover:opacity-90 transition-opacity">
              + New content
            </button>
          </div>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Content drafted", val: "9",   sub: "This month",                   subColor: "" },
            { label: "Published live",  val: "6",   sub: "↑ 3 this week",                subColor: "#1D9E75" },
            { label: "Awaiting review", val: "1",   sub: "With Chidinma — tone check",   subColor: "" },
            { label: "Email open rate", val: "38%", sub: "↑ 6pts vs last sequence",      subColor: "#1D9E75" },
          ].map(({ label, val, sub, subColor }) => (
            <div key={label} className="rounded-2xl border border-v2-border bg-white p-4">
              <div className="font-body text-[10px] uppercase tracking-wide text-v2-muted">{label}</div>
              <div className="mt-1.5 font-heading text-[19px] font-medium text-v2-heading">{val}</div>
              <div className="mt-0.5 font-body text-[10px]" style={{ color: subColor || "#6b7280" }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Content pipeline */}
        <div className="rounded-2xl border border-v2-border bg-white p-4">
          <div className="mb-3">
            <div className="font-body text-[13px] font-medium text-v2-heading">Content pipeline</div>
            <div className="mt-0.5 font-body text-[11px] text-v2-muted">Everything AI Marketing is drafting, scheduling, or has shipped</div>
          </div>
          <div className="divide-y divide-gray-100">
            {PIPELINE.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openModal(item.id)}
                className="flex w-full items-center gap-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-[13px]" style={{ background: item.iconBg }}>{item.icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="font-body text-[12px] font-medium text-v2-heading">{item.name}</div>
                  <div className="mt-0.5 font-body text-[10px] text-v2-muted">{item.sub}</div>
                </div>
                <span className="shrink-0 rounded-[6px] px-2.5 py-1 font-body text-[9px] font-medium" style={{ background: item.statusBg, color: item.statusColor }}>{item.statusLabel}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Brand & messaging library */}
        <div className="rounded-2xl border border-v2-border bg-white p-4">
          <div className="mb-3">
            <div className="font-body text-[13px] font-medium text-v2-heading">Brand &amp; messaging library</div>
            <div className="mt-0.5 font-body text-[11px] text-v2-muted">Reusable assets AI Marketing draws from for every piece of content</div>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {LIBRARY.map((item) => (
              <button key={item.id} type="button" onClick={() => openModal(item.id)} className="rounded-[11px] bg-v2-page p-3 text-left hover:bg-gray-100 transition-colors">
                <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-[#EAF3DE] text-[12px]">{item.icon}</div>
                <div className="font-body text-[11px] font-medium text-v2-heading">{item.name}</div>
                <div className="mt-0.5 font-body text-[9px] text-v2-muted">{item.sub}</div>
              </button>
            ))}
            <div className="rounded-[11px] bg-v2-page p-3 opacity-50">
              <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-[#EAF3DE] text-[12px]">➕</div>
              <div className="font-body text-[11px] font-medium text-v2-heading">Add new asset</div>
              <div className="mt-0.5 font-body text-[9px] text-v2-muted">Give AI Marketing more to work from</div>
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
          <div className="mb-2 font-heading text-[11px] font-semibold text-v2-heading">AI Marketing</div>
          <div className="mb-2 flex items-center gap-2.5">
            <div className="relative shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-[10px] font-body text-[11px] font-semibold" style={{ background: "#EAF3DE", color: "#27500A" }}>MK</div>
              <div className="absolute -bottom-1 -right-1 flex h-[13px] w-[13px] items-center justify-center rounded-full border-[1.5px] border-white bg-[#534AB7] text-[7px]">⚡</div>
            </div>
            <div>
              <div className="font-body text-[12px] font-medium text-v2-heading">Content &amp; campaigns</div>
              <div className="font-body text-[10px] text-v2-muted">Idle · last action 7:58am</div>
            </div>
          </div>
          <p className="font-body text-[10px] leading-relaxed text-v2-muted">
            Drafts content and campaigns freely. Publishing or scheduling anything live routes to Chidinma A. for a brand-voice check — she holds the marketing role, so this isn't the founder's call.
          </p>
        </div>

        {/* Chidinma */}
        <div className="rounded-2xl bg-v2-page p-3">
          <div className="mb-2 font-heading text-[11px] font-semibold text-v2-heading">Chidinma A. · Marketing</div>
          <div className="mb-2 flex items-center gap-2.5">
            <div className="relative shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-[9px] font-body text-[9px] font-semibold" style={{ background: "#FAEEDA", color: "#633806" }}>CA</div>
              <div className="absolute -bottom-1 -right-1 flex h-[13px] w-[13px] items-center justify-center rounded-full border-[1.5px] border-white bg-[#1B4FD8] text-[7px]">👤</div>
            </div>
            <div className="font-body text-[10px] text-v2-muted">1 pending review</div>
          </div>
          <p className="font-body text-[10px] leading-relaxed text-v2-muted">
            Every publish decision routes here first, not to the founder. Adaeze can see it in the Approval Queue but can't approve it herself.
          </p>
        </div>

        {/* This month stats */}
        <div className="rounded-2xl bg-v2-page p-3">
          <div className="mb-2 font-heading text-[11px] font-semibold text-v2-heading">This month</div>
          {[
            { k: "Content drafted",       v: "9" },
            { k: "Published",             v: "6" },
            { k: "Escalated to Chidinma", v: "3" },
            { k: "Handed to AI Sales",    v: "1" },
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
              <span className="flex-1 font-body text-[11px] text-v2-heading">WhatsApp Business</span>
              <span className="font-body text-[9px] text-[#1D9E75]">● Connected</span>
            </div>
            <div className="flex items-center gap-2 py-1.5">
              <div className="h-6 w-6 shrink-0 rounded-[7px] bg-gray-100" />
              <span className="flex-1 font-body text-[11px] text-v2-heading">Gmail</span>
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
