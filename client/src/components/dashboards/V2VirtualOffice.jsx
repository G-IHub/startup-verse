/**
 * V2VirtualOffice
 * ─────────────────────────────────────────────────────────────────────────────
 * V2 redesign of the Virtual Office: everything backed by real data via the
 * existing useOfficeStore (zero new API calls) — presence bar, real tasks,
 * real activity feed, a right panel with Team / Wins tabs, real 1:1 team
 * chat (SimpleTeamMessaging, embedded), real LiveKit video calling rendered
 * inline with a pop-out-to-full-page option, and a real slide-out task
 * management Kanban ("View all tasks" / "Manage"), all fully V2-styled (see
 * client/src/components/calls/v2/, client/src/components/office/v2/, and
 * CLAUDE.md).
 *
 * Still not built (see CLAUDE.md for why): "Check in for today" (no
 * check-in backend exists anywhere in the app).
 */

import React, { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "../ui/utils";

import V2AppLayout from "../layout/V2AppLayout";
import {
  V2Card,
  V2SectionHead,
  V2Chip,
  V2Avatar,
  V2Btn,
  V2Dot,
} from "../shared/v2-primitives";

import { useOfficeStore } from "../../state/useOfficeStore";
import { useWeeklyLoopStore } from "../../state/useWeeklyLoopStore";
import { V2TeamChatPane } from "../office/v2/V2TeamChatPane";
import { useCallCoordinator } from "../../contexts/CallCoordinatorContext";
// Lazy — pulls in the LiveKit SDK, previously downloaded by every founder
// who simply opened Virtual Office (a common page) whether or not they
// ever started a call. Only rendered when `activeCall` is set (see the
// `if (activeCall)` guard below), so lazy-loading it has no effect on the
// common "no call yet" path.
const V2CallRoom = lazy(() => import("../calls/v2/V2CallRoom"));
import { V2TaskManagementPanel } from "../office/v2/V2TaskManagementPanel";

import { Users, ListChecks, UserPlus, MessageSquare, X, Video, PhoneCall } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────

function timeAgo(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function presenceStatus(row) {
  if (row.isOnline) {
    // row.activity can be an object (metadata.lastFeedActivity) or a plain
    // string depending on source — never render it raw.
    const activityLabel =
      typeof row.activity === "string" ? row.activity : row.activity?.message;
    return { label: row.statusText || activityLabel || "Online", variant: "green" };
  }
  return { label: row.statusText || "Offline", variant: "grey" };
}

// ─────────────────────────────────────────────────────────────────────────
// PRESENCE BAR
// ─────────────────────────────────────────────────────────────────────────

function PresenceBar({ presenceRows }) {
  const online = presenceRows.filter((r) => r.isOnline);
  const offline = presenceRows.filter((r) => !r.isOnline);

  return (
    <V2Card className="flex flex-wrap items-center gap-2.5 px-3 py-2">
      <span className="shrink-0 font-body text-[10px] font-medium text-v2-muted">Present now</span>
      {online.length === 0 ? (
        <span className="font-body text-[10px] text-v2-subtle">No one online right now.</span>
      ) : (
        online.map((row) => (
          <div
            key={row.id}
            className="flex items-center gap-1.5 rounded-[8px] border border-v2-green-tint bg-v2-green-tint/40 px-2 py-1"
          >
            <V2Avatar name={row.name} size={22} />
            <div className="min-w-0">
              <p className="truncate font-body text-[10px] font-medium text-v2-heading">{row.name}</p>
              <p className="font-body text-[9px] text-v2-muted">{presenceStatus(row).label}</p>
            </div>
          </div>
        ))
      )}
      {offline.length > 0 ? (
        <span className="ml-auto shrink-0 font-body text-[9px] text-v2-subtle">
          {offline.map((r) => r.name).join(", ")} · offline
        </span>
      ) : null}
    </V2Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// TODAY'S TASKS
// ─────────────────────────────────────────────────────────────────────────

function TodaysTasksCard({ tasks, onManage }) {
  const updateTaskStatus = useOfficeStore((s) => s.updateTaskStatus);
  const todaysTasks = tasks.slice(0, 6);

  const handleToggle = async (t) => {
    const next = t.status === "completed" ? "in-progress" : "completed";
    try {
      await updateTaskStatus(t._id ?? t.id, next);
    } catch (_) { /* best-effort */ }
  };

  return (
    <V2Card className="px-3 py-2.5">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-heading text-[11px] font-semibold text-v2-heading">Today's tasks</span>
        <button type="button" onClick={onManage} className="font-body text-[9px] text-v2-blue hover:underline">
          Manage →
        </button>
      </div>
      {todaysTasks.length === 0 ? (
        <p className="py-2 text-center font-body text-[10px] text-v2-muted">No tasks yet.</p>
      ) : (
        <div className="flex flex-col">
          {todaysTasks.map((t) => {
            const isDone = t.status === "completed";
            const isBlocked = t.status === "blocked";
            return (
              <div key={t._id ?? t.id} className="flex items-center gap-2 border-b border-v2-border py-1.5 last:border-0">
                <button
                  type="button"
                  onClick={() => handleToggle(t)}
                  aria-label={isDone ? "Mark incomplete" : "Mark complete"}
                  className={cn(
                    "flex h-3.5 w-3.5 shrink-0 cursor-pointer items-center justify-center rounded-[3px] border-[1.5px] transition-colors",
                    isDone
                      ? "border-v2-blue bg-v2-blue hover:opacity-70"
                      : isBlocked
                      ? "border-red-400 bg-red-50 hover:bg-red-100"
                      : "border-gray-300 hover:border-v2-blue",
                  )}
                >
                  {isDone && (
                    <svg className="h-2 w-2 text-white" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <span className={cn("min-w-0 flex-1 truncate font-body text-[10px]", isDone ? "text-v2-muted line-through" : "text-v2-heading")}>
                  {t.title}
                </span>
                {t.assignedToName ? <V2Avatar name={t.assignedToName} size={18} /> : null}
              </div>
            );
          })}
        </div>
      )}
    </V2Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// LIVE SESSION — real LiveKit calls via the shared CallCoordinator.
// Renders inline (a V2-styled call view sized to the dashboard card) by
// default, matching the mockup's "video composed inline" concept, with a
// pop-out icon (in V2CallRoom's header) to expand into a full-page V2 view
// within the app. Both presentations use the same V2Call* component tree —
// see CLAUDE.md for the CallCoordinatorProvider `renderOverlay={false}` /
// `CallRoomComponent` wiring that makes this possible without touching V1.
// ─────────────────────────────────────────────────────────────────────────

function LiveSessionCard() {
  const {
    teamLiveCall,
    activeCall,
    startTeamCall,
    joinCall,
    leaveCall,
    loading,
    currentUserId,
    userName,
    userRole,
    startupId,
    teamRoster,
    callTitle,
  } = useCallCoordinator();
  const isLive = Boolean(teamLiveCall) && !activeCall;
  const [poppedOut, setPoppedOut] = useState(false);

  useEffect(() => {
    if (!activeCall) setPoppedOut(false);
  }, [activeCall]);

  if (activeCall) {
    const callRoomProps = {
      token: activeCall.token,
      roomName: activeCall.roomName,
      callType: activeCall.callType,
      callTitle,
      currentUserId,
      initiatorId: activeCall.initiatorId,
      startupId: activeCall.startupId || startupId,
      userName,
      userRole,
      teamRoster,
      onTogglePopout: () => setPoppedOut((v) => !v),
      onLeave: leaveCall,
    };

    // ── Overlay expand: NEVER remount V2CallRoom — toggling poppedOut only
    // changes CSS classes on the wrappers. Keeping the same component tree
    // position means LiveKitRoom stays connected (no token re-use / drop).
    // The backdrop div is always rendered (opacity/pointer-events toggle) so
    // V2Card stays at a stable index in the fragment — guaranteed no remount.
    return (
      <>
        {/* Dark backdrop — always in the tree, invisible when inline */}
        <div
          className={cn(
            "fixed inset-0 z-[998] bg-black/60 backdrop-blur-sm transition-opacity duration-200",
            poppedOut ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
          )}
          onClick={() => setPoppedOut(false)}
        />

        {/* Call card — same element, only className changes */}
        <V2Card
          className={
            poppedOut
              ? "fixed inset-2 z-[999] flex flex-col overflow-hidden rounded-2xl p-0 shadow-2xl md:inset-3"
              : "flex h-[620px] flex-col overflow-hidden p-0"
          }
        >
          <Suspense fallback={
            <div className="flex h-full w-full items-center justify-center font-body text-[13px] text-v2-muted">Connecting…</div>
          }>
            <V2CallRoom
              {...callRoomProps}
              variant={poppedOut ? "fullpage" : "inline"}
            />
          </Suspense>
        </V2Card>
      </>
    );
  }

  return (
    <V2Card className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center">
      <div className={cn(
        "flex h-12 w-12 items-center justify-center rounded-full",
        isLive ? "bg-v2-green-tint" : "bg-v2-blue-tint",
      )}>
        {isLive ? <PhoneCall className="h-5 w-5 text-v2-green" /> : <Video className="h-5 w-5 text-v2-blue" />}
      </div>
      {isLive ? (
        <div>
          <p className="font-heading text-[14px] font-semibold text-v2-heading">
            {teamLiveCall.initiatorName} started a call
          </p>
          <p className="mt-1 font-body text-[12px] text-v2-muted">Join to see and hear the team live.</p>
          <V2Btn
            variant="primary"
            size="sm"
            className="mt-3"
            onClick={() => joinCall(teamLiveCall.roomName, teamLiveCall.callType)}
            disabled={loading}
          >
            <PhoneCall className="h-3.5 w-3.5" />
            Join call
          </V2Btn>
        </div>
      ) : (
        <div>
          <p className="font-heading text-[14px] font-semibold text-v2-heading">No live session right now</p>
          <p className="mt-1 whitespace-nowrap font-body text-[12px] text-v2-muted">
            Start a video call and everyone currently in the office gets notified.
          </p>
          <V2Btn
            variant="primary"
            size="sm"
            className="mt-3"
            onClick={() => startTeamCall("video")}
            disabled={loading}
          >
            <Video className="h-3.5 w-3.5" />
            Start video call
          </V2Btn>
        </div>
      )}
    </V2Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// TEAM CHAT — compact card with "Full chat →" popout
// ─────────────────────────────────────────────────────────────────────────

function CompactChatCard({ teamMembers, onExpand }) {
  const online = teamMembers.filter((m) => m.isOnline);
  const shown = teamMembers.slice(0, 5);

  return (
    <V2Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-body text-[12px] font-semibold text-v2-heading">Team chat</span>
        <button
          type="button"
          onClick={onExpand}
          className="font-body text-[11px] font-medium text-v2-blue hover:underline"
        >
          Full chat →
        </button>
      </div>
      {shown.length === 0 ? (
        <p className="py-2 text-center font-body text-[11px] text-v2-muted">
          No teammates yet.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {shown.map((m) => {
            const id = String(m._id ?? m.id ?? "");
            return (
              <button
                key={id}
                type="button"
                onClick={onExpand}
                className="flex w-full items-center gap-2 rounded-[8px] px-2 py-1.5 hover:bg-v2-page text-left transition-colors"
              >
                <V2Avatar name={m.name} size={26} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-body text-[11px] font-medium text-v2-heading">{m.name}</p>
                  <p className="truncate font-body text-[10px] text-v2-muted capitalize">{m.role || "Team member"}</p>
                </div>
                <V2Dot variant={m.isOnline ? "green" : "grey"} />
              </button>
            );
          })}
        </div>
      )}
      <button
        type="button"
        onClick={onExpand}
        className="flex w-full items-center justify-center gap-1.5 rounded-[8px] border border-v2-border bg-v2-page py-2 font-body text-[11px] font-medium text-v2-muted hover:border-v2-blue hover:text-v2-blue transition-colors"
      >
        <MessageSquare className="h-3.5 w-3.5" />
        {online.length > 0 ? `${online.length} online · Open chat` : "Open team chat"}
      </button>
    </V2Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// CHAT POPOUT DRAWER
// ─────────────────────────────────────────────────────────────────────────

function ChatPopout({ open, onClose, user, startupId, teamMembers }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[500] flex items-stretch justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div className="relative z-10 flex h-full w-[420px] max-w-[90vw] flex-col bg-v2-surface shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-v2-border px-4 py-3">
          <span className="font-heading text-[13px] font-semibold text-v2-heading">Team Chat</span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-v2-muted hover:bg-v2-page hover:text-v2-heading"
            aria-label="Close chat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <V2TeamChatPane user={user} startupId={startupId} teamMembers={teamMembers} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// INLINE CHAT CARD — full SimpleTeamMessaging embedded in the right column
// ─────────────────────────────────────────────────────────────────────────

function InlineChatCard({ user, startupId, teamMembers, onExpand }) {
  return (
    <V2Card className="flex h-[620px] flex-col overflow-hidden p-0">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-v2-border px-4 py-3">
        <span className="font-heading text-[13px] font-semibold text-v2-heading">Team chat</span>
        <button
          type="button"
          onClick={onExpand}
          className="font-body text-[12px] font-medium text-v2-blue hover:underline"
        >
          Full chat →
        </button>
      </div>

      {/* Chat body */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <V2TeamChatPane user={user} startupId={startupId} teamMembers={teamMembers} />
      </div>
    </V2Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// LIVE ACTIVITY FEED
// ─────────────────────────────────────────────────────────────────────────

function ActivityFeedCard({ activities, onViewAll }) {
  const visible = activities.slice(0, 6);

  return (
    <V2Card className="px-4 py-3">
      {/* Header row */}
      <div className="mb-2.5 flex items-center justify-between">
        <span className="font-heading text-[12px] font-semibold text-v2-heading">Live activity feed</span>
        <button
          type="button"
          onClick={onViewAll}
          className="font-body text-[11px] font-medium text-v2-blue hover:underline"
        >
          View all →
        </button>
      </div>

      {activities.length === 0 ? (
        <p className="py-1 text-center font-body text-[11px] text-v2-muted">No activity yet.</p>
      ) : (
        /* 3 columns × 2 rows with dividers */
        <div className="grid grid-cols-3">
          {visible.map((a, index) => {
            const isLastCol = (index + 1) % 3 === 0;
            const isFirstRow = index < 3;
            return (
              <div
                key={a.id}
                className={cn(
                  "flex min-w-0 items-start gap-1.5 px-4 py-1.5",
                  !isLastCol && "border-r border-v2-border",
                  isFirstRow && "border-b border-v2-border",
                  index % 3 === 0 && "pl-0",
                  isLastCol && "pr-0",
                )}
              >
                <V2Avatar name={a.userName} size={22} className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-body text-[10px] leading-snug text-v2-muted">
                    <span className="font-semibold text-v2-heading">{a.userName}</span>{" "}
                    {a.message}
                  </p>
                  <p className="font-body text-[9px] text-v2-subtle">{timeAgo(a.timestamp)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </V2Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// RIGHT PANEL — Team / Wins tabs
// ─────────────────────────────────────────────────────────────────────────

function RightPanelTeamTab({ teamMembers, presenceRows }) {
  const presenceById = useMemo(() => {
    const map = {};
    for (const r of presenceRows) map[r.userId] = r;
    return map;
  }, [presenceRows]);

  if (teamMembers.length === 0) {
    return <p className="py-4 text-center font-body text-[12px] text-v2-muted">No team members yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {teamMembers.map((m) => {
        const id = String(m._id ?? m.id ?? "");
        const presence = presenceById[id];
        const isOnline = presence?.isOnline ?? false;
        return (
          <div key={id} className="flex items-center gap-2 rounded-[8px] border border-v2-border px-2 py-1.5">
            <V2Avatar name={m.name} size={26} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-body text-[10px] font-medium text-v2-heading">{m.name}</p>
              <p className="truncate font-body text-[9px] text-v2-muted capitalize">
                {m.role || "Team Member"}
                {presence?.statusText ? ` · ${presence.statusText}` : ""}
              </p>
            </div>
            <V2Dot variant={isOnline ? "green" : "grey"} />
          </div>
        );
      })}
    </div>
  );
}

function RightPanelWinsTab({ wins, onPostWin, posting }) {
  const [draft, setDraft] = useState("");

  const handlePost = async () => {
    const text = draft.trim();
    if (!text) return;
    await onPostWin(text);
    setDraft("");
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Share a win with the team..."
          rows={2}
          className="w-full resize-none rounded-[10px] border border-v2-border bg-v2-page p-2.5 font-body text-[12px] text-v2-heading outline-none focus:border-v2-blue"
        />
        <V2Btn variant="primary" size="sm" onClick={handlePost} disabled={posting || !draft.trim()}>
          Post a win
        </V2Btn>
      </div>
      {wins.length === 0 ? (
        <p className="py-4 text-center font-body text-[12px] text-v2-muted">No wins posted yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {wins.map((w) => (
            <div key={w.id} className="rounded-r-[10px] border-l-[3px] border-v2-green bg-v2-page px-3 py-2">
              <p className="font-body text-[11px] font-medium text-v2-green-dark">{w.userName}</p>
              <p className="mt-0.5 font-body text-[11px] leading-snug text-v2-heading">{w.message}</p>
              <p className="mt-1 font-body text-[10px] text-v2-subtle">{timeAgo(w.timestamp)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OfficeRightPanel({ teamMembers, presenceRows, wins, onPostWin, activities, activeOutcome, weekPct, controlledTab, onTabChange, tasks, onManageTasks }) {
  const [tab, setTab] = useState(controlledTab ?? "team");
  const [posting, setPosting] = useState(false);

  // Sync when parent switches the tab (e.g. "View all activity")
  useEffect(() => {
    if (controlledTab) setTab(controlledTab);
  }, [controlledTab]);

  const handlePostWin = async (message) => {
    setPosting(true);
    try {
      await onPostWin(message);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-v2-border">
        {[
          { id: "team", label: "Team" },
          { id: "activity", label: "Activity" },
          { id: "wins", label: "Wins" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 border-b-2 py-2 font-body text-[10px] font-medium transition-colors",
              tab === t.id ? "border-v2-blue text-v2-blue" : "border-transparent text-v2-subtle hover:text-v2-heading",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 p-3">
        {/* This week's goal snippet — always visible above the tabs' content */}
        <div className="rounded-[8px] bg-v2-page px-2.5 py-2">
          <p className="font-body text-[9px] font-semibold uppercase tracking-wide text-v2-subtle">This week's goal</p>
          <p className="mt-0.5 font-body text-[10px] font-medium leading-snug text-v2-heading">
            {activeOutcome?.goal ?? "No goal set this week."}
          </p>
          {activeOutcome ? (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1 flex-1 rounded-full bg-v2-border">
                <div className="h-full rounded-full bg-v2-blue" style={{ width: `${weekPct}%` }} />
              </div>
              <span className="font-body text-[9px] font-medium text-v2-blue-dark">{weekPct}%</span>
            </div>
          ) : null}
        </div>

        {tab === "team" && (
          <>
            <RightPanelTeamTab teamMembers={teamMembers} presenceRows={presenceRows} />
            <TodaysTasksCard tasks={tasks ?? []} onManage={onManageTasks} />
          </>
        )}
        {tab === "activity" && (
          <div className="flex flex-col gap-1">
            {(activities ?? []).length === 0 ? (
              <p className="py-4 text-center font-body text-[10px] text-v2-muted">No activity yet.</p>
            ) : (
              (activities ?? []).slice(0, 20).map((a) => (
                <div key={a.id} className="flex items-start gap-1.5 rounded-[8px] bg-v2-page px-2 py-1.5">
                  <V2Avatar name={a.userName} size={20} />
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-[10px] leading-snug text-v2-muted">
                      <span className="font-medium text-v2-heading">{a.userName}</span>{" "}{a.message}
                    </p>
                    <p className="font-body text-[9px] text-v2-subtle">{timeAgo(a.timestamp)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        {tab === "wins" && (
          <RightPanelWinsTab wins={wins} onPostWin={handlePostWin} posting={posting} />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────

export default function V2VirtualOffice({ user, onPageChange }) {
  const navigate = useNavigate();

  const loadWorkspace = useOfficeStore((s) => s.loadWorkspace);
  const loading = useOfficeStore((s) => s.loading);
  const teamMembers = useOfficeStore((s) => s.teamMembers);
  const presenceRows = useOfficeStore((s) => s.presenceRows);
  const activities = useOfficeStore((s) => s.activities);
  const wins = useOfficeStore((s) => s.wins);
  const tasks = useOfficeStore((s) => s.tasks);
  const createWin = useOfficeStore((s) => s.createWin);
  const startupId = useOfficeStore((s) => s.startupId);
  const founderId = useOfficeStore((s) => s.founderId);
  const refreshOffice = useOfficeStore((s) => s.refresh);

  const viewModel = useWeeklyLoopStore((s) => s.viewModel);
  const loadWeeklyLoop = useWeeklyLoopStore((s) => s.load);
  const activeOutcome = viewModel?.activeOutcome ?? null;
  const weekPct = viewModel?.metrics?.milestoneProgress ?? 0;

  const startupName = user?.startup?.name ?? "Your Startup";
  const onlineCount = presenceRows.filter((r) => r.isOnline).length;
  const userId = String(user?._id ?? user?.id ?? "");

  const teamMembersWithPresence = useMemo(() => {
    const presenceById = {};
    for (const r of presenceRows) presenceById[String(r.userId ?? r.id ?? "")] = r;
    return teamMembers.map((m) => {
      const pid = String(m._id ?? m.id ?? "");
      return { ...m, isOnline: presenceById[pid]?.isOnline ?? false };
    });
  }, [teamMembers, presenceRows]);

  const [taskPanelOpen, setTaskPanelOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState(null);
  // V2 has no per-task detail route yet — send "task-detail" clicks to the
  // Execution Engine (where real task detail lives) instead of a dead link.
  const handleTaskPanelNavigate = (target) => {
    setTaskPanelOpen(false);
    onPageChange(target === "dashboard" ? "dashboard" : "execution-engine");
  };

  useEffect(() => {
    if (user) loadWorkspace(user);
  }, [user, loadWorkspace]);

  // Landing here directly (not via Dashboard/Execution Engine first) leaves
  // the weekly-loop store unhydrated — fetch it too if that's the case.
  useEffect(() => {
    if (userId && !viewModel) loadWeeklyLoop(userId);
  }, [userId, viewModel, loadWeeklyLoop]);

  const rightPanel = (
    <OfficeRightPanel
      teamMembers={teamMembers}
      presenceRows={presenceRows}
      wins={wins}
      onPostWin={(message) => createWin({ message })}
      activities={activities}
      activeOutcome={activeOutcome}
      weekPct={weekPct}
      controlledTab={rightPanelTab}
      onTabChange={setRightPanelTab}
      tasks={tasks}
      onManageTasks={() => setTaskPanelOpen(true)}
    />
  );

  const topbarChips = [
    <V2Chip key="presence" variant="green" dot>
      {startupName} Office · {onlineCount} member{onlineCount === 1 ? "" : "s"} present
    </V2Chip>,
  ];

  const topbarActions = (
    <>
      <V2Btn variant="secondary" size="sm" onClick={() => setTaskPanelOpen(true)}>
        <ListChecks className="h-3.5 w-3.5" />
        View all tasks
      </V2Btn>
      <V2Btn variant="primary" size="sm" onClick={() => navigate("/browse-talent")}>
        <UserPlus className="h-3.5 w-3.5" />
        Invite
      </V2Btn>
    </>
  );

  if (loading && teamMembers.length === 0 && presenceRows.length === 0) {
    return (
      <V2AppLayout user={user} currentPage="startup-office" onPageChange={onPageChange} topbarTitle="Virtual Office">
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-v2-border border-t-v2-blue" />
            <p className="font-body text-[12px] text-v2-muted">Loading your office…</p>
          </div>
        </div>
      </V2AppLayout>
    );
  }

  return (
    <V2AppLayout
      user={user}
      currentPage="startup-office"
      onPageChange={onPageChange}
      rightPanel={rightPanel}
      topbarTitle="Virtual Office"
      topbarChips={topbarChips}
      topbarActions={topbarActions}
    >
      <div className="flex flex-col gap-4 p-4">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_300px]">
          <LiveSessionCard />
          <InlineChatCard
            user={user}
            startupId={startupId}
            teamMembers={teamMembersWithPresence}
            onExpand={() => setChatOpen(true)}
          />
        </div>

        <ActivityFeedCard
          activities={activities}
          onViewAll={() => setRightPanelTab("activity")}
        />
      </div>

      <V2TaskManagementPanel
        open={taskPanelOpen}
        onClose={() => setTaskPanelOpen(false)}
        user={user}
        startupId={startupId}
        founderIdOverride={founderId || userId}
        strictMode
        onTasksSynced={() => refreshOffice(user)}
        onNavigate={handleTaskPanelNavigate}
      />

      <ChatPopout
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        user={user}
        startupId={startupId}
        teamMembers={teamMembers}
      />
    </V2AppLayout>
  );
}
