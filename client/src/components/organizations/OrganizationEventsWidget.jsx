/**
 * ORGANIZATION EVENTS WIDGET
 * Shows upcoming organization events for founders
 * Displays in founder dashboard right sidebar
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
import {
  Calendar,
  MapPin,
  Video,
  Clock,
  ExternalLink,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  checkAndSendEventReminders,
  isEventSoon,
  getTimeUntilEvent,
} from "../../utils/eventReminders";
import { unwrapData } from "../../utils/apiEnvelope";

const API_BASE = API_BASE_URL;

// Default fetch options for cookie-based auth
const defaultOptions = {
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
};

export default function OrganizationEventsWidget({
  founderId,
  founderName,
  onNavigate,
}) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rsvpingEventId, setRsvpingEventId] = useState(null);
  const loadFounderEvents = async () => {
    try {
      setLoading(true);
      // Get events for this founder from their cohorts
      const response = await fetch(`${API_BASE}/founder/${founderId}/events`, {
        ...defaultOptions,
      });
      if (!response.ok) {
        console.error("Failed to fetch founder events");
        setEvents([]);
        return;
      }
      const raw = unwrapData(await response.json());
      const list = Array.isArray(raw) ? raw : raw.events || [];
      const normalized = list.map((e) => ({
        ...e,
        id: e.id || e._id,
        startTime: e.startTime || e.startsAt,
      }));
      setEvents(normalized);
    } catch (error) {
      console.error("Error loading events:", error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadFounderEvents();

    // Check for upcoming event reminders
    checkAndSendEventReminders(founderId);

    // Set up interval to check every 5 minutes
    const reminderInterval = setInterval(
      () => {
        checkAndSendEventReminders(founderId);
      },
      5 * 60 * 1000,
    ); // 5 minutes

    return () => clearInterval(reminderInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [founderId]);
  const handleRSVP = async (eventId, status) => {
    setRsvpingEventId(eventId);
    try {
      const response = await fetch(`${API_BASE}/events/${eventId}/rsvp`, {
        ...defaultOptions,
        method: "POST",
        body: JSON.stringify({
          founderId,
          founderName,
          status,
        }),
      });
      if (!response.ok) throw new Error("Failed to RSVP");
      const inner = unwrapData(await response.json());
      const updated = inner.event
        ? {
            ...inner.event,
            id: inner.event.id || inner.event._id,
            startTime: inner.event.startTime || inner.event.startsAt,
          }
        : null;

      // Update local state
      setEvents((prev) =>
        prev.map((event) =>
          String(event.id) === String(eventId) && updated ? updated : event,
        ),
      );
      toast.success(
        status === "attending"
          ? "RSVP confirmed! See you there!"
          : status === "maybe"
            ? "Marked as maybe"
            : "RSVP declined",
      );
    } catch (error) {
      console.error("Error RSVPing to event:", error);
      toast.error("Failed to RSVP to event");
    } finally {
      setRsvpingEventId(null);
    }
  };
  const getMyRSVP = (event) => {
    const myRSVP = event.attendees.find((a) => a.founderId === founderId);
    return myRSVP?.status || null;
  };
  const isEventUpcoming = (startTime) => {
    return new Date(startTime) > new Date();
  };
  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor(
      (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 7) return `in ${diffDays} days`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };
  const formatEventTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };
  const getEventTypeColor = (eventType) => {
    const colors = {
      "demo-day": "bg-purple-500/10 text-purple-700 dark:text-purple-300",
      workshop: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
      "office-hours": "bg-green-500/10 text-green-700 dark:text-green-300",
      networking: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
      mentorship: "bg-pink-500/10 text-pink-700 dark:text-pink-300",
      other: "bg-gray-500/10 text-gray-700 dark:text-gray-300",
    };
    return colors[eventType] || colors["other"];
  };
  const upcomingEvents = events.filter((e) => isEventUpcoming(e.startTime));
  const cardSurface = "border-primary/18 shadow-[var(--shadow-soft)]";
  if (loading) {
    return (
      <Card className={cardSurface}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Organization Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  if (upcomingEvents.length === 0) {
    return (
      <Card className={cardSurface}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Organization Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground text-center py-4">
            No upcoming events
          </p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className={cardSurface}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Organization Events
        </CardTitle>
        <CardDescription className="text-xs">
          {upcomingEvents.length}
          {" upcoming event"}
          {upcomingEvents.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingEvents.slice(0, 3).map((event) => {
            const myRSVP = getMyRSVP(event);
            const isRSVPing = rsvpingEventId === event.id;
            const eventSoon = isEventSoon(event.startTime);
            const timeUntil = getTimeUntilEvent(event.startTime);
            return (
              <div
                key={event.id}
                className={`border rounded-lg p-3 space-y-2 hover:bg-muted/50 transition-colors ${eventSoon ? "border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/20" : "border-border"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-semibold truncate">
                        {event.title}
                      </h4>
                      {eventSoon && (
                        <Badge className="text-[8px] px-1.5 py-0.5 bg-orange-500 text-white">
                          {timeUntil}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {event.organizationName || "Organization"}
                    </p>
                  </div>
                  <Badge
                    className={`text-[8px] px-1.5 py-0.5 ${getEventTypeColor(event.eventType)}`}
                  >
                    {event.eventType.replace("-", " ")}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>
                      {formatEventDate(event.startTime)}
                      {" at "}
                      {formatEventTime(event.startTime)}
                    </span>
                  </div>
                  {event.isVirtual ? (
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <Video className="w-3 h-3" />
                      <span>Virtual Event</span>
                    </div>
                  ) : (
                    event.location && (
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )
                  )}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                  {myRSVP ? (
                    <div className="flex items-center gap-2 flex-1">
                      <div className="flex items-center gap-1 text-[10px]">
                        {myRSVP === "attending" && (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                            <span className="text-green-700 dark:text-green-400 font-medium">
                              Attending
                            </span>
                          </>
                        )}
                        {myRSVP === "maybe" && (
                          <>
                            <HelpCircle className="w-3 h-3 text-yellow-600" />
                            <span className="text-yellow-700 dark:text-yellow-400 font-medium">
                              Maybe
                            </span>
                          </>
                        )}
                        {myRSVP === "declined" && (
                          <>
                            <XCircle className="w-3 h-3 text-gray-600" />
                            <span className="text-gray-700 dark:text-gray-400">
                              Declined
                            </span>
                          </>
                        )}
                      </div>
                      {myRSVP === "attending" &&
                        event.isVirtual &&
                        event.meetingUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-[9px] ml-auto"
                            onClick={() =>
                              window.open(event.meetingUrl, "_blank")
                            }
                          >
                            <Video className="w-3 h-3 mr-1" />
                            Join
                          </Button>
                        )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 w-full">
                      <Button
                        variant="default"
                        size="sm"
                        className="h-6 text-[9px] flex-1"
                        onClick={() => handleRSVP(event.id, "attending")}
                        disabled={isRSVPing}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Attend
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-[9px]"
                        onClick={() => handleRSVP(event.id, "maybe")}
                        disabled={isRSVPing}
                      >
                        <HelpCircle className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[9px]"
                        onClick={() => handleRSVP(event.id, "declined")}
                        disabled={isRSVPing}
                      >
                        <XCircle className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {upcomingEvents.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-3 h-7 text-[10px]"
            onClick={() => onNavigate && onNavigate("events")}
          >
            {"View all "}
            {upcomingEvents.length}
            {" events"}
            <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
