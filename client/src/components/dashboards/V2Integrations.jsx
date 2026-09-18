/**
 * V2Integrations — Integrations management page
 * Built from StartupVerse_Integrations.html mockup
 *
 * Real as of docs/ai-agent-roadmap.md Phase 2: only the GitHub card reads/
 * writes real connect state (same per-founder OAuth connection AI Developer's
 * workspace uses — client/src/utils/api/githubApi.js), since it's the only
 * integration with a real backend today. Everything else stays honest
 * illustrative mock, matching the pattern already established for the agent
 * workspace pages, pending Phase 3's real integrations.
 */

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "../ui/utils";
import * as githubApi from "../../utils/api/githubApi";
import * as customDomainApi from "../../utils/api/customDomainApi";
import * as calendlyApi from "../../utils/api/calendlyApi";
import {
  getIntegrations,
  connectGmail as apiConnectGmail,
  disconnectGmail as apiDisconnectGmail,
  connectWhatsApp as apiConnectWhatsApp,
  disconnectWhatsApp as apiDisconnectWhatsApp,
  connectSocial as apiConnectSocial,
  disconnectSocial as apiDisconnectSocial,
  getLinkedInAuthUrl,
  disconnectLinkedIn as apiDisconnectLinkedIn,
} from "../../utils/api/integrationsApi";
import { useOfficeStore } from "../../state/useOfficeStore";

/* ── Data ─────────────────────────────────────────────────────────────────── */
const SECTIONS = [
  {
    title: "Payments & banking",
    sub: "What AI Finance uses to invoice, track cash, and log transactions",
    items: [
      { id: "stripe",     iconBg: "#635BFF", iconLabel: "S",  name: "Stripe",                     sub: "Card payments, invoicing",          connected: true,  agents: ["🤖 AI Finance"],                              meta: "Last synced 6:40am today" },
      { id: "bank",       iconBg: "#1B4FD8", iconLabel: "🏦", name: "GTBank Business",             sub: "Bank transfers, balance",           connected: true,  agents: ["🤖 AI Finance"],                              meta: "Last synced this morning" },
      { id: "quickbooks", iconBg: "#2CA01C", iconLabel: "Q",  name: "QuickBooks",                  sub: "Bookkeeping export",                connected: false, agents: ["🤖 AI Finance"],                              meta: "Would replace manual ledger export" },
    ],
  },
  {
    title: "Development & hosting",
    sub: "What AI Developer and AI Designer use to build and ship",
    items: [
      { id: "github", iconBg: "#171515", iconLabel: "🐙", name: "GitHub",  sub: "Repo, PRs, commits",              connected: true,  agents: ["🤖 AI Developer", "🤖 AI Designer"], meta: "Last synced 8:32am today · PR #15 flagged" },
      { id: "vercel", iconBg: "#000",    iconLabel: "▲",  name: "Vercel",  sub: "Staging & production deploys",    connected: true,  agents: ["🤖 AI Developer"],                   meta: "Last deploy 6:22am today · v3" },
      { id: "custom-domain", iconBg: "#1B4FD8", iconLabel: "🌐", name: "Custom domain", sub: "Point your own domain at your product", connected: false, agents: ["🤖 AI Developer"], meta: "Not set up yet" },
    ],
  },
  {
    title: "Legal & signatures",
    sub: "What AI Legal uses to send and track documents",
    items: [
      { id: "docusign", iconBg: "#F5C344", iconLabel: "D", iconColor: "#3C3489", name: "DocuSign", sub: "E-signature, document status", connected: true, agents: ["🤖 AI Legal"], meta: "Last synced 9:10am today · NDA pending" },
    ],
  },
  {
    title: "Communication & outreach",
    sub: "What AI Sales and AI Marketing use to reach people",
    items: [
      { id: "calendly",  iconBg: "#006BFF", iconLabel: "📅", name: "Calendly",                     sub: "Booking links, auto-create meeting tasks", connected: false, agents: ["🤖 AI PM", "🤖 AI Sales", "🤖 AI Marketing"], meta: "Not connected yet" },
      { id: "whatsapp", iconBg: "#25D366", iconLabel: "W",  name: "WhatsApp Business",            sub: "Send AI-drafted messages directly from your number", connected: false, agents: ["🤖 AI Sales", "🤖 AI Marketing"], meta: "Enables real WhatsApp sending", dynamic: true },
      { id: "gmail",    iconBg: "#EA4335", iconLabel: "✉",  name: "Gmail",                        sub: "Send outreach emails from your inbox", connected: false, agents: ["🤖 AI Sales", "🤖 AI Marketing"],  meta: "Would enable email nurture sequences", dynamic: true },
      { id: "linkedin", iconBg: "#0A66C2", iconLabel: "in", name: "LinkedIn",                     sub: "AI drafts messages, you send manually", connected: false, agents: ["🤖 AI Sales", "🤖 AI Marketing"], meta: "Copy-to-clipboard sending", dynamic: true },
      { id: "instagram",iconBg: "#E1306C", iconLabel: "IG", name: "Instagram",                    sub: "AI drafts captions & DMs, you post manually", connected: false, agents: ["🤖 AI Marketing"], meta: "Copy-to-clipboard sending", dynamic: true },
      { id: "facebook", iconBg: "#1877F2", iconLabel: "f",  name: "Facebook",                     sub: "AI drafts posts & messages, you send manually", connected: false, agents: ["🤖 AI Marketing"], meta: "Copy-to-clipboard sending", dynamic: true },
      { id: "gcal",     iconBg: "#4285F4", iconLabel: "📅", name: "Google Calendar",              sub: "Booking, mentor sessions",           connected: false, agents: ["🤖 AI Sales"],                               meta: "Would enable direct clinic booking sync" },
    ],
  },
];

const AGENT_NEEDS = [
  { initials: "FIN", bg: "#FAEEDA", color: "#633806", name: "AI Finance",         uses: "Stripe, GTBank · QuickBooks pending" },
  { initials: "DEV", bg: "#f3f4f6", color: "#6b7280", name: "AI Developer",       uses: "GitHub, Vercel · Calendly booking URL" },
  { initials: "PM",  bg: "#EDE9FE", color: "#5B21B6", name: "AI Product Manager", uses: "Calendly (booking context for pages)" },
  { initials: "LGL", bg: "#FCEBEB", color: "#791F1F", name: "AI Legal",           uses: "DocuSign" },
  { initials: "SA",  bg: "#E6F1FB", color: "#0C447C", name: "AI Sales",           uses: "WhatsApp, Calendly · Google Calendar pending" },
  { initials: "MK",  bg: "#EAF3DE", color: "#27500A", name: "AI Marketing",       uses: "WhatsApp, Calendly · Gmail pending" },
];

const RECENT = [
  { name: "Vercel",    detail: "connected — Week 2, by James S." },
  { name: "GitHub",    detail: "connected — Week 2, by James S." },
  { name: "DocuSign",  detail: "connected — Week 1, by you" },
];

const MODALS = {
  stripe:     { title: "Stripe",                       sub: "Connected · GTBank-linked payout account",   scopes: ["Read balance & transaction history", "Create & send invoices", "Log payment events to AI Finance"], note: "Cannot issue refunds or change account settings — those need you, directly in Stripe.", connected: true,  connectLabel: "Disconnect", connectToast: "Disconnected Stripe", connectDanger: true },
  bank:       { title: "GTBank Business",              sub: "Connected via Mono · read-only",             scopes: ["Read balance for cash-position tracking", "Read incoming/outgoing transfers"],                       note: "Read-only — AI Finance can see the balance but cannot move money from this account.", connected: true, connectLabel: "Disconnect", connectToast: "Disconnected GTBank", connectDanger: true },
  quickbooks: { title: "Connect QuickBooks",           sub: "Bookkeeping export for AI Finance",          scopes: ["Write transaction records", "Read chart of accounts"],                                                 note: "AI Finance will export a clean transaction ledger to QuickBooks weekly.", connected: false, connectLabel: "Connect →", connectToast: "Connected QuickBooks" },
  github:     { title: "GitHub",                       sub: "Connected · healthtrack-app repo",           scopes: ["Open pull requests, push branches", "Merge non-billing-related code", "Read issues & commit history"], note: "Merging billing-related code is locked in Autonomy Settings regardless of what GitHub permits.", connected: true, connectLabel: "Disconnect", connectToast: "Disconnected GitHub", connectDanger: true },
  vercel:     { title: "Vercel",                       sub: "Connected · staging + production",           scopes: ["Deploy to staging automatically", "Deploy to production — currently set to 'Ask first'"],              note: "Production deploys are adjustable in Autonomy Settings — James currently handles the final publish.", connected: true, connectLabel: "Disconnect", connectToast: "Disconnected Vercel", connectDanger: true },
  docusign:   { title: "DocuSign",                     sub: "Connected · 1 document pending",             scopes: ["Prepare documents from approved templates", "Track signature status"],                                   note: "Sending for signature is always locked — every document needs your approval first.", connected: true, connectLabel: "Disconnect", connectToast: "Disconnected DocuSign", connectDanger: true },
  zikorail:   { title: "WhatsApp Business (Zikorail)", sub: "Connected · 10 messages queued",             scopes: ["Draft & personalise outreach messages", "Track pipeline & replies"],                                    note: "Sending externally is always locked — AI Sales queues, you approve.", connected: true, connectLabel: "Disconnect", connectToast: "Disconnected WhatsApp", connectDanger: true },
  gmail:      { title: "Connect Gmail",                sub: "For AI Marketing nurture sequences",         scopes: ["Send email on your behalf (always escalated)", "Read replies to track engagement"],                     note: "AI Marketing will draft and schedule email sequences — sending still routes through your approval.", connected: false, connectLabel: "Connect →", connectToast: "Connected Gmail" },
  gcal:       { title: "Connect Google Calendar",      sub: "For AI Sales clinic booking sync",           scopes: ["Read calendar availability", "Propose booking slots (confirmation still requires the other party)"],     note: "AI Sales will propose real time slots in outreach messages instead of asking clinics to reply.", connected: false, connectLabel: "Connect →", connectToast: "Connected Google Calendar" },
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
      <div className="w-full max-w-[420px] overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <div className="font-body text-[14px] font-medium text-v2-heading">{data.title}</div>
            {data.sub && <div className="mt-0.5 font-body text-[11px] text-v2-muted">{data.sub}</div>}
          </div>
          <button type="button" onClick={onClose} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="px-5 py-4">
          {data.customDomain ? (
            <CustomDomainModalBody data={data} />
          ) : (
            <div className="flex flex-col gap-1.5">
              {(data.scopes || []).map((s, i) => (
                <div key={i} className="flex items-start gap-2 font-body text-[11px] text-gray-600">
                  <span className="shrink-0 text-[#1D9E75]">✓</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          )}
          {data.note && (
            <p className="mt-3 font-body text-[11px] text-v2-muted">{data.note}</p>
          )}
          {data.repoPicker && (
            <div className="mt-4 border-t border-gray-100 pt-3">
              <label className="mb-1 block font-body text-[11px] font-medium text-v2-heading">
                Default repo for AI Developer
              </label>
              <select
                value={data.selectedRepo || ""}
                disabled={data.repoBusy}
                onChange={(e) => data.onSelectRepo?.(e.target.value)}
                className="w-full rounded-lg border border-v2-border bg-white px-2.5 py-1.5 font-body text-[12px] text-v2-heading"
              >
                <option value="">Not set — AI PM will ask in chat</option>
                {(data.repoOptions || []).map((r) => (
                  <option key={r.fullName} value={r.fullName}>{r.fullName}</option>
                ))}
              </select>
              <p className="mt-1.5 font-body text-[11px] text-v2-muted">
                AI Product Manager builds into this repo automatically when a sprint plan has real code tasks — no need to name it in chat every time.
              </p>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-full border border-v2-border px-4 py-1.5 font-body text-[12px] font-medium text-v2-heading hover:bg-gray-50">Close</button>
          {/* Real gap found live, 2026-09-18: an already-connected integration
              whose stored token has gone stale server-side (GitHub returning
              "Bad credentials") had no way to force a fresh OAuth authorization
              — only "Disconnect" was offered, and a founder has no reason to
              think to disconnect first when the card still proudly says
              "Connected". A generic optional secondary action lets a specific
              integration's modal (see GitHub's connected-state config below)
              offer "Reconnect" alongside "Disconnect", reusing the exact same
              real connect flow, without a special-cased second button per
              integration. */}
          {data.secondaryLabel && (
            <button
              type="button"
              disabled={data.busy}
              onClick={() => data.secondaryAction?.()}
              className="rounded-full border border-v2-border px-4 py-1.5 font-body text-[12px] font-medium text-v2-heading transition-opacity hover:bg-gray-50 disabled:opacity-60"
            >
              {data.secondaryLabel}
            </button>
          )}
          {!data.customDomain && (
            <button
              type="button"
              disabled={data.busy || (data.real && !data.onAction)}
              onClick={async () => {
                if (data.onAction) {
                  await data.onAction();
                  return;
                }
                onClose();
                onToast(data.connectToast);
              }}
              className={cn(
                "rounded-full px-4 py-1.5 font-body text-[12px] font-medium transition-opacity hover:opacity-90 disabled:opacity-60",
                data.connectDanger
                  ? "border border-[#f3c9c9] bg-white text-[#791F1F]"
                  : "bg-v2-purple text-white"
              )}
            >
              {data.busy ? "Working…" : data.connectLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Real custom-domain modal body (2026-09-15, Part 3) — distinct enough
 * from the generic scopes-list + single-button modal (a live text input,
 * real DNS instructions, a status that changes over time) to warrant its
 * own dedicated render rather than bolting more special cases onto the
 * generic Modal shell the way repoPicker does.
 */
/* ── WhatsApp modals ──────────────────────────────────────────────────────── */
function WhatsAppConnectModal({ form, onChange, error, busy, onClose, onSubmit }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5" onClick={onClose}>
      <div className="w-full max-w-[460px] overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <div className="font-body text-[14px] font-medium text-v2-heading">Connect WhatsApp Business</div>
            <div className="mt-0.5 font-body text-[11px] text-v2-muted">Via Meta WhatsApp Cloud API — sends from your registered business number</div>
          </div>
          <button type="button" onClick={onClose} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </button>
        </div>
        <form onSubmit={onSubmit} className="px-5 py-4">
          <div className="mb-4 rounded-lg bg-v2-page px-3 py-2.5 font-body text-[11px] leading-relaxed text-v2-muted">
            <p className="mb-1"><strong className="text-v2-heading">Where to find these:</strong></p>
            <p>1. Go to <strong>Meta Business Manager → WhatsApp Manager → API Setup</strong></p>
            <p>2. Copy your <strong>Phone Number ID</strong> and <strong>Permanent Access Token</strong> (create a System User token for production).</p>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block font-body text-[11px] font-medium text-v2-heading">Phone Number ID</label>
              <input required type="text" placeholder="e.g. 123456789012345" value={form.phoneNumberId}
                onChange={(e) => onChange({ ...form, phoneNumberId: e.target.value })}
                className="w-full rounded-lg border border-v2-border bg-white px-2.5 py-1.5 font-body text-[12px] text-v2-heading focus:outline-none focus:ring-1 focus:ring-v2-purple" />
            </div>
            <div>
              <label className="mb-1 block font-body text-[11px] font-medium text-v2-heading">Permanent Access Token</label>
              <input required type="password" placeholder="EAAxxxxxx..." value={form.accessToken}
                onChange={(e) => onChange({ ...form, accessToken: e.target.value })}
                className="w-full rounded-lg border border-v2-border bg-white px-2.5 py-1.5 font-body text-[12px] text-v2-heading focus:outline-none focus:ring-1 focus:ring-v2-purple" />
            </div>
            <div>
              <label className="mb-1 block font-body text-[11px] font-medium text-v2-heading">Business display name (optional)</label>
              <input type="text" placeholder="e.g. HealthTrack by Adaeze" value={form.displayName}
                onChange={(e) => onChange({ ...form, displayName: e.target.value })}
                className="w-full rounded-lg border border-v2-border bg-white px-2.5 py-1.5 font-body text-[12px] text-v2-heading focus:outline-none focus:ring-1 focus:ring-v2-purple" />
            </div>
          </div>
          {error && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 font-body text-[11px] text-red-700">{error}</div>}
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-full border border-v2-border bg-white px-4 py-1.5 font-body text-[12px] font-medium text-v2-heading hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={busy || !form.accessToken || !form.phoneNumberId}
              className="rounded-full bg-[#25D366] px-4 py-1.5 font-body text-[12px] font-medium text-white hover:opacity-90 disabled:opacity-60">
              {busy ? "Verifying…" : "Connect WhatsApp →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function WhatsAppManageModal({ meta, busy, onClose, onDisconnect }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5" onClick={onClose}>
      <div className="w-full max-w-[420px] overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <div className="font-body text-[14px] font-medium text-v2-heading">WhatsApp Business</div>
            <div className="mt-0.5 font-body text-[11px] text-v2-muted">{meta?.displayName || "Connected"} · {meta?.fromPhoneNumber || ""}</div>
          </div>
          <button type="button" onClick={onClose} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="px-5 py-4">
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-[#EAF3DE] px-3 py-2">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#1D9E75]" />
            <span className="font-body text-[11px] font-medium text-[#27500A]">Connected via Meta Cloud API</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {["Send outreach messages from your WhatsApp Business number", "AI Sales drafts, you review — sent with one click", "Delivery receipts logged in AI Sales pipeline"].map((s) => (
              <div key={s} className="flex items-start gap-2 font-body text-[11px] text-gray-600">
                <span className="shrink-0 text-[#1D9E75]">✓</span><span>{s}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-full border border-v2-border bg-white px-4 py-1.5 font-body text-[12px] font-medium text-v2-heading hover:bg-gray-50">Close</button>
          <button type="button" disabled={busy} onClick={onDisconnect} className="rounded-full border border-[#f3c9c9] bg-white px-4 py-1.5 font-body text-[12px] font-medium text-[#791F1F] hover:bg-gray-50 disabled:opacity-60">
            {busy ? "Disconnecting…" : "Disconnect"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Social modals (LinkedIn / Instagram / Facebook) ─────────────────────── */
const SOCIAL_META = {
  linkedin:  { name: "LinkedIn",  color: "#0A66C2", placeholder: "https://linkedin.com/in/yourprofile", hint: "LinkedIn has no public DM API for cold outreach. AI Sales drafts your messages — you paste them in LinkedIn directly. Linking your profile URL lets the workspace open LinkedIn in one click." },
  instagram: { name: "Instagram", color: "#E1306C", placeholder: "https://instagram.com/yourhandle",   hint: "Instagram DM API is restricted to accounts that have messaged you first. AI Marketing drafts your captions & DMs — you post manually. Linking your handle opens Instagram in one click." },
  facebook:  { name: "Facebook",  color: "#1877F2", placeholder: "https://facebook.com/yourpage",     hint: "AI Marketing drafts your posts and messages — you post them manually. Linking your page URL opens Facebook in one click from the workspace." },
};

function SocialConnectModal({ type, form, onChange, error, busy, onClose, onSubmit }) {
  const meta = SOCIAL_META[type] || {};
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5" onClick={onClose}>
      <div className="w-full max-w-[440px] overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <div className="font-body text-[14px] font-medium text-v2-heading">Link {meta.name}</div>
            <div className="mt-0.5 font-body text-[11px] text-v2-muted">AI drafts · you send manually</div>
          </div>
          <button type="button" onClick={onClose} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </button>
        </div>
        <form onSubmit={onSubmit} className="px-5 py-4">
          <p className="mb-4 rounded-lg bg-v2-page px-3 py-2.5 font-body text-[11px] leading-relaxed text-v2-muted">{meta.hint}</p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block font-body text-[11px] font-medium text-v2-heading">Your {meta.name} profile / page URL *</label>
              <input required type="url" placeholder={meta.placeholder} value={form.profileUrl}
                onChange={(e) => onChange({ ...form, profileUrl: e.target.value })}
                className="w-full rounded-lg border border-v2-border bg-white px-2.5 py-1.5 font-body text-[12px] text-v2-heading focus:outline-none focus:ring-1 focus:ring-v2-purple" />
            </div>
            <div>
              <label className="mb-1 block font-body text-[11px] font-medium text-v2-heading">Display name (optional)</label>
              <input type="text" placeholder="e.g. HealthTrack Official" value={form.displayName}
                onChange={(e) => onChange({ ...form, displayName: e.target.value })}
                className="w-full rounded-lg border border-v2-border bg-white px-2.5 py-1.5 font-body text-[12px] text-v2-heading focus:outline-none focus:ring-1 focus:ring-v2-purple" />
            </div>
          </div>
          {error && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 font-body text-[11px] text-red-700">{error}</div>}
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-full border border-v2-border bg-white px-4 py-1.5 font-body text-[12px] font-medium text-v2-heading hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={busy || !form.profileUrl}
              style={{ background: meta.color }}
              className="rounded-full px-4 py-1.5 font-body text-[12px] font-medium text-white hover:opacity-90 disabled:opacity-60">
              {busy ? "Saving…" : `Link ${meta.name} →`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SocialManageModal({ type, meta, busy, onClose, onDisconnect }) {
  const info = SOCIAL_META[type] || {};
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5" onClick={onClose}>
      <div className="w-full max-w-[420px] overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <div className="font-body text-[14px] font-medium text-v2-heading">{info.name}</div>
            <div className="mt-0.5 font-body text-[11px] text-v2-muted">{meta?.displayName || "Profile linked"}</div>
          </div>
          <button type="button" onClick={onClose} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="px-5 py-4">
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-[#EAF3DE] px-3 py-2">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#1D9E75]" />
            <span className="font-body text-[11px] font-medium text-[#27500A]">Profile linked</span>
          </div>
          {meta?.profileUrl && (
            <a href={meta.profileUrl} target="_blank" rel="noopener noreferrer"
              className="mb-3 flex items-center gap-1.5 font-body text-[11px] text-[#0A66C2] hover:underline">
              {meta.profileUrl}
            </a>
          )}
          <p className="font-body text-[11px] text-v2-muted">AI Sales and AI Marketing will open your {info.name} profile in a new tab alongside the drafted content, ready for you to paste and send.</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-full border border-v2-border bg-white px-4 py-1.5 font-body text-[12px] font-medium text-v2-heading hover:bg-gray-50">Close</button>
          <button type="button" disabled={busy} onClick={onDisconnect} className="rounded-full border border-[#f3c9c9] bg-white px-4 py-1.5 font-body text-[12px] font-medium text-[#791F1F] hover:bg-gray-50 disabled:opacity-60">
            {busy ? "Removing…" : "Remove link"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Gmail modals ────────────────────────────────────────────────────────── */
function GmailConnectModal({ form, onChange, error, busy, onClose, onSubmit }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5" onClick={onClose}>
      <div className="w-full max-w-[440px] overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <div className="font-body text-[14px] font-medium text-v2-heading">Connect Gmail</div>
            <div className="mt-0.5 font-body text-[11px] text-v2-muted">Send outreach emails from your own inbox</div>
          </div>
          <button type="button" onClick={onClose} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </button>
        </div>
        <form onSubmit={onSubmit} className="px-5 py-4">
          <p className="mb-3 font-body text-[12px] leading-relaxed text-gray-600">
            Connect your Gmail using a <strong>Google App Password</strong> — not your regular password. This lets AI Sales and AI Marketing send outreach emails directly from your inbox so replies land with you.
          </p>
          <p className="mb-4 rounded-lg bg-v2-page px-3 py-2 font-body text-[11px] leading-relaxed text-v2-muted">
            To generate an App Password: Google Account → Security → 2-Step Verification → App passwords. Create one for "Mail".
          </p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block font-body text-[11px] font-medium text-v2-heading">Gmail address</label>
              <input type="email" required placeholder="you@gmail.com" value={form.email}
                onChange={(e) => onChange({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-v2-border bg-white px-2.5 py-1.5 font-body text-[12px] text-v2-heading focus:outline-none focus:ring-1 focus:ring-v2-purple" />
            </div>
            <div>
              <label className="mb-1 block font-body text-[11px] font-medium text-v2-heading">App Password (16 characters)</label>
              <input type="password" required placeholder="xxxx xxxx xxxx xxxx" value={form.appPassword}
                onChange={(e) => onChange({ ...form, appPassword: e.target.value })}
                className="w-full rounded-lg border border-v2-border bg-white px-2.5 py-1.5 font-body text-[12px] text-v2-heading focus:outline-none focus:ring-1 focus:ring-v2-purple" />
            </div>
            <div>
              <label className="mb-1 block font-body text-[11px] font-medium text-v2-heading">Display name in emails (optional)</label>
              <input type="text" placeholder="e.g. Adaeze from HealthTrack" value={form.displayName}
                onChange={(e) => onChange({ ...form, displayName: e.target.value })}
                className="w-full rounded-lg border border-v2-border bg-white px-2.5 py-1.5 font-body text-[12px] text-v2-heading focus:outline-none focus:ring-1 focus:ring-v2-purple" />
            </div>
          </div>
          {error && (
            <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 font-body text-[11px] text-red-700">{error}</div>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-full border border-v2-border bg-white px-4 py-1.5 font-body text-[12px] font-medium text-v2-heading hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={busy || !form.email || !form.appPassword}
              className="rounded-full bg-[#1B4FD8] px-4 py-1.5 font-body text-[12px] font-medium text-white opacity-100 hover:opacity-90 disabled:opacity-60">
              {busy ? "Verifying…" : "Connect Gmail →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function GmailManageModal({ displayName, busy, onClose, onDisconnect }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5" onClick={onClose}>
      <div className="w-full max-w-[420px] overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <div className="font-body text-[14px] font-medium text-v2-heading">Gmail</div>
            <div className="mt-0.5 font-body text-[11px] text-v2-muted">Connected as {displayName}</div>
          </div>
          <button type="button" onClick={onClose} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="px-5 py-4">
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-[#EAF3DE] px-3 py-2">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#1D9E75]" />
            <span className="font-body text-[11px] font-medium text-[#27500A]">Connected</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {["Send outreach emails directly from your inbox", "Log sent emails in the AI Sales pipeline", "Track sequence open/reply status per recipient"].map((s) => (
              <div key={s} className="flex items-start gap-2 font-body text-[11px] text-gray-600">
                <span className="shrink-0 text-[#1D9E75]">✓</span><span>{s}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 font-body text-[11px] text-v2-muted">To revoke access, disconnect below. You can reconnect anytime with a new App Password.</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-full border border-v2-border bg-white px-4 py-1.5 font-body text-[12px] font-medium text-v2-heading hover:bg-gray-50">Close</button>
          <button type="button" disabled={busy} onClick={onDisconnect} className="rounded-full border border-[#f3c9c9] bg-white px-4 py-1.5 font-body text-[12px] font-medium text-[#791F1F] hover:bg-gray-50 disabled:opacity-60">
            {busy ? "Disconnecting…" : "Disconnect Gmail"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CustomDomainModalBody({ data }) {
  if (!data.railwayConfigured) {
    return (
      <p className="font-body text-[12px] leading-relaxed text-v2-muted">
        Custom domains aren't set up on this server yet — this needs a real Railway API token and project configuration. Ask an admin to finish that setup before founders can connect their own domain.
      </p>
    );
  }

  if (!data.domain) {
    return (
      <div>
        <p className="font-body text-[11px] leading-relaxed text-v2-muted">
          Already own a domain (from Namecheap, GoDaddy, etc.)? Point it at your real StartupVerse product.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={data.inputValue || ""}
            onChange={(e) => data.onInputChange?.(e.target.value)}
            placeholder="myapp.com"
            className="flex-1 rounded-lg border border-v2-border bg-white px-2.5 py-1.5 font-body text-[12px] text-v2-heading"
          />
          <button
            type="button"
            disabled={data.busy || !data.inputValue?.trim()}
            onClick={data.onAdd}
            className="shrink-0 rounded-full bg-v2-purple px-4 py-1.5 font-body text-[12px] font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {data.busy ? "Adding…" : "Add domain"}
          </button>
        </div>
      </div>
    );
  }

  const { domain: name, cnameTarget, verificationToken, certificateStatus } = data.domain;
  const isLive = certificateStatus === "issued";

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="font-body text-[13px] font-medium text-v2-heading">{name}</span>
        <span
          className="rounded-full px-2 py-0.5 font-body text-[10px] font-medium"
          style={isLive ? { background: "#EAF3DE", color: "#27500A" } : certificateStatus === "failed" ? { background: "#FCEBEB", color: "#791F1F" } : { background: "#f3f4f6", color: "#6b7280" }}
        >
          {isLive ? "Live" : certificateStatus === "failed" ? "Failed" : "Pending DNS"}
        </span>
      </div>

      {!isLive && (
        <div className="mt-3 space-y-2 rounded-lg bg-v2-page p-3">
          <p className="font-body text-[11px] font-medium text-v2-heading">Add these real DNS records at your domain's registrar:</p>
          <div className="font-body text-[10px] text-v2-muted">
            <div className="font-medium text-v2-heading">CNAME</div>
            <div className="break-all">{cnameTarget || "(shown once Railway provisions this domain)"}</div>
          </div>
          <div className="font-body text-[10px] text-v2-muted">
            <div className="font-medium text-v2-heading">TXT (verification)</div>
            <div className="break-all">{verificationToken || "(shown once Railway provisions this domain)"}</div>
          </div>
          <p className="font-body text-[10px] text-v2-muted">DNS changes can take anywhere from a few minutes to a few hours to propagate. Refresh status once you've added both records.</p>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        {!isLive && (
          <button type="button" disabled={data.busy} onClick={data.onRefreshStatus} className="rounded-full border border-v2-border px-3 py-1.5 font-body text-[11px] font-medium text-v2-heading hover:bg-gray-50 disabled:opacity-60">
            {data.busy ? "Checking…" : "Refresh status"}
          </button>
        )}
        <button type="button" disabled={data.busy} onClick={data.onRemove} className="rounded-full border border-[#f3c9c9] bg-white px-3 py-1.5 font-body text-[11px] font-medium text-[#791F1F] hover:bg-gray-50 disabled:opacity-60">
          Remove domain
        </button>
      </div>
    </div>
  );
}

/* ── LinkedIn OAuth modals ────────────────────────────────────────────────── */
function LinkedInConnectModal({ configured, busy, onClose, onConnect }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5" onClick={onClose}>
      <div className="w-full max-w-[440px] overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <div className="font-body text-[14px] font-medium text-v2-heading">Connect LinkedIn</div>
            <div className="mt-0.5 font-body text-[11px] text-v2-muted">Post AI-drafted content directly from your LinkedIn account</div>
          </div>
          <button type="button" onClick={onClose} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="px-5 py-4">
          <p className="mb-4 rounded-lg bg-v2-page px-3 py-2.5 font-body text-[11px] leading-relaxed text-v2-muted">
            You'll be redirected to LinkedIn to authorize access. Once connected, AI Marketing can publish posts directly to your profile — no copy-pasting needed.
          </p>
          <div className="flex flex-col gap-1.5">
            {["Publish posts to your LinkedIn profile on your behalf", "AI Marketing drafts the content — you review before it posts", "Token stored securely, revocable from LinkedIn settings anytime"].map((s) => (
              <div key={s} className="flex items-start gap-2 font-body text-[11px] text-gray-600">
                <span className="shrink-0 text-[#1D9E75]">✓</span><span>{s}</span>
              </div>
            ))}
          </div>
          {!configured && (
            <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 font-body text-[11px] text-amber-700">
              LinkedIn OAuth isn't configured on this server yet — set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET in the server .env.
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-full border border-v2-border bg-white px-4 py-1.5 font-body text-[12px] font-medium text-v2-heading hover:bg-gray-50">Cancel</button>
          <button type="button" disabled={busy || !configured} onClick={onConnect}
            className="rounded-full bg-[#0A66C2] px-4 py-1.5 font-body text-[12px] font-medium text-white hover:opacity-90 disabled:opacity-60">
            {busy ? "Opening LinkedIn…" : "Connect via LinkedIn →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function LinkedInManageModal({ meta, busy, onClose, onDisconnect }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5" onClick={onClose}>
      <div className="w-full max-w-[420px] overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <div className="font-body text-[14px] font-medium text-v2-heading">LinkedIn</div>
            <div className="mt-0.5 font-body text-[11px] text-v2-muted">Connected as {meta?.displayName || "your account"}</div>
          </div>
          <button type="button" onClick={onClose} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="px-5 py-4">
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-[#EAF3DE] px-3 py-2">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#1D9E75]" />
            <span className="font-body text-[11px] font-medium text-[#27500A]">Connected via LinkedIn OAuth — real posting enabled</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {["AI Marketing can publish posts directly to your LinkedIn", "Review content in the Marketing workspace before posting", "Token is scoped to posting only — cannot read your inbox or connections"].map((s) => (
              <div key={s} className="flex items-start gap-2 font-body text-[11px] text-gray-600">
                <span className="shrink-0 text-[#1D9E75]">✓</span><span>{s}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 font-body text-[11px] text-v2-muted">To fully revoke access, also remove the app from your LinkedIn settings → Security → Authorized apps.</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-full border border-v2-border bg-white px-4 py-1.5 font-body text-[12px] font-medium text-v2-heading hover:bg-gray-50">Close</button>
          <button type="button" disabled={busy} onClick={onDisconnect} className="rounded-full border border-[#f3c9c9] bg-white px-4 py-1.5 font-body text-[12px] font-medium text-[#791F1F] hover:bg-gray-50 disabled:opacity-60">
            {busy ? "Disconnecting…" : "Disconnect LinkedIn"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Integration card ──────────────────────────────────────────────────────── */
function IntCard({ item, onOpen }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-v2-border bg-white px-4 py-3">
      {/* Icon + name */}
      <div className="flex min-w-[200px] items-center gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] font-body text-[15px] font-semibold text-white"
          style={{ background: item.iconBg, color: item.iconColor ?? "#fff" }}
        >
          {item.iconLabel}
        </div>
        <div className="min-w-0">
          <div className="font-body text-[12px] font-medium text-v2-heading">{item.name}</div>
          <div className="font-body text-[10px] text-v2-muted">{item.sub}</div>
        </div>
      </div>

      {/* Status badge */}
      <span
        className="shrink-0 rounded-[6px] px-2.5 py-1 font-body text-[9px] font-medium"
        style={item.connected
          ? { background: "#EAF3DE", color: "#27500A" }
          : { background: "#f3f4f6", color: "#6b7280" }}
      >
        {item.connected ? "Connected" : "Not connected"}
      </span>

      {/* Agent tags */}
      <div className="flex flex-wrap gap-1.5">
        {item.agents.map((a) => (
          <span key={a} className="rounded-[6px] bg-gray-100 px-2 py-0.5 font-body text-[9px] font-medium text-v2-muted">{a}</span>
        ))}
      </div>

      {/* Meta */}
      <div className="min-w-[150px] font-body text-[10px] text-v2-muted">{item.meta}</div>

      {/* Action */}
      <div className="ml-auto shrink-0">
        <button
          type="button"
          onClick={() => onOpen(item.id)}
          className={cn(
            "rounded-[9px] px-4 py-1.5 font-body text-[11px] font-medium transition-opacity hover:opacity-90",
            item.connected
              ? "border border-v2-border bg-white text-v2-heading"
              : "bg-[#1B4FD8] text-white"
          )}
        >
          {item.connected ? "Manage" : "Connect"}
        </button>
      </div>
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
export default function V2Integrations({ user, onBack, onNavigate }) {
  const officeFounderId = useOfficeStore((s) => s.founderId);
  const founderId = officeFounderId || String(user?._id ?? user?.id ?? "");
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [gh, setGh] = useState({ connected: false, configured: true, githubLogin: "" });
  const [ghBusy, setGhBusy] = useState(false);
  const [defaultRepo, setDefaultRepoState] = useState({ owner: "", repo: "" });
  const [repoOptions, setRepoOptions] = useState([]);
  const [repoBusy, setRepoBusy] = useState(false);
  const [cd, setCd] = useState({ domain: null, railwayConfigured: false });
  const [cdBusy, setCdBusy] = useState(false);
  const [cdInput, setCdInput] = useState("");
  const [cal, setCal] = useState({ connected: false, configured: true, bookingUrl: "" });
  const [calBusy, setCalBusy] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailMeta, setGmailMeta] = useState({ displayName: "" });
  const [gmailBusy, setGmailBusy] = useState(false);
  const [gmailModal, setGmailModal] = useState(null); // null | "connect" | "manage"
  const [gmailForm, setGmailForm] = useState({ email: "", appPassword: "", displayName: "" });
  const [gmailError, setGmailError] = useState("");

  // WhatsApp Business
  const [waConnected, setWaConnected] = useState(false);
  const [waMeta, setWaMeta] = useState({});
  const [waBusy, setWaBusy] = useState(false);
  const [waModal, setWaModal] = useState(null); // null | "connect" | "manage"
  const [waForm, setWaForm] = useState({ accessToken: "", phoneNumberId: "", displayName: "" });
  const [waError, setWaError] = useState("");

  // Social profiles (instagram, facebook — copy-paste mode)
  const [socialConnections, setSocialConnections] = useState({}); // { instagram: { connected, meta }, facebook: { connected, meta } }
  const [socialModal, setSocialModal] = useState(null); // null | { mode:"connect"|"manage", type }
  const [socialForm, setSocialForm] = useState({ profileUrl: "", displayName: "" });
  const [socialBusy, setSocialBusy] = useState(false);
  const [socialError, setSocialError] = useState("");

  // LinkedIn OAuth (real posting)
  const [liConnected, setLiConnected] = useState(false);
  const [liMeta, setLiMeta] = useState({});
  const [liBusy, setLiBusy] = useState(false);
  const [liModal, setLiModal] = useState(null); // null | "connect" | "manage"

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2400); };

  const refreshCustomDomain = useCallback(async () => {
    if (!founderId) return;
    try {
      const data = await customDomainApi.getCustomDomain(founderId);
      setCd(data);
    } catch (err) {
      showToast(err?.message || "Could not check custom domain status.");
    }
  }, [founderId]);

  useEffect(() => { refreshCustomDomain(); }, [refreshCustomDomain]);

  const addCustomDomain = async () => {
    const domain = cdInput.trim().toLowerCase();
    if (!domain) return;
    setCdBusy(true);
    try {
      await customDomainApi.createCustomDomain(founderId, domain);
      await refreshCustomDomain();
      setCdInput("");
      showToast(`${domain} added — configure the real DNS records below to finish.`);
    } catch (err) {
      showToast(err?.message || "Could not add that domain.");
    } finally {
      setCdBusy(false);
    }
  };

  const refreshCustomDomainStatus = async () => {
    setCdBusy(true);
    try {
      const data = await customDomainApi.refreshCustomDomainStatus(founderId);
      setCd((prev) => ({ ...prev, domain: data.domain }));
      showToast(data.domain?.certificateStatus === "issued" ? "Domain is live!" : "Still pending — DNS can take a while to propagate.");
    } catch (err) {
      showToast(err?.message || "Could not refresh domain status.");
    } finally {
      setCdBusy(false);
    }
  };

  const removeCustomDomain = async () => {
    setCdBusy(true);
    try {
      await customDomainApi.deleteCustomDomain(founderId);
      await refreshCustomDomain();
      setModal(null);
      showToast("Custom domain removed.");
    } catch (err) {
      showToast(err?.message || "Could not remove the domain.");
    } finally {
      setCdBusy(false);
    }
  };

  const refreshCalendly = useCallback(async () => {
    if (!founderId) return;
    try {
      const status = await calendlyApi.getCalendlyConnection(founderId);
      setCal(status);
    } catch { /* non-fatal */ }
  }, [founderId]);

  useEffect(() => { refreshCalendly(); }, [refreshCalendly]);

  const connectCalendly = () => {
    setCalBusy(true);
    calendlyApi.getCalendlyAuthorizeUrl()
      .then((data) => {
        if (!data.authUrl) throw new Error("Calendly authorize URL missing.");
        const popup = window.open(data.authUrl, "Calendly OAuth", "width=600,height=700");
        if (!popup) throw new Error("Allow popups to connect Calendly.");
        const timer = setInterval(() => {
          if (popup.closed) {
            clearInterval(timer);
            refreshCalendly().finally(() => { setCalBusy(false); setModal(null); showToast("Calendly connected — new bookings will appear in your Execution Engine"); });
          }
        }, 500);
      })
      .catch((err) => { showToast(err?.message || "Could not start Calendly connect."); setCalBusy(false); });
  };

  const disconnectCalendlyConn = async () => {
    setCalBusy(true);
    try {
      await calendlyApi.disconnectCalendly(founderId);
      await refreshCalendly();
      showToast("Disconnected Calendly — new bookings won't create tasks until you reconnect.");
    } catch (err) {
      showToast(err?.message || "Could not disconnect Calendly.");
    } finally {
      setCalBusy(false);
      setModal(null);
    }
  };

  const refreshDynamicIntegrations = useCallback(async () => {
    if (!founderId) return;
    try {
      const list = await getIntegrations(founderId);
      const byType = Object.fromEntries(list.map((i) => [i.type, i]));

      const gm = byType["gmail"];
      setGmailConnected(gm?.status === "connected");
      setGmailMeta(gm?.meta || { displayName: "" });

      const wa = byType["whatsapp"];
      setWaConnected(wa?.status === "connected");
      setWaMeta(wa?.meta || {});

      // LinkedIn — OAuth mode (personUrn present) takes precedence over copy-paste mode
      const li = byType["linkedin"];
      const liIsOAuth = li?.status === "connected" && Boolean(li?.meta?.personUrn);
      setLiConnected(liIsOAuth);
      setLiMeta(li?.meta || {});

      const SOCIAL_TYPES = ["instagram", "facebook"];
      const social = {};
      for (const type of SOCIAL_TYPES) {
        const rec = byType[type];
        social[type] = { connected: rec?.status === "connected", meta: rec?.meta || {} };
      }
      setSocialConnections(social);
    } catch { /* non-fatal */ }
  }, [founderId]);

  useEffect(() => { refreshDynamicIntegrations(); }, [refreshDynamicIntegrations]);

  // Keep old alias so existing openModal("gmail") code still works
  const refreshGmail = refreshDynamicIntegrations;

  const refreshGithub = useCallback(async () => {
    try {
      const status = await githubApi.getGithubConnection();
      setGh(status);
    } catch (err) {
      showToast(err?.message || "Could not check GitHub status.");
    }
  }, []);

  useEffect(() => {
    refreshGithub();
    githubApi.getDefaultGithubRepo().then(setDefaultRepoState).catch(() => {});
  }, [refreshGithub]);

  const connectGithub = () => {
    setGhBusy(true);
    githubApi.getGithubAuthorizeUrl()
      .then((data) => {
        if (!data.authUrl) throw new Error("GitHub authorize URL missing.");
        const popup = window.open(data.authUrl, "GitHub OAuth", "width=600,height=700");
        if (!popup) throw new Error("Allow popups to connect GitHub.");
        // Real bug found live, 2026-09-18: this used to declare success the
        // instant the popup window closed, regardless of whether OAuth
        // actually completed — a founder whose token had gone stale on
        // GitHub's side (real "Bad credentials" errors) reconnected, saw
        // "GitHub connected," and the token was never actually refreshed.
        // Now waits for the real outcome the callback page posts (see
        // github.controller.js's popupHtml) instead of guessing from the
        // window closing — a closed popup with no real signal is treated as
        // "didn't complete," not silently assumed to be success.
        let settled = false;
        const finish = (ok) => {
          if (settled) return;
          settled = true;
          window.removeEventListener("message", onMessage);
          clearInterval(timer);
          refreshGithub().finally(() => {
            setGhBusy(false);
            setModal(null);
            showToast(ok ? "GitHub connected" : "GitHub connect didn't complete — try again.");
          });
        };
        const onMessage = (event) => {
          if (event.data?.source === "startupverse-github-oauth") finish(Boolean(event.data.ok));
        };
        window.addEventListener("message", onMessage);
        const timer = setInterval(() => {
          if (popup.closed) finish(false);
        }, 500);
      })
      .catch((err) => { showToast(err?.message || "Could not start GitHub connect."); setGhBusy(false); });
  };

  const disconnectGithub = async () => {
    setGhBusy(true);
    try {
      await githubApi.disconnectGithub();
      await refreshGithub();
      showToast("Disconnected GitHub — AI Developer can't open PRs until you reconnect.");
    } catch (err) {
      showToast(err?.message || "Could not disconnect GitHub.");
    } finally {
      setGhBusy(false);
      setModal(null);
    }
  };

  const selectDefaultRepo = async (fullName) => {
    setRepoBusy(true);
    try {
      if (!fullName) {
        // No "unset" endpoint — an empty selection just means "haven't
        // picked one," which is already the default state server-side.
        // Nothing to persist; only update the modal so the dropdown reflects it.
        setDefaultRepoState({ owner: "", repo: "" });
        setModal((m) => (m ? { ...m, selectedRepo: "" } : m));
        return;
      }
      const [owner, repo] = fullName.split("/");
      await githubApi.setDefaultGithubRepo(owner, repo);
      setDefaultRepoState({ owner, repo });
      setModal((m) => (m ? { ...m, selectedRepo: fullName } : m));
      showToast(`AI Developer's default repo is now ${fullName}`);
    } catch (err) {
      showToast(err?.message || "Could not save the default repo.");
    } finally {
      setRepoBusy(false);
    }
  };

  const openModal = async (key) => {
    if (key === "gmail") {
      if (gmailConnected) {
        setGmailModal("manage");
      } else {
        setGmailForm({ email: "", appPassword: "", displayName: "" });
        setGmailError("");
        setGmailModal("connect");
      }
      return;
    }
    if (key === "whatsapp") {
      if (waConnected) {
        setWaModal("manage");
      } else {
        setWaForm({ accessToken: "", phoneNumberId: "", displayName: "" });
        setWaError("");
        setWaModal("connect");
      }
      return;
    }
    if (key === "linkedin") {
      if (liConnected) {
        setLiModal("manage");
      } else {
        setLiModal("connect");
      }
      return;
    }
    if (key === "instagram" || key === "facebook") {
      const conn = socialConnections[key] || {};
      if (conn.connected) {
        setSocialModal({ mode: "manage", type: key });
      } else {
        setSocialForm({ profileUrl: "", displayName: "" });
        setSocialError("");
        setSocialModal({ mode: "connect", type: key });
      }
      return;
    }
    if (key === "calendly") {
      if (cal.connected) {
        setModal({
          title: "Calendly", sub: `Connected · ${cal.bookingUrl}`,
          scopes: [
            "Your real booking URL is shared with AI PM and AI Developer automatically",
            "New Calendly bookings create tasks in your Execution Engine",
          ],
          note: "Disconnecting removes the webhook — new bookings won't create tasks until you reconnect.",
          connectLabel: "Disconnect", connectDanger: true, real: true, busy: calBusy, onAction: disconnectCalendlyConn,
        });
        return;
      }
      setModal({
        title: "Connect Calendly", sub: "Let AI PM, AI Sales, and AI Developer use your real booking URL",
        scopes: [
          "Read your Calendly booking URL",
          "Subscribe to booking events — new meetings appear as Execution Engine tasks",
        ],
        note: cal.configured
          ? "You'll be redirected to Calendly to authorize access. AI Developer will automatically wire your booking URL into any landing page or outreach flow it builds."
          : "Calendly OAuth isn't configured on this server yet — ask an admin to set CALENDLY_CLIENT_ID/SECRET.",
        connectLabel: cal.configured ? "Connect →" : "Not available",
        real: true, busy: calBusy, onAction: cal.configured ? connectCalendly : undefined,
      });
      return;
    }
    if (key === "github") {
      if (gh.connected) {
        setModal({
          title: "GitHub", sub: `Connected as ${gh.githubLogin}`,
          scopes: ["Open pull requests, push branches", "Merge to staging autonomously", "Deploy to production — always locked, always waits for you"],
          note: "Deploying to production is permanently locked in Autonomy Settings, regardless of what this token permits. If AI Developer starts failing with \"Bad credentials\", your token has likely gone stale on GitHub's side — use Reconnect below rather than assuming something here is broken.",
          connectLabel: "Disconnect", connectDanger: true, real: true, busy: ghBusy, onAction: disconnectGithub,
          secondaryLabel: gh.configured ? "Reconnect →" : undefined, secondaryAction: gh.configured ? connectGithub : undefined,
          repoPicker: true, repoOptions, repoBusy,
          selectedRepo: defaultRepo.owner && defaultRepo.repo ? `${defaultRepo.owner}/${defaultRepo.repo}` : "",
          onSelectRepo: selectDefaultRepo,
        });
        try {
          const { repos } = await githubApi.listGithubRepos();
          setRepoOptions(repos || []);
          setModal((m) => (m ? { ...m, repoOptions: repos || [] } : m));
        } catch {
          // Repo list is a nice-to-have here — the picker just stays empty
          // if it fails; the connection itself already succeeded.
        }
        return;
      }
      setModal({
        title: "Connect GitHub", sub: "Real per-founder OAuth connection — the same one AI Developer's workspace uses",
        scopes: ["Read your repos", "Open pull requests, push branches", "Read issues & commit history"],
        note: gh.configured ? "You'll be redirected to GitHub to authorize access." : "GitHub OAuth isn't configured on this server yet — ask an admin to set GITHUB_CLIENT_ID/SECRET.",
        connectLabel: gh.configured ? "Connect →" : "Not available", real: true, busy: ghBusy, onAction: gh.configured ? connectGithub : undefined,
      });
      return;
    }
    if (key === "custom-domain") {
      setModal({
        title: "Custom domain", sub: "Point a domain you already own at your real hosted product",
        customDomain: true, real: true, busy: cdBusy,
        domain: cd.domain, railwayConfigured: cd.railwayConfigured,
        inputValue: cdInput, onInputChange: setCdInput,
        onAdd: addCustomDomain, onRefreshStatus: refreshCustomDomainStatus, onRemove: removeCustomDomain,
      });
      return;
    }
    setModal(MODALS[key] ?? null);
  };
  const closeModal = () => setModal(null);

  const sections = SECTIONS.map((section) => ({
    ...section,
    items: section.items.map((item) => item.id === "github"
      ? { ...item, connected: gh.connected, meta: gh.connected ? `Connected as ${gh.githubLogin}` : "Not connected yet" }
      : item.id === "custom-domain"
      ? { ...item, connected: cd.domain?.certificateStatus === "issued", meta: cd.domain ? `${cd.domain.domain} — ${cd.domain.certificateStatus}` : "Not set up yet" }
      : item.id === "calendly"
      ? { ...item, connected: cal.connected, meta: cal.connected ? `Connected · ${cal.bookingUrl}` : "Not connected yet" }
      : item.id === "gmail"
      ? { ...item, connected: gmailConnected, meta: gmailConnected ? `Sending as ${gmailMeta?.displayName || "Gmail"}` : "Would enable email nurture sequences" }
      : item.id === "whatsapp"
      ? { ...item, connected: waConnected, meta: waConnected ? `Connected · ${waMeta?.fromPhoneNumber || waMeta?.displayName || "WhatsApp Business"}` : "Enables real WhatsApp sending" }
      : item.id === "linkedin"
      ? { ...item, connected: liConnected, meta: liConnected ? `Connected as ${liMeta?.displayName || "LinkedIn"} · posts directly` : "Connect via OAuth to post directly" }
      : (item.id === "instagram" || item.id === "facebook")
      ? (() => { const c = socialConnections[item.id] || {}; return { ...item, connected: c.connected, meta: c.connected ? `Profile linked · copy & open to send` : "Copy-to-clipboard sending" }; })()
      : item),
  }));
  const connectedCount = sections.flatMap((s) => s.items).filter((i) => i.connected).length;

  // The custom-domain modal's input/status are live top-level state (typed
  // characters, a status refresh) rather than a one-time snapshot taken
  // when the modal opened — re-merge the freshest values in on every
  // render instead of trusting what openModal captured at open time.
  const modalData = modal?.customDomain
    ? { ...modal, busy: cdBusy, domain: cd.domain, railwayConfigured: cd.railwayConfigured, inputValue: cdInput }
    : modal;

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-v2-page">

      {/* ── Left scrollable column ── */}
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">

        {/* Topbar */}
        <div className="flex shrink-0 items-center justify-between gap-3 rounded-2xl border border-v2-border bg-white px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-body text-[13px] font-semibold text-v2-heading">Integrations</span>
            <span className="text-gray-300">·</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF3DE] px-2.5 py-1 font-body text-[11px] font-medium text-[#27500A]">
              <span className="h-[5px] w-[5px] rounded-full bg-[#1D9E75]" />{connectedCount} connected · {sections.flatMap((s) => s.items).length - connectedCount} available
            </span>
          </div>
          <button type="button" onClick={() => onNavigate?.("workroom")} className="rounded-full border border-v2-border bg-white px-3 py-1.5 font-body text-[12px] font-medium text-v2-heading hover:bg-gray-50 transition-colors">
            Agent Workroom
          </button>
        </div>

        {/* Sections */}
        {sections.map((section) => (
          <div key={section.title} className="space-y-2.5">
            <div>
              <div className="font-body text-[13px] font-medium text-v2-heading">{section.title}</div>
              <div className="mt-0.5 font-body text-[11px] text-v2-muted">{section.sub}</div>
            </div>
            {section.items.map((item) => (
              <IntCard key={item.id} item={item} onOpen={openModal} />
            ))}
          </div>
        ))}

      </div>

      {/* ── Right panel ── */}
      <div className="flex w-[320px] shrink-0 flex-col gap-3 overflow-y-auto border-l border-v2-border bg-white p-4">

        {/* Which agents need what */}
        <div className="rounded-2xl bg-v2-page p-3">
          <div className="mb-2 font-heading text-[11px] font-semibold text-v2-heading">Which agents need what</div>
          {[
            ...AGENT_NEEDS.filter((a) => !["SA","MK"].includes(a.initials)),
            {
              initials: "SA", bg: "#E6F1FB", color: "#0C447C", name: "AI Sales",
              uses: [waConnected && "WhatsApp ✓", "Gmail", liConnected ? "LinkedIn ✓" : "LinkedIn", "Google Calendar"].filter(Boolean).join(" · ") + (waConnected ? "" : " (WhatsApp pending)"),
            },
            {
              initials: "MK", bg: "#EAF3DE", color: "#27500A", name: "AI Marketing",
              uses: [gmailConnected && "Gmail ✓", waConnected && "WhatsApp ✓", liConnected ? "LinkedIn ✓" : "LinkedIn", "Instagram", "Facebook"].filter(Boolean).join(" · ") + (!gmailConnected && !waConnected && !liConnected ? " (all pending)" : ""),
            },
          ].map((a) => (
            <div key={a.initials} className="flex items-start gap-2.5 border-b border-gray-100 py-2 last:border-b-0">
              <div className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] font-body text-[8px] font-semibold" style={{ background: a.bg, color: a.color }}>
                {a.initials}
              </div>
              <div className="min-w-0">
                <div className="font-body text-[11px] font-medium text-v2-heading">{a.name}</div>
                <div className="font-body text-[10px] text-v2-muted">{a.uses}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Recently connected */}
        <div className="rounded-2xl bg-v2-page p-3">
          <div className="mb-2 font-heading text-[11px] font-semibold text-v2-heading">Recently connected</div>
          {RECENT.map((r) => (
            <div key={r.name} className="flex items-start gap-2 border-b border-gray-100 py-1.5 last:border-b-0 font-body text-[10px] text-gray-600">
              <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1B4FD8]" />
              <span><strong className="font-medium text-v2-heading">{r.name}</strong> {r.detail}</span>
            </div>
          ))}
        </div>

        {/* Note on access */}
        <div className="rounded-2xl bg-v2-page p-3">
          <div className="mb-2 font-heading text-[11px] font-semibold text-v2-heading">A note on access</div>
          <p className="font-body text-[10px] leading-relaxed text-v2-muted">
            Each connection only grants the specific scope an agent needs — AI Finance can read Stripe balances and create invoices, but can't change account settings or issue refunds without you. Disconnecting anytime pauses that agent's related actions immediately.
          </p>
        </div>

      </div>

      <Modal data={modalData} onClose={closeModal} onToast={showToast} onNavigate={onNavigate} />
      <Toast msg={toast} />

      {/* Gmail modals */}
      {/* WhatsApp modals */}
      {waModal === "connect" && (
        <WhatsAppConnectModal
          form={waForm}
          onChange={setWaForm}
          error={waError}
          busy={waBusy}
          onClose={() => setWaModal(null)}
          onSubmit={async (e) => {
            e.preventDefault();
            if (!waForm.accessToken || !waForm.phoneNumberId) return;
            setWaBusy(true);
            setWaError("");
            try {
              await apiConnectWhatsApp(founderId, { accessToken: waForm.accessToken, phoneNumberId: waForm.phoneNumberId, displayName: waForm.displayName });
              setWaModal(null);
              showToast("WhatsApp Business connected");
              await refreshDynamicIntegrations();
            } catch (err) {
              setWaError(err?.message || "Could not verify WhatsApp credentials.");
            } finally {
              setWaBusy(false);
            }
          }}
        />
      )}
      {waModal === "manage" && waConnected && (
        <WhatsAppManageModal
          meta={waMeta}
          busy={waBusy}
          onClose={() => setWaModal(null)}
          onDisconnect={async () => {
            setWaBusy(true);
            try {
              await apiDisconnectWhatsApp(founderId);
              setWaConnected(false);
              setWaMeta({});
              setWaModal(null);
              showToast("Disconnected WhatsApp Business");
            } catch { showToast("Could not disconnect WhatsApp."); }
            finally { setWaBusy(false); }
          }}
        />
      )}

      {/* Social (LinkedIn / Instagram / Facebook) modals */}
      {socialModal?.mode === "connect" && (
        <SocialConnectModal
          type={socialModal.type}
          form={socialForm}
          onChange={setSocialForm}
          error={socialError}
          busy={socialBusy}
          onClose={() => setSocialModal(null)}
          onSubmit={async (e) => {
            e.preventDefault();
            if (!socialForm.profileUrl) return;
            setSocialBusy(true);
            setSocialError("");
            try {
              await apiConnectSocial(founderId, { type: socialModal.type, profileUrl: socialForm.profileUrl, displayName: socialForm.displayName });
              setSocialModal(null);
              showToast(`${socialModal.type.charAt(0).toUpperCase() + socialModal.type.slice(1)} profile linked`);
              await refreshDynamicIntegrations();
            } catch (err) {
              setSocialError(err?.message || "Could not save profile.");
            } finally {
              setSocialBusy(false);
            }
          }}
        />
      )}
      {socialModal?.mode === "manage" && (
        <SocialManageModal
          type={socialModal.type}
          meta={(socialConnections[socialModal.type] || {}).meta || {}}
          busy={socialBusy}
          onClose={() => setSocialModal(null)}
          onDisconnect={async () => {
            setSocialBusy(true);
            try {
              await apiDisconnectSocial(founderId, socialModal.type);
              setSocialConnections((prev) => ({ ...prev, [socialModal.type]: { connected: false, meta: {} } }));
              setSocialModal(null);
              showToast(`Disconnected ${socialModal.type}`);
            } catch { showToast("Could not disconnect."); }
            finally { setSocialBusy(false); }
          }}
        />
      )}

      {gmailModal === "connect" && (
        <GmailConnectModal
          form={gmailForm}
          onChange={(f) => setGmailForm(f)}
          error={gmailError}
          busy={gmailBusy}
          onClose={() => setGmailModal(null)}
          onSubmit={async (e) => {
            e.preventDefault();
            if (!gmailForm.email || !gmailForm.appPassword) return;
            setGmailBusy(true);
            setGmailError("");
            try {
              await apiConnectGmail(founderId, {
                email: gmailForm.email,
                appPassword: gmailForm.appPassword,
                displayName: gmailForm.displayName || gmailForm.email,
              });
              setGmailModal(null);
              showToast("Gmail connected — AI Sales and AI Marketing can now send emails from your inbox");
              await refreshGmail();
            } catch (err) {
              setGmailError(err?.message || "Could not verify Gmail credentials. Check your email and App Password.");
            } finally {
              setGmailBusy(false);
            }
          }}
        />
      )}

      {gmailModal === "manage" && gmailConnected && (
        <GmailManageModal
          displayName={gmailMeta?.displayName || "Gmail"}
          busy={gmailBusy}
          onClose={() => setGmailModal(null)}
          onDisconnect={async () => {
            setGmailBusy(true);
            try {
              await apiDisconnectGmail(founderId);
              setGmailConnected(false);
              setGmailMeta({ displayName: "" });
              setGmailModal(null);
              showToast("Disconnected Gmail");
            } catch {
              showToast("Could not disconnect Gmail.");
            } finally {
              setGmailBusy(false);
            }
          }}
        />
      )}

      {/* LinkedIn OAuth modals */}
      {liModal === "connect" && (
        <LinkedInConnectModal
          configured={true}
          busy={liBusy}
          onClose={() => setLiModal(null)}
          onConnect={async () => {
            setLiBusy(true);
            try {
              const data = await getLinkedInAuthUrl(founderId);
              if (!data?.authUrl) throw new Error(data?.message || "LinkedIn OAuth is not configured on this server — set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET in the server .env.");
              const popup = window.open(data.authUrl, "LinkedIn OAuth", "width=600,height=700");
              if (!popup) throw new Error("Allow popups to connect LinkedIn.");
              const timer = setInterval(() => {
                if (popup.closed) {
                  clearInterval(timer);
                  refreshDynamicIntegrations().finally(() => {
                    setLiBusy(false);
                    setLiModal(null);
                    showToast("LinkedIn connected — AI Marketing can now post directly");
                  });
                }
              }, 500);
            } catch (err) {
              showToast(err?.message || "Could not start LinkedIn connect.");
              setLiBusy(false);
            }
          }}
        />
      )}
      {liModal === "manage" && liConnected && (
        <LinkedInManageModal
          meta={liMeta}
          busy={liBusy}
          onClose={() => setLiModal(null)}
          onDisconnect={async () => {
            setLiBusy(true);
            try {
              await apiDisconnectLinkedIn(founderId);
              setLiConnected(false);
              setLiMeta({});
              setLiModal(null);
              showToast("Disconnected LinkedIn");
            } catch { showToast("Could not disconnect LinkedIn."); }
            finally { setLiBusy(false); }
          }}
        />
      )}
    </div>
  );
}
