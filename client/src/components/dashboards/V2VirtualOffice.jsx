/**
 * V2VirtualOffice
 * ─────────────────────────────────────────────────────────────────────────────
 * V2 redesign of the Virtual Office: everything backed by real data via the
 * existing useOfficeStore (zero new API calls) — presence bar, real tasks,
 * real activity feed, a right panel with Team / Wins tabs, real 1:1 team
 * chat (SimpleTeamMessaging, embedded), and real LiveKit video calling
 * rendered inline with a pop-out-to-full-page option, fully V2-styled (see
 * client/src/components/calls/v2/ and CLAUDE.md).
 *
 * Still not built (see CLAUDE.md for why): "Check in for today" (no
 * check-in backend exists anywhere in the app).
 */

import React, { useEffect, useMemo, useState } from "react";
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
import { SimpleTeamMessaging } from "../office/SimpleTeamMessaging";
import { buildFounderChatRoster } from "../../utils/chatRosterBuilder";
import { useCallCoordinator } from "../../contexts/CallCoordinatorContext";
import V2CallRoom from "../calls/v2/V2CallRoom";

import { Users, ListChecks, UserPlus, ChevronRight, Video, PhoneCall } from "lucide-react";

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
    <V2Card className="flex flex-wrap items-center gap-3">
      <span className="shrink-0 font-body text-[11px] font-medium text-v2-muted">Present now</span>
      {online.length === 0 ? (
        <span className="font-body text-[12px] text-v2-subtle">No one online right now.</span>
      ) : (
        online.map((row) => (
          <div
            key={row.id}
            className="flex items-center gap-2 rounded-[10px] border border-v2-green-tint bg-v2-green-tint/40 px-3 py-1.5"
          >
            <V2Avatar name={row.name} size={28} />
            <div className="min-w-0">
              <p className="truncate font-body text-[12px] font-medium text-v2-heading">{row.name}</p>
              <p className="font-body text-[10px] text-v2-muted">{presenceStatus(row).label}</p>
            </div>
          </div>
        ))
      )}
      {offline.length > 0 ? (
        <span className="ml-auto shrink-0 font-body text-[10px] text-v2-subtle">
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
  const todaysTasks = tasks.slice(0, 6);
  return (
    <V2Card>
      <V2SectionHead
        title="Today's tasks"
        action={
          <button type="button" onClick={onManage} className="font-body text-[10px] text-v2-blue hover:underline">
            Manage →
          </button>
        }
      />
      {todaysTasks.length === 0 ? (
        <p className="py-4 text-center font-body text-[12px] text-v2-muted">No tasks yet.</p>
      ) : (
        <div className="flex flex-col">
          {todaysTasks.map((t) => {
            const isDone = t.status === "completed";
            const isBlocked = t.status === "blocked";
            return (
              <div key={t._id ?? t.id} className="flex items-center gap-2 border-b border-v2-border py-2 last:border-0">
                <div
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border-[1.5px]",
                    isDone ? "border-v2-blue bg-v2-blue" : isBlocked ? "border-red-400 bg-red-50" : "border-gray-300",
                  )}
                />
                <span className={cn("min-w-0 flex-1 truncate font-body text-[11px]", isDone ? "text-v2-muted line-through" : "text-v2-heading")}>
                  {t.title}
                </span>
                {t.assignedToName ? <V2Avatar name={t.assignedToName} size={20} /> : null}
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

    // Only one V2CallRoom (and therefore one LiveKitRoom connection) may be
    // mounted at a time — mounting both inline and fullpage simultaneously
    // opens two connections with the same token and gets the call dropped.
    if (poppedOut) {
      return (
        <div className="fixed inset-0 z-[999] h-dvh w-full">
          <V2CallRoom {...callRoomProps} variant="fullpage" />
        </div>
      );
    }

    return (
      <V2Card className="flex h-[520px] flex-col p-0">
        <V2CallRoom {...callRoomProps} variant="inline" />
      </V2Card>
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
          <p className="mt-1 max-w-[320px] font-body text-[12px] text-v2-muted">
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
// TEAM CHAT — real 1:1 messaging (SimpleTeamMessaging), embedded
// ─────────────────────────────────────────────────────────────────────────

function TeamChatCard({ user, startupId, teamMembers }) {
  const currentUserId = String(user?._id ?? user?.id ?? "");
  const roster = useMemo(
    () => buildFounderChatRoster(currentUserId, [], [], teamMembers),
    [currentUserId, teamMembers],
  );

  return (
    <V2Card className="flex flex-col p-0">
      <div className="flex items-center justify-between border-b border-v2-border px-4 py-3">
        <span className="font-body text-[12px] font-semibold text-v2-heading">Team chat</span>
        <span className="font-body text-[10px] text-v2-subtle">1:1 — pick a teammate</span>
      </div>
      <div className="h-[520px] overflow-hidden">
        {roster.length === 0 ? (
          <div className="flex h-full items-center justify-center px-4 text-center">
            <p className="font-body text-[12px] text-v2-muted">
              No team members to message yet. Invite someone to start chatting.
            </p>
          </div>
        ) : (
          <SimpleTeamMessaging
            currentUserId={currentUserId}
            currentUserName={user?.name ?? ""}
            currentUserRole={user?.role ?? "founder"}
            startupId={startupId}
            teamMembers={roster}
            embedded
          />
        )}
      </div>
    </V2Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// LIVE ACTIVITY FEED
// ─────────────────────────────────────────────────────────────────────────

function ActivityFeedCard({ activities }) {
  const recent = activities.slice(0, 8);
  return (
    <V2Card>
      <V2SectionHead title="Live activity feed" />
      {recent.length === 0 ? (
        <p className="py-4 text-center font-body text-[12px] text-v2-muted">No activity yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-x-4 gap-y-1 md:grid-cols-2">
          {recent.map((a) => (
            <div key={a.id} className="flex items-start gap-2 py-1.5">
              <V2Avatar name={a.userName} size={24} />
              <div className="min-w-0 flex-1">
                <p className="font-body text-[11px] leading-snug text-v2-muted">
                  <span className="font-medium text-v2-heading">{a.userName}</span> {a.message}
                </p>
                <p className="font-body text-[10px] text-v2-subtle">{timeAgo(a.timestamp)}</p>
              </div>
            </div>
          ))}
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
          <div key={id} className="flex items-center gap-2 rounded-[10px] border border-v2-border px-2.5 py-2">
            <V2Avatar name={m.name} size={32} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-body text-[12px] font-medium text-v2-heading">{m.name}</p>
              <p className="truncate font-body text-[10px] text-v2-muted capitalize">
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

function OfficeRightPanel({ teamMembers, presenceRows, wins, onPostWin, activeOutcome, weekPct }) {
  const [tab, setTab] = useState("team");
  const [posting, setPosting] = useState(false);

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
          { id: "wins", label: "Wins" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 border-b-2 py-3 font-body text-[12px] font-medium transition-colors",
              tab === t.id ? "border-v2-blue text-v2-blue" : "border-transparent text-v2-subtle hover:text-v2-heading",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 p-3">
        {/* This week's goal snippet — always visible above the tabs' content */}
        <div className="rounded-[10px] bg-v2-page p-3">
          <p className="font-body text-[10px] font-semibold uppercase tracking-wide text-v2-subtle">This week's goal</p>
          <p className="mt-1 font-body text-[12px] font-medium leading-snug text-v2-heading">
            {activeOutcome?.goal ?? "No goal set this week."}
          </p>
          {activeOutcome ? (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1 flex-1 rounded-full bg-v2-border">
                <div className="h-full rounded-full bg-v2-blue" style={{ width: `${weekPct}%` }} />
              </div>
              <span className="font-body text-[10px] font-medium text-v2-blue-dark">{weekPct}%</span>
            </div>
          ) : null}
        </div>

        {tab === "team" ? (
          <RightPanelTeamTab teamMembers={teamMembers} presenceRows={presenceRows} />
        ) : (
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

  const viewModel = useWeeklyLoopStore((s) => s.viewModel);
  const loadWeeklyLoop = useWeeklyLoopStore((s) => s.load);
  const activeOutcome = viewModel?.activeOutcome ?? null;
  const weekPct = viewModel?.metrics?.milestoneProgress ?? 0;

  const startupName = user?.startup?.name ?? "Your Startup";
  const onlineCount = presenceRows.filter((r) => r.isOnline).length;
  const userId = String(user?._id ?? user?.id ?? "");

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
      activeOutcome={activeOutcome}
      weekPct={weekPct}
    />
  );

  const topbarChips = [
    <V2Chip key="presence" variant="green" dot>
      {startupName} Office · {onlineCount} member{onlineCount === 1 ? "" : "s"} present
    </V2Chip>,
  ];

  const topbarActions = (
    <>
      <V2Btn variant="secondary" size="sm" onClick={() => onPageChange("execution-engine")}>
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
        <PresenceBar presenceRows={presenceRows} />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
          <LiveSessionCard />
          <div className="flex flex-col gap-4">
            <TodaysTasksCard tasks={tasks} onManage={() => onPageChange("execution-engine")} />
            <TeamChatCard user={user} startupId={startupId} teamMembers={teamMembers} />
          </div>
        </div>

        <ActivityFeedCard activities={activities} />
      </div>
    </V2AppLayout>
  );
}
