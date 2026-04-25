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
  MessageCircle,
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
import { SimpleTeamMessaging } from "./SimpleTeamMessaging";
import { TeamHubPanel } from "./TeamHubPanel";
import CalendarHubPanel from "./CalendarHubPanel";
import MeetingScheduler from "../calendar/MeetingScheduler";
import { useOfficePanels } from "../../domains/office/hooks/useOfficePanels";
import { useOfficeWorkspaceData } from "../../domains/office/hooks/useOfficeWorkspaceData";
import { useOfficeStore } from "../../state/useOfficeStore";

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
  if (panelKey === "chat") return "Team Chat";
  if (panelKey === "tasks") return "My Tasks";
  if (panelKey === "updates") return "Team Updates";
  if (panelKey === "calendar") return "Calendar";
  return "Workspace";
}

function getPanelDescription(panelKey) {
  if (panelKey === "chat") return "Message teammates without leaving the office.";
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
  { key: "3days", label: "Last 3 days" },
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
    <div className="flex flex-col gap-2.5">
      {/* Filter controls row */}
      <div className="flex items-center justify-between gap-2">
        {/* Segmented preset control */}
        <div className="flex items-center rounded-lg border border-border bg-muted/60 p-0.5 gap-0.5">
          {ACTIVITY_PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => handlePreset(p.key)}
              className={cn(
                "rounded-md px-2.5 py-[3px] text-[10px] font-medium transition-all duration-150",
                preset === p.key
                  ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Right side: Custom + Clear */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => { setShowCustom((v) => !v); setPreset(null); }}
            className={cn(
              "flex items-center gap-1 rounded-lg border px-2.5 py-[3px] text-[10px] font-medium transition-all duration-150",
              showCustom
                ? "border-primary/50 bg-primary/8 text-primary"
                : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-border",
            )}
          >
            <Filter className="h-2.5 w-2.5" />
            Custom
            <ChevronRight className={cn("h-2.5 w-2.5 transition-transform duration-200", showCustom && "rotate-90")} />
          </button>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={() => { setPreset(null); setFromStr(""); setToStr(""); setCustomError(""); setShowCustom(false); }}
              className="flex items-center gap-0.5 rounded-md px-1.5 py-[3px] text-[10px] font-medium text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="h-2.5 w-2.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Custom date range panel */}
      {showCustom && (
        <div className="rounded-xl border border-border/70 bg-muted/30 px-3 pt-2.5 pb-3 space-y-2">
          <div className="flex items-center gap-1.5 mb-1">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Custom range</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-muted-foreground">From</label>
              <input
                type="date"
                value={fromStr}
                max={todayStr}
                onChange={(e) => handleFromChange(e.target.value)}
                className="h-7 w-full rounded-lg border border-border bg-background px-2 text-[11px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-muted-foreground">To</label>
              <input
                type="date"
                value={toStr}
                max={todayStr}
                min={fromStr || undefined}
                onChange={(e) => handleToChange(e.target.value)}
                className="h-7 w-full rounded-lg border border-border bg-background px-2 text-[11px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all"
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

function OfficePanelCard({ title, action, children, className = "" }) {
  return (
    <Card className={cn("office-card office-animate-in shadow-none", className)}>
      <CardHeader className="pb-2 pt-2.5 office-panel-header">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-[12px] font-semibold tracking-tight text-foreground">
            {title}
          </CardTitle>
          {action}
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5 px-2.5 pb-2.5 sm:px-3 sm:pb-3">{children}</CardContent>
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
  messageUserToOpen,
  onMessageUserOpened,
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
  const [selectedMessageUserId, setSelectedMessageUserId] = useState(null);
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
    if (!messageUserToOpen) return;
    setSelectedMessageUserId(String(messageUserToOpen));
    panels.openPanel("chat");
    onMessageUserOpened?.();
  }, [messageUserToOpen, onMessageUserOpened, panels.openPanel]);

  useEffect(() => {
    if (!winToOpen) return;
    panels.openPanel("updates");
    onWinOpened?.();
  }, [winToOpen, onWinOpened, panels.openPanel]);

  const actionButtons = useMemo(
    () => [
      { key: "team-call", label: "Team Call", panel: "calendar", icon: PhoneCall },
      { key: "chat", label: "Chat", panel: "chat", icon: MessageCircle },
      { key: "tasks", label: "Tasks", panel: "tasks", icon: Target },
      { key: "calendar", label: "Calendar", panel: "calendar", icon: CalendarDays },
      { key: "updates", label: "Updates", panel: "updates", icon: Sparkles },
    ],
    [],
  );

  const recentActivities = office.activities;
  const roster = office.teamRoster.slice(0, 10);
  const upcomingAgenda = office.agenda.slice(0, 8);
  const myTasks = office.myTasks.slice(0, 8);
  const now = new Date();
  const monthLabel = now.toLocaleDateString([], { month: "short", year: "numeric" });
  const monthGrid = buildMonthGrid(now);
  const todayDate = now.getDate();

  const taskPanelOpen = panels.isMobile ? mobileTaskManagerOpen : panels.isOpen("tasks");
  const calendarDialogOpen = panels.isMobile
    ? mobileMeetingSchedulerOpen
    : panels.isOpen("calendar");

  return (
    <div className="space-y-2.5 bg-background p-2.5 md:p-3 lg:p-3.5 office-panel">
      <section
        className="relative overflow-hidden rounded-xl border px-3 py-3 text-white sm:px-4 sm:py-3.5"
        style={{
          background: "linear-gradient(120deg, #1f3dff 0%, #3a5afe 48%, #6f89ff 100%)",
          borderColor: "#6f86ff",
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(255,255,255,0.24),transparent_52%)]" />
        <div className="absolute -left-8 -bottom-14 h-28 w-28 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -right-8 -top-12 h-32 w-32 rounded-full bg-indigo-200/25 blur-2xl" />

        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <p className="truncate text-[13px] font-bold sm:text-[15px]">
                {getDayGreeting()}, {user?.name || "New User"}!
              </p>
              <Badge className="h-5 rounded-full border border-white/35 bg-white/20 px-2 text-[10px] font-semibold text-white hover:bg-white/20">
                {office.teamEnergy.onlineCount} teammates online
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/90 sm:text-[12px]">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/12 px-2 py-0.5">
                <Sparkles className="h-3.5 w-3.5" />
                Live startup workspace
              </span>
              <span>Keep up the great work!</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-white/90 sm:text-[11px]">Status</span>
            <button
              type="button"
              className="h-6 rounded-full border border-white/40 bg-white/14 px-2.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm"
            >
              available
            </button>
          </div>
        </div>
      </section>

      <div className="rounded-lg border border-border bg-card px-2 py-1.5 sm:px-3">
        <div className="flex flex-wrap items-center gap-1">
          {actionButtons.map((item) => {
            const Icon = item.icon;
            const active = panels.isOpen(item.panel);
            return (
              <Button
                key={item.key}
                type="button"
                variant="ghost"
                onClick={() => panels.openPanel(item.panel)}
                className={cn(
                  "h-6 gap-1.5 rounded-md px-2.5 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                  active && "bg-muted text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Button>
            );
          })}
          <div className="ml-auto flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              className="h-6 gap-1 rounded-md px-2 text-[11px]"
              onClick={() => panels.openPanel("calendar")}
            >
              <Command className="h-3.5 w-3.5" />
              Shortcuts
            </Button>
          </div>
        </div>
      </div>

      {office.error ? (
        <Card className="border-amber-300 bg-amber-50 shadow-none">
          <CardContent className="pt-4">
            <p className="text-[13px] text-amber-900 dark:text-amber-200">{office.error}</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="office-workspace-grid-top grid gap-2.5">
        <OfficePanelCard
          title="Live Activity"
          action={
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
              <span className="text-[10px] text-muted-foreground">Real-time</span>
            </span>
          }
          className="office-workspace-grid-top__activity"
        >
          {office.loading && recentActivities.length === 0 ? (
            <div className="flex min-h-[145px] items-center justify-center text-[11px] text-muted-foreground">
              Loading activity...
            </div>
          ) : recentActivities.length === 0 ? (
            <div className="flex min-h-[145px] flex-col items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
              <CircleDot className="h-4 w-4 text-muted-foreground/70" />
              <p>No activity yet</p>
              <p>Team activity will appear here</p>
            </div>
          ) : (
            <ActivityDateFilter activities={recentActivities}>
              {(filtered, hasActiveFilter) => (
                <>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      {hasActiveFilter
                        ? `${filtered.length} of ${recentActivities.length} activities`
                        : `${recentActivities.length} activities`}
                    </span>
                  </div>
                  {filtered.length === 0 ? (
                    <div className="flex min-h-[80px] flex-col items-center justify-center gap-1 text-center">
                      <CircleDot className="h-4 w-4 text-muted-foreground/50" />
                      <p className="text-[11px] text-muted-foreground">No activity in this period</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 overflow-y-auto pr-0.5" style={{ maxHeight: 280 }}>
                      {filtered.map((activity) => (
                        <div key={activity.id} className="rounded-md border border-border bg-card px-2.5 py-2">
                          <p className="line-clamp-2 text-[11px]">
                            <span className="font-medium">{activity.userName}</span>
                            {" "}
                            {activity.message}
                          </p>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {formatRelativeTime(activity.timestamp)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </ActivityDateFilter>
          )}
        </OfficePanelCard>

        <OfficePanelCard
          title="Team Grid View"
          action={
            <Button
              type="button"
              variant="outline"
              className="h-6 rounded-md border-[#D1D5DB] px-2 text-[10px] hover:border-indigo-500"
              onClick={() => panels.openPanel("chat")}
            >
              + Invite Team
            </Button>
          }
          className="min-h-[232px] office-workspace-grid-top__team"
        >
          {roster.length === 0 ? (
            <div className="flex min-h-[145px] items-center justify-center text-[11px] text-muted-foreground">
              No team members yet.
            </div>
          ) : (
            <div className="grid h-[164px] grid-cols-1">
              {roster.slice(0, 1).map((member) => (
                <div key={member.id} className="h-fit w-[195px] rounded-md border border-border bg-muted/20 p-2.5">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="relative flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-[12px] font-medium text-slate-700">
                      {getInitials(member.name)}
                      {member.isOnline && (
                        <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border border-white bg-emerald-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-medium">{member.name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {member.title || member.role}
                      </p>
                    </div>
                  </div>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {member.statusText || "available"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </OfficePanelCard>

        <OfficePanelCard
          title="Team Energy & Pulse"
          className="min-h-[232px] office-workspace-grid-top__energy"
        >
          <div className="space-y-2.5">
            <div className="space-y-0.5 text-center">
              <p className="text-[20px] leading-none">{"\u{1F973}"}</p>
              <p className="text-[13px] font-medium">
                {office.teamEnergy.percentage >= 70
                  ? "High"
                  : office.teamEnergy.percentage >= 40
                    ? "Moderate"
                    : "Low"}
              </p>
              <p className="text-[10px] text-muted-foreground">Team is winding down</p>
            </div>
            <div className="border-t border-border pt-2">
              <p className="text-[10px] text-muted-foreground">Live Stats</p>
              <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                <div className="rounded-md border border-border bg-muted/20 p-1.5 text-center">
                  <p className="text-[11px] font-medium">{office.teamEnergy.totalCount}</p>
                  <p className="text-[9px] text-muted-foreground">People</p>
                </div>
                <div className="rounded-md border border-border bg-muted/20 p-1.5 text-center">
                  <p className="text-[11px] font-medium">{office.teamEnergy.workingCount}</p>
                  <p className="text-[9px] text-muted-foreground">Working</p>
                </div>
                <div className="rounded-md border border-border bg-muted/20 p-1.5 text-center">
                  <p className="text-[11px] font-medium">{office.teamEnergy.inCallCount}</p>
                  <p className="text-[9px] text-muted-foreground">In Calls</p>
                </div>
                <div className="rounded-md border border-border bg-muted/20 p-1.5 text-center">
                  <p className="text-[11px] font-medium">{office.realtimeOnline ? "On" : "Off"}</p>
                  <p className="text-[9px] text-muted-foreground">Live</p>
                </div>
              </div>
            </div>
            <div className="space-y-1 border-t border-border pt-2">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">Energy level</span>
                <span>{office.teamEnergy.percentage}%</span>
              </div>
              <div className="h-1 rounded-full bg-muted">
                <div
                  className="h-1 rounded-full bg-foreground/80"
                  style={{ width: `${office.teamEnergy.percentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                <span>{office.teamEnergy.onlineCount} online</span>
                <span>{Math.max(0, office.teamEnergy.totalCount - office.teamEnergy.onlineCount)} away</span>
              </div>
            </div>
          </div>
        </OfficePanelCard>
      </div>

      <div className="office-workspace-grid-bottom grid gap-2.5">
        <OfficePanelCard
          title="Team Calendar"
          action={
            <Button
              type="button"
              variant="ghost"
              className="h-6 gap-1 rounded-md px-2 text-[10px]"
              onClick={() => panels.openPanel("calendar")}
            >
              <Plus className="h-3.5 w-3.5" />
              Schedule
            </Button>
          }
          className="min-h-[208px] office-workspace-grid-bottom__calendar"
        >
          <div className="office-calendar-split grid gap-2.5">
            <div className="rounded-md border border-border p-2.5 office-calendar-split__month">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-medium text-muted-foreground">{monthLabel}</p>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="grid grid-cols-7 gap-0.5 text-center">
                {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                  <span key={`${day}-${index}`} className="text-[9px] text-muted-foreground">
                    {day}
                  </span>
                ))}
                {monthGrid.flat().map((day, index) => (
                  <span
                    key={`${day || "blank"}-${index}`}
                    className={cn(
                      "rounded text-[10px] leading-5",
                      day === todayDate
                        ? "bg-indigo-600 text-white"
                        : "text-foreground",
                      day == null && "text-transparent",
                    )}
                  >
                    {day || "."}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-md border border-border p-2.5 office-calendar-split__agenda">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  Agenda
                </div>
                <Button type="button" variant="ghost" className="h-6 gap-1 px-2 text-[10px]">
                  <Filter className="h-3.5 w-3.5" />
                  Filter
                </Button>
              </div>
              {upcomingAgenda.length === 0 ? (
                <div className="flex min-h-[126px] flex-col items-center justify-center text-center">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <p className="mt-1.5 text-[11px] text-muted-foreground">No agenda items</p>
                  <p className="text-[10px] text-muted-foreground">
                    Nothing scheduled for this period
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {upcomingAgenda.slice(0, 4).map((item) => (
                    <div key={item.id} className="rounded-md border border-border px-2 py-1.5">
                      <p className="truncate text-[11px] font-medium">{item.title}</p>
                      <p className="text-[10px] text-muted-foreground">
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
          className="min-h-[208px] office-workspace-grid-bottom__tasks"
        >
          {myTasks.length === 0 ? (
            <div className="flex min-h-[126px] flex-col items-center justify-center text-center">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <p className="mt-1.5 text-[11px] text-muted-foreground">No tasks yet</p>
              <p className="text-[10px] text-muted-foreground">
                {user?.role === "founder"
                  ? "Tasks from your milestones will appear here"
                  : "No tasks assigned to you yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {myTasks.slice(0, 4).map((task) => (
                <div key={task.id} className="rounded-md border border-border px-2.5 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-1 text-[11px] font-medium">{task.title}</p>
                    <Badge variant={getTaskBadgeVariant(task.status)} className="text-[9px]">
                      {task.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {task.dueDate ? `Due ${task.dueDate.toLocaleDateString()}` : "No due date"}
                  </p>
                </div>
              ))}
            </div>
          )}
          <Button
            type="button"
            variant="ghost"
            className="h-6 w-full gap-1 rounded-md border border-border text-[11px]"
            onClick={() => panels.openPanel("tasks")}
          >
            <Target className="h-3.5 w-3.5" />
            View All Tasks
          </Button>
        </OfficePanelCard>
      </div>

      <button
        type="button"
        className="fixed bottom-4 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-violet-600 text-white shadow-md hover:bg-violet-500 md:bottom-5 md:right-5"
        aria-label="Open office help"
      >
        <HelpCircle className="h-4.5 w-4.5" />
      </button>

      {!panels.isMobile && panels.isOpen("chat") && (
        <SimpleTeamMessaging
          onClose={() => panels.closePanel("chat")}
          onStartCall={() => panels.openPanel("calendar")}
          currentUserId={String(user._id ?? user.id ?? "")}
          currentUserName={user.name}
          currentUserRole={user.role}
          startupId={office.startupId}
          teamMembers={office.teamRoster}
          initialSelectedUserId={selectedMessageUserId}
          strictMode={true}
        />
      )}

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
            <DrawerHeader className="office-panel-header">
              <DrawerTitle>{getPanelTitle(panels.mobileSheet)}</DrawerTitle>
              <DrawerDescription>{getPanelDescription(panels.mobileSheet)}</DrawerDescription>
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
                  currentUserId={String(user._id ?? user.id ?? "")}
                  currentUserName={user.name}
                  currentUserRole={user.role}
                  startupId={office.startupId}
                  teamMembers={office.teamRoster}
                  initialSelectedUserId={selectedMessageUserId}
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
