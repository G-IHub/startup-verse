import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { ScrollArea } from "../ui/scroll-area";
import { Switch } from "../ui/switch";
import {
  Calendar,
  Clock,
  Video,
  Users,
  MapPin,
  X,
  Check,
  Repeat,
  Search,
} from "lucide-react";
import { getInitials } from "../../utils/nameHelpers";
import * as meetingApi from "../../utils/api/meetingApi";
import { getStartupId } from "../../utils/startupId";
import { toast } from "sonner";

function memberKey(member) {
  return String(member?.id || member?.userId || member?._id || "");
}

export default function MeetingScheduler({
  open,
  onClose,
  user,
  teamMembers = [],
  onMeetingScheduled,
  defaultDate,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [type, setType] = useState("meeting");
  const [location, setLocation] = useState("");
  const [selectedAttendees, setSelectedAttendees] = useState([]);
  const [attendeeFilter, setAttendeeFilter] = useState("");
  const [loading, setLoading] = useState(false);

  // Recurring meeting states
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState("weekly");
  const [recurrenceEndType, setRecurrenceEndType] = useState("occurrences");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [recurrenceOccurrences, setRecurrenceOccurrences] = useState("10");
  const [weeklyDays, setWeeklyDays] = useState([]);

  const normalizedMembers = useMemo(
    () =>
      (teamMembers || [])
        .map((m) => ({
          ...m,
          id: memberKey(m),
          name: String(m.name || m.userName || "Team member"),
        }))
        .filter((m) => m.id),
    [teamMembers],
  );

  const filteredMembers = useMemo(() => {
    const q = attendeeFilter.trim().toLowerCase();
    if (!q) return normalizedMembers;
    return normalizedMembers.filter((m) => {
      const name = String(m.name || "").toLowerCase();
      const role = String(m.profile?.title || m.title || m.role || "").toLowerCase();
      return name.includes(q) || role.includes(q);
    });
  }, [normalizedMembers, attendeeFilter]);

  // Seed attendees once per open session — do not reset when the roster refreshes mid-edit.
  const attendeesSeededRef = useRef(false);
  const prevOpenRef = useRef(false);

  useEffect(() => {
    if (!open) {
      prevOpenRef.current = false;
      attendeesSeededRef.current = false;
      return;
    }

    const justOpened = !prevOpenRef.current;
    prevOpenRef.current = true;

    if (justOpened) {
      if (defaultDate) {
        const year = defaultDate.getFullYear();
        const month = String(defaultDate.getMonth() + 1).padStart(2, "0");
        const day = String(defaultDate.getDate()).padStart(2, "0");
        setDate(`${year}-${month}-${day}`);
      }
      setAttendeeFilter("");
    }

    if (attendeesSeededRef.current) return;

    // If roster is still empty on first open, wait for the next roster update to seed.
    if (justOpened && normalizedMembers.length === 0) return;

    setSelectedAttendees(normalizedMembers.map((m) => m.id));
    attendeesSeededRef.current = true;
  }, [open, defaultDate, normalizedMembers]);

  const toggleAttendee = (memberId) => {
    const id = String(memberId || "");
    if (!id) return;
    setSelectedAttendees((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const selectAllFiltered = () => {
    const ids = filteredMembers.map((m) => m.id);
    setSelectedAttendees((prev) => [...new Set([...prev, ...ids])]);
  };

  const clearFiltered = () => {
    const remove = new Set(filteredMembers.map((m) => m.id));
    setSelectedAttendees((prev) => prev.filter((id) => !remove.has(id)));
  };
  const handleSchedule = async () => {
    if (!title || !date || !startTime || !endTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate recurring meeting settings
    if (isRecurring) {
      if (recurrencePattern === "weekly" && weeklyDays.length === 0) {
        toast.error("Please select at least one day for weekly recurrence");
        return;
      }
      if (recurrenceEndType === "date" && !recurrenceEndDate) {
        toast.error("Please select an end date");
        return;
      }
      if (
        recurrenceEndType === "occurrences" &&
        (!recurrenceOccurrences || parseInt(recurrenceOccurrences) < 1)
      ) {
        toast.error("Please enter a valid number of occurrences");
        return;
      }
    }
    setLoading(true);
    try {
      const meetingData = {
        title,
        description,
        date,
        startTime,
        endTime,
        type,
        location: type === "video-call" ? "Virtual Office" : location,
        attendees: selectedAttendees,
        organizerId: user.id || user._id,
        startupId: getStartupId(user),
        status: "scheduled",
        // Recurring meeting data
        isRecurring,
        recurrencePattern: isRecurring ? recurrencePattern : undefined,
        recurrenceEndType: isRecurring ? recurrenceEndType : undefined,
        recurrenceEndDate:
          isRecurring && recurrenceEndType === "date"
            ? recurrenceEndDate
            : undefined,
        recurrenceOccurrences:
          isRecurring && recurrenceEndType === "occurrences"
            ? parseInt(recurrenceOccurrences)
            : undefined,
        weeklyDays:
          isRecurring && recurrencePattern === "weekly"
            ? weeklyDays
            : undefined,
      };
      const result = await meetingApi.createMeeting(meetingData);
      if (result.success) {
        const meetingCount = result.meetingCount || 1;
        toast.success(
          isRecurring
            ? `${meetingCount} recurring meeting${meetingCount > 1 ? "s" : ""} scheduled successfully!`
            : "Meeting scheduled successfully!",
        );
        onMeetingScheduled?.(result.meeting);
        handleClose();
      } else {
        toast.error(result.error || "Failed to schedule meeting");
      }
    } catch (error) {
      console.error("Error scheduling meeting:", error);
      toast.error("Failed to schedule meeting");
    } finally {
      setLoading(false);
    }
  };
  const handleClose = () => {
    setTitle("");
    setDescription("");
    setDate("");
    setStartTime("");
    setEndTime("");
    setType("meeting");
    setLocation("");
    setSelectedAttendees([]);
    setAttendeeFilter("");
    setIsRecurring(false);
    onClose();
  };
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md w-[calc(100%-2rem)] sm:w-full office-dialog-panel">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-[#3A5AFE]" />
            Schedule Meeting
          </DialogTitle>
          <DialogDescription className="text-sm">
            Create a new meeting or video call with your team
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-3">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Meeting Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={type === "meeting" ? "default" : "outline"}
                  onClick={() => setType("meeting")}
                  className="h-8 text-sm"
                >
                  <Users className="w-3 h-3 mr-1.5" />
                  In-Person
                </Button>
                <Button
                  type="button"
                  variant={type === "video-call" ? "default" : "outline"}
                  onClick={() => setType("video-call")}
                  className="h-8 text-sm"
                >
                  <Video className="w-3 h-3 mr-1.5" />
                  Video Call
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-sm">
                Meeting Title *
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Weekly standup"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Discuss weekly progress and blockers..."
                className="min-h-[60px] text-sm resize-none"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="date" className="text-sm">
                  Date *
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2 w-3 h-3 text-muted-foreground pointer-events-none" />
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-8 text-sm pl-8"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="startTime" className="text-sm">
                  Start *
                </Label>
                <div className="relative">
                  <Clock className="absolute left-2.5 top-2 w-3 h-3 text-muted-foreground pointer-events-none" />
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="h-8 text-sm pl-8"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endTime" className="text-sm">
                  End *
                </Label>
                <div className="relative">
                  <Clock className="absolute left-2.5 top-2 w-3 h-3 text-muted-foreground pointer-events-none" />
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="h-8 text-sm pl-8"
                  />
                </div>
              </div>
            </div>
            {type === "meeting" && (
              <div className="space-y-1.5">
                <Label htmlFor="location" className="text-sm">
                  Location
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-2 w-3 h-3 text-muted-foreground" />
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Conference Room A"
                    className="h-8 text-sm pl-8"
                  />
                </div>
              </div>
            )}
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2">
                <Repeat className="w-3.5 h-3.5 text-[#3A5AFE]" />
                <div>
                  <Label className="text-sm font-medium">
                    Recurring Meeting
                  </Label>
                  <p className="text-[9px] text-muted-foreground">
                    Repeat this meeting automatically
                  </p>
                </div>
              </div>
              <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
            </div>
            {isRecurring && (
              <div className="space-y-3 p-3 rounded-lg border bg-muted/20">
                <div className="space-y-1.5">
                  <Label className="text-sm">Repeat Every</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant={
                        recurrencePattern === "daily" ? "default" : "outline"
                      }
                      onClick={() => setRecurrencePattern("daily")}
                      className="h-8 text-sm"
                    >
                      Daily
                    </Button>
                    <Button
                      type="button"
                      variant={
                        recurrencePattern === "weekly" ? "default" : "outline"
                      }
                      onClick={() => setRecurrencePattern("weekly")}
                      className="h-8 text-sm"
                    >
                      Weekly
                    </Button>
                    <Button
                      type="button"
                      variant={
                        recurrencePattern === "monthly" ? "default" : "outline"
                      }
                      onClick={() => setRecurrencePattern("monthly")}
                      className="h-8 text-sm"
                    >
                      Monthly
                    </Button>
                  </div>
                </div>
                {recurrencePattern === "weekly" && (
                  <div className="space-y-1.5">
                    <Label className="text-sm">Repeat On</Label>
                    <div className="grid grid-cols-7 gap-1">
                      {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => {
                        const isSelected = weeklyDays.includes(index);
                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setWeeklyDays(
                                  weeklyDays.filter((d) => d !== index),
                                );
                              } else {
                                setWeeklyDays([...weeklyDays, index].sort());
                              }
                            }}
                            className={`h-8 rounded-md text-[9px] font-medium transition-colors ${isSelected ? "bg-[#3A5AFE] text-white" : "bg-background border hover:bg-muted"}`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-sm">Ends</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={
                        recurrenceEndType === "occurrences"
                          ? "default"
                          : "outline"
                      }
                      onClick={() => setRecurrenceEndType("occurrences")}
                      className="h-8 text-sm"
                    >
                      After
                    </Button>
                    <Button
                      type="button"
                      variant={
                        recurrenceEndType === "date" ? "default" : "outline"
                      }
                      onClick={() => setRecurrenceEndType("date")}
                      className="h-8 text-sm"
                    >
                      On Date
                    </Button>
                  </div>
                </div>
                {recurrenceEndType === "occurrences" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="occurrences" className="text-sm">
                      Number of Occurrences
                    </Label>
                    <Input
                      id="occurrences"
                      type="number"
                      min="1"
                      max="52"
                      value={recurrenceOccurrences}
                      onChange={(e) => setRecurrenceOccurrences(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                )}
                {recurrenceEndType === "date" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="endDate" className="text-sm">
                      End Date
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={recurrenceEndDate}
                      onChange={(e) => setRecurrenceEndDate(e.target.value)}
                      min={date}
                      className="h-8 text-sm"
                    />
                  </div>
                )}
              </div>
            )}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-sm">
                  Attendees ({selectedAttendees.length}/
                  {normalizedMembers.length})
                </Label>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[11px]"
                    onClick={selectAllFiltered}
                    disabled={filteredMembers.length === 0}
                  >
                    Select all
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[11px]"
                    onClick={clearFiltered}
                    disabled={filteredMembers.length === 0}
                  >
                    Clear
                  </Button>
                </div>
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={attendeeFilter}
                  onChange={(e) => setAttendeeFilter(e.target.value)}
                  placeholder="Filter team members…"
                  className="h-8 pl-8 text-sm"
                />
              </div>
              <div className="max-h-[180px] space-y-1 overflow-y-auto rounded-lg border bg-muted/30 p-2">
                {normalizedMembers.length === 0 ? (
                  <p className="py-3 text-center text-sm text-muted-foreground">
                    No team members available
                  </p>
                ) : filteredMembers.length === 0 ? (
                  <p className="py-3 text-center text-sm text-muted-foreground">
                    No members match “{attendeeFilter.trim()}”
                  </p>
                ) : (
                  filteredMembers.map((member) => {
                    const isSelected = selectedAttendees.includes(member.id);
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => toggleAttendee(member.id)}
                        className={`flex w-full cursor-pointer items-center gap-2 rounded-lg border p-2 text-left transition-colors ${
                          isSelected
                            ? "border-primary/40 bg-primary/5"
                            : "border-transparent bg-background hover:bg-muted/50"
                        }`}
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                            isSelected
                              ? "border-primary bg-primary text-white"
                              : "border-surface-border bg-surface-card"
                          }`}
                          aria-hidden
                        >
                          {isSelected ? (
                            <Check className="h-3 w-3" strokeWidth={3} />
                          ) : null}
                        </span>
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-primary text-[9px] text-white">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {member.name}
                          </p>
                          <p className="truncate text-[9px] text-muted-foreground">
                            {member.profile?.title || member.title || member.role}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
            {selectedAttendees.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedAttendees.map((attendeeId) => {
                  const member = normalizedMembers.find(
                    (m) => m.id === attendeeId,
                  );
                  if (!member) return null;
                  return (
                    <Badge
                      key={attendeeId}
                      variant="secondary"
                      className="gap-1 px-2 py-0.5 text-[9px]"
                    >
                      {member.name.split(" ")[0]}
                      <X
                        className="h-2.5 w-2.5 cursor-pointer hover:text-destructive"
                        onClick={() => toggleAttendee(attendeeId)}
                      />
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            className="h-8 text-sm"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSchedule}
            disabled={loading}
            className="h-8 text-sm bg-[#3A5AFE] hover:bg-[#304FFE]"
          >
            {loading ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                Scheduling...
              </>
            ) : (
              <>
                <Calendar className="w-3 h-3 mr-1.5" />
                Schedule Meeting
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

