/**
 * Organization Agenda - Calendar view of all events across cohorts
 * Shows upcoming events with join capabilities and notifications
 */

import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/apiBase.js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Users,
  Loader2,
  CalendarDays,
} from "lucide-react";
import { unwrapData } from "../../utils/apiEnvelope";
import { normalizeListPage } from "../../utils/api/listQuery";

const API_BASE = API_BASE_URL;

// Default fetch options for cookie-based auth
const defaultOptions = {
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
};

export default function OrganizationAgenda({
  organizationId,
  userId,
  cohorts,
}) {
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  useEffect(() => {
    loadAllEvents();
  }, [organizationId, cohorts]);
  const loadAllEvents = async () => {
    try {
      setLoading(true);

      // Load events from all cohorts
      const eventPromises = cohorts.map(async (cohort) => {
        try {
          const cohortId = cohort.id || cohort._id;
          const response = await fetch(`${API_BASE}/cohorts/${cohortId}/events`, {
            ...defaultOptions,
          });
          if (!response.ok) return [];
          const inner = unwrapData(await response.json());

          // Add cohort name to each event
          return normalizeListPage(inner, "events").items.map((event) => ({
            ...event,
            cohortName: cohort.name,
          }));
        } catch (error) {
          console.error(`Error loading events for cohort ${cohort.id}:`, error);
          return [];
        }
      });
      const eventsArrays = await Promise.all(eventPromises);
      const allEventsFlat = eventsArrays.flat();

      // Sort by start time
      allEventsFlat.sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      );
      setAllEvents(allEventsFlat);
    } catch (error) {
      console.error("Error loading organization events:", error);
    } finally {
      setLoading(false);
    }
  };
  const getEventTypeColor = (type) => {
    switch (type) {
      case "demo-day":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20";
      case "workshop":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
      case "office-hours":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
      case "networking":
        return "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";
    }
  };
  const isToday = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };
  const isThisWeek = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return date >= today && date <= weekFromNow;
  };
  const isPast = (dateStr) => {
    return new Date(dateStr) < new Date();
  };
  const isEventSoon = (startTime) => {
    const eventDate = new Date(startTime);
    const now = new Date();
    const hoursUntil = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntil <= 1 && hoursUntil >= 0;
  };
  const handleJoinEvent = (meetingUrl) => {
    if (meetingUrl.includes("/join/")) {
      const roomName = meetingUrl.split("/join/")[1];
      window.location.href = `/join/${roomName}`;
    } else {
      window.open(meetingUrl, "_blank");
    }
  };
  const filterEvents = (events) => {
    const now = new Date();
    switch (activeTab) {
      case "today":
        return events.filter(
          (e) => isToday(e.startTime) && !isPast(e.startTime),
        );
      case "week":
        return events.filter(
          (e) => isThisWeek(e.startTime) && !isPast(e.startTime),
        );
      case "upcoming":
        return events.filter((e) => !isPast(e.startTime));
      case "all":
        return events;
      default:
        return events;
    }
  };
  const filteredEvents = filterEvents(allEvents);
  const upcomingCount = allEvents.filter((e) => !isPast(e.startTime)).length;
  const todayCount = allEvents.filter(
    (e) => isToday(e.startTime) && !isPast(e.startTime),
  ).length;
  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-sm text-muted-foreground">Loading agenda...</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                Organization Agenda
              </CardTitle>
              <CardDescription className="mt-1">
                All events across your cohorts
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 text-sm">
              {todayCount > 0 && (
                <Badge variant="default" className="gap-1">
                  <Clock className="w-3 h-3" />
                  {todayCount}
                  {" today"}
                </Badge>
              )}
              <Badge variant="outline" className="gap-1">
                <Calendar className="w-3 h-3" />
                {upcomingCount}
                {" upcoming"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="upcoming" className="text-xs">
                Upcoming ({upcomingCount})
              </TabsTrigger>
              <TabsTrigger value="today" className="text-xs">
                Today ({todayCount})
              </TabsTrigger>
              <TabsTrigger value="week" className="text-xs">
                This Week
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs">
                All Events
              </TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab} className="mt-4 space-y-3">
              {filteredEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    {"No events "}
                    {activeTab === "all" ? "scheduled" : `for ${activeTab}`}
                  </p>
                </div>
              ) : (
                filteredEvents.map((event) => {
                  const eventDate = new Date(event.startTime);
                  const isPastEvent = isPast(event.startTime);
                  const isSoon = isEventSoon(event.startTime);
                  const attending = event.attendees.filter(
                    (a) => a.status === "attending",
                  ).length;
                  return (
                    <Card
                      key={event.id}
                      className={`${isPastEvent ? "opacity-60" : ""} ${isSoon ? "border-primary bg-primary/5" : ""}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-16 text-center">
                            <div className="bg-primary/10 rounded-lg p-2 border border-primary/20">
                              <div className="text-xs font-medium text-primary">
                                {eventDate
                                  .toLocaleDateString("en-US", {
                                    month: "short",
                                  })
                                  .toUpperCase()}
                              </div>
                              <div className="text-2xl font-bold text-foreground">
                                {eventDate.getDate()}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {eventDate.toLocaleDateString("en-US", {
                                  weekday: "short",
                                })}
                              </div>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-base mb-1 flex items-center gap-2">
                                  {event.title}
                                  {isSoon && (
                                    <Badge
                                      variant="destructive"
                                      className="text-[10px] animate-pulse"
                                    >
                                      STARTING SOON
                                    </Badge>
                                  )}
                                  {isPastEvent && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px]"
                                    >
                                      Completed
                                    </Badge>
                                  )}
                                </h3>
                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${getEventTypeColor(event.eventType)}`}
                                  >
                                    {event.eventType.replace("-", " ")}
                                  </Badge>
                                  {event.cohortName && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {event.cohortName}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            {event.description && (
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {event.description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                {eventDate.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                                {event.endTime && (
                                  <span>
                                    {" "}
                                    {"- "}
                                    {new Date(event.endTime).toLocaleTimeString(
                                      [],
                                      {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      },
                                    )}
                                  </span>
                                )}
                              </div>
                              {event.isVirtual ? (
                                <div className="flex items-center gap-1.5 text-blue-600">
                                  <Video className="w-4 h-4" />
                                  Virtual Event
                                </div>
                              ) : (
                                event.location && (
                                  <div className="flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4" />
                                    {event.location}
                                  </div>
                                )
                              )}
                              <div className="flex items-center gap-1.5">
                                <Users className="w-4 h-4" />
                                {attending}
                                {" attendee"}
                                {attending !== 1 ? "s" : ""}
                                {event.capacity && (
                                  <span className="text-xs">
                                    {"/ "}
                                    {event.capacity}
                                    {" capacity"}
                                  </span>
                                )}
                              </div>
                            </div>
                            {event.isVirtual &&
                              event.meetingUrl &&
                              !isPastEvent && (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleJoinEvent(event.meetingUrl)
                                  }
                                  className="gap-2"
                                  variant={isSoon ? "default" : "outline"}
                                >
                                  <Video className="w-4 h-4" />
                                  {isSoon ? "Join Now" : "Join Meeting"}
                                </Button>
                              )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingCount}</p>
                <p className="text-xs text-muted-foreground">Upcoming Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{todayCount}</p>
                <p className="text-xs text-muted-foreground">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {allEvents.reduce(
                    (sum, e) =>
                      sum +
                      e.attendees.filter((a) => a.status === "attending")
                        .length,
                    0,
                  )}
                </p>
                <p className="text-xs text-muted-foreground">Total RSVPs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
