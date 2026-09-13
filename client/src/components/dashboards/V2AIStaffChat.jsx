/**
 * V2AIStaffChat — AI Staff Chat interface
 * Built from StartupVerse_AI_Staff_Chat (1).html mockup
 * Multi-agent chat: PM (default), DEV, MK, GA tabs
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "../ui/utils";
import { useOfficeStore } from "../../state/useOfficeStore";
import { getPmMessages, sendPmMessage } from "../../utils/api/agentChatApi";
import { getAgentEvents } from "../../utils/api/agentOrchestrationApi";
import { getFounderStartupSafe } from "../../utils/api/founderApi";
import { getCurrentWeeklyOutcome } from "../../utils/api/coreEngineApi";

/* ── Staff config ─────────────────────────────────────────────────────────── */
const STAFF = [
  { id: "pm",  label: "AI Product Manager", initials: "PM",  bg: "#EEEDFE", color: "#534AB7", status: "green" },
  { id: "dev", label: "AI Developer",       initials: "DEV", bg: "#f3f4f6", color: "#6b7280", status: "green" },
  { id: "mk",  label: "AI Marketing",       initials: "MK",  bg: "#EAF3DE", color: "#27500A", status: "green" },
  { id: "ga",  label: "AI Growth",          initials: "GA",  bg: "#E6F1FB", color: "#0C447C", status: "amber" },
];

const STATUS_COLORS = { green: "#1D9E75", amber: "#BA7517" };

/* ── Context data for right panel ─────────────────────────────────────────── *
 * Startup/Stage/Week/Goal are real (see buildRealContextRows below) — this
 * is what's left once those are pulled out. No real source exists yet for a
 * gamified Score/Streak, or for Blueprint/Interviews/Clinics/Revenue (those
 * are startup-specific business metrics, not something an AI Staff agent
 * computes), so they stay honest mock rather than being half-faked.
 */
const PM_CONTEXT_MOCK = [
  { k: "Score",      v: "91 · +13 this week", vColor: "#1B4FD8" },
  { k: "Streak",     v: "🔥 5 weeks" },
  { k: "Blueprint",  v: "Vezeeta · Stage 1" },
  { k: "Interviews", v: "8/8 validated" },
  { k: "Clinics",    v: "3 paying", vColor: "#1D9E75" },
  { k: "Revenue",    v: "₦285K MRR", vColor: "#1D9E75" },
];

function buildRealContextRows(startup, outcome) {
  return [
    { k: "Startup", v: startup?.name || "Not set yet" },
    { k: "Stage",   v: startup?.stage || "Not set yet" },
    // WeeklyOutcome.weekNumber has no schema default and isn't always set on
    // creation (confirmed in the model) — the rest of the app already knows
    // this and falls back to 1 (V2FounderDashboard.jsx, V2ExecutionEngine.jsx
    // both do `weekNumber ?? 1`), so match that instead of showing "Week ?".
    { k: "Week",    v: outcome ? `Week ${outcome.weekNumber ?? 1} · ${outcome.status === "active" ? "Active" : outcome.status}` : "No active week" },
    { k: "Goal",    v: outcome?.goal || "None set yet" },
  ];
}

// The sprint-plan card is the only one of these three with a real backend —
// AI Marketing/Growth aren't real agents yet — so only it gets replaced with
// live data (see summarizeLatestPlan below); the other two stay honest mock.
const SESSION_OUTPUTS_MOCK = [
  { label: "Outreach template", title: "Clinic cold outreach — Vezeeta method",     sub: "Generated 9:19am · not yet copied" },
  { label: "Priority analysis", title: "Week 5 priority stack — 3 items",           sub: "Generated 9:15am · based on live data" },
];

function summarizeLatestPlan(events) {
  const latest = events.find((e) => e.actionTypeId?.actionKey === "propose_sprint_plan");
  if (!latest) {
    return { label: "Sprint plan", title: "No sprint plan proposed yet", sub: "Ask AI PM to draft one" };
  }
  const milestones = latest.payload?.milestones || [];
  const taskCount = milestones.reduce((n, m) => n + (m.tasks?.length || 0), 0);
  const statusText = { pending_approval: "awaiting your approval", declined: "declined" }[latest.status]
    || "approved · in the Execution Engine";
  return {
    label: "Sprint plan",
    title: `${milestones.length} milestone${milestones.length === 1 ? "" : "s"}, ${taskCount} task${taskCount === 1 ? "" : "s"}`,
    sub: `Proposed ${new Date(latest.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} · ${statusText}`,
    pending: latest.status === "pending_approval",
  };
}

const OTHER_STAFF = [
  { initials: "MK",  bg: "#EAF3DE", color: "#27500A", name: "AI Marketing Agent",  sub: "Output ready · landing page copy",  status: "green" },
  { initials: "GA",  bg: "#E6F1FB", color: "#0C447C", name: "AI Growth Analyst",   sub: "Waiting · needs Week 5 log",        status: "amber" },
  { initials: "FIN", bg: "#FAEEDA", color: "#633806", name: "AI Finance Agent",     sub: "Invoice INV-1042 ready to approve", status: "green" },
];

/* ── Toast ───────────────────────────────────────────────────────────────── */
function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-gray-900 px-5 py-2.5 font-body text-[12px] font-medium text-white shadow-lg">
      {msg}
    </div>
  );
}

/* ── Typing dots ─────────────────────────────────────────────────────────── */
function TypingDots() {
  return (
    <div className="flex items-start gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-body text-[10px] font-semibold" style={{ background: "#EEEDFE", color: "#534AB7" }}>PM</div>
      <div className="flex items-center gap-1 rounded-[4px_14px_14px_14px] border border-gray-100 bg-white px-3.5 py-2.5">
        {[0, 150, 300].map((delay) => (
          <div key={delay} className="h-1.5 w-1.5 rounded-full bg-gray-400" style={{ animation: `bounce 0.8s ${delay}ms infinite` }} />
        ))}
      </div>
    </div>
  );
}

/* ── PM Messages — real, per docs/ai-agent-roadmap.md Phase 3 ──────────────
 * Unlike DEV/MK/GA below (still illustrative mock, pending their own real
 * actions), AI Product Manager's chat is genuinely real: persisted history,
 * real DeepSeek replies grounded in the founder's actual startup context,
 * and a real proposed sprint plan (a real, approvable AgentEvent) when the
 * conversation reaches enough clarity. See agentChat.controller.js. */
function PMMessages({ messages, loading, sending, error, onNavigate }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <span className="inline-block rounded-full bg-gray-100 px-3 py-1 font-body text-[10px] text-v2-muted">Real conversation · AI Product Manager</span>
      </div>

      {loading && (
        <div className="text-center font-body text-[12px] text-v2-muted">Loading conversation…</div>
      )}
      {error && (
        <div className="text-center font-body text-[12px] text-[#791F1F]">{error}</div>
      )}

      {!loading && messages.length === 0 && (
        <div className="flex items-start gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-body text-[10px] font-semibold" style={{ background: "#EEEDFE", color: "#534AB7" }}>PM</div>
          <div className="flex max-w-[72%] flex-col gap-1">
            <div className="font-body text-[10px] text-v2-muted">AI Product Manager</div>
            <div className="rounded-[4px_14px_14px_14px] border border-gray-100 bg-white px-3.5 py-3 font-body text-[13px] leading-relaxed text-v2-heading">
              Hey — I'm your AI Product Manager. Tell me what's on your mind: an idea, a blocker, or honestly just "I don't know what to focus on" — and we'll work out this week's plan together.
            </div>
          </div>
        </div>
      )}

      {messages.map((m) => (
        <div key={m._id} className={cn("flex items-start gap-2.5", m.role === "founder" && "flex-row-reverse")}>
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-body text-[10px] font-semibold"
            style={m.role === "founder" ? { background: "#1B4FD8", color: "#fff" } : { background: "#EEEDFE", color: "#534AB7" }}
          >
            {m.role === "founder" ? "You" : "PM"}
          </div>
          <div className={cn("flex max-w-[72%] flex-col gap-1", m.role === "founder" && "items-end")}>
            <div
              className={cn(
                "whitespace-pre-wrap font-body text-[13px] leading-relaxed",
                m.role === "founder"
                  ? "rounded-[14px_4px_14px_14px] bg-[#534AB7] px-3.5 py-3 text-white"
                  : "rounded-[4px_14px_14px_14px] border border-gray-100 bg-white px-3.5 py-3 text-v2-heading",
              )}
            >
              {m.content}
            </div>
            {m.proposedEventId && m.proposedEventKind === "build_task" && (
              <button type="button" onClick={() => onNavigate?.("agent-developer")} className="font-body text-[10px] font-medium text-v2-purple hover:underline">
                🛠️ View in AI Developer workspace →
              </button>
            )}
            {m.proposedEventId && m.proposedEventKind !== "build_task" && (
              <button type="button" onClick={() => onNavigate?.("approval-queue")} className="font-body text-[10px] font-medium text-v2-purple hover:underline">
                📋 View in Approval Queue →
              </button>
            )}
            <div className="font-body text-[10px] text-v2-muted">
              {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : ""}
            </div>
          </div>
        </div>
      ))}

      {sending && <TypingDots />}
    </div>
  );
}

/* ── DEV Messages ─────────────────────────────────────────────────────────── */
function DEVMessages({ onToast, onNavigate }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <span className="inline-block rounded-full bg-gray-100 px-3 py-1 font-body text-[10px] text-v2-muted">Today · Week 5 · Session started 6:02am</span>
      </div>

      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-body text-[10px] font-semibold" style={{ background: "#f3f4f6", color: "#6b7280" }}>DEV</div>
        <div className="flex max-w-[80%] flex-col gap-1">
          <div className="font-body text-[10px] text-v2-muted">AI Developer · HealthTrack</div>
          <div className="rounded-[4px_14px_14px_14px] border border-gray-100 bg-white px-3.5 py-3 font-body text-[13px] leading-relaxed text-v2-heading">
            Morning, Adaeze. Overnight I opened PR #14 for the landing page hero, got it reviewed by AI Designer, merged it, and deployed to staging. James published it live at 7:03am.
            <div className="my-2 rounded-[0_8px_8px_0] border-l-[3px] border-[#534AB7] bg-[#EEEDFE] px-3 py-2 font-body text-[11px] leading-relaxed text-[#3C3489]">
              <strong className="font-medium">Context loaded:</strong> Stage 1 · Week 5 · v3 now live · Lighthouse 94 · 4 screens shipped (Home, Book, Records, Profile)
            </div>
          </div>
          <div className="font-body text-[10px] text-v2-muted">8:40am</div>
        </div>
      </div>

      <div className="flex flex-row-reverse items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1B4FD8] font-body text-[10px] font-semibold text-white">AO</div>
        <div className="flex max-w-[72%] flex-col items-end gap-1">
          <div className="font-body text-[10px] text-v2-muted">Adaeze · HealthTrack</div>
          <div className="rounded-[14px_4px_14px_14px] bg-[#534AB7] px-3.5 py-3 font-body text-[13px] leading-relaxed text-white">Can I see what it actually looks like right now?</div>
          <div className="font-body text-[10px] text-v2-muted">8:41am</div>
        </div>
      </div>

      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-body text-[10px] font-semibold" style={{ background: "#f3f4f6", color: "#6b7280" }}>DEV</div>
        <div className="flex max-w-[80%] flex-col gap-1">
          <div className="font-body text-[10px] text-v2-muted">AI Developer</div>
          <div className="rounded-[4px_14px_14px_14px] border border-gray-100 bg-white px-3.5 py-3 font-body text-[13px] leading-relaxed text-v2-heading">
            Of course — here's the live build. You can spin it, switch between the app and website, and browse every screen.
            <button
              type="button"
              onClick={() => onNavigate?.("product-viewer")}
              className="mt-2 w-full overflow-hidden rounded-[10px] border border-gray-100 text-left hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between bg-[#EEEDFE] px-3 py-2">
                <span className="font-body text-[11px] font-medium text-[#3C3489]">HealthTrack · v3 · Live</span>
                <span className="rounded-[6px] bg-white px-1.5 py-0.5 font-body text-[9px] text-[#534AB7]">Click to open</span>
              </div>
              <div className="bg-v2-page p-2.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-[88px] w-[46px] shrink-0 items-center justify-center rounded-[10px] bg-[#0d0d16] p-0.5">
                    <div className="h-full w-full rounded-[7px]" style={{ background: "linear-gradient(160deg,#1B4FD8,#534AB7)" }} />
                  </div>
                  <div className="flex-1">
                    <div className="font-body text-[11px] font-medium text-v2-heading">Product Viewer</div>
                    <div className="mt-1 font-body text-[10px] leading-relaxed text-v2-muted">Browse the live app screen by screen, switch to the website, and see the full build history.</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 bg-v2-page px-3 py-2">
                <span className="font-body text-[10px] text-v2-muted">healthtrack.app · deployed 7:03am</span>
                <span className="font-body text-[12px] font-medium text-[#1D9E75]">Open →</span>
              </div>
            </button>
          </div>
          <div className="font-body text-[10px] text-v2-muted">8:41am</div>
        </div>
      </div>
    </div>
  );
}

/* ── Generic placeholder chat ─────────────────────────────────────────────── */
function PlaceholderChat({ staff }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <span className="inline-block rounded-full bg-gray-100 px-3 py-1 font-body text-[10px] text-v2-muted">Session started · HealthTrack</span>
      </div>
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-body text-[10px] font-semibold" style={{ background: staff.bg, color: staff.color }}>{staff.initials}</div>
        <div className="flex max-w-[72%] flex-col gap-1">
          <div className="font-body text-[10px] text-v2-muted">{staff.label} · HealthTrack</div>
          <div className="rounded-[4px_14px_14px_14px] border border-gray-100 bg-white px-3.5 py-3 font-body text-[13px] leading-relaxed text-v2-heading">
            Hi Adaeze! I've loaded HealthTrack's context. What would you like to work on today?
            <div className="my-2 rounded-[0_8px_8px_0] border-l-[3px] border-[#534AB7] bg-[#EEEDFE] px-3 py-2 font-body text-[11px] leading-relaxed text-[#3C3489]">
              <strong className="font-medium">Context loaded:</strong> Stage 1 · Week 5 · Score 91 · 3 paying clinics · ₦285K MRR
            </div>
          </div>
          <div className="font-body text-[10px] text-v2-muted">Now</div>
        </div>
      </div>
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
export default function V2AIStaffChat({ user, onNavigate }) {
  const founderId = useOfficeStore((s) => s.founderId);
  const loadWorkspace = useOfficeStore((s) => s.loadWorkspace);
  const resolvedFounderId = founderId || String(user?._id ?? user?.id ?? "");

  const [activeStaff, setActiveStaff] = useState("pm");
  const [toast, setToast] = useState("");
  const [contextOn, setContextOn] = useState(true);
  const [inputText, setInputText] = useState("");
  const chatEndRef = useRef(null);

  const [pmMessages, setPmMessages] = useState([]);
  const [pmLoading, setPmLoading] = useState(true);
  const [pmSending, setPmSending] = useState(false);
  const [pmError, setPmError] = useState("");
  const [latestPlanOutput, setLatestPlanOutput] = useState(null);
  const [realContextRows, setRealContextRows] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2400); };

  useEffect(() => { if (user) loadWorkspace(user); }, [user, loadWorkspace]);

  useEffect(() => {
    if (!resolvedFounderId) return;
    let cancelled = false;
    setPmLoading(true);
    getPmMessages(resolvedFounderId)
      .then(({ messages }) => { if (!cancelled) { setPmMessages(messages || []); setPmError(""); } })
      .catch((err) => { if (!cancelled) setPmError(err?.message || "Could not load AI Product Manager's conversation."); })
      .finally(() => { if (!cancelled) setPmLoading(false); });
    return () => { cancelled = true; };
  }, [resolvedFounderId]);

  const refreshLatestPlan = useCallback(() => {
    if (!resolvedFounderId) return;
    getAgentEvents(resolvedFounderId)
      .then((events) => setLatestPlanOutput(summarizeLatestPlan(events || [])))
      .catch(() => {
        // Real data is a nice-to-have here — the static outreach/priority
        // cards next to it still render fine if this one fails to load.
      });
  }, [resolvedFounderId]);

  useEffect(() => { refreshLatestPlan(); }, [refreshLatestPlan]);

  useEffect(() => {
    if (!resolvedFounderId) return;
    let cancelled = false;
    Promise.all([getFounderStartupSafe(resolvedFounderId), getCurrentWeeklyOutcome(resolvedFounderId)])
      .then(([startup, outcome]) => { if (!cancelled) setRealContextRows(buildRealContextRows(startup, outcome)); })
      .catch(() => {
        // Real data is a nice-to-have here — the mock rows below still
        // render fine if this fails.
      });
    return () => { cancelled = true; };
  }, [resolvedFounderId]);

  const sendToPm = useCallback(async (content) => {
    const localMessage = { _id: `local-${Date.now()}`, role: "founder", content, createdAt: new Date().toISOString() };
    setPmMessages((prev) => [...prev, localMessage]);
    setPmSending(true);
    try {
      const { message } = await sendPmMessage(resolvedFounderId, content);
      if (message) setPmMessages((prev) => [...prev, message]);
      if (message?.proposedEventKind === "sprint_plan") refreshLatestPlan();
    } catch (err) {
      showToast(err?.message || "AI Product Manager could not respond.");
    } finally {
      setPmSending(false);
    }
  }, [resolvedFounderId, refreshLatestPlan]);

  const activeStaffObj = STAFF.find((s) => s.id === activeStaff);

  const placeholderText = activeStaff === "pm" ? "Tell your AI PM what's on your mind…"
    : activeStaff === "dev" ? "Ask AI Developer about your codebase or build…"
    : activeStaff === "mk"  ? "Ask AI Marketing about content or campaigns…"
    : "Ask AI Growth Analyst about your data…";

  const HINTS = activeStaff === "pm"
    ? ["I don't know what to focus on this week", "Help me plan around this blocker", "Draft a sprint plan for this idea"]
    : activeStaff === "dev"
    ? ["Show me recent PRs", "What's blocking the next deploy?", "Review my Stripe integration"]
    : ["Write a LinkedIn post", "Analyse clinic reply rates", "What data do I have?"];

  const handleSend = () => {
    const content = inputText.trim();
    if (!content) return;
    setInputText("");
    if (activeStaff === "pm") {
      sendToPm(content);
    } else {
      showToast("Message sent");
    }
  };

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-v2-page">

      {/* ── Main chat column ── */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">

        {/* Staff switcher */}
        <div className="flex shrink-0 items-center gap-2.5 overflow-x-auto border-b border-v2-border bg-white px-5 py-2.5">
          <span className="shrink-0 font-body text-[10px] text-v2-muted">Chatting with:</span>
          {/* Active staff */}
          {STAFF.filter((s) => s.id === activeStaff).map((s) => (
            <div key={s.id} className="flex shrink-0 items-center gap-2 rounded-[10px] border border-[#c4b5fd] bg-[#EEEDFE] px-3 py-1.5">
              <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full font-body text-[8px] font-semibold" style={{ background: s.bg, color: s.color }}>{s.initials}</div>
              <span className="font-body text-[11px] font-medium text-v2-heading">{s.label}</span>
              <div className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_COLORS[s.status] }} />
            </div>
          ))}
          {/* Divider */}
          <div className="h-7 w-px shrink-0 bg-v2-border" />
          <span className="shrink-0 font-body text-[10px] text-v2-muted">Switch to:</span>
          {/* Other staff */}
          {STAFF.filter((s) => s.id !== activeStaff).map((s) => (
            <button key={s.id} type="button" onClick={() => setActiveStaff(s.id)} className="flex shrink-0 items-center gap-2 rounded-[10px] border border-transparent px-3 py-1.5 hover:bg-gray-50 transition-colors">
              <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full font-body text-[8px] font-semibold" style={{ background: s.bg, color: s.color }}>{s.initials}</div>
              <span className="font-body text-[11px] font-medium text-v2-heading">{s.label}</span>
              <div className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_COLORS[s.status] }} />
            </button>
          ))}
          <button type="button" onClick={() => onNavigate?.("manage-staff")} className="flex shrink-0 items-center gap-1.5 rounded-[10px] border border-dashed border-gray-300 px-3 py-1.5 font-body text-[11px] text-v2-muted hover:border-gray-400 hover:text-v2-heading transition-colors">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
            Hire more staff
          </button>
        </div>

        {/* Chat area */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {activeStaff === "pm" && (
            <PMMessages messages={pmMessages} loading={pmLoading} sending={pmSending} error={pmError} onNavigate={onNavigate} />
          )}
          {activeStaff === "dev" && <DEVMessages onToast={showToast} onNavigate={onNavigate} />}
          {activeStaff !== "pm" && activeStaff !== "dev" && (
            <PlaceholderChat staff={activeStaffObj} />
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input bar */}
        <div className="shrink-0 border-t border-v2-border bg-white px-5 pb-4 pt-3">
          {/* Context toggle */}
          <div className="mb-2.5 flex items-center gap-2 font-body text-[11px] text-v2-muted">
            <button
              type="button"
              onClick={() => setContextOn((v) => !v)}
              className="relative h-[18px] w-8 rounded-full transition-colors"
              style={{ background: contextOn ? "#534AB7" : "#d1d5db" }}
            >
              <div className={cn("absolute top-0.5 h-[14px] w-[14px] rounded-full bg-white shadow transition-all", contextOn ? "left-[18px]" : "left-0.5")} />
            </button>
            <span>Execution context {contextOn ? "ON" : "OFF"} — AI {activeStaffObj?.initials} sees your Week 5 data, score, and HealthTrack context</span>
          </div>
          {/* Input row */}
          <div className="flex items-end gap-2.5">
            <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-v2-border bg-v2-page px-3.5 py-2.5">
              <textarea
                rows={1}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={placeholderText}
                className="flex-1 resize-none border-none bg-transparent font-body text-[13px] text-v2-heading outline-none placeholder:text-v2-muted"
                style={{ lineHeight: "1.5" }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              />
              <button type="button" className="flex h-7 w-7 items-center justify-center rounded-[7px] text-v2-muted hover:bg-gray-100">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M12.5 7.5l-5 5a3.5 3.5 0 01-5-5l5-5a2.5 2.5 0 013.5 3.5l-5 5a1.5 1.5 0 01-2-2l4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
            <button
              type="button"
              onClick={handleSend}
              disabled={activeStaff === "pm" && pmSending}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#534AB7] hover:bg-[#3C3489] transition-colors disabled:opacity-60"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M14 2L7 9M14 2l-4 12-3-5-5-3 12-4z" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
          {/* Hint chips */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="font-body text-[10px] text-v2-muted">Try:</span>
            {HINTS.map((h) => (
              <button key={h} type="button" onClick={() => setInputText(h)} className="inline-flex items-center gap-1 rounded-[6px] bg-gray-100 px-2 py-0.5 font-body text-[10px] text-v2-heading hover:bg-gray-200 transition-colors">{h}</button>
            ))}
          </div>
        </div>

      </div>

      {/* ── Right panel ── */}
      <div className="flex w-[320px] shrink-0 flex-col overflow-hidden border-l border-v2-border bg-white">
        <div className="shrink-0 border-b border-v2-border px-4 py-3.5">
          <div className="font-body text-[12px] font-medium text-v2-heading">
            {activeStaffObj?.initials} · Session context
          </div>
          <div className="mt-0.5 font-body text-[10px] text-v2-muted">Live HealthTrack data · auto-synced</div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">

          {/* Context card */}
          <div className="rounded-2xl bg-v2-page p-3">
            <div className="mb-2 flex items-center justify-between font-heading text-[11px] font-semibold text-v2-heading">
              Context being used
              <button type="button" className="font-body text-[10px] text-[#534AB7] hover:underline">Edit context →</button>
            </div>
            {[...(realContextRows || []), ...PM_CONTEXT_MOCK].map(({ k, v, vColor }) => (
              <div key={k} className="flex items-center justify-between border-b border-gray-100 py-1.5 last:border-b-0">
                <span className="font-body text-[11px] text-v2-muted">{k}</span>
                <span className="max-w-[140px] text-right font-body text-[11px] font-medium" style={{ color: vColor || "var(--v2-heading)" }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Session outputs */}
          <div className="rounded-2xl bg-v2-page p-3">
            <div className="mb-2 flex items-center justify-between font-heading text-[11px] font-semibold text-v2-heading">
              This session's outputs
              <button type="button" onClick={() => showToast("Downloading all outputs…")} className="font-body text-[10px] text-[#534AB7] hover:underline">Download all</button>
            </div>
            {latestPlanOutput && (
              <div
                className="cursor-pointer border-b border-gray-100 py-2 last:border-b-0 hover:opacity-80"
                onClick={() => latestPlanOutput.pending && onNavigate?.("approval-queue")}
              >
                <div className="font-body text-[9px] font-medium uppercase tracking-wide text-v2-muted">{latestPlanOutput.label}</div>
                <div className="mt-0.5 font-body text-[11px] font-medium text-v2-heading">{latestPlanOutput.title}</div>
                <div className="mt-0.5 font-body text-[10px] text-v2-muted">{latestPlanOutput.sub}</div>
              </div>
            )}
            {SESSION_OUTPUTS_MOCK.map((item) => (
              <div key={item.label} className="cursor-pointer border-b border-gray-100 py-2 last:border-b-0 hover:opacity-80">
                <div className="font-body text-[9px] font-medium uppercase tracking-wide text-v2-muted">{item.label}</div>
                <div className="mt-0.5 font-body text-[11px] font-medium text-v2-heading">{item.title}</div>
                <div className="mt-0.5 font-body text-[10px] text-v2-muted">{item.sub}</div>
              </div>
            ))}
          </div>

          {/* Other staff */}
          <div className="rounded-2xl bg-v2-page p-3">
            <div className="mb-2 font-heading text-[11px] font-semibold text-v2-heading">Your other hired staff</div>
            {OTHER_STAFF.map((s) => (
              <button key={s.initials} type="button" onClick={() => setActiveStaff(s.initials.toLowerCase().replace("fin", "fin"))} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-gray-100 transition-colors">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-body text-[8px] font-semibold" style={{ background: s.bg, color: s.color }}>{s.initials}</div>
                <div className="min-w-0 flex-1">
                  <div className="font-body text-[11px] font-medium text-v2-heading">{s.name}</div>
                  <div className="font-body text-[9px] text-v2-muted">{s.sub}</div>
                </div>
                <div className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: STATUS_COLORS[s.status] }} />
              </button>
            ))}
          </div>

        </div>
      </div>

      <Toast msg={toast} />

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
