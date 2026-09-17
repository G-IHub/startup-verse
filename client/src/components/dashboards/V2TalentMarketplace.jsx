/**
 * V2TalentMarketplace ("Browse Talent")
 * ─────────────────────────────────────────────────────────────────────────────
 * V2 redesign built from StartupVerse_Talent_Browse.html — the FOUNDER-side
 * experience: browse candidate talent profiles, see a real match score
 * against your own posted role, shortlist candidates, message them, review
 * applications to your roles, and send a real compensation offer.
 *
 * This supersedes two earlier passes at this page that turned out to model
 * the wrong side of the marketplace (see CLAUDE.md for the full history):
 * pass 1 mixed founder-hiring content with fabricated stats; pass 2 was
 * actually V1's TALENT/job-seeker experience (browse roles, apply, save)
 * mistakenly built into V2's founder-only shell. This pass is the real
 * founder "who should I hire" workflow.
 *
 * Real backend reused:
 *   - GET /talent/profiles (talentApi.getAllTalent) — real candidate profiles
 *   - Match score: real deterministic heuristic (utils/talentMatchScore.js,
 *     ported from TeamMatching.jsx) scored against the founder's own posted
 *     role — NOT machine learning, UI only ever says "Matched".
 *   - Shortlist: SavedItem with itemType "talent" (schema extended this
 *     session — was job/startup only).
 *   - Review applications: NEW GET /founders/:founderId/applications (this
 *     session — TalentApplication existed but had no founder-facing list
 *     endpoint before).
 *   - Send offer: NEW Offer model + /offers routes (this session — no offer
 *     concept existed in the backend at all before).
 *   - Message: real 1:1 messaging (utils/messaging.js sendMessage), the same
 *     system used by SimpleTeamMessaging elsewhere in V2.
 */

import React, { useEffect, useMemo, useState } from "react";
import { cn } from "../ui/utils";
import { toast } from "sonner";

import V2AppLayout from "../layout/V2AppLayout";
import { V2Card, V2Chip, V2Avatar, V2Btn } from "../shared/v2-primitives";
import V2SendOfferModal from "./V2SendOfferModal";

import { useOfficeStore } from "../../state/useOfficeStore";
import * as founderApi from "../../utils/api/founderApi";
import * as talentApi from "../../utils/api/talentApi";
import * as offersApi from "../../utils/api/offersApi";
import { sendMessage as sendRealMessage } from "../../utils/messaging";
import { calculateTalentMatchScore } from "../../utils/talentMatchScore";

import {
  Search,
  Bookmark,
  ClipboardList,
  Grid3x3,
  List,
  X,
  MapPin,
  Send,
} from "lucide-react";

const CATEGORIES = ["All talent", "Matched", "Engineering", "Design", "Product", "Operations", "Co-founder", "Available now"];

function initialsOf(name) {
  return (name || "?").split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

/**
 * The candidate's real User id — the one FounderTalentInvitation, SavedItem,
 * TalentApplication, Offer, and messaging all key on. getAllTalent() returns
 * raw TalentProfile docs, whose own `id`/`_id` is the PROFILE document's id,
 * not the user's — that must never be used to identify a candidate across
 * these real backend records. The real `/talent/browse` endpoint populates
 * `userId` into `{_id, name, email, avatarUrl}` (confirmed by testing — a
 * naive `String(t.userId)` silently produced the literal string
 * "[object Object]" for every candidate, which both broke SavedItem's
 * ObjectId validation with a real 400 and caused duplicate React keys).
 */
function talentUserId(t) {
  const uid = t?.userId;
  if (uid && typeof uid === "object") return String(uid._id ?? uid.id ?? "");
  return String(uid ?? t?.id ?? t?._id ?? "");
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

function talentMatchesCategory(t, category) {
  if (category === "All talent") return true;
  if (category === "Matched") return (t.matchScore || 0) >= 70;
  if (category === "Available now") return t.availability === "Immediately";
  const haystack = [t.professionalTitle, t.role, t.preferredCommitment, ...(t.skills || t.talentSkills || []), ...(t.preferredRoles || [])]
    .join(" ")
    .toLowerCase();
  if (category === "Co-founder") return haystack.includes("co-founder") || haystack.includes("cofounder");
  return haystack.includes(category.toLowerCase());
}

// ─────────────────────────────────────────────────────────────────────────
// STATS ROW
// ─────────────────────────────────────────────────────────────────────────

function StatsRow({ talentCount, matchedCount, applicationCount, shortlistCount, onStatClick }) {
  const stats = [
    { key: "all", label: "Talent on platform", value: talentCount, color: "text-v2-blue" },
    { key: "matched", label: "Matched for your roles", value: matchedCount, color: "text-v2-green" },
    { key: "applications", label: "Applications to review", value: applicationCount, color: "text-v2-amber-dark" },
    { key: "shortlist", label: "Shortlisted candidates", value: shortlistCount, color: "text-v2-heading" },
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
// TALENT CARD (grid + list)
// ─────────────────────────────────────────────────────────────────────────

function TalentCard({ talent, shortlisted, view, onOpen, onMessage, onToggleShortlist }) {
  const name = talent.fullName || talent.name || talent.talentName || "Talent";
  const skills = talent.talentSkills || talent.skills || [];
  const headline = talent.professionalTitle || talent.headline || talent.role || "Talent";

  if (view === "list") {
    return (
      <div
        onClick={onOpen}
        className={cn(
          "flex cursor-pointer items-center gap-3 rounded-[12px] border bg-v2-surface p-3 transition-colors hover:border-v2-blue/30",
          talent.matchScore >= 90 ? "border-v2-blue" : "border-v2-border",
        )}
      >
        <V2Avatar name={name} size={38} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-body text-[13px] font-medium text-v2-heading">{name}</p>
          <p className="truncate font-body text-[11px] text-v2-subtle">{headline} · {talent.location}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className={cn("font-body text-[14px] font-medium", matchColor(talent.matchScore || 0))}>{talent.matchScore || 0}%</div>
          <div className="font-body text-[10px] text-v2-subtle">match</div>
        </div>
      </div>
    );
  }

  return (
    <V2Card className={cn("flex flex-col gap-2.5", talent.matchScore >= 90 && "border-v2-blue")}>
      {talent.matchScore >= 70 ? (
        <span className="inline-flex w-fit items-center rounded-md bg-v2-blue-tint px-2 py-0.5 font-body text-[9px] font-medium text-v2-blue-dark">
          Matched for your roles
        </span>
      ) : null}
      <div className="flex items-start gap-2.5">
        <V2Avatar name={name} size={44} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-body text-[13px] font-medium text-v2-heading">{name}</p>
          <p className="truncate font-body text-[11px] text-v2-subtle">{headline}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className={cn("font-body text-[14px] font-medium", matchColor(talent.matchScore || 0))}>{talent.matchScore || 0}%</div>
          <div className="font-body text-[9px] text-v2-subtle">match</div>
        </div>
      </div>
      {skills.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {skills.slice(0, 4).map((s) => (
            <span key={s} className="rounded-md bg-v2-page px-1.5 py-0.5 font-body text-[10px] text-v2-muted">{s}</span>
          ))}
          {skills.length > 4 ? <span className="rounded-md bg-v2-page px-1.5 py-0.5 font-body text-[10px] text-v2-muted">+{skills.length - 4}</span> : null}
        </div>
      ) : null}
      {talent.bio ? (
        <p className="line-clamp-2 font-body text-[11px] leading-relaxed text-v2-muted">{talent.bio}</p>
      ) : null}
      <div className="flex flex-wrap gap-x-3 gap-y-1 font-body text-[10px] text-v2-subtle">
        {talent.location ? <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{talent.location}</span> : null}
        {talent.availability ? <span>{talent.availability}</span> : null}
        {talent.experience || talent.yearsOfExperience ? <span>{talent.experience || talent.yearsOfExperience} exp</span> : null}
      </div>
      <div className="flex gap-1.5 border-t border-v2-border pt-2.5">
        <V2Btn variant="primary" size="sm" className="flex-1 justify-center" onClick={(e) => { e.stopPropagation(); onMessage(); }}>
          Message
        </V2Btn>
        <V2Btn
          variant={shortlisted ? "secondary" : "ghost"}
          size="sm"
          className={cn(shortlisted && "bg-v2-green-tint text-v2-green-dark")}
          onClick={(e) => { e.stopPropagation(); onToggleShortlist(); }}
        >
          <Bookmark className="h-3.5 w-3.5" />
        </V2Btn>
        <V2Btn variant="secondary" size="sm" onClick={onOpen}>Profile</V2Btn>
      </div>
    </V2Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// TALENT DETAIL SLIDE-OUT
// ─────────────────────────────────────────────────────────────────────────

function TalentDetailPanel({ talent, shortlisted, onClose, onToggleShortlist, onSendOffer, onSendMessage, sendingMessage }) {
  const [tab, setTab] = useState("profile");
  const [messageText, setMessageText] = useState("");

  useEffect(() => {
    setTab("profile");
    setMessageText("");
  }, [talent?._id, talent?.id]);

  if (!talent) return null;
  const name = talent.fullName || talent.name || talent.talentName || "Talent";
  const headline = talent.professionalTitle || talent.headline || talent.role || "Talent";
  const skills = talent.talentSkills || talent.skills || [];

  const matchReasons = [
    ...skills.slice(0, 2).map((s) => `Has ${s}`),
    talent.availability ? `Available ${String(talent.availability).toLowerCase()}` : null,
  ].filter(Boolean);

  return (
    <>
      <div className="fixed inset-0 z-[90] bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 z-[95] flex h-full w-full flex-col bg-white md:w-[500px]">
        <div className="flex shrink-0 items-center justify-between border-b border-v2-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <V2Avatar name={name} size={40} />
            <div>
              <p className="font-body text-[14px] font-medium text-v2-heading">{name}</p>
              <p className="font-body text-[11px] text-v2-subtle">{headline}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <V2Btn variant={shortlisted ? "secondary" : "ghost"} size="sm" onClick={onToggleShortlist} className={cn(shortlisted && "bg-v2-green-tint text-v2-green-dark")}>
              <Bookmark className="h-3.5 w-3.5" /> {shortlisted ? "Shortlisted" : "Shortlist"}
            </V2Btn>
            <V2Btn variant="primary" size="sm" onClick={onSendOffer}>Send offer</V2Btn>
            <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-v2-muted hover:bg-v2-page">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="mb-4 flex gap-0.5 rounded-lg bg-gray-100 p-[3px]">
            {["profile", "skills", "message"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "flex-1 rounded-md py-1.5 font-body text-[12px] font-medium capitalize",
                  tab === t ? "border border-v2-border bg-white text-v2-heading" : "text-v2-muted",
                )}
              >
                {t === "skills" ? "Skills & work" : t}
              </button>
            ))}
          </div>

          {tab === "profile" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 rounded-[10px] bg-v2-page p-3">
                <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-[3px]", talent.matchScore >= 70 ? "border-v2-green" : "border-v2-border")}>
                  <div className="text-center">
                    <div className={cn("font-heading text-[16px] font-medium", matchColor(talent.matchScore || 0))}>{talent.matchScore || 0}%</div>
                    <div className="font-body text-[9px] text-v2-subtle">match</div>
                  </div>
                </div>
                <div className="font-body text-[11px] leading-relaxed text-v2-muted">
                  <span className="font-medium text-v2-heading">Why matched: </span>
                  {matchReasons.length > 0 ? matchReasons.join(" · ") : "General availability overlap"}
                </div>
              </div>
              <div>
                <p className="mb-2 font-body text-[11px] font-medium uppercase tracking-wide text-v2-subtle">About</p>
                <p className="mb-3 font-body text-[12px] leading-relaxed text-v2-muted">{talent.bio || "No bio provided."}</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["Location", talent.location || "—"],
                    ["Experience", talent.experience || talent.yearsOfExperience || "—"],
                    ["Availability", talent.availability || "—"],
                    ["Commitment", talent.preferredCommitment || "—"],
                  ].map(([l, v]) => (
                    <div key={l} className="rounded-[8px] bg-v2-page p-2.5">
                      <p className="font-body text-[10px] text-v2-subtle">{l}</p>
                      <p className="font-body text-[13px] font-medium text-v2-heading">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
              {skills.length > 0 && (
                <div>
                  <p className="mb-2 font-body text-[11px] font-medium uppercase tracking-wide text-v2-subtle">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((s) => (
                      <span key={s} className="rounded-md bg-v2-blue-tint px-2 py-0.5 font-body text-[10px] text-v2-blue-dark">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "skills" && (
            <div className="flex flex-col gap-4">
              <div>
                <p className="mb-2 font-body text-[11px] font-medium uppercase tracking-wide text-v2-subtle">Experience</p>
                <div className="rounded-[10px] bg-v2-page p-3 font-body text-[12px] leading-relaxed text-v2-muted">
                  <p className="mb-1 font-medium text-v2-heading">{talent.experience || talent.yearsOfExperience || "Experience not specified"}</p>
                  {talent.bio || "No further details shared."}
                </div>
              </div>
              <div>
                <p className="mb-2 font-body text-[11px] font-medium uppercase tracking-wide text-v2-subtle">Portfolio / links</p>
                {talent.websiteUrl || talent.githubUrl || talent.linkedinUrl || (talent.portfolioLinks || []).length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {[talent.websiteUrl, talent.githubUrl, talent.linkedinUrl, ...(talent.portfolioLinks || [])].filter(Boolean).map((url) => (
                      <a key={url} href={url.startsWith("http") ? url : `https://${url}`} target="_blank" rel="noreferrer" className="font-body text-[12px] text-v2-blue hover:underline">
                        🔗 {url}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="font-body text-[12px] text-v2-muted">No portfolio link added yet.</p>
                )}
              </div>
              <div>
                <p className="mb-2 font-body text-[11px] font-medium uppercase tracking-wide text-v2-subtle">Availability</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-[8px] bg-v2-page p-2.5">
                    <p className="font-body text-[10px] text-v2-subtle">Available from</p>
                    <p className="font-body text-[13px] font-medium text-v2-heading">{talent.availability || "—"}</p>
                  </div>
                  <div className="rounded-[8px] bg-v2-page p-2.5">
                    <p className="font-body text-[10px] text-v2-subtle">Commitment</p>
                    <p className="font-body text-[13px] font-medium text-v2-heading">{talent.preferredCommitment || "—"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "message" && (
            <div className="flex flex-col gap-3">
              <div className="rounded-[10px] bg-v2-page p-3 font-body text-[12px] leading-relaxed text-v2-muted">
                This sends a real direct message to {name} via StartupVerse messaging.
              </div>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={`Hi! I came across your profile on StartupVerse and think you'd be a great fit...`}
                className="h-32 w-full rounded-[10px] border border-v2-border p-3 font-body text-[12px] text-v2-heading outline-none focus:border-v2-blue"
              />
              <V2Btn
                variant="primary"
                className="justify-center"
                disabled={sendingMessage || !messageText.trim()}
                onClick={() => onSendMessage(messageText).then(() => setMessageText(""))}
              >
                <Send className="h-3.5 w-3.5" /> {sendingMessage ? "Sending…" : "Send message"}
              </V2Btn>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SHARED LIST MODAL SHELL
// ─────────────────────────────────────────────────────────────────────────

function ListModal({ title, open, onClose, width = 480, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/35" onClick={onClose}>
      <div className="flex max-h-[80vh] flex-col overflow-hidden rounded-2xl bg-white" style={{ width }} onClick={(e) => e.stopPropagation()}>
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

function TalentRightPanel({ topMatches, shortlist, applications, myPosts, onOpenTalent, onSendOffer }) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="rounded-[10px] bg-v2-page p-3">
        <p className="mb-2 font-body text-[12px] font-medium text-v2-heading">Top matches</p>
        {topMatches.length === 0 ? (
          <p className="font-body text-[11px] text-v2-muted">Post a role to see matched candidates here.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {topMatches.slice(0, 4).map((t) => {
              const name = t.fullName || t.name || t.talentName;
              return (
                <button key={t.id || t._id} type="button" onClick={() => onOpenTalent(t)} className="flex w-full items-center gap-2 rounded-lg py-1.5 text-left hover:bg-v2-surface">
                  <V2Avatar name={name} size={26} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-[11px] font-medium text-v2-heading">{name}</p>
                    <p className="truncate font-body text-[10px] text-v2-subtle">{t.professionalTitle || t.role}</p>
                  </div>
                  <span className={cn("font-body text-[11px] font-medium", matchColor(t.matchScore || 0))}>{t.matchScore}%</span>
                </button>
              );
            })}
          </div>
        )}
        <p className="mt-2 font-body text-[10px] text-v2-blue-dark">
          Matched to your open roles based on skills, industry, and availability overlap — not AI, a real rule-based score.
        </p>
      </div>

      <div className="rounded-[10px] bg-v2-page p-3">
        <p className="mb-2 font-body text-[12px] font-medium text-v2-heading">Shortlisted</p>
        {shortlist.length === 0 ? (
          <p className="font-body text-[11px] text-v2-muted">No candidates shortlisted yet.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {shortlist.slice(0, 4).map((t) => {
              const name = t.fullName || t.name || t.talentName;
              return (
                <button key={t.id || t._id} type="button" onClick={() => onOpenTalent(t)} className="flex w-full items-center gap-2 rounded-lg py-1 text-left hover:bg-v2-surface">
                  <V2Avatar name={name} size={26} />
                  <p className="truncate font-body text-[11px] font-medium text-v2-heading">{name}</p>
                </button>
              );
            })}
          </div>
        )}
        <V2Btn variant="primary" size="sm" className="mt-2 w-full justify-center" onClick={() => onSendOffer(null)}>Send offer to shortlist</V2Btn>
      </div>

      <div className="rounded-[10px] bg-v2-page p-3">
        <p className="mb-2 font-body text-[12px] font-medium text-v2-heading">Recent applications</p>
        {applications.length === 0 ? (
          <p className="font-body text-[11px] text-v2-muted">No applications yet.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {applications.slice(0, 3).map((a) => (
              <div key={a._id || a.id} className="flex items-center gap-2 py-1">
                <V2Avatar name={a.talentId?.name} size={26} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-body text-[11px] font-medium text-v2-heading">{a.talentId?.name || "Candidate"}</p>
                  <p className="truncate font-body text-[10px] text-v2-subtle">{a.position} · {timeAgo(a.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-[10px] bg-v2-page p-3">
        <p className="mb-2 font-body text-[12px] font-medium text-v2-heading">Your open roles</p>
        {myPosts.length === 0 ? (
          <p className="font-body text-[11px] text-v2-muted">No open roles posted yet.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {myPosts.map((p) => (
              <div key={p._id || p.id} className="rounded-[8px] border border-v2-border bg-v2-surface p-2">
                <p className="font-body text-[11px] font-medium text-v2-heading">{p.title}</p>
                <p className="font-body text-[10px] text-v2-subtle">
                  {(p.applicantCount || 0)} applicant{p.applicantCount === 1 ? "" : "s"} · Posted {timeAgo(p.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────

export default function V2TalentMarketplace({ user, onPageChange }) {
  const founderId = useOfficeStore((s) => s.founderId);
  const teamMembers = useOfficeStore((s) => s.teamMembers);
  const startupId = useOfficeStore((s) => s.startupId);
  const loadWorkspace = useOfficeStore((s) => s.loadWorkspace);

  const currentUserId = String(user?._id ?? user?.id ?? "");
  const resolvedFounderId = founderId || currentUserId;
  const startupName = user?.startup?.name ?? "Your startup";

  const [loading, setLoading] = useState(true);
  const [myPosts, setMyPosts] = useState([]);
  const [talentList, setTalentList] = useState([]);
  const [applications, setApplications] = useState([]);
  const [shortlistIds, setShortlistIds] = useState(new Set());

  const [view, setView] = useState("grid");
  const [category, setCategory] = useState("All talent");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTalentId, setActiveTalentId] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showOffer, setShowOffer] = useState(false);
  const [offerPresetTalentId, setOfferPresetTalentId] = useState(null);
  const [postingOffer, setPostingOffer] = useState(false);
  const [showShortlist, setShowShortlist] = useState(false);
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
        const [mine, talentRes, appsRes, savedRes] = await Promise.allSettled([
          founderApi.getFounderPosts(resolvedFounderId),
          talentApi.getAllTalent({ pageSize: 200 }),
          founderApi.getFounderApplications(resolvedFounderId),
          talentApi.getSavedItems(currentUserId),
        ]);
        if (cancelled) return;

        const myPostsList = Array.isArray(mine.value) ? mine.value : mine.value?.posts || [];

        // founderApi's apiCall already unwraps .data (unlike talentApi's,
        // which returns the full {success, data} envelope — see savedRes below).
        const appsList = appsRes.status === "fulfilled" ? appsRes.value || [] : [];
        const applicantCountByPost = new Map();
        appsList.forEach((a) => {
          const key = String(a.postId || "");
          if (!key) return;
          applicantCountByPost.set(key, (applicantCountByPost.get(key) || 0) + 1);
        });
        setMyPosts(myPostsList.map((p) => ({ ...p, applicantCount: applicantCountByPost.get(String(p._id || p.id)) || 0 })));
        setApplications(appsList);

        const teamMemberIds = new Set((teamMembers || []).map((m) => String(m._id ?? m.id)));
        const talentRaw = talentRes.status === "fulfilled" ? talentRes.value?.items || [] : [];
        const primaryPost = myPostsList[0];
        const neededRoles = primaryPost?.lookingFor || [];
        const industry = primaryPost?.industry || "";
        const scored = talentRaw
          .filter((t) => {
            const id = talentUserId(t);
            return id && !teamMemberIds.has(id);
          })
          .map((t) => ({ ...t, matchScore: calculateTalentMatchScore(t, neededRoles, industry) }))
          .sort((a, b) => b.matchScore - a.matchScore);
        setTalentList(scored);

        const savedList = savedRes.status === "fulfilled" ? savedRes.value?.data || [] : [];
        setShortlistIds(new Set(savedList.filter((s) => s.itemType === "talent").map((s) => String(s.itemId))));
      } catch (error) {
        console.error("[V2TalentMarketplace] Failed to load browse-talent data:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, resolvedFounderId]);

  const filteredTalent = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return talentList.filter((t) => {
      if (!talentMatchesCategory(t, category)) return false;
      if (!q) return true;
      const name = t.fullName || t.name || t.talentName || "";
      const haystack = [name, t.professionalTitle, t.role, t.location, ...(t.talentSkills || t.skills || [])].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [talentList, category, searchQuery]);

  const topMatches = useMemo(() => talentList.filter((t) => (t.matchScore || 0) >= 70).slice(0, 4), [talentList]);
  const matchedCount = useMemo(() => talentList.filter((t) => (t.matchScore || 0) >= 70).length, [talentList]);
  const shortlist = useMemo(() => talentList.filter((t) => shortlistIds.has(talentUserId(t))), [talentList, shortlistIds]);

  const activeTalent = useMemo(
    () => talentList.find((t) => talentUserId(t) === String(activeTalentId)) || null,
    [talentList, activeTalentId],
  );

  const handleToggleShortlist = async (talent) => {
    const talentId = talentUserId(talent);
    if (!talentId) return;
    const isShortlisted = shortlistIds.has(talentId);
    setShortlistIds((prev) => {
      const next = new Set(prev);
      if (isShortlisted) next.delete(talentId); else next.add(talentId);
      return next;
    });
    try {
      if (isShortlisted) {
        await talentApi.removeSavedItem(currentUserId, "talent", talentId);
      } else {
        await talentApi.saveItem(currentUserId, { itemType: "talent", itemId: talentId });
      }
      toast.success(isShortlisted ? "Removed from shortlist" : `${talent.fullName || talent.name || "Candidate"} shortlisted`);
    } catch (error) {
      setShortlistIds((prev) => {
        const next = new Set(prev);
        if (isShortlisted) next.add(talentId); else next.delete(talentId);
        return next;
      });
      toast.error(error?.message || "Could not update shortlist.");
    }
  };

  const handleSendMessage = async (talent, text) => {
    setSendingMessage(true);
    try {
      const talentId = talentUserId(talent);
      const name = talent.fullName || talent.name || talent.talentName || "Candidate";
      await sendRealMessage(
        currentUserId,
        user?.name || "",
        user?.role || "founder",
        talentId,
        name,
        text,
        startupId || resolvedFounderId,
        false,
      );
      toast.success(`Message sent to ${name}`);
    } catch (error) {
      toast.error(error?.message || "Could not send message.");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSendOffer = async (form) => {
    setPostingOffer(true);
    try {
      // Don't pass startupId from useOfficeStore here — in this store it can
      // equal the founder's own user id as a fallback, which would silently
      // mislabel the offer's real Startup reference. Omit it and let the
      // server's own Startup.findOne({ founderId }) resolve the real one
      // (same pattern founderApi.saveStartupPost already relies on).
      await offersApi.createOffer({ founderId: resolvedFounderId, ...form });
      toast.success("Offer sent successfully");
      setShowOffer(false);
      setActiveTalentId(null);
    } catch (error) {
      toast.error(error?.message || "Could not send offer.");
    } finally {
      setPostingOffer(false);
    }
  };

  const openOfferFor = (talentId) => {
    setOfferPresetTalentId(talentId);
    setShowOffer(true);
  };

  const handleStatClick = (key) => {
    if (key === "shortlist") setShowShortlist(true);
    else if (key === "applications") setShowApplications(true);
    else if (key === "matched") setCategory("Matched");
    else setCategory("All talent");
  };

  const talentOptionsForOffer = useMemo(
    () =>
      [...shortlist, ...talentList.filter((t) => !shortlistIds.has(talentUserId(t)))].map((t) => ({
        id: talentUserId(t),
        name: t.fullName || t.name || t.talentName || "Candidate",
        shortlisted: shortlistIds.has(talentUserId(t)),
      })),
    [shortlist, talentList, shortlistIds],
  );
  const roleOptionsForOffer = useMemo(() => {
    const roles = new Set();
    myPosts.forEach((p) => {
      if (p.title) roles.add(p.title);
      (p.lookingFor || []).forEach((r) => roles.add(r));
    });
    return Array.from(roles);
  }, [myPosts]);

  if (loading) {
    return (
      <V2AppLayout user={user} currentPage="talent" onPageChange={onPageChange} topbarTitle="Browse Talent">
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-v2-border border-t-v2-blue" />
            <p className="font-body text-[12px] text-v2-muted">Loading talent…</p>
          </div>
        </div>
      </V2AppLayout>
    );
  }

  const topbarChips = [
    <V2Chip key="startup" variant="blue" dot>{startupName}</V2Chip>,
    <V2Chip key="count" variant="green">{talentList.length} talent available</V2Chip>,
  ];
  const topbarActions = (
    <>
      <V2Btn variant="secondary" size="sm" onClick={() => setShowApplications(true)}>
        <ClipboardList className="h-3.5 w-3.5" /> Review applications ({applications.length})
      </V2Btn>
      <V2Btn variant="secondary" size="sm" onClick={() => setShowShortlist(true)}>
        <Bookmark className="h-3.5 w-3.5" /> Shortlist ({shortlist.length})
      </V2Btn>
      <V2Btn variant="primary" size="sm" onClick={() => openOfferFor(null)}>Send offer</V2Btn>
    </>
  );

  return (
    <V2AppLayout
      user={user}
      currentPage="talent"
      onPageChange={onPageChange}
      rightPanel={
        <TalentRightPanel
          topMatches={topMatches}
          shortlist={shortlist}
          applications={applications}
          myPosts={myPosts}
          onOpenTalent={(t) => setActiveTalentId(talentUserId(t))}
          onSendOffer={openOfferFor}
        />
      }
      topbarTitle="Browse talent"
      topbarChips={topbarChips}
      topbarActions={topbarActions}
    >
      <div className="flex flex-col gap-4 p-4">
        <StatsRow
          talentCount={talentList.length}
          matchedCount={matchedCount}
          applicationCount={applications.length}
          shortlistCount={shortlist.length}
          onStatClick={handleStatClick}
        />

        <div className="flex items-center gap-2">
          <div className="flex h-9 flex-1 items-center gap-2 rounded-full border border-v2-border bg-v2-page px-3.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-v2-subtle" aria-hidden />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, skill, role, location..."
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
              {c}
            </button>
          ))}
        </div>

        {filteredTalent.length === 0 ? (
          <div className="rounded-[14px] border border-v2-border bg-white py-10 text-center">
            <p className="font-body text-[13px] text-v2-muted">No talent match this filter.</p>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {filteredTalent.map((t) => {
              const id = talentUserId(t);
              return (
                <TalentCard
                  key={id}
                  talent={t}
                  view="grid"
                  shortlisted={shortlistIds.has(id)}
                  onOpen={() => setActiveTalentId(id)}
                  onMessage={() => setActiveTalentId(id)}
                  onToggleShortlist={() => handleToggleShortlist(t)}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredTalent.map((t) => {
              const id = talentUserId(t);
              return (
                <TalentCard
                  key={id}
                  talent={t}
                  view="list"
                  shortlisted={shortlistIds.has(id)}
                  onOpen={() => setActiveTalentId(id)}
                  onMessage={() => setActiveTalentId(id)}
                  onToggleShortlist={() => handleToggleShortlist(t)}
                />
              );
            })}
          </div>
        )}
      </div>

      {activeTalent ? (
        <TalentDetailPanel
          talent={activeTalent}
          shortlisted={shortlistIds.has(talentUserId(activeTalent))}
          sendingMessage={sendingMessage}
          onClose={() => setActiveTalentId(null)}
          onToggleShortlist={() => handleToggleShortlist(activeTalent)}
          onSendOffer={() => { openOfferFor(talentUserId(activeTalent)); setActiveTalentId(null); }}
          onSendMessage={(text) => handleSendMessage(activeTalent, text)}
        />
      ) : null}

      <V2SendOfferModal
        open={showOffer}
        onClose={() => setShowOffer(false)}
        onSubmit={handleSendOffer}
        submitting={postingOffer}
        talentOptions={talentOptionsForOffer}
        roleOptions={roleOptionsForOffer}
        presetTalentId={offerPresetTalentId}
      />

      <ListModal title="Shortlisted candidates" open={showShortlist} onClose={() => setShowShortlist(false)} width={420}>
        {shortlist.length === 0 ? (
          <p className="py-6 text-center font-body text-[12px] text-v2-muted">Shortlist is empty. Browse talent and add candidates.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {shortlist.map((t) => {
              const name = t.fullName || t.name || t.talentName;
              return (
                <div key={t.id || t._id} className="flex items-center gap-2.5 rounded-[10px] bg-v2-page p-2.5">
                  <V2Avatar name={name} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-[12px] font-medium text-v2-heading">{name}</p>
                    <p className="truncate font-body text-[10px] text-v2-subtle">{t.professionalTitle || t.role}</p>
                  </div>
                  <V2Btn variant="secondary" size="sm" onClick={() => handleToggleShortlist(t)}>Remove</V2Btn>
                </div>
              );
            })}
          </div>
        )}
        {shortlist.length > 0 && (
          <V2Btn variant="primary" className="mt-3 w-full justify-center" onClick={() => { setShowShortlist(false); openOfferFor(null); }}>Send offer</V2Btn>
        )}
      </ListModal>

      <ListModal title="Review applications" open={showApplications} onClose={() => setShowApplications(false)} width={540}>
        {applications.length === 0 ? (
          <p className="py-6 text-center font-body text-[12px] text-v2-muted">No applications yet.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {applications.map((a) => {
              const candidate = talentList.find((t) => talentUserId(t) === String(a.talentId?._id || a.talentId));
              const name = a.talentId?.name || candidate?.fullName || candidate?.name || "Candidate";
              return (
                <div key={a._id || a.id} className="rounded-[12px] bg-v2-page p-3.5">
                  <div className="mb-2 flex items-center gap-2.5">
                    <V2Avatar name={name} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-body text-[13px] font-medium text-v2-heading">{name}</p>
                      <p className="truncate font-body text-[11px] text-v2-subtle">{a.position} · {timeAgo(a.createdAt)}</p>
                    </div>
                    {candidate ? (
                      <span className={cn("font-body text-[13px] font-medium", matchColor(candidate.matchScore || 0))}>{candidate.matchScore}%</span>
                    ) : null}
                    <V2Chip variant={a.status === "submitted" ? "amber" : "grey"}>{a.status || "submitted"}</V2Chip>
                  </div>
                  {(a.coverNote || a.coverLetter) ? (
                    <div className="mb-2 rounded-[8px] border border-v2-border bg-white p-2.5">
                      <p className="mb-1 font-body text-[10px] font-medium uppercase tracking-wide text-v2-subtle">Cover note</p>
                      <p className="font-body text-[11px] leading-relaxed text-v2-muted">{a.coverNote || a.coverLetter}</p>
                    </div>
                  ) : null}
                  <div className="flex gap-1.5">
                    {candidate ? (
                      <>
                        <V2Btn variant="secondary" size="sm" onClick={() => { setShowApplications(false); setActiveTalentId(talentUserId(candidate)); }}>View full profile</V2Btn>
                        <V2Btn variant="secondary" size="sm" onClick={() => handleToggleShortlist(candidate)}>
                          {shortlistIds.has(talentUserId(candidate)) ? "✓ Shortlisted" : "Shortlist"}
                        </V2Btn>
                        <V2Btn variant="primary" size="sm" onClick={() => { setShowApplications(false); openOfferFor(talentUserId(candidate)); }}>Send offer</V2Btn>
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ListModal>
    </V2AppLayout>
  );
}
