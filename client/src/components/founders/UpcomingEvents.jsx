/**
 * Upcoming Events Widget for Founders
 * Displays organization events, deliverables, and milestones
 */

import React, { useState, useEffect } from "react";
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
  Clock,
  MapPin,
  Video,
  Loader2,
  FileText,
  Target,
  TrendingUp,
} from "lucide-react";
import { getUpcomingEvents } from "../../utils/calendarIntegration";
export default function UpcomingEvents({ founderId, compact = false }) {
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadEvents();
  }, [founderId]);
  const loadEvents = async () => {
    try {
      setLoading(true);
      // Use the new unified calendar integration
      const events = await getUpcomingEvents(founderId, 14); // Next 14 days
      setCalendarEvents(events.slice(0, compact ? 3 : 10));
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  };
  const getEventTypeColor = (type) => {
    switch (type) {
      case "event":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
      case "deliverable":
        return "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20";
      case "milestone":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20";
      case "outcome":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";
    }
  };
  const getEventIcon = (type) => {
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
  const isEventSoon = (startDate) => {
    const eventDate = new Date(startDate);
    const now = new Date();
    const hoursUntil = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntil <= 24 && hoursUntil >= 0;
  };
  const handleJoinEvent = (meetingUrl) => {
    // Extract the room name from the URL
    if (meetingUrl.includes("/join/")) {
      const roomName = meetingUrl.split("/join/")[1];
      window.location.href = `/join/${roomName}`;
    } else {
      // External meeting link
      window.open(meetingUrl, "_blank");
    }
  };
  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">Loading events...</p>
        </CardContent>
      </Card>
    );
  }
  if (calendarEvents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Upcoming Events & Deadlines</CardTitle>
          <CardDescription className="text-xs">
            No upcoming items scheduled
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Upcoming Events & Deadlines</CardTitle>
        <CardDescription className="text-xs">
          {calendarEvents.length}
          {" item"}
          {calendarEvents.length !== 1 ? "s" : ""}
          {" in the next 2 weeks"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {calendarEvents.map((calendarEvent) => {
          const isSoon = isEventSoon(calendarEvent.startDate);
          const eventDate = new Date(calendarEvent.startDate);
          return (
            <div
              key={calendarEvent.id}
              className={`p-3 rounded-lg border ${isSoon ? "bg-primary/5 border-primary/30" : "bg-muted/50 border-border"}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium truncate mb-1">
                    {calendarEvent.title}
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className={`text-[8px] flex items-center gap-1 ${getEventTypeColor(calendarEvent.type)}`}
                    >
                      {getEventIcon(calendarEvent.type)}
                      {calendarEvent.type}
                    </Badge>
                    {isSoon && (
                      <Badge variant="default" className="text-[8px]">
                        {calendarEvent.type === "deliverable"
                          ? "Due Soon"
                          : "Starting Soon"}
                      </Badge>
                    )}
                    {calendarEvent.status && (
                      <Badge
                        variant={
                          calendarEvent.status === "approved" ||
                          calendarEvent.status === "completed"
                            ? "default"
                            : "outline"
                        }
                        className="text-[8px]"
                      >
                        {calendarEvent.status}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              {calendarEvent.description && !compact && (
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                  {calendarEvent.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {eventDate.toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {eventDate.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                {calendarEvent.isVirtual && (
                  <div className="flex items-center gap-1 text-blue-600">
                    <Video className="w-3 h-3" />
                    Virtual
                  </div>
                )}
                {calendarEvent.location && !calendarEvent.isVirtual && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {calendarEvent.location}
                  </div>
                )}
              </div>
              {calendarEvent.type === "event" &&
                calendarEvent.isVirtual &&
                calendarEvent.meetingUrl && (
                  <Button
                    size="sm"
                    onClick={() => handleJoinEvent(calendarEvent.meetingUrl)}
                    className="w-full gap-2 h-8 text-xs"
                  >
                    <Video className="w-4 h-4" />
                    Join Meeting
                  </Button>
                )}
              {calendarEvent.metadata?.organizationName && (
                <p className="text-[10px] text-muted-foreground mt-2">
                  {calendarEvent.source === "cohort"
                    ? `From ${calendarEvent.metadata.organizationName}`
                    : "Personal"}
                </p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
