import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  Repeat,
  Trash2,
} from "lucide-react";
import * as meetingApi from "../../utils/api/meetingApi";
import { toast } from "sonner";
import { toastError } from "../../utils/toastError";

function formatDisplayDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function typeLabel(type) {
  return type === "video-call" ? "Video Call" : "In-Person";
}

export default function MeetingDetailModal({
  open,
  meeting,
  currentUserId,
  teamMembers = [],
  onClose,
  onDeleted,
}) {
  const [deleting, setDeleting] = useState(false);
  if (!meeting) return null;

  const organizerId = String(meeting.organizerId || "");
  const isOrganizer =
    Boolean(currentUserId) && String(currentUserId) === organizerId;

  const attendeeNames = (Array.isArray(meeting.attendees)
    ? meeting.attendees
    : []
  ).map((id) => {
    const member = teamMembers.find(
      (m) => String(m.id || m.userId) === String(id),
    );
    if (member?.name) return member.name;
    if (String(id) === String(currentUserId)) return "You";
    return "Team member";
  });

  const handleDelete = async () => {
    if (!meeting.id) return;
    setDeleting(true);
    try {
      const result = await meetingApi.deleteMeeting(meeting.id);
      if (!result.success) {
        toast.error(result.error || "Failed to delete meeting");
        return;
      }
      toast.success("Meeting deleted");
      onDeleted?.(meeting);
      onClose?.();
    } catch (err) {
      toastError(err, "Failed to delete meeting");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose?.()}>
      <DialogContent className="max-w-md w-[calc(100%-2rem)] sm:w-full office-dialog-panel">
        <DialogHeader>
          <DialogTitle className="flex items-start gap-2 pr-6 font-heading text-base font-bold text-text-heading">
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span className="min-w-0 break-words">{meeting.title || "Meeting"}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 font-body text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              className={
                meeting.type === "video-call"
                  ? "rounded-full bg-blue-100 text-blue-700"
                  : "rounded-full bg-amber-100 text-amber-800"
              }
            >
              {meeting.type === "video-call" ? (
                <Video className="mr-1 h-3 w-3" />
              ) : (
                <Users className="mr-1 h-3 w-3" />
              )}
              {typeLabel(meeting.type)}
            </Badge>
            {meeting.isRecurring ? (
              <Badge className="rounded-full bg-primary-tint text-primary">
                <Repeat className="mr-1 h-3 w-3" />
                Recurring
              </Badge>
            ) : null}
            {meeting.status && meeting.status !== "scheduled" ? (
              <Badge variant="outline" className="rounded-full capitalize">
                {meeting.status}
              </Badge>
            ) : null}
          </div>

          {meeting.description ? (
            <p className="text-text-body whitespace-pre-wrap">
              {meeting.description}
            </p>
          ) : null}

          <div className="space-y-2 rounded-input border border-surface-border bg-surface-page/60 p-3">
            <div className="flex items-center gap-2 text-text-heading">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>{formatDisplayDate(meeting.date)}</span>
            </div>
            {(meeting.startTime || meeting.endTime) && (
              <div className="flex items-center gap-2 text-text-body">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span>
                  {meeting.startTime || "--:--"}
                  {meeting.endTime ? ` – ${meeting.endTime}` : ""}
                </span>
              </div>
            )}
            {meeting.location ? (
              <div className="flex items-center gap-2 text-text-body">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span>{meeting.location}</span>
              </div>
            ) : null}
          </div>

          {attendeeNames.length > 0 ? (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                Attendees ({attendeeNames.length})
              </p>
              <ul className="space-y-1 text-text-body">
                {attendeeNames.slice(0, 12).map((name, idx) => (
                  <li key={`${name}-${idx}`} className="flex items-center gap-2">
                    <Users className="h-3 w-3 text-text-muted" />
                    {name}
                  </li>
                ))}
                {attendeeNames.length > 12 ? (
                  <li className="text-text-muted">
                    +{attendeeNames.length - 12} more
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {isOrganizer ? (
            <Button
              type="button"
              variant="outline"
              className="border-status-error/40 text-status-error hover:bg-status-error/8"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          ) : null}
          <Button type="button" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
