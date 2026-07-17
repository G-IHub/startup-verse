import React, { useState, useEffect, useMemo } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Calendar,
  Clock,
  CheckSquare,
  Video,
  Users,
  Target,
  AlertCircle,
  TrendingUp,
  Filter,
  ChevronDown,
  Circle,
  CheckCircle2,
  Check,
} from "lucide-react";
import * as agendaApi from "../../utils/api/agendaApi";
import { format, isToday, isTomorrow, isThisWeek, parseISO } from "date-fns";

function itemMatchesSelectedTypes(item, selectedTypes) {
  if (selectedTypes.includes(item.type)) return true;
  if (item.type === "company-event" && selectedTypes.includes("meeting")) {
    return true;
  }
  return false;
}

function isMeetingItem(item) {
  const type = String(item?.type || item?.agendaType || "");
  return type === "meeting" || type === "company-event";
}

function getRecurrenceGroupId(item) {
  return (
    item?.recurrenceGroupId ||
    item?.metadata?.recurrenceGroupId ||
    ""
  );
}

/** Keep the next occurrence per recurring series; attach occurrenceCount. */
export function collapseRecurringAgendaItems(items) {
  const sorted = [...(items || [])].sort((a, b) => {
    const aKey = `${a.date || a.dueDate || ""}-${a.startTime || ""}`;
    const bKey = `${b.date || b.dueDate || ""}-${b.startTime || ""}`;
    return aKey.localeCompare(bKey);
  });

  const groupCounts = new Map();
  for (const item of sorted) {
    const gid = getRecurrenceGroupId(item);
    if (gid && isMeetingItem(item)) {
      groupCounts.set(gid, (groupCounts.get(gid) || 0) + 1);
    }
  }

  const seen = new Set();
  const out = [];
  for (const item of sorted) {
    const gid = getRecurrenceGroupId(item);
    if (gid && isMeetingItem(item)) {
      if (seen.has(gid)) continue;
      seen.add(gid);
      out.push({
        ...item,
        occurrenceCount: groupCounts.get(gid) || 1,
        isRecurringSeries: (groupCounts.get(gid) || 1) > 1,
      });
      continue;
    }
    out.push(item);
  }
  return out;
}

export default function AgendaPanel({
  user,
  onItemClick,
  compact: _compact = false,
  reloadToken = 0,
}) {
  const [agendaItems, setAgendaItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTypes, setSelectedTypes] = useState([
    "meeting",
    "task",
    "milestone",
    "deadline",
    "weekly-review",
    "organization-deadline",
    "performance-review",
    "compensation-review",
    "onboarding-milestone",
    "company-event",
  ]);
  const [view, setView] = useState("upcoming");
  const calendarUserId = user?.id || user?._id || null;

  const loadAgenda = async () => {
    if (!calendarUserId) return;
    setLoading(true);
    setError(null);
    try {
      let result;
      switch (view) {
        case "today":
          result = await agendaApi.getTodayAgenda(calendarUserId);
          break;
        case "week":
          result = await agendaApi.getWeekAgenda(calendarUserId);
          break;
        case "overdue":
          result = await agendaApi.getOverdueAgenda(calendarUserId);
          break;
        case "upcoming":
        default:
          result = await agendaApi.getUpcomingAgenda(calendarUserId, 14);
          break;
      }
      if (result.success) {
        const list = Array.isArray(result.agenda) ? result.agenda : [];
        const filtered = list.filter((item) =>
          itemMatchesSelectedTypes(item, selectedTypes),
        );
        setAgendaItems(filtered);
      } else {
        setError(result.error || "Could not load agenda");
        setAgendaItems([]);
      }
    } catch (err) {
      console.error("Error loading agenda:", err);
      setError(err instanceof Error ? err.message : "Could not load agenda");
      setAgendaItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (calendarUserId) {
      loadAgenda();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load when filters/view/token change
  }, [calendarUserId, selectedTypes, view, reloadToken]);

  const toggleType = (type) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const getItemIcon = (item) => {
    switch (item.type) {
      case "meeting":
        return item.metadata?.type === "video-call" ? Video : Users;
      case "company-event":
        return Calendar;
      case "organization-deadline":
        return AlertCircle;
      case "task":
        return item.status === "completed" ? CheckCircle2 : CheckSquare;
      case "milestone":
        return Target;
      case "deadline":
        return AlertCircle;
      case "weekly-review":
        return TrendingUp;
      default:
        return Circle;
    }
  };

  const getItemStatusBadge = (item) => {
    if (item.isOverdue) {
      return (
        <Badge variant="destructive" className="text-[8px] px-1.5 py-0">
          Overdue
        </Badge>
      );
    }
    if (item.status === "completed") {
      return (
        <Badge
          variant="default"
          className="text-[8px] px-1.5 py-0 bg-[#2ECC71]"
        >
          Done
        </Badge>
      );
    }
    if (item.status === "in-progress") {
      return (
        <Badge
          variant="default"
          className="text-[8px] px-1.5 py-0 bg-[#3A5AFE]"
        >
          In Progress
        </Badge>
      );
    }
    if (item.isRecurringSeries && item.occurrenceCount > 1) {
      return (
        <Badge variant="secondary" className="text-[8px] px-1.5 py-0">
          {item.occurrenceCount} events
        </Badge>
      );
    }
    return null;
  };

  const getDateLabel = (dateStr) => {
    try {
      const date = parseISO(dateStr);
      if (isToday(date)) return "Today";
      if (isTomorrow(date)) return "Tomorrow";
      if (isThisWeek(date)) return format(date, "EEEE");
      return format(date, "MMM d, yyyy");
    } catch {
      return dateStr;
    }
  };

  const displayItems = useMemo(
    () => collapseRecurringAgendaItems(agendaItems),
    [agendaItems],
  );

  const groupedItems = displayItems.reduce((acc, item) => {
    const dateKey = item.date || item.dueDate || "No Date";
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {});
  const sortedDates = Object.keys(groupedItems).sort();

  const typeOptions = [
    { type: "meeting", label: "Meetings" },
    { type: "task", label: "Tasks" },
    { type: "milestone", label: "Milestones" },
    { type: "deadline", label: "Deadlines" },
    { type: "weekly-review", label: "Reviews" },
    { type: "organization-deadline", label: "Org Deadlines" },
    { type: "performance-review", label: "Perf Reviews" },
    { type: "compensation-review", label: "Comp Reviews" },
    { type: "onboarding-milestone", label: "Onboarding" },
    { type: "company-event", label: "Events" },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-surface-page">
      <div className="flex shrink-0 items-center gap-2 border-b border-surface-border px-4 py-2.5">
        <Select value={view} onValueChange={(value) => setView(value)}>
          <SelectTrigger className="h-8 w-[118px] rounded-lg border-surface-border bg-surface-card text-xs font-medium text-text-heading">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[9999]">
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild={true}>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 rounded-lg border-surface-border bg-surface-card px-2.5 text-xs font-medium text-text-heading"
            >
              <Filter className="h-3 w-3" />
              Filter
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="z-[9999] w-[150px]">
            {typeOptions.map((option) => (
              <DropdownMenuItem
                key={option.type}
                className="flex cursor-pointer items-center gap-2 text-[12px]"
                onSelect={(e) => {
                  e.preventDefault();
                  toggleType(option.type);
                }}
              >
                <div
                  className={`flex h-3.5 w-3.5 items-center justify-center rounded-sm border ${
                    selectedTypes.includes(option.type)
                      ? "border-primary bg-primary text-white"
                      : "border-surface-border bg-surface-card"
                  }`}
                >
                  {selectedTypes.includes(option.type) ? (
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  ) : null}
                </div>
                <span>{option.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <div className="space-y-2 px-2 py-8 text-center text-muted-foreground">
            <AlertCircle className="mx-auto h-8 w-8 text-destructive opacity-80" />
            <p className="text-[11px] text-destructive">{error}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-[10px]"
              onClick={() => loadAgenda()}
            >
              Retry
            </Button>
          </div>
        ) : displayItems.length === 0 ? (
          <div className="px-4 py-12 text-center text-text-muted">
            <Calendar className="mx-auto mb-3 h-8 w-8 opacity-35" />
            <p className="mb-1 text-sm font-semibold text-text-heading">
              No agenda items
            </p>
            <p className="text-xs">
              {view === "overdue"
                ? "You're all caught up!"
                : "Nothing scheduled for this period"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {sortedDates.map((dateKey) => (
              <div key={dateKey}>
                <div className="sticky top-0 z-10 mb-2 flex items-center gap-2 bg-surface-page py-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                    {getDateLabel(dateKey)}
                  </span>
                  <div className="h-px flex-1 bg-surface-border" />
                  <span className="text-[10px] text-text-muted">
                    {groupedItems[dateKey].length} item
                    {groupedItems[dateKey].length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {groupedItems[dateKey].map((item) => {
                    const Icon = getItemIcon(item);
                    return (
                      <button
                        key={`${item.kind || "item"}-${item.id}`}
                        type="button"
                        onClick={() => onItemClick?.(item)}
                        className="flex w-full cursor-pointer items-start gap-2.5 rounded-xl border border-surface-border bg-surface-card px-3 py-2.5 text-left transition-colors hover:border-primary/30 hover:bg-primary-tint/40"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-page">
                          <Icon className="h-3.5 w-3.5 text-text-body" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-0.5 flex items-start justify-between gap-2">
                            <p
                              className={`truncate text-[13px] font-semibold text-text-heading ${
                                item.status === "completed"
                                  ? "line-through opacity-50"
                                  : ""
                              }`}
                            >
                              {item.title}
                            </p>
                            {getItemStatusBadge(item)}
                          </div>
                          {item.description ? (
                            <p className="mb-1 truncate text-[11px] text-text-muted">
                              {item.description}
                            </p>
                          ) : null}
                          <div className="flex flex-wrap items-center gap-2">
                            {item.startTime ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-text-body">
                                <Clock className="h-2.5 w-2.5 text-text-muted" />
                                {item.startTime}
                                {item.endTime ? ` – ${item.endTime}` : ""}
                              </span>
                            ) : null}
                            {item.type === "task" &&
                            item.metadata?.progress !== undefined ? (
                              <Badge
                                variant="outline"
                                className="px-1.5 py-0 text-[10px]"
                              >
                                {item.metadata.progress}%
                              </Badge>
                            ) : null}
                            {item.type === "milestone" &&
                            item.metadata?.tasksCompleted !== undefined ? (
                              <Badge
                                variant="outline"
                                className="px-1.5 py-0 text-[10px]"
                              >
                                {item.metadata.tasksCompleted}/
                                {item.metadata.totalTasks} tasks
                              </Badge>
                            ) : null}
                            {item.priority && item.priority !== "medium" ? (
                              <Badge
                                variant={
                                  item.priority === "urgent"
                                    ? "destructive"
                                    : "secondary"
                                }
                                className="px-1.5 py-0 text-[10px]"
                              >
                                {item.priority}
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
