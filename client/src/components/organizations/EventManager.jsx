/**
 * EVENT MANAGER - Create and manage cohort events
 */
import React, { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "../../config/apiBase.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/select";
import {
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Video,
  FileText,
  Target,
  Pencil,
  Trash2,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { toastError } from "../../utils/toastError";
import MiniCalendar from "../calendar/MiniCalendar";
import { getOrganizationCalendarEvents } from "../../utils/calendarIntegration";
import { unwrapData } from "../../utils/apiEnvelope";
import { useOrgListQuery } from "../../hooks/useOrgListQuery";
import { getCohortEventsPage } from "../../utils/api/organizationApi";
import PaginationControls from "../shared/PaginationControls";
import {
  SectionCard,
  SectionHeader,
  CollapsibleFormCard,
  EmptyStateBlock,
} from "./_primitives";
import { cn } from "../ui/utils";

const API_BASE = API_BASE_URL;

const defaultOptions = {
  credentials: "include",
  headers: { "Content-Type": "application/json" },
};

const EVENT_TYPE_OPTIONS = [
  { value: "workshop", label: "Workshop" },
  { value: "demo-day", label: "Demo Day" },
  { value: "office-hours", label: "Office Hours" },
  { value: "networking", label: "Networking" },
  { value: "other", label: "Other" },
];

const AGENDA_TYPE_TONE = {
  event: {
    badge: "bg-[#e8ebff] text-[#3a5afe]",
    disc: "bg-[#e8ebff] text-[#3a5afe]",
    icon: CalendarIcon,
  },
  deliverable: {
    badge: "bg-[#fef3c7] text-[#ffb300]",
    disc: "bg-[#fef3c7] text-[#ffb300]",
    icon: FileText,
  },
  milestone: {
    badge: "bg-[#f3e8ff] text-[#7c4dff]",
    disc: "bg-[#f3e8ff] text-[#7c4dff]",
    icon: Target,
  },
  other: {
    badge: "bg-surface-page text-text-muted",
    disc: "bg-surface-page text-text-muted",
    icon: CalendarIcon,
  },
};

const PRIMARY_BUTTON =
  "h-9 rounded-input bg-primary font-body text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(58,90,254,0.25)] hover:bg-primary-hover";
const OUTLINE_BUTTON =
  "h-9 rounded-input border border-surface-border bg-white font-body text-[13px] font-medium text-text-body hover:bg-primary-tint hover:text-primary";

function FilterPill({ active, onClick, children }) {
  return (
    <Button
      size="sm"
      onClick={onClick}
      className={cn(
        "h-8 rounded-input px-3 font-body text-[12px] font-medium transition-colors",
        active
          ? "bg-primary text-white shadow-[0_4px_16px_rgba(58,90,254,0.25)] hover:bg-primary-hover"
          : "border border-surface-border bg-white text-text-body hover:bg-primary-tint hover:text-primary",
      )}
    >
      {children}
    </Button>
  );
}

export default function EventManager({
  cohortId,
  organizationId,
  userId,
  isAdmin,
}) {
  const [allCalendarItems, setAllCalendarItems] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [agendaFilter, setAgendaFilter] = useState("all");
  const [selectedAgenda, setSelectedAgenda] = useState(null);
  // Non-null editingEventId puts the create form into "edit mode" and a PUT is
  // submitted instead of a POST.
  const [editingEventId, setEditingEventId] = useState(null);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);
  const emptyForm = {
    title: "",
    description: "",
    eventType: "workshop",
    startTime: "",
    endTime: "",
    location: "",
    isVirtual: false,
    meetingUrl: "",
    capacity: "",
  };
  const [formData, setFormData] = useState(emptyForm);

  const {
    items: eventRows,
    total,
    limit,
    loading,
    q,
    setSearch,
    currentPage,
    totalPages,
    hasNext,
    hasPrev,
    goToPage,
    nextPage,
    prevPage,
    refresh,
  } = useOrgListQuery({
    fetchFn: useCallback(
      (params) => getCohortEventsPage(cohortId, params),
      [cohortId],
    ),
    initialLimit: 25,
  });

  const events = eventRows.map((e) => ({
    ...e,
    id: e.id || e._id,
  }));

  useEffect(() => {
    loadAllCalendarItems();
  }, [cohortId, organizationId]);

  const loadAllCalendarItems = async () => {
    try {
      const items = await getOrganizationCalendarEvents(organizationId);
      setAllCalendarItems(items);
    } catch (error) {
      console.error("Error loading calendar items:", error);
    }
  };

  const handleSubmitEvent = async (e) => {
    e.preventDefault();
    const isEdit = Boolean(editingEventId);
    try {
      // Server fills in a default `/join/Event-...` URL when isVirtual and the
      // field is blank; the client no longer fabricates URLs.
      const payload = {
        organizationId,
        title: formData.title,
        description: formData.description,
        eventType: formData.eventType,
        startTime: formData.startTime,
        endTime: formData.endTime || null,
        location: formData.location,
        isVirtual: formData.isVirtual,
        meetingUrl: formData.meetingUrl || "",
        capacity: formData.capacity ? parseInt(formData.capacity, 10) : null,
        createdBy: userId,
      };

      const url = isEdit
        ? `${API_BASE}/cohorts/${cohortId}/events/${editingEventId}`
        : `${API_BASE}/cohorts/${cohortId}/events`;
      const response = await fetch(url, {
        ...defaultOptions,
        method: isEdit ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      const responseJson = await response.json().catch(() => ({}));
      if (!response.ok) {
        const err = new Error(
          responseJson?.message ||
            (isEdit ? "Failed to update event" : "Failed to create event"),
        );
        err.status = response.status;
        throw err;
      }
      unwrapData(responseJson);

      // Step 2.12: server-side fanout in createCohortEvent now broadcasts
      // cohort-event-created notifications to active cohort members. The
      // client no longer fires this manually to avoid double notifications.

      setFormData(emptyForm);
      setEditingEventId(null);
      setShowCreateForm(false);
      await refresh();
      loadAllCalendarItems();
      toast.success(
        isEdit ? "Event updated successfully!" : "Event created successfully!",
      );
    } catch (error) {
      console.error(
        isEdit ? "Error updating event:" : "Error creating event:",
        error,
      );
      toastError(
        error,
        isEdit ? "Failed to update event" : "Failed to create event",
      );
    }
  };

  // Convert an ISO date/time to the value expected by `<input type="datetime-local">`.
  function toDatetimeLocal(value) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  const startEditEvent = (agenda) => {
    // Hydrate from the agenda dialog row + the source event for any fields the
    // calendar mapper drops.
    const source =
      events.find((e) => String(e.id || e._id) === String(agenda.id)) || {};
    setEditingEventId(agenda.id);
    setFormData({
      title: agenda.title || source.title || "",
      description: agenda.description || source.description || "",
      eventType: source.eventType || agenda.metadata?.eventType || "workshop",
      startTime: toDatetimeLocal(agenda.startDate || source.startsAt),
      endTime: toDatetimeLocal(agenda.endDate || source.endsAt),
      location: agenda.location || source.location || "",
      isVirtual: Boolean(agenda.isVirtual ?? source.isVirtual),
      meetingUrl: agenda.meetingUrl || source.meetingUrl || "",
      capacity:
        source.capacity != null && source.capacity !== ""
          ? String(source.capacity)
          : "",
    });
    setShowCreateForm(true);
    setSelectedAgenda(null);
  };

  const cancelEdit = () => {
    setEditingEventId(null);
    setFormData(emptyForm);
    setShowCreateForm(false);
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    setIsDeletingEvent(true);
    try {
      const response = await fetch(
        `${API_BASE}/cohorts/${cohortId}/events/${eventToDelete.id}`,
        { ...defaultOptions, method: "DELETE" },
      );
      const responseJson = await response.json().catch(() => ({}));
      if (!response.ok) {
        const err = new Error(responseJson?.message || "Failed to delete event");
        err.status = response.status;
        throw err;
      }
      setEventToDelete(null);
      setSelectedAgenda(null);
      await refresh();
      loadAllCalendarItems();
      toast.success("Event deleted");
    } catch (error) {
      console.error("Error deleting event:", error);
      toastError(error, "Failed to delete event");
    } finally {
      setIsDeletingEvent(false);
    }
  };

  const isUpcoming = (startTime) => new Date(startTime) > new Date();

  const upcomingCalendarCount = (type) =>
    allCalendarItems.filter(
      (i) =>
        (type === "all" || i.type === type) &&
        new Date(i.startDate) > new Date(),
    ).length;

  const upcomingItems = allCalendarItems
    .filter((item) => new Date(item.startDate) > new Date())
    .filter(
      (item) => agendaFilter === "all" || item.type === agendaFilter,
    )
    .sort((a, b) => {
      if (a.type === "event" && b.type !== "event") return -1;
      if (a.type !== "event" && b.type === "event") return 1;
      return (
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
    })
    .slice(0, 10);

  const agendaTone = selectedAgenda
    ? AGENDA_TYPE_TONE[selectedAgenda.type] || AGENDA_TYPE_TONE.other
    : null;
  const AgendaIcon = agendaTone?.icon;

  return (
    <div className="space-y-4 font-body">
      <SectionHeader
        icon={CalendarIcon}
        title="Cohort Agenda"
        description="Schedule meetings, workshops, and events for your cohort"
      />

      {isAdmin && (
        <CollapsibleFormCard
          title={editingEventId ? "Edit Event" : "Schedule Meeting"}
          description={
            editingEventId
              ? "Update event details"
              : "Create a new event for the cohort"
          }
          triggerLabel={editingEventId ? "Edit Event" : "Schedule Meeting"}
          isOpen={showCreateForm}
          onToggle={(open) => {
            if (!open && editingEventId) cancelEdit();
            else setShowCreateForm(open);
          }}
        >
          <form onSubmit={handleSubmitEvent} className="space-y-3">
            <div>
              <label className="mb-2 block font-body text-[13px] font-medium text-text-heading">
                Event Title
              </label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g., Demo Day Rehearsal"
                required={true}
                className="font-body text-[13px]"
              />
            </div>
            <div>
              <label className="mb-2 block font-body text-[13px] font-medium text-text-heading">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="What's this event about?"
                className="min-h-[60px] font-body text-[13px]"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-2 block font-body text-[13px] font-medium text-text-heading">
                  Event Type
                </label>
                <Select
                  value={formData.eventType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, eventType: value })
                  }
                >
                  <SelectTrigger className="font-body text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPE_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="font-body text-[13px]"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-2 block font-body text-[13px] font-medium text-text-heading">
                  Capacity (optional)
                </label>
                <Input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: e.target.value })
                  }
                  placeholder="Max attendees"
                  className="font-body text-[13px]"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-2 block font-body text-[13px] font-medium text-text-heading">
                  Start Time
                </label>
                <Input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  required={true}
                  className="font-body text-[13px]"
                />
              </div>
              <div>
                <label className="mb-2 block font-body text-[13px] font-medium text-text-heading">
                  End Time (optional)
                </label>
                <Input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                  className="font-body text-[13px]"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isVirtual"
                checked={formData.isVirtual}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isVirtual: Boolean(checked) })
                }
              />
              <label
                htmlFor="isVirtual"
                className="font-body text-[13px] text-text-heading"
              >
                Virtual Event
              </label>
            </div>
            {formData.isVirtual ? (
              <div>
                <label className="mb-2 block font-body text-[13px] font-medium text-text-heading">
                  Meeting URL (optional)
                </label>
                <Input
                  value={formData.meetingUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, meetingUrl: e.target.value })
                  }
                  placeholder="Leave blank to auto-generate a meeting link"
                  type="url"
                  className="font-body text-[13px]"
                />
                <p className="mt-1 font-body text-[12px] text-text-muted">
                  Tip: We'll generate a meeting room link for you if left blank
                </p>
              </div>
            ) : (
              <div>
                <label className="mb-2 block font-body text-[13px] font-medium text-text-heading">
                  Location
                </label>
                <Input
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="e.g., Conference Room A"
                  className="font-body text-[13px]"
                />
              </div>
            )}
            <div className="flex gap-2">
              <Button type="submit" size="sm" className={PRIMARY_BUTTON}>
                <Plus className="mr-2 h-4 w-4" />
                {editingEventId ? "Save Changes" : "Create Event"}
              </Button>
              {editingEventId && (
                <Button
                  type="button"
                  size="sm"
                  onClick={cancelEdit}
                  className={OUTLINE_BUTTON}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CollapsibleFormCard>
      )}

      <SectionCard>
        <SectionCard.Body className="p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
            <Input
              value={q}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events…"
              className="pl-8 font-body text-[13px]"
            />
          </div>
        </SectionCard.Body>
      </SectionCard>

      {loading ? (
        <SectionCard>
          <SectionCard.Body className="p-8 text-center">
            <div className="font-body text-[13px] text-text-muted animate-pulse">
              Loading events...
            </div>
          </SectionCard.Body>
        </SectionCard>
      ) : total === 0 ? (
        <SectionCard>
          <SectionCard.Body className="p-0">
            <EmptyStateBlock
              variant="centered"
              icon={CalendarIcon}
              tone="info"
              title={q ? "No matching events" : "No events scheduled yet"}
              description={
                isAdmin
                  ? "Create events to bring your cohort together"
                  : "Your organization hasn't scheduled any events yet"
              }
              action={
                isAdmin ? (
                  <Button
                    size="sm"
                    onClick={() => setShowCreateForm(true)}
                    className={PRIMARY_BUTTON}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Schedule Meeting
                  </Button>
                ) : null
              }
            />
          </SectionCard.Body>
        </SectionCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <MiniCalendar organizationId={organizationId} events={events} />
          </div>

          <div className="space-y-3">
            <SectionCard>
              <SectionCard.Body className="p-3">
                <h3 className="mb-2 font-heading text-[14px] font-bold text-text-heading">
                  Upcoming Agendas
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  <FilterPill
                    active={agendaFilter === "all"}
                    onClick={() => setAgendaFilter("all")}
                  >
                    All ({upcomingCalendarCount("all")})
                  </FilterPill>
                  <FilterPill
                    active={agendaFilter === "event"}
                    onClick={() => setAgendaFilter("event")}
                  >
                    Events ({upcomingCalendarCount("event")})
                  </FilterPill>
                  <FilterPill
                    active={agendaFilter === "deliverable"}
                    onClick={() => setAgendaFilter("deliverable")}
                  >
                    Deliverables ({upcomingCalendarCount("deliverable")})
                  </FilterPill>
                  <FilterPill
                    active={agendaFilter === "milestone"}
                    onClick={() => setAgendaFilter("milestone")}
                  >
                    Milestones ({upcomingCalendarCount("milestone")})
                  </FilterPill>
                </div>
              </SectionCard.Body>
            </SectionCard>

            <div className="space-y-2">
              {upcomingItems.length === 0 ? (
                <SectionCard>
                  <SectionCard.Body className="p-0">
                    <EmptyStateBlock
                      variant="compact"
                      icon={CalendarIcon}
                      tone="info"
                      title={`No upcoming ${agendaFilter === "all" ? "items" : agendaFilter + "s"}`}
                      description="Items you schedule will appear here"
                    />
                  </SectionCard.Body>
                </SectionCard>
              ) : (
                upcomingItems.map((item) => {
                  const tone =
                    AGENDA_TYPE_TONE[item.type] || AGENDA_TYPE_TONE.other;
                  const ItemIcon = tone.icon;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setSelectedAgenda(item)}
                      className="group w-full rounded-card border border-surface-border bg-white p-3 text-left transition-all hover:border-primary/40 hover:shadow-soft"
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-input",
                            tone.disc,
                          )}
                        >
                          <ItemIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate font-heading text-[13px] font-semibold text-text-heading">
                            {item.title}
                          </h4>
                          <div className="mt-1 flex items-center gap-2 font-body text-[12px] text-text-muted">
                            <Clock className="h-3 w-3" />
                            {new Date(item.startDate).toLocaleDateString()}
                          </div>
                          {item.isVirtual && (
                            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary-tint px-[10px] py-[2px] font-body text-[11px] font-semibold text-primary">
                              <Video className="h-3 w-3" />
                              Virtual
                            </span>
                          )}
                        </div>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border-0 px-[10px] py-[2px] font-body text-[11px] font-semibold capitalize",
                            tone.badge,
                          )}
                        >
                          {item.type}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {!loading && total > limit && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          hasNext={hasNext}
          hasPrev={hasPrev}
          onNext={nextPage}
          onPrev={prevPage}
          onGoToPage={goToPage}
          totalItems={total}
          pageSize={limit}
        />
      )}

      <Dialog
        open={Boolean(selectedAgenda)}
        onOpenChange={(open) => {
          if (!open) setSelectedAgenda(null);
        }}
      >
        <DialogContent className="max-w-xl">
          {selectedAgenda && (
            <>
              <DialogHeader className="text-left">
                <div className="flex items-start gap-3">
                  {AgendaIcon && agendaTone && (
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-input",
                        agendaTone.disc,
                      )}
                    >
                      <AgendaIcon className="h-5 w-5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="font-heading text-[18px] font-bold text-text-heading">
                      {selectedAgenda.title}
                    </DialogTitle>
                    {agendaTone && (
                      <span
                        className={cn(
                          "mt-1 inline-flex items-center rounded-full border-0 px-[10px] py-[2px] font-body text-[11px] font-semibold capitalize",
                          agendaTone.badge,
                        )}
                      >
                        {selectedAgenda.type}
                      </span>
                    )}
                  </div>
                </div>
              </DialogHeader>

              {selectedAgenda.description && (
                <p className="font-body text-[13px] text-text-body">
                  {selectedAgenda.description}
                </p>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-2 font-body text-[13px] text-text-body">
                  <CalendarIcon className="h-4 w-4 text-text-muted" />
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
                <div className="flex items-center gap-2 font-body text-[13px] text-text-body">
                  <Clock className="h-4 w-4 text-text-muted" />
                  <span>
                    {new Date(selectedAgenda.startDate).toLocaleTimeString(
                      "en-US",
                      { hour: "2-digit", minute: "2-digit" },
                    )}
                  </span>
                  {selectedAgenda.endDate && (
                    <span className="font-body text-[13px] text-text-muted">
                      -{" "}
                      {new Date(selectedAgenda.endDate).toLocaleTimeString(
                        "en-US",
                        { hour: "2-digit", minute: "2-digit" },
                      )}
                    </span>
                  )}
                </div>
                {selectedAgenda.location && !selectedAgenda.isVirtual && (
                  <div className="flex items-center gap-2 font-body text-[13px] text-text-body">
                    <MapPin className="h-4 w-4 text-text-muted" />
                    <span>{selectedAgenda.location}</span>
                  </div>
                )}
                {selectedAgenda.isVirtual && (
                  <div className="flex items-center gap-2 font-body text-[13px] text-text-body">
                    <Video className="h-4 w-4 text-text-muted" />
                    <span>Virtual Event</span>
                  </div>
                )}
              </div>

              {selectedAgenda.metadata && (
                <div className="border-t border-surface-border pt-3 font-body text-[12px] text-text-muted">
                  {selectedAgenda.metadata.cohortName &&
                    `Cohort: ${selectedAgenda.metadata.cohortName}`}
                  {selectedAgenda.metadata.organizationName &&
                    ` • ${selectedAgenda.metadata.organizationName}`}
                  {selectedAgenda.metadata.eventType &&
                    ` • ${selectedAgenda.metadata.eventType}`}
                </div>
              )}

              <DialogFooter className="sm:justify-start flex-wrap gap-2">
                {selectedAgenda.meetingUrl &&
                  selectedAgenda.type === "event" && (
                    <Button
                      size="sm"
                      onClick={() => {
                        window.open(selectedAgenda.meetingUrl, "_blank");
                        toast.success("Opening meeting...");
                      }}
                      className={`flex-1 ${PRIMARY_BUTTON}`}
                    >
                      <Video className="mr-2 h-4 w-4" />
                      Join Meeting
                    </Button>
                  )}
                {isAdmin && selectedAgenda.type === "event" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => startEditEvent(selectedAgenda)}
                      className={OUTLINE_BUTTON}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setEventToDelete(selectedAgenda)}
                      className="h-9 rounded-input border border-destructive/40 bg-white font-body text-[13px] font-medium text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </>
                )}
                {selectedAgenda.type === "deliverable" && (
                  <Button
                    size="sm"
                    onClick={() => {
                      toast.info("Navigating to deliverable...");
                      setSelectedAgenda(null);
                    }}
                    className={`flex-1 ${OUTLINE_BUTTON}`}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    View Deliverable
                  </Button>
                )}
                {selectedAgenda.type === "milestone" && (
                  <Button
                    size="sm"
                    onClick={() => {
                      toast.info("Navigating to milestone...");
                      setSelectedAgenda(null);
                    }}
                    className={`flex-1 ${OUTLINE_BUTTON}`}
                  >
                    <Target className="mr-2 h-4 w-4" />
                    View Milestone
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => setSelectedAgenda(null)}
                  className={OUTLINE_BUTTON}
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!eventToDelete}
        onOpenChange={(open) => !open && setEventToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-base font-bold text-text-heading">
              Delete Event
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body text-[13px] text-text-body">
              {"Delete "}
              <strong>{eventToDelete?.title}</strong>?
              {eventToDelete?.startDate &&
                new Date(eventToDelete.startDate).getTime() - Date.now() <
                  24 * 3600 * 1000 &&
                new Date(eventToDelete.startDate).getTime() > Date.now() && (
                  <span className="mt-2 block font-body text-[12px] text-warning">
                    This event starts in less than 24 hours. Founders will be
                    notified that it has been cancelled.
                  </span>
                )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="h-9 rounded-input font-body text-[13px] font-medium"
              disabled={isDeletingEvent}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteEvent}
              disabled={isDeletingEvent}
              className="h-9 rounded-input bg-destructive font-body text-[13px] font-semibold text-white hover:bg-destructive/90"
            >
              {isDeletingEvent ? "Deleting..." : "Delete Event"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
