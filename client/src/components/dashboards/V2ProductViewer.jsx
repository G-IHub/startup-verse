/**
 * V2ProductViewer — "what's actually been built" for the startup's product.
 *
 * Was a fully fictional, illustrative port of StartupVerse_Product_Viewer.html
 * (a hardcoded fake "HealthTrack" mobile app + fake build history + a fake
 * "Open live site" toast that did nothing). Made real once GitHub Pages
 * hosting existed for AI Developer's deploys (agentExecutors.js's
 * executeGithubMergeMain enables a real Pages site and returns a real
 * pagesUrl), then made reliable (2026-09-15) with a real, guaranteed
 * hostedUrl (sites.startupverse.space/{slug}) that doesn't depend on the
 * founder's GitHub plan or token scope the way Pages does — prefer that
 * one, fall back to pagesUrl, and only fall further back to a local Blob
 * preview if a deploy genuinely has neither (both real per-deploy hiccups,
 * not the common case now).
 *
 * Real data only: the actual live site (a real iframe of the real deployed
 * page, once one exists), and real build history from real AgentEvents.
 * Screens/Lighthouse/who-reviewed-it — the old mock's other illustrative
 * fields — have no real source anywhere in this codebase and are dropped
 * rather than faked.
 */
import React, { useEffect, useMemo, useState } from "react";
import { getAgentEvents } from "../../utils/api/agentOrchestrationApi";
import { getFounderStartupSafe } from "../../utils/api/founderApi";
import { getFormSubmissions } from "../../utils/api/formSubmissionsApi";
import { useOfficeStore } from "../../state/useOfficeStore";
import { formatEventTime } from "../../utils/agentDisplay";

function WhoBadge({ initials, bg, color }) {
  return (
    <div className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full font-body text-[7px] font-semibold" style={{ background: bg, color }}>{initials}</div>
  );
}

/** Groups real github_open_pr/staging/main events by pipeline (targetId) into one real build-history row each, newest first. */
function buildRealHistory(events) {
  const byTarget = new Map();
  for (const e of events) {
    if (e.actionTypeId?.agentId?.agentKey !== "dev") continue;
    const key = e.targetId || e.id;
    if (!byTarget.has(key)) byTarget.set(key, { targetId: key, openPr: null, prod: null });
    const bucket = byTarget.get(key);
    const actionKey = e.actionTypeId?.actionKey;
    if (actionKey === "github_open_pr") bucket.openPr = e;
    if (actionKey === "github_merge_main" && (e.status === "autonomous_completed" || e.status === "human_completed")) bucket.prod = e;
  }
  return Array.from(byTarget.values())
    .filter((b) => b.openPr)
    .map((b) => ({
      targetId: b.targetId,
      title: b.openPr.payload?.taskDescription || b.openPr.payload?.filePath || "Untitled change",
      filePath: b.openPr.payload?.filePath,
      prUrl: b.openPr.result?.prUrl,
      // The real HTML AI Developer actually wrote — already stored on the
      // github_open_pr event itself, so a local preview needs no hosting at
      // all and works even when GitHub Pages can't be enabled (e.g. a
      // private repo on a plan that doesn't support it).
      fileContent: b.openPr.result?.fileContent || null,
      live: Boolean(b.prod),
      liveUrl: b.prod?.result?.hostedUrl || b.prod?.result?.pagesUrl || null,
      pagesError: b.prod?.result?.pagesError || null,
      time: b.prod?.createdAt || b.openPr.createdAt,
    }))
    .sort((a, b) => new Date(b.time) - new Date(a.time));
}

export default function V2ProductViewer({ user, onBack }) {
  const founderId = useOfficeStore((s) => s.founderId);
  const resolvedFounderId = founderId || String(user?._id ?? user?.id ?? "");

  const [loading, setLoading] = useState(true);
  const [startup, setStartup] = useState(null);
  const [history, setHistory] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    if (!resolvedFounderId) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([getFounderStartupSafe(resolvedFounderId), getAgentEvents(resolvedFounderId), getFormSubmissions(resolvedFounderId)])
      .then(([s, events, formData]) => {
        if (cancelled) return;
        setStartup(s || null);
        setHistory(buildRealHistory(events || []));
        setSubmissions(formData?.submissions || []);
      })
      .catch(() => { if (!cancelled) { setHistory([]); setSubmissions([]); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [resolvedFounderId]);

  const latestLive = history.find((h) => h.live && h.liveUrl) || null;

  // Real fallback for when no public URL exists yet (Pages not enabled, or
  // a real limitation like a private repo on a plan that doesn't support
  // it) — the actual HTML AI Developer wrote is already stored, so it can
  // be rendered directly with zero hosting, and "Open in new tab" works via
  // a real Blob URL rather than needing an actual server anywhere.
  const localPreview = !latestLive
    ? history.find((h) => h.fileContent && /\.html?$/i.test(h.filePath || "")) || null
    : null;

  const localPreviewBlobUrl = useMemo(() => {
    if (!localPreview?.fileContent) return null;
    const blob = new Blob([localPreview.fileContent], { type: "text/html" });
    return URL.createObjectURL(blob);
  }, [localPreview?.targetId, localPreview?.fileContent]);

  useEffect(() => {
    return () => { if (localPreviewBlobUrl) URL.revokeObjectURL(localPreviewBlobUrl); };
  }, [localPreviewBlobUrl]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-v2-page">
      {/* Topbar */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-v2-border bg-white px-5 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={onBack} className="font-body text-[12px] text-v2-muted hover:text-v2-heading transition-colors">← Back</button>
          <span className="text-gray-300">·</span>
          <span className="font-body text-[12px] text-v2-muted">StartupVerse</span>
          <span className="text-gray-300">›</span>
          <span className="font-body text-[12px] text-v2-muted">{startup?.name || "Your startup"}</span>
          <span className="text-gray-300">›</span>
          <span className="font-body text-[13px] font-medium text-v2-heading">Product Viewer</span>
          {latestLive && (
            <>
              <span className="text-gray-300">·</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF3DE] px-2.5 py-1 font-body text-[11px] font-medium text-[#27500A]">
                <span className="h-[5px] w-[5px] rounded-full bg-v2-green" />Live
              </span>
            </>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={onBack} className="rounded-full border border-v2-border bg-white px-3 py-1.5 font-body text-[12px] font-medium text-v2-heading hover:bg-gray-50 transition-colors">
            Back to Workroom
          </button>
          {latestLive ? (
            <a href={latestLive.liveUrl} target="_blank" rel="noreferrer" className="rounded-full bg-v2-purple px-3 py-1.5 font-body text-[12px] font-medium text-white hover:opacity-90 transition-opacity">
              Open live site ↗
            </a>
          ) : localPreviewBlobUrl ? (
            <a href={localPreviewBlobUrl} target="_blank" rel="noreferrer" className="rounded-full bg-v2-purple px-3 py-1.5 font-body text-[12px] font-medium text-white hover:opacity-90 transition-opacity">
              Open in new tab ↗
            </a>
          ) : (
            <span className="rounded-full bg-gray-100 px-3 py-1.5 font-body text-[12px] font-medium text-v2-subtle">Nothing to preview yet</span>
          )}
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1080px] min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6">

        {/* Real live preview */}
        <div className="shrink-0 overflow-hidden rounded-[20px]" style={{ background: "radial-gradient(ellipse at 50% 0%, #241f5c, #100e2e 65%)" }}>
          <div className="px-6 pt-6">
            <div className="font-body text-[15px] font-medium text-white">{startup?.name || "Your product"} — what's actually been built</div>
            <p className="mt-0.5 max-w-[420px] font-body text-[11px] leading-relaxed text-[#a8a3d9]">
              {latestLive
                ? "Real deploy, embedded live below — this is the actual page AI Developer shipped."
                : localPreview
                ? "No public URL yet, but here's exactly what was built — rendered directly from the real file, no hosting needed."
                : "Nothing has reached production yet. Once a real deploy goes live, it renders here."}
            </p>
            {!latestLive && localPreview?.pagesError && (
              <p className="mt-2 max-w-[420px] rounded-lg bg-white/[0.06] px-3 py-2 font-body text-[10px] leading-relaxed text-[#c9c5f0]">
                Why there's no public link: {localPreview.pagesError}
              </p>
            )}
          </div>
          <div className="flex min-h-[380px] items-center justify-center p-6">
            {loading ? (
              <div className="font-body text-[12px] text-[#a8a3d9]">Loading real activity…</div>
            ) : latestLive ? (
              <div className="w-full overflow-hidden rounded-2xl bg-white" style={{ boxShadow: "0 30px 70px rgba(0,0,0,.45)" }}>
                <div className="flex h-[30px] items-center gap-1.5 bg-[#26263a] px-3">
                  {["#E24B4A", "#BA7517", "#1D9E75"].map((c) => <div key={c} className="h-[7px] w-[7px] rounded-full" style={{ background: c }} />)}
                  <div className="ml-2 flex-1 truncate rounded-xl bg-white/[0.08] px-3 py-1 font-body text-[10px] text-[#c9c5f0]">{latestLive.liveUrl}</div>
                </div>
                <iframe title="Live product preview" src={latestLive.liveUrl} className="h-[420px] w-full border-0" />
              </div>
            ) : localPreview ? (
              <div className="w-full overflow-hidden rounded-2xl bg-white" style={{ boxShadow: "0 30px 70px rgba(0,0,0,.45)" }}>
                <div className="flex h-[30px] items-center gap-1.5 bg-[#26263a] px-3">
                  {["#E24B4A", "#BA7517", "#1D9E75"].map((c) => <div key={c} className="h-[7px] w-[7px] rounded-full" style={{ background: c }} />)}
                  <div className="ml-2 flex-1 truncate rounded-xl bg-white/[0.08] px-3 py-1 font-body text-[10px] text-[#c9c5f0]">{localPreview.filePath} · local preview, not a public link</div>
                </div>
                <iframe title="Local product preview" srcDoc={localPreview.fileContent} className="h-[420px] w-full border-0" />
              </div>
            ) : (
              <div className="max-w-[320px] text-center font-body text-[12px] leading-relaxed text-[#a8a3d9]">
                No real deploy yet. Hand AI Developer a task from the Chat page — once it reaches production, the real live page shows up right here.
              </div>
            )}
          </div>
        </div>

        {/* Build history */}
        <div className="rounded-[14px] border border-v2-border bg-white p-4">
          <div className="font-body text-[13px] font-medium text-v2-heading">Build history</div>
          <div className="mb-3 font-body text-[11px] text-v2-subtle">Every real AI Developer change — PR opened, and whether it reached production</div>
          {loading ? (
            <div className="py-6 text-center font-body text-[12px] text-v2-muted">Loading…</div>
          ) : history.length === 0 ? (
            <div className="py-6 text-center font-body text-[12px] text-v2-muted">No real AI Developer activity yet.</div>
          ) : (
            history.map((h, i) => (
              <div key={h.targetId} className="flex gap-3 border-b border-gray-100 py-3 last:border-0">
                <div className="flex shrink-0 flex-col items-center">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full" style={{ background: h.live ? "#1D9E75" : "#9ca3af" }} />
                  {i < history.length - 1 && <div className="mt-1 w-px flex-1 bg-gray-200" />}
                </div>
                <div className="flex-1 pb-0.5">
                  <div className="font-body text-[11px] font-medium text-v2-heading">{h.filePath || h.title}</div>
                  <p className="mt-0.5 font-body text-[11px] leading-relaxed text-v2-muted">{h.title}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2.5">
                    <div className="flex items-center gap-1.5">
                      <WhoBadge initials="DEV" bg="#f3f4f6" color="#6b7280" />
                      <span className="font-body text-[9px] text-v2-subtle">{h.prUrl ? <a href={h.prUrl} target="_blank" rel="noreferrer" className="hover:underline">Built · view PR</a> : "Built"}</span>
                    </div>
                    {h.live && h.liveUrl && (
                      <a href={h.liveUrl} target="_blank" rel="noreferrer" className="font-body text-[9px] text-v2-blue hover:underline">Live ↗</a>
                    )}
                    <span className="ml-auto font-body text-[9px] text-v2-subtle">{formatEventTime(h.time)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Real data captured — form submissions from the actual live site, not simulated */}
        <div className="rounded-[14px] border border-v2-border bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="font-body text-[13px] font-medium text-v2-heading">Real data captured</div>
            {submissions.length > 0 && (
              <span className="rounded-full bg-[#EAF3DE] px-2 py-0.5 font-body text-[10px] font-medium text-[#27500A]">{submissions.length} submission{submissions.length === 1 ? "" : "s"}</span>
            )}
          </div>
          <div className="mb-3 font-body text-[11px] text-v2-subtle">Real people who visited the live site and submitted a form — signups, leads, contact requests</div>
          {loading ? (
            <div className="py-6 text-center font-body text-[12px] text-v2-muted">Loading…</div>
          ) : submissions.length === 0 ? (
            <div className="py-6 text-center font-body text-[12px] text-v2-muted">No real submissions yet. Once a hosted page's form is submitted, it shows up here.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <tbody>
                  {submissions.map((s) => (
                    <tr key={s._id} className="border-b border-gray-100 last:border-0">
                      <td className="w-[110px] py-2 pr-3 align-top font-body text-[10px] text-v2-subtle">{formatEventTime(s.createdAt)}</td>
                      <td className="py-2 align-top font-body text-[11px] text-v2-heading">
                        {Object.entries(s.data || {}).map(([k, v]) => (
                          <span key={k} className="mr-3 inline-block"><span className="text-v2-subtle">{k}:</span> {String(v)}</span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
