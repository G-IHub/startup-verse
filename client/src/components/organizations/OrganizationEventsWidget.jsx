/**
 * Organization events for founders (dashboard feed).
 */
import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/apiBase.js";
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
import {
  OrganizationWidgetShell,
  OrganizationWidgetItem,
} from "./OrganizationWidgetShell.jsx";

const API_BASE = API_BASE_URL;

const defaultOptions = {
  credentials: "include",
  headers: { "Content-Type": "application/json" },
};

const EVENT_TYPE_STYLES = {
  "demo-day": "bg-purple-100 text-purple-800",
  workshop: "bg-primary-tint text-primary",
  "office-hours": "bg-emerald-100 text-emerald-800",
  networking: "bg-amber-100 text-amber-800",
  mentorship: "bg-pink-100 text-pink-800",
  other: "bg-surface-page text-text-body",
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
      const response = await fetch(`${API_BASE}/founder/${founderId}/events`, {
        ...defaultOptions,
      });
      if (!response.ok) {
        setEvents([]);
        return;
      }
      const raw = unwrapData(await response.json());
      const list = Array.isArray(raw) ? raw : raw.events || [];
      setEvents(
        list.map((e) => ({
          ...e,
          id: e.id || e._id,
          startTime: e.startTime || e.startsAt,
        })),
      );
    } catch (error) {
      console.error("Error loading events:", error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFounderEvents();
    checkAndSendEventReminders(founderId);
    const reminderInterval = setInterval(
      () => checkAndSendEventReminders(founderId),
      5 * 60 * 1000,
    );
    return () => clearInterval(reminderInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [founderId]);

  const handleRSVP = async (eventId, status) => {
    setRsvpingEventId(eventId);
    try {
      const response = await fetch(`${API_BASE}/events/${eventId}/rsvp`, {
        ...defaultOptions,
        method: "POST",
        body: JSON.stringify({ founderId, founderName, status }),
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
    const attendees = event.attendees || [];
    const myRSVP = attendees.find((a) => a.founderId === founderId);
    return myRSVP?.status || null;
  };

  const isEventUpcoming = (startTime) => new Date(startTime) > new Date();

  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor(
      (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 7) return `in ${diffDays} days`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatEventTime = (dateString) =>
    new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  const upcomingEvents = events.filter((e) => isEventUpcoming(e.startTime));

  return (
    <OrganizationWidgetShell
      icon={Calendar}
      title="Organization Events"
      description={
        upcomingEvents.length > 0
          ? `${upcomingEvents.length} upcoming event${upcomingEvents.length !== 1 ? "s" : ""}`
          : undefined
      }
      loading={loading}
      empty={
        !loading && upcomingEvents.length === 0
          ? {
              icon: Calendar,
              title: "No upcoming events",
              description:
                "Workshops, demo days, and office hours from your program will show up here.",
            }
          : null
      }
      footer={
        upcomingEvents.length > 3 ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-full rounded-input font-body text-[11px] font-medium text-primary hover:bg-primary-tint hover:text-primary"
            onClick={() => onNavigate?.("events")}
          >
            View all {upcomingEvents.length} events
            <ExternalLink className="ml-1 h-3 w-3" />
          </Button>
        ) : null
      }
    >
      <div className="space-y-2.5">
        {upcomingEvents.slice(0, 3).map((event) => {
          const myRSVP = getMyRSVP(event);
          const isRSVPing = rsvpingEventId === event.id;
          const eventSoon = isEventSoon(event.startTime);
          const timeUntil = getTimeUntilEvent(event.startTime);
          const typeStyle =
            EVENT_TYPE_STYLES[event.eventType] || EVENT_TYPE_STYLES.other;

          return (
            <OrganizationWidgetItem
              key={event.id}
              className={eventSoon ? "border-amber-300/60 bg-amber-50/50" : ""}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="truncate font-heading text-xs font-extrabold text-text-heading">
                      {event.title}
                    </h4>
                    {eventSoon ? (
                      <Badge className="shrink-0 border-0 bg-amber-500 px-1.5 py-0 font-body text-[9px] font-semibold text-white">
                        {timeUntil}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-0.5 font-body text-[10px] text-text-muted">
                    {event.organizationName || "Organization"}
                  </p>
                </div>
                <Badge
                  className={`shrink-0 border-0 px-1.5 py-0 font-body text-[9px] font-semibold capitalize ${typeStyle}`}
                >
                  {(event.eventType || "other").replace("-", " ")}
                </Badge>
              </div>

              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-1.5 font-body text-[10px] text-text-body">
                  <Clock className="h-3 w-3 shrink-0 text-text-muted" />
                  <span>
                    {formatEventDate(event.startTime)} at{" "}
                    {formatEventTime(event.startTime)}
                  </span>
                </div>
                {event.isVirtual ? (
                  <div className="flex items-center gap-1.5 font-body text-[10px] text-text-body">
                    <Video className="h-3 w-3 shrink-0 text-text-muted" />
                    <span>Virtual event</span>
                  </div>
                ) : event.location ? (
                  <div className="flex items-center gap-1.5 font-body text-[10px] text-text-body">
                    <MapPin className="h-3 w-3 shrink-0 text-text-muted" />
                    <span className="truncate">{event.location}</span>
                  </div>
                ) : null}
              </div>

              <div className="mt-2 flex items-center gap-2 border-t border-surface-border/50 pt-2">
                {myRSVP ? (
                  <div className="flex flex-1 items-center gap-2">
                    <div className="flex items-center gap-1 font-body text-[10px] font-medium">
                      {myRSVP === "attending" && (
                        <>
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          <span className="text-emerald-700">Attending</span>
                        </>
                      )}
                      {myRSVP === "maybe" && (
                        <>
                          <HelpCircle className="h-3 w-3 text-amber-600" />
                          <span className="text-amber-700">Maybe</span>
                        </>
                      )}
                      {myRSVP === "declined" && (
                        <>
                          <XCircle className="h-3 w-3 text-text-muted" />
                          <span className="text-text-body">Declined</span>
                        </>
                      )}
                    </div>
                    {myRSVP === "attending" &&
                      event.isVirtual &&
                      event.meetingUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-auto h-7 rounded-input border-surface-border font-body text-[10px] text-primary hover:bg-primary-tint"
                          onClick={() => window.open(event.meetingUrl, "_blank")}
                        >
                          <Video className="mr-1 h-3 w-3" />
                          Join
                        </Button>
                      )}
                  </div>
                ) : (
                  <div className="flex w-full items-center gap-1.5">
                    <Button
                      size="sm"
                      className="h-7 flex-1 rounded-input bg-primary font-body text-[10px] font-semibold text-white hover:bg-primary-hover"
                      onClick={() => handleRSVP(event.id, "attending")}
                      disabled={isRSVPing}
                    >
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Attend
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 rounded-input border-surface-border px-2 hover:bg-primary-tint"
                      onClick={() => handleRSVP(event.id, "maybe")}
                      disabled={isRSVPing}
                    >
                      <HelpCircle className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 rounded-input px-2 text-text-muted hover:text-text-body"
                      onClick={() => handleRSVP(event.id, "declined")}
                      disabled={isRSVPing}
                    >
                      <XCircle className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </OrganizationWidgetItem>
          );
        })}
      </div>
    </OrganizationWidgetShell>
  );
}
