/**
 * Mini Calendar Component
 * Shows ALL calendar events (events, deliverables, milestones, outcomes)
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  Clock,
  MapPin,
  Video,
  FileText,
  Target,
  TrendingUp,
} from "lucide-react";
import { getOrganizationCalendarEvents } from "../../utils/calendarIntegration";
export default function MiniCalendar({
  organizationId,
  events: propEvents,
  onDateClick,
  onEventClick,
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [allCalendarEvents, setAllCalendarEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (organizationId) {
      loadAllCalendarEvents();
    }
  }, [organizationId]);
  const loadAllCalendarEvents = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const events = await getOrganizationCalendarEvents(organizationId);
      setAllCalendarEvents(events);
      console.log("📅 Loaded calendar events:", events.length);
    } catch (error) {
      console.error("❌ Failed to load calendar events:", error);
    } finally {
      setLoading(false);
    }
  };
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
    };
  };
  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split("T")[0];

    // Use unified calendar events if available, otherwise fall back to prop events
    const eventsToUse =
      allCalendarEvents.length > 0
        ? allCalendarEvents
        : (propEvents || []).map((e) => ({
            id: e.id,
            title: e.title,
            startDate: e.startTime || e.startDate,
            type: "event",
            isVirtual: e.isVirtual,
            meetingUrl: e.meetingUrl,
            source: "organization",
            metadata: e,
          }));
    return eventsToUse.filter((event) => {
      const eventDate = new Date(event.startDate).toISOString().split("T")[0];
      return eventDate === dateStr;
    });
  };
  const handleDateClick = (date) => {
    const dateEvents = getEventsForDate(date);
    if (dateEvents.length > 0) {
      setSelectedDate(date);
      onDateClick?.(date);
    }
  };
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    onEventClick?.(event);
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
  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthName = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  // Count events by type
  const eventCounts = (
    allCalendarEvents.length > 0 ? allCalendarEvents : propEvents || []
  ).reduce((acc, event) => {
    const type = event.type || "event";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  const getEventTypeIcon = (type) => {
    switch (type) {
      case "event":
        return <Calendar className="w-3 h-3" />;
      case "deliverable":
        return <FileText className="w-3 h-3" />;
      case "milestone":
        return <Target className="w-3 h-3" />;
      case "outcome":
        return <TrendingUp className="w-3 h-3" />;
      default:
        return <Calendar className="w-3 h-3" />;
    }
  };
  const getEventTypeColor = (type) => {
    switch (type) {
      case "event":
        return "bg-blue-500";
      case "deliverable":
        return "bg-orange-500";
      case "milestone":
        return "bg-purple-500";
      case "outcome":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };
  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">{monthName}</h3>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigateMonth("prev")}
                className="h-7 w-7 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setCurrentDate(new Date())}
                className="h-7 px-2 text-[10px]"
              >
                Today
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigateMonth("next")}
                className="h-7 w-7 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {days.map((day) => (
              <div
                key={day}
                className="text-[8px] text-center font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({
              length: startingDayOfWeek,
            }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {Array.from({
              length: daysInMonth,
            }).map((_, i) => {
              const day = i + 1;
              const date = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                day,
              );
              const dateEvents = getEventsForDate(date);
              const isToday = date.toDateString() === today.toDateString();
              const isPast = date < today;
              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(date)}
                  className={`
                    aspect-square rounded-md text-[10px] relative
                    hover:bg-accent hover:text-accent-foreground
                    transition-colors
                    ${isToday ? "bg-primary text-primary-foreground font-bold" : ""}
                    ${isPast && !isToday ? "text-muted-foreground" : ""}
                    ${dateEvents.length > 0 && !isToday ? "font-medium" : ""}
                  `}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span>{day}</span>
                    {dateEvents.length > 0 && (
                      <div className="flex gap-[2px] mt-[2px] flex-wrap justify-center px-1">
                        {dateEvents.slice(0, 3).map((event, idx) => (
                          <div
                            key={idx}
                            className={`w-1 h-1 rounded-full ${getEventTypeColor(event.type)}`}
                            title={event.title}
                          />
                        ))}
                        {dateEvents.length > 3 && (
                          <div className="text-[6px] font-bold">
                            +{dateEvents.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t text-[8px]">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">
                Events ({eventCounts.event || 0})
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-muted-foreground">
                Deliverables ({eventCounts.deliverable || 0})
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-muted-foreground">
                Milestones ({eventCounts.milestone || 0})
              </span>
            </div>
            {eventCounts.outcome > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-muted-foreground">
                  Outcomes ({eventCounts.outcome})
                </span>
              </div>
            )}
          </div>
          {(allCalendarEvents.length > 0 || propEvents?.length) && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-[10px] text-muted-foreground text-center">
                {allCalendarEvents.length || propEvents?.length || 0}
                {" total calendar item"}
                {(allCalendarEvents.length || propEvents?.length || 0) !== 1
                  ? "s"
                  : ""}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      {selectedDate && selectedDateEvents.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sv-modal-backdrop"
          onClick={() => setSelectedDate(null)}
        >
          <Card
            className="sv-modal-panel max-h-[80vh] w-full max-w-lg overflow-auto rounded-[16px] border-0 shadow-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold">
                    {selectedDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {selectedDateEvents.length}
                    {" item"}
                    {selectedDateEvents.length !== 1 ? "s" : ""}
                    {" scheduled"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedDate(null)}
                  className="h-7 w-7 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {selectedDateEvents.map((event) => (
                  <Card
                    key={event.id}
                    className="hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => handleEventClick(event)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <div
                          className={`w-8 h-8 rounded-md ${getEventTypeColor(event.type)}/10 flex items-center justify-center flex-shrink-0`}
                        >
                          <div
                            className={`${getEventTypeColor(event.type).replace("bg-", "text-")}`}
                          >
                            {getEventTypeIcon(event.type)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[10px] font-medium truncate">
                            {event.title}
                          </h4>
                          {event.description && (
                            <p className="text-[9px] text-muted-foreground mt-1">
                              {event.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-[8px] text-muted-foreground">
                            <Badge variant="outline" className="text-[7px]">
                              {event.type}
                            </Badge>
                            {event.isVirtual && (
                              <Badge
                                variant="outline"
                                className="text-[7px] gap-1"
                              >
                                <Video className="w-2 h-2" />
                                Virtual
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sv-modal-backdrop"
          onClick={() => setSelectedEvent(null)}
        >
          <Card
            className="sv-modal-panel w-full max-w-xl rounded-[16px] border-0 shadow-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className={`w-10 h-10 rounded-lg ${getEventTypeColor(selectedEvent.type)}/10 flex items-center justify-center flex-shrink-0`}
                  >
                    <div
                      className={`${getEventTypeColor(selectedEvent.type).replace("bg-", "text-")}`}
                    >
                      {getEventTypeIcon(selectedEvent.type)}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold">
                      {selectedEvent.title}
                    </h3>
                    <Badge variant="outline" className="text-[8px] mt-1">
                      {selectedEvent.type.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedEvent(null)}
                  className="h-7 w-7 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {selectedEvent.description && (
                <div className="mb-4">
                  <p className="text-[11px] text-muted-foreground">
                    {selectedEvent.description}
                  </p>
                </div>
              )}
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-[11px]">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {new Date(selectedEvent.startDate).toLocaleDateString(
                      "en-US",
                      {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      },
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {new Date(selectedEvent.startDate).toLocaleTimeString(
                      "en-US",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </span>
                </div>
                {selectedEvent.location && !selectedEvent.isVirtual && (
                  <div className="flex items-center gap-2 text-[11px]">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
                {selectedEvent.isVirtual && (
                  <div className="flex items-center gap-2 text-[11px]">
                    <Video className="w-4 h-4 text-muted-foreground" />
                    <span>Virtual Event</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-4 border-t">
                {selectedEvent.meetingUrl && selectedEvent.type === "event" && (
                  <Button
                    size="sm"
                    className="gap-2 flex-1"
                    onClick={() =>
                      window.open(selectedEvent.meetingUrl, "_blank")
                    }
                  >
                    <Video className="w-4 h-4" />
                    Join Meeting
                  </Button>
                )}
                {selectedEvent.type === "deliverable" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 flex-1"
                    onClick={() => {
                      // Navigate to deliverables section
                      setSelectedEvent(null);
                    }}
                  >
                    <FileText className="w-4 h-4" />
                    View Deliverable
                  </Button>
                )}
                {selectedEvent.type === "milestone" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 flex-1"
                    onClick={() => {
                      // Navigate to milestones section
                      setSelectedEvent(null);
                    }}
                  >
                    <Target className="w-4 h-4" />
                    View Milestone
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedEvent(null)}
                >
                  Close
                </Button>
              </div>
              {selectedEvent.metadata && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-[9px] text-muted-foreground">
                    {selectedEvent.metadata.cohortName &&
                      `Cohort: ${selectedEvent.metadata.cohortName}`}
                    {selectedEvent.metadata.organizationName &&
                      ` • ${selectedEvent.metadata.organizationName}`}
                    {selectedEvent.metadata.eventType &&
                      ` • ${selectedEvent.metadata.eventType}`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
