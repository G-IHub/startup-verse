import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import * as agendaApi from "../../utils/api/agendaApi";
import { format, isToday, isTomorrow, isThisWeek, parseISO } from "date-fns";

/**
 * AgendaPanel - Unified Startup Command Center
 *
 * Displays all startup activities in one place:
 * - Meetings (in-person & video calls)
 * - Tasks with due dates
 * - Milestones with deadlines
 * - Weekly review cycles
 * - Overdue items highlighted in red
 *
 * Features:
 * - 4 view modes: Upcoming, Today, This Week, Overdue
 * - Type filters (meetings, tasks, milestones, etc.)
 * - Color-coded items by type and status
 * - Grouped by date with smart labels
 */
function itemMatchesSelectedTypes(item, selectedTypes) {
  if (selectedTypes.includes(item.type)) return true;
  if (
    item.type === "company-event" &&
    selectedTypes.includes("meeting")
  ) {
    return true;
  }
  return false;
}

export default function AgendaPanel({ user, onItemClick, compact = false }) {
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
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState("upcoming");
  const calendarUserId = user?.id || user?._id || null;

  useEffect(() => {
    if (calendarUserId) {
      loadAgenda();
    } else {
      setLoading(false);
    }
  }, [calendarUserId, selectedTypes, view]);

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
    return null;
  };
  const getDateLabel = (dateStr) => {
    try {
      const date = parseISO(dateStr);
      if (isToday(date)) {
        return "Today";
      }
      if (isTomorrow(date)) {
        return "Tomorrow";
      }
      if (isThisWeek(date)) {
        return format(date, "EEEE"); // Day name
      }
      return format(date, "MMM d, yyyy");
    } catch {
      return dateStr;
    }
  };

  // Group items by date
  const groupedItems = agendaItems.reduce((acc, item) => {
    const dateKey = item.date || item.dueDate || "No Date";
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(item);
    return acc;
  }, {});
  const sortedDates = Object.keys(groupedItems).sort();
  const typeOptions = [
    {
      type: "meeting",
      label: "Meetings",
      color: "bg-purple-500",
    },
    {
      type: "task",
      label: "Tasks",
      color: "bg-blue-500",
    },
    {
      type: "milestone",
      label: "Milestones",
      color: "bg-amber-500",
    },
    {
      type: "deadline",
      label: "Deadlines",
      color: "bg-red-500",
    },
    {
      type: "weekly-review",
      label: "Reviews",
      color: "bg-emerald-500",
    },
    {
      type: "organization-deadline",
      label: "Org Deadlines",
      color: "bg-red-500",
    },
    {
      type: "performance-review",
      label: "Perf Reviews",
      color: "bg-emerald-500",
    },
    {
      type: "compensation-review",
      label: "Comp Reviews",
      color: "bg-emerald-500",
    },
    {
      type: "onboarding-milestone",
      label: "Onboarding",
      color: "bg-amber-500",
    },
    {
      type: "company-event",
      label: "Events",
      color: "bg-purple-500",
    },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Controls bar */}
      <div style={{
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 16px 8px",
        borderBottom: "1px solid #f1f5f9",
      }}>
        <Select value={view} onValueChange={(value) => setView(value)}>
          <SelectTrigger
            style={{
              height: 30, fontSize: 12, fontWeight: 500,
              border: "1px solid #e5e7eb", borderRadius: 7,
              padding: "0 10px", backgroundColor: "#f9fafb",
              color: "#374151", cursor: "pointer", width: 110,
            }}
          >
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
              variant="ghost"
              size="sm"
              style={{
                height: 30, fontSize: 12, fontWeight: 500,
                border: "1px solid #e5e7eb", borderRadius: 7,
                padding: "0 10px", backgroundColor: "#f9fafb",
                color: "#374151", gap: 4,
              }}
            >
              <Filter style={{ width: 12, height: 12 }} />
              Filter
              <ChevronDown style={{ width: 12, height: 12 }} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[150px] z-[9999]">
            {typeOptions.map((option) => (
              <DropdownMenuItem
                key={option.type}
                className="text-[12px] flex items-center gap-2 cursor-pointer"
                onSelect={(e) => {
                  e.preventDefault();
                  toggleType(option.type);
                }}
              >
                <div
                  className={`w-3.5 h-3.5 border border-gray-400 rounded-sm flex items-center justify-center ${selectedTypes.includes(option.type) ? "bg-indigo-600 border-indigo-600" : "bg-white"}`}
                />
                <span>{option.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/* Scrollable content fills remaining height */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "8px 12px 16px" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 0" }}>
              <div style={{ width: 24, height: 24, border: "2px solid #4f46e5", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            </div>
          ) : error ? (
            <div className="text-center py-8 px-2 text-muted-foreground space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-destructive opacity-80" />
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
          ) : agendaItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 16px", color: "#9ca3af" }}>
              <Calendar style={{ width: 36, height: 36, margin: "0 auto 12px", opacity: 0.35 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 4 }}>No agenda items</p>
              <p style={{ fontSize: 12 }}>
                {view === "overdue" ? "You're all caught up!" : "Nothing scheduled for this period"}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {sortedDates.map((dateKey) => (
                <div key={dateKey}>
                  {/* Date group header */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    marginBottom: 8,
                    position: "sticky", top: 0,
                    backgroundColor: "#fafbff",
                    paddingTop: 4, paddingBottom: 4,
                    zIndex: 10,
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {getDateLabel(dateKey)}
                    </span>
                    <div style={{ flex: 1, height: 1, backgroundColor: "#e9eef6" }} />
                    <span style={{ fontSize: 10, color: "#9ca3af" }}>
                      {groupedItems[dateKey].length} item{groupedItems[dateKey].length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {/* Items */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {groupedItems[dateKey].map((item) => {
                      const Icon = getItemIcon(item);
                      const accentColor = item.color || "#6b7280";
                      return (
                        <button
                          key={`${item.kind || "item"}-${item.id}`}
                          onClick={() => onItemClick?.(item)}
                          style={{
                            width: "100%", textAlign: "left",
                            padding: "10px 12px",
                            borderRadius: 10,
                            border: "1px solid #e9eef6",
                            backgroundColor: "#ffffff",
                            cursor: "pointer",
                            display: "flex", alignItems: "flex-start", gap: 10,
                            borderLeft: `3px solid ${accentColor}`,
                          }}
                        >
                          <div style={{
                            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                            backgroundColor: "#f8f7ff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <Icon style={{ width: 14, height: 14, color: accentColor }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6, marginBottom: 3 }}>
                              <p style={{
                                fontSize: 13, fontWeight: 600, color: "#111827",
                                textDecoration: item.status === "completed" ? "line-through" : "none",
                                opacity: item.status === "completed" ? 0.5 : 1,
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                              }}>
                                {item.title}
                              </p>
                              {getItemStatusBadge(item)}
                            </div>
                            {item.description && (
                              <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {item.description}
                              </p>
                            )}
                            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                              {item.startTime && (
                                <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "#6b7280" }}>
                                  <Clock style={{ width: 10, height: 10, color: "#4f46e5" }} />
                                  {item.startTime}{item.endTime ? ` – ${item.endTime}` : ""}
                                </span>
                              )}
                              {item.type === "task" && item.metadata?.progress !== undefined && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {item.metadata.progress}%
                                </Badge>
                              )}
                              {item.type === "milestone" && item.metadata?.tasksCompleted !== undefined && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {item.metadata.tasksCompleted}/{item.metadata.totalTasks} tasks
                                </Badge>
                              )}
                              {item.priority && item.priority !== "medium" && (
                                <Badge
                                  variant={item.priority === "urgent" ? "destructive" : "secondary"}
                                  className="text-[10px] px-1.5 py-0"
                                >
                                  {item.priority}
                                </Badge>
                              )}
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
