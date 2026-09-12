/**
 * V2AutonomySettings — per-agent autonomy controls
 * Each agent card expands to show permission toggles (Autonomous / Ask first)
 * Locked permissions (money, contracts, external sends) cannot be changed.
 */

import React, { useState, useCallback } from "react";
import { cn } from "../ui/utils";
import { ChevronDown } from "lucide-react";

/* ── Static data ─────────────────────────────────────────────────────────── */
const AGENTS = [
  {
    id: "pm", initials: "PM", bg: "#EEEDFE", color: "#534AB7",
    name: "AI Product Manager", role: "Sprint planning · execution tracking",
    summaryLabel: "Mostly autonomous", summaryBg: "#EAF3DE", summaryColor: "#27500A",
    perms: [
      { id: "p1", name: "Draft & update sprint plans",        desc: "Rebuilding priority stacks, adjusting milestones as new data comes in.", default: "auto",  locked: false },
      { id: "p2", name: "Push plan live to Execution Engine", desc: "Makes the plan visible and actionable for the whole team.",               default: "ask",   locked: false },
    ],
  },
  {
    id: "mk", initials: "MK", bg: "#EAF3DE", color: "#27500A",
    name: "AI Marketing", role: "Content, campaigns, brand voice",
    summaryLabel: "Mostly autonomous", summaryBg: "#EAF3DE", summaryColor: "#27500A",
    perms: [
      { id: "p3", name: "Draft content & campaign ideas",   desc: "Blog posts, ad copy, email drafts, landing page copy.",                            default: "auto", locked: false },
      { id: "p4", name: "Publish or schedule content live", desc: "Brand-voice calls currently route to Chidinma A. (Marketing role) instead of you.", default: "ask",  locked: false },
    ],
  },
  {
    id: "sa", initials: "SA", bg: "#E6F1FB", color: "#0C447C",
    name: "AI Sales", role: "Outreach, pipeline, follow-ups",
    summaryLabel: "Mixed", summaryBg: "#FAEEDA", summaryColor: "#633806",
    perms: [
      { id: "p5", name: "Draft & personalise outreach",         desc: "Writing and queuing messages, researching prospects.",                      default: "auto", locked: false },
      { id: "p6", name: "Send messages externally",             desc: "Any outward-facing message to a customer or prospect always escalates.",    default: "ask",  locked: true, lockLabel: "🔒 Locked" },
    ],
  },
  {
    id: "dev", initials: "DEV", bg: "#f3f4f6", color: "#6b7280",
    name: "AI Developer", role: "Code, deploys, GitHub",
    summaryLabel: "Mixed", summaryBg: "#FAEEDA", summaryColor: "#633806",
    perms: [
      { id: "p7", name: "Write code & deploy to staging",  desc: "Opening PRs, fixing bugs, staging builds for review.",                                        default: "auto", locked: false },
      { id: "p8", name: "Merge billing-related code",      desc: "Anything touching Stripe, pricing, or payment logic.",                                         default: "ask",  locked: true, lockLabel: "🔒 Locked" },
      { id: "p9", name: "Deploy to production",            desc: "Currently James S. handles final publish manually — you could hand this fully to the agent.", default: "ask",  locked: false },
    ],
  },
  {
    id: "ga", initials: "GA", bg: "#E6F1FB", color: "#0C447C",
    name: "AI Growth Analyst", role: "Interview & data analysis",
    summaryLabel: "Fully autonomous", summaryBg: "#EAF3DE", summaryColor: "#27500A",
    perms: [
      { id: "p10", name: "Read & analyse execution data", desc: "Read-only — no external actions possible, so there's nothing to escalate.", default: "auto", locked: true, lockLabel: "✓ Always on", lockGreen: true },
    ],
  },
  {
    id: "fin", initials: "FIN", bg: "#FAEEDA", color: "#633806",
    name: "AI Finance", role: "Invoicing & bookkeeping",
    summaryLabel: "Mixed", summaryBg: "#FAEEDA", summaryColor: "#633806",
    perms: [
      { id: "p11", name: "Track cash & log transactions", desc: "Read-only bookkeeping — no money moves, so this always runs freely.", default: "auto", locked: true, lockLabel: "✓ Always on", lockGreen: true },
      { id: "p12", name: "Send invoices or payments",     desc: "Anything that moves money always escalates to you, no exceptions.",    default: "ask",  locked: true, lockLabel: "🔒 Locked" },
    ],
  },
  {
    id: "lgl", initials: "LGL", bg: "#FCEBEB", color: "#791F1F",
    name: "AI Legal", role: "Contracts & compliance",
    summaryLabel: "Mixed", summaryBg: "#FAEEDA", summaryColor: "#633806",
    perms: [
      { id: "p13", name: "Draft from approved templates",    desc: "Only fills in names/dates on templates your lawyer already reviewed — no clause edits possible.", default: "auto", locked: true, lockLabel: "✓ Always on", lockGreen: true },
      { id: "p14", name: "Send documents for signature",     desc: "Any binding document always needs your sign-off before it goes out.",                             default: "ask",  locked: true, lockLabel: "🔒 Locked" },
    ],
  },
];

/* ── Toast ─────────────────────────────────────────────────────────────────── */
function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-gray-900 px-5 py-2.5 font-body text-[12px] font-medium text-white shadow-lg">
      {msg}
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────────────────── */
export default function V2AutonomySettings({ onBack, onNavigate }) {
  const [open, setOpen]   = useState(new Set(["pm"])); // PM expanded by default
  const [perms, setPerms] = useState(() => {
    const m = {};
    AGENTS.forEach((a) => a.perms.forEach((p) => { m[p.id] = p.default; }));
    return m;
  });
  const [paused, setPaused] = useState(false);
  const [toast, setToast]   = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2400); };

  const toggleCard = (id) =>
    setOpen((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  const setPermValue = useCallback((permId, val) => {
    setPerms((prev) => ({ ...prev, [permId]: val }));
    showToast(`Setting updated`);
  }, []);

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
            <span className="font-body text-[13px] font-medium text-v2-heading">Autonomy Settings</span>
            <span className="text-gray-300">·</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF3DE] px-2.5 py-1 font-body text-[11px] font-medium text-[#27500A]">
              <span className="h-[5px] w-[5px] rounded-full bg-[#1D9E75]" />7 agents configured
            </span>
          </div>
          <button type="button" onClick={onBack} className="flex items-center gap-1.5 rounded-full border border-v2-border bg-white px-3 py-1.5 font-body text-[12px] font-medium text-v2-heading hover:bg-gray-50 transition-colors">
            Agent Workroom
          </button>
        </div>

        <div className="space-y-3 p-5">

          {/* Intro */}
          <div className="rounded-2xl border border-v2-border bg-white p-4">
            <div className="mb-1 font-heading text-[13px] font-semibold text-v2-heading">Who decides what</div>
            <p className="font-body text-[11px] leading-relaxed text-v2-muted">
              For each agent, choose what it can do on its own versus what it hands to you. Some actions — anything touching money, contracts, or an outward-facing message — are locked to "Ask first" for every startup on StartupVerse and can't be changed here.
            </p>
          </div>

          {/* Agent cards */}
          {AGENTS.map((agent) => (
            <div key={agent.id} className="overflow-hidden rounded-2xl border border-v2-border bg-white">
              <button
                type="button"
                onClick={() => toggleCard(agent.id)}
                className="flex w-full items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] font-body text-[11px] font-semibold" style={{ background: agent.bg, color: agent.color }}>
                  {agent.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-body text-[12px] font-medium text-v2-heading">{agent.name}</div>
                  <div className="font-body text-[10px] text-v2-muted">{agent.role}</div>
                </div>
                <span className="shrink-0 rounded-lg px-2.5 py-1 font-body text-[10px] font-medium" style={{ background: agent.summaryBg, color: agent.summaryColor }}>
                  {agent.summaryLabel}
                </span>
                <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform", open.has(agent.id) && "rotate-180")} />
              </button>

              {open.has(agent.id) && (
                <div className="border-t border-gray-100 px-4 pb-4">
                  {agent.perms.map((perm) => (
                    <div key={perm.id} className="flex items-center justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 font-body text-[12px] font-medium text-v2-heading">
                          {perm.name}
                          {perm.lockLabel && (
                            <span className={cn("inline-flex items-center gap-1 rounded-[5px] px-2 py-0.5 font-body text-[9px]", perm.lockGreen ? "bg-[#EAF3DE] text-[#27500A]" : "bg-[#FCEBEB] text-[#791F1F]")}>
                              {perm.lockLabel}
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 font-body text-[10px] leading-snug text-v2-muted">{perm.desc}</div>
                      </div>
                      <div className={cn("flex shrink-0 items-center gap-0.5 rounded-full bg-gray-100 p-0.5", perm.locked && "opacity-60 pointer-events-none")}>
                        {[["auto","Autonomous"],["ask","Ask first"]].map(([val, label]) => (
                          <button
                            key={val}
                            type="button"
                            disabled={perm.locked}
                            onClick={() => !perm.locked && setPermValue(perm.id, val)}
                            className={cn(
                              "rounded-full px-3 py-1.5 font-body text-[10px] font-medium whitespace-nowrap transition-colors",
                              perms[perm.id] === val
                                ? perm.lockGreen ? "bg-[#1D9E75] text-white" : "bg-v2-purple text-white"
                                : "text-v2-muted hover:text-v2-heading"
                            )}
                          >{label}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex w-[320px] shrink-0 flex-col gap-3 overflow-y-auto border-l border-v2-border bg-white p-4">

        {/* Pause all */}
        <div className="rounded-2xl bg-v2-page p-3">
          <div className="mb-1.5 font-heading text-[11px] font-semibold text-v2-heading">Pause everything</div>
          <div className="flex items-center justify-between">
            <span className="font-body text-[11px] text-v2-heading">{paused ? "Agents paused" : "All agents active"}</span>
            <button
              type="button"
              onClick={() => { setPaused((p) => !p); showToast(paused ? "Agents resumed" : "All agents paused"); }}
              className={cn("relative h-6 w-10 rounded-full transition-colors", paused ? "bg-gray-300" : "bg-[#1D9E75]")}
            >
              <div className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", paused ? "left-0.5" : "left-[18px]")} />
            </button>
          </div>
          <p className="mt-2 font-body text-[10px] leading-relaxed text-v2-muted">
            Stops every agent from starting new work. Current tasks finish, nothing new begins. Human teammates aren't affected.
          </p>
        </div>

        {/* Legend */}
        <div className="rounded-2xl bg-v2-page p-3">
          <div className="mb-2 font-heading text-[11px] font-semibold text-v2-heading">Setting guide</div>
          {[
            { dot: "#1D9E75", label: "Autonomous", desc: "Agent completes this without asking — you see it in the Audit Trail afterwards." },
            { dot: "#534AB7", label: "Ask first",  desc: "Agent prepares it fully then puts it in your Approval Queue before doing anything." },
            { dot: "#791F1F", label: "Locked",     desc: "Platform-level rule. Can't be overridden. Protects you from irreversible actions." },
          ].map((r) => (
            <div key={r.label} className="flex items-start gap-2 py-1.5">
              <div className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: r.dot }} />
              <div>
                <span className="font-body text-[10px] font-semibold text-v2-heading">{r.label} </span>
                <span className="font-body text-[10px] text-v2-muted">{r.desc}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Recent changes */}
        <div className="rounded-2xl bg-v2-page p-3">
          <div className="mb-2 font-heading text-[11px] font-semibold text-v2-heading">Recent changes</div>
          {[
            { text: "AI Sales · Send messages → Ask first", when: "You, 3 days ago" },
            { text: "AI Developer · Deploy to production → Ask first", when: "You, 1 week ago" },
            { text: "AI Marketing · Publish content → Ask first", when: "You, 2 weeks ago" },
          ].map((c, i) => (
            <div key={i} className="flex items-start gap-2 border-b border-gray-100 py-1.5 last:border-b-0">
              <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-v2-purple" />
              <div>
                <div className="font-body text-[10px] text-v2-heading">{c.text}</div>
                <div className="font-body text-[9px] text-v2-muted">{c.when}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Toast msg={toast} />
    </div>
  );
}
