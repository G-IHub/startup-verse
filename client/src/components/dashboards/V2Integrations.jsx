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
      { id: "zikorail", iconBg: "#25D366", iconLabel: "W",  name: "WhatsApp Business (Zikorail)", sub: "Outreach, pipeline, booking",        connected: true,  agents: ["🤖 AI Sales", "🤖 AI Marketing"],           meta: "Last synced 7:52am today · 10 messages queued" },
      { id: "gmail",    iconBg: "#EA4335", iconLabel: "✉",  name: "Gmail",                        sub: "Email drafts, notifications",        connected: false, agents: ["🤖 AI Marketing", "🤖 AI Product Manager"],  meta: "Would enable email nurture sequences" },
      { id: "gcal",     iconBg: "#4285F4", iconLabel: "📅", name: "Google Calendar",              sub: "Booking, mentor sessions",           connected: false, agents: ["🤖 AI Sales"],                               meta: "Would enable direct clinic booking sync" },
    ],
  },
];

const AGENT_NEEDS = [
  { initials: "FIN", bg: "#FAEEDA", color: "#633806", name: "AI Finance",         uses: "Stripe, GTBank · QuickBooks pending" },
  { initials: "DEV", bg: "#f3f4f6", color: "#6b7280", name: "AI Developer",       uses: "GitHub, Vercel" },
  { initials: "LGL", bg: "#FCEBEB", color: "#791F1F", name: "AI Legal",           uses: "DocuSign" },
  { initials: "SA",  bg: "#E6F1FB", color: "#0C447C", name: "AI Sales",           uses: "WhatsApp · Calendar pending" },
  { initials: "MK",  bg: "#EAF3DE", color: "#27500A", name: "AI Marketing",       uses: "WhatsApp · Gmail pending" },
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
        const timer = setInterval(() => {
          if (popup.closed) {
            clearInterval(timer);
            refreshGithub().finally(() => { setGhBusy(false); setModal(null); showToast("GitHub connected"); });
          }
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
    if (key === "github") {
      if (gh.connected) {
        setModal({
          title: "GitHub", sub: `Connected as ${gh.githubLogin}`,
          scopes: ["Open pull requests, push branches", "Merge to staging autonomously", "Deploy to production — always locked, always waits for you"],
          note: "Deploying to production is permanently locked in Autonomy Settings, regardless of what this token permits.",
          connectLabel: "Disconnect", connectDanger: true, real: true, busy: ghBusy, onAction: disconnectGithub,
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
          {AGENT_NEEDS.map((a) => (
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
    </div>
  );
}
