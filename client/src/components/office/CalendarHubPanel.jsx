import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  Video,
  Users,
  CalendarDays,
  Clock,
  MapPin,
} from "lucide-react";
import MeetingScheduler from "../calendar/MeetingScheduler";
import MeetingDetailModal from "../calendar/MeetingDetailModal";
import AgendaPanel from "../calendar/AgendaPanel";
import * as meetingApi from "../../utils/api/meetingApi";
import * as teamMemberApi from "../../utils/api/teamMemberApi";
import { getStartupId } from "../../utils/startupId";
import { cn } from "../ui/utils";

const YELLOW_DAY = "#fef3c7";
const YELLOW_DAY_SELECTED = "#fde68a";
const YELLOW_TEXT = "#92400e";

function isToday(date) {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function isSameDay(a, b) {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

function getDaysInMonth(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const total = new Date(year, month + 1, 0).getDate();
  return { total, firstDay };
}

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseLocalYmd(ymd) {
  const [y, m, d] = String(ymd || "")
    .slice(0, 10)
    .split("-")
    .map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function getTypeChip(type) {
  if (type === "video-call")
    return { label: "Video", bg: "bg-sky-50", color: "text-sky-700", Icon: Video };
  return {
    label: "In-person",
    bg: "bg-amber-50",
    color: "text-amber-800",
    Icon: Users,
  };
}

function countUniqueMeetingSeries(meetings) {
  const keys = new Set();
  for (const m of meetings || []) {
    keys.add(m.recurrenceGroupId || m.id);
  }
  return keys.size;
}

function findNextMeetingDate(
  meetings,
  fromDate = new Date(),
  { allowPast = false } = {},
) {
  const fromKey = formatDate(fromDate);
  const upcoming = (meetings || [])
    .map((m) => m.date)
    .filter((d) => d && d >= fromKey)
    .sort();
  if (upcoming[0]) return upcoming[0];
  if (!allowPast) return null;
  const any = (meetings || [])
    .map((m) => m.date)
    .filter(Boolean)
    .sort();
  return any[0] || null;
}

function meetingFromAgendaItem(item) {
  if (!item) return null;
  const meta = item.metadata || item.raw || {};
  return {
    id: String(item.id || meta.id || meta._id || ""),
    title: item.title || meta.title || "Meeting",
    description: item.description || meta.description || "",
    date: item.date || meta.date || "",
    startTime: item.startTime || meta.startTime || item.time || "",
    endTime: item.endTime || meta.endTime || "",
    type: item.subtype || meta.type || item.type || "meeting",
    location: item.location || meta.location || "",
    attendees: meta.attendees || item.attendees || [],
    organizerId: meta.organizerId || item.organizerId || "",
    isRecurring: Boolean(
      meta.isRecurring || item.isRecurring || item.isRecurringSeries,
    ),
    recurrenceGroupId:
      item.recurrenceGroupId || meta.recurrenceGroupId || null,
    status: meta.status || item.status || "scheduled",
  };
}

const DAY_HEADERS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function CalendarHubPanel({
  user,
  onClose,
  startupId: propStartupId,
  onMeetingScheduled: onMeetingScheduledProp,
  /** When opening from the office mini-calendar, focus this day. */
  initialDate = null,
}) {
  const focusDate =
    initialDate instanceof Date && !Number.isNaN(initialDate.getTime())
      ? initialDate
      : null;
  const focusKey = focusDate ? formatDate(focusDate) : "auto";

  const [currentDate, setCurrentDate] = useState(
    () =>
      focusDate
        ? new Date(focusDate.getFullYear(), focusDate.getMonth(), 1)
        : new Date(),
  );
  const [selectedDate, setSelectedDate] = useState(
    () => focusDate || new Date(),
  );
  const [meetings, setMeetings] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [showScheduler, setShowScheduler] = useState(false);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [hoverDay, setHoverDay] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [detailMeeting, setDetailMeeting] = useState(null);
  const [agendaReloadToken, setAgendaReloadToken] = useState(0);
  const didAutoSelect = useRef(false);
  const autoSelectSessionKey = useRef("");

  const resolvedStartupId = propStartupId || getStartupId(user || {});
  const normalizedUser = user
    ? { ...user, id: user.id || String(user._id || "") }
    : null;
  const isFounder = String(user?.role || "") === "founder";

  const loadMeetings = useCallback(async () => {
    if (!resolvedStartupId) return;
    setLoadingMeetings(true);
    try {
      const list = await meetingApi.getStartupMeetings(resolvedStartupId);
      setMeetings(Array.isArray(list) ? list : []);
    } catch {
      setMeetings([]);
    } finally {
      setLoadingMeetings(false);
    }
  }, [resolvedStartupId]);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  useEffect(() => {
    if (!resolvedStartupId) return;
    teamMemberApi
      .getStartupTeamMembers(resolvedStartupId)
      .then((list) => {
        const members = Array.isArray(list) ? list : list?.members || [];
        setTeamMembers(
          members.filter((m) => String(m.id) !== String(normalizedUser?.id)),
        );
      })
      .catch(() => setTeamMembers([]));
  }, [resolvedStartupId, normalizedUser?.id]);

  // Reset auto-select when the open session changes (startup or focused day).
  useEffect(() => {
    const sessionKey = `${resolvedStartupId || ""}:${focusKey}`;
    if (autoSelectSessionKey.current !== sessionKey) {
      autoSelectSessionKey.current = sessionKey;
      didAutoSelect.current = false;
    }
  }, [resolvedStartupId, focusKey]);

  // Honor mini-calendar day focus as soon as it is provided.
  useEffect(() => {
    if (!focusDate) return;
    setSelectedDate(focusDate);
    setCurrentDate(
      new Date(focusDate.getFullYear(), focusDate.getMonth(), 1),
    );
    didAutoSelect.current = true;
  }, [focusKey]); // eslint-disable-line react-hooks/exhaustive-deps -- focusKey encodes focusDate

  useEffect(() => {
    if (didAutoSelect.current || loadingMeetings) return;

    // Explicit day from office mini-calendar — do not jump away.
    if (focusDate) {
      didAutoSelect.current = true;
      return;
    }

    if (!meetings.length) return;

    const onSelected = meetings.some(
      (m) => m.date === formatDate(selectedDate),
    );
    if (onSelected) {
      didAutoSelect.current = true;
      return;
    }
    const nextKey = findNextMeetingDate(meetings, new Date(), {
      allowPast: true,
    });
    const nextDate = parseLocalYmd(nextKey);
    if (nextDate) {
      setSelectedDate(nextDate);
      setCurrentDate(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
    }
    didAutoSelect.current = true;
  }, [meetings, loadingMeetings, selectedDate, focusDate]);

  const handleMeetingScheduled = (meeting) => {
    if (meeting) setMeetings((prev) => [...prev, meeting]);
    loadMeetings();
    setAgendaReloadToken((n) => n + 1);
    onMeetingScheduledProp?.(meeting);
  };

  const navigateMonth = (dir) => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + (dir === "prev" ? -1 : 1));
      return d;
    });
  };

  const getEventsForDate = (date) =>
    meetings.filter((m) => m.date === formatDate(date));

  const selectedEvents = getEventsForDate(selectedDate);
  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const { total, firstDay } = getDaysInMonth(currentDate);
  const meetingDates = new Set(meetings.map((m) => m.date));

  const seriesCount = useMemo(
    () => countUniqueMeetingSeries(meetings),
    [meetings],
  );

  const nextMeetingAfterSelected = useMemo(() => {
    if (selectedEvents.length > 0) return null;
    return findNextMeetingDate(meetings, selectedDate);
  }, [meetings, selectedDate, selectedEvents.length]);

  const openMeetingDetail = (meeting) => {
    if (!meeting) return;
    setDetailMeeting(meeting);
  };

  const handleDayClick = (cellDate) => {
    setSelectedDate(cellDate);
    const dayMeetings = getEventsForDate(cellDate);
    if (dayMeetings.length === 1) {
      openMeetingDetail(dayMeetings[0]);
    }
  };

  const jumpToDateKey = (ymd) => {
    const d = parseLocalYmd(ymd);
    if (!d) return;
    setSelectedDate(d);
    setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  const handleAgendaItemClick = (item) => {
    if (!item) return;
    const type = String(item.type || "");
    if (
      type === "meeting" ||
      type === "company-event" ||
      item.subtype === "video-call"
    ) {
      const mapped = meetingFromAgendaItem(item);
      if (mapped?.id) {
        const fromList = meetings.find(
          (m) => String(m.id) === String(mapped.id),
        );
        openMeetingDetail(fromList || mapped);
        return;
      }
    }
    if (item.date) {
      const d = parseLocalYmd(item.date) || new Date(`${item.date}T12:00:00`);
      if (!Number.isNaN(d.getTime())) setSelectedDate(d);
    }
  };

  const hoverMeetings = hoverDay != null ? getEventsForDate(hoverDay) : [];

  const cells = [];
  for (let i = 0; i < firstDay; i += 1) cells.push(null);
  for (let day = 1; day <= total; day += 1) {
    cells.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
  }

  return (
    <>
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        className="fixed right-0 top-0 z-[70] flex h-screen w-[min(50vw,720px)] min-w-[560px] flex-col border-l border-surface-border bg-surface-card shadow-[-8px_0_40px_rgba(15,23,42,0.08)]"
      >
        <header className="flex shrink-0 items-center gap-3 border-b border-surface-border px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-tint">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-base font-bold text-text-heading">
              Calendar &amp; Schedule
            </p>
            <p className="mt-0.5 text-xs text-text-muted">
              {seriesCount} scheduled series
              {meetings.length !== seriesCount
                ? ` · ${meetings.length} occurrences`
                : ""}
            </p>
          </div>
          {isFounder ? (
            <button
              type="button"
              onClick={() => setShowScheduler(true)}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" />
              Schedule Meeting
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-surface-border bg-surface-page text-text-muted transition-colors hover:bg-surface-card hover:text-text-heading"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="flex min-h-0 w-[55%] flex-col border-r border-surface-border">
            <div className="shrink-0 px-5 pb-3 pt-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-heading text-[15px] font-semibold text-text-heading">
                  {monthName}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => navigateMonth("prev")}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-text-body transition-colors hover:bg-surface-page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const t = new Date();
                      setCurrentDate(new Date(t.getFullYear(), t.getMonth(), 1));
                      setSelectedDate(t);
                    }}
                    className="h-8 rounded-lg px-2.5 text-xs font-semibold text-primary transition-colors hover:bg-primary-tint"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateMonth("next")}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-text-body transition-colors hover:bg-surface-page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mb-1 grid grid-cols-7 gap-1 text-center">
                {DAY_HEADERS.map((d) => (
                  <span
                    key={d}
                    className="py-1 text-[11px] font-semibold text-text-muted"
                  >
                    {d}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {cells.map((cellDate, index) => {
                  if (!cellDate) {
                    return <div key={`empty-${index}`} className="h-10" />;
                  }
                  const key = formatDate(cellDate);
                  const hasMeeting = meetingDates.has(key);
                  const selected = isSameDay(cellDate, selectedDate);
                  const currentDay = isToday(cellDate);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleDayClick(cellDate)}
                      onMouseEnter={(e) => {
                        if (!hasMeeting) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoverDay(cellDate);
                        setHoverPos({
                          x: rect.left + rect.width / 2,
                          y: rect.bottom + 8,
                        });
                      }}
                      onMouseLeave={() => setHoverDay(null)}
                      className={cn(
                        "relative mx-auto flex h-10 w-10 flex-col items-center justify-center rounded-full text-sm transition-colors",
                        currentDay &&
                          !selected &&
                          "bg-primary font-semibold text-white",
                        currentDay && selected && "bg-primary font-semibold text-white ring-2 ring-amber-300 ring-offset-1",
                        !currentDay &&
                          selected &&
                          hasMeeting &&
                          "font-semibold",
                        !currentDay &&
                          selected &&
                          !hasMeeting &&
                          "bg-surface-page font-semibold text-text-heading",
                        !currentDay &&
                          !selected &&
                          hasMeeting &&
                          "font-semibold hover:opacity-90",
                        !currentDay &&
                          !selected &&
                          !hasMeeting &&
                          "text-text-heading hover:bg-surface-page",
                      )}
                      style={
                        !currentDay && hasMeeting
                          ? {
                              backgroundColor: selected
                                ? YELLOW_DAY_SELECTED
                                : YELLOW_DAY,
                              color: YELLOW_TEXT,
                            }
                          : undefined
                      }
                    >
                      {cellDate.getDate()}
                      {hasMeeting && !currentDay ? (
                        <span
                          className="absolute bottom-1 h-1 w-1 rounded-full"
                          style={{ backgroundColor: "#f59e0b" }}
                        />
                      ) : null}
                      {hasMeeting && currentDay ? (
                        <span className="absolute bottom-1 h-1 w-1 rounded-full bg-white/85" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
              <div className="mb-2.5 flex items-center gap-2 border-b border-surface-border pb-2.5">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    backgroundColor:
                      selectedEvents.length > 0 ? "#f59e0b" : "#d1d5db",
                  }}
                />
                <span className="text-xs font-semibold text-text-heading">
                  {selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                {selectedEvents.length > 0 ? (
                  <span
                    className="ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    style={{
                      color: YELLOW_TEXT,
                      backgroundColor: YELLOW_DAY,
                    }}
                  >
                    {selectedEvents.length} event
                    {selectedEvents.length !== 1 ? "s" : ""}
                  </span>
                ) : null}
              </div>

              <AnimatePresence mode="wait">
                {loadingMeetings ? (
                  <div key="loading" className="flex justify-center py-8">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : selectedEvents.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-2 py-8 text-center text-text-muted"
                  >
                    <CalendarDays className="mx-auto mb-2 h-7 w-7 opacity-40" />
                    <p className="text-[13px] font-medium text-text-heading">
                      Nothing on this day
                    </p>
                    <p className="mt-1 text-[11px]">
                      No meetings scheduled for this date
                    </p>
                    {nextMeetingAfterSelected ? (
                      <button
                        type="button"
                        onClick={() => jumpToDateKey(nextMeetingAfterSelected)}
                        className="mt-3 inline-flex items-center rounded-lg border border-surface-border bg-surface-page px-3 py-1.5 text-[12px] font-semibold text-primary transition-colors hover:bg-primary-tint"
                      >
                        Next meeting:{" "}
                        {parseLocalYmd(
                          nextMeetingAfterSelected,
                        )?.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </button>
                    ) : null}
                  </motion.div>
                ) : (
                  <motion.div
                    key={formatDate(selectedDate)}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col gap-2"
                  >
                    {selectedEvents.map((evt) => {
                      const chip = getTypeChip(evt.type);
                      const ChipIcon = chip.Icon;
                      return (
                        <button
                          key={evt.id}
                          type="button"
                          onClick={() => openMeetingDetail(evt)}
                          className="w-full rounded-xl border border-surface-border bg-surface-page p-3 text-left transition-colors hover:border-primary/25 hover:bg-primary-tint/30"
                        >
                          <div className="flex items-start gap-2.5">
                            <div
                              className={cn(
                                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                                chip.bg,
                              )}
                            >
                              <ChipIcon
                                className={cn("h-4 w-4", chip.color)}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex flex-wrap items-center gap-1.5">
                                <p className="text-[13px] font-semibold text-text-heading">
                                  {evt.title}
                                </p>
                                <span
                                  className={cn(
                                    "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                    chip.bg,
                                    chip.color,
                                  )}
                                >
                                  {chip.label}
                                </span>
                                {evt.isRecurring ? (
                                  <span className="rounded-full bg-surface-card px-2 py-0.5 text-[10px] font-semibold text-text-muted">
                                    Recurring
                                  </span>
                                ) : null}
                              </div>
                              {evt.description ? (
                                <p className="mb-1.5 line-clamp-2 text-[11px] text-text-muted">
                                  {evt.description}
                                </p>
                              ) : null}
                              <div className="flex flex-wrap gap-2 text-[11px] text-text-body">
                                {evt.startTime ? (
                                  <span className="inline-flex items-center gap-1">
                                    <Clock className="h-2.5 w-2.5 text-text-muted" />
                                    {evt.startTime}
                                    {evt.endTime ? ` – ${evt.endTime}` : ""}
                                  </span>
                                ) : null}
                                {evt.location ? (
                                  <span className="inline-flex items-center gap-1">
                                    <MapPin className="h-2.5 w-2.5 text-text-muted" />
                                    {evt.location}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex min-h-0 w-[45%] flex-col bg-surface-page">
            <div className="flex shrink-0 items-center gap-2 border-b border-surface-border px-4 py-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-card">
                <CalendarDays className="h-3.5 w-3.5 text-text-body" />
              </div>
              <span className="font-heading text-sm font-semibold text-text-heading">
                Agenda
              </span>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <AgendaPanel
                user={normalizedUser}
                compact={false}
                reloadToken={agendaReloadToken}
                onItemClick={handleAgendaItemClick}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {hoverMeetings.length > 0 && hoverDay ? (
        <div
          className="pointer-events-none fixed z-[90] min-w-[200px] max-w-[260px] rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 shadow-lg"
          style={{
            left: hoverPos.x,
            top: hoverPos.y,
            transform: "translateX(-50%)",
          }}
        >
          <p
            className="mb-1.5 text-[11px] font-bold"
            style={{ color: YELLOW_TEXT }}
          >
            {hoverDay.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </p>
          {hoverMeetings.slice(0, 3).map((m) => (
            <div key={m.id} className="mb-1.5 last:mb-0">
              <p className="text-xs font-semibold leading-snug text-text-heading">
                {m.title}
              </p>
              <p className="text-[11px] text-text-muted">
                {m.startTime || "--:--"}
                {m.endTime ? ` – ${m.endTime}` : ""}
                {" · "}
                {m.type === "video-call" ? "Video" : "In-person"}
              </p>
            </div>
          ))}
          {hoverMeetings.length > 3 ? (
            <p
              className="text-[11px] font-semibold"
              style={{ color: YELLOW_TEXT }}
            >
              +{hoverMeetings.length - 3} more
            </p>
          ) : null}
        </div>
      ) : null}

      <MeetingScheduler
        open={showScheduler}
        onClose={() => setShowScheduler(false)}
        user={user}
        teamMembers={teamMembers}
        onMeetingScheduled={handleMeetingScheduled}
        defaultDate={selectedDate}
      />

      <MeetingDetailModal
        open={Boolean(detailMeeting)}
        meeting={detailMeeting}
        currentUserId={normalizedUser?.id}
        teamMembers={teamMembers}
        onClose={() => setDetailMeeting(null)}
        onDeleted={() => {
          setDetailMeeting(null);
          loadMeetings();
          setAgendaReloadToken((n) => n + 1);
          onMeetingScheduledProp?.();
        }}
      />
    </>
  );
}
