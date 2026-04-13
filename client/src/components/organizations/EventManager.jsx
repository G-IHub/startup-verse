/**
 * EVENT MANAGER - Create and manage cohort events
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
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import {
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Video,
  XCircle,
  FileText,
  Target,
} from "lucide-react";
import { notifyEventCreated } from "../../utils/eventNotifications";
import { toast } from "sonner";
import MiniCalendar from "../calendar/MiniCalendar";
import { getOrganizationCalendarEvents } from "../../utils/calendarIntegration";
import { getAccessToken } from "../../app/session";
import { unwrapData } from "../../utils/apiEnvelope";

const API_BASE = API_BASE_URL;

export default function EventManager({
  cohortId,
  organizationId,
  userId,
  isAdmin,
}) {
  const [events, setEvents] = useState([]);
  const [allCalendarItems, setAllCalendarItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [agendaFilter, setAgendaFilter] = useState("all");
  const [selectedAgenda, setSelectedAgenda] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventType: "workshop",
    startTime: "",
    endTime: "",
    location: "",
    isVirtual: false,
    meetingUrl: "",
    capacity: "",
  });
  useEffect(() => {
    loadEvents();
    loadAllCalendarItems();
  }, [cohortId, organizationId]);
  const loadAllCalendarItems = async () => {
    try {
      const items = await getOrganizationCalendarEvents(organizationId);
      setAllCalendarItems(items);
      console.log("📅 Loaded all calendar items:", items.length);
    } catch (error) {
      console.error("Error loading calendar items:", error);
    }
  };
  const loadEvents = async () => {
    try {
      setLoading(true);
      const token = getAccessToken();
      const response = await fetch(`${API_BASE}/cohorts/${cohortId}/events`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!response.ok) throw new Error("Failed to fetch events");
      const payload = await response.json();
      const inner = unwrapData(payload);
      setEvents(inner.events || []);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      // Auto-generate Jitsi meeting link for virtual events
      let meetingUrl = formData.meetingUrl;
      let eventId = `event-${cohortId.slice(0, 8)}-${Date.now()}`;
      if (formData.isVirtual && !meetingUrl) {
        // Generate Jitsi meeting room
        meetingUrl = `${window.location.origin}/join/Event-${eventId}`;
      }
      const token = getAccessToken();
      const response = await fetch(`${API_BASE}/cohorts/${cohortId}/events`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId,
          title: formData.title,
          description: formData.description,
          eventType: formData.eventType,
          startTime: formData.startTime,
          endTime: formData.endTime || null,
          location: formData.location,
          isVirtual: formData.isVirtual,
          meetingUrl: meetingUrl,
          capacity: formData.capacity ? parseInt(formData.capacity) : null,
          createdBy: userId,
        }),
      });
      if (!response.ok) throw new Error("Failed to create event");
      const created = unwrapData(await response.json());
      const event = created.event;

      // Send notifications to all cohort members
      await notifyEventCreated(cohortId, organizationId, {
        id: event?.id || event?._id,
        title: formData.title,
        startTime: formData.startTime,
        eventType: formData.eventType,
        location: formData.location,
        isVirtual: formData.isVirtual,
        createdBy: userId,
      });

      // Reset form and reload
      setFormData({
        title: "",
        description: "",
        eventType: "workshop",
        startTime: "",
        endTime: "",
        location: "",
        isVirtual: false,
        meetingUrl: "",
        capacity: "",
      });
      setShowCreateForm(false);
      loadEvents();
      toast.success("Event created successfully!");
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Failed to create event");
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
  const isUpcoming = (startTime) => {
    return new Date(startTime) > new Date();
  };
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );
  const upcomingEvents = sortedEvents.filter((e) => isUpcoming(e.startTime));
  const pastEvents = sortedEvents.filter((e) => !isUpcoming(e.startTime));
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="text-sm flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Cohort Agenda
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Schedule meetings, workshops, and events for your cohort
              </CardDescription>
            </div>
            {isAdmin && (
              <Button
                size="sm"
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="gap-2"
                variant={showCreateForm ? "outline" : "default"}
              >
                {showCreateForm ? (
                  <XCircle className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {showCreateForm ? "Cancel" : "Schedule Meeting"}
              </Button>
            )}
          </div>
        </CardHeader>
        {showCreateForm && (
          <CardContent className="border-t">
            <form onSubmit={handleCreateEvent} className="space-y-3 pt-3">
              <div>
                <label className="text-[9px] text-muted-foreground">
                  Event Title
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      title: e.target.value,
                    })
                  }
                  placeholder="e.g., Demo Day Rehearsal"
                  required={true}
                  className="h-7 text-[10px]"
                />
              </div>
              <div>
                <label className="text-[9px] text-muted-foreground">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  placeholder="What's this event about?"
                  className="text-[10px] min-h-[60px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] text-muted-foreground">
                    Event Type
                  </label>
                  <select
                    value={formData.eventType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        eventType: e.target.value,
                      })
                    }
                    className="w-full h-7 text-[10px] rounded-md border border-input bg-background px-2"
                  >
                    <option value="workshop">Workshop</option>
                    <option value="demo-day">Demo Day</option>
                    <option value="office-hours">Office Hours</option>
                    <option value="networking">Networking</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] text-muted-foreground">
                    Capacity (optional)
                  </label>
                  <Input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        capacity: e.target.value,
                      })
                    }
                    placeholder="Max attendees"
                    className="h-7 text-[10px]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] text-muted-foreground">
                    Start Time
                  </label>
                  <Input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        startTime: e.target.value,
                      })
                    }
                    required={true}
                    className="h-7 text-[10px]"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-muted-foreground">
                    End Time (optional)
                  </label>
                  <Input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        endTime: e.target.value,
                      })
                    }
                    className="h-7 text-[10px]"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isVirtual"
                  checked={formData.isVirtual}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isVirtual: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="isVirtual" className="text-[10px]">
                  Virtual Event
                </label>
              </div>
              {formData.isVirtual ? (
                <div>
                  <label className="text-[9px] text-muted-foreground">
                    Meeting URL (optional)
                  </label>
                  <Input
                    value={formData.meetingUrl}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        meetingUrl: e.target.value,
                      })
                    }
                    placeholder="Leave blank to auto-generate Jitsi link"
                    type="url"
                    className="h-7 text-[10px]"
                  />
                  <p className="text-[8px] text-muted-foreground mt-1">
                    💡 A Jitsi video conference link will be auto-generated if
                    left blank
                  </p>
                </div>
              ) : (
                <div>
                  <label className="text-[9px] text-muted-foreground">
                    Location
                  </label>
                  <Input
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: e.target.value,
                      })
                    }
                    placeholder="e.g., Conference Room A"
                    className="h-7 text-[10px]"
                  />
                </div>
              )}
              <Button type="submit" size="sm" className="h-6 text-[9px]">
                Create Event
              </Button>
            </form>
          </CardContent>
        )}
      </Card>
      {loading ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="animate-pulse text-[10px]">Loading events...</div>
          </CardContent>
        </Card>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-[10px] text-muted-foreground">
              No events scheduled yet
            </p>
            {isAdmin && (
              <p className="text-[9px] text-muted-foreground mt-1">
                Create events to bring your cohort together
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <MiniCalendar organizationId={organizationId} events={events} />
          </div>
          <div className="space-y-3">
            <Card>
              <CardContent className="p-3">
                <h3 className="text-[10px] font-medium mb-2">
                  Upcoming Agendas
                </h3>
                <div className="flex flex-wrap gap-1">
                  <Button
                    size="sm"
                    variant={agendaFilter === "all" ? "default" : "outline"}
                    onClick={() => setAgendaFilter("all")}
                    className="h-6 text-[8px] px-2"
                  >
                    All (
                    {
                      allCalendarItems.filter(
                        (i) => new Date(i.startDate) > new Date(),
                      ).length
                    }
                    )
                  </Button>
                  <Button
                    size="sm"
                    variant={agendaFilter === "event" ? "default" : "outline"}
                    onClick={() => setAgendaFilter("event")}
                    className="h-6 text-[8px] px-2"
                  >
                    Events (
                    {
                      allCalendarItems.filter(
                        (i) =>
                          i.type === "event" &&
                          new Date(i.startDate) > new Date(),
                      ).length
                    }
                    )
                  </Button>
                  <Button
                    size="sm"
                    variant={
                      agendaFilter === "deliverable" ? "default" : "outline"
                    }
                    onClick={() => setAgendaFilter("deliverable")}
                    className="h-6 text-[8px] px-2"
                  >
                    Deliverables (
                    {
                      allCalendarItems.filter(
                        (i) =>
                          i.type === "deliverable" &&
                          new Date(i.startDate) > new Date(),
                      ).length
                    }
                    )
                  </Button>
                  <Button
                    size="sm"
                    variant={
                      agendaFilter === "milestone" ? "default" : "outline"
                    }
                    onClick={() => setAgendaFilter("milestone")}
                    className="h-6 text-[8px] px-2"
                  >
                    Milestones (
                    {
                      allCalendarItems.filter(
                        (i) =>
                          i.type === "milestone" &&
                          new Date(i.startDate) > new Date(),
                      ).length
                    }
                    )
                  </Button>
                </div>
              </CardContent>
            </Card>
            <div className="space-y-2">
              {(() => {
                const upcomingItems = allCalendarItems
                  .filter((item) => new Date(item.startDate) > new Date())
                  .filter(
                    (item) =>
                      agendaFilter === "all" || item.type === agendaFilter,
                  )
                  .sort((a, b) => {
                    // Sort by type (events first), then by date
                    if (a.type === "event" && b.type !== "event") return -1;
                    if (a.type !== "event" && b.type === "event") return 1;
                    return (
                      new Date(a.startDate).getTime() -
                      new Date(b.startDate).getTime()
                    );
                  })
                  .slice(0, 10);
                if (upcomingItems.length === 0) {
                  return (
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-[9px] text-muted-foreground">
                          {"No upcoming "}
                          {agendaFilter === "all"
                            ? "items"
                            : agendaFilter + "s"}
                        </p>
                      </CardContent>
                    </Card>
                  );
                }
                return upcomingItems.map((item) => (
                  <Card
                    key={item.id}
                    className="hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedAgenda(item)}
                  >
                    <CardContent className="p-2">
                      <div className="flex items-start gap-2">
                        <div
                          className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${item.type === "event" ? "bg-blue-500/10" : item.type === "deliverable" ? "bg-orange-500/10" : item.type === "milestone" ? "bg-purple-500/10" : "bg-gray-500/10"}`}
                        >
                          {item.type === "event" && (
                            <CalendarIcon className="w-3 h-3 text-blue-500" />
                          )}
                          {item.type === "deliverable" && (
                            <FileText className="w-3 h-3 text-orange-500" />
                          )}
                          {item.type === "milestone" && (
                            <Target className="w-3 h-3 text-purple-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[9px] font-medium truncate">
                            {item.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 text-[8px] text-muted-foreground">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(item.startDate).toLocaleDateString()}
                          </div>
                          {item.isVirtual && (
                            <Badge
                              variant="outline"
                              className="text-[7px] mt-1"
                            >
                              <Video className="w-2 h-2 mr-1" />
                              Virtual
                            </Badge>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[7px] ${item.type === "event" ? "bg-blue-500/10 text-blue-700 border-blue-500/20" : item.type === "deliverable" ? "bg-orange-500/10 text-orange-700 border-orange-500/20" : item.type === "milestone" ? "bg-purple-500/10 text-purple-700 border-purple-500/20" : "bg-gray-500/10 text-gray-700 border-gray-500/20"}`}
                        >
                          {item.type}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ));
              })()}
            </div>
          </div>
        </div>
      )}
      {selectedAgenda && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedAgenda(null)}
        >
          <Card
            className="w-full max-w-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedAgenda.type === "event" ? "bg-blue-500/10" : selectedAgenda.type === "deliverable" ? "bg-orange-500/10" : selectedAgenda.type === "milestone" ? "bg-purple-500/10" : "bg-gray-500/10"}`}
                  >
                    <div
                      className={
                        selectedAgenda.type === "event"
                          ? "text-blue-500"
                          : selectedAgenda.type === "deliverable"
                            ? "text-orange-500"
                            : selectedAgenda.type === "milestone"
                              ? "text-purple-500"
                              : "text-gray-500"
                      }
                    >
                      {selectedAgenda.type === "event" && (
                        <CalendarIcon className="w-5 h-5" />
                      )}
                      {selectedAgenda.type === "deliverable" && (
                        <FileText className="w-5 h-5" />
                      )}
                      {selectedAgenda.type === "milestone" && (
                        <Target className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold">
                      {selectedAgenda.title}
                    </h3>
                    <Badge variant="outline" className="text-[8px] mt-1">
                      {selectedAgenda.type.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedAgenda(null)}
                  className="h-7 w-7 p-0"
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
              {selectedAgenda.description && (
                <div className="mb-4">
                  <p className="text-[11px] text-muted-foreground">
                    {selectedAgenda.description}
                  </p>
                </div>
              )}
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-[11px]">
                  <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {new Date(selectedAgenda.startDate).toLocaleDateString(
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
                    {new Date(selectedAgenda.startDate).toLocaleTimeString(
                      "en-US",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </span>
                  {selectedAgenda.endDate && (
                    <span className="text-muted-foreground">
                      {"- "}
                      {new Date(selectedAgenda.endDate).toLocaleTimeString(
                        "en-US",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </span>
                  )}
                </div>
                {selectedAgenda.location && !selectedAgenda.isVirtual && (
                  <div className="flex items-center gap-2 text-[11px]">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedAgenda.location}</span>
                  </div>
                )}
                {selectedAgenda.isVirtual && (
                  <div className="flex items-center gap-2 text-[11px]">
                    <Video className="w-4 h-4 text-muted-foreground" />
                    <span>Virtual Event</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-4 border-t">
                {selectedAgenda.meetingUrl &&
                  selectedAgenda.type === "event" && (
                    <Button
                      size="sm"
                      className="gap-2 flex-1"
                      onClick={() => {
                        window.open(selectedAgenda.meetingUrl, "_blank");
                        toast.success("Opening meeting...");
                      }}
                    >
                      <Video className="w-4 h-4" />
                      Join Meeting
                    </Button>
                  )}
                {selectedAgenda.type === "deliverable" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 flex-1"
                    onClick={() => {
                      toast.info("Navigating to deliverable...");
                      setSelectedAgenda(null);
                      // TODO: Navigate to deliverables page
                    }}
                  >
                    <FileText className="w-4 h-4" />
                    View Deliverable
                  </Button>
                )}
                {selectedAgenda.type === "milestone" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 flex-1"
                    onClick={() => {
                      toast.info("Navigating to milestone...");
                      setSelectedAgenda(null);
                      // TODO: Navigate to milestones page
                    }}
                  >
                    <Target className="w-4 h-4" />
                    View Milestone
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedAgenda(null)}
                >
                  Close
                </Button>
              </div>
              {selectedAgenda.metadata && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-[9px] text-muted-foreground">
                    {selectedAgenda.metadata.cohortName &&
                      `Cohort: ${selectedAgenda.metadata.cohortName}`}
                    {selectedAgenda.metadata.organizationName &&
                      ` • ${selectedAgenda.metadata.organizationName}`}
                    {selectedAgenda.metadata.eventType &&
                      ` • ${selectedAgenda.metadata.eventType}`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
