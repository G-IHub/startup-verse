/**
 * V2AISalesWorkspace — matches StartupVerse_AI_Sales.html design, wired to real API.
 * Layout: topbar · 4 stat cards · pipeline kanban · outreach queue · activity | right panel
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useOfficeStore } from "../../state/useOfficeStore";
import { generateSalesOutput, getSalesOutputs } from "../../utils/api/salesMarketingApi";
import { sendOutreachEmail, sendOutreachSequence, sendWhatsAppOutreach } from "../../utils/api/integrationsApi";
import { formatEventTime } from "../../utils/agentDisplay";

/* ─── helpers ─────────────────────────────────────────────────────────────── */
function pipelineStage(item) {
  if (item.actionKey === "qualify_lead") {
    const score = item.result?.score || 0;
    if (score >= 80) return "signed";
    if (score >= 60) return "call";
    if (score >= 40) return "replied";
    return "contacted";
  }
  if (item.actionKey === "draft_outreach" || item.actionKey === "draft_email_sequence") return "contacted";
  return null;
}

function stageLabel(stage) {
  return { contacted: "Contacted", replied: "Replied", call: "Call scheduled", signed: "Signed & paying" }[stage] || stage;
}

function stageColor(stage) {
  if (stage === "signed") return { bg: "#EAF3DE", color: "#27500A" };
  if (stage === "call") return { bg: "#FAEEDA", color: "#633806" };
  if (stage === "replied") return { bg: "#E6F1FB", color: "#0C447C" };
  return { bg: "#f3f4f6", color: "#6b7280" };
}

function previewText(item) {
  const r = item.result || {};
  if (item.actionKey === "analyze_icp") return `ICP: ${r.icp?.who || ""}`;
  if (item.actionKey === "draft_outreach") return (r.message || "").slice(0, 120);
  if (item.actionKey === "draft_email_sequence") return `${r.sequenceName || ""} · ${r.emails?.length || 0} emails`;
  if (item.actionKey === "qualify_lead") return `Score ${r.score}/100 · ${(r.tier || "").toUpperCase()} · ${(r.reasoning || "").slice(0, 80)}`;
  if (item.actionKey === "create_sales_script") return `${r.callLabel || ""} script · ${r.estimatedDuration || ""}`;
  return "";
}

function actionLabel(key) {
  return { analyze_icp: "ICP Analysis", draft_outreach: "Outreach draft", draft_email_sequence: "Email sequence", qualify_lead: "Lead qualification", create_sales_script: "Sales script" }[key] || key;
}

/* ─── generate modal ──────────────────────────────────────────────────────── */
const CHANNEL_OPTIONS = ["linkedin", "email", "instagram", "whatsapp", "facebook"];
const EMAIL_GOALS = [{ v: "cold_outreach", l: "Book a discovery call" }, { v: "nurture", l: "Nurture warm leads" }, { v: "re_engage", l: "Re-engage cold leads" }];
const CALL_TYPES = [{ v: "discovery", l: "Discovery call" }, { v: "demo", l: "Product demo" }, { v: "closing", l: "Closing call" }];
const GEN_ACTIONS = [
  { key: "analyze_icp", icon: "🎯", label: "Analyze ICP" },
  { key: "draft_outreach", icon: "✉️", label: "Draft outreach message" },
  { key: "draft_email_sequence", icon: "📬", label: "Draft email sequence" },
  { key: "qualify_lead", icon: "🔍", label: "Qualify a lead" },
  { key: "create_sales_script", icon: "📞", label: "Create sales script" },
];

function GenerateModal({ founderId, onClose, onDone }) {
  const [actionKey, setActionKey] = useState("draft_outreach");
  const [channel, setChannel] = useState("linkedin");
  const [target, setTarget] = useState("");
  const [emailGoal, setEmailGoal] = useState("cold_outreach");
  const [leadText, setLeadText] = useState("");
  const [callType, setCallType] = useState("discovery");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const payload = () => {
    if (actionKey === "draft_outreach") return { channel, targetDescription: target };
    if (actionKey === "draft_email_sequence") return { goal: emailGoal };
    if (actionKey === "qualify_lead") return { conversationText: leadText };
    if (actionKey === "create_sales_script") return { callType };
    return {};
  };

  const handle = async () => {
    if (busy) return;
    setBusy(true); setError("");
    try { await generateSalesOutput(founderId, actionKey, payload()); onDone(); }
    catch (e) { setError(e?.message || "Generation failed — check your AI API key."); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-[16px] bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-gray-100 px-[18px] py-4">
          <div>
            <div className="font-body text-[14px] font-medium text-[#111]">New outreach batch</div>
            <div className="font-body text-[11px] text-[#9ca3af] mt-0.5">AI Sales will draft and personalise from your pipeline</div>
          </div>
          <button type="button" onClick={onClose} className="flex h-[26px] w-[26px] items-center justify-center rounded-[8px] bg-gray-100 text-gray-500 hover:bg-gray-200">
            <svg width="12" height="12" viewBox="0 0 12 12"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="px-[18px] py-4 space-y-3">
          <div className="grid grid-cols-1 gap-2">
            {GEN_ACTIONS.map(a => (
              <button key={a.key} type="button" onClick={() => setActionKey(a.key)}
                className={`flex items-center gap-3 rounded-[8px] border px-3 py-2.5 text-left transition-colors ${actionKey === a.key ? "border-[#534AB7] bg-[#F5F3FF]" : "border-gray-200 hover:bg-gray-50"}`}>
                <span>{a.icon}</span>
                <span className="font-body text-[12px] font-medium text-[#111]">{a.label}</span>
              </button>
            ))}
          </div>
          {actionKey === "draft_outreach" && (
            <div className="space-y-2">
              <select value={channel} onChange={e => setChannel(e.target.value)} className="w-full rounded-[8px] border border-gray-200 px-3 py-2 font-body text-[12px] focus:outline-none">
                {CHANNEL_OPTIONS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
              <input value={target} onChange={e => setTarget(e.target.value)} placeholder="e.g. 5 clinics in Ikeja, health-tech angle" className="w-full rounded-[8px] border border-gray-200 px-3 py-2 font-body text-[12px] placeholder:text-gray-400 focus:outline-none" />
            </div>
          )}
          {actionKey === "draft_email_sequence" && (
            <select value={emailGoal} onChange={e => setEmailGoal(e.target.value)} className="w-full rounded-[8px] border border-gray-200 px-3 py-2 font-body text-[12px] focus:outline-none">
              {EMAIL_GOALS.map(g => <option key={g.v} value={g.v}>{g.l}</option>)}
            </select>
          )}
          {actionKey === "qualify_lead" && (
            <textarea value={leadText} onChange={e => setLeadText(e.target.value)} rows={4} placeholder="Paste a LinkedIn message, email reply, or describe the lead…" className="w-full resize-none rounded-[8px] border border-gray-200 px-3 py-2 font-body text-[12px] placeholder:text-gray-400 focus:outline-none" />
          )}
          {actionKey === "create_sales_script" && (
            <select value={callType} onChange={e => setCallType(e.target.value)} className="w-full rounded-[8px] border border-gray-200 px-3 py-2 font-body text-[12px] focus:outline-none">
              {CALL_TYPES.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
            </select>
          )}
          {error && <div className="rounded-[8px] bg-red-50 px-3 py-2 font-body text-[11px] text-red-600">{error}</div>}
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-[18px] py-3">
          <button type="button" onClick={onClose} className="rounded-full border border-gray-200 px-4 py-1.5 font-body text-[12px] font-medium text-[#111] hover:bg-gray-50">Cancel</button>
          <button type="button" onClick={handle} disabled={busy} className="rounded-full bg-[#534AB7] px-4 py-1.5 font-body text-[12px] font-medium text-white hover:opacity-90 disabled:opacity-60">
            {busy ? "AI Sales is working…" : "Draft batch →"}
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
  const label = actionLabel(item.actionKey);

  const body = () => {
    if (item.actionKey === "analyze_icp") return (
      <div className="space-y-2 font-body text-[12px] text-[#374151] leading-relaxed">
        <p><b>ICP:</b> {r.icp?.who}</p>
        <p><b>Pain points:</b> {(r.icp?.painPoints || []).join(", ")}</p>
        {r.messagingAngles?.length > 0 && <p><b>Messaging angles:</b> {r.messagingAngles.map(a => a.angle).join("; ")}</p>}
        {r.channels?.length > 0 && <p><b>Best channels:</b> {r.channels.map(c => c.channel).join(", ")}</p>}
        {r.positioning && <p><b>Positioning:</b> {r.positioning}</p>}
      </div>
    );
    if (item.actionKey === "draft_outreach") return (
      <div className="space-y-2 font-body text-[12px] text-[#374151] leading-relaxed">
        {r.subject && <p><b>Subject:</b> {r.subject}</p>}
        <p className="whitespace-pre-wrap">{r.message}</p>
        {r.cta && <p><b>CTA:</b> {r.cta}</p>}
        {r.followUp1 && <p><b>Follow-up (day 3):</b> {r.followUp1}</p>}
      </div>
    );
    if (item.actionKey === "draft_email_sequence") return (
      <div className="space-y-3 font-body text-[12px] text-[#374151] leading-relaxed">
        <p><b>{r.sequenceName}</b></p>
        {(r.emails || []).map((e, i) => (
          <div key={i} className="border-b border-gray-100 pb-2">
            <b>Email {e.emailNumber} (Day {e.dayOffset}):</b> {e.subject}<br/>
            <span className="text-gray-500 text-[11px]">{(e.body || "").slice(0, 150)}{(e.body || "").length > 150 ? "…" : ""}</span>
          </div>
        ))}
      </div>
    );
    if (item.actionKey === "qualify_lead") return (
      <div className="space-y-2 font-body text-[12px] text-[#374151] leading-relaxed">
        <p><b>Score:</b> {r.score}/100 · {(r.tier || "").toUpperCase()}</p>
        <p><b>Reasoning:</b> {r.reasoning}</p>
        {r.nextAction && <p><b>Next action:</b> {r.nextAction}</p>}
        {r.draftReply && <p className="whitespace-pre-wrap"><b>Draft reply:</b><br/>{r.draftReply}</p>}
      </div>
    );
    if (item.actionKey === "create_sales_script") return (
      <div className="space-y-2 font-body text-[12px] text-[#374151] leading-relaxed">
        <p><b>{r.callLabel} · {r.estimatedDuration}</b></p>
        <p className="whitespace-pre-wrap">{r.intro}</p>
        {r.discoveryQuestions?.length > 0 && <p><b>Key questions:</b> {r.discoveryQuestions.map(q => q.question).join(" / ")}</p>}
        {r.closingAsk && <p><b>Closing ask:</b> {r.closingAsk}</p>}
      </div>
    );
    return <p className="font-body text-[12px] text-[#374151]">{previewText(item)}</p>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.45)] p-5" onClick={onClose}>
      <div className="max-h-[82vh] w-full max-w-[440px] overflow-auto rounded-[16px] bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-2.5 border-b border-gray-200 px-[18px] py-4">
          <div>
            <div className="font-body text-[14px] font-medium text-[#111]">{label}</div>
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

/* ─── SendOutreachModal — channel-aware ──────────────────────────────────── */
const CHANNEL_INFO = {
  email:     { label: "Email",     icon: "✉",  color: "#EA4335", via: "via Gmail" },
  whatsapp:  { label: "WhatsApp",  icon: "💬", color: "#25D366", via: "via Meta Cloud API" },
  linkedin:  { label: "LinkedIn",  icon: "in", color: "#0A66C2", via: "copy & open LinkedIn" },
  instagram: { label: "Instagram", icon: "IG", color: "#E1306C", via: "copy & open Instagram" },
  facebook:  { label: "Facebook",  icon: "f",  color: "#1877F2", via: "copy & open Facebook" },
};

function SendOutreachModal({ item, founderId, onClose, onSent }) {
  const r = item.result || {};
  const channel = r.channel || item.payload?.channel || "email";
  const isSequence = item.actionKey === "draft_email_sequence";
  const info = CHANNEL_INFO[channel] || CHANNEL_INFO.email;

  const messageText = r.message || "";
  const [form, setForm] = useState({
    recipient: "",
    recipientName: "",
    subject: r.subject || "",
    message: messageText,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Copy-to-clipboard channels
  const isCopyChannel = ["linkedin", "instagram", "facebook"].includes(channel);

  function copyAndOpen(profileUrl) {
    navigator.clipboard.writeText(form.message).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
    if (profileUrl) window.open(profileUrl, "_blank", "noopener");
    else onSent(`Content copied — paste it in ${info.label}`);
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!form.recipient) return;
    setBusy(true);
    setError("");
    try {
      if (channel === "email" || isSequence) {
        if (isSequence) {
          const steps = (r.emails || []).map((em) => ({
            subject: em.subject,
            htmlBody: `<p>${(em.body || "").replace(/\n/g, "<br/>")}</p>`,
          }));
          await sendOutreachSequence(founderId, { recipientEmail: form.recipient, recipientName: form.recipientName, steps, agentEventId: item._id });
          onSent(`Sequence sent to ${form.recipient} (${steps.length} emails)`);
        } else {
          await sendOutreachEmail(founderId, { recipientEmail: form.recipient, recipientName: form.recipientName, subject: form.subject, htmlBody: `<p>${form.message.replace(/\n/g, "<br/>")}</p>`, agentEventId: item._id });
          onSent(`Email sent to ${form.recipient}`);
        }
      } else if (channel === "whatsapp") {
        await sendWhatsAppOutreach(founderId, { recipientPhone: form.recipient, message: form.message });
        onSent(`WhatsApp message sent to ${form.recipient}`);
      }
    } catch (err) {
      setError(err?.message || `Failed to send. Make sure ${info.label} is connected in Integrations.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.45)] p-5" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-[440px] overflow-auto rounded-[16px] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between gap-2.5 border-b border-gray-200 px-[18px] py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] font-body text-[12px] font-semibold text-white" style={{ background: info.color }}>{info.icon}</div>
            <div>
              <div className="font-body text-[14px] font-medium text-[#111]">Send via {info.label}</div>
              <div className="font-body text-[10px] text-[#9ca3af]">{info.via}</div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[8px] bg-gray-100 text-gray-500 hover:bg-gray-200">
            <svg width="12" height="12" viewBox="0 0 12 12"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Copy-channel mode */}
        {isCopyChannel ? (
          <div className="px-[18px] py-4 space-y-3">
            <p className="font-body text-[11px] leading-relaxed text-[#6b7280]">
              {info.label} doesn't allow automated DMs for cold outreach. Copy the message below, then paste it directly in {info.label}.
            </p>
            <div>
              <label className="mb-1 block font-body text-[11px] font-medium text-[#111]">Message (editable)</label>
              <textarea rows={7} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 bg-[#f9fafb] px-2.5 py-1.5 font-body text-[11px] text-[#374151] focus:outline-none resize-none" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={onClose} className="rounded-full border border-gray-200 px-4 py-1.5 font-body text-[12px] font-medium text-[#111] hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={() => copyAndOpen(null)}
                style={{ background: info.color }}
                className="rounded-full px-4 py-1.5 font-body text-[12px] font-medium text-white hover:opacity-90">
                {copied ? "Copied ✓" : "Copy message"}
              </button>
              <button type="button" onClick={() => { window.open(`https://${channel}.com`, "_blank", "noopener"); }}
                className="rounded-full border px-4 py-1.5 font-body text-[12px] font-medium hover:opacity-90" style={{ borderColor: info.color, color: info.color }}>
                Open {info.label} →
              </button>
            </div>
          </div>
        ) : (
          /* API-send mode (email / whatsapp) */
          <form onSubmit={handleSend} className="px-[18px] py-4 space-y-3">
            <div>
              <label className="mb-1 block font-body text-[11px] font-medium text-[#111]">
                {channel === "whatsapp" ? "Recipient phone number *" : "Recipient email *"}
              </label>
              <input required type={channel === "whatsapp" ? "tel" : "email"}
                value={form.recipient}
                onChange={(e) => setForm((f) => ({ ...f, recipient: e.target.value }))}
                placeholder={channel === "whatsapp" ? "+234 801 234 5678" : "lead@company.com"}
                className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 font-body text-[12px] text-[#111] focus:outline-none focus:ring-1 focus:ring-[#534AB7]" />
              {channel === "whatsapp" && <p className="mt-0.5 font-body text-[10px] text-[#9ca3af]">Include country code, e.g. +234... — no spaces needed</p>}
            </div>
            <div>
              <label className="mb-1 block font-body text-[11px] font-medium text-[#111]">Recipient name (optional)</label>
              <input type="text" value={form.recipientName} onChange={(e) => setForm((f) => ({ ...f, recipientName: e.target.value }))}
                placeholder="e.g. Dr. Amara Okafor"
                className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 font-body text-[12px] text-[#111] focus:outline-none focus:ring-1 focus:ring-[#534AB7]" />
            </div>
            {channel === "email" && !isSequence && (
              <div>
                <label className="mb-1 block font-body text-[11px] font-medium text-[#111]">Subject</label>
                <input type="text" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 font-body text-[12px] text-[#111] focus:outline-none focus:ring-1 focus:ring-[#534AB7]" />
              </div>
            )}
            <div>
              <label className="mb-1 block font-body text-[11px] font-medium text-[#111]">Message (editable)</label>
              {isSequence ? (
                <div className="rounded-lg bg-[#f9fafb] p-3 font-body text-[11px] text-[#6b7280]">
                  {(r.emails || []).map((e, i) => <div key={i}>Email {i + 1} (Day {e.dayOffset}): {e.subject}</div>)}
                </div>
              ) : (
                <textarea rows={6} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 font-body text-[12px] text-[#111] focus:outline-none focus:ring-1 focus:ring-[#534AB7] resize-none" />
              )}
            </div>
            {error && <div className="rounded-lg bg-red-50 px-3 py-2 font-body text-[11px] text-red-700">{error}</div>}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={onClose} className="rounded-full border border-gray-200 px-4 py-1.5 font-body text-[12px] font-medium text-[#111] hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={busy || !form.recipient}
                style={{ background: info.color }}
                className="rounded-full px-4 py-1.5 font-body text-[12px] font-medium text-white hover:opacity-90 disabled:opacity-60">
                {busy ? "Sending…" : isSequence ? `Send sequence` : `Send`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ─── main ────────────────────────────────────────────────────────────────── */
export default function V2AISalesWorkspace({ onBack }) {
  const founderId = useOfficeStore((s) => s.founderId);
  const [outputs, setOutputs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [sendToast, setSendToast] = useState("");

  const load = useCallback(async () => {
    if (!founderId) return;
    try { const d = await getSalesOutputs(founderId); setOutputs(d || []); }
    catch { setOutputs([]); }
    finally { setLoading(false); }
  }, [founderId]);

  useEffect(() => { load(); }, [load]);

  const byStage = useMemo(() => {
    const m = { contacted: [], replied: [], call: [], signed: [] };
    for (const item of outputs) {
      const s = pipelineStage(item);
      if (s) m[s].push(item);
    }
    return m;
  }, [outputs]);

  const outreachQueue = useMemo(() => outputs.filter(o => o.actionKey === "draft_outreach" || o.actionKey === "draft_email_sequence"), [outputs]);
  const activityItems = useMemo(() => outputs.slice(0, 6), [outputs]);

  if (loading) return (
    <div className="flex flex-1 items-center justify-center bg-[#f9fafb]">
      <div className="font-body text-[13px] text-[#9ca3af]">Loading AI Sales…</div>
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
            <span className="font-body text-[14px] font-medium text-[#111]">AI Sales</span>
            {outreachQueue.length > 0 && (
              <>
                <span className="font-body text-[12px] text-[#d1d5db]">·</span>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FCEBEB] px-2.5 py-1 font-body text-[11px] text-[#791F1F]">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#791F1F]"/>
                  {outreachQueue.length} draft{outreachQueue.length === 1 ? "" : "s"} awaiting send approval
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="rounded-full border border-[#d1d5db] bg-white px-3.5 py-1.5 font-body text-[12px] font-medium text-[#111] hover:bg-[#f9fafb]">Approval queue</button>
            <button type="button" onClick={() => setShowGenerate(true)} className="rounded-full bg-[#534AB7] px-3.5 py-1.5 font-body text-[12px] font-medium text-white hover:opacity-90">+ New outreach batch</button>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-5">

          {/* 4 stat cards */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { lbl: "Active pipeline", val: Object.values(byStage).flat().length, sub: "Leads in progress" },
              { lbl: "Signed & paying", val: byStage.signed.length, sub: byStage.signed.length > 0 ? "High-score leads" : "—" },
              { lbl: "Outreach drafted", val: outreachQueue.length, sub: "Ready for review" },
              { lbl: "Leads qualified", val: outputs.filter(o => o.actionKey === "qualify_lead").length, sub: "Scored by AI Sales" },
            ].map((c) => (
              <div key={c.lbl} className="rounded-[14px] border border-[#e5e7eb] bg-white px-4 py-3.5">
                <div className="font-body text-[10px] uppercase tracking-[0.4px] text-[#9ca3af]">{c.lbl}</div>
                <div className="mt-1.5 font-body text-[19px] font-medium text-[#111]">{c.val}</div>
                <div className="mt-0.5 font-body text-[10px] text-[#6b7280]">{c.sub}</div>
              </div>
            ))}
          </div>

          {/* Pipeline board — 4 kanban columns */}
          <div className="rounded-[14px] border border-[#e5e7eb] bg-white px-[18px] py-4">
            <div className="mb-3">
              <div className="font-body text-[13px] font-medium text-[#111]">Pipeline</div>
              <div className="font-body text-[11px] text-[#9ca3af] mt-0.5">Every lead AI Sales is working, by stage</div>
            </div>
            <div className="grid grid-cols-4 gap-2.5">
              {["contacted", "replied", "call", "signed"].map((stage) => {
                const items = byStage[stage] || [];
                const { bg, color } = stageColor(stage);
                return (
                  <div key={stage} className="min-h-[120px] rounded-[12px] bg-[#f9fafb] p-2.5 flex flex-col gap-2">
                    <div className="flex items-center justify-between pb-1">
                      <div className="font-body text-[10px] font-semibold uppercase tracking-[0.4px] text-[#6b7280]">{stageLabel(stage)}</div>
                      <div className="rounded-[10px] bg-white px-1.5 py-0.5 font-body text-[10px] font-semibold text-[#9ca3af]">{items.length}</div>
                    </div>
                    {items.length === 0 && (
                      <div className="flex flex-1 items-center justify-center py-4 font-body text-[10px] text-[#d1d5db]">Empty</div>
                    )}
                    {items.slice(0, 3).map((item, i) => (
                      <div key={i} className="cursor-pointer rounded-[10px] border border-[#e5e7eb] bg-white p-2.5 hover:shadow-sm" onClick={() => setActiveModal(item)}>
                        <div className="font-body text-[11px] font-medium text-[#111] truncate">{actionLabel(item.actionKey)}</div>
                        <div className="font-body text-[9px] text-[#9ca3af] mt-0.5 truncate">{previewText(item).slice(0, 50)}</div>
                        <span className="mt-1.5 inline-block rounded-[5px] px-1.5 py-0.5 font-body text-[8px] font-medium" style={{ background: bg, color }}>{stageLabel(stage)}</span>
                      </div>
                    ))}
                    {items.length > 3 && (
                      <div className="rounded-[10px] border border-[#e5e7eb] bg-white p-2 text-center font-body text-[10px] text-[#9ca3af] cursor-pointer">+ {items.length - 3} more</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Outreach queue */}
          <div className="rounded-[14px] border border-[#e5e7eb] bg-white px-[18px] py-4">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <div className="font-body text-[13px] font-medium text-[#111]">Outreach queue</div>
                <div className="font-body text-[11px] text-[#9ca3af] mt-0.5">
                  {outreachQueue.length > 0 ? `${outreachQueue.length} message${outreachQueue.length === 1 ? "" : "s"}, personalised and ready — sending needs your approval` : "No outreach drafts yet"}
                </div>
              </div>
              {outreachQueue.length > 0 && <button type="button" className="border-none bg-transparent cursor-pointer font-body text-[11px] text-[#185FA5]">Review &amp; send →</button>}
            </div>
            {outreachQueue.length === 0 ? (
              <div className="py-6 text-center font-body text-[12px] text-[#9ca3af]">Click "+ New outreach batch" to have AI Sales draft personalised messages.</div>
            ) : (
              outreachQueue.slice(0, 5).map((item, i) => (
                <div key={i} className="flex items-center gap-3 border-b border-[#f3f4f6] py-2.5 last:border-b-0 hover:bg-[#fafafa]">
                  <div className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-[8px] bg-[#E6F1FB] text-[10px]" onClick={() => setActiveModal(item)}>
                    {item.actionKey === "draft_email_sequence" ? "💬" : "📣"}
                  </div>
                  <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setActiveModal(item)}>
                    <div className="font-body text-[11px] font-medium text-[#111] truncate">{actionLabel(item.actionKey)}</div>
                    <div className="font-body text-[10px] text-[#9ca3af] truncate">{previewText(item).slice(0, 80)}</div>
                  </div>
                  <div className="shrink-0 rounded-[6px] bg-[#FCEBEB] px-2 py-0.5 font-body text-[9px] font-medium text-[#791F1F]">Draft</div>
                  <button
                    type="button"
                    onClick={() => setActiveModal({ ...item, _sendMode: true })}
                    title="Send this draft"
                    className="shrink-0 rounded-[7px] border border-[#e5e7eb] bg-white px-2 py-1 font-body text-[9px] font-medium text-[#185FA5] hover:bg-[#E6F1FB]"
                  >
                    {{ email: "✉", whatsapp: "💬", linkedin: "in", instagram: "IG", facebook: "f" }[item.result?.channel || "email"] || "✉"} Send
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Recent activity */}
          <div className="rounded-[14px] border border-[#e5e7eb] bg-white px-[18px] py-4">
            <div className="mb-3 font-body text-[13px] font-medium text-[#111]">Recent activity</div>
            {activityItems.length === 0 ? (
              <div className="py-4 text-center font-body text-[12px] text-[#9ca3af]">No activity yet.</div>
            ) : (
              activityItems.map((item, i) => (
                <div key={i} className="flex cursor-pointer items-center gap-2.5 border-b border-[#f3f4f6] py-2.5 last:border-b-0" onClick={() => setActiveModal(item)}>
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] bg-[#E6F1FB] text-[11px]">
                    {{ analyze_icp: "🎯", draft_outreach: "📣", draft_email_sequence: "💬", qualify_lead: "🔍", create_sales_script: "📞" }[item.actionKey] || "📄"}
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

        <div className="rounded-[12px] bg-[#f9fafb] p-3">
          <div className="mb-2 font-body text-[12px] font-medium text-[#111]">AI Sales</div>
          <div className="mb-2.5 flex items-center gap-2.5">
            <div className="relative shrink-0">
              <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-[#E6F1FB] font-body text-[10px] font-semibold text-[#0C447C]">SA</div>
              <div className="absolute -bottom-0.5 -right-0.5 flex h-[13px] w-[13px] items-center justify-center rounded-full border-[1.5px] border-white bg-[#534AB7] text-[7px] text-white">⚡</div>
            </div>
            <div>
              <div className="font-body text-[12px] font-medium text-[#111]">Outreach &amp; pipeline</div>
              <div className="font-body text-[10px] text-[#9ca3af]">{outputs.length > 0 ? `Last active ${formatEventTime(outputs[0]?.createdAt)}` : "Ready to work"}</div>
            </div>
          </div>
          <div className="font-body text-[10px] leading-relaxed text-[#6b7280]">Drafts, personalises, and tracks pipeline freely. Sending anything externally always waits for your approval — locked in Autonomy Settings, not adjustable.</div>
        </div>

        <div className="rounded-[12px] bg-[#f9fafb] p-3">
          <div className="mb-2 font-body text-[12px] font-medium text-[#111]">This session</div>
          {[
            { k: "Outputs generated", v: outputs.length },
            { k: "Outreach drafts", v: outreachQueue.length },
            { k: "Leads qualified", v: outputs.filter(o => o.actionKey === "qualify_lead").length },
            { k: "Scripts created", v: outputs.filter(o => o.actionKey === "create_sales_script").length },
            { k: "ICPs analyzed", v: outputs.filter(o => o.actionKey === "analyze_icp").length },
          ].map(r => (
            <div key={r.k} className="flex items-center justify-between border-b border-[#f3f4f6] py-[5px] font-body text-[11px] last:border-b-0">
              <span className="text-[#9ca3af]">{r.k}</span>
              <span className="font-medium text-[#111]">{r.v}</span>
            </div>
          ))}
        </div>

        <div className="rounded-[12px] bg-[#f9fafb] p-3">
          <div className="mb-2 font-body text-[12px] font-medium text-[#111]">Connected</div>
          {[
            { name: "WhatsApp Business", bg: "#25D366", connected: false },
            { name: "Google Calendar", bg: "#f3f4f6", connected: false },
            { name: "Gmail", bg: "#f3f4f6", connected: false },
          ].map((c, i) => (
            <div key={i} className="flex items-center gap-2 border-b border-[#f3f4f6] py-[7px] last:border-b-0">
              <div className="h-6 w-6 shrink-0 rounded-[7px]" style={{ background: c.bg }}/>
              <div className="flex-1 font-body text-[11px] text-[#111]">{c.name}</div>
              <div className="font-body text-[9px] text-[#9ca3af]">Not connected</div>
            </div>
          ))}
          <div className="mt-1 text-right"><span className="cursor-pointer font-body text-[10px] text-[#185FA5]">Manage integrations →</span></div>
        </div>

      </div>

      {showGenerate && <GenerateModal founderId={founderId} onClose={() => setShowGenerate(false)} onDone={() => { setShowGenerate(false); load(); }} />}
      {activeModal && !activeModal._sendMode && <DetailModal item={activeModal} onClose={() => setActiveModal(null)} />}
      {activeModal?._sendMode && (
        <SendOutreachModal
          item={activeModal}
          founderId={founderId}
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
