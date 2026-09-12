/**
 * V2ProductViewer — "what's actually been built" for the startup's product.
 * Ported from StartupVerse_Product_Viewer.html (AI Staff mockup set).
 *
 * Like the rest of the AI Staff feature area, there is no backend for real
 * product/deployment tracking anywhere in this codebase (no build-history,
 * no live-status, no screen-inventory model). This is an interactive but
 * illustrative port of the mockup's own placeholder content (the fictional
 * "HealthTrack" app) — same treatment as V2FounderDashboard's AI_STAFF_LIST:
 * real interactivity, honestly-illustrative data, not fabricated as if real.
 * Swap for a real fetch the moment a product/deployment-tracking backend
 * exists.
 */
import React, { useState, useEffect } from "react";
import { cn } from "../ui/utils";

const APP_SCREENS = {
  Home: (
    <div className="h-full text-[11px]">
      <div className="bg-[#1B4FD8] px-4 pb-[30px] pt-[18px] text-white">
        <div className="text-[11px] text-[#c9d8fb]">Good morning</div>
        <div className="mt-0.5 text-[16px] font-semibold">Ngozi 👋</div>
      </div>
      <div className="-mt-[18px] mx-4 mb-3 rounded-xl bg-white p-3.5 shadow-lg">
        <div className="text-[11px] font-semibold text-gray-900">Next appointment</div>
        <div className="mt-0.5 text-[9px] text-gray-400">Dr. Adeyemi · Today, 2:30pm</div>
      </div>
      <div className="mt-1.5 grid grid-cols-3 gap-2.5 px-4">
        {[["#E6F1FB", "Book"], ["#EAF3DE", "Records"], ["#FAEEDA", "Refill"]].map(([bg, lbl]) => (
          <div key={lbl} className="rounded-[10px] bg-gray-100 px-1.5 py-3.5 text-center">
            <div className="mx-auto mb-1.5 h-[22px] w-[22px] rounded-[7px]" style={{ background: bg }} />
            <div className="text-[9px] font-medium text-gray-700">{lbl}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 px-4">
        {[["#EEEDFE", "Reddington Clinic", "Visit summary ready"], ["#E6F1FB", "Lab results", "Uploaded 2 days ago"]].map(([bg, t, s]) => (
          <div key={t} className="flex items-center gap-2 border-b border-gray-100 py-2.5">
            <div className="h-[26px] w-[26px] shrink-0 rounded-full" style={{ background: bg }} />
            <div><div className="text-[10px] font-medium text-gray-900">{t}</div><div className="text-[8px] text-gray-400">{s}</div></div>
          </div>
        ))}
      </div>
    </div>
  ),
  Book: (
    <div className="h-full p-4 text-[11px]">
      <div className="mb-3 text-[14px] font-semibold text-gray-900">Book a clinic visit</div>
      {[
        ["Reddington Clinic, VI", "2.1km away · Next slot 2:30pm", true],
        ["Lagoon Hospital Annex", "3.4km away · Next slot 4:00pm", false],
        ["First Care Clinic", "5.0km away · Next slot Tomorrow", false],
      ].map(([t, s, hi]) => (
        <div key={t} className={cn("mb-2 rounded-[10px] bg-gray-50 p-2.5", hi && "border border-[#E6F1FB]")}>
          <div className="text-[11px] font-semibold">{t}</div>
          <div className="text-[9px] text-gray-400">{s}</div>
        </div>
      ))}
    </div>
  ),
  Records: (
    <div className="h-full p-4 text-[11px]">
      <div className="mb-3 text-[14px] font-semibold text-gray-900">Your records</div>
      {[
        ["#E6F1FB", "Lab results — Full panel", "2 days ago"],
        ["#EAF3DE", "Prescription — Amoxicillin", "1 week ago"],
        ["#FAEEDA", "Visit summary — Reddington", "2 weeks ago"],
      ].map(([bg, t, s]) => (
        <div key={t} className="flex items-center gap-2 border-b border-gray-100 py-2.5 last:border-0">
          <div className="h-7 w-7 shrink-0 rounded-lg" style={{ background: bg }} />
          <div><div className="text-[10px] font-medium">{t}</div><div className="text-[8px] text-gray-400">{s}</div></div>
        </div>
      ))}
    </div>
  ),
  Profile: (
    <div className="h-full p-4 text-center text-[11px]">
      <div className="mx-auto mb-2.5 mt-2.5 h-14 w-14 rounded-full bg-[#EEEDFE]" />
      <div className="text-[14px] font-semibold">Ngozi Chukwu</div>
      <div className="mb-4 text-[9px] text-gray-400">Patient since March 2026</div>
      <div className="rounded-[10px] bg-gray-50 p-2.5 text-left">
        <div className="border-b border-gray-200 py-1 text-[10px] text-gray-600">Phone: 080••• •••12</div>
        <div className="py-1 text-[10px] text-gray-600">Preferred clinic: Reddington VI</div>
      </div>
    </div>
  ),
};

const WEB_SCREEN = (
  <div className="h-full text-[11px]">
    <div className="flex items-center justify-between px-[22px] py-3.5">
      <div className="text-[14px] font-bold text-[#1B4FD8]">HealthTrack</div>
      <div className="flex gap-4">
        {["Clinics", "Patients", "About"].map((l) => <span key={l} className="text-[11px] text-gray-500">{l}</span>)}
      </div>
    </div>
    <div className="px-[22px] pb-[30px] pt-[26px]" style={{ background: "linear-gradient(135deg,#EEF2FF,#E6F1FB)" }}>
      <div className="max-w-[340px] text-[22px] font-bold leading-tight text-[#0F172A]">Book a clinic visit in under 2 minutes</div>
      <div className="mt-2 max-w-[320px] text-[11px] leading-relaxed text-gray-500">HealthTrack connects patients across Lagos to verified clinics — real-time slots, no phone calls.</div>
      <div className="mt-3 inline-block rounded-lg bg-[#1B4FD8] px-4 py-2 text-[11px] font-semibold text-white">Find a clinic →</div>
    </div>
    <div className="flex gap-3.5 px-[22px] py-5">
      {[["#1D9E75", "Live slots", "Real availability"], ["#1B4FD8", "Verified clinics", "12 partners"], ["#534AB7", "Records", "All in one place"]].map(([bg, t, s]) => (
        <div key={t} className="flex-1 rounded-[10px] bg-gray-50 p-3">
          <div className="mb-1.5 h-[18px] w-[18px] rounded-[5px]" style={{ background: bg }} />
          <div className="text-[10px] font-semibold text-gray-900">{t}</div>
          <div className="mt-0.5 text-[9px] text-gray-400">{s}</div>
        </div>
      ))}
    </div>
  </div>
);

const BUILD_HISTORY = [
  {
    dot: "#1D9E75", ver: "v3 — Landing page hero rebuild",
    desc: "New hero section, compressed assets, Vezeeta-blueprint copy. Deployed to staging then published live.",
    who: [
      { initials: "DEV", bg: "#f3f4f6", color: "#6b7280", badge: "⚡", label: "Built" },
      { initials: "DS", bg: "#FAEEDA", color: "#633806", badge: "⚡", label: "Reviewed" },
      { initials: "JS", bg: "#E6F1FB", color: "#0C447C", badge: "👤", label: "Published" },
    ],
    time: "Today, 7:03am",
  },
  {
    dot: "#9ca3af", ver: "v2 — Booking flow added",
    desc: "Clinic list, slot selection, and confirmation screen. First version patients could actually book with.",
    who: [
      { initials: "DEV", bg: "#f3f4f6", color: "#6b7280", badge: "⚡", label: "Built" },
      { initials: "JS", bg: "#E6F1FB", color: "#0C447C", badge: "👤", label: "Published" },
    ],
    time: "Week 4",
  },
  {
    dot: "#9ca3af", ver: "v1 — First working prototype",
    desc: "Home screen and static clinic directory. Built to test the core concept with early interview participants.",
    who: [{ initials: "DEV", bg: "#f3f4f6", color: "#6b7280", badge: "⚡", label: "Built" }],
    time: "Week 2",
    last: true,
  },
];

const VERSIONS = [
  { id: "v1", label: "v1 · Week 2" },
  { id: "v2", label: "v2 · Week 4" },
  { id: "v3", label: "v3 · Current" },
];

function WhoBadge({ initials, bg, color, badge }) {
  return (
    <div className="relative shrink-0">
      <div className="flex h-[18px] w-[18px] items-center justify-center rounded-full font-body text-[7px] font-semibold" style={{ background: bg, color }}>{initials}</div>
      <div className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full border border-white bg-v2-purple text-[6px]">{badge}</div>
    </div>
  );
}

export default function V2ProductViewer({ onBack }) {
  const [mode, setMode] = useState("app");
  const [screen, setScreen] = useState("Home");
  const [version, setVersion] = useState("v3");
  const [spinKey, setSpinKey] = useState(0);
  const [toast, setToast] = useState("");

  const replaySpin = () => setSpinKey((k) => k + 1);
  useEffect(() => { replaySpin(); }, [mode]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-v2-page">
      <style>{`
        @keyframes v2pv-spin { from { transform: rotateY(0deg); } to { transform: rotateY(360deg); } }
        .v2pv-spin { animation: v2pv-spin 2.6s linear 1; transform-style: preserve-3d; }
      `}</style>

      {/* Topbar */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-v2-border bg-white px-5 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={onBack} className="font-body text-[12px] text-v2-muted hover:text-v2-heading transition-colors">← Back</button>
          <span className="text-gray-300">·</span>
          <span className="font-body text-[12px] text-v2-muted">StartupVerse</span>
          <span className="text-gray-300">›</span>
          <span className="font-body text-[12px] text-v2-muted">HealthTrack</span>
          <span className="text-gray-300">›</span>
          <span className="font-body text-[13px] font-medium text-v2-heading">Product Viewer</span>
          <span className="text-gray-300">·</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF3DE] px-2.5 py-1 font-body text-[11px] font-medium text-[#27500A]">
            <span className="h-[5px] w-[5px] rounded-full bg-v2-green" />Live · v3
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={onBack} className="rounded-full border border-v2-border bg-white px-3 py-1.5 font-body text-[12px] font-medium text-v2-heading hover:bg-gray-50 transition-colors">
            Back to Workroom
          </button>
          <button type="button" onClick={() => showToast("Opening healthtrack.app in a new tab")} className="rounded-full bg-v2-purple px-3 py-1.5 font-body text-[12px] font-medium text-white hover:opacity-90 transition-opacity">
            Open live site ↗
          </button>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1080px] min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6">

        {/* Hero stage */}
        <div className="shrink-0 overflow-hidden rounded-[20px] px-6 pt-6" style={{ background: "radial-gradient(ellipse at 50% 0%, #241f5c, #100e2e 65%)" }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="font-body text-[15px] font-medium text-white">HealthTrack — what's actually been built</div>
              <p className="mt-0.5 max-w-[380px] font-body text-[11px] leading-relaxed text-[#a8a3d9]">Built by AI Developer and AI Designer overnight, published to production by James S. this morning.</p>
            </div>
            <div className="flex items-center">
              <div className="flex rounded-full bg-white/[0.08] p-[3px]">
                {[["app", "Mobile app"], ["web", "Website"]].map(([id, label]) => (
                  <button key={id} type="button" onClick={() => setMode(id)}
                    className={cn("rounded-full px-3.5 py-1.5 font-body text-[11px] font-medium transition-colors", mode === id ? "bg-white text-[#3C3489]" : "text-[#c9c5f0]")}
                  >{label}</button>
                ))}
              </div>
              <button type="button" onClick={replaySpin} className="ml-2 rounded-full bg-white/[0.08] px-3 py-1.5 font-body text-[11px] font-medium text-[#c9c5f0] hover:bg-white/[0.14] transition-colors">
                ↻ Replay spin
              </button>
            </div>
          </div>

          <div className="relative flex min-h-[400px] flex-col items-center justify-center py-2.5" style={{ perspective: 1400 }}>
            <div className="pointer-events-none absolute top-[30px] h-[380px] w-[380px] rounded-full blur-[10px]" style={{ background: "radial-gradient(circle, rgba(139,127,255,.35), transparent 70%)" }} />
            <div className="absolute bottom-14 h-[60px] w-[260px] rounded-full" style={{ background: "radial-gradient(ellipse, rgba(139,127,255,.4), transparent 72%)" }} />

            <div key={spinKey} className="v2pv-spin relative z-[1] mb-5">
              {mode === "app" ? (
                <div className="w-[222px] rounded-[38px] bg-[#0d0d16] p-[11px]" style={{ height: 456, boxShadow: "0 30px 70px rgba(0,0,0,.55), inset 0 0 0 1.5px rgba(255,255,255,.08)" }}>
                  <div className="relative h-full w-full overflow-hidden rounded-[30px] bg-white">
                    <div className="absolute left-1/2 top-0 z-[3] h-[18px] w-[76px] -translate-x-1/2 rounded-b-[11px] bg-[#0d0d16]" />
                    {APP_SCREENS[screen]}
                  </div>
                </div>
              ) : (
                <div className="w-[460px] max-w-[80vw] rounded-2xl bg-[#1a1a24]" style={{ boxShadow: "0 30px 70px rgba(0,0,0,.55), inset 0 0 0 1.5px rgba(255,255,255,.08)" }}>
                  <div className="flex h-[30px] items-center gap-1.5 rounded-t-2xl bg-[#26263a] px-3">
                    {["#E24B4A", "#BA7517", "#1D9E75"].map((c) => <div key={c} className="h-[7px] w-[7px] rounded-full" style={{ background: c }} />)}
                    <div className="ml-2 flex-1 rounded-xl bg-white/[0.08] px-3 py-1 font-body text-[10px] text-[#c9c5f0]">healthtrack.app</div>
                  </div>
                  <div className="h-[290px] overflow-hidden rounded-b-2xl bg-white">{WEB_SCREEN}</div>
                </div>
              )}
            </div>

            {mode === "app" && (
              <div className="relative z-[1] flex flex-wrap justify-center gap-1.5 pb-1">
                {Object.keys(APP_SCREENS).map((s) => (
                  <button key={s} type="button" onClick={() => setScreen(s)}
                    className={cn("rounded-full px-3.5 py-1.5 font-body text-[11px] font-medium transition-colors", screen === s ? "bg-v2-purple text-white" : "bg-white/[0.06] text-[#c9c5f0]")}
                  >{s}</button>
                ))}
              </div>
            )}
          </div>

          <div className="relative z-[1] flex items-center justify-center gap-2.5 pb-5 pt-4">
            {VERSIONS.map((v) => (
              <button key={v.id} type="button" onClick={() => setVersion(v.id)}
                className={cn("rounded-full px-2.5 py-1 font-body text-[10px] font-medium transition-colors", version === v.id ? "bg-white text-[#3C3489]" : "bg-white/[0.06] text-[#a8a3d9]")}
              >{v.label}</button>
            ))}
          </div>
        </div>

        {/* Two column: history + status */}
        <div className="grid grid-cols-[1.4fr_1fr] items-start gap-4">
          <div className="rounded-[14px] border border-v2-border bg-white p-4">
            <div className="font-body text-[13px] font-medium text-v2-heading">Build history</div>
            <div className="mb-3 font-body text-[11px] text-v2-subtle">Every shipped version — who built it, who reviewed it, who published it</div>
            {BUILD_HISTORY.map((h) => (
              <div key={h.ver} className="flex gap-3 border-b border-gray-100 py-3 last:border-0">
                <div className="flex shrink-0 flex-col items-center">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full" style={{ background: h.dot }} />
                  {!h.last && <div className="mt-1 w-px flex-1 bg-gray-200" />}
                </div>
                <div className="flex-1 pb-0.5">
                  <div className="font-body text-[11px] font-medium text-v2-heading">{h.ver}</div>
                  <p className="mt-0.5 font-body text-[11px] leading-relaxed text-v2-muted">{h.desc}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2.5">
                    {h.who.map((w) => (
                      <div key={w.label} className="flex items-center gap-1.5">
                        <WhoBadge {...w} />
                        <span className="font-body text-[9px] text-v2-subtle">{w.label}</span>
                      </div>
                    ))}
                    <span className="ml-auto font-body text-[9px] text-v2-subtle">{h.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-[14px] border border-v2-border bg-white p-4">
              <div className="font-body text-[13px] font-medium text-v2-heading">Live status</div>
              <div className="mb-2 font-body text-[11px] text-v2-subtle">healthtrack.app</div>
              {[
                ["Status", "● Live", "#1D9E75"],
                ["Last deploy", "Today, 7:03am", null],
                ["Deployed by", "James S.", null],
                ["Lighthouse score", "94", null],
                ["Build", "Passed", "#1D9E75"],
              ].map(([k, v, color]) => (
                <div key={k} className="flex items-center justify-between border-b border-gray-100 py-1.5 font-body text-[11px] last:border-0">
                  <span className="text-v2-subtle">{k}</span>
                  <span className="font-medium" style={{ color: color || "#111827" }}>{v}</span>
                </div>
              ))}
            </div>

            <div className="rounded-[14px] border border-v2-border bg-white p-4">
              <div className="mb-2 font-body text-[13px] font-medium text-v2-heading">Screens shipped</div>
              {["Home", "Book a clinic", "Records", "Profile"].map((s) => (
                <div key={s} className="py-1.5 font-body text-[11px] text-gray-700">✅ {s}</div>
              ))}
              <div className="py-1.5 font-body text-[11px] text-v2-subtle">⏳ Payments — planned v4</div>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-gray-900 px-5 py-2.5 font-body text-[12px] font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
