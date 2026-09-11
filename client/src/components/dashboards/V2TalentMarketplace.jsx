/**
 * V2TalentMarketplace
 * ─────────────────────────────────────────────────────────────────────────────
 * V2 redesign of the Talent Marketplace, built from
 * StartupVerse_Talent_browser_Updated.html (supersedes an earlier draft built
 * from StartupVerse_Talent.html — that version's "browse talent profiles"
 * framing is dropped in favor of this one's role-browsing loop, because this
 * shape maps to real, already-working backend that the earlier one didn't).
 *
 * Real backend reused (all previously wired but, for most of these, never
 * called from any client screen until now):
 *   - GET  /talent/:talentId/matches      → StartupPost[] + a real, honest,
 *     rule-based match score per post (utils/talentMatching.js). NOT machine
 *     learning — this UI never uses the word "AI" for it, only "Matched".
 *   - POST /talent/:talentId/applications → real TalentApplication doc
 *   - GET  /talent/:talentId/applications → real application list
 *   - POST/DELETE /talent/:talentId/saved → real SavedItem bookmark toggle
 *   - POST /founders/:founderId/posts     → real StartupPost creation
 *
 * Deliberately NOT built as literally shown in the mockup:
 *   - "Post a role" step 3 (screening questions, visibility radio) has no
 *     backing field on StartupPost anywhere — dropped; posting is 2 steps.
 *   - The Apply tab's availability/hours-per-week selects have no backing
 *     field on TalentApplication (only coverNote/coverLetter) — dropped;
 *     applying is one cover-note field.
 *   - "Co-founder" is not a real STARTUP_POST_COMMITMENTS value — the
 *     Co-founder filter matches real tags/lookingFor text instead of a
 *     dedicated enum.
 */

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "../ui/utils";
import { toast } from "sonner";

import V2AppLayout from "../layout/V2AppLayout";
import { V2Card, V2Chip, V2Btn } from "../shared/v2-primitives";

import { useOfficeStore } from "../../state/useOfficeStore";
import * as founderApi from "../../utils/api/founderApi";
import * as talentApi from "../../utils/api/talentApi";
import { getTalentBrowseProfileCompletionPercent } from "../../utils/talentProfileCompletion";

import {
  Search,
  Bookmark,
  ClipboardList,
  Grid3x3,
  List,
  X,
  Plus,
} from "lucide-react";

const FIELD_INPUT_CLASS =
  "h-9 w-full rounded-lg border border-v2-border px-3 font-body text-[12px] text-v2-heading outline-none focus:border-v2-blue";

const COMMITMENTS = ["Full-time", "Part-time", "Contract", "Flexible"];
const CATEGORIES = ["All roles", "Matched", "Engineering", "Product", "Design", "Operations", "Marketing", "Co-founder"];

function initialsOf(name) {
  return (name || "?").split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

function timeAgo(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const days = Math.round((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  return `${Math.round(days / 7)}w ago`;
}

function matchColor(score) {
  if (score >= 90) return "text-v2-green";
  if (score >= 70) return "text-v2-blue";
  if (score >= 50) return "text-v2-amber-dark";
  return "text-v2-muted";
}

function roleMatchesCategory(post, category) {
  if (category === "All roles") return true;
  if (category === "Matched") return (post.matchScore || 0) >= 70;
  const haystack = [post.title, post.industry, post.commitment, ...(post.lookingFor || []), ...(post.tags || [])]
    .join(" ")
    .toLowerCase();
  return haystack.includes(category.toLowerCase());
}

function compensationSummary(offer) {
  if (!offer) return "Compensation not specified";
  const parts = [];
  if (offer.salaryMin || offer.salaryMax) {
    const cur = offer.currency || "";
    parts.push(`${cur} ${offer.salaryMin || "?"}${offer.salaryMax ? `–${offer.salaryMax}` : ""}/mo`.trim());
  }
  if (offer.equityMin || offer.equityMax) {
    parts.push(`${offer.equityMin || "0"}${offer.equityMax ? `–${offer.equityMax}` : ""}% equity`);
  }
  if (!parts.length) return offer.compensationPhilosophy ? `Compensation: ${offer.compensationPhilosophy}` : "Compensation not specified";
  return parts.join(" · ");
}

// ─────────────────────────────────────────────────────────────────────────
// STATS ROW
// ─────────────────────────────────────────────────────────────────────────

function StatsRow({ openRoleCount, matchedCount, applicationCount, savedCount, onStatClick }) {
  const stats = [
    { key: "all", label: "Open roles · all startups", value: openRoleCount, color: "text-v2-blue" },
    { key: "matched", label: "Matched for you · 70%+", value: matchedCount, color: "text-v2-green" },
    { key: "applications", label: "Active applications", value: applicationCount, color: "text-v2-amber-dark" },
    { key: "saved", label: "Saved roles", value: savedCount, color: "text-v2-heading" },
  ];
  return (
    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
      {stats.map((s) => (
        <button
          key={s.key}
          type="button"
          onClick={() => onStatClick(s.key)}
          className="rounded-[10px] border border-transparent bg-v2-page p-3 text-left transition-colors hover:border-v2-border"
        >
          <div className={cn("font-heading text-[22px] font-medium leading-none", s.color)}>{s.value}</div>
          <div className="mt-1 font-body text-[11px] text-v2-subtle">{s.label}</div>
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ROLE CARD (grid + list)
// ─────────────────────────────────────────────────────────────────────────

function RoleCard({ post, saved, applied, view, onOpen, onApply, onToggleSave }) {
  const skills = [...(post.lookingFor || []), ...(post.tags || [])].slice(0, view === "list" ? 3 : 4);
  const meta = [
    post.offer?.salaryMin ? `${post.offer.currency || ""} ${post.offer.salaryMin}/mo` : null,
    post.offer?.equityMin ? `${post.offer.equityMin}% equity` : null,
    timeAgo(post.createdAt),
    post.commitment,
  ].filter(Boolean);

  if (view === "list") {
    return (
      <div
        onClick={onOpen}
        className={cn(
          "flex cursor-pointer items-center gap-3 rounded-[12px] border bg-v2-surface p-3 transition-colors hover:border-v2-blue/30",
          post.matchScore >= 90 ? "border-v2-blue" : "border-v2-border",
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[9px] bg-v2-purple-tint font-body text-[13px] font-medium text-v2-purple-dark">
          {initialsOf(post.founderName || post.title)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-body text-[13px] font-medium text-v2-heading">{post.title}</p>
          <p className="truncate font-body text-[11px] text-v2-subtle">
            {[post.founderName, post.stage, post.location, post.commitment].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className={cn("font-body text-[13px] font-medium", matchColor(post.matchScore || 0))}>{post.matchScore || 0}%</div>
          <div className="font-body text-[10px] text-v2-subtle">match</div>
        </div>
      </div>
    );
  }

  return (
    <V2Card className={cn("flex flex-col gap-2.5", post.matchScore >= 90 && "border-v2-blue")}>
      {post.matchScore >= 90 ? (
        <span className="inline-flex w-fit items-center rounded-md bg-v2-blue-tint px-2 py-0.5 font-body text-[9px] font-medium text-v2-blue-dark">
          Top match
        </span>
      ) : null}
      <div className="flex items-start gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-v2-purple-tint font-body text-[13px] font-medium text-v2-purple-dark">
          {initialsOf(post.founderName || post.title)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-body text-[13px] font-medium text-v2-heading">{post.title}</p>
          <p className="truncate font-body text-[11px] text-v2-subtle">
            {[post.founderName, post.stage, post.location].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className={cn("font-body text-[13px] font-medium", matchColor(post.matchScore || 0))}>{post.matchScore || 0}%</div>
          <div className="font-body text-[9px] text-v2-subtle">match</div>
        </div>
      </div>
      {skills.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {skills.map((s) => (
            <span key={s} className="rounded-md bg-v2-page px-1.5 py-0.5 font-body text-[10px] text-v2-muted">{s}</span>
          ))}
        </div>
      ) : null}
      {post.description ? (
        <p className="line-clamp-2 font-body text-[11px] leading-relaxed text-v2-muted">{post.description}</p>
      ) : null}
      {meta.length > 0 ? (
        <div className="flex flex-wrap gap-x-3 gap-y-1 font-body text-[10px] text-v2-subtle">
          {meta.map((m) => <span key={m}>{m}</span>)}
        </div>
      ) : null}
      <div className="flex gap-1.5 border-t border-v2-border pt-2.5">
        <V2Btn variant="primary" size="sm" className="flex-1 justify-center" onClick={(e) => { e.stopPropagation(); onApply(); }} disabled={applied}>
          {applied ? "Applied ✓" : "Apply now"}
        </V2Btn>
        <V2Btn
          variant={saved ? "secondary" : "ghost"}
          size="sm"
          className={cn(saved && "bg-v2-green-tint text-v2-green-dark")}
          onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
        >
          <Bookmark className="h-3.5 w-3.5" />
        </V2Btn>
        <V2Btn variant="secondary" size="sm" onClick={onOpen}>Details</V2Btn>
      </div>
    </V2Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ROLE DETAIL SLIDE-OUT
// ─────────────────────────────────────────────────────────────────────────

function RoleDetailPanel({ post, saved, applied, onClose, onToggleSave, onSubmitApply, applying }) {
  const [tab, setTab] = useState("overview");
  const [coverNote, setCoverNote] = useState("");

  useEffect(() => {
    setTab("overview");
    setCoverNote("");
  }, [post?._id, post?.id]);

  if (!post) return null;
  const skills = [...(post.lookingFor || []), ...(post.tags || [])];

  return (
    <>
      <div className="fixed inset-0 z-[90] bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 z-[95] flex h-full w-full flex-col bg-white md:w-[480px]">
        <div className="flex shrink-0 items-center justify-between border-b border-v2-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-v2-purple-tint font-body text-[13px] font-medium text-v2-purple-dark">
              {initialsOf(post.founderName || post.title)}
            </div>
            <div>
              <p className="font-body text-[14px] font-medium text-v2-heading">{post.title}</p>
              <p className="font-body text-[11px] text-v2-subtle">{[post.founderName, post.stage, post.location].filter(Boolean).join(" · ")}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <V2Btn variant={saved ? "secondary" : "ghost"} size="sm" onClick={onToggleSave} className={cn(saved && "bg-v2-green-tint text-v2-green-dark")}>
              <Bookmark className="h-3.5 w-3.5" /> {saved ? "Saved" : "Save"}
            </V2Btn>
            <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-v2-muted hover:bg-v2-page">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="mb-4 flex gap-0.5 rounded-lg bg-gray-100 p-[3px]">
            {["overview", "startup", "apply"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "flex-1 rounded-md py-1.5 font-body text-[12px] font-medium capitalize",
                  tab === t ? "border border-v2-border bg-white text-v2-heading" : "text-v2-muted",
                )}
              >
                {t === "startup" ? "About startup" : t}
              </button>
            ))}
          </div>

          {tab === "overview" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 rounded-[10px] bg-v2-page p-3">
                <div className={cn("flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-[3px]", post.matchScore >= 70 ? "border-v2-green" : "border-v2-border")}>
                  <div className="text-center">
                    <div className={cn("font-heading text-[18px] font-medium", matchColor(post.matchScore || 0))}>{post.matchScore || 0}%</div>
                    <div className="font-body text-[9px] text-v2-subtle">match</div>
                  </div>
                </div>
                <div className="flex flex-col gap-1 font-body text-[11px] text-v2-muted">
                  <div><span className="font-medium text-v2-heading">Type:</span> {post.commitment || "Not specified"}</div>
                  <div><span className="font-medium text-v2-heading">Stage:</span> {post.stage || "Not specified"}</div>
                  <div><span className="font-medium text-v2-heading">Location:</span> {post.location || "Not specified"}</div>
                  <div><span className="font-medium text-v2-heading">Posted:</span> {timeAgo(post.createdAt)}</div>
                </div>
              </div>
              <div>
                <p className="mb-2 font-body text-[11px] font-medium uppercase tracking-wide text-v2-subtle">Role description</p>
                <p className="font-body text-[12px] leading-relaxed text-v2-muted">{post.description || "No description provided."}</p>
              </div>
              {skills.length > 0 && (
                <div>
                  <p className="mb-2 font-body text-[11px] font-medium uppercase tracking-wide text-v2-subtle">Skills & roles needed</p>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((s) => (
                      <span key={s} className="rounded-md bg-v2-blue-tint px-2 py-0.5 font-body text-[10px] text-v2-blue-dark">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="mb-2 font-body text-[11px] font-medium uppercase tracking-wide text-v2-subtle">Compensation</p>
                <div className="rounded-[10px] bg-v2-page p-3 font-body text-[12px] text-v2-muted">{compensationSummary(post.offer)}</div>
              </div>
            </div>
          )}

          {tab === "startup" && (
            <div className="flex flex-col gap-3">
              <div className="rounded-[10px] bg-v2-page p-3.5">
                <div className="mb-2 flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-v2-purple-tint font-body text-[13px] font-medium text-v2-purple-dark">
                    {initialsOf(post.founderName || post.title)}
                  </div>
                  <div>
                    <p className="font-body text-[13px] font-medium text-v2-heading">{post.founderName || "Founder"}</p>
                    <p className="font-body text-[11px] text-v2-subtle">{post.stage || "Startup"} · Active on StartupVerse</p>
                  </div>
                </div>
                <p className="font-body text-[12px] leading-relaxed text-v2-muted">{post.description || "No further details shared."}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["Stage", post.stage || "—"],
                  ["Location", post.location || "—"],
                  ["Team size", post.teamSize ? String(post.teamSize) : "—"],
                  ["Industry", post.industry || "—"],
                ].map(([l, v]) => (
                  <div key={l} className="rounded-[8px] bg-v2-page p-2.5">
                    <p className="font-body text-[10px] text-v2-subtle">{l}</p>
                    <p className="font-body text-[13px] font-medium text-v2-heading">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "apply" && (
            <div className="flex flex-col gap-3">
              <div className="rounded-[10px] bg-v2-blue-tint p-3 font-body text-[12px] leading-relaxed text-v2-blue-dark">
                Your application goes directly to {post.founderName || "the founder"} via StartupVerse.
              </div>
              <div>
                <label className="mb-1 block font-body text-[12px] font-medium text-v2-muted">
                  Why do you want to join, and any relevant experience or links
                </label>
                <textarea
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  placeholder="Tell them what excites you about this startup and problem, and share relevant experience or a portfolio link..."
                  className="h-32 w-full rounded-[10px] border border-v2-border p-3 font-body text-[12px] text-v2-heading outline-none focus:border-v2-blue"
                />
              </div>
              <V2Btn
                variant="primary"
                className="justify-center"
                disabled={applied || applying || !coverNote.trim()}
                onClick={() => onSubmitApply(coverNote)}
              >
                {applied ? "Applied ✓" : applying ? "Submitting…" : "Submit application"}
              </V2Btn>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// POST-A-ROLE MODAL (2 real steps — no screening questions/visibility, no backend field for those)
// ─────────────────────────────────────────────────────────────────────────

const EMPTY_ROLE_FORM = {
  title: "",
  commitment: COMMITMENTS[0],
  location: "",
  description: "",
  compensationPhilosophy: "balanced",
  equityMin: "",
  equityMax: "",
  addSalary: false,
  salaryMin: "",
  salaryMax: "",
  currency: "NGN",
  compensationCountry: "NG",
};

function PostRoleModal({ open, onClose, onSubmit, submitting }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY_ROLE_FORM);
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState([]);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setForm(EMPTY_ROLE_FORM);
      setSkills([]);
      setSkillInput("");
    }
  }, [open]);

  if (!open) return null;

  const addSkill = (e) => {
    if (e.key === "Enter" && skillInput.trim()) {
      e.preventDefault();
      setSkills((prev) => [...prev, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const canContinue = step === 1 ? form.title.trim() && form.description.trim() : true;
  // The real backend (StartupPost) requires compensationPhilosophy + a full
  // equity range always, and a full salary range + currency + country only
  // when salary isn't deferred — mirror that here so submission never 400s.
  const canPost =
    form.compensationPhilosophy.trim() &&
    String(form.equityMin).trim() !== "" &&
    String(form.equityMax).trim() !== "" &&
    Number(form.equityMin) <= Number(form.equityMax) &&
    (!form.addSalary ||
      (String(form.salaryMin).trim() !== "" &&
        String(form.salaryMax).trim() !== "" &&
        Number(form.salaryMin) <= Number(form.salaryMax) &&
        form.currency.trim() &&
        form.compensationCountry.trim()));

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/35" onClick={onClose}>
      <div className="flex max-h-[88vh] w-[520px] flex-col overflow-hidden rounded-2xl bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex shrink-0 items-center justify-between border-b border-v2-border px-5 py-4">
          <p className="font-body text-[15px] font-medium text-v2-heading">Post a role</p>
          <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-v2-muted hover:bg-v2-page"><X className="h-4 w-4" /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="mb-4 flex gap-1">
            {[1, 2].map((i) => (
              <div key={i} className={cn("h-[3px] flex-1 rounded-full", i <= step ? "bg-v2-blue" : "bg-v2-border")} />
            ))}
          </div>
          {step === 1 ? (
            <div className="flex flex-col gap-3">
              <Field label="Role title">
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Senior backend engineer" className={FIELD_INPUT_CLASS} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Commitment">
                  <select value={form.commitment} onChange={(e) => setForm((f) => ({ ...f, commitment: e.target.value }))} className={FIELD_INPUT_CLASS}>
                    {COMMITMENTS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Location">
                  <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="e.g. Remote, Lagos" className={FIELD_INPUT_CLASS} />
                </Field>
              </div>
              <Field label="Role description">
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Describe the role, what they'll work on, and what success looks like..."
                  className={cn(FIELD_INPUT_CLASS, "h-24 resize-none py-2")}
                />
              </Field>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Field label="Skills / roles needed (press Enter)">
                <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={addSkill} placeholder="e.g. Node.js" className={FIELD_INPUT_CLASS} />
              </Field>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s, i) => (
                    <span key={s} onClick={() => setSkills((prev) => prev.filter((_, idx) => idx !== i))} className="cursor-pointer rounded-md bg-v2-blue-tint px-2 py-0.5 font-body text-[11px] text-v2-blue-dark">{s} ✕</span>
                  ))}
                </div>
              )}

              <Field label="Compensation philosophy *">
                <select value={form.compensationPhilosophy} onChange={(e) => setForm((f) => ({ ...f, compensationPhilosophy: e.target.value }))} className={FIELD_INPUT_CLASS}>
                  <option value="equity-focused">Equity-focused</option>
                  <option value="balanced">Balanced</option>
                  <option value="cash-focused">Cash-focused</option>
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Equity min (%) *">
                  <input type="number" step="0.1" min="0" value={form.equityMin} onChange={(e) => setForm((f) => ({ ...f, equityMin: e.target.value }))} placeholder="e.g. 1.0" className={FIELD_INPUT_CLASS} />
                </Field>
                <Field label="Equity max (%) *">
                  <input type="number" step="0.1" min="0" value={form.equityMax} onChange={(e) => setForm((f) => ({ ...f, equityMax: e.target.value }))} placeholder="e.g. 2.5" className={FIELD_INPUT_CLASS} />
                </Field>
              </div>

              <label className="flex items-center gap-2 font-body text-[12px] text-v2-muted">
                <input type="checkbox" checked={form.addSalary} onChange={(e) => setForm((f) => ({ ...f, addSalary: e.target.checked }))} />
                Also offer a salary (leave unchecked for equity-only / deferred compensation)
              </label>

              {form.addSalary && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Monthly salary min *">
                      <input value={form.salaryMin} onChange={(e) => setForm((f) => ({ ...f, salaryMin: e.target.value }))} placeholder="e.g. 280000" className={FIELD_INPUT_CLASS} />
                    </Field>
                    <Field label="Monthly salary max *">
                      <input value={form.salaryMax} onChange={(e) => setForm((f) => ({ ...f, salaryMax: e.target.value }))} placeholder="e.g. 350000" className={FIELD_INPUT_CLASS} />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Currency *">
                      <select value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} className={FIELD_INPUT_CLASS}>
                        <option value="NGN">NGN (₦)</option>
                        <option value="USD">USD ($)</option>
                        <option value="GHS">GHS (₵)</option>
                      </select>
                    </Field>
                    <Field label="Country (ISO code) *">
                      <input value={form.compensationCountry} onChange={(e) => setForm((f) => ({ ...f, compensationCountry: e.target.value.toUpperCase() }))} placeholder="e.g. NG" maxLength={3} className={FIELD_INPUT_CLASS} />
                    </Field>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        <div className="flex shrink-0 justify-end gap-2 border-t border-v2-border px-5 py-3.5">
          {step === 2 && <V2Btn variant="secondary" size="sm" onClick={() => setStep(1)}>Back</V2Btn>}
          <V2Btn variant="secondary" size="sm" onClick={onClose}>Cancel</V2Btn>
          {step === 1 ? (
            <V2Btn variant="primary" size="sm" disabled={!canContinue} onClick={() => setStep(2)}>Continue →</V2Btn>
          ) : (
            <V2Btn variant="primary" size="sm" disabled={submitting || !canPost} onClick={() => onSubmit({ ...form, lookingFor: skills })}>
              {submitting ? "Posting…" : "Post role"}
            </V2Btn>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block font-body text-[12px] font-medium text-v2-muted">{label}</label>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SAVED / APPLICATIONS LIST MODAL (shared shell)
// ─────────────────────────────────────────────────────────────────────────

function ListModal({ title, open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/35" onClick={onClose}>
      <div className="flex max-h-[80vh] w-[480px] flex-col overflow-hidden rounded-2xl bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex shrink-0 items-center justify-between border-b border-v2-border px-5 py-4">
          <p className="font-body text-[15px] font-medium text-v2-heading">{title}</p>
          <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-v2-muted hover:bg-v2-page"><X className="h-4 w-4" /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// RIGHT PANEL
// ─────────────────────────────────────────────────────────────────────────

function TalentRightPanel({ matchedRoles, applications, savedRoles, profilePct, onOpenRole, onEditProfile }) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="rounded-[10px] bg-v2-page p-3">
        <p className="mb-2 font-body text-[12px] font-medium text-v2-heading">Matched for you</p>
        {matchedRoles.length === 0 ? (
          <p className="font-body text-[11px] text-v2-muted">No strong matches yet.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {matchedRoles.slice(0, 4).map((r) => (
              <button key={r._id || r.id} type="button" onClick={() => onOpenRole(r)} className="flex w-full items-center gap-2 rounded-lg py-1.5 text-left hover:bg-v2-surface">
                <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md bg-v2-purple-tint font-body text-[9px] font-medium text-v2-purple-dark">
                  {initialsOf(r.founderName || r.title)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-body text-[11px] font-medium text-v2-heading">{r.title}</p>
                  <p className="truncate font-body text-[10px] text-v2-subtle">{r.founderName}</p>
                </div>
                <span className={cn("font-body text-[11px] font-medium", matchColor(r.matchScore || 0))}>{r.matchScore}%</span>
              </button>
            ))}
          </div>
        )}
        <p className="mt-2 font-body text-[10px] text-v2-blue-dark">
          Matching is based on your skills, industry interests, availability, and experience overlap with each role — not AI, a real rule-based score.
        </p>
      </div>

      <div className="rounded-[10px] bg-v2-page p-3">
        <p className="mb-2 font-body text-[12px] font-medium text-v2-heading">Your applications</p>
        {applications.length === 0 ? (
          <p className="font-body text-[11px] text-v2-muted">No applications yet.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {applications.slice(0, 4).map((a) => (
              <div key={a._id || a.id} className="flex items-center gap-2 py-1">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-body text-[11px] font-medium text-v2-heading">{a.position || "Application"}</p>
                </div>
                <V2Chip variant="blue">{a.status || "submitted"}</V2Chip>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-[10px] bg-v2-page p-3">
        <p className="mb-2 font-body text-[12px] font-medium text-v2-heading">Saved roles</p>
        {savedRoles.length === 0 ? (
          <p className="font-body text-[11px] text-v2-muted">No saved roles yet.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {savedRoles.slice(0, 4).map((r) => (
              <button key={r._id || r.id} type="button" onClick={() => onOpenRole(r)} className="flex w-full items-center gap-2 rounded-lg py-1 text-left hover:bg-v2-surface">
                <p className="truncate font-body text-[11px] font-medium text-v2-heading">{r.title}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-[10px] bg-v2-page p-3">
        <p className="mb-2 font-body text-[12px] font-medium text-v2-heading">Your talent profile</p>
        <div className="mb-1.5 h-1.5 w-full overflow-hidden rounded-full bg-v2-border">
          <div className="h-full rounded-full bg-v2-blue" style={{ width: `${profilePct}%` }} />
        </div>
        <p className="mb-2 font-body text-[11px] text-v2-muted">{profilePct}% complete</p>
        <V2Btn variant="secondary" size="sm" className="w-full justify-center" onClick={onEditProfile}>Edit your profile</V2Btn>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────

export default function V2TalentMarketplace({ user, onPageChange }) {
  const navigate = useNavigate();
  const founderId = useOfficeStore((s) => s.founderId);
  const loadWorkspace = useOfficeStore((s) => s.loadWorkspace);

  const currentUserId = String(user?._id ?? user?.id ?? "");
  const resolvedFounderId = founderId || currentUserId;
  const startupName = user?.startup?.name ?? "Your startup";

  const [loading, setLoading] = useState(true);
  const [myPosts, setMyPosts] = useState([]);
  const [roles, setRoles] = useState([]); // real, matchScore-attached StartupPosts (excludes own)
  const [applications, setApplications] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [profilePct, setProfilePct] = useState(0);

  const [view, setView] = useState("grid");
  const [category, setCategory] = useState("All roles");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeRoleId, setActiveRoleId] = useState(null);
  const [applyingId, setApplyingId] = useState(null);
  const [showPostRole, setShowPostRole] = useState(false);
  const [postingRole, setPostingRole] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [showApplications, setShowApplications] = useState(false);

  useEffect(() => {
    if (user) loadWorkspace(user);
  }, [user, loadWorkspace]);

  useEffect(() => {
    if (!currentUserId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [mine, matches, apps, saved, profile] = await Promise.allSettled([
          founderApi.getFounderPosts(resolvedFounderId),
          talentApi.getMatchedOpportunities(currentUserId, { pageSize: 150 }),
          talentApi.getTalentApplications(currentUserId),
          talentApi.getSavedItems(currentUserId),
          talentApi.getTalentProfile(currentUserId),
        ]);
        if (cancelled) return;

        const myPostsList = Array.isArray(mine.value) ? mine.value : mine.value?.posts || [];
        setMyPosts(myPostsList);

        // talentApi's apiCall returns the full {success, data} envelope
        // (unlike founderApi's, which already unwraps .data) — unwrap here.
        const matchList =
          matches.status === "fulfilled"
            ? matches.value?.data?.matches || matches.value?.data?.opportunities || []
            : [];
        const myFounderIds = new Set(myPostsList.map((p) => String(p.founderId)));
        myFounderIds.add(String(resolvedFounderId));
        setRoles(matchList.filter((p) => !myFounderIds.has(String(p.founderId))));

        setApplications(apps.status === "fulfilled" ? apps.value?.data || [] : []);

        const savedList = saved.status === "fulfilled" ? saved.value?.data || [] : [];
        setSavedIds(new Set(savedList.filter((s) => s.itemType === "job").map((s) => String(s.itemId))));

        if (profile.status === "fulfilled" && profile.value?.data) {
          setProfilePct(getTalentBrowseProfileCompletionPercent(profile.value.data));
        }
      } catch (error) {
        console.error("[V2TalentMarketplace] Failed to load marketplace data:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, resolvedFounderId]);

  const appliedPostIds = useMemo(
    () => new Set(applications.map((a) => String(a.postId || ""))),
    [applications],
  );

  const filteredRoles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return roles.filter((r) => {
      if (!roleMatchesCategory(r, category)) return false;
      if (!q) return true;
      const haystack = [r.title, r.founderName, ...(r.lookingFor || [])].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [roles, category, searchQuery]);

  const matchedRoles = useMemo(() => [...roles].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0)), [roles]);
  const savedRoles = useMemo(() => roles.filter((r) => savedIds.has(String(r._id || r.id))), [roles, savedIds]);
  const matchedCount = useMemo(() => roles.filter((r) => (r.matchScore || 0) >= 70).length, [roles]);

  const activeRole = useMemo(
    () => roles.find((r) => String(r._id || r.id) === String(activeRoleId)) || null,
    [roles, activeRoleId],
  );

  const handleToggleSave = async (post) => {
    const postId = String(post._id || post.id || "");
    if (!postId) return;
    const isSaved = savedIds.has(postId);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(postId); else next.add(postId);
      return next;
    });
    try {
      if (isSaved) {
        await talentApi.removeSavedItem(currentUserId, "job", postId);
      } else {
        await talentApi.saveItem(currentUserId, { itemType: "job", itemId: postId });
      }
    } catch (error) {
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (isSaved) next.add(postId); else next.delete(postId);
        return next;
      });
      toast.error(error?.message || "Could not update saved roles.");
    }
  };

  const handleApply = async (post, coverNote) => {
    const postId = String(post._id || post.id || "");
    if (!postId || appliedPostIds.has(postId)) return;
    setApplyingId(postId);
    try {
      const response = await talentApi.submitApplication(currentUserId, {
        startupId: post.startupId,
        founderId: post.founderId,
        postId,
        position: post.title,
        coverNote: coverNote || "",
      });
      setApplications((prev) => [response?.data, ...prev]);
      toast.success(`Application submitted to ${post.founderName || "the founder"}`);
      setActiveRoleId(null);
    } catch (error) {
      toast.error(error?.message || "Could not submit application.");
    } finally {
      setApplyingId(null);
    }
  };

  const handlePostRole = async (form) => {
    setPostingRole(true);
    try {
      const offer = form.addSalary
        ? {
            compensationPhilosophy: form.compensationPhilosophy,
            equityMin: form.equityMin,
            equityMax: form.equityMax,
            salaryApproach: "fixed",
            salaryMin: form.salaryMin,
            salaryMax: form.salaryMax,
            currency: form.currency,
            compensationCountry: form.compensationCountry,
          }
        : {
            compensationPhilosophy: form.compensationPhilosophy,
            equityMin: form.equityMin,
            equityMax: form.equityMax,
            salaryApproach: "deferred",
          };
      const created = await founderApi.saveStartupPost(resolvedFounderId, {
        title: form.title,
        description: form.description,
        founderName: user?.name || "",
        commitment: form.commitment,
        location: form.location,
        lookingFor: form.lookingFor,
        offer,
      });
      setMyPosts((prev) => [created, ...prev]);
      setShowPostRole(false);
      toast.success("Role posted!");
    } catch (error) {
      toast.error(error?.message || "Could not post role.");
    } finally {
      setPostingRole(false);
    }
  };

  const handleStatClick = (key) => {
    if (key === "saved") setShowSaved(true);
    else if (key === "applications") setShowApplications(true);
    else if (key === "matched") setCategory("Matched");
    else setCategory("All roles");
  };

  if (loading) {
    return (
      <V2AppLayout user={user} currentPage="talent" onPageChange={onPageChange} topbarTitle="Talent Marketplace">
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-v2-border border-t-v2-blue" />
            <p className="font-body text-[12px] text-v2-muted">Loading the marketplace…</p>
          </div>
        </div>
      </V2AppLayout>
    );
  }

  const topbarChips = [
    <V2Chip key="startup" variant="blue" dot>{startupName}</V2Chip>,
    <V2Chip key="roles" variant="green">{roles.length} open roles</V2Chip>,
  ];
  const topbarActions = (
    <>
      <V2Btn variant="secondary" size="sm" onClick={() => setShowSaved(true)}>
        <Bookmark className="h-3.5 w-3.5" /> Saved ({savedRoles.length})
      </V2Btn>
      <V2Btn variant="secondary" size="sm" onClick={() => setShowApplications(true)}>
        <ClipboardList className="h-3.5 w-3.5" /> Applications ({applications.length})
      </V2Btn>
      <V2Btn variant="primary" size="sm" onClick={() => setShowPostRole(true)}>
        <Plus className="h-3.5 w-3.5" /> Post a role
      </V2Btn>
    </>
  );

  return (
    <V2AppLayout
      user={user}
      currentPage="talent"
      onPageChange={onPageChange}
      rightPanel={
        <TalentRightPanel
          matchedRoles={matchedRoles}
          applications={applications}
          savedRoles={savedRoles}
          profilePct={profilePct}
          onOpenRole={(r) => setActiveRoleId(String(r._id || r.id))}
          onEditProfile={() => navigate("/browse-talent")}
        />
      }
      topbarTitle="Talent Marketplace"
      topbarChips={topbarChips}
      topbarActions={topbarActions}
    >
      <div className="flex flex-col gap-4 p-4">
        <StatsRow
          openRoleCount={roles.length}
          matchedCount={matchedCount}
          applicationCount={applications.length}
          savedCount={savedRoles.length}
          onStatClick={handleStatClick}
        />

        <div className="flex items-center gap-2">
          <div className="flex h-9 flex-1 items-center gap-2 rounded-full border border-v2-border bg-v2-page px-3.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-v2-subtle" aria-hidden />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search roles, startups, skills..."
              className="w-full bg-transparent font-body text-[12px] text-v2-heading placeholder:text-v2-subtle outline-none"
            />
          </div>
          <div className="flex overflow-hidden rounded-lg border border-v2-border">
            <button type="button" onClick={() => setView("grid")} className={cn("flex h-9 w-9 items-center justify-center", view === "grid" ? "bg-v2-page text-v2-heading" : "text-v2-subtle")}>
              <Grid3x3 className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setView("list")} className={cn("flex h-9 w-9 items-center justify-center", view === "list" ? "bg-v2-page text-v2-heading" : "text-v2-subtle")}>
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-full px-3 py-1 font-body text-[11px]",
                category === c ? "bg-v2-blue font-medium text-white" : "border border-v2-border text-v2-muted hover:bg-v2-page",
              )}
            >
              {c === "Matched" ? "Matched for you" : c}
            </button>
          ))}
        </div>

        {filteredRoles.length === 0 ? (
          <div className="rounded-[14px] border border-v2-border bg-white py-10 text-center">
            <p className="font-body text-[13px] text-v2-muted">No roles match this filter. Try adjusting your search.</p>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {filteredRoles.map((post) => {
              const postId = String(post._id || post.id || "");
              return (
                <RoleCard
                  key={postId}
                  post={post}
                  view="grid"
                  saved={savedIds.has(postId)}
                  applied={appliedPostIds.has(postId)}
                  onOpen={() => setActiveRoleId(postId)}
                  onApply={() => setActiveRoleId(postId)}
                  onToggleSave={() => handleToggleSave(post)}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredRoles.map((post) => {
              const postId = String(post._id || post.id || "");
              return (
                <RoleCard
                  key={postId}
                  post={post}
                  view="list"
                  saved={savedIds.has(postId)}
                  applied={appliedPostIds.has(postId)}
                  onOpen={() => setActiveRoleId(postId)}
                  onApply={() => setActiveRoleId(postId)}
                  onToggleSave={() => handleToggleSave(post)}
                />
              );
            })}
          </div>
        )}
      </div>

      {activeRole ? (
        <RoleDetailPanel
          post={activeRole}
          saved={savedIds.has(String(activeRole._id || activeRole.id))}
          applied={appliedPostIds.has(String(activeRole._id || activeRole.id))}
          applying={applyingId === String(activeRole._id || activeRole.id)}
          onClose={() => setActiveRoleId(null)}
          onToggleSave={() => handleToggleSave(activeRole)}
          onSubmitApply={(note) => handleApply(activeRole, note)}
        />
      ) : null}

      <PostRoleModal open={showPostRole} onClose={() => setShowPostRole(false)} onSubmit={handlePostRole} submitting={postingRole} />

      <ListModal title="Saved roles" open={showSaved} onClose={() => setShowSaved(false)}>
        {savedRoles.length === 0 ? (
          <p className="py-6 text-center font-body text-[12px] text-v2-muted">No saved roles. Bookmark roles you like.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {savedRoles.map((r) => (
              <div key={r._id || r.id} className="rounded-[12px] bg-v2-page p-3.5">
                <div className="mb-2 flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-v2-purple-tint font-body text-[11px] font-medium text-v2-purple-dark">
                    {initialsOf(r.founderName || r.title)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-[13px] font-medium text-v2-heading">{r.title}</p>
                    <p className="truncate font-body text-[11px] text-v2-subtle">{r.founderName}</p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <V2Btn variant="primary" size="sm" onClick={() => { setActiveRoleId(String(r._id || r.id)); setShowSaved(false); }}>View details</V2Btn>
                  <V2Btn variant="secondary" size="sm" onClick={() => handleToggleSave(r)}>Remove</V2Btn>
                </div>
              </div>
            ))}
          </div>
        )}
      </ListModal>

      <ListModal title="My applications" open={showApplications} onClose={() => setShowApplications(false)}>
        {applications.length === 0 ? (
          <p className="py-6 text-center font-body text-[12px] text-v2-muted">No applications yet. Browse roles and apply.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {applications.map((a) => (
              <div key={a._id || a.id} className="rounded-[12px] bg-v2-page p-3.5">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="font-body text-[13px] font-medium text-v2-heading">{a.position || "Application"}</p>
                  <V2Chip variant="blue">{a.status || "submitted"}</V2Chip>
                </div>
                <p className="font-body text-[11px] text-v2-subtle">
                  Applied {timeAgo(a.createdAt)} · Response usually within 3–5 days
                </p>
              </div>
            ))}
          </div>
        )}
      </ListModal>
    </V2AppLayout>
  );
}
