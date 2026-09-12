/**
 * V2ApprovalQueue — full approval queue page for AI Staff
 * Accessed from Workroom topbar "Approval queue" button or ApprovalCard "Open full queue" link
 */

import React, { useState, useMemo } from "react";
import { cn } from "../ui/utils";
import { Search, CheckCircle2 } from "lucide-react";

/* ── Agent → real workspace page, mirrors the mockup's clickable avatars ───── */
const AGENT_WORKSPACE_PAGE = {
  "AI Sales": "agent-sales",
  "AI Marketing": "agent-marketing",
  "AI Finance": "agent-finance",
  "AI Legal": "agent-legal",
};

/* ── Static data ─────────────────────────────────────────────────────────── */
const QUEUE_ITEMS = [
  {
    id: "q1", view: "you", risk: "low",
    agent: { initials: "SA", bg: "#E6F1FB", color: "#0C447C" },
    title: "Send 10 clinic outreach messages",
    riskLabel: "Low risk", riskBg: "#f3f4f6", riskColor: "#6b7280",
    desc: "AI Sales personalised and queued all 10 — Lagos Island + VI, using the Vezeeta supply-first script. Held because sending is external-facing.",
    agentName: "AI Sales", waitingOn: "you", time: "7:52am today",
    primaryLabel: "Send all →", primaryAction: "Sent 10 clinic messages",
  },
  {
    id: "q2", view: "you", risk: "high",
    agent: { initials: "DEV", bg: "#f3f4f6", color: "#6b7280" },
    title: "Merge PR #15 — pricing page",
    riskLabel: "Touches billing", riskBg: "#FCEBEB", riskColor: "#791F1F",
    desc: "Updates the Stripe price IDs. AI Developer flagged this itself and won't merge without a human, regardless of autonomy setting.",
    agentName: "AI Developer", waitingOn: "you", time: "8:32am today",
    primaryLabel: "Approve merge", primaryAction: "Merged PR #15",
  },
  {
    id: "q3", view: "you", risk: "low",
    agent: { initials: "PM", bg: "#EEEDFE", color: "#534AB7" },
    title: "Week 5 sprint plan",
    riskLabel: "Low risk", riskBg: "#f3f4f6", riskColor: "#6b7280",
    desc: "4 milestones, 11 tasks, rebuilt around the cleared landing-page blocker and this week's validated interview signal.",
    agentName: "AI Product Manager", waitingOn: "you", time: "8:15am today",
    primaryLabel: "Push to engine", primaryAction: "Pushed sprint plan to Execution Engine",
  },
  {
    id: "q4", view: "you", risk: "high",
    agent: { initials: "FIN", bg: "#FAEEDA", color: "#633806" },
    title: "Send invoice INV-1042 — Reddington Clinic",
    riskLabel: "Touches money", riskBg: "#FCEBEB", riskColor: "#791F1F",
    desc: "₦180,000 for the pilot integration setup fee, per the signed scope. AI Finance drafted it from the agreed terms — all payment requests always escalate.",
    agentName: "AI Finance", waitingOn: "you", time: "9:02am today",
    primaryLabel: "Approve & send", primaryAction: "Sent invoice INV-1042",
  },
  {
    id: "q5", view: "you", risk: "high",
    agent: { initials: "LGL", bg: "#FCEBEB", color: "#791F1F" },
    title: "Send NDA to candidate — backend hire",
    riskLabel: "Legal document", riskBg: "#FCEBEB", riskColor: "#791F1F",
    desc: "Standard StartupVerse-template NDA drafted for a candidate interview next week. AI Legal never sends any legal document without sign-off.",
    agentName: "AI Legal", waitingOn: "you", time: "9:10am today",
    primaryLabel: "Approve & send", primaryAction: "Sent NDA to candidate",
  },
  {
    id: "q6", view: "team", risk: "low", isFyi: true,
    agent: { initials: "CA", bg: "#FAEEDA", color: "#633806" },
    title: "Nurture email tone review",
    riskLabel: "FYI only", riskBg: "#f3f4f6", riskColor: "#6b7280",
    desc: "Routed to Chidinma, not you — brand-voice calls go to whoever holds the marketing role.",
    agentName: "AI Marketing", waitingOn: "Chidinma A.", time: "7:58am today",
    primaryLabel: "Nudge →", primaryAction: null,
  },
];

const HISTORY = [
  { icon: "✓", iconBg: "#EAF3DE", title: "Merged PR #14 — landing page hero",         sub: "AI Developer · approved by you · 6:22am today",     status: "Approved",   statusBg: "#EAF3DE", statusColor: "#27500A" },
  { icon: "✓", iconBg: "#EAF3DE", title: "Published landing page to production",        sub: "James S. · human action · 7:03am today",            status: "Completed",  statusBg: "#EAF3DE", statusColor: "#27500A" },
  { icon: "✕", iconBg: "#FCEBEB", title: "Boost budget for sponsored clinic posts — ₦40,000", sub: "AI Marketing · declined by you · Yesterday",   status: "Declined",   statusBg: "#FCEBEB", statusColor: "#791F1F" },
  { icon: "✓", iconBg: "#EAF3DE", title: "Week 4 sprint plan",                          sub: "AI Product Manager · approved by you · 3 days ago", status: "Approved",   statusBg: "#EAF3DE", statusColor: "#27500A" },
];

const AGENT_BREAKDOWN = [
  { initials: "SA",  bg: "#E6F1FB", color: "#0C447C", name: "AI Sales",            count: "1 item" },
  { initials: "DEV", bg: "#f3f4f6", color: "#6b7280", name: "AI Developer",        count: "1 item" },
  { initials: "PM",  bg: "#EEEDFE", color: "#534AB7", name: "AI Product Manager",  count: "1 item" },
  { initials: "FIN", bg: "#FAEEDA", color: "#633806", name: "AI Finance",          count: "1 item" },
  { initials: "LGL", bg: "#FCEBEB", color: "#791F1F", name: "AI Legal",            count: "1 item" },
];

/* ── Helpers ──────────────────────────────────────────────────────────────── */
function Av({ initials, bg, color, size = 28, onClick, title }) {
  const style = { width: size, height: size, background: bg, color, fontSize: size * 0.32 };
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={title}
        className="shrink-0 flex items-center justify-center rounded-[9px] font-body font-semibold transition-opacity hover:opacity-80"
        style={style}
      >
        {initials}
      </button>
    );
  }
  return (
    <div className="shrink-0 flex items-center justify-center rounded-[9px] font-body font-semibold" style={style}>
      {initials}
    </div>
  );
}

function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-gray-900 px-5 py-2.5 font-body text-[12px] font-medium text-white shadow-lg">
      {msg}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */
export default function V2ApprovalQueue({ onBack, onNavigate }) {
  const [viewTab, setViewTab] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState(QUEUE_ITEMS);
  const [selected, setSelected] = useState(new Set());
  const [toast, setToast] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const approve = (id, action) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setSelected((prev) => { const s = new Set(prev); s.delete(id); return s; });
    if (action) showToast("✓ " + action);
  };

  const bulkApprove = () => {
    const toApprove = items.filter((i) => selected.has(i.id) && !i.isFyi);
    setItems((prev) => prev.filter((i) => !selected.has(i.id)));
    setSelected(new Set());
    if (toApprove.length) showToast(`✓ Approved ${toApprove.length} item${toApprove.length > 1 ? "s" : ""}`);
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const visible = useMemo(() => {
    let list = items;
    if (viewTab === "you")   list = list.filter((i) => i.view === "you");
    if (viewTab === "team")  list = list.filter((i) => i.view === "team");
    if (riskFilter === "low")  list = list.filter((i) => i.risk === "low");
    if (riskFilter === "high") list = list.filter((i) => i.risk === "high");
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((i) => (i.title + " " + i.desc + " " + i.agentName).toLowerCase().includes(q));
    }
    return list;
  }, [items, viewTab, riskFilter, search]);

  const needsYouCount = items.filter((i) => i.view === "you").length;
  const teamCount = items.filter((i) => i.view === "team").length;

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
            <span className="font-body text-[13px] font-medium text-v2-heading">Approval Queue</span>
            <span className="text-gray-300">·</span>
            {items.length > 0
              ? <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FCEBEB] px-2.5 py-1 font-body text-[11px] font-medium text-[#791F1F]"><span className="h-[5px] w-[5px] rounded-full bg-red-500" />{items.length} pending</span>
              : <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF3DE] px-2.5 py-1 font-body text-[11px] font-medium text-[#27500A]">All clear ✓</span>
            }
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={onBack} className="flex items-center gap-1.5 rounded-full border border-v2-border bg-white px-3 py-1.5 font-body text-[12px] font-medium text-v2-heading hover:bg-gray-50 transition-colors">
              Agent Workroom
            </button>
            <button type="button" onClick={() => onNavigate?.("autonomy-settings")} className="flex items-center gap-1.5 rounded-full border border-v2-border bg-white px-3 py-1.5 font-body text-[12px] font-medium text-v2-heading hover:bg-gray-50 transition-colors">
              Autonomy settings
            </button>
          </div>
        </div>

        <div className="space-y-3 p-5">

          {/* Filter bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 rounded-full bg-gray-100 p-1">
              {[
                { id: "all",    label: `All · ${items.length}` },
                { id: "you",    label: `Needs you · ${needsYouCount}` },
                { id: "team",   label: `Waiting on teammates · ${teamCount}` },
                { id: "history",label: "History" },
              ].map(({ id, label }) => (
                <button key={id} type="button" onClick={() => setViewTab(id)}
                  className={cn("rounded-full px-3 py-1.5 font-body text-[11px] font-medium whitespace-nowrap transition-colors",
                    viewTab === id ? "bg-white text-v2-heading shadow-sm" : "text-v2-muted hover:text-v2-heading"
                  )}
                >{label}</button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                {[["all","All risk"],["low","Low"],["high","Sensitive"]].map(([id, label]) => (
                  <button key={id} type="button" onClick={() => setRiskFilter(id)}
                    className={cn("rounded-full border px-3 py-1.5 font-body text-[11px] font-medium transition-colors",
                      riskFilter === id ? "border-gray-900 bg-gray-900 text-white" : "border-v2-border bg-white text-v2-muted hover:text-v2-heading"
                    )}
                  >{label}</button>
                ))}
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
                <input
                  type="text" placeholder="Search queue…" value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-44 rounded-full border border-v2-border bg-white py-1.5 pl-7 pr-3 font-body text-[11px] outline-none focus:border-v2-purple"
                />
              </div>
            </div>
          </div>

          {/* Bulk bar */}
          {selected.size > 0 && (
            <div className="flex items-center justify-between rounded-xl bg-[#EEEDFE] px-4 py-2.5">
              <span className="font-body text-[12px] text-[#3C3489]">{selected.size} selected</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setSelected(new Set())} className="rounded-full border border-[#AFA9EC] bg-white px-3 py-1 font-body text-[11px] font-medium text-v2-heading hover:bg-gray-50 transition-colors">Clear</button>
                <button type="button" onClick={bulkApprove} className="rounded-full bg-v2-green px-3 py-1 font-body text-[11px] font-medium text-white hover:opacity-90 transition-opacity">Approve selected →</button>
              </div>
            </div>
          )}

          {/* Queue list */}
          {viewTab !== "history" && (
            <div className="space-y-2.5">
              {visible.length === 0 && (
                <div className="rounded-2xl border border-v2-border bg-white p-12 text-center">
                  <div className="text-[32px]">✅</div>
                  <div className="mt-2 font-heading text-[14px] font-medium text-v2-heading">Queue clear</div>
                  <div className="mt-1 font-body text-[12px] text-v2-muted">Nothing waiting on you right now — agents will keep working and escalate here if that changes.</div>
                </div>
              )}
              {visible.map((item) => (
                <div key={item.id} className={cn("rounded-2xl border bg-white p-3.5 flex gap-3 items-start transition-shadow hover:shadow-sm", item.isFyi ? "opacity-80 border-v2-border" : "border-v2-border")}>
                  {/* Checkbox */}
                  {!item.isFyi ? (
                    <button type="button" onClick={() => toggleSelect(item.id)}
                      className={cn("mt-0.5 h-4 w-4 shrink-0 rounded-[5px] border-[1.5px] flex items-center justify-center transition-colors",
                        selected.has(item.id) ? "border-v2-purple bg-v2-purple" : "border-gray-300"
                      )}
                    >
                      {selected.has(item.id) && <CheckCircle2 className="h-2.5 w-2.5 text-white" />}
                    </button>
                  ) : <div className="mt-0.5 h-4 w-4 shrink-0" />}

                  <Av
                    initials={item.agent.initials}
                    bg={item.agent.bg}
                    color={item.agent.color}
                    size={32}
                    onClick={AGENT_WORKSPACE_PAGE[item.agentName] ? () => onNavigate?.(AGENT_WORKSPACE_PAGE[item.agentName]) : undefined}
                    title={AGENT_WORKSPACE_PAGE[item.agentName] ? `Open ${item.agentName} workspace` : undefined}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="font-body text-[13px] font-medium text-v2-heading">{item.title}</span>
                      <span className="rounded-[6px] px-2 py-0.5 font-body text-[9px] font-medium" style={{ background: item.riskBg, color: item.riskColor }}>{item.riskLabel}</span>
                    </div>
                    <p className="mb-2 font-body text-[11px] leading-relaxed text-v2-muted">{item.desc}</p>
                    <div className="flex flex-wrap items-center gap-3 font-body text-[10px] text-gray-400">
                      <span>🤖 <strong className="text-gray-600">{item.agentName}</strong></span>
                      <span>👤 Waiting on <strong className="text-gray-600">{item.waitingOn}</strong></span>
                      <span>{item.time}</span>
                      {AGENT_WORKSPACE_PAGE[item.agentName] && (
                        <button
                          type="button"
                          onClick={() => onNavigate?.(AGENT_WORKSPACE_PAGE[item.agentName])}
                          className="text-v2-purple hover:underline"
                        >
                          Open {item.agentName} workspace →
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button type="button" className="rounded-[9px] border border-gray-200 bg-white px-3 py-1.5 font-body text-[11px] font-medium text-v2-heading hover:bg-gray-50 transition-colors">
                      Review
                    </button>
                    {!item.isFyi ? (
                      <button type="button" onClick={() => approve(item.id, item.primaryAction)} className="rounded-[9px] bg-v2-green px-3 py-1.5 font-body text-[11px] font-medium text-white hover:opacity-90 transition-opacity whitespace-nowrap">
                        {item.primaryLabel}
                      </button>
                    ) : (
                      <button type="button" onClick={() => showToast("Reminder sent to Chidinma")} className="rounded-[9px] bg-[#EEEDFE] px-3 py-1.5 font-body text-[11px] font-medium text-v2-purple hover:opacity-90 transition-opacity">
                        Nudge →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* History */}
          {viewTab === "history" && (
            <div className="space-y-2.5">
              <div className="text-right">
                <button type="button" onClick={() => onNavigate?.("audit-trail")} className="font-body text-[11px] text-v2-blue hover:underline">Open full Audit Trail →</button>
              </div>
              {HISTORY.map((h, i) => (
                <div key={i} className="flex items-center gap-3 rounded-2xl border border-v2-border bg-white p-3.5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-body text-[11px]" style={{ background: h.iconBg }}>{h.icon}</div>
                  <div className="min-w-0 flex-1">
                    <div className="font-body text-[12px] font-medium text-v2-heading">{h.title}</div>
                    <div className="font-body text-[10px] text-v2-muted">{h.sub}</div>
                  </div>
                  <span className="shrink-0 rounded-lg px-2.5 py-1 font-body text-[9px] font-medium" style={{ background: h.statusBg, color: h.statusColor }}>{h.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex w-[320px] shrink-0 flex-col gap-3 overflow-y-auto border-l border-v2-border bg-white p-4">

        {/* Queue stats */}
        <div className="rounded-2xl bg-v2-page p-3">
          <div className="mb-2 font-heading text-[11px] font-semibold text-v2-heading">Queue stats</div>
          {[
            { k: "Total pending",        v: `${items.length} items` },
            { k: "Needs you",            v: `${needsYouCount} items` },
            { k: "Waiting on teammates", v: `${teamCount} item` },
            { k: "Avg wait time",        v: "23 min" },
          ].map((r) => (
            <div key={r.k} className="flex items-center justify-between border-b border-gray-100 py-1 last:border-b-0">
              <span className="font-body text-[10px] text-v2-muted">{r.k}</span>
              <span className="font-body text-[10px] font-medium text-v2-heading">{r.v}</span>
            </div>
          ))}
        </div>

        {/* Agent breakdown */}
        <div className="rounded-2xl bg-v2-page p-3">
          <div className="mb-2 font-heading text-[11px] font-semibold text-v2-heading">By agent</div>
          {AGENT_BREAKDOWN.map((a) => (
            <div key={a.initials} className="flex items-center gap-2 border-b border-gray-100 py-1.5 last:border-b-0">
              <div className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] font-body text-[8px] font-semibold" style={{ background: a.bg, color: a.color }}>{a.initials}</div>
              <span className="flex-1 font-body text-[10px] text-gray-600">{a.name}</span>
              <span className="font-body text-[10px] font-medium text-v2-heading">{a.count}</span>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="rounded-2xl bg-v2-page p-3">
          <div className="mb-2 font-heading text-[11px] font-semibold text-v2-heading">Risk legend</div>
          {[
            { dot: "#6b7280", dotBg: "#f3f4f6", label: "Low risk",       desc: "Safe to approve without reading everything." },
            { dot: "#791F1F", dotBg: "#FCEBEB", label: "Sensitive",      desc: "Touches money, contracts, or external sends — always read first." },
            { dot: "#633806", dotBg: "#f3f4f6", label: "FYI only",       desc: "Routed to a teammate. You can nudge; nothing requires your approval." },
          ].map((r) => (
            <div key={r.label} className="flex items-start gap-2 py-1.5">
              <div className="mt-1 h-2 w-2 shrink-0 rounded-[3px]" style={{ background: r.dotBg, border: `1px solid ${r.dot}` }} />
              <div>
                <span className="font-body text-[10px] font-medium text-v2-heading">{r.label} </span>
                <span className="font-body text-[10px] text-v2-muted">{r.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Toast msg={toast} />
    </div>
  );
}
