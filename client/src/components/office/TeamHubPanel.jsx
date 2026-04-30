import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { ScrollArea } from "../ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Checkbox } from "../ui/checkbox";
import { toast } from "sonner";
import {
  getStartupAnnouncements,
  postStartupAnnouncement,
} from "../../utils/announcementApi";
import * as pollApi from "../../utils/pollApi";
import { getStartupWins, postWin } from "../../utils/activityApi";
import {
  subscribeToAnnouncements,
  subscribeToWins,
  subscribeToPolls,
} from "../../utils/realtimeSubscriptions";
import {
  X,
  Plus,
  Megaphone,
  BarChart3,
  Clock,
  CheckCircle2,
  Users,
  Send,
  Sparkles,
  EyeOff,
  Lock,
  Loader2,
  AlertCircle,
  Trophy,
} from "lucide-react";
export function TeamHubPanel({
  onClose,
  currentUserId,
  currentUserName,
  startupId,
  onActivity,
  organizationAnnouncements = [],
  embedded = false,
  strictMode = false,
  announcementsData,
  winsData,
  onCreateAnnouncement,
  onCreateWin,
  user,
}) {
  const isFounder = user?.role === "founder";
  const resolvedUserId = String(currentUserId || user?._id || user?.id || "");

  const [filter, setFilter] = useState("all");
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);

  // ── Polls state (backend-backed) ──────────────────────────────────────────
  const [polls, setPolls] = useState([]);
  const [pollsLoading, setPollsLoading] = useState(false);
  const [pollsError, setPollsError] = useState("");

  // ── Announcements state ───────────────────────────────────────────────────
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [announcementsError, setAnnouncementsError] = useState("");

  // ── Wins state ────────────────────────────────────────────────────────────
  const [wins, setWins] = useState([]);
  const [winsLoading, setWinsLoading] = useState(false);
  const [winsError, setWinsError] = useState("");

  // ── Fetch polls from backend ──────────────────────────────────────────────
  useEffect(() => {
    if (!startupId) { setPolls([]); return; }
    let stopped = false;
    setPollsLoading(true);
    setPollsError("");
    pollApi.getStartupPolls(startupId)
      .then((result) => {
        if (stopped) return;
        if (result?.success) setPolls(result.polls || []);
        else setPollsError("Could not load polls.");
      })
      .catch(() => { if (!stopped) setPollsError("Could not load polls."); })
      .finally(() => { if (!stopped) setPollsLoading(false); });
    const unsub = subscribeToPolls(startupId, ({ action, poll }) => {
      if (!poll?.id) return;
      setPolls((prev) => {
        const byId = new Map(prev.map((p) => [p.id, p]));
        byId.set(poll.id, poll);
        return Array.from(byId.values()).sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
        );
      });
    });
    return () => { stopped = true; unsub?.(); };
  }, [startupId]);

  // ── Fetch announcements ───────────────────────────────────────────────────
  useEffect(() => {
    if (!startupId) { setAnnouncements([]); setAnnouncementsLoading(false); return; }
    let stopped = false;
    setAnnouncementsLoading(true);
    setAnnouncementsError("");
    if (announcementsData) {
      setAnnouncements(announcementsData);
      setAnnouncementsLoading(false);
      return () => {};
    }
    getStartupAnnouncements(startupId)
      .then((result) => {
        if (stopped) return;
        if (result?.success) setAnnouncements(result.announcements || []);
        else setAnnouncementsError("Could not load announcements.");
      })
      .catch(() => { if (!stopped) setAnnouncementsError("Could not load announcements."); })
      .finally(() => { if (!stopped) setAnnouncementsLoading(false); });
    const unsub = subscribeToAnnouncements(startupId, (update) => {
      const incoming = update?.announcement;
      if (!incoming?.id) return;
      setAnnouncements((prev) => {
        const byId = new Map(prev.map((r) => [String(r.id), r]));
        byId.set(String(incoming.id), { ...incoming, emoji: incoming.emoji || byId.get(String(incoming.id))?.emoji || "" });
        return Array.from(byId.values()).sort((a, b) => new Date(b.createdAt || b.timestamp || 0) - new Date(a.createdAt || a.timestamp || 0));
      });
    });
    return () => { stopped = true; unsub?.(); };
  }, [startupId, announcementsData]);

  // ── Fetch wins ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!startupId) { setWins([]); setWinsLoading(false); return; }
    let stopped = false;
    setWinsLoading(true);
    setWinsError("");
    if (winsData) { setWins(winsData); setWinsLoading(false); return () => {}; }
    getStartupWins(startupId, { limit: 100 })
      .then((result) => {
        if (stopped) return;
        if (result?.success) setWins(result.wins || []);
        else setWinsError("Could not load wins.");
      })
      .catch(() => { if (!stopped) setWinsError("Could not load wins."); })
      .finally(() => { if (!stopped) setWinsLoading(false); });
    const unsub = subscribeToWins(startupId, (update) => {
      const incoming = update?.win;
      if (!incoming?.id) return;
      setWins((prev) => {
        const byId = new Map(prev.map((r) => [String(r.id), r]));
        byId.set(String(incoming.id), incoming);
        return Array.from(byId.values()).sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
      });
    });
    return () => { stopped = true; unsub?.(); };
  }, [startupId, winsData]);

  // ── Form state ────────────────────────────────────────────────────────────
  const [pollSubmitting, setPollSubmitting] = useState(false);
  const [announcementSubmitting, setAnnouncementSubmitting] = useState(false);
  const [newPoll, setNewPoll] = useState({ question: "", description: "", options: ["", ""], allowMultiple: false, anonymous: false, endsInDays: 7 });
  const [newAnnouncement, setNewAnnouncement] = useState({ message: "", emoji: "📢", priority: "normal", category: "general" });

  // ── Create poll (backend) ─────────────────────────────────────────────────
  const createPoll = useCallback(async () => {
    if (!newPoll.question.trim()) { toast.error("Please enter a poll question"); return; }
    const validOptions = newPoll.options.filter((o) => o.trim());
    if (validOptions.length < 2) { toast.error("Please add at least 2 options"); return; }
    if (!startupId) { toast.error("Startup context missing."); return; }
    setPollSubmitting(true);
    try {
      const result = await pollApi.createPoll(startupId, {
        question: newPoll.question.trim(),
        description: newPoll.description.trim(),
        options: validOptions,
        allowMultiple: newPoll.allowMultiple,
        anonymous: newPoll.anonymous,
        endsInDays: newPoll.endsInDays,
      });
      if (!result?.success || !result?.poll) throw new Error("Failed to create poll.");
      setPolls((prev) => [result.poll, ...prev.filter((p) => p.id !== result.poll.id)]);
      setShowCreatePoll(false);
      setNewPoll({ question: "", description: "", options: ["", ""], allowMultiple: false, anonymous: false, endsInDays: 7 });
      onActivity?.("poll-create", `created a poll: "${newPoll.question}"`, "🗳️");
      toast.success("🗳️ Poll created!");
    } catch (err) {
      toast.error(err?.message || "Could not create poll.");
    } finally {
      setPollSubmitting(false);
    }
  }, [newPoll, startupId, onActivity]);

  // ── Vote on poll (optimistic + rollback) ─────────────────────────────────
  const votePoll = useCallback(async (pollId, optionId) => {
    const original = polls.find((p) => p.id === pollId);
    if (!original || !startupId) return;

    const applyVote = (p) => {
      if (p.id !== pollId) return p;
      let opts = p.options.map((o) => ({ ...o, votes: [...o.votes] }));
      if (!p.allowMultiple) opts = opts.map((o) => ({ ...o, votes: o.votes.filter((v) => v !== resolvedUserId) }));
      opts = opts.map((o) => {
        if (o.id !== optionId) return o;
        return o.votes.includes(resolvedUserId)
          ? (p.allowMultiple ? { ...o, votes: o.votes.filter((v) => v !== resolvedUserId) } : o)
          : { ...o, votes: [...o.votes, resolvedUserId] };
      });
      const total = opts.reduce((s, o) => s + o.votes.length, 0);
      return { ...p, options: opts.map((o) => ({ ...o, percentage: total > 0 ? Math.round(o.votes.length / total * 100) : 0 })), totalVotes: total };
    };

    setPolls((prev) => prev.map(applyVote));
    try {
      const result = await pollApi.votePoll(startupId, pollId, optionId);
      if (result?.poll) setPolls((prev) => prev.map((p) => p.id === pollId ? result.poll : p));
      onActivity?.("poll-vote", `voted in a poll`, "✅");
      toast.success("Vote recorded!");
    } catch (err) {
      setPolls((prev) => prev.map((p) => p.id === pollId ? original : p));
      toast.error(err?.message || "Could not record vote.");
    }
  }, [polls, startupId, resolvedUserId, onActivity]);

  // ── Close poll ────────────────────────────────────────────────────────────
  const closePoll = useCallback(async (pollId) => {
    if (!startupId) return;
    setPolls((prev) => prev.map((p) => p.id === pollId ? { ...p, status: "closed" } : p));
    try {
      const result = await pollApi.closePoll(startupId, pollId);
      if (result?.poll) setPolls((prev) => prev.map((p) => p.id === pollId ? result.poll : p));
      toast.success("Poll closed.");
    } catch (err) {
      toast.error(err?.message || "Could not close poll.");
      setPolls((prev) => prev.map((p) => p.id === pollId ? { ...p, status: "active" } : p));
    }
  }, [startupId]);

  // ── Create announcement ───────────────────────────────────────────────────
  const createAnnouncement = useCallback(async () => {
    if (!newAnnouncement.message.trim()) { toast.error("Please enter an announcement message"); return; }
    if (!startupId) { toast.error("Startup context missing."); return; }
    setAnnouncementSubmitting(true);
    try {
      if (newAnnouncement.category === "wall-of-wins") {
        const result = onCreateWin
          ? await onCreateWin({ message: newAnnouncement.message }).then((win) => ({ success: true, win }))
          : await postWin({ startupId, userId: resolvedUserId, message: newAnnouncement.message });
        if (!result?.success || !result?.win) throw new Error("Win publish failed.");
        setWins((prev) => [result.win, ...prev]);
      } else {
        const result = onCreateAnnouncement
          ? await onCreateAnnouncement({ title: "Announcement", message: newAnnouncement.message, priority: newAnnouncement.priority, category: newAnnouncement.category, emoji: newAnnouncement.emoji, userId: resolvedUserId }).then((a) => ({ success: true, announcement: a }))
          : await postStartupAnnouncement(startupId, { title: "Announcement", message: newAnnouncement.message, priority: newAnnouncement.priority, category: newAnnouncement.category, emoji: newAnnouncement.emoji, userId: resolvedUserId });
        if (!result?.success || !result?.announcement) throw new Error("Announcement publish failed.");
        setAnnouncements((prev) => [{ ...result.announcement, emoji: result.announcement?.emoji || newAnnouncement.emoji }, ...prev]);
      }
      setAnnouncementsError(""); setWinsError("");
      setShowCreateAnnouncement(false);
      setNewAnnouncement({ message: "", emoji: "📢", priority: "normal", category: "general" });
      onActivity?.(
        newAnnouncement.category === "wall-of-wins" ? "win" : "announcement-create",
        newAnnouncement.category === "wall-of-wins" ? "shared a team win" : "created an announcement",
        newAnnouncement.category === "wall-of-wins" ? "🏆" : newAnnouncement.emoji,
      );
      toast.success(newAnnouncement.category === "wall-of-wins" ? "🏆 Win shared!" : "📢 Announcement sent!");
    } catch (err) {
      if (newAnnouncement.category === "wall-of-wins") { setWinsError(err?.message || "Unable to publish win."); toast.error("Unable to publish win."); }
      else { setAnnouncementsError(err?.message || "Unable to publish announcement."); toast.error("Unable to publish announcement."); }
    } finally {
      setAnnouncementSubmitting(false);
    }
  }, [newAnnouncement, startupId, resolvedUserId, onCreateWin, onCreateAnnouncement, onActivity]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const hasUserVoted = (poll) => poll.options.some((o) => o.votes.includes(resolvedUserId));
  const getUserVotes = (poll) => poll.options.filter((o) => o.votes.includes(resolvedUserId)).map((o) => o.id);

  const formatTimeAgo = (date) => {
    if (!date) return "";
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return "";
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
    return d.toLocaleDateString();
  };
  const formatTimeRemaining = (date) => {
    if (!date) return "";
    const d = date instanceof Date ? date : new Date(date);
    const s = Math.floor((d.getTime() - Date.now()) / 1000);
    if (s < 0) return "Ended";
    if (s < 3600) return `${Math.floor(s / 60)}m left`;
    if (s < 86400) return `${Math.floor(s / 3600)}h left`;
    return `${Math.floor(s / 86400)}d left`;
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  const activePolls = polls.filter((p) => p.status === "active");
  const unvotedPolls = activePolls.filter((p) => !hasUserVoted(p));

  const convertedOrgAnnouncements = organizationAnnouncements.map((o) => ({
    id: o.id, message: o.content,
    sender: `${o.createdByName} (${o.cohortName || "Organization"})`,
    timestamp: new Date(o.createdAt),
    emoji: o.priority === "urgent" ? "🚨" : o.priority === "high" ? "⚠️" : "📢",
    priority: o.priority, category: "general",
  }));

  const localAnnouncements = announcements.map((ann) => {
    const rawTs = ann.timestamp ?? ann.createdAt;
    const ts = rawTs instanceof Date ? rawTs : new Date(rawTs || Date.now());
    const safeTs = Number.isNaN(ts.getTime()) ? new Date() : ts;
    const pEmoji = ann.priority === "urgent" ? "🚨" : ann.priority === "high" ? "⚠️" : "📢";
    return { ...ann, sender: ann.sender || ann.createdByName || currentUserName, timestamp: safeTs, emoji: typeof ann.emoji === "string" && ann.emoji.trim() ? ann.emoji : pEmoji };
  });

  const winAnnouncements = wins.map((w) => ({
    id: w.id, message: w.message, sender: w.userName || currentUserName,
    timestamp: w.timestamp ? new Date(w.timestamp) : new Date(),
    emoji: "🏆", priority: "normal", category: "wall-of-wins",
  }));

  const allAnnouncements = [...winAnnouncements, ...localAnnouncements, ...convertedOrgAnnouncements];

  const filteredItems = () => {
    if (filter === "polls") return polls;
    if (filter === "announcements") return allAnnouncements;
    return [...polls, ...allAnnouncements].sort((a, b) => {
      const da = a.createdAt ?? a.timestamp; const db = b.createdAt ?? b.timestamp;
      return new Date(db || 0) - new Date(da || 0);
    });
  };

  const emojiOptions = ["📢", "🎉", "💼", "🚀", "⚡", "🎯", "💡", "🏆", "🔥", "✨"];
  const createDialogClassName = embedded
    ? "max-w-sm z-[80] office-dialog-panel"
    : "max-w-sm z-[80] fixed right-[500px] top-1/2 -translate-y-1/2 office-dialog-panel";

  const isLoading = pollsLoading || announcementsLoading || winsLoading;
  const items = filteredItems();

  return (
    <motion.div
      initial={embedded ? { opacity: 0, y: 16 } : { x: "100%" }}
      animate={embedded ? { opacity: 1, y: 0 } : { x: 0 }}
      exit={embedded ? { opacity: 0, y: 16 } : { x: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 260 }}
      className={
        embedded
          ? "h-[72vh] w-full office-panel office-panel-shell office-motion-soft flex flex-col"
          : "fixed top-0 right-0 h-screen office-panel office-panel-shell office-motion-soft z-[70] flex flex-col rounded-none md:rounded-l-xl"
      }
      style={embedded ? {} : { width: "50vw", minWidth: 480, maxWidth: 760 }}
    >
      {/* ── Header ── */}
      <div className="flex-shrink-0 bg-white" style={{ borderBottom: "1px solid #e9eef6", position: "relative" }}>

        {/* Close button — pinned to top-right corner */}
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center transition-colors duration-150 hover:bg-gray-300"
          style={{
            position: "absolute",
            top: 10,
            right: 12,
            width: 28,
            height: 28,
            borderRadius: 7,
            color: "#9ca3af",
            border: "none",
            backgroundColor: "transparent",
            cursor: "pointer",
            zIndex: 1,
          }}
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Row 1 — Title + Action buttons */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3" style={{ gap: "12px", paddingRight: 48 }}>

          {/* Left: icon + title block */}
          <div className="flex items-center flex-shrink-0" style={{ gap: "10px" }}>
            <div
              className="flex-shrink-0 flex items-center justify-center"
              style={{
                width: 36, height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, #8b5cf6, #4f46e5)",
                boxShadow: "0 2px 6px rgba(79,70,229,0.35)",
              }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2
                className="text-gray-900 font-bold m-0 leading-none"
                style={{ fontSize: 15, letterSpacing: "-0.2px" }}
              >
                Updates
              </h2>
              <p
                className="text-gray-400 m-0 leading-none font-normal"
                style={{ fontSize: 11, marginTop: 3 }}
              >
                Polls &amp; Announcements
              </p>
            </div>
          </div>

          {/* Right: Poll + Announce buttons — vertically centered with title */}
          {isFounder && (
            <div className="flex items-center flex-shrink-0" style={{ gap: "8px" }}>
              {/* + Poll — filled indigo */}
              <button
                type="button"
                onClick={() => setShowCreatePoll(true)}
                className="inline-flex items-center justify-center whitespace-nowrap font-semibold transition-opacity duration-150 hover:opacity-90"
                style={{
                  height: 32,
                  padding: "0 12px",
                  gap: 5,
                  borderRadius: 8,
                  fontSize: 12,
                  backgroundColor: "#4f46e5",
                  color: "#ffffff",
                  boxShadow: "0 1px 3px rgba(79,70,229,0.3)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <Plus className="w-3.5 h-3.5" style={{ flexShrink: 0 }} />
                <span>Poll</span>
              </button>

              {/* Announce — outlined */}
              <button
                type="button"
                onClick={() => setShowCreateAnnouncement(true)}
                className="inline-flex items-center justify-center whitespace-nowrap font-semibold transition-colors duration-150 hover:bg-gray-50"
                style={{
                  height: 32,
                  padding: "0 12px",
                  gap: 5,
                  borderRadius: 8,
                  fontSize: 12,
                  backgroundColor: "#ffffff",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  cursor: "pointer",
                }}
              >
                <Megaphone className="w-3.5 h-3.5" style={{ flexShrink: 0 }} />
                <span>Announce</span>
              </button>
            </div>
          )}
        </div>

        {/* Row 2 — Stats pills */}
        <div
          className="flex items-center flex-wrap px-4 pb-3"
          style={{ gap: "6px" }}
        >
          {/* Active polls pill */}
          <div
            className="inline-flex items-center font-medium"
            style={{
              height: 24,
              padding: "0 10px",
              gap: 5,
              borderRadius: 9999,
              fontSize: 11,
              backgroundColor: "#eef2ff",
              color: "#4338ca",
              flexShrink: 0,
            }}
          >
            <BarChart3 style={{ width: 11, height: 11, flexShrink: 0 }} />
            <span>{activePolls.length} active {activePolls.length === 1 ? "poll" : "polls"}</span>
          </div>

          {/* Announcements pill */}
          <div
            className="inline-flex items-center font-medium"
            style={{
              height: 24,
              padding: "0 10px",
              gap: 5,
              borderRadius: 9999,
              fontSize: 11,
              backgroundColor: "#f3f4f6",
              color: "#4b5563",
              flexShrink: 0,
            }}
          >
            <Megaphone style={{ width: 11, height: 11, flexShrink: 0 }} />
            <span>{allAnnouncements.length} {allAnnouncements.length === 1 ? "announcement" : "announcements"}</span>
          </div>

          {/* Needs vote pill (conditional) */}
          {unvotedPolls.length > 0 && (
            <div
              className="inline-flex items-center font-medium"
              style={{
                height: 24,
                padding: "0 10px",
                gap: 5,
                borderRadius: 9999,
                fontSize: 11,
                backgroundColor: "#fffbeb",
                color: "#b45309",
                flexShrink: 0,
              }}
            >
              <Clock style={{ width: 11, height: 11, flexShrink: 0 }} />
              <span>{unvotedPolls.length} need your vote</span>
            </div>
          )}

          {/* Read-only indicator */}
          {!isFounder && (
            <div
              className="inline-flex items-center"
              style={{ height: 24, gap: 4, fontSize: 11, color: "#9ca3af", flexShrink: 0 }}
            >
              <Lock style={{ width: 11, height: 11, flexShrink: 0 }} />
              <span>Read-only</span>
            </div>
          )}
        </div>

        {/* Row 3 — Filter tabs */}
        <div
          className="flex items-end overflow-x-auto px-4"
          style={{ gap: 0, scrollbarWidth: "none" }}
        >
          {[
            { key: "all",           label: "All",           icon: null,      count: polls.length + allAnnouncements.length },
            { key: "polls",         label: "Polls",         icon: BarChart3, count: polls.length },
            { key: "announcements", label: "Announcements", icon: Megaphone, count: allAnnouncements.length },
          ].map(({ key, label, icon: Icon, count }) => {
            const active = filter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className="inline-flex items-center whitespace-nowrap transition-colors duration-150"
                style={{
                  height: 40,
                  padding: "0 12px",
                  gap: 5,
                  fontSize: 12,
                  fontWeight: active ? 600 : 500,
                  color: active ? "#4f46e5" : "#6b7280",
                  backgroundColor: "transparent",
                  border: "none",
                  borderBottom: active ? "2px solid #4f46e5" : "2px solid transparent",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                {Icon && <Icon style={{ width: 12, height: 12, flexShrink: 0 }} />}
                <span>{label}</span>
                {count > 0 && (
                  <span
                    className="inline-flex items-center justify-center font-semibold"
                    style={{
                      minWidth: 18,
                      height: 18,
                      padding: "0 4px",
                      borderRadius: 9999,
                      fontSize: 10,
                      backgroundColor: active ? "#e0e7ff" : "#f3f4f6",
                      color: active ? "#4338ca" : "#6b7280",
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </div>

      {/* ── Feed ── */}
      <div className="flex-1 overflow-hidden office-panel-body bg-slate-50">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-3">
            {/* Loading states */}
            {pollsLoading && (
              <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                <span>Loading polls…</span>
              </div>
            )}
            {pollsError && (
              <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{pollsError}</span>
              </div>
            )}
            {announcementsLoading && (
              <div className="flex items-center gap-2 text-xs text-gray-400 py-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                <span>Loading announcements…</span>
              </div>
            )}
            {announcementsError && (
              <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{announcementsError}</span>
              </div>
            )}
            {winsError && (
              <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{winsError}</span>
              </div>
            )}

            {/* Empty state */}
            {!isLoading && items.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center mb-5">
                  <Sparkles className="w-8 h-8 text-indigo-500" />
                </div>
                <p className="text-[13px] font-semibold text-gray-700 mb-1.5">Nothing here yet</p>
                <p className="text-[11px] text-gray-400 max-w-[200px] leading-relaxed">
                  {isFounder
                    ? "Create a poll to gather team input, or post an announcement."
                    : "Polls and announcements from your founder will appear here."}
                </p>
              </div>
            )}

            {/* Feed items */}
            <AnimatePresence initial={false}>
              {items.map((item) => {
                const isPoll = "question" in item;

                if (isPoll) {
                  const poll = item;
                  const userVotes = getUserVotes(poll);
                  const voted = hasUserVoted(poll);
                  const isActive = poll.status === "active";
                  const canClose = isFounder && isActive;

                  return (
                    <motion.div
                      key={`poll-${poll.id}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18 }}
                    >
                      <div
                        className="bg-white transition-all duration-150 hover:shadow-md"
                        style={{
                          borderRadius: 14,
                          border: "1px solid #e2e8f0",
                          boxShadow: (!voted && isActive)
                            ? "0 0 0 2px rgba(99,102,241,0.18), 0 1px 4px rgba(0,0,0,0.07)"
                            : "0 1px 3px rgba(0,0,0,0.06)",
                          overflow: "hidden",
                        }}
                      >
                        {/* ── Poll header ── */}
                        <div style={{ padding: "16px 16px 12px 16px" }}>

                          {/* Badge row + Close */}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                              {/* Status badge */}
                              <span
                                className="inline-flex items-center font-semibold"
                                style={{
                                  gap: 4, padding: "3px 9px", borderRadius: 6, fontSize: 11,
                                  ...(isActive
                                    ? { backgroundColor: "#eef2ff", color: "#4338ca", border: "1px solid #c7d2fe" }
                                    : { backgroundColor: "#f3f4f6", color: "#6b7280", border: "1px solid #e5e7eb" })
                                }}
                              >
                                {isActive
                                  ? <><BarChart3 style={{ width: 11, height: 11 }} />Active</>
                                  : <><CheckCircle2 style={{ width: 11, height: 11 }} />Closed</>
                                }
                              </span>
                              {poll.anonymous && (
                                <span
                                  className="inline-flex items-center font-medium"
                                  style={{ gap: 4, padding: "3px 9px", borderRadius: 6, fontSize: 11, backgroundColor: "#f9fafb", color: "#6b7280", border: "1px solid #e5e7eb" }}
                                >
                                  <EyeOff style={{ width: 11, height: 11 }} />Anon
                                </span>
                              )}
                              {poll.allowMultiple && (
                                <span
                                  className="inline-flex items-center font-medium"
                                  style={{ gap: 4, padding: "3px 9px", borderRadius: 6, fontSize: 11, backgroundColor: "#f9fafb", color: "#6b7280", border: "1px solid #e5e7eb" }}
                                >
                                  Multi-choice
                                </span>
                              )}
                            </div>
                            {canClose && (
                              <button
                                type="button"
                                onClick={() => closePoll(poll.id)}
                                className="transition-colors duration-150"
                                style={{ fontSize: 11, fontWeight: 500, color: "#d1d5db", background: "none", border: "none", cursor: "pointer", flexShrink: 0, padding: 0 }}
                                onMouseEnter={e => e.target.style.color = "#6b7280"}
                                onMouseLeave={e => e.target.style.color = "#d1d5db"}
                              >
                                Close poll
                              </button>
                            )}
                          </div>

                          {/* Question */}
                          <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", lineHeight: 1.4, margin: "0 0 4px 0" }}>
                            {poll.question}
                          </p>
                          {poll.description && (
                            <p style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.5, margin: "0 0 10px 0" }}>
                              {poll.description}
                            </p>
                          )}

                          {/* Metadata row */}
                          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 5, fontSize: 11, color: "#9ca3af", marginTop: 6 }}>
                            <span>By {
                              (() => {
                                const name = poll.createdByName;
                                const isRawId = !name || /^[a-f0-9]{24}$/i.test(name);
                                if (!isRawId) return name;
                                if (poll.createdBy === resolvedUserId) return currentUserName || user?.name || "You";
                                return "Team member";
                              })()
                            }</span>
                            <span style={{ color: "#d1d5db" }}>·</span>
                            <span>{formatTimeAgo(poll.createdAt)}</span>
                            {poll.endsAt && isActive && (
                              <>
                                <span style={{ color: "#d1d5db" }}>·</span>
                                <span
                                  className="inline-flex items-center font-semibold"
                                  style={{ gap: 3, padding: "2px 7px", borderRadius: 6, fontSize: 10, backgroundColor: "#fffbeb", color: "#b45309", border: "1px solid #fde68a" }}
                                >
                                  <Clock style={{ width: 10, height: 10 }} />
                                  {formatTimeRemaining(poll.endsAt)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* ── Vote options ── */}
                        <div style={{ padding: "0 16px 16px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                          {poll.options.map((option) => {
                            const isSelected = userVotes.includes(option.id);
                            const showResults = !isActive || voted;
                            // Allow switching vote on active single-choice polls by clicking any option
                            const canVote = isActive && (!voted || !poll.allowMultiple);
                            return (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => canVote && votePoll(poll.id, option.id)}
                                disabled={!isActive}
                                style={{
                                  width: "100%",
                                  textAlign: "left",
                                  borderRadius: 8,
                                  border: isSelected ? "1px solid #818cf8" : "1px solid #e2e8f0",
                                  backgroundColor: isSelected ? "#eef2ff" : "#fafafa",
                                  cursor: canVote ? "pointer" : "default",
                                  padding: "10px 12px",
                                  transition: "border-color 0.15s, background-color 0.15s",
                                }}
                              >
                                {/* Option label row */}
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: showResults ? 8 : 0 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                                    {/* Radio / Checkbox indicator */}
                                    {poll.allowMultiple ? (
                                      <div
                                        style={{
                                          width: 15, height: 15, borderRadius: 4, border: "2px solid",
                                          borderColor: isSelected ? "#4f46e5" : "#d1d5db",
                                          backgroundColor: isSelected ? "#4f46e5" : "transparent",
                                          flexShrink: 0,
                                          display: "flex", alignItems: "center", justifyContent: "center",
                                        }}
                                      >
                                        {isSelected && <CheckCircle2 style={{ width: 9, height: 9, color: "#ffffff" }} />}
                                      </div>
                                    ) : (
                                      <div
                                        style={{
                                          width: 15, height: 15, borderRadius: "50%", border: "2px solid",
                                          borderColor: isSelected ? "#4f46e5" : "#d1d5db",
                                          flexShrink: 0,
                                          display: "flex", alignItems: "center", justifyContent: "center",
                                        }}
                                      >
                                        {isSelected && (
                                          <div style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#4f46e5" }} />
                                        )}
                                      </div>
                                    )}
                                    <span style={{ fontSize: 12, fontWeight: 500, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {option.text}
                                    </span>
                                  </div>
                                  {showResults && (
                                    <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginLeft: 10, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                                      {Math.round(option.percentage)}%
                                    </span>
                                  )}
                                </div>

                                {/* Progress bar */}
                                {showResults && (
                                  <div style={{ width: "100%", height: 4, borderRadius: 4, backgroundColor: "#f3f4f6", overflow: "hidden" }}>
                                    <motion.div
                                      style={{
                                        height: "100%", borderRadius: 4,
                                        background: isSelected
                                          ? "linear-gradient(to right, #6366f1, #8b5cf6)"
                                          : "#d1d5db",
                                      }}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${option.percentage}%` }}
                                      transition={{ duration: 0.4, ease: "easeOut" }}
                                    />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* ── Poll footer ── */}
                        <div
                          style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "10px 16px",
                            borderTop: "1px solid #f1f5f9",
                            backgroundColor: "#f8fafc",
                          }}
                        >
                          <Users style={{ width: 13, height: 13, color: "#9ca3af", flexShrink: 0 }} />
                          <span style={{ fontSize: 11, color: "#9ca3af" }}>
                            {poll.totalVotes} {poll.totalVotes === 1 ? "vote" : "votes"}
                          </span>
                          {voted && (
                            <span
                              className="inline-flex items-center font-semibold"
                              style={{ gap: 4, padding: "3px 9px", borderRadius: 6, fontSize: 11, backgroundColor: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0", marginLeft: 4 }}
                            >
                              <CheckCircle2 style={{ width: 11, height: 11 }} />
                              You voted
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                }

                // Announcement / Win
                const ann = item;
                const isWin = ann.category === "wall-of-wins";
                const leftBarColor =
                  ann.priority === "urgent" ? "#ef4444" :
                  ann.priority === "high" ? "#fb923c" :
                  isWin ? "#fbbf24" : "#a5b4fc";
                const iconBg =
                  isWin ? "#fef9c3" :
                  ann.priority === "urgent" ? "#fef2f2" :
                  ann.priority === "high" ? "#fff7ed" : "#eef2ff";

                return (
                  <motion.div
                    key={`ann-${ann.id}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                  >
                    <div
                      className="bg-white transition-all duration-150 hover:shadow-md"
                      style={{
                        borderRadius: 14,
                        border: "1px solid #e2e8f0",
                        borderLeft: `4px solid ${leftBarColor}`,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                      }}
                    >
                      <div style={{ padding: "16px 16px 16px 14px", display: "flex", alignItems: "flex-start", gap: 12 }}>

                        {/* Emoji icon — radius matches card feel */}
                        <div
                          className="flex-shrink-0 flex items-center justify-center text-lg"
                          style={{
                            width: 40, height: 40,
                            borderRadius: 10,
                            backgroundColor: iconBg,
                          }}
                        >
                          {ann.emoji || (isWin ? "🏆" : "📢")}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>

                          {/* Badge row */}
                          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                            {isWin ? (
                              <span
                                className="inline-flex items-center font-semibold"
                                style={{ gap: 4, padding: "3px 9px", borderRadius: 6, fontSize: 11, backgroundColor: "#fffbeb", color: "#b45309", border: "1px solid #fde68a" }}
                              >
                                <Trophy style={{ width: 11, height: 11 }} />Wall of Wins
                              </span>
                            ) : ann.category === "team-events" ? (
                              <span
                                className="inline-flex items-center font-semibold"
                                style={{ gap: 4, padding: "3px 9px", borderRadius: 6, fontSize: 11, backgroundColor: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}
                              >
                                📅 Team Events
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center font-semibold"
                                style={{ gap: 4, padding: "3px 9px", borderRadius: 6, fontSize: 11, backgroundColor: "#f3f4f6", color: "#4b5563", border: "1px solid #e5e7eb" }}
                              >
                                <Megaphone style={{ width: 11, height: 11 }} />Announcement
                              </span>
                            )}
                            {ann.priority === "high" && (
                              <span
                                className="inline-flex items-center font-semibold"
                                style={{ gap: 4, padding: "3px 9px", borderRadius: 6, fontSize: 11, backgroundColor: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" }}
                              >
                                <AlertCircle style={{ width: 11, height: 11 }} />High Priority
                              </span>
                            )}
                            {ann.priority === "urgent" && (
                              <span
                                className="inline-flex items-center font-bold"
                                style={{ gap: 4, padding: "3px 9px", borderRadius: 6, fontSize: 11, backgroundColor: "#ef4444", color: "#ffffff" }}
                              >
                                <AlertCircle style={{ width: 11, height: 11 }} />Urgent
                              </span>
                            )}
                          </div>

                          {/* Message */}
                          <p
                            className="text-gray-700 font-medium leading-snug"
                            style={{ fontSize: 13, margin: "0 0 8px 0" }}
                          >
                            {ann.message}
                          </p>

                          {/* Metadata */}
                          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#9ca3af" }}>
                            <span style={{ fontWeight: 600, color: "#6b7280" }} className="truncate" >{ann.sender}</span>
                            <span style={{ color: "#d1d5db" }}>·</span>
                            <span>{formatTimeAgo(ann.timestamp)}</span>
                          </div>

                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>

      {/* ── Create Poll Dialog ── */}
      <Dialog open={showCreatePoll} onOpenChange={(open) => { if (!pollSubmitting) setShowCreatePoll(open); }}>
        <DialogContent className={createDialogClassName}>
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              Create New Poll
            </DialogTitle>
            <DialogDescription className="text-xs">
              Gather your team's input on important decisions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
            <div>
              <Label htmlFor="poll-question" className="text-xs font-medium">Question *</Label>
              <Input
                id="poll-question"
                placeholder="What should we decide?"
                value={newPoll.question}
                onChange={(e) => setNewPoll({ ...newPoll, question: e.target.value })}
                className="h-8 text-sm mt-1"
              />
            </div>
            <div>
              <Label htmlFor="poll-description" className="text-xs font-medium">Context (optional)</Label>
              <Textarea
                id="poll-description"
                placeholder="Add background or details…"
                value={newPoll.description}
                onChange={(e) => setNewPoll({ ...newPoll, description: e.target.value })}
                rows={2}
                className="text-sm mt-1 resize-none"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Answer Options *</Label>
              <div className="space-y-1.5 mt-1.5">
                {newPoll.options.map((option, index) => (
                  <div key={index} className="flex gap-1.5">
                    <Input
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => {
                        const updated = [...newPoll.options];
                        updated[index] = e.target.value;
                        setNewPoll({ ...newPoll, options: updated });
                      }}
                      className="h-8 text-sm"
                    />
                    {newPoll.options.length > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setNewPoll({ ...newPoll, options: newPoll.options.filter((_, i) => i !== index) })}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))}
                {newPoll.options.length < 8 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNewPoll({ ...newPoll, options: [...newPoll.options, ""] })}
                    className="w-full h-7 text-xs border-dashed"
                  >
                    <Plus className="w-3 h-3 mr-1" />Add Option
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <Checkbox
                  checked={newPoll.allowMultiple}
                  onCheckedChange={(c) => setNewPoll({ ...newPoll, allowMultiple: Boolean(c) })}
                  className="w-3.5 h-3.5"
                />
                <span>Multi-choice</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <Checkbox
                  checked={newPoll.anonymous}
                  onCheckedChange={(c) => setNewPoll({ ...newPoll, anonymous: Boolean(c) })}
                  className="w-3.5 h-3.5"
                />
                <span>Anonymous votes</span>
              </label>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <Label htmlFor="poll-duration" className="text-xs font-medium">Duration (days)</Label>
                <span style={{ fontSize: 11, color: "#9ca3af" }}>1 – 30 days</span>
              </div>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  id="poll-duration"
                  type="number"
                  min={1}
                  max={30}
                  value={newPoll.endsInDays}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "" || raw === "0") {
                      setNewPoll({ ...newPoll, endsInDays: raw });
                    } else {
                      const val = parseInt(raw);
                      if (!isNaN(val)) setNewPoll({ ...newPoll, endsInDays: val });
                    }
                  }}
                  onBlur={(e) => {
                    const val = parseInt(e.target.value);
                    const clamped = isNaN(val) || val < 1 ? 1 : Math.min(30, val);
                    setNewPoll({ ...newPoll, endsInDays: clamped });
                  }}
                  style={{
                    width: "100%", height: 34, borderRadius: 8, fontSize: 13,
                    border: "1px solid #d1d5db", padding: "0 36px 0 12px",
                    outline: "none", color: "#111827",
                    MozAppearance: "textfield",
                    WebkitAppearance: "none",
                  }}
                />
                {/* Manual +/- buttons replace browser spinner */}
                <div style={{ position: "absolute", right: 8, display: "flex", flexDirection: "column", gap: 1 }}>
                  <button
                    type="button"
                    onClick={() => setNewPoll(p => ({ ...p, endsInDays: Math.min(30, (p.endsInDays || 1) + 1) }))}
                    style={{ width: 18, height: 14, fontSize: 9, lineHeight: 1, border: "1px solid #e5e7eb", borderRadius: "4px 4px 0 0", backgroundColor: "#f9fafb", cursor: "pointer", color: "#374151", display: "flex", alignItems: "center", justifyContent: "center" }}
                    tabIndex={-1}
                  >▲</button>
                  <button
                    type="button"
                    onClick={() => setNewPoll(p => ({ ...p, endsInDays: Math.max(1, (p.endsInDays || 1) - 1) }))}
                    style={{ width: 18, height: 14, fontSize: 9, lineHeight: 1, border: "1px solid #e5e7eb", borderRadius: "0 0 4px 4px", backgroundColor: "#f9fafb", cursor: "pointer", color: "#374151", display: "flex", alignItems: "center", justifyContent: "center" }}
                    tabIndex={-1}
                  >▼</button>
                </div>
              </div>
              {(newPoll.endsInDays < 1 || newPoll.endsInDays > 30) && (
                <p style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>Must be between 1 and 30 days</p>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
            <button
              type="button"
              onClick={() => setShowCreatePoll(false)}
              disabled={pollSubmitting}
              style={{
                flex: 1, height: 34, borderRadius: 8, fontSize: 12, fontWeight: 500,
                backgroundColor: "#ffffff", color: "#374151",
                border: "1px solid #d1d5db", cursor: pollSubmitting ? "not-allowed" : "pointer",
                opacity: pollSubmitting ? 0.5 : 1,
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={createPoll}
              disabled={pollSubmitting}
              style={{
                flex: 1, height: 34, borderRadius: 8, fontSize: 12, fontWeight: 600,
                backgroundColor: "#4f46e5", color: "#ffffff",
                border: "none", cursor: pollSubmitting ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                opacity: pollSubmitting ? 0.8 : 1,
              }}
            >
              {pollSubmitting
                ? <><Loader2 className="animate-spin" style={{ width: 13, height: 13 }} />Creating…</>
                : <><Send style={{ width: 13, height: 13 }} />Create Poll</>
              }
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Create Announcement Dialog ── */}
      <Dialog open={showCreateAnnouncement} onOpenChange={(open) => { if (!announcementSubmitting) setShowCreateAnnouncement(open); }}>
        <DialogContent className={createDialogClassName}>
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-indigo-600" />
              New Announcement
            </DialogTitle>
            <DialogDescription className="text-xs">
              Broadcast an update to your entire team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
            <div>
              <Label className="text-xs font-medium">Tone / Emoji</Label>
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                {emojiOptions.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewAnnouncement({ ...newAnnouncement, emoji })}
                    className={`text-base w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${newAnnouncement.emoji === emoji ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950 shadow-sm" : "border-border hover:border-indigo-300"}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="ann-message" className="text-xs font-medium">Message *</Label>
              <Textarea
                id="ann-message"
                placeholder="What do you want to share with the team?"
                value={newAnnouncement.message}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                rows={4}
                className="text-sm mt-1 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-medium">Priority</Label>
                <div className="flex flex-col gap-1 mt-1.5">
                  {[
                    { value: "normal", label: "Normal" },
                    { value: "high", label: "High" },
                    { value: "urgent", label: "Urgent 🚨" },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setNewAnnouncement({ ...newAnnouncement, priority: value })}
                      className={`text-left text-xs px-2.5 py-1.5 rounded-lg border transition-all ${newAnnouncement.priority === value ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950 font-medium" : "border-border hover:border-indigo-300"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium">Category</Label>
                <div className="flex flex-col gap-1 mt-1.5">
                  {[
                    { value: "general", label: "General 📢" },
                    { value: "team-events", label: "Team Events 📅" },
                    { value: "wall-of-wins", label: "Wall of Wins 🏆" },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setNewAnnouncement({ ...newAnnouncement, category: value })}
                      className={`text-left text-xs px-2.5 py-1.5 rounded-lg border transition-all ${newAnnouncement.category === value ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950 font-medium" : "border-border hover:border-indigo-300"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
            <button
              type="button"
              onClick={() => setShowCreateAnnouncement(false)}
              disabled={announcementSubmitting}
              style={{
                flex: 1, height: 34, borderRadius: 8, fontSize: 12, fontWeight: 500,
                backgroundColor: "#ffffff", color: "#374151",
                border: "1px solid #d1d5db", cursor: announcementSubmitting ? "not-allowed" : "pointer",
                opacity: announcementSubmitting ? 0.5 : 1,
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={createAnnouncement}
              disabled={announcementSubmitting}
              style={{
                flex: 1, height: 34, borderRadius: 8, fontSize: 12, fontWeight: 600,
                backgroundColor: "#4f46e5", color: "#ffffff",
                border: "none", cursor: announcementSubmitting ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                opacity: announcementSubmitting ? 0.8 : 1,
              }}
            >
              {announcementSubmitting
                ? <><Loader2 className="animate-spin" style={{ width: 13, height: 13 }} />Sending…</>
                : <><Send style={{ width: 13, height: 13 }} />Send Announcement</>
              }
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
