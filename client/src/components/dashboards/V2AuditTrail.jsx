/**
 * V2AuditTrail — searchable, filterable log of every agent + human action
 */

import React, { useState, useMemo } from "react";
import { cn } from "../ui/utils";
import { Search } from "lucide-react";

/* ── Log data ─────────────────────────────────────────────────────────────── */
const LOG_ENTRIES = [
  { id: "l1",  time: "9:10am", range: ["today","week"], actor: "lgl",      actorType: "agent",  av: { initials: "LGL", bg: "#FCEBEB", color: "#791F1F" }, name: "AI Legal",           desc: "Drafted NDA for backend candidate, escalated to founder",                           status: "awaiting-you",      statusLabel: "Awaiting you",      statusBg: "#FCEBEB", statusColor: "#791F1F",  link: "AI Legal" },
  { id: "l2",  time: "9:02am", range: ["today","week"], actor: "fin",      actorType: "agent",  av: { initials: "FIN", bg: "#FAEEDA", color: "#633806" }, name: "AI Finance",         desc: "Drafted invoice INV-1042 for Reddington Clinic, ₦180,000 — escalated to founder",  status: "awaiting-you",      statusLabel: "Awaiting you",      statusBg: "#FCEBEB", statusColor: "#791F1F",  link: "Approval Queue" },
  { id: "l3",  time: "8:32am", range: ["today","week"], actor: "dev",      actorType: "agent",  av: { initials: "DEV", bg: "#f3f4f6", color: "#6b7280" }, name: "AI Developer",       desc: "Flagged PR #15 as billing-related, held from merging without approval",             status: "awaiting-you",      statusLabel: "Awaiting you",      statusBg: "#FCEBEB", statusColor: "#791F1F",  link: "Approval Queue" },
  { id: "l4",  time: "8:15am", range: ["today","week"], actor: "pm",       actorType: "agent",  av: { initials: "PM",  bg: "#EEEDFE", color: "#534AB7" }, name: "AI Product Manager", desc: "Rebuilt Week 5 priority stack, queued for founder review",                          status: "awaiting-you",      statusLabel: "Awaiting you",      statusBg: "#FCEBEB", statusColor: "#791F1F",  link: "Approval Queue" },
  { id: "l5",  time: "8:10am", range: ["today","week"], actor: "ga",       actorType: "agent",  av: { initials: "GA",  bg: "#E6F1FB", color: "#0C447C" }, name: "AI Growth Analyst",  desc: "Flagged 8/8 interview validation rate as unusually strong, passed to AI PM",       status: "autonomous",        statusLabel: "Autonomous",        statusBg: "#f3f4f6", statusColor: "#6b7280",  link: "Workroom" },
  { id: "l6",  time: "7:58am", range: ["today","week"], actor: "mk",       actorType: "agent",  av: { initials: "MK",  bg: "#EAF3DE", color: "#27500A" }, name: "AI Marketing",       desc: "Routed Week 5 nurture email to Chidinma for brand-voice review",                   status: "awaiting-team",     statusLabel: "Awaiting Chidinma", statusBg: "#FCF7EC", statusColor: "#633806",  link: "Approval Queue" },
  { id: "l7",  time: "7:52am", range: ["today","week"], actor: "sa",       actorType: "agent",  av: { initials: "SA",  bg: "#E6F1FB", color: "#0C447C" }, name: "AI Sales",           desc: "Personalised and queued 10 clinic outreach messages, escalated send decision",     status: "awaiting-you",      statusLabel: "Awaiting you",      statusBg: "#FCEBEB", statusColor: "#791F1F",  link: "Approval Queue" },
  { id: "l8",  time: "7:40am", range: ["today","week"], actor: "mk",       actorType: "agent",  av: { initials: "MK",  bg: "#EAF3DE", color: "#27500A" }, name: "AI Marketing",       desc: "Drafted 10 clinic outreach messages using Vezeeta Blueprint script",               status: "autonomous",        statusLabel: "Autonomous",        statusBg: "#f3f4f6", statusColor: "#6b7280",  link: "Workroom" },
  { id: "l9",  time: "7:03am", range: ["today","week"], actor: "james",    actorType: "human",  av: { initials: "JS",  bg: "#E6F1FB", color: "#0C447C" }, name: "James S.",           desc: "Published landing page to production, marked Milestone M1 complete",               status: "human",             statusLabel: "Human action",      statusBg: "#EAF3DE", statusColor: "#27500A",  link: "Workroom" },
  { id: "l10", time: "6:22am", range: ["today","week"], actor: "dev",      actorType: "agent",  av: { initials: "DEV", bg: "#f3f4f6", color: "#6b7280" }, name: "AI Developer",       desc: "Merged PR #14 and deployed to staging, handed off to James for publish",           status: "autonomous",        statusLabel: "Autonomous",        statusBg: "#f3f4f6", statusColor: "#6b7280",  link: "Workroom" },
  { id: "l11", time: "6:14am", range: ["today","week"], actor: "dev",      actorType: "agent",  av: { initials: "DS",  bg: "#FAEEDA", color: "#633806" }, name: "AI Designer",        desc: "Approved hero-final-v3.png + 2 more, handed PR #14 back to AI Developer",         status: "autonomous",        statusLabel: "Autonomous",        statusBg: "#f3f4f6", statusColor: "#6b7280",  link: "Workroom" },
  { id: "l12", time: "6:02am", range: ["today","week"], actor: "dev",      actorType: "agent",  av: { initials: "DEV", bg: "#f3f4f6", color: "#6b7280" }, name: "AI Developer",       desc: "Opened PR #14 (landing page hero) and tagged AI Designer for asset review",       status: "autonomous",        statusLabel: "Autonomous",        statusBg: "#f3f4f6", statusColor: "#6b7280",  link: "Workroom" },
  { id: "l13", time: "Yesterday", range: ["week"],      actor: "mk",       actorType: "agent",  av: { initials: "MK",  bg: "#EAF3DE", color: "#27500A" }, name: "AI Marketing",       desc: "Declined to boost social spend — ₦40,000 budget increase request rejected by founder", status: "declined",       statusLabel: "Declined",          statusBg: "#FCEBEB", statusColor: "#791F1F",  link: "Workroom" },
  { id: "l14", time: "Yesterday", range: ["week"],      actor: "ga",       actorType: "agent",  av: { initials: "GA",  bg: "#E6F1FB", color: "#0C447C" }, name: "AI Growth Analyst",  desc: "Interview validation rate: 100% on 8 interviews — above average, recommend more",  status: "autonomous",        statusLabel: "Autonomous",        statusBg: "#f3f4f6", statusColor: "#6b7280",  link: "Workroom" },
  { id: "l15", time: "3 days ago", range: [],           actor: "pm",       actorType: "agent",  av: { initials: "PM",  bg: "#EEEDFE", color: "#534AB7" }, name: "AI Product Manager", desc: "Pushed Week 4 sprint plan to Execution Engine after founder approval",             status: "approved",          statusLabel: "Approved",          statusBg: "#EAF3DE", statusColor: "#27500A",  link: "Workroom" },
  { id: "l16", time: "3 days ago", range: [],           actor: "founder",  actorType: "human",  av: { initials: "AO",  bg: "#E6F1FB", color: "#0C447C" }, name: "You (Adaeze)",       desc: "Approved Week 4 sprint plan and pushed it to execution",                           status: "human",             statusLabel: "Human action",      statusBg: "#EAF3DE", statusColor: "#27500A",  link: "Workroom" },
];

const ACTOR_OPTIONS = [
  { id: "all",      label: "All actors" },
  { id: "pm",       label: "🤖 AI Product Manager" },
  { id: "mk",       label: "🤖 AI Marketing" },
  { id: "sa",       label: "🤖 AI Sales" },
  { id: "dev",      label: "🤖 AI Developer" },
  { id: "ga",       label: "🤖 AI Growth Analyst" },
  { id: "fin",      label: "🤖 AI Finance" },
  { id: "lgl",      label: "🤖 AI Legal" },
  { id: "james",    label: "👤 James S." },
  { id: "chidinma", label: "👤 Chidinma A." },
  { id: "founder",  label: "👤 You (Adaeze)" },
];

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-gray-900 px-5 py-2.5 font-body text-[12px] font-medium text-white shadow-lg">
      {msg}
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────────────────── */
export default function V2AuditTrail({ onBack }) {
  const [range, setRange]   = useState("all");
  const [actor, setActor]   = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [actorOpen, setActorOpen] = useState(false);
  const [toast, setToast]   = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2400); };

  const filtered = useMemo(() => {
    let list = LOG_ENTRIES;
    if (range === "today")  list = list.filter((e) => e.range.includes("today"));
    if (range === "week")   list = list.filter((e) => e.range.includes("week"));
    if (actor !== "all")    list = list.filter((e) => e.actor === actor);
    if (status === "auto")     list = list.filter((e) => e.status === "autonomous");
    if (status === "approved") list = list.filter((e) => e.status === "approved");
    if (status === "declined") list = list.filter((e) => e.status === "declined");
    if (status === "human")    list = list.filter((e) => e.status === "human");
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((e) => (e.name + " " + e.desc).toLowerCase().includes(q));
    }
    return list;
  }, [range, actor, status, search]);

  const todayEntries    = filtered.filter((e) => e.range.includes("today"));
  const prevEntries     = filtered.filter((e) => !e.range.includes("today"));

  const actorLabel = ACTOR_OPTIONS.find((o) => o.id === actor)?.label ?? "All";

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-v2-page">

      {/* ── Main ── */}
      <div className="min-h-0 flex-1 overflow-y-auto">

        {/* Topbar */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-v2-border bg-white px-5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={onBack} className="font-body text-[12px] text-v2-muted hover:text-v2-heading transition-colors">← Back</button>
            <span className="text-gray-300">·</span>
            <span className="font-body text-[12px] text-v2-muted">AI Staff</span>
            <span className="text-gray-300">›</span>
            <span className="font-body text-[13px] font-medium text-v2-heading">Audit Trail</span>
            <span className="text-gray-300">·</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF3DE] px-2.5 py-1 font-body text-[11px] font-medium text-[#27500A]">
              <span className="h-[5px] w-[5px] rounded-full bg-[#1D9E75]" />{filtered.length} entries
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={onBack} className="flex items-center gap-1.5 rounded-full border border-v2-border bg-white px-3 py-1.5 font-body text-[12px] font-medium text-v2-heading hover:bg-gray-50 transition-colors">
              Agent Workroom
            </button>
            <button type="button" onClick={() => showToast("Exporting CSV…")} className="flex items-center gap-1.5 rounded-full bg-v2-purple px-3 py-1.5 font-body text-[12px] font-medium text-white hover:opacity-90 transition-opacity">
              Export CSV →
            </button>
          </div>
        </div>

        <div className="space-y-3 p-5">

          {/* Filter bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">

              {/* Date range */}
              <div className="flex items-center gap-0.5 rounded-full bg-gray-100 p-0.5">
                {[["all","All time"],["week","This week"],["today","Today"]].map(([id, label]) => (
                  <button key={id} type="button" onClick={() => setRange(id)}
                    className={cn("rounded-full px-3 py-1.5 font-body text-[11px] font-medium transition-colors",
                      range === id ? "bg-white text-v2-heading shadow-sm" : "text-v2-muted hover:text-v2-heading"
                    )}
                  >{label}</button>
                ))}
              </div>

              {/* Actor dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActorOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full border border-v2-border bg-white px-3 py-1.5 font-body text-[11px] font-medium text-v2-heading hover:bg-gray-50 transition-colors"
                >
                  Actor: <span className="text-v2-muted">{actor === "all" ? "All" : actorLabel.replace(/^[🤖👤]\s/,"")}</span>
                  <svg width="9" height="6" viewBox="0 0 9 6" fill="none"><path d="M1 1l3.5 3.5L8 1" stroke="#6b7280" strokeWidth="1.3"/></svg>
                </button>
                {actorOpen && (
                  <div className="absolute left-0 top-9 z-20 max-h-64 w-52 overflow-y-auto rounded-xl border border-v2-border bg-white py-1.5 shadow-lg">
                    {ACTOR_OPTIONS.map((opt) => (
                      <button key={opt.id} type="button"
                        onClick={() => { setActor(opt.id); setActorOpen(false); }}
                        className={cn("flex w-full items-center gap-2 px-3 py-1.5 font-body text-[11px] text-left hover:bg-gray-50 transition-colors",
                          actor === opt.id ? "bg-[#EEEDFE] font-medium text-v2-purple" : "text-v2-heading"
                        )}
                      >{opt.label}</button>
                    ))}
                  </div>
                )}
              </div>

              {/* Status filters */}
              <div className="flex gap-1.5">
                {[["all","All"],["auto","Autonomous"],["approved","Approved"],["declined","Declined"],["human","Human action"]].map(([id, label]) => (
                  <button key={id} type="button" onClick={() => setStatus(id)}
                    className={cn("rounded-full border px-3 py-1.5 font-body text-[11px] font-medium transition-colors",
                      status === id ? "border-gray-900 bg-gray-900 text-white" : "border-v2-border bg-white text-v2-muted hover:text-v2-heading"
                    )}
                  >{label}</button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
              <input
                type="text" placeholder="Search log…" value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-44 rounded-full border border-v2-border bg-white py-1.5 pl-7 pr-3 font-body text-[11px] outline-none focus:border-v2-purple"
              />
            </div>
          </div>

          {/* Today */}
          {todayEntries.length > 0 && (
            <>
              <div className="flex items-center gap-3">
                <span className="shrink-0 font-body text-[10px] font-semibold uppercase tracking-wider text-v2-muted">Today · Week 5</span>
                <div className="h-px flex-1 bg-v2-border" />
              </div>
              <div className="overflow-hidden rounded-2xl border border-v2-border bg-white">
                {todayEntries.map((entry, i) => (
                  <LogRow key={entry.id} entry={entry} last={i === todayEntries.length - 1} />
                ))}
              </div>
            </>
          )}

          {/* Earlier */}
          {prevEntries.length > 0 && (
            <>
              <div className="flex items-center gap-3">
                <span className="shrink-0 font-body text-[10px] font-semibold uppercase tracking-wider text-v2-muted">Earlier</span>
                <div className="h-px flex-1 bg-v2-border" />
              </div>
              <div className="overflow-hidden rounded-2xl border border-v2-border bg-white">
                {prevEntries.map((entry, i) => (
                  <LogRow key={entry.id} entry={entry} last={i === prevEntries.length - 1} />
                ))}
              </div>
            </>
          )}

          {filtered.length === 0 && (
            <div className="rounded-2xl border border-v2-border bg-white p-12 text-center">
              <div className="font-heading text-[14px] font-medium text-v2-heading">No entries match your filters</div>
              <div className="mt-1 font-body text-[12px] text-v2-muted">Try changing the date range or removing filters.</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex w-[320px] shrink-0 flex-col gap-3 overflow-y-auto border-l border-v2-border bg-white p-4">

        {/* Summary stats */}
        <div className="rounded-2xl bg-v2-page p-3">
          <div className="mb-2 font-heading text-[11px] font-semibold text-v2-heading">This week</div>
          {[
            { k: "Total actions",      v: "18 entries" },
            { k: "Autonomous",         v: "10 actions" },
            { k: "Escalated to you",   v: "5 decisions" },
            { k: "Routed to teammates",v: "2 items" },
            { k: "Declined",           v: "1 item" },
          ].map((r) => (
            <div key={r.k} className="flex items-center justify-between border-b border-gray-100 py-1 last:border-b-0">
              <span className="font-body text-[10px] text-v2-muted">{r.k}</span>
              <span className="font-body text-[10px] font-medium text-v2-heading">{r.v}</span>
            </div>
          ))}
        </div>

        {/* By agent */}
        <div className="rounded-2xl bg-v2-page p-3">
          <div className="mb-2 font-heading text-[11px] font-semibold text-v2-heading">Actions by agent</div>
          {[
            { initials: "MK",  bg: "#EAF3DE", color: "#27500A", name: "AI Marketing",        count: 4 },
            { initials: "DEV", bg: "#f3f4f6", color: "#6b7280", name: "AI Developer",        count: 3 },
            { initials: "PM",  bg: "#EEEDFE", color: "#534AB7", name: "AI Product Manager",  count: 3 },
            { initials: "GA",  bg: "#E6F1FB", color: "#0C447C", name: "AI Growth Analyst",   count: 3 },
            { initials: "SA",  bg: "#E6F1FB", color: "#0C447C", name: "AI Sales",            count: 2 },
          ].map((a) => (
            <div key={a.initials} className="flex items-center gap-2 border-b border-gray-100 py-1.5 last:border-b-0">
              <div className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] font-body text-[8px] font-semibold" style={{ background: a.bg, color: a.color }}>{a.initials}</div>
              <span className="flex-1 font-body text-[10px] text-gray-600">{a.name}</span>
              <span className="font-body text-[10px] font-medium text-v2-heading">{a.count}</span>
            </div>
          ))}
        </div>

        {/* Why this log matters */}
        <div className="rounded-2xl bg-v2-page p-3">
          <div className="mb-1.5 font-heading text-[11px] font-semibold text-v2-heading">Why this log matters</div>
          <p className="font-body text-[10px] leading-relaxed text-v2-muted">
            Every entry captures the agent or human who acted, the data they used, and what they decided. Nothing runs silently — you have a complete record you can search, filter, and export.
          </p>
        </div>
      </div>

      <Toast msg={toast} />
    </div>
  );
}

/* ── Log row sub-component ─────────────────────────────────────────────────── */
function LogRow({ entry, last }) {
  return (
    <div className={cn("flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors", !last && "border-b border-gray-100")}>
      <span className="w-[52px] shrink-0 font-body text-[10px] text-v2-muted">{entry.time}</span>
      <div className="relative shrink-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-[8px] font-body text-[9px] font-semibold" style={{ background: entry.av.bg, color: entry.av.color }}>{entry.av.initials}</div>
        <div className={cn("absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full border border-white text-[6px]", entry.actorType === "agent" ? "bg-[#534AB7] text-white" : "bg-[#1B4FD8] text-white")}>
          {entry.actorType === "agent" ? "⚡" : "👤"}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-body text-[11px] font-medium text-v2-heading">{entry.name}</div>
        <div className="font-body text-[11px] text-v2-muted">{entry.desc}</div>
      </div>
      <span className="shrink-0 rounded-lg px-2 py-0.5 font-body text-[9px] font-medium whitespace-nowrap" style={{ background: entry.statusBg, color: entry.statusColor }}>{entry.statusLabel}</span>
      <span className="shrink-0 font-body text-[10px] text-v2-blue hover:underline">{entry.link} →</span>
    </div>
  );
}
