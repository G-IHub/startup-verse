import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Video,
  CheckSquare,
  Users,
} from "lucide-react";
import { cn } from "../ui/utils";
import * as agendaApi from "../../utils/api/agendaApi";
import AgendaPanel from "./AgendaPanel";
export default function CalendarView({
  user,
  tasks = [],
  meetings = [],
  onScheduleMeeting,
  onEventClick,
  compact = false,
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("month");
  const [selectedDate, setSelectedDate] = useState(null);
  const [events, setEvents] = useState([]);
  const [agendaItems, setAgendaItems] = useState([]);
  const [agendaLoading, setAgendaLoading] = useState(false);
  const startupId = user.role === "founder" ? user.id : user.startupId;

  // Load agenda items
  useEffect(() => {
    if (startupId) {
      loadAgendaItems();
    }
  }, [startupId]);
  const loadAgendaItems = async () => {
    setAgendaLoading(true);
    try {
      const result = await agendaApi.getUpcomingAgenda(startupId, 30); // Next 30 days
      if (result.success && result.agenda) {
        setAgendaItems(result.agenda);
      }
    } catch (error) {
      console.error("Error loading agenda items:", error);
    } finally {
      setAgendaLoading(false);
    }
  };

  // Convert tasks and meetings to calendar events
  useEffect(() => {
    const calendarEvents = [];

    // Add tasks with due dates
    tasks.forEach((task) => {
      if (task.dueDate) {
        calendarEvents.push({
          id: `task-${task.id}`,
          title: task.title,
          type: "task",
          date: new Date(task.dueDate),
          status: task.status,
          description: task.description,
          color:
            task.status === "completed"
              ? "bg-green-500"
              : task.status === "in-progress"
                ? "bg-blue-500"
                : "bg-slate-500",
        });
      }
    });

    // Add meetings
    meetings.forEach((meeting) => {
      calendarEvents.push({
        id: `meeting-${meeting.id}`,
        title: meeting.title,
        type: meeting.type === "video-call" ? "call" : "meeting",
        date: new Date(meeting.date),
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        description: meeting.description,
        attendees: meeting.attendees,
        location: meeting.location,
        color: "bg-purple-500",
      });
    });
    setEvents(calendarEvents);
  }, [tasks, meetings]);

  // Calendar helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    return {
      daysInMonth,
      startingDayOfWeek,
      firstDay,
      lastDay,
    };
  };
  const getMonthName = (date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };
  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };
  const isSameDay = (date1, date2) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };
  const getEventsForDate = (date) => {
    return events.filter((event) => isSameDay(event.date, date));
  };
  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Get upcoming events (next 7 days)
  const getUpcomingEvents = () => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    return events
      .filter((event) => event.date >= today && event.date <= nextWeek)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5);
  };
  const upcomingEvents = getUpcomingEvents();
  const getEventIcon = (type) => {
    switch (type) {
      case "task":
        return CheckSquare;
      case "call":
        return Video;
      case "meeting":
        return Users;
      default:
        return CalendarIcon;
    }
  };
  return (
    <div
      className={cn(
        "grid gap-2 md:gap-3",
        compact ? "lg:grid-cols-1" : "lg:grid-cols-3",
      )}
    >
      <Card className={cn(compact ? "lg:col-span-1" : "lg:col-span-2")}>
        <CardHeader className="pb-2 pt-2.5 px-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-1.5 text-xs md:text-sm">
              <CalendarIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#3A5AFE]" />
              {getMonthName(currentDate)}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={goToToday}
                className="h-6 text-[9px] px-2"
              >
                Today
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigateMonth("prev")}
                className="h-6 w-6 p-0"
              >
                <ChevronLeft className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigateMonth("next")}
                className="h-6 w-6 p-0"
              >
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-2">
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => (
              <div
                key={day}
                className="text-center text-[9px] font-semibold text-muted-foreground py-1"
              >
                {day}
              </div>
            ))}
            {Array.from({
              length: startingDayOfWeek,
            }).map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}
            {Array.from({
              length: daysInMonth,
            }).map((_, index) => {
              const day = index + 1;
              const date = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                day,
              );
              const dayEvents = getEventsForDate(date);
              const isCurrentDay = isToday(date);
              const isSelected = selectedDate && isSameDay(date, selectedDate);

              // Check for agenda items on this date
              const dateStr = date.toISOString().split("T")[0];
              const dayAgendaItems = agendaItems.filter((item) => {
                const itemDate = (item.date || item.dueDate || "").split(
                  "T",
                )[0];
                return itemDate === dateStr;
              });
              const hasAgendaItems = dayAgendaItems.length > 0;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    "aspect-square p-1 rounded-lg text-[10px] font-medium transition-all relative",
                    "hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-[#3A5AFE]/50",
                    isCurrentDay &&
                      "bg-[#3A5AFE] text-white hover:bg-[#304FFE]",
                    isSelected &&
                      !isCurrentDay &&
                      "bg-[#3A5AFE]/10 border-2 border-[#3A5AFE]",
                    !isCurrentDay &&
                      !isSelected &&
                      hasAgendaItems &&
                      "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
                    !isCurrentDay &&
                      !isSelected &&
                      !hasAgendaItems &&
                      "text-gray-700 dark:text-gray-300",
                  )}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <span>{day}</span>
                    {hasAgendaItems && !isCurrentDay && (
                      <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-purple-500" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          {selectedDate && getEventsForDate(selectedDate).length > 0 && (
            <div className="mt-3 pt-3 border-t space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">
                {"Events on "}
                {selectedDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
              {getEventsForDate(selectedDate).map((event) => {
                const IconComponent = getEventIcon(event.type);
                return (
                  <div
                    key={event.id}
                    onClick={() => onEventClick?.(event)}
                    className="flex items-start gap-2 p-2 bg-muted/40 hover:bg-muted/60 rounded-lg transition-colors cursor-pointer"
                  >
                    <div
                      className={cn(
                        "w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0",
                        event.color
                          ? `${event.color}/10`
                          : "bg-blue-100 dark:bg-blue-900/30",
                      )}
                    >
                      <IconComponent
                        className={cn(
                          "w-3 h-3",
                          event.color
                            ? event.color.replace("bg-", "text-")
                            : "text-blue-600",
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium truncate">
                        {event.title}
                      </p>
                      {event.startTime && (
                        <p className="text-[9px] text-muted-foreground">
                          {event.startTime}
                          {" - "}
                          {event.endTime}
                        </p>
                      )}
                      {event.type === "task" && event.status && (
                        <Badge
                          variant="outline"
                          className="text-[8px] px-1 py-0 h-4 mt-0.5"
                        >
                          {event.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      {!compact && (
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2 pt-2.5 px-3">
            <div className="flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#3A5AFE]" />
              <CardTitle className="text-xs md:text-sm">Agenda</CardTitle>
              {agendaItems.length > 0 && (
                <Badge
                  variant="secondary"
                  className="text-[8px] px-1.5 py-0 h-4 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                >
                  {agendaItems.length}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-2">
            <div className="h-[400px]">
              {agendaLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-2">
                    <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-[10px] text-muted-foreground">
                      Loading agenda...
                    </p>
                  </div>
                </div>
              ) : (
                <AgendaPanel
                  user={user}
                  onItemClick={(item) => {
                    console.log("Calendar agenda item clicked:", item);
                  }}
                  compact={true}
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
