/**
 * V2AIMarketingWorkspace — matches StartupVerse_AI_Marketing.html design, wired to real API.
 * Layout: topbar · 4 stat cards · content pipeline · brand library grid · activity | right panel
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useOfficeStore } from "../../state/useOfficeStore";
import { generateMarketingOutput, getMarketingOutputs } from "../../utils/api/salesMarketingApi";
import { sendOutreachSequence, sendWhatsAppOutreach, getIntegrations, postToLinkedIn } from "../../utils/api/integrationsApi";
import { formatEventTime } from "../../utils/agentDisplay";

/* ─── helpers ─────────────────────────────────────────────────────────────── */
function contentStatus(item) {
  if (item.actionKey === "create_social_post") return { label: "Scheduled", bg: "#E6F1FB", color: "#0C447C" };
  if (item.actionKey === "plan_campaign") return { label: "Draft", bg: "#f3f4f6", color: "#6b7280" };
  if (item.actionKey === "draft_email_sequence") return { label: "Awaiting review", bg: "#FCF7EC", color: "#633806" };
  if (item.actionKey === "create_content_calendar") return { label: "Published", bg: "#EAF3DE", color: "#27500A" };
  if (item.actionKey === "analyze_icp") return { label: "Handed off", bg: "#f3f4f6", color: "#6b7280" };
  return { label: "Draft", bg: "#f3f4f6", color: "#6b7280" };
}

function contentIcon(key) {
  return { analyze_icp: "🗺️", create_social_post: "📱", plan_campaign: "📣", draft_email_sequence: "✉️", create_content_calendar: "📅" }[key] || "📝";
}

function contentIconBg(key) {
  return { analyze_icp: "#E6F1FB", create_social_post: "#f3f4f6", plan_campaign: "#EAF3DE", draft_email_sequence: "#FAEEDA", create_content_calendar: "#EAF3DE" }[key] || "#f3f4f6";
}

function actionLabel(key) {
  return { analyze_icp: "ICP & Messaging Analysis", create_social_post: "Social post", plan_campaign: "Campaign plan", draft_email_sequence: "Email sequence", create_content_calendar: "Content calendar" }[key] || key;
}

function previewText(item) {
  const r = item.result || {};
  if (item.actionKey === "analyze_icp") return `ICP: ${r.icp?.who || ""} — positioning & channel strategy`;
  if (item.actionKey === "create_social_post") return `${(r.platform || "").toUpperCase()} · ${(r.mainPost || r.post || "").slice(0, 80)}`;
  if (item.actionKey === "plan_campaign") return `${r.campaignName || ""} · ${r.objective || ""}`.slice(0, 100);
  if (item.actionKey === "draft_email_sequence") return `${r.sequenceName || ""} · ${r.emails?.length || 0} emails for ${r.audience || "prospects"}`;
  if (item.actionKey === "create_content_calendar") return `${r.month || "30-day"} calendar · ${(r.weeks || []).reduce((n, w) => n + (w.posts?.length || 0), 0)} posts planned`;
  return "";
}

/* ─── generate modal ──────────────────────────────────────────────────────── */
const PLATFORM_OPTIONS = ["linkedin", "instagram", "facebook", "x", "all"];
const POST_GOALS = [{ v: "awareness", l: "Brand awareness" }, { v: "engagement", l: "Drive engagement" }, { v: "lead_gen", l: "Generate leads" }, { v: "product_launch", l: "Product launch" }];
const CAMPAIGN_GOALS = [{ v: "launch", l: "Product launch" }, { v: "lead_gen", l: "Lead generation" }, { v: "brand_awareness", l: "Brand awareness" }, { v: "retention", l: "Customer retention" }];
const EMAIL_GOALS = [{ v: "welcome", l: "Welcome new subscribers" }, { v: "onboarding", l: "Onboarding sequence" }, { v: "re_engage", l: "Re-engage cold list" }, { v: "launch", l: "Product launch campaign" }];
const GEN_ACTIONS = [
  { key: "analyze_icp", icon: "🗺️", label: "Analyze ICP & messaging" },
  { key: "create_social_post", icon: "📱", label: "Create social post" },
  { key: "plan_campaign", icon: "📣", label: "Plan a campaign" },
  { key: "draft_email_sequence", icon: "✉️", label: "Draft email sequence" },
  { key: "create_content_calendar", icon: "📅", label: "Create content calendar" },
];

function GenerateModal({ founderId, onClose, onDone }) {
  const [actionKey, setActionKey] = useState("create_social_post");
  const [platform, setPlatform] = useState("instagram");
  const [postGoal, setPostGoal] = useState("awareness");
  const [postTopic, setPostTopic] = useState("");
  const [campaignGoal, setCampaignGoal] = useState("launch");
  const [emailGoal, setEmailGoal] = useState("welcome");
  const [calPlatforms, setCalPlatforms] = useState(["linkedin", "instagram"]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const toggle = (p) => setCalPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const payload = () => {
    if (actionKey === "create_social_post") return { platform, goal: postGoal, topic: postTopic };
    if (actionKey === "plan_campaign") return { goal: campaignGoal };
    if (actionKey === "draft_email_sequence") return { goal: emailGoal };
    if (actionKey === "create_content_calendar") return { platforms: calPlatforms.length ? calPlatforms : ["linkedin", "instagram"] };
    return {};
  };

  const handle = async () => {
    if (busy) return;
    setBusy(true); setError("");
    try { await generateMarketingOutput(founderId, actionKey, payload()); onDone(); }
    catch (e) { setError(e?.message || "Generation failed — check your AI API key."); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-[16px] bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-gray-100 px-[18px] py-4">
          <div>
            <div className="font-body text-[14px] font-medium text-[#111]">New content</div>
            <div className="font-body text-[11px] text-[#9ca3af] mt-0.5">AI Marketing will draft from your brand library</div>
          </div>
          <button type="button" onClick={onClose} className="flex h-[26px] w-[26px] items-center justify-center rounded-[8px] bg-gray-100 text-gray-500 hover:bg-gray-200">
            <svg width="12" height="12" viewBox="0 0 12 12"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="px-[18px] py-4 space-y-3">
          <div className="grid grid-cols-1 gap-2">
            {GEN_ACTIONS.map(a => (
              <button key={a.key} type="button" onClick={() => setActionKey(a.key)}
                className={`flex items-center gap-3 rounded-[8px] border px-3 py-2.5 text-left transition-colors ${actionKey === a.key ? "border-[#1D9E75] bg-[#EAF3DE]" : "border-gray-200 hover:bg-gray-50"}`}>
                <span>{a.icon}</span>
                <span className="font-body text-[12px] font-medium text-[#111]">{a.label}</span>
              </button>
            ))}
          </div>
          {actionKey === "create_social_post" && (
            <div className="space-y-2">
              <select value={platform} onChange={e => setPlatform(e.target.value)} className="w-full rounded-[8px] border border-gray-200 px-3 py-2 font-body text-[12px] focus:outline-none">
                {PLATFORM_OPTIONS.map(p => <option key={p} value={p}>{p === "all" ? "All platforms" : p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
              <select value={postGoal} onChange={e => setPostGoal(e.target.value)} className="w-full rounded-[8px] border border-gray-200 px-3 py-2 font-body text-[12px] focus:outline-none">
                {POST_GOALS.map(g => <option key={g.v} value={g.v}>{g.l}</option>)}
              </select>
              <input value={postTopic} onChange={e => setPostTopic(e.target.value)} placeholder="e.g. Instagram post about the new booking feature" className="w-full rounded-[8px] border border-gray-200 px-3 py-2 font-body text-[12px] placeholder:text-gray-400 focus:outline-none" />
            </div>
          )}
          {actionKey === "plan_campaign" && (
            <select value={campaignGoal} onChange={e => setCampaignGoal(e.target.value)} className="w-full rounded-[8px] border border-gray-200 px-3 py-2 font-body text-[12px] focus:outline-none">
              {CAMPAIGN_GOALS.map(g => <option key={g.v} value={g.v}>{g.l}</option>)}
            </select>
          )}
          {actionKey === "draft_email_sequence" && (
            <select value={emailGoal} onChange={e => setEmailGoal(e.target.value)} className="w-full rounded-[8px] border border-gray-200 px-3 py-2 font-body text-[12px] focus:outline-none">
              {EMAIL_GOALS.map(g => <option key={g.v} value={g.v}>{g.l}</option>)}
            </select>
          )}
          {actionKey === "create_content_calendar" && (
            <div>
              <div className="mb-1.5 font-body text-[10px] font-semibold text-[#9ca3af]">Platforms</div>
              <div className="flex flex-wrap gap-2">
                {["linkedin", "instagram", "facebook", "x"].map(p => (
                  <button key={p} type="button" onClick={() => toggle(p)}
                    className={`rounded-full border px-3 py-1 font-body text-[11px] capitalize transition-colors ${calPlatforms.includes(p) ? "border-[#1D9E75] bg-[#EAF3DE] text-[#27500A]" : "border-gray-200 text-[#9ca3af] hover:bg-gray-50"}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
          {error && <div className="rounded-[8px] bg-red-50 px-3 py-2 font-body text-[11px] text-red-600">{error}</div>}
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-[18px] py-3">
          <button type="button" onClick={onClose} className="rounded-full border border-gray-200 px-4 py-1.5 font-body text-[12px] font-medium text-[#111] hover:bg-gray-50">Cancel</button>
          <button type="button" onClick={handle} disabled={busy} className="rounded-full bg-[#534AB7] px-4 py-1.5 font-body text-[12px] font-medium text-white hover:opacity-90 disabled:opacity-60">
            {busy ? "AI Marketing is working…" : "Draft content →"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── detail modal ────────────────────────────────────────────────────────── */
function DetailModal({ item, onClose }) {
  if (!item) return null;
  const r = item.result || {};

  const body = () => {
    if (item.actionKey === "analyze_icp") return (
      <div className="space-y-2 font-body text-[12px] text-[#374151] leading-relaxed">
        <p><b>ICP:</b> {r.icp?.who}</p>
        {r.icp?.painPoints?.length > 0 && <p><b>Pain points:</b> {r.icp.painPoints.join(", ")}</p>}
        {r.messagingAngles?.length > 0 && <p><b>Messaging angles:</b> {r.messagingAngles.map(a => a.angle).join("; ")}</p>}
        {r.channels?.length > 0 && <p><b>Best channels:</b> {r.channels.map(c => c.channel).join(", ")}</p>}
        {r.positioning && <p><b>Positioning:</b> {r.positioning}</p>}
      </div>
    );
    if (item.actionKey === "create_social_post") return (
      <div className="space-y-2 font-body text-[12px] text-[#374151] leading-relaxed">
        <p><b>Platform:</b> {r.platform}</p>
        <p className="whitespace-pre-wrap">{r.mainPost || r.post}</p>
        {r.hashtags?.length > 0 && <p className="text-[#185FA5]">{r.hashtags.map(h => `#${h}`).join(" ")}</p>}
        {r.bestTimeToPost && <p><b>Best time:</b> {r.bestTimeToPost}</p>}
        {r.engagementHook && <p><b>Engagement hook:</b> {r.engagementHook}</p>}
      </div>
    );
    if (item.actionKey === "plan_campaign") return (
      <div className="space-y-2 font-body text-[12px] text-[#374151] leading-relaxed">
        <p><b>{r.campaignName}</b> · {r.duration}</p>
        <p><b>Objective:</b> {r.objective}</p>
        {r.channels?.length > 0 && <p><b>Channels:</b> {r.channels.map(c => c.channel).join(", ")}</p>}
        {r.contentPillars?.length > 0 && <p><b>Content pillars:</b> {r.contentPillars.join(", ")}</p>}
        {r.cta && <p><b>CTA:</b> {r.cta}</p>}
      </div>
    );
    if (item.actionKey === "draft_email_sequence") return (
      <div className="space-y-2 font-body text-[12px] text-[#374151] leading-relaxed">
        <p><b>{r.sequenceName}</b></p>
        {(r.emails || []).map((e, i) => (
          <div key={i} className="border-b border-gray-100 pb-2">
            <b>Email {e.emailNumber} (Day {e.dayOffset}):</b> {e.subject}<br/>
            <span className="text-gray-500 text-[11px]">{(e.body || "").slice(0, 150)}{(e.body || "").length > 150 ? "…" : ""}</span>
          </div>
        ))}
      </div>
    );
    if (item.actionKey === "create_content_calendar") return (
      <div className="space-y-2 font-body text-[12px] text-[#374151] leading-relaxed">
        <p><b>{r.month} calendar</b> · {(r.weeks || []).reduce((n, w) => n + (w.posts?.length || 0), 0)} posts</p>
        <p><b>Theme:</b> {r.overallTheme}</p>
        {r.contentPillars?.length > 0 && <p><b>Pillars:</b> {r.contentPillars.join(", ")}</p>}
        {(r.weeks || []).slice(0, 2).map((w, i) => (
          <div key={i} className="border-b border-gray-100 pb-2">
            <b>Week {w.week}:</b> {w.theme}<br/>
            <span className="text-[#9ca3af] text-[11px]">{(w.posts || []).slice(0, 2).map(p => `${p.platform} — ${p.topic}`).join(" · ")}</span>
          </div>
        ))}
      </div>
    );
    return <p className="font-body text-[12px] text-[#374151]">{previewText(item)}</p>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.45)] p-5" onClick={onClose}>
      <div className="max-h-[82vh] w-full max-w-[440px] overflow-auto rounded-[16px] bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-2.5 border-b border-gray-200 px-[18px] py-4">
          <div>
            <div className="font-body text-[14px] font-medium text-[#111]">{actionLabel(item.actionKey)}</div>
            <div className="font-body text-[11px] text-[#9ca3af] mt-0.5">{formatEventTime(item.createdAt)}</div>
          </div>
          <button type="button" onClick={onClose} className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[8px] bg-gray-100 text-gray-500 hover:bg-gray-200">
            <svg width="12" height="12" viewBox="0 0 12 12"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="px-[18px] py-4">{body()}</div>
        <div className="flex justify-end border-t border-gray-100 px-[18px] py-3">
          <button type="button" onClick={onClose} className="rounded-full border border-gray-200 px-4 py-1.5 font-body text-[12px] font-medium text-[#111] hover:bg-gray-50">Close</button>
        </div>
      </div>
    </div>
  );
}

/* ─── static library items ─────────────────────────────────────────────────── */
const STATIC_LIBRARY = [
  { icon: "🎙️", name: "Brand voice guide", sub: "Drafts checked against this", key: "lib-voice" },
  { icon: "💊", name: "ICP & pain-point bank", sub: "From validated interviews", key: "lib-pain" },
  { icon: "🗺️", name: "Messaging kit", sub: "Market positioning", key: "lib-msg" },
  { icon: "🎨", name: "Brand assets & logo", sub: "Maintained with AI Designer", key: "lib-brand" },
  { icon: "❓", name: "Objection & FAQ bank", sub: "Updated from customer replies", key: "lib-faq" },
  { icon: "➕", name: "Add new asset", sub: "Give AI Marketing more to work from", key: "lib-add", disabled: true },
];

/* ─── CopyPostModal ─────────────────────────────────────────────────────────── */
const PLATFORM_COLOR = { linkedin: "#0A66C2", instagram: "#E1306C", facebook: "#1877F2", x: "#000", all: "#534AB7", whatsapp: "#25D366" };
const PLATFORM_OPEN_URL = { linkedin: "https://www.linkedin.com/feed/", instagram: "https://www.instagram.com/", facebook: "https://www.facebook.com/", x: "https://x.com/compose/tweet" };

function CopyPostModal({ item, founderId, onClose, onSent, liConnected }) {
  const r = item.result || {};
  const platform = (r.platform || "linkedin").toLowerCase();
  const postText = r.mainPost || r.post || "";
  const [text, setText] = useState(postText);
  const [phone, setPhone] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const isWA = platform === "whatsapp";
  const isLiOAuth = platform === "linkedin" && liConnected;
  const color = PLATFORM_COLOR[platform] || "#534AB7";
  const openUrl = PLATFORM_OPEN_URL[platform];
  const platformLabel = platform === "all" ? "All platforms" : platform.charAt(0).toUpperCase() + platform.slice(1);

  const handleDirectLinkedIn = async () => {
    if (!text.trim() || !founderId) return;
    setBusy(true); setError("");
    try {
      await postToLinkedIn(founderId, text);
      onSent("Posted to LinkedIn directly");
    } catch (err) {
      setError(err?.message || "LinkedIn post failed. Check your connection in Integrations.");
    } finally { setBusy(false); }
  };

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { /* ignore */ }
  };

  const handleSendWA = async (e) => {
    e.preventDefault();
    if (!phone || !founderId) return;
    setBusy(true); setError("");
    try {
      await sendWhatsAppOutreach(founderId, { recipientPhone: phone, message: text });
      onSent("WhatsApp message sent successfully");
    } catch (err) {
      setError(err?.message || "Failed to send. Check WhatsApp integration in Integrations.");
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.45)] p-5" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-[420px] overflow-auto rounded-[16px] bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-2.5 border-b border-gray-200 px-[18px] py-4">
          <div>
            <div className="font-body text-[14px] font-medium text-[#111]">
              {isWA ? "Send via WhatsApp" : `Copy & post to ${platformLabel}`}
            </div>
            <div className="font-body text-[11px] text-[#9ca3af] mt-0.5">
              {isWA ? "Send directly via WhatsApp Business API" : "Copy your post then open the platform to publish"}
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[8px] bg-gray-100 text-gray-500 hover:bg-gray-200">
            <svg width="12" height="12" viewBox="0 0 12 12"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="px-[18px] py-4 space-y-3">
          <textarea rows={6} value={text} onChange={e => setText(e.target.value)}
            className="w-full resize-y rounded-lg border border-gray-200 bg-[#f9fafb] px-3 py-2 font-body text-[12px] text-[#111] focus:outline-none" />
          {r.hashtags?.length > 0 && (
            <div className="font-body text-[11px]" style={{ color }}>{r.hashtags.map(h => `#${h}`).join(" ")}</div>
          )}
          {r.bestTimeToPost && (
            <div className="font-body text-[10px] text-[#9ca3af]">Best time to post: {r.bestTimeToPost}</div>
          )}
          {isWA ? (
            <form onSubmit={handleSendWA} className="space-y-2">
              <div>
                <label className="mb-1 block font-body text-[11px] font-medium text-[#111]">WhatsApp phone number *</label>
                <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+234 801 234 5678"
                  className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 font-body text-[12px] text-[#111] focus:outline-none" />
                <div className="mt-0.5 font-body text-[9px] text-[#9ca3af]">Include country code e.g. +234 for Nigeria</div>
              </div>
              {error && <div className="rounded-lg bg-red-50 px-3 py-2 font-body text-[11px] text-red-700">{error}</div>}
              <div className="flex gap-2">
                <button type="button" onClick={handleCopy} className="flex-1 rounded-full border border-gray-200 px-4 py-1.5 font-body text-[12px] font-medium text-[#111] hover:bg-gray-50">
                  {copied ? "Copied!" : "Copy text"}
                </button>
                <button type="submit" disabled={busy || !phone} className="flex-1 rounded-full px-4 py-1.5 font-body text-[12px] font-medium text-white disabled:opacity-60" style={{ background: "#25D366" }}>
                  {busy ? "Sending…" : "Send via WhatsApp"}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex gap-2">
              <button type="button" onClick={handleCopy} className="flex-1 rounded-full border border-gray-200 px-4 py-1.5 font-body text-[12px] font-medium text-[#111] hover:bg-gray-50">
                {copied ? "✓ Copied!" : "Copy text"}
              </button>
              {isLiOAuth ? (
                <button type="button" disabled={busy || !text.trim()} onClick={handleDirectLinkedIn}
                  className="flex-1 rounded-full px-4 py-1.5 font-body text-[12px] font-medium text-white disabled:opacity-60"
                  style={{ background: "#0A66C2" }}>
                  {busy ? "Posting…" : "Post to LinkedIn →"}
                </button>
              ) : openUrl && (
                <a href={openUrl} target="_blank" rel="noopener noreferrer"
                  className="flex-1 rounded-full px-4 py-1.5 text-center font-body text-[12px] font-medium text-white no-underline"
                  style={{ background: color }}>
                  Open {platformLabel} →
                </a>
              )}
              {platform === "all" && (
                <div className="flex gap-1">
                  {["linkedin", "instagram", "facebook"].map(p => (
                    <a key={p} href={PLATFORM_OPEN_URL[p]} target="_blank" rel="noopener noreferrer"
                      className="rounded-full px-2 py-1.5 font-body text-[10px] font-medium text-white no-underline"
                      style={{ background: PLATFORM_COLOR[p] }}>
                      {p === "linkedin" ? "in" : p === "instagram" ? "IG" : "f"}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── main ────────────────────────────────────────────────────────────────── */
/* ─── SendSequenceModal ───────────────────────────────────────────────────── */
function SendSequenceModal({ item, founderId, onClose, onSent }) {
  const r = item.result || {};
  const [form, setForm] = useState({ recipientEmail: "", recipientName: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const steps = (r.emails || []).map((em) => ({
    subject: em.subject,
    htmlBody: `<p>${(em.body || "").replace(/\n/g, "<br/>")}</p>`,
  }));

  async function handleSend(e) {
    e.preventDefault();
    if (!form.recipientEmail || !steps.length) return;
    setBusy(true);
    setError("");
    try {
      await sendOutreachSequence(founderId, {
        recipientEmail: form.recipientEmail,
        recipientName: form.recipientName,
        steps,
        agentEventId: item._id,
      });
      onSent(`Email sequence sent to ${form.recipientEmail} (${steps.length} emails)`);
    } catch (err) {
      setError(err?.message || "Failed to send. Make sure Gmail is connected in Integrations.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.45)] p-5" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-[420px] overflow-auto rounded-[16px] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-2.5 border-b border-gray-200 px-[18px] py-4">
          <div>
            <div className="font-body text-[14px] font-medium text-[#111]">Start email sequence</div>
            <div className="font-body text-[11px] text-[#9ca3af] mt-0.5">{r.sequenceName || "Email sequence"} · {steps.length} emails</div>
          </div>
          <button type="button" onClick={onClose} className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[8px] bg-gray-100 text-gray-500 hover:bg-gray-200">
            <svg width="12" height="12" viewBox="0 0 12 12"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </button>
        </div>
        <form onSubmit={handleSend} className="px-[18px] py-4 space-y-3">
          <div className="rounded-lg bg-[#f9fafb] p-3 font-body text-[11px] text-[#6b7280]">
            {steps.map((s, i) => <div key={i}>Email {i + 1}: {s.subject}</div>)}
          </div>
          <div>
            <label className="mb-1 block font-body text-[11px] font-medium text-[#111]">Recipient email *</label>
            <input required type="email" value={form.recipientEmail} onChange={(e) => setForm((f) => ({ ...f, recipientEmail: e.target.value }))}
              placeholder="subscriber@company.com"
              className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 font-body text-[12px] text-[#111] focus:outline-none focus:ring-1 focus:ring-[#534AB7]" />
          </div>
          <div>
            <label className="mb-1 block font-body text-[11px] font-medium text-[#111]">Recipient name (optional)</label>
            <input type="text" value={form.recipientName} onChange={(e) => setForm((f) => ({ ...f, recipientName: e.target.value }))}
              placeholder="e.g. Chidinma Obi"
              className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 font-body text-[12px] text-[#111] focus:outline-none focus:ring-1 focus:ring-[#534AB7]" />
          </div>
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 font-body text-[11px] text-red-700">{error}</div>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-full border border-gray-200 px-4 py-1.5 font-body text-[12px] font-medium text-[#111] hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={busy || !form.recipientEmail || !steps.length}
              className="rounded-full bg-[#534AB7] px-4 py-1.5 font-body text-[12px] font-medium text-white hover:opacity-90 disabled:opacity-60">
              {busy ? "Sending…" : `Send sequence (${steps.length} emails)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function V2AIMarketingWorkspace({ user, onBack }) {
  const officeFounderId = useOfficeStore((s) => s.founderId);
  const founderId = officeFounderId || String(user?._id ?? user?.id ?? "");
  const [outputs, setOutputs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [sendToast, setSendToast] = useState("");
  const [gmailConnected, setGmailConnected] = useState(false);
  const [waConnected, setWaConnected] = useState(false);
  const [igConnected, setIgConnected] = useState(false);
  const [liConnected, setLiConnected] = useState(false);

  const load = useCallback(async () => {
    if (!founderId) { setLoading(false); return; }
    try { const d = await getMarketingOutputs(founderId); setOutputs(d || []); }
    catch { setOutputs([]); }
    finally { setLoading(false); }
  }, [founderId]);

  const loadIntegrations = useCallback(async () => {
    if (!founderId) return;
    try {
      const list = await getIntegrations(founderId);
      const byType = Object.fromEntries(list.map(i => [i.type, i]));
      setGmailConnected(byType.gmail?.status === "connected");
      setWaConnected(byType.whatsapp?.status === "connected");
      setIgConnected(byType.instagram?.status === "connected");
      setLiConnected(byType.linkedin?.status === "connected" && Boolean(byType.linkedin?.meta?.personUrn));
    } catch { /* ignore */ }
  }, [founderId]);

  useEffect(() => { load(); loadIntegrations(); }, [load, loadIntegrations]);

  const awaitingReview = useMemo(() => outputs.filter(o => o.actionKey === "draft_email_sequence").length, [outputs]);
  const published = useMemo(() => outputs.filter(o => o.actionKey === "create_social_post" || o.actionKey === "create_content_calendar").length, [outputs]);
  const activityItems = useMemo(() => outputs.slice(0, 6), [outputs]);

  if (loading) return (
    <div className="flex flex-1 items-center justify-center bg-[#f9fafb]">
      <div className="font-body text-[13px] text-[#9ca3af]">Loading AI Marketing…</div>
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-[#f9fafb]">

      {/* ── Main ── */}
      <div className="flex min-h-0 flex-1 flex-col overflow-auto">

        {/* Topbar */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#e5e7eb] bg-white px-5">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={onBack} className="font-body text-[12px] text-[#9ca3af] hover:text-[#6b7280]">← Back</button>
            <span className="font-body text-[12px] text-[#d1d5db]">·</span>
            <span className="font-body text-[12px] text-[#9ca3af]">StartupVerse</span>
            <span className="font-body text-[12px] text-[#d1d5db]">›</span>
            <span className="font-body text-[14px] font-medium text-[#111]">AI Marketing</span>
            {awaitingReview > 0 && (
              <>
                <span className="font-body text-[12px] text-[#d1d5db]">·</span>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FAEEDA] px-2.5 py-1 font-body text-[11px] text-[#633806]">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#BA7517]"/>
                  {awaitingReview} waiting on review
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="rounded-full border border-[#d1d5db] bg-white px-3.5 py-1.5 font-body text-[12px] font-medium text-[#111] hover:bg-[#f9fafb]">Approval queue</button>
            <button type="button" onClick={() => setShowGenerate(true)} className="rounded-full bg-[#534AB7] px-3.5 py-1.5 font-body text-[12px] font-medium text-white hover:opacity-90">+ New content</button>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-5">

          {/* 4 stat cards */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { lbl: "Content drafted", val: outputs.length, sub: "This session" },
              { lbl: "Published live", val: published, sub: published > 0 ? "↑ social & calendar" : "—" },
              { lbl: "Awaiting review", val: awaitingReview, sub: awaitingReview > 0 ? "Email sequences" : "—" },
              { lbl: "Campaigns planned", val: outputs.filter(o => o.actionKey === "plan_campaign").length, sub: "Campaign briefs" },
            ].map((c) => (
              <div key={c.lbl} className="rounded-[14px] border border-[#e5e7eb] bg-white px-4 py-3.5">
                <div className="font-body text-[10px] uppercase tracking-[0.4px] text-[#9ca3af]">{c.lbl}</div>
                <div className="mt-1.5 font-body text-[19px] font-medium text-[#111]">{c.val}</div>
                <div className={`mt-0.5 font-body text-[10px] ${c.val > 0 ? "text-[#1D9E75]" : "text-[#6b7280]"}`}>{c.sub}</div>
              </div>
            ))}
          </div>

          {/* Content pipeline */}
          <div className="rounded-[14px] border border-[#e5e7eb] bg-white px-[18px] py-4">
            <div className="mb-3">
              <div className="font-body text-[13px] font-medium text-[#111]">Content pipeline</div>
              <div className="font-body text-[11px] text-[#9ca3af] mt-0.5">Everything AI Marketing is drafting, scheduling, or has shipped</div>
            </div>
            {outputs.length === 0 ? (
              <div className="py-6 text-center font-body text-[12px] text-[#9ca3af]">Click "+ New content" to have AI Marketing create posts, campaigns, or email sequences.</div>
            ) : (
              outputs.slice(0, 6).map((item, i) => {
                const st = contentStatus(item);
                return (
                  <div key={i} className="flex items-center gap-3 border-b border-[#f3f4f6] py-[11px] last:border-b-0 hover:bg-[#fafafa]">
                    <div className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[9px] text-[13px]" style={{ background: contentIconBg(item.actionKey) }} onClick={() => setActiveModal(item)}>
                      {contentIcon(item.actionKey)}
                    </div>
                    <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setActiveModal(item)}>
                      <div className="font-body text-[12px] font-medium text-[#111] truncate">{actionLabel(item.actionKey)}</div>
                      <div className="font-body text-[10px] text-[#9ca3af] truncate">{previewText(item)}</div>
                    </div>
                    <div className="shrink-0 rounded-[6px] px-2 py-0.5 font-body text-[9px] font-medium" style={{ background: st.bg, color: st.color }}>{st.label}</div>
                    {item.actionKey === "draft_email_sequence" && (
                      <button
                        type="button"
                        onClick={() => setActiveModal({ ...item, _sendMode: true })}
                        title="Send sequence via Gmail"
                        className="shrink-0 rounded-[7px] border border-[#e5e7eb] bg-white px-2 py-1 font-body text-[9px] font-medium text-[#185FA5] hover:bg-[#E6F1FB]"
                      >✉ Send</button>
                    )}
                    {item.actionKey === "create_social_post" && (
                      <button
                        type="button"
                        onClick={() => setActiveModal({ ...item, _copyMode: true })}
                        title="Copy & post to platform"
                        className="shrink-0 rounded-[7px] border border-[#e5e7eb] bg-white px-2 py-1 font-body text-[9px] font-medium text-[#534AB7] hover:bg-[#f5f4ff]"
                      >📋 Post</button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Brand & messaging library */}
          <div className="rounded-[14px] border border-[#e5e7eb] bg-white px-[18px] py-4">
            <div className="mb-3">
              <div className="font-body text-[13px] font-medium text-[#111]">Brand &amp; messaging library</div>
              <div className="font-body text-[11px] text-[#9ca3af] mt-0.5">Reusable assets AI Marketing draws from for every piece of content</div>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {STATIC_LIBRARY.map((lib) => {
                const icpOutput = lib.key === "lib-pain" ? outputs.find(o => o.actionKey === "analyze_icp") : null;
                const sub = icpOutput ? `Updated — ${formatEventTime(icpOutput.createdAt)}` : lib.sub;
                return (
                  <div key={lib.key}
                    className={`rounded-[11px] bg-[#f9fafb] p-3.5 ${lib.disabled ? "opacity-50 cursor-default" : "cursor-pointer hover:bg-[#f3f4f6]"}`}
                    onClick={() => { if (!lib.disabled && icpOutput) setActiveModal(icpOutput); }}>
                    <div className="mb-2 flex h-[26px] w-[26px] items-center justify-center rounded-[8px] bg-[#EAF3DE] text-[12px]">{lib.icon}</div>
                    <div className="font-body text-[11px] font-medium text-[#111]">{lib.name}</div>
                    <div className="font-body text-[9px] text-[#9ca3af] mt-0.5">{sub}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent activity */}
          <div className="rounded-[14px] border border-[#e5e7eb] bg-white px-[18px] py-4">
            <div className="mb-3 font-body text-[13px] font-medium text-[#111]">Recent activity</div>
            {activityItems.length === 0 ? (
              <div className="py-4 text-center font-body text-[12px] text-[#9ca3af]">No activity yet.</div>
            ) : (
              activityItems.map((item, i) => (
                <div key={i} className="flex cursor-pointer items-center gap-2.5 border-b border-[#f3f4f6] py-2.5 last:border-b-0" onClick={() => setActiveModal(item)}>
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] text-[11px]" style={{ background: contentIconBg(item.actionKey) }}>
                    {contentIcon(item.actionKey)}
                  </div>
                  <div className="flex-1 font-body text-[11px] text-[#111] truncate">{actionLabel(item.actionKey)} — {previewText(item).slice(0, 60)}</div>
                  <div className="shrink-0 font-body text-[9px] text-[#9ca3af]">{formatEventTime(item.createdAt)}</div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>

      {/* ── Right panel (280px) ── */}
      <div className="flex w-[280px] shrink-0 flex-col gap-3.5 overflow-auto border-l border-[#e5e7eb] bg-white p-4">

        {/* AI Marketing agent card */}
        <div className="rounded-[12px] bg-[#f9fafb] p-3">
          <div className="mb-2 font-body text-[12px] font-medium text-[#111]">AI Marketing</div>
          <div className="mb-2.5 flex items-center gap-2.5">
            <div className="relative shrink-0">
              <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-[#EAF3DE] font-body text-[10px] font-semibold text-[#27500A]">MK</div>
              <div className="absolute -bottom-0.5 -right-0.5 flex h-[13px] w-[13px] items-center justify-center rounded-full border-[1.5px] border-white bg-[#534AB7] text-[7px] text-white">⚡</div>
            </div>
            <div>
              <div className="font-body text-[12px] font-medium text-[#111]">Content &amp; campaigns</div>
              <div className="font-body text-[10px] text-[#9ca3af]">{outputs.length > 0 ? `Last active ${formatEventTime(outputs[0]?.createdAt)}` : "Idle · ready to work"}</div>
            </div>
          </div>
          <div className="font-body text-[10px] leading-relaxed text-[#6b7280]">Drafts content and campaigns freely. Publishing or scheduling anything live routes for a brand-voice check before it goes out.</div>
        </div>

        {/* This month stats */}
        <div className="rounded-[12px] bg-[#f9fafb] p-3">
          <div className="mb-2 font-body text-[12px] font-medium text-[#111]">This session</div>
          {[
            { k: "Content drafted", v: outputs.length },
            { k: "Social posts", v: outputs.filter(o => o.actionKey === "create_social_post").length },
            { k: "Email sequences", v: outputs.filter(o => o.actionKey === "draft_email_sequence").length },
            { k: "Campaigns planned", v: outputs.filter(o => o.actionKey === "plan_campaign").length },
            { k: "Handed to AI Sales", v: outputs.filter(o => o.actionKey === "analyze_icp").length },
          ].map(r => (
            <div key={r.k} className="flex items-center justify-between border-b border-[#f3f4f6] py-[5px] font-body text-[11px] last:border-b-0">
              <span className="text-[#9ca3af]">{r.k}</span>
              <span className="font-medium text-[#111]">{r.v}</span>
            </div>
          ))}
        </div>

        {/* Connected integrations */}
        <div className="rounded-[12px] bg-[#f9fafb] p-3">
          <div className="mb-2 font-body text-[12px] font-medium text-[#111]">Connected</div>
          {[
            { name: "WhatsApp Business", bg: "#25D366", connected: waConnected },
            { name: "Gmail", bg: "#EA4335", connected: gmailConnected },
            { name: "LinkedIn (OAuth)", bg: "#0A66C2", connected: liConnected },
            { name: "Instagram", bg: "#E1306C", connected: igConnected },
          ].map((c, i) => (
            <div key={i} className="flex items-center gap-2 border-b border-[#f3f4f6] py-[7px] last:border-b-0">
              <div className="h-6 w-6 shrink-0 rounded-[7px]" style={{ background: c.connected ? c.bg : "#f3f4f6" }}/>
              <div className="flex-1 font-body text-[11px] text-[#111]">{c.name}</div>
              {c.connected
                ? <div className="flex items-center gap-1 font-body text-[9px] text-[#1D9E75]"><span className="h-1.5 w-1.5 rounded-full bg-[#1D9E75] inline-block"/>Active</div>
                : <div className="font-body text-[9px] text-[#9ca3af]">Not connected</div>}
            </div>
          ))}
          <div className="mt-1 text-right"><span className="cursor-pointer font-body text-[10px] text-[#185FA5]">Manage integrations →</span></div>
        </div>

      </div>

      {showGenerate && <GenerateModal founderId={founderId} onClose={() => setShowGenerate(false)} onDone={() => { setShowGenerate(false); load(); }} />}
      {activeModal && !activeModal._sendMode && !activeModal._copyMode && <DetailModal item={activeModal} onClose={() => setActiveModal(null)} />}
      {activeModal?._sendMode && (
        <SendSequenceModal
          item={activeModal}
          founderId={founderId}
          onClose={() => setActiveModal(null)}
          onSent={(msg) => { setActiveModal(null); setSendToast(msg); setTimeout(() => setSendToast(""), 3000); }}
        />
      )}
      {activeModal?._copyMode && (
        <CopyPostModal
          item={activeModal}
          founderId={founderId}
          liConnected={liConnected}
          onClose={() => setActiveModal(null)}
          onSent={(msg) => { setActiveModal(null); setSendToast(msg); setTimeout(() => setSendToast(""), 3000); }}
        />
      )}
      {sendToast && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-gray-900 px-5 py-2.5 font-body text-[12px] font-medium text-white shadow-lg">{sendToast}</div>
      )}
    </div>
  );
}
