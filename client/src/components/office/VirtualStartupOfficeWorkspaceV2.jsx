import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  CircleDot,
  Command,
  Filter,
  HelpCircle,
  Plus,
  PhoneCall,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { cn } from "../ui/utils";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "../ui/drawer";
import { TaskManagementPanel } from "./TaskManagementPanel";
import { TeamHubPanel } from "./TeamHubPanel";
import CalendarHubPanel from "./CalendarHubPanel";
import MeetingScheduler from "../calendar/MeetingScheduler";
import { useCallCoordinator } from "../../contexts/CallCoordinatorContext";
import { useOfficePanels } from "../../domains/office/hooks/useOfficePanels";
import { useOfficeWorkspaceData } from "../../domains/office/hooks/useOfficeWorkspaceData";
import { useOfficeStore } from "../../state/useOfficeStore";
import PresenceIndicator from "../presence/PresenceIndicator";

function formatRelativeTime(dateValue) {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue || Date.now());
  if (Number.isNaN(date.getTime())) return "just now";
  const deltaMs = Date.now() - date.getTime();
  const deltaMinutes = Math.floor(deltaMs / 60000);
  if (deltaMinutes < 1) return "just now";
  if (deltaMinutes < 60) return `${deltaMinutes}m ago`;
  const deltaHours = Math.floor(deltaMinutes / 60);
  if (deltaHours < 24) return `${deltaHours}h ago`;
  return `${Math.floor(deltaHours / 24)}d ago`;
}

function getTaskBadgeVariant(status) {
  if (status === "completed") return "default";
  if (status === "blocked") return "destructive";
  return "secondary";
}

function getPanelTitle(panelKey) {
  if (panelKey === "tasks") return "My Tasks";
  if (panelKey === "updates") return "Team Updates";
  if (panelKey === "calendar") return "Calendar";
  return "Workspace";
}

function getPanelDescription(panelKey) {
  if (panelKey === "tasks") return "Track assigned work and jump into task management.";
  if (panelKey === "updates") return "Announcements, wins, and team pulse in one place.";
  if (panelKey === "calendar") return "Upcoming timeline and meeting scheduling.";
  return "Workspace tools";
}

function getDayGreeting(now = new Date()) {
  const hours = now.getHours();
  if (hours < 12) return "Good morning";
  if (hours < 17) return "Good afternoon";
  return "Good evening";
}

function getInitials(name) {
  return String(name || "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function buildMonthGrid(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startWeekday; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

const ACTIVITY_PRESETS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "3days", label: "3 days" },
];

function getPresetRange(key) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  if (key === "today") return { from: startOfToday, to: endOfToday };
  if (key === "yesterday") {
    const yStart = new Date(startOfToday); yStart.setDate(yStart.getDate() - 1);
    const yEnd = new Date(endOfToday); yEnd.setDate(yEnd.getDate() - 1);
    return { from: yStart, to: yEnd };
  }
  if (key === "3days") {
    const d3 = new Date(startOfToday); d3.setDate(d3.getDate() - 2);
    return { from: d3, to: endOfToday };
  }
  return null;
}

function parseInputDate(str, isEnd = false) {
  if (!str) return null;
  const parts = str.split("-");
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map(Number);
  if (!y || !m || !d || Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return null;
  const date = isEnd
    ? new Date(y, m - 1, d, 23, 59, 59, 999)
    : new Date(y, m - 1, d, 0, 0, 0, 0);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function toInputValue(date) {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function ActivityDateFilter({ activities, children }) {
  const [preset, setPreset] = useState(null);
  const [showCustom, setShowCustom] = useState(false);
  const [fromStr, setFromStr] = useState("");
  const [toStr, setToStr] = useState("");
  const [customError, setCustomError] = useState("");

  const todayStr = toInputValue(new Date());

  const handlePreset = (key) => {
    setPreset((prev) => (prev === key ? null : key));
    setShowCustom(false);
    setFromStr("");
    setToStr("");
    setCustomError("");
  };

  const handleFromChange = (val) => {
    setFromStr(val);
    setPreset(null);
    setCustomError("");
  };

  const handleToChange = (val) => {
    setToStr(val);
    setPreset(null);
    setCustomError("");
  };

  const customRange = useMemo(() => {
    if (!fromStr && !toStr) return null;
    const from = parseInputDate(fromStr, false);
    const to = parseInputDate(toStr, true);
    const now = new Date();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (fromStr && !from) return { error: "Invalid 'From' date." };
    if (toStr && !to) return { error: "Invalid 'To' date." };
    if (from && from > endOfToday) return { error: "'From' date cannot be in the future." };
    if (to && to > endOfToday) return { error: "'To' cannot be after today." };
    if (from && to && from > to) return { error: "'From' must be before 'To'." };
    if (!fromStr) return { error: "Set a 'From' date to use a custom range." };
    return { from, to: to || endOfToday };
  }, [fromStr, toStr]);

  const filtered = useMemo(() => {
    let range = null;
    if (preset) range = getPresetRange(preset);
    else if (customRange && !customRange.error) range = customRange;
    if (!range) return activities;
    return activities.filter((a) => {
      const ts = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
      if (Number.isNaN(ts.getTime())) return false;
      return ts >= range.from && ts <= range.to;
    });
  }, [activities, preset, customRange]);

  const hasActiveFilter = Boolean(preset) || Boolean(fromStr);
  const error = customRange?.error || "";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {/* Tier 1: full-width segmented preset control */}
      <div className="shrink-0 rounded-input border border-surface-border bg-surface-page p-0.5">
        <div className="grid grid-cols-3 gap-0.5">
          {ACTIVITY_PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => handlePreset(p.key)}
              className={cn(
                "h-8 cursor-pointer rounded-[6px] font-body text-[11px] font-medium transition-all duration-200 ease-in-out",
                preset === p.key
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-body hover:bg-surface-card hover:text-primary",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tier 2: Custom + Reset */}
      <div className="flex shrink-0 items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => { setShowCustom((v) => !v); setPreset(null); }}
          className={cn(
            "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-input border bg-surface-card px-3 font-body text-[11px] font-medium transition-all duration-200 ease-in-out hover:border-primary hover:text-primary",
            showCustom ? "border-primary text-primary" : "border-surface-border text-text-body",
          )}
        >
          <Filter className="h-3 w-3 shrink-0" />
          Custom
          <ChevronRight className={cn("h-3 w-3 shrink-0 transition-transform duration-200", showCustom && "rotate-90")} />
        </button>
        {hasActiveFilter && (
          <button
            type="button"
            onClick={() => { setPreset(null); setFromStr(""); setToStr(""); setCustomError(""); setShowCustom(false); }}
            className="inline-flex h-8 items-center gap-1 rounded-input px-2 font-body text-[11px] font-medium text-text-muted transition-colors duration-200 ease-in-out hover:text-destructive"
          >
            <X className="h-3 w-3 shrink-0" />
            Reset
          </button>
        )}
      </div>

      {/* Custom date range panel */}
      {showCustom && (
        <div className="space-y-2 rounded-card border border-surface-border bg-primary-tint/40 px-3 pb-3 pt-2.5">
          <div className="mb-1 flex items-center gap-1.5">
            <Calendar className="h-3 w-3 text-text-muted" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">Custom range</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-text-muted">From</label>
              <input
                type="date"
                value={fromStr}
                max={todayStr}
                onChange={(e) => handleFromChange(e.target.value)}
                className="h-7 w-full rounded-input border border-surface-border bg-surface-card px-2 text-[11px] text-text-heading transition-all duration-200 ease-in-out focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-text-muted">To</label>
              <input
                type="date"
                value={toStr}
                max={todayStr}
                min={fromStr || undefined}
                onChange={(e) => handleToChange(e.target.value)}
                className="h-7 w-full rounded-input border border-surface-border bg-surface-card px-2 text-[11px] text-text-heading transition-all duration-200 ease-in-out focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
              />
            </div>
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-1.5 rounded-lg border border-destructive/20 bg-destructive/5 px-2.5 py-1.5">
          <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-destructive" />
          <p className="text-[10px] text-destructive">{error}</p>
        </div>
      )}

      {children(filtered, hasActiveFilter)}
    </div>
  );
}

function OfficePanelCard({ title, action, children, className = "", fill = false }) {
  return (
    <Card
      className={cn(
        "office-animate-in rounded-card border border-surface-border bg-surface-card shadow-soft transition-shadow duration-200 ease-in-out hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)]",
        fill && "flex h-full flex-col",
        className,
      )}
    >
      <CardHeader className="shrink-0 border-0 bg-surface-card px-5 pb-2 pt-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="font-heading text-base font-semibold text-text-heading">
            {title}
          </CardTitle>
          {action}
        </div>
      </CardHeader>
      <CardContent
        className={cn(
          "px-5 pb-5",
          fill ? "flex min-h-0 flex-1 flex-col space-y-2.5" : "space-y-2.5",
        )}
      >
        {children}
      </CardContent>
    </Card>
  );
}

export default function VirtualStartupOfficeWorkspaceV2({
  user,
  onNavigate,
  taskToOpen,
  onTaskOpened,
  announcementToOpen,
  onAnnouncementOpened,
  winToOpen,
  onWinOpened,
}) {
  const office = useOfficeWorkspaceData({ user });
  const createAnnouncement = useOfficeStore((s) => s.createAnnouncement);
  const createWin = useOfficeStore((s) => s.createWin);
  const founderId = useOfficeStore((s) => s.founderId);
  const announcements = useOfficeStore((s) => s.announcements);
  const wins = useOfficeStore((s) => s.wins);
  const panels = useOfficePanels();
  const {
    showCallModal,
    setShowCallModal,
    registerTeamRoster,
    startDirectCall,
    activeCall,
    teamLiveCall,
    joinCall,
    loading,
    error: callError,
  } = useCallCoordinator();
  const [mobileTaskManagerOpen, setMobileTaskManagerOpen] = useState(false);
  const [mobileMeetingSchedulerOpen, setMobileMeetingSchedulerOpen] = useState(false);

  useEffect(() => {
    if (!taskToOpen) return;
    if (panels.isMobile) {
      setMobileTaskManagerOpen(true);
    } else {
      panels.openPanel("tasks");
    }
    onTaskOpened?.();
  }, [taskToOpen, onTaskOpened, panels.isMobile, panels.openPanel]);

  useEffect(() => {
    if (!announcementToOpen) return;
    panels.openPanel("updates");
    onAnnouncementOpened?.();
  }, [announcementToOpen, onAnnouncementOpened, panels.openPanel]);


  useEffect(() => {
    if (!winToOpen) return;
    panels.openPanel("updates");
    onWinOpened?.();
  }, [winToOpen, onWinOpened, panels.openPanel]);

  useEffect(() => {
    registerTeamRoster(office.teamRoster);
  }, [office.teamRoster, registerTeamRoster]);

  const actionButtons = useMemo(
    () => [
      { key: "team-call", label: "Team Call", panel: null, icon: PhoneCall },
      { key: "tasks", label: "Tasks", panel: "tasks", icon: Target },
      { key: "calendar", label: "Calendar", panel: "calendar", icon: CalendarDays },
      { key: "updates", label: "Updates", panel: "updates", icon: Sparkles },
    ],
    [],
  );

  const recentActivities = office.activities;
  const roster = office.teamRoster.slice(0, 10);
  const currentUserId = String(user._id ?? user.id ?? "");
  const teammatesInCall = roster.filter(
    (member) => member.isInCall && String(member.id) !== currentUserId,
  );
  const joinableCallRoom =
    teamLiveCall?.roomName ||
    teammatesInCall.find((member) => member.callRoomName)?.callRoomName ||
    "";
  const joinableCallType =
    teamLiveCall?.callType ||
    teammatesInCall.find((member) => member.callType)?.callType ||
    "video";
  const canJoinTeamCall = Boolean(joinableCallRoom && !activeCall);
  const upcomingAgenda = office.agenda.slice(0, 8);
  const myTasks = office.myTasks.slice(0, 8);
  const unassignedByMilestone = office.unassignedByMilestone || [];
  const unassignedTotal = useMemo(
    () =>
      unassignedByMilestone.reduce(
        (sum, row) => sum + (Number(row.count) || 0),
        0,
      ),
    [unassignedByMilestone],
  );
  const now = new Date();
  const monthLabel = now.toLocaleDateString([], { month: "short", year: "numeric" });
  const monthGrid = buildMonthGrid(now);
  const todayDate = now.getDate();

  const taskPanelOpen = panels.isMobile ? mobileTaskManagerOpen : panels.isOpen("tasks");
  const calendarDialogOpen = panels.isMobile
    ? mobileMeetingSchedulerOpen
    : panels.isOpen("calendar");

  return (
    <div
      className="office-panel flex flex-col gap-5 bg-surface-page px-6 py-5 font-body"
    >
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-surface-border bg-surface-card px-5 py-4">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <p className="truncate font-heading text-lg font-bold text-text-heading">
              {getDayGreeting()}, {user?.name || "New User"}!
            </p>
            <span className="inline-flex items-center rounded-pill bg-primary-tint px-3 py-[3px] font-body text-xs font-semibold text-primary">
              {office.teamEnergy.onlineCount} teammates online
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-pill border border-surface-border bg-surface-page px-2.5 py-0.5 font-body text-[11px] font-medium text-text-body">
              <Sparkles className="h-3 w-3 shrink-0 text-text-body" />
              Live startup workspace
            </span>
            <span className="font-body text-[11px] text-text-body">Keep up the great work!</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-body text-[11px] font-medium text-text-muted">Status</span>
          <button
            type="button"
            className="rounded-pill bg-status-success px-3 py-[3px] font-body text-[11px] font-semibold uppercase tracking-[0.06em] text-white transition-colors duration-200 ease-in-out"
          >
            AVAILABLE
          </button>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-0 border-b border-surface-border bg-surface-card px-3">
        {actionButtons.map((item) => {
          const Icon = item.icon;
          const active =
            item.key === "team-call"
              ? showCallModal
              : panels.isOpen(item.panel);
          return (
            <button
              key={item.key}
              type="button"
              disabled={item.key === "team-call" && loading}
              onClick={() => {
                if (item.key === "team-call") {
                  setShowCallModal(true);
                  return;
                }
                panels.openPanel(item.panel);
              }}
              className={cn(
                "inline-flex h-10 cursor-pointer items-center gap-1.5 border-0 border-b-2 bg-transparent px-3 text-[13px] transition-colors duration-200 ease-in-out disabled:cursor-not-allowed disabled:opacity-50",
                active
                  ? "border-primary font-semibold text-primary"
                  : "border-transparent font-medium text-text-body hover:text-primary",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.key === "team-call" && loading ? "Connecting..." : item.label}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-1.5 pl-2">
          <button
            type="button"
            className="inline-flex h-10 cursor-pointer items-center gap-1 border-0 bg-transparent px-2 font-body text-[12px] font-medium text-text-body transition-colors duration-200 ease-in-out hover:text-primary"
            onClick={() => panels.openPanel("calendar")}
          >
            <Command className="h-3.5 w-3.5 shrink-0" />
            Shortcuts
          </button>
        </div>
      </div>
      {callError && (
        <p className="-mt-4 px-3 text-xs text-red-500">{callError}</p>
      )}

      {office.error ? (
        <Card className="border-amber-300 bg-amber-50 shadow-none">
          <CardContent className="pt-4">
            <p className="text-[13px] text-amber-900">{office.error}</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="office-workspace-grid-top min-h-0 max-h-[min(360px,45vh)] overflow-hidden md:max-h-[360px]">
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <OfficePanelCard
          title="Live Activity"
          fill
          action={
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-status-success" />
              <span className="font-body text-[11px] font-medium text-text-body">Real-time</span>
            </span>
          }
          className="office-workspace-grid-top__activity"
        >
          {office.loading && recentActivities.length === 0 ? (
            <div className="flex flex-1 items-center justify-center font-body text-[11px] text-text-muted">
              Loading activity...
            </div>
          ) : recentActivities.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-1.5 text-center">
              <CircleDot className="h-4 w-4 text-surface-border" />
              <p className="font-heading text-[11px] font-semibold text-text-heading">No activity yet</p>
              <p className="font-body text-[11px] text-text-muted">Team activity will appear here</p>
            </div>
          ) : (
            <ActivityDateFilter activities={recentActivities}>
              {(filtered, hasActiveFilter) => (
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="mb-1 shrink-0">
                    <span className="font-body text-[11px] text-text-body">
                      {hasActiveFilter
                        ? `${filtered.length} of ${recentActivities.length} activities`
                        : `${recentActivities.length} activities`}
                    </span>
                  </div>
                  {filtered.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
                      <CircleDot className="h-4 w-4 text-surface-border/80" />
                      <p className="font-body text-[11px] text-text-muted">No activity in this period</p>
                    </div>
                  ) : (
                    <div className="min-h-0 flex-1 overflow-y-auto">
                      {filtered.map((activity, idx) => (
                        <div
                          key={activity.id}
                          className={cn(
                            "py-2.5",
                            idx < filtered.length - 1 && "border-b border-surface-border/80",
                          )}
                        >
                          <p className="line-clamp-2 font-body text-[13px] text-text-heading">
                            <span className="font-medium">{activity.userName}</span>
                            {" "}
                            {activity.message}
                          </p>
                          <p className="mt-0.5 font-body text-[11px] text-text-muted">
                            {formatRelativeTime(activity.timestamp)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </ActivityDateFilter>
          )}
        </OfficePanelCard>
        </div>

        <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <OfficePanelCard
          title="Team Grid View"
          fill
          action={
            <div className="flex items-center gap-2">
              {canJoinTeamCall ? (
                <button
                  type="button"
                  className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-input border border-primary bg-primary px-2.5 font-body text-[12px] font-semibold text-white transition-colors duration-200 ease-in-out hover:bg-primary/90"
                  onClick={() => joinCall(joinableCallRoom, joinableCallType)}
                  disabled={loading}
                >
                  <PhoneCall className="h-3.5 w-3.5" aria-hidden />
                  Join call
                </button>
              ) : null}
              <button
                type="button"
                className="inline-flex h-7 cursor-pointer items-center rounded-input border border-surface-border bg-surface-page px-2.5 font-body text-[12px] font-semibold text-primary transition-colors duration-200 ease-in-out hover:border-primary hover:bg-primary-tint"
                onClick={() => panels.openPanel("chat")}
              >
                + Invite Team
              </button>
            </div>
          }
          className="office-workspace-grid-top__team"
        >
          {roster.length === 0 ? (
            <div className="flex flex-1 items-center justify-center font-body text-[11px] text-text-muted">
              No team members yet.
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 gap-3">
              {roster.map((member) => {
                const isOnline = Boolean(member.isOnline);
                const memberInCall = Boolean(member.isInCall);
                const isSelf = String(member.id) === currentUserId;
                const showMemberJoin =
                  memberInCall && !isSelf && canJoinTeamCall;
                const memberStatusText = memberInCall
                  ? "In a team call"
                  : isOnline
                    ? member.statusText || "Online"
                    : "Offline";
                return (
                  <div
                    key={member.id}
                    className="h-fit rounded-[12px] border border-surface-border bg-surface-page p-4"
                  >
                    <div className="mb-2 flex items-center gap-2.5">
                      <div className="relative flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[10px] bg-primary font-heading text-[13px] font-bold text-white">
                        {getInitials(member.name)}
                        {isOnline && (
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface-card ${
                              memberInCall ? "bg-primary" : "bg-status-success"
                            }`}
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-heading text-sm font-semibold text-text-heading">{member.name}</p>
                        <p className="truncate font-body text-xs text-text-body">
                          {member.title || member.role}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <PresenceIndicator
                        connection={member.connection}
                        isOnline={member.isOnline}
                        showLabel
                        size="sm"
                        statusText={memberStatusText}
                        lastSeenAt={member.lastSeenAt}
                      />
                      {showMemberJoin ? (
                        <button
                          type="button"
                          className="inline-flex h-7 shrink-0 items-center gap-1 rounded-input border border-primary bg-primary-tint px-2.5 font-body text-[11px] font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
                          onClick={() =>
                            joinCall(
                              member.callRoomName || joinableCallRoom,
                              member.callType || joinableCallType,
                            )
                          }
                          disabled={loading}
                        >
                          <PhoneCall className="h-3 w-3" aria-hidden />
                          Join call
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
          )}
        </OfficePanelCard>
        </div>

        <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <OfficePanelCard
          title="Team Energy & Pulse"
          fill
          className="office-workspace-grid-top__energy"
        >
          <div className="flex min-h-0 flex-1 flex-col justify-between gap-3">
            <div className="py-4 text-center">
              <p className="font-heading text-[22px] font-extrabold leading-none text-primary">
                {office.teamEnergy.percentage >= 70
                  ? "HIGH"
                  : office.teamEnergy.percentage >= 40
                    ? "MODERATE"
                    : "LOW"}
              </p>
              <p className="mt-1 font-body text-xs text-text-body">Team is winding down</p>
            </div>
            <div className="border-t border-surface-border pt-3">
              <p className="mb-2 font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                Live Stats
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-[12px] border border-surface-border bg-surface-page p-3 text-center">
                  <p className="font-heading text-lg font-extrabold text-primary">{office.teamEnergy.totalCount}</p>
                  <p className="mt-0.5 font-body text-[10px] font-medium uppercase tracking-[0.06em] text-text-muted">
                    People
                  </p>
                </div>
                <div className="rounded-[12px] border border-surface-border bg-surface-page p-3 text-center">
                  <p className="font-heading text-lg font-extrabold text-primary">{office.teamEnergy.workingCount}</p>
                  <p className="mt-0.5 font-body text-[10px] font-medium uppercase tracking-[0.06em] text-text-muted">
                    Working
                  </p>
                </div>
                <div className="rounded-[12px] border border-surface-border bg-surface-page p-3 text-center">
                  <p className="font-heading text-lg font-extrabold text-primary">{office.teamEnergy.inCallCount}</p>
                  <p className="mt-0.5 font-body text-[10px] font-medium uppercase tracking-[0.06em] text-text-muted">
                    In Calls
                  </p>
                </div>
                <div className="rounded-[12px] border border-surface-border bg-surface-page p-3 text-center">
                  <p
                    className={cn(
                      "font-heading text-lg font-extrabold",
                      office.realtimeOnline ? "text-status-success" : "text-text-muted",
                    )}
                  >
                    {office.realtimeOnline ? "On" : "Off"}
                  </p>
                  <p className="mt-0.5 font-body text-[10px] font-medium uppercase tracking-[0.06em] text-text-muted">
                    Live
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 border-t border-surface-border pt-3">
              <div className="flex items-center justify-between">
                <span className="font-body text-xs font-medium text-text-body">Energy level</span>
                <span className="font-body text-xs font-semibold text-primary">{office.teamEnergy.percentage}%</span>
              </div>
              <div className="h-1.5 rounded-pill bg-surface-border">
                <div
                  className="h-1.5 rounded-pill bg-gradient-to-r from-primary to-accent transition-[width] duration-200 ease-out"
                  style={{ width: `${office.teamEnergy.percentage}%` }}
                />
              </div>
              <div className="flex justify-between font-body text-xs text-text-muted">
                <span>{office.teamEnergy.onlineCount} online</span>
                <span>{Math.max(0, office.teamEnergy.totalCount - office.teamEnergy.onlineCount)} away</span>
              </div>
            </div>
          </div>
        </OfficePanelCard>
        </div>
      </div>

      <div className="office-workspace-grid-bottom" style={{display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, marginTop: 0}}>
        <OfficePanelCard
          title="Team Calendar"
          action={
            <button
              type="button"
              className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-input border border-surface-border bg-surface-page px-2.5 font-body text-[12px] font-semibold text-primary transition-colors duration-200 ease-in-out hover:border-primary hover:bg-primary-tint"
              onClick={() => panels.openPanel("calendar")}
            >
              <Plus className="h-3.5 w-3.5 shrink-0" />
              Schedule
            </button>
          }
          className="min-h-[248px] office-workspace-grid-bottom__calendar sm:min-h-[268px]"
        >
          <div className="office-calendar-split grid gap-4 md:gap-5">
            <div className="office-calendar-split__month rounded-card border border-surface-border bg-surface-card p-4 md:p-5">
              <div className="mb-4 flex items-center justify-between gap-2">
                <p className="font-heading text-base font-semibold tracking-tight text-text-heading">{monthLabel}</p>
                <ChevronDown className="h-[18px] w-[18px] shrink-0 text-text-body" />
              </div>
              <div className="grid grid-cols-7 gap-x-1 gap-y-2 text-center sm:gap-x-1.5 sm:gap-y-2.5">
                {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                  <span
                    key={`${day}-${index}`}
                    className="pb-1 font-body text-[13px] font-medium text-text-muted sm:text-sm"
                  >
                    {day}
                  </span>
                ))}
                {monthGrid.flat().map((day, index) => (
                  <span
                    key={`${day || "blank"}-${index}`}
                    className={cn(
                      "mx-auto flex min-h-[34px] min-w-[34px] items-center justify-center rounded-full font-body text-sm leading-none sm:min-h-[38px] sm:min-w-[38px] sm:text-[15px]",
                      day == null && "pointer-events-none text-transparent",
                      day !== null &&
                        day !== todayDate &&
                        "cursor-default text-text-heading transition-colors duration-200 ease-in-out hover:bg-primary-tint hover:text-primary",
                      day === todayDate &&
                        "bg-primary font-semibold text-white shadow-sm",
                    )}
                  >
                    {day || "."}
                  </span>
                ))}
              </div>
            </div>
            <div className="office-calendar-split__agenda rounded-card border border-surface-border bg-surface-card p-4 md:p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-body text-sm font-semibold text-text-body">
                  <Calendar className="h-4 w-4 shrink-0 text-text-body" />
                  Agenda
                </div>
                <button
                  type="button"
                  className="group inline-flex cursor-pointer items-center gap-1 rounded-input border-0 bg-transparent px-1.5 py-0.5 font-body text-[11px] font-medium text-text-body transition-colors duration-200 ease-in-out hover:text-primary"
                >
                  <Filter className="h-3 w-3 shrink-0 text-text-body transition-colors duration-200 group-hover:text-primary" />
                  Filter
                </button>
              </div>
              {upcomingAgenda.length === 0 ? (
                <div className="flex min-h-[140px] flex-col items-center justify-center px-2 text-center sm:min-h-[152px]">
                  <CalendarDays className="h-5 w-5 text-surface-border" />
                  <p className="mt-1.5 font-heading text-[11px] font-semibold text-text-heading">No agenda items</p>
                  <p className="font-body text-[10px] text-text-muted">
                    Nothing scheduled for this period
                  </p>
                </div>
              ) : (
                <div>
                  {upcomingAgenda.slice(0, 4).map((item, idx) => (
                    <div
                      key={item.id}
                      className={cn(
                        "py-2",
                        idx < Math.min(upcomingAgenda.length, 4) - 1 && "border-b border-surface-border/80",
                      )}
                    >
                      <p className="truncate font-body text-[13px] font-medium text-text-heading">{item.title}</p>
                      <p className="font-body text-[11px] text-text-body">
                        {item.date.toLocaleDateString()}
                        {" "}
                        {item.date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </OfficePanelCard>

        <OfficePanelCard
          title="Your Tasks"
          action={
            user?.role === "founder" && unassignedTotal > 0 ? (
              <span
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/18 bg-primary/[0.06] px-2.5 py-1 font-body text-[11px] font-semibold tabular-nums text-primary"
                title="Unassigned tasks waiting for an owner"
              >
                {unassignedTotal}
                {" unassigned"}
              </span>
            ) : null
          }
          className="min-h-[208px] office-workspace-grid-bottom__tasks border-primary/18"
        >
          {myTasks.length === 0 ? (
            <div className="flex min-h-[126px] flex-col items-center justify-center text-center">
              <CheckCircle2 className="h-4 w-4 text-surface-border" />
              <p className="mt-1.5 font-heading text-[11px] font-semibold text-text-heading">
                {user?.role === "founder" && unassignedTotal > 0
                  ? "Nothing assigned to you yet"
                  : "No tasks yet"}
              </p>
              <p className="font-body text-[10px] text-text-muted">
                {user?.role === "founder"
                  ? unassignedTotal > 0
                    ? "Unassigned work is listed below by milestone — assign it from the dashboard or task panel."
                    : "Tasks assigned to you from milestones will appear here."
                  : "No tasks assigned to you yet"}
              </p>
            </div>
          ) : (
            <div>
              {myTasks.slice(0, 4).map((task, idx) => (
                <div
                  key={task.id}
                  className={cn(
                    "flex items-start justify-between gap-2 py-3",
                    idx < Math.min(myTasks.length, 4) - 1 && "border-b border-surface-border/80",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-[13px] font-medium text-text-heading">{task.title}</p>
                    <p className="mt-0.5 font-body text-[11px] text-text-muted">
                      {task.dueDate ? `Due ${task.dueDate.toLocaleDateString()}` : "No due date"}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "flex-shrink-0 rounded-pill px-2.5 py-0.5 font-body text-[11px] font-medium",
                      task.status === "completed" && "bg-status-success/15 text-status-success",
                      task.status === "in-progress" && "bg-status-warning/15 text-text-heading",
                      task.status !== "completed" &&
                        task.status !== "in-progress" &&
                        "bg-primary-tint text-text-body",
                    )}
                  >
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          )}
          {user?.role === "founder" &&
            unassignedByMilestone.length > 0 && (
              <div className="mt-3 rounded-xl border border-primary/15 bg-[#fafbff] px-3 py-3">
                <p className="font-heading text-[11px] font-semibold tracking-wide text-[#0d0d0d]">
                  Needs assignment
                </p>
                <p className="mt-0.5 font-body text-[10px] leading-snug text-[#4a4a5a]">
                  Unassigned tasks by milestone — open Task manager or founder dashboard to assign owners.
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {unassignedByMilestone.map((row) => (
                    <span
                      key={row.milestoneId || row.milestoneName || "none"}
                      className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-primary/18 bg-white px-2.5 py-1 font-body text-[11px] shadow-[0_1px_2px_rgba(58,90,254,0.06)]"
                    >
                      <span className="truncate text-[#4a4a5a]" title={row.milestoneName}>
                        {row.milestoneName}
                      </span>
                      <span className="shrink-0 rounded-full bg-primary/12 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-[#1a237e]">
                        {row.count}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          <button
            type="button"
            className="group mt-1 flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-input border-0 bg-transparent font-body text-[13px] font-semibold text-primary transition-colors duration-200 ease-in-out hover:text-accent"
            onClick={() => panels.openPanel("tasks")}
          >
            <Target className="h-3.5 w-3.5 shrink-0 text-primary transition-colors duration-200 group-hover:text-accent" />
            View All Tasks
          </button>
        </OfficePanelCard>
      </div>

      <button
        type="button"
        className="fixed bottom-4 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-[0_4px_16px_rgba(58,90,254,0.30)] transition-colors duration-200 ease-in-out hover:bg-primary-hover md:bottom-5 md:right-5"
        aria-label="Open office help"
      >
        <HelpCircle className="h-5 w-5" />
      </button>

      {!panels.isMobile && panels.isOpen("updates") && (
        <TeamHubPanel
          onClose={() => panels.closePanel("updates")}
          currentUserId={String(user._id ?? user.id ?? "")}
          currentUserName={user.name}
          startupId={office.startupId}
          strictMode={true}
          announcementsData={announcements}
          winsData={wins}
          onCreateAnnouncement={createAnnouncement}
          onCreateWin={createWin}
          user={user}
        />
      )}

      <TaskManagementPanel
        open={taskPanelOpen}
        onClose={() => {
          if (panels.isMobile) {
            setMobileTaskManagerOpen(false);
            return;
          }
          panels.closePanel("tasks");
        }}
        user={user}
        initialTaskId={taskToOpen || null}
        strictMode={true}
        startupId={office.startupId}
        founderIdOverride={founderId || String(user?._id ?? user?.id ?? "")}
        onTasksSynced={() => office.refresh(user)}
        onNavigate={onNavigate}
      />

      {!panels.isMobile && panels.isOpen("calendar") && (
        <CalendarHubPanel
          user={user}
          startupId={office.startupId}
          onClose={() => panels.closePanel("calendar")}
        />
      )}

      {panels.isMobile && (
        <Drawer
          modal={false}
          open={Boolean(panels.mobileSheet)}
          onOpenChange={(open) => {
            if (!open) panels.closeAll();
          }}
        >
          <DrawerContent className="max-w-[calc(100%-1rem)] office-panel office-sheet-content">
            <DrawerHeader className="office-panel-header border-surface-border bg-surface-card">
              <DrawerTitle className="font-heading text-text-heading">
                {getPanelTitle(panels.mobileSheet)}
              </DrawerTitle>
              <DrawerDescription className="font-body text-text-body">
                {getPanelDescription(panels.mobileSheet)}
              </DrawerDescription>
            </DrawerHeader>

            <div className="px-4 pb-4 office-panel-body">
              {panels.mobileSheet === "chat" && (
                <SimpleTeamMessaging
                  embedded
                  onClose={panels.closeAll}
                  onStartCall={() => {
                    panels.closeAll();
                    setMobileMeetingSchedulerOpen(true);
                  }}
                  onStartVideoCall={(peerUserId) => {
                    panels.closeAll();
                    void startDirectCall(peerUserId);
                  }}
                  currentUserId={String(user._id ?? user.id ?? "")}
                  currentUserName={user.name}
                  currentUserRole={user.role}
                  startupId={office.startupId}
                  teamMembers={office.chatRoster}
                  initialSelectedUserId={null}
                  strictMode={true}
                />
              )}

              {panels.mobileSheet === "updates" && (
                <TeamHubPanel
                  embedded
                  onClose={panels.closeAll}
                  currentUserId={String(user._id ?? user.id ?? "")}
                  currentUserName={user.name}
                  startupId={office.startupId}
                  strictMode={true}
                  announcementsData={announcements}
                  winsData={wins}
                  onCreateAnnouncement={createAnnouncement}
                  onCreateWin={createWin}
                  user={user}
                />
              )}

              {panels.mobileSheet === "tasks" && (
                <div className="space-y-3 pb-20">
                  {myTasks.length === 0 && user?.role === "founder" && (
                    <p className="text-[13px] text-muted-foreground px-1">
                      {unassignedTotal > 0
                        ? "No tasks assigned to you right now. Unassigned counts by milestone are below."
                        : "No tasks assigned to you yet."}
                    </p>
                  )}
                  {myTasks.slice(0, 6).map((task) => (
                    <div
                      key={`sheet-task-${task.id}`}
                      className="rounded-xl border border-border/70 px-3 py-2"
                    >
                      <p className="text-[14px] font-medium leading-6">{task.title}</p>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <Badge variant={getTaskBadgeVariant(task.status)}>{task.status}</Badge>
                        <p className="text-[14px] text-muted-foreground">
                          {task.dueDate ? task.dueDate.toLocaleDateString() : "No due date"}
                        </p>
                      </div>
                    </div>
                  ))}
                  {user?.role === "founder" && unassignedByMilestone.length > 0 && (
                    <div className="rounded-xl border border-primary/20 bg-muted/30 px-3 py-2.5">
                      <p className="text-[12px] font-semibold text-foreground">Needs assignment</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {unassignedByMilestone.map((row) => (
                          <Badge
                            key={row.milestoneId || row.milestoneName || "none"}
                            variant="outline"
                            className="border-primary/25 font-normal"
                          >
                            <span className="max-w-[140px] truncate">{row.milestoneName}</span>
                            <span className="ml-1 tabular-nums font-semibold">{row.count}</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border pt-3">
                    <Button
                      type="button"
                      className="w-full h-11 text-[14px]"
                      onClick={() => {
                        panels.closeAll();
                        setMobileTaskManagerOpen(true);
                      }}
                    >
                      Open full task manager
                    </Button>
                  </div>
                </div>
              )}

              {panels.mobileSheet === "calendar" && (
                <div className="space-y-3 pb-20">
                  {upcomingAgenda.slice(0, 6).map((item) => (
                    <div
                      key={`sheet-agenda-${item.id}`}
                      className="rounded-xl border border-border/70 px-3 py-2"
                    >
                      <p className="text-[14px] font-medium leading-6">{item.title}</p>
                      <p className="text-[14px] text-muted-foreground">
                        {item.date.toLocaleDateString()}
                        {" "}
                        {item.date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  ))}
                  <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border pt-3">
                    <Button
                      type="button"
                      className="w-full h-11 text-[14px]"
                      onClick={() => {
                        panels.closeAll();
                        setMobileMeetingSchedulerOpen(true);
                      }}
                    >
                      Schedule a meeting
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {panels.isMobile && (
        <MeetingScheduler
          open={mobileMeetingSchedulerOpen}
          onClose={() => setMobileMeetingSchedulerOpen(false)}
          user={user}
          teamMembers={office.teamRoster}
          onMeetingScheduled={() => setMobileMeetingSchedulerOpen(false)}
        />
      )}

    </div>
  );
}
