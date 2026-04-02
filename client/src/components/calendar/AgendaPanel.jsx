import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
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
export default function AgendaPanel({ user, onItemClick, compact = false }) {
  const [agendaItems, setAgendaItems] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const startupId = user.role === "founder" ? user.id : user.startupId;
  useEffect(() => {
    if (startupId) {
      loadAgenda();
    }
  }, [startupId, selectedTypes, view]);
  const loadAgenda = async () => {
    setLoading(true);
    try {
      let result;
      switch (view) {
        case "today":
          result = await agendaApi.getTodayAgenda(startupId);
          break;
        case "week":
          result = await agendaApi.getWeekAgenda(startupId);
          break;
        case "overdue":
          result = await agendaApi.getOverdueAgenda(startupId);
          break;
        case "upcoming":
        default:
          result = await agendaApi.getUpcomingAgenda(startupId, 14); // Next 14 days
          break;
      }
      if (result.success && result.agenda) {
        // Filter by selected types
        const filtered = result.agenda.filter((item) =>
          selectedTypes.includes(item.type),
        );
        setAgendaItems(filtered);
      }
    } catch (error) {
      console.error("Error loading agenda:", error);
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
    <Card className={compact ? "" : "h-full"}>
      <CardHeader className="pb-0 pt-0.5 px-2">
        <div className="flex items-center gap-1">
          <Select value={view} onValueChange={(value) => setView(value)}>
            <SelectTrigger className="h-4 w-[75px] text-[8px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[9999]">
              <SelectItem value="upcoming" className="text-[8px]">
                Upcoming
              </SelectItem>
              <SelectItem value="today" className="text-[8px]">
                Today
              </SelectItem>
              <SelectItem value="week" className="text-[8px]">
                Week
              </SelectItem>
              <SelectItem value="overdue" className="text-[8px]">
                Overdue
              </SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild={true}>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 text-[8px] px-1.5"
              >
                <Filter className="w-2 h-2 mr-0.5" />
                Filter
                <ChevronDown className="w-2 h-2 ml-0.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[120px] z-[9999]">
              {typeOptions.map((option) => (
                <DropdownMenuItem
                  key={option.type}
                  className="text-[9px] flex items-center gap-2 cursor-pointer"
                  onSelect={(e) => {
                    e.preventDefault();
                    toggleType(option.type);
                  }}
                >
                  <div
                    className={`w-3 h-3 border border-gray-400 rounded-sm flex items-center justify-center ${selectedTypes.includes(option.type) ? "bg-black" : "bg-white"}`}
                  />
                  <span>{option.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-2 pt-0">
        <ScrollArea className={compact ? "h-[300px]" : "h-[calc(100vh-280px)]"}>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#3A5AFE] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : agendaItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-[11px]">No agenda items</p>
              <p className="text-[9px] mt-1">
                {view === "overdue"
                  ? "You're all caught up!"
                  : "Nothing scheduled for this period"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedDates.map((dateKey) => (
                <div key={dateKey} className="space-y-1">
                  <div className="flex items-center gap-2 sticky top-0 bg-background/95 backdrop-blur-sm py-0.5 z-10">
                    <div className="text-[10px] font-semibold text-muted-foreground">
                      {getDateLabel(dateKey)}
                    </div>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="space-y-1.5">
                    {groupedItems[dateKey].map((item) => {
                      const Icon = getItemIcon(item);
                      return (
                        <button
                          key={item.id}
                          onClick={() => onItemClick?.(item)}
                          className="w-full text-left p-2.5 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
                        >
                          <div className="flex items-start gap-2">
                            <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 bg-white border border-gray-200">
                              <Icon
                                className="w-3.5 h-3.5"
                                style={{
                                  color: item.color,
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p
                                    className={`text-[11px] font-medium truncate ${item.status === "completed" ? "line-through text-muted-foreground" : ""}`}
                                  >
                                    {item.title}
                                  </p>
                                  {item.description && (
                                    <p className="text-[9px] text-muted-foreground truncate mt-0.5">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                                {getItemStatusBadge(item)}
                              </div>
                              <div className="flex items-center gap-2 mt-1.5">
                                {item.startTime && (
                                  <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                                    <Clock className="w-2.5 h-2.5" />
                                    {item.startTime}
                                    {item.endTime && ` - ${item.endTime}`}
                                  </div>
                                )}
                                {item.type === "task" &&
                                  item.metadata?.progress !== undefined && (
                                    <Badge
                                      variant="outline"
                                      className="text-[8px] px-1.5 py-0"
                                    >
                                      {item.metadata.progress}%
                                    </Badge>
                                  )}
                                {item.type === "milestone" &&
                                  item.metadata?.tasksCompleted !==
                                    undefined && (
                                    <Badge
                                      variant="outline"
                                      className="text-[8px] px-1.5 py-0"
                                    >
                                      {item.metadata.tasksCompleted}/
                                      {item.metadata.totalTasks}
                                      {" tasks"}
                                    </Badge>
                                  )}
                                {item.priority &&
                                  item.priority !== "medium" && (
                                    <Badge
                                      variant={
                                        item.priority === "urgent"
                                          ? "destructive"
                                          : "secondary"
                                      }
                                      className="text-[8px] px-1.5 py-0"
                                    >
                                      {item.priority}
                                    </Badge>
                                  )}
                              </div>
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
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
