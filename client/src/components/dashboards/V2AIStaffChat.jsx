/**
 * V2AIStaffChat — AI Staff Chat interface
 * Built from StartupVerse_AI_Staff_Chat (1).html mockup
 * Multi-agent chat: PM (default), DEV, MK, GA tabs
 */

import React, { useState, useRef, useEffect } from "react";
import { cn } from "../ui/utils";

/* ── Staff config ─────────────────────────────────────────────────────────── */
const STAFF = [
  { id: "pm",  label: "AI Product Manager", initials: "PM",  bg: "#EEEDFE", color: "#534AB7", status: "green" },
  { id: "dev", label: "AI Developer",       initials: "DEV", bg: "#f3f4f6", color: "#6b7280", status: "green" },
  { id: "mk",  label: "AI Marketing",       initials: "MK",  bg: "#EAF3DE", color: "#27500A", status: "green" },
  { id: "ga",  label: "AI Growth",          initials: "GA",  bg: "#E6F1FB", color: "#0C447C", status: "amber" },
];

const STATUS_COLORS = { green: "#1D9E75", amber: "#BA7517" };

/* ── Context data for right panel ─────────────────────────────────────────── */
const PM_CONTEXT = [
  { k: "Startup",    v: "HealthTrack" },
  { k: "Stage",      v: "Stage 1 · Validation" },
  { k: "Week",       v: "Week 5 · Active" },
  { k: "Score",      v: "91 · +13 this week", vColor: "#1B4FD8" },
  { k: "Streak",     v: "🔥 5 weeks" },
  { k: "Blueprint",  v: "Vezeeta · Stage 1" },
  { k: "Interviews", v: "8/8 validated" },
  { k: "Clinics",    v: "3 paying", vColor: "#1D9E75" },
  { k: "Revenue",    v: "₦285K MRR", vColor: "#1D9E75" },
];

const SESSION_OUTPUTS = [
  { label: "Sprint plan",       title: "Week 5 Sprint — 4 milestones, 11 tasks",    sub: "Generated 9:16am · not yet pushed" },
  { label: "Outreach template", title: "Clinic cold outreach — Vezeeta method",     sub: "Generated 9:19am · not yet copied" },
  { label: "Priority analysis", title: "Week 5 priority stack — 3 items",           sub: "Generated 9:15am · based on live data" },
];

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

/* ── PM Messages ─────────────────────────────────────────────────────────── */
function PMMessages({ onToast }) {
  return (
    <div className="flex flex-col gap-4">
      {/* System */}
      <div className="text-center">
        <span className="inline-block rounded-full bg-gray-100 px-3 py-1 font-body text-[10px] text-v2-muted">Today · Week 5 · Session started 9:14am</span>
      </div>

      {/* AI welcome */}
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-body text-[10px] font-semibold" style={{ background: "#EEEDFE", color: "#534AB7" }}>PM</div>
        <div className="flex max-w-[72%] flex-col gap-1">
          <div className="font-body text-[10px] text-v2-muted">AI Product Manager · HealthTrack</div>
          <div className="rounded-[4px_14px_14px_14px] border border-gray-100 bg-white px-3.5 py-3 font-body text-[13px] leading-relaxed text-v2-heading">
            Good morning, Adaeze. I've loaded HealthTrack's Week 5 context.
            <div className="my-2 rounded-[0_8px_8px_0] border-l-[3px] border-[#534AB7] bg-[#EEEDFE] px-3 py-2 font-body text-[11px] leading-relaxed text-[#3C3489]">
              <strong className="font-medium">Context loaded:</strong> Stage 1 · Week 5 · Execution score 91 · 5-week streak · 3 paying clinics · ₦285K MRR · Vezeeta Blueprint installed
            </div>
            Your execution score is strong at 91, and you've hit Stage 1's clinic milestone. What would you like to work on today?
          </div>
          <div className="font-body text-[10px] text-v2-muted">9:14am</div>
        </div>
      </div>

      {/* User */}
      <div className="flex flex-row-reverse items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1B4FD8] font-body text-[10px] font-semibold text-white">AO</div>
        <div className="flex max-w-[72%] flex-col items-end gap-1">
          <div className="font-body text-[10px] text-v2-muted">Adaeze · HealthTrack</div>
          <div className="rounded-[14px_4px_14px_14px] bg-[#534AB7] px-3.5 py-3 font-body text-[13px] leading-relaxed text-white">What's the most important thing I should focus on this week?</div>
          <div className="font-body text-[10px] text-v2-muted">9:15am</div>
        </div>
      </div>

      {/* AI priority list */}
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-body text-[10px] font-semibold" style={{ background: "#EEEDFE", color: "#534AB7" }}>PM</div>
        <div className="flex max-w-[80%] flex-col gap-1">
          <div className="font-body text-[10px] text-v2-muted">AI Product Manager</div>
          <div className="rounded-[4px_14px_14px_14px] border border-gray-100 bg-white px-3.5 py-3 font-body text-[13px] leading-relaxed text-v2-heading">
            Based on your Week 5 data and the Vezeeta Blueprint stage gates, here's your priority stack:
            <div className="mt-2 flex flex-col gap-1.5">
              {[
                { n: "1", bg: "#E24B4A", title: "Scale to 10 paying clinics", sub: "3 paying, 13 in pipeline. Vezeeta Blueprint requires 10 for Stage 2. Surulere General demo is Thursday.", tag: "Stage gate · 3 of 10 clinics", tagBg: "#FCEBEB", tagColor: "#791F1F" },
                { n: "2", bg: "#BA7517", title: "Approve the 10-message outreach batch", sub: "AI Sales has personalised 10 clinic messages and queued them. They're waiting on your approval — nothing sends without you.", tag: "Approval needed · AI Sales blocked", tagBg: "#FAEEDA", tagColor: "#633806" },
                { n: "3", bg: "#1D9E75", title: "Review INV-1042 in AI Finance", sub: "₦180,000 invoice for Reddington Clinic's setup fee. Sending it unlocks ₦180K cash and protects the renewal relationship.", tag: "Optional · high impact", tagBg: "#EAF3DE", tagColor: "#27500A" },
              ].map((item) => (
                <div key={item.n} className="flex items-start gap-2.5 rounded-lg bg-v2-page p-2">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-body text-[9px] font-semibold text-white" style={{ background: item.bg }}>{item.n}</div>
                  <div className="min-w-0 flex-1">
                    <div className="font-body text-[12px] font-medium text-v2-heading">{item.title}</div>
                    <div className="mt-0.5 font-body text-[11px] leading-snug text-v2-muted">{item.sub}</div>
                    <span className="mt-1 inline-block rounded-[5px] px-1.5 py-0.5 font-body text-[9px] font-medium" style={{ background: item.tagBg, color: item.tagColor }}>{item.tag}</span>
                  </div>
                </div>
              ))}
            </div>
            I've already drafted a Week 6 sprint plan around these. Want me to show it?
          </div>
          <div className="font-body text-[10px] text-v2-muted">9:15am</div>
        </div>
      </div>

      {/* User */}
      <div className="flex flex-row-reverse items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1B4FD8] font-body text-[10px] font-semibold text-white">AO</div>
        <div className="flex max-w-[72%] flex-col items-end gap-1">
          <div className="rounded-[14px_4px_14px_14px] bg-[#534AB7] px-3.5 py-3 font-body text-[13px] leading-relaxed text-white">Yes, show me the sprint plan</div>
          <div className="font-body text-[10px] text-v2-muted">9:16am</div>
        </div>
      </div>

      {/* AI sprint plan card */}
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-body text-[10px] font-semibold" style={{ background: "#EEEDFE", color: "#534AB7" }}>PM</div>
        <div className="flex max-w-[80%] flex-col gap-1">
          <div className="font-body text-[10px] text-v2-muted">AI Product Manager</div>
          <div className="rounded-[4px_14px_14px_14px] border border-gray-100 bg-white px-3.5 py-3 font-body text-[13px] leading-relaxed text-v2-heading">
            Here's your Week 6 sprint — 4 milestones, built around clinic scale and approvals.
            {/* Sprint card */}
            <div className="mt-2 overflow-hidden rounded-[10px] border border-gray-100">
              <div className="flex items-center justify-between bg-[#EEEDFE] px-3 py-2">
                <span className="font-body text-[11px] font-medium text-[#3C3489]">Week 6 Sprint Plan · HealthTrack</span>
                <span className="rounded-[6px] bg-white px-1.5 py-0.5 font-body text-[9px] text-[#534AB7]">AI-generated · based on HealthTrack context</span>
              </div>
              <div className="flex flex-col gap-1.5 bg-v2-page p-2.5">
                {[
                  { n: "M1", bg: "#E24B4A", task: "Approve & send 10-clinic outreach batch", meta: "Owner: Adaeze · Due: Mon · Unblocks AI Sales" },
                  { n: "M2", bg: "#BA7517", task: "Approve INV-1042 for Reddington Clinic setup fee", meta: "Owner: Adaeze · Due: Tue · +₦180K cash" },
                  { n: "M3", bg: "#1D9E75", task: "Surulere General demo call — close as 4th client", meta: "Owner: Adaeze · Thursday 2pm" },
                  { n: "M4", bg: "#534AB7", task: "Week 6 outcome logged by Sunday 11:59pm — protect streak", meta: "Owner: Adaeze · Streak at risk if missed" },
                ].map((item) => (
                  <div key={item.n} className="flex items-start gap-2 rounded-[7px] border border-gray-100 bg-white p-2">
                    <div className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] font-body text-[9px] font-semibold text-white" style={{ background: item.bg }}>{item.n}</div>
                    <div className="flex-1">
                      <div className="font-body text-[11px] text-v2-heading">{item.task}</div>
                      <div className="mt-0.5 font-body text-[9px] text-v2-muted">{item.meta}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 bg-v2-page px-3 py-2">
                <span className="font-body text-[10px] text-v2-muted">Projected score impact if all 4 milestones hit:</span>
                <span className="font-body text-[12px] font-medium text-[#1D9E75]">91 → 97 (+6 pts) 🔥</span>
              </div>
            </div>
            <div className="mt-2.5 flex gap-1.5">
              <button type="button" onClick={() => onToast("Sprint plan accepted and pushed")} className="rounded-lg bg-[#534AB7] px-3 py-1.5 font-body text-[11px] font-medium text-white hover:opacity-90">Accept sprint plan</button>
              <button type="button" onClick={() => onToast("Opening milestone editor…")} className="rounded-lg border border-v2-border bg-white px-3 py-1.5 font-body text-[11px] font-medium text-v2-heading hover:bg-gray-50">Edit milestones</button>
              <button type="button" onClick={() => onToast("Pushed to Execution Engine")} className="rounded-lg border border-v2-border bg-white px-3 py-1.5 font-body text-[11px] font-medium text-v2-heading hover:bg-gray-50">Push to engine</button>
            </div>
          </div>
          <div className="font-body text-[10px] text-v2-muted">9:16am</div>
        </div>
      </div>

      {/* User */}
      <div className="flex flex-row-reverse items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1B4FD8] font-body text-[10px] font-semibold text-white">AO</div>
        <div className="flex max-w-[72%] flex-col items-end gap-1">
          <div className="rounded-[14px_4px_14px_14px] bg-[#534AB7] px-3.5 py-3 font-body text-[13px] leading-relaxed text-white">Should I be worried about my execution score dropping this week?</div>
          <div className="font-body text-[10px] text-v2-muted">9:21am</div>
        </div>
      </div>

      {/* Typing */}
      <TypingDots />
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
export default function V2AIStaffChat({ onNavigate }) {
  const [activeStaff, setActiveStaff] = useState("pm");
  const [toast, setToast] = useState("");
  const [contextOn, setContextOn] = useState(true);
  const [inputText, setInputText] = useState("");
  const chatEndRef = useRef(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2400); };

  const activeStaffObj = STAFF.find((s) => s.id === activeStaff);

  const placeholderText = activeStaff === "pm" ? "Ask your AI PM anything about HealthTrack…"
    : activeStaff === "dev" ? "Ask AI Developer about your codebase or build…"
    : activeStaff === "mk"  ? "Ask AI Marketing about content or campaigns…"
    : "Ask AI Growth Analyst about your data…";

  const HINTS = activeStaff === "pm"
    ? ["What's my Stage 2 readiness?", "Draft my investor update", "What should James do today?"]
    : activeStaff === "dev"
    ? ["Show me recent PRs", "What's blocking the next deploy?", "Review my Stripe integration"]
    : ["Write a LinkedIn post", "Analyse clinic reply rates", "What data do I have?"];

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
          {activeStaff === "pm"  && <PMMessages onToast={showToast} />}
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
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (inputText.trim()) { showToast("Message sent"); setInputText(""); } } }}
              />
              <button type="button" className="flex h-7 w-7 items-center justify-center rounded-[7px] text-v2-muted hover:bg-gray-100">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M12.5 7.5l-5 5a3.5 3.5 0 01-5-5l5-5a2.5 2.5 0 013.5 3.5l-5 5a1.5 1.5 0 01-2-2l4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
            <button
              type="button"
              onClick={() => { if (inputText.trim()) { showToast("Message sent"); setInputText(""); } }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#534AB7] hover:bg-[#3C3489] transition-colors"
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
            {PM_CONTEXT.map(({ k, v, vColor }) => (
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
            {SESSION_OUTPUTS.map((item) => (
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
