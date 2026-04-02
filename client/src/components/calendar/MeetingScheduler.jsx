import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { getInitials } from "../../utils/nameHelpers";
import * as meetingApi from "../../utils/api/meetingApi";
import { toast } from "sonner";
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
  const [loading, setLoading] = useState(false);

  // Recurring meeting states
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState("weekly");
  const [recurrenceEndType, setRecurrenceEndType] = useState("occurrences");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [recurrenceOccurrences, setRecurrenceOccurrences] = useState("10");
  const [weeklyDays, setWeeklyDays] = useState([]);
  useEffect(() => {
    if (defaultDate) {
      const year = defaultDate.getFullYear();
      const month = String(defaultDate.getMonth() + 1).padStart(2, "0");
      const day = String(defaultDate.getDate()).padStart(2, "0");
      setDate(`${year}-${month}-${day}`);
    }
  }, [defaultDate]);
  const toggleAttendee = (memberId) => {
    if (selectedAttendees.includes(memberId)) {
      setSelectedAttendees(selectedAttendees.filter((id) => id !== memberId));
    } else {
      setSelectedAttendees([...selectedAttendees, memberId]);
    }
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
        organizerId: user.id,
        startupId: user.role === "founder" ? user.id : user.startupId,
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
    onClose();
  };
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md w-[calc(100%-2rem)] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-[#3A5AFE]" />
            Schedule Meeting
          </DialogTitle>
          <DialogDescription className="text-[10px]">
            Create a new meeting or video call with your team
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-3">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[10px]">Meeting Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={type === "meeting" ? "default" : "outline"}
                  onClick={() => setType("meeting")}
                  className="h-8 text-[10px]"
                >
                  <Users className="w-3 h-3 mr-1.5" />
                  In-Person
                </Button>
                <Button
                  type="button"
                  variant={type === "video-call" ? "default" : "outline"}
                  onClick={() => setType("video-call")}
                  className="h-8 text-[10px]"
                >
                  <Video className="w-3 h-3 mr-1.5" />
                  Video Call
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-[10px]">
                Meeting Title *
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Weekly standup"
                className="h-8 text-[11px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-[10px]">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Discuss weekly progress and blockers..."
                className="min-h-[60px] text-[11px] resize-none"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="date" className="text-[10px]">
                  Date *
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2 w-3 h-3 text-muted-foreground pointer-events-none" />
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-8 text-[11px] pl-8"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="startTime" className="text-[10px]">
                  Start *
                </Label>
                <div className="relative">
                  <Clock className="absolute left-2.5 top-2 w-3 h-3 text-muted-foreground pointer-events-none" />
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="h-8 text-[11px] pl-8"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endTime" className="text-[10px]">
                  End *
                </Label>
                <div className="relative">
                  <Clock className="absolute left-2.5 top-2 w-3 h-3 text-muted-foreground pointer-events-none" />
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="h-8 text-[11px] pl-8"
                  />
                </div>
              </div>
            </div>
            {type === "meeting" && (
              <div className="space-y-1.5">
                <Label htmlFor="location" className="text-[10px]">
                  Location
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-2 w-3 h-3 text-muted-foreground" />
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Conference Room A"
                    className="h-8 text-[11px] pl-8"
                  />
                </div>
              </div>
            )}
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2">
                <Repeat className="w-3.5 h-3.5 text-[#3A5AFE]" />
                <div>
                  <Label className="text-[10px] font-medium">
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
                  <Label className="text-[10px]">Repeat Every</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant={
                        recurrencePattern === "daily" ? "default" : "outline"
                      }
                      onClick={() => setRecurrencePattern("daily")}
                      className="h-8 text-[10px]"
                    >
                      Daily
                    </Button>
                    <Button
                      type="button"
                      variant={
                        recurrencePattern === "weekly" ? "default" : "outline"
                      }
                      onClick={() => setRecurrencePattern("weekly")}
                      className="h-8 text-[10px]"
                    >
                      Weekly
                    </Button>
                    <Button
                      type="button"
                      variant={
                        recurrencePattern === "monthly" ? "default" : "outline"
                      }
                      onClick={() => setRecurrencePattern("monthly")}
                      className="h-8 text-[10px]"
                    >
                      Monthly
                    </Button>
                  </div>
                </div>
                {recurrencePattern === "weekly" && (
                  <div className="space-y-1.5">
                    <Label className="text-[10px]">Repeat On</Label>
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
                  <Label className="text-[10px]">Ends</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={
                        recurrenceEndType === "occurrences"
                          ? "default"
                          : "outline"
                      }
                      onClick={() => setRecurrenceEndType("occurrences")}
                      className="h-8 text-[10px]"
                    >
                      After
                    </Button>
                    <Button
                      type="button"
                      variant={
                        recurrenceEndType === "date" ? "default" : "outline"
                      }
                      onClick={() => setRecurrenceEndType("date")}
                      className="h-8 text-[10px]"
                    >
                      On Date
                    </Button>
                  </div>
                </div>
                {recurrenceEndType === "occurrences" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="occurrences" className="text-[10px]">
                      Number of Occurrences
                    </Label>
                    <Input
                      id="occurrences"
                      type="number"
                      min="1"
                      max="52"
                      value={recurrenceOccurrences}
                      onChange={(e) => setRecurrenceOccurrences(e.target.value)}
                      className="h-8 text-[11px]"
                    />
                  </div>
                )}
                {recurrenceEndType === "date" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="endDate" className="text-[10px]">
                      End Date
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={recurrenceEndDate}
                      onChange={(e) => setRecurrenceEndDate(e.target.value)}
                      min={date}
                      className="h-8 text-[11px]"
                    />
                  </div>
                )}
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-[10px]">
                Attendees ({selectedAttendees.length})
              </Label>
              <div className="space-y-1.5 border rounded-lg p-2 bg-muted/30 max-h-[180px] overflow-y-auto">
                {teamMembers.length > 0 ? (
                  teamMembers.map((member) => {
                    const isSelected = selectedAttendees.includes(member.id);
                    return (
                      <div
                        key={member.id}
                        onClick={() => toggleAttendee(member.id)}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? "bg-[#3A5AFE]/10 border border-[#3A5AFE]" : "bg-background hover:bg-muted/50"}`}
                      >
                        <Avatar className="w-7 h-7">
                          <AvatarFallback className="text-[9px] bg-gradient-to-br from-[#3A5AFE] to-purple-600 text-white">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-medium truncate">
                            {member.name}
                          </p>
                          <p className="text-[9px] text-muted-foreground truncate">
                            {member.profile?.title || member.role}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#3A5AFE] flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-[10px] text-muted-foreground text-center py-3">
                    No team members available
                  </p>
                )}
              </div>
            </div>
            {selectedAttendees.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedAttendees.map((attendeeId) => {
                  const member = teamMembers.find((m) => m.id === attendeeId);
                  if (!member) return null;
                  return (
                    <Badge
                      key={attendeeId}
                      variant="secondary"
                      className="text-[9px] px-2 py-0.5 gap-1"
                    >
                      {member.name.split(" ")[0]}
                      <X
                        className="w-2.5 h-2.5 cursor-pointer hover:text-destructive"
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
            className="h-8 text-[10px]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSchedule}
            disabled={loading}
            className="h-8 text-[10px] bg-[#3A5AFE] hover:bg-[#304FFE]"
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
