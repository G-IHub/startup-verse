import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  Video,
  Users,
  CheckSquare,
  CalendarDays,
  Clock,
  MapPin,
  ArrowRight,
} from "lucide-react";
import MeetingScheduler from "../calendar/MeetingScheduler";
import AgendaPanel from "../calendar/AgendaPanel";
import * as meetingApi from "../../utils/api/meetingApi";
import * as teamMemberApi from "../../utils/api/teamMemberApi";
import { getStartupId } from "../../utils/startupId";

const TODAY = new Date();

function isToday(date) {
  return (
    date.getDate() === TODAY.getDate() &&
    date.getMonth() === TODAY.getMonth() &&
    date.getFullYear() === TODAY.getFullYear()
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

function getTypeChip(type) {
  if (type === "video-call") return { label: "Video Call", bg: "#dbeafe", color: "#1d4ed8", Icon: Video };
  return { label: "Meeting", bg: "#ede9fe", color: "#7c3aed", Icon: Users };
}

const DAY_HEADERS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function CalendarHubPanel({ user, onClose, startupId: propStartupId }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [meetings, setMeetings] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [showScheduler, setShowScheduler] = useState(false);
  const [loadingMeetings, setLoadingMeetings] = useState(false);

  const resolvedStartupId = propStartupId || getStartupId(user || {});
  const normalizedUser = user
    ? { ...user, id: user.id || String(user._id || "") }
    : null;

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

  useEffect(() => { loadMeetings(); }, [loadMeetings]);

  useEffect(() => {
    if (!resolvedStartupId) return;
    teamMemberApi.getStartupTeamMembers(resolvedStartupId)
      .then((list) => {
        const members = Array.isArray(list) ? list : (list?.members || []);
        setTeamMembers(members.filter((m) => String(m.id) !== String(normalizedUser?.id)));
      })
      .catch(() => setTeamMembers([]));
  }, [resolvedStartupId, normalizedUser?.id]);

  const handleMeetingScheduled = (meeting) => {
    if (meeting) setMeetings((prev) => [...prev, meeting]);
    loadMeetings();
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
  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const { total, firstDay } = getDaysInMonth(currentDate);
  const meetingDates = new Set(meetings.map((m) => m.date));

  return (
    <>
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: "50vw",
          minWidth: 580,
          zIndex: 70,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#ffffff",
          boxShadow: "-4px 0 32px rgba(0,0,0,0.10)",
          borderLeft: "1px solid #e5e7eb",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            flexShrink: 0,
            padding: "14px 20px",
            borderBottom: "1px solid #f1f5f9",
            background: "linear-gradient(135deg, #f8f7ff 0%, #fff 100%)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 4px 12px rgba(79,70,229,0.3)",
            }}
          >
            <Calendar style={{ width: 20, height: 20, color: "#fff" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>
              Calendar &amp; Schedule
            </p>
            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
              {meetings.length} meeting{meetings.length !== 1 ? "s" : ""} scheduled
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowScheduler(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              height: 36,
              padding: "0 16px",
              borderRadius: 9,
              fontSize: 13,
              fontWeight: 600,
              background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(79,70,229,0.35)",
              flexShrink: 0,
            }}
          >
            <Plus style={{ width: 14, height: 14 }} />
            Schedule Meeting
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              backgroundColor: "#f9fafb",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: "#6b7280",
            }}
          >
            <X style={{ width: 15, height: 15 }} />
          </button>
        </div>

        {/* ── Body: two columns ── */}
        <div style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden" }}>

          {/* ── Left column: calendar + day events ── */}
          <div
            style={{
              flex: "0 0 55%",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              borderRight: "1px solid #f1f5f9",
            }}
          >
            {/* Calendar grid (fixed, not scrollable) */}
            <div style={{ flexShrink: 0, padding: "20px 20px 12px" }}>
              {/* Month nav */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CalendarDays style={{ width: 16, height: 16, color: "#4f46e5" }} />
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{monthName}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <button
                    type="button"
                    onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()); }}
                    style={{
                      height: 28, padding: "0 10px", borderRadius: 7, fontSize: 12, fontWeight: 500,
                      border: "1px solid #e5e7eb", backgroundColor: "#f9fafb", cursor: "pointer", color: "#374151",
                    }}
                  >
                    Today
                  </button>
                  {[["prev", ChevronLeft], ["next", ChevronRight]].map(([dir, Icon]) => (
                    <button
                      key={dir}
                      type="button"
                      onClick={() => navigateMonth(dir)}
                      style={{
                        width: 28, height: 28, borderRadius: 7,
                        border: "1px solid #e5e7eb", backgroundColor: "#f9fafb",
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <Icon style={{ width: 13, height: 13, color: "#374151" }} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Day headers */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 6 }}>
                {DAY_HEADERS.map((d) => (
                  <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "#9ca3af", paddingBottom: 6 }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: total }).map((_, idx) => {
                  const day = idx + 1;
                  const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                  const isCurrentDay = isToday(cellDate);
                  const isSelected = isSameDay(cellDate, selectedDate);
                  const hasMeeting = meetingDates.has(formatDate(cellDate));
                  const meetingCount = meetings.filter((m) => m.date === formatDate(cellDate)).length;

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelectedDate(cellDate)}
                      style={{
                        height: 42,
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: isCurrentDay ? 700 : isSelected ? 600 : 400,
                        position: "relative",
                        border: "none",
                        backgroundColor: isCurrentDay
                          ? "#4f46e5"
                          : isSelected
                            ? "#eef2ff"
                            : "transparent",
                        color: isCurrentDay ? "#fff" : isSelected ? "#4f46e5" : "#374151",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 2,
                        outline: isSelected && !isCurrentDay ? "2px solid #c7d2fe" : "none",
                        transition: "background 0.12s",
                      }}
                    >
                      {day}
                      {hasMeeting && (
                        <div style={{ display: "flex", gap: 2 }}>
                          {Array.from({ length: Math.min(meetingCount, 3) }).map((_, di) => (
                            <span
                              key={di}
                              style={{
                                width: 4,
                                height: 4,
                                borderRadius: "50%",
                                backgroundColor: isCurrentDay ? "rgba(255,255,255,0.7)" : "#7c3aed",
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected day events — scrollable */}
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "0 20px 20px" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                paddingBottom: 10, marginBottom: 10,
                borderBottom: "1px solid #f1f5f9",
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%",
                  backgroundColor: selectedEvents.length > 0 ? "#4f46e5" : "#d1d5db",
                }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                  {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </span>
                {selectedEvents.length > 0 && (
                  <span style={{
                    marginLeft: "auto", fontSize: 11, fontWeight: 600,
                    color: "#4f46e5", backgroundColor: "#eef2ff",
                    padding: "1px 8px", borderRadius: 20,
                  }}>
                    {selectedEvents.length} event{selectedEvents.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              <AnimatePresence mode="wait">
                {loadingMeetings ? (
                  <div key="loading" style={{ padding: "20px 0", textAlign: "center" }}>
                    <div style={{
                      width: 20, height: 20, margin: "0 auto",
                      border: "2px solid #4f46e5", borderTopColor: "transparent",
                      borderRadius: "50%", animation: "spin 0.7s linear infinite",
                    }} />
                  </div>
                ) : selectedEvents.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ textAlign: "center", padding: "28px 0", color: "#9ca3af" }}
                  >
                    <CalendarDays style={{ width: 28, height: 28, margin: "0 auto 8px", opacity: 0.4 }} />
                    <p style={{ fontSize: 13, fontWeight: 500 }}>No events</p>
                    <p style={{ fontSize: 11, marginTop: 4 }}>Nothing scheduled for this day</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key={formatDate(selectedDate)}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    {selectedEvents.map((evt) => {
                      const chip = getTypeChip(evt.type);
                      const ChipIcon = chip.Icon;
                      return (
                        <div
                          key={evt.id}
                          style={{
                            borderRadius: 12,
                            border: "1px solid #e9eef6",
                            backgroundColor: "#fafbff",
                            overflow: "hidden",
                          }}
                        >
                          {/* Color bar */}
                          <div style={{ height: 3, backgroundColor: chip.color, width: "100%" }} />
                          <div style={{ padding: "12px 14px" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                              <div style={{
                                width: 34, height: 34, borderRadius: 9,
                                backgroundColor: chip.bg,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexShrink: 0,
                              }}>
                                <ChipIcon style={{ width: 16, height: 16, color: chip.color }} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                  <p style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{evt.title}</p>
                                  <span style={{
                                    fontSize: 10, fontWeight: 600, padding: "1px 7px",
                                    borderRadius: 20, backgroundColor: chip.bg, color: chip.color, flexShrink: 0,
                                  }}>
                                    {chip.label}
                                  </span>
                                </div>
                                {evt.description && (
                                  <p style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>{evt.description}</p>
                                )}
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                  {evt.startTime && (
                                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#6b7280" }}>
                                      <Clock style={{ width: 11, height: 11, color: "#4f46e5" }} />
                                      {evt.startTime}{evt.endTime ? ` – ${evt.endTime}` : ""}
                                    </span>
                                  )}
                                  {evt.location && (
                                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#6b7280" }}>
                                      <MapPin style={{ width: 11, height: 11, color: "#4f46e5" }} />
                                      {evt.location}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Right column: full-height Agenda ── */}
          <div
            style={{
              flex: "0 0 45%",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              backgroundColor: "#fafbff",
            }}
          >
            {/* Agenda header */}
            <div style={{
              flexShrink: 0,
              padding: "20px 18px 12px",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <CalendarDays style={{ width: 14, height: 14, color: "#fff" }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Agenda</span>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
                <ArrowRight style={{ width: 12, height: 12, color: "#9ca3af" }} />
                <span style={{ fontSize: 11, color: "#9ca3af" }}>Upcoming</span>
              </div>
            </div>

            {/* AgendaPanel fills the rest */}
            <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
              <AgendaPanel user={normalizedUser} compact={false} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Meeting Scheduler modal */}
      <MeetingScheduler
        open={showScheduler}
        onClose={() => setShowScheduler(false)}
        user={user}
        teamMembers={teamMembers}
        onMeetingScheduled={handleMeetingScheduled}
      />
    </>
  );
}
