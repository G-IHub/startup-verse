import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
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
import { Progress } from "../ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toast } from "sonner";
import {
  getStartupAnnouncements,
  postStartupAnnouncement,
} from "../../utils/announcementApi";
import { getStartupWins, postWin } from "../../utils/activityApi";
import { subscribeToAnnouncements } from "../../utils/realtimeSubscriptions";
import { subscribeToWins } from "../../utils/realtimeSubscriptions";
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
}) {
  const [filter, setFilter] = useState("all");
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);

  // Clear old mock data (one-time cleanup)
  useEffect(() => {
    if (strictMode) return;
    const mockDataCleared = localStorage.getItem(
      "startupverse_mock_data_cleared",
    );
    if (!mockDataCleared) {
      localStorage.removeItem("startupverse_polls");
      localStorage.removeItem("startupverse_announcements");
      localStorage.setItem("startupverse_mock_data_cleared", "true");
    }
  }, []);

  // Load from localStorage
  const [polls, setPolls] = useState(() => {
    if (strictMode) return [];
    const saved = localStorage.getItem("startupverse_polls");
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((p) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        endsAt: p.endsAt ? new Date(p.endsAt) : undefined,
      }));
    }
    return [];
  });
  const [announcements, setAnnouncements] = useState(() => {
    if (strictMode) return [];
    const saved = localStorage.getItem("startupverse_announcements");
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((a) => ({
        ...a,
        timestamp: new Date(a.timestamp),
      }));
    }
    return [];
  });
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [announcementsError, setAnnouncementsError] = useState("");
  const [wins, setWins] = useState([]);
  const [winsLoading, setWinsLoading] = useState(false);
  const [winsError, setWinsError] = useState("");

  // Persist to localStorage
  useEffect(() => {
    if (strictMode) return;
    localStorage.setItem("startupverse_polls", JSON.stringify(polls));
  }, [polls, strictMode]);
  useEffect(() => {
    if (strictMode) return;
    localStorage.setItem(
      "startupverse_announcements",
      JSON.stringify(announcements),
    );
  }, [announcements, strictMode]);

  useEffect(() => {
    if (!startupId) {
      setAnnouncements([]);
      setAnnouncementsLoading(false);
      setAnnouncementsError("");
      return;
    }
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
        if (result?.success) {
          setAnnouncements(result.announcements || []);
        } else {
          setAnnouncementsError("Could not load announcements.");
        }
      })
      .catch(() => {
        if (!stopped) setAnnouncementsError("Could not load announcements.");
      })
      .finally(() => {
        if (!stopped) setAnnouncementsLoading(false);
      });
    const unsub = subscribeToAnnouncements(startupId, (update) => {
      const incoming = update?.announcement;
      if (!incoming?.id) return;
      setAnnouncements((prev) => {
        const byId = new Map(prev.map((row) => [String(row.id), row]));
        const prevRow = byId.get(String(incoming.id));
        byId.set(String(incoming.id), {
          ...incoming,
          emoji: incoming.emoji || prevRow?.emoji || "",
        });
        return Array.from(byId.values()).sort(
          (a, b) => new Date(b.createdAt || b.timestamp || 0) - new Date(a.createdAt || a.timestamp || 0),
        );
      });
    });
    return () => {
      stopped = true;
      unsub?.();
    };
  }, [startupId, announcementsData]);

  useEffect(() => {
    if (!startupId) {
      setWins([]);
      setWinsLoading(false);
      setWinsError("");
      return;
    }
    let stopped = false;
    setWinsLoading(true);
    setWinsError("");
    if (winsData) {
      setWins(winsData);
      setWinsLoading(false);
      return () => {};
    }
    getStartupWins(startupId, { limit: 100 })
      .then((result) => {
        if (stopped) return;
        if (result?.success) {
          setWins(result.wins || []);
        } else {
          setWinsError("Could not load wins.");
        }
      })
      .catch(() => {
        if (!stopped) setWinsError("Could not load wins.");
      })
      .finally(() => {
        if (!stopped) setWinsLoading(false);
      });
    const unsub = subscribeToWins(startupId, (update) => {
      const incoming = update?.win;
      if (!incoming?.id) return;
      setWins((prev) => {
        const byId = new Map(prev.map((row) => [String(row.id), row]));
        byId.set(String(incoming.id), incoming);
        return Array.from(byId.values()).sort(
          (a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0),
        );
      });
    });
    return () => {
      stopped = true;
      unsub?.();
    };
  }, [startupId, winsData]);

  // Poll creation state
  const [newPoll, setNewPoll] = useState({
    question: "",
    description: "",
    options: ["", ""],
    allowMultiple: false,
    anonymous: false,
    endsInDays: 7,
  });

  // Announcement creation state
  const [newAnnouncement, setNewAnnouncement] = useState({
    message: "",
    emoji: "📢",
    priority: "normal",
    category: "general",
  });
  const createPoll = () => {
    if (!newPoll.question.trim()) {
      toast.error("Please enter a poll question");
      return;
    }
    const validOptions = newPoll.options.filter((opt) => opt.trim());
    if (validOptions.length < 2) {
      toast.error("Please add at least 2 options");
      return;
    }
    const pollId = Date.now().toString();
    const poll = {
      id: pollId,
      question: newPoll.question,
      description: newPoll.description,
      options: validOptions.map((text, idx) => ({
        id: `${pollId}_opt${idx}`,
        // Make option IDs unique across all polls
        text,
        votes: [],
        percentage: 0,
      })),
      createdBy: currentUserName,
      createdAt: new Date(),
      endsAt: new Date(Date.now() + newPoll.endsInDays * 24 * 60 * 60 * 1000),
      status: "active",
      allowMultiple: newPoll.allowMultiple,
      anonymous: newPoll.anonymous,
      totalVotes: 0,
    };
    setPolls([poll, ...polls]);
    setShowCreatePoll(false);
    setNewPoll({
      question: "",
      description: "",
      options: ["", ""],
      allowMultiple: false,
      anonymous: false,
      endsInDays: 7,
    });
    onActivity?.("poll-create", `created a poll: "${newPoll.question}"`, "🗳️");
    toast.success("🗳️ Poll created successfully!");
  };
  const createAnnouncement = () => {
    if (!newAnnouncement.message.trim()) {
      toast.error("Please enter an announcement message");
      return;
    }
    if (!startupId) {
      toast.error("Startup context missing.");
      return;
    }
    const submitPromise =
      newAnnouncement.category === "wall-of-wins"
        ? onCreateWin
          ? onCreateWin({ message: newAnnouncement.message }).then((win) => ({
              success: true,
              win,
            }))
          : postWin(startupId ? { startupId, userId: currentUserId, message: newAnnouncement.message } : {})
        : postStartupAnnouncement(startupId, {
            title: "Announcement",
            message: newAnnouncement.message,
            priority: newAnnouncement.priority,
            category: newAnnouncement.category,
            emoji: newAnnouncement.emoji,
            userId: currentUserId,
          });
    const effectivePromise =
      newAnnouncement.category !== "wall-of-wins" && onCreateAnnouncement
        ? onCreateAnnouncement({
            title: "Announcement",
            message: newAnnouncement.message,
            priority: newAnnouncement.priority,
            category: newAnnouncement.category,
            emoji: newAnnouncement.emoji,
            userId: currentUserId,
          }).then((announcement) => ({ success: true, announcement }))
        : submitPromise;
    effectivePromise
      .then((result) => {
        if (newAnnouncement.category === "wall-of-wins") {
          if (!result?.success || !result?.win) {
            throw new Error("Win publish failed.");
          }
          setWins((prev) => [result.win, ...prev]);
        } else {
          if (!result?.success || !result?.announcement) {
            throw new Error("Announcement publish failed.");
          }
          setAnnouncements((prev) => [
            {
              ...result.announcement,
              emoji: result.announcement?.emoji || newAnnouncement.emoji,
            },
            ...prev,
          ]);
        }
        setAnnouncementsError("");
        setWinsError("");
        setShowCreateAnnouncement(false);
        setNewAnnouncement({
          message: "",
          emoji: "📢",
          priority: "normal",
          category: "general",
        });
        onActivity?.(
          newAnnouncement.category === "wall-of-wins" ? "win" : "announcement-create",
          newAnnouncement.category === "wall-of-wins" ? "shared a team win" : "created an announcement",
          newAnnouncement.category === "wall-of-wins" ? "🏆" : newAnnouncement.emoji,
        );
        toast.success(
          newAnnouncement.category === "wall-of-wins"
            ? "🏆 Win shared with your startup!"
            : "📢 Announcement sent!",
        );
      })
      .catch((error) => {
        if (newAnnouncement.category === "wall-of-wins") {
          setWinsError(error?.message || "Unable to publish win.");
          toast.error("Unable to publish win.");
        } else {
          setAnnouncementsError(error?.message || "Unable to publish announcement.");
          toast.error("Unable to publish announcement.");
        }
      });
  };
  const votePoll = (pollId, optionId) => {
    let pollQuestion = "";
    setPolls(
      polls.map((poll) => {
        if (poll.id !== pollId) return poll;
        pollQuestion = poll.question;
        const hasVoted = poll.options.some((opt) =>
          opt.votes.includes(currentUserId),
        );
        if (!poll.allowMultiple && hasVoted) {
          // Remove previous vote
          poll.options.forEach((opt) => {
            opt.votes = opt.votes.filter((id) => id !== currentUserId);
          });
        }

        // Add new vote
        poll.options = poll.options.map((opt) => {
          if (opt.id === optionId) {
            if (!opt.votes.includes(currentUserId)) {
              opt.votes = [...opt.votes, currentUserId];
            } else if (poll.allowMultiple) {
              // Toggle vote if multiple allowed
              opt.votes = opt.votes.filter((id) => id !== currentUserId);
            }
          }
          return opt;
        });

        // Recalculate percentages
        const totalVotes = poll.options.reduce(
          (sum, opt) => sum + opt.votes.length,
          0,
        );
        poll.totalVotes = totalVotes;
        poll.options = poll.options.map((opt) => ({
          ...opt,
          percentage:
            totalVotes > 0 ? (opt.votes.length / totalVotes) * 100 : 0,
        }));
        return poll;
      }),
    );
    onActivity?.("poll-vote", `voted in poll: "${pollQuestion}"`, "✅");
    toast.success("Vote recorded!");
  };
  const closePoll = (pollId) => {
    setPolls(
      polls.map((poll) =>
        poll.id === pollId
          ? {
              ...poll,
              status: "closed",
            }
          : poll,
      ),
    );
    toast.success("Poll closed");
  };
  const hasUserVoted = (poll) => {
    return poll.options.some((opt) => opt.votes.includes(currentUserId));
  };
  const getUserVotes = (poll) => {
    return poll.options
      .filter((opt) => opt.votes.includes(currentUserId))
      .map((opt) => opt.id);
  };
  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };
  const formatTimeRemaining = (date) => {
    const seconds = Math.floor((date.getTime() - new Date().getTime()) / 1000);
    if (seconds < 0) return "Ended";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m left`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h left`;
    return `${Math.floor(seconds / 86400)}d left`;
  };
  const activePolls = polls.filter((p) => p.status === "active");
  const closedPolls = polls.filter((p) => p.status === "closed");
  const unvotedPolls = activePolls.filter((p) => !hasUserVoted(p));

  // 🔥 NEW: Convert organization announcements to local format for display
  const convertedOrgAnnouncements = organizationAnnouncements.map((orgAnn) => ({
    id: orgAnn.id,
    message: orgAnn.content,
    sender: `${orgAnn.createdByName} (${orgAnn.cohortName || "Organization"})`,
    timestamp: new Date(orgAnn.createdAt),
    emoji:
      orgAnn.priority === "urgent"
        ? "🚨"
        : orgAnn.priority === "high"
          ? "⚠️"
          : "📢",
    priority: orgAnn.priority,
    category: "general",
    reactions: [],
    comments: [],
  }));

  const localAnnouncements = announcements.map((ann) => {
    const rawTs = ann.timestamp ?? ann.createdAt;
    const timestamp =
      rawTs instanceof Date ? rawTs : new Date(rawTs || Date.now());
    const safeTs = Number.isNaN(timestamp.getTime()) ? new Date() : timestamp;
    const priorityEmoji =
      ann.priority === "urgent" ? "🚨" : ann.priority === "high" ? "⚠️" : "📢";
    return {
      ...ann,
      sender: ann.sender || ann.createdByName || currentUserName,
      timestamp: safeTs,
      emoji:
        typeof ann.emoji === "string" && ann.emoji.trim()
          ? ann.emoji
          : priorityEmoji,
    };
  });
  const winAnnouncements = wins.map((win) => ({
    id: win.id,
    message: win.message,
    sender: win.userName || currentUserName,
    timestamp: win.timestamp ? new Date(win.timestamp) : new Date(),
    emoji: "🏆",
    priority: "normal",
    category: "wall-of-wins",
    reactions: [],
    comments: [],
  }));

  // Merge local and organization announcements
  const allAnnouncements = [...winAnnouncements, ...localAnnouncements, ...convertedOrgAnnouncements];
  const filteredItems = () => {
    if (filter === "polls") return polls;
    if (filter === "announcements") return allAnnouncements;

    // Combine and sort by date for 'all'
    const combined = [...polls, ...allAnnouncements];
    return combined.sort((a, b) => {
      const dateA = "createdAt" in a ? a.createdAt : a.timestamp;
      const dateB = "createdAt" in b ? b.createdAt : b.timestamp;
      return dateB.getTime() - dateA.getTime();
    });
  };
  const emojiOptions = [
    "📢",
    "🎉",
    "💼",
    "🚀",
    "⚡",
    "🎯",
    "💡",
    "🏆",
    "🔥",
    "✨",
  ];
  const createDialogClassName = embedded
    ? "max-w-sm z-[80] office-dialog-panel"
    : "max-w-sm z-[80] fixed right-[500px] top-1/2 -translate-y-1/2 office-dialog-panel";

  return (
    <motion.div
      initial={embedded ? { opacity: 0, y: 16 } : { x: "100%" }}
      animate={embedded ? { opacity: 1, y: 0 } : { x: 0 }}
      exit={embedded ? { opacity: 0, y: 16 } : { x: "100%" }}
      transition={{
        type: "spring",
        damping: 28,
        stiffness: 260,
      }}
      className={
        embedded
          ? "h-[72vh] w-full office-panel office-panel-shell office-motion-soft flex flex-col"
          : "fixed top-0 right-0 h-screen w-full md:w-[480px] office-panel office-panel-shell office-motion-soft z-[70] flex flex-col rounded-none md:rounded-l-xl"
      }
    >
      <div className="office-panel-header flex-shrink-0 p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <h2 className="text-base m-0">Updates</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7 w-7 p-0"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="flex gap-2 text-xs">
          <div className="bg-white/60 dark:bg-slate-700/60 rounded px-2 py-1 flex items-center gap-1">
            <BarChart3 className="w-3 h-3" />
            <span>
              {activePolls.length}
              {" active polls"}
            </span>
          </div>
          {unvotedPolls.length > 0 && (
            <div className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded px-2 py-1 flex items-center gap-1 animate-pulse">
              <Clock className="w-3 h-3" />
              <span>
                {unvotedPolls.length}
                {" need your vote"}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="flex-shrink-0 p-4 border-b border-border bg-surface-container-low">
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
              className="h-7 text-xs"
            >
              All
            </Button>
            <Button
              variant={filter === "polls" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("polls")}
              className="h-7 text-xs"
            >
              <BarChart3 className="w-3 h-3 mr-1" />
              Polls
            </Button>
            <Button
              variant={filter === "announcements" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("announcements")}
              className="h-7 text-xs"
            >
              <Megaphone className="w-3 h-3 mr-1" />
              Announcements
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowCreatePoll(true)}
              size="sm"
              className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-3 h-3 mr-1" />
              Poll
            </Button>
            <Button
              onClick={() => setShowCreateAnnouncement(true)}
              size="sm"
              variant="outline"
              className="h-7 text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Announce
            </Button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden office-panel-body">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-3">
            {announcementsLoading ? (
              <div className="text-xs text-muted-foreground">Loading announcements...</div>
            ) : null}
            {announcementsError ? (
              <div className="text-xs text-red-600">{announcementsError}</div>
            ) : null}
            {winsLoading ? (
              <div className="text-xs text-muted-foreground">Loading wins...</div>
            ) : null}
            {winsError ? (
              <div className="text-xs text-red-600">{winsError}</div>
            ) : null}
            {filteredItems().length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No items yet</p>
                <p className="text-xs mt-1">
                  Create your first poll or announcement!
                </p>
              </div>
            ) : (
              <>
                {filteredItems().map((item) => {
                const isPoll = "question" in item;
                if (isPoll) {
                  const poll = item;
                  const userVotes = getUserVotes(poll);
                  const voted = hasUserVoted(poll);
                  const isActive = poll.status === "active";
                  return (
                    <motion.div
                      key={`poll-${poll.id}`}
                      initial={{
                        opacity: 0,
                        y: 20,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                    >
                      <Card
                        className={`p-4 ${!voted && isActive ? "border-blue-500 border-2" : ""}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant={isActive ? "default" : "secondary"}
                                className="h-5 text-[10px]"
                              >
                                {isActive ? (
                                  <>
                                    <BarChart3 className="w-2.5 h-2.5 mr-1" />
                                    Active
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                                    Closed
                                  </>
                                )}
                              </Badge>
                              {poll.anonymous && (
                                <Badge
                                  variant="outline"
                                  className="h-5 text-[10px]"
                                >
                                  <EyeOff className="w-2.5 h-2.5 mr-1" />
                                  Anonymous
                                </Badge>
                              )}
                            </div>
                            <h3 className="text-sm mb-1">{poll.question}</h3>
                            {poll.description && (
                              <p className="text-xs text-muted-foreground mb-2">
                                {poll.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>
                                {"By "}
                                {poll.createdBy}
                              </span>
                              <span>•</span>
                              <span>{formatTimeAgo(poll.createdAt)}</span>
                              {poll.endsAt && isActive && (
                                <>
                                  <span>•</span>
                                  <span className="text-orange-600 dark:text-orange-400">
                                    <Clock className="w-3 h-3 inline mr-1" />
                                    {formatTimeRemaining(poll.endsAt)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {poll.options.map((option) => {
                            const isSelected = userVotes.includes(option.id);
                            const showResults = !isActive || voted;
                            return (
                              <div key={option.id}>
                                <button
                                  onClick={() =>
                                    isActive && votePoll(poll.id, option.id)
                                  }
                                  disabled={!isActive}
                                  className={`w-full text-left p-3 rounded-lg border transition-all ${isActive && !voted ? "hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 cursor-pointer" : "cursor-default"} ${isSelected ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "border-border"}`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2 flex-1">
                                      {poll.allowMultiple ? (
                                        <Checkbox
                                          checked={isSelected}
                                          className="pointer-events-none"
                                        />
                                      ) : (
                                        <div
                                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-blue-600" : "border-gray-300"}`}
                                        >
                                          {isSelected && (
                                            <div className="w-2 h-2 rounded-full bg-blue-600" />
                                          )}
                                        </div>
                                      )}
                                      <span className="text-sm">
                                        {option.text}
                                      </span>
                                    </div>
                                    {showResults && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">
                                          {option.votes.length}
                                          {" votes"}
                                        </span>
                                        <span className="text-sm font-medium">
                                          {Math.round(option.percentage)}%
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  {showResults && (
                                    <Progress
                                      value={option.percentage}
                                      className="h-1.5"
                                    />
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="w-3 h-3" />
                            <span>
                              {poll.totalVotes}{" "}
                              {poll.totalVotes === 1 ? "vote" : "votes"}
                            </span>
                          </div>
                          {isActive && poll.createdBy === currentUserName && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => closePoll(poll.id)}
                              className="h-6 text-xs"
                            >
                              Close Poll
                            </Button>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  );
                } else {
                  const announcement = item;
                  const priorityColors = {
                    low: "border-border",
                    normal: "border-border",
                    high: "border-orange-500",
                    urgent: "border-red-500",
                  };
                  return (
                    <motion.div
                      key={`announcement-${announcement.id}`}
                      initial={{
                        opacity: 0,
                        y: 20,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                    >
                      <Card
                        className={`p-4 ${priorityColors[announcement.priority || "normal"]}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-2xl flex-shrink-0">
                            {announcement.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Megaphone className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                Announcement
                              </span>
                              {announcement.category === "wall-of-wins" && (
                                <Badge
                                  variant="secondary"
                                  className="h-4 text-[9px] bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
                                >
                                  🏆 Wall of Wins
                                </Badge>
                              )}
                              {announcement.category === "team-events" && (
                                <Badge
                                  variant="secondary"
                                  className="h-4 text-[9px] bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                >
                                  📅 Team Events
                                </Badge>
                              )}
                              {announcement.priority === "high" && (
                                <Badge
                                  variant="secondary"
                                  className="h-4 text-[9px] bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
                                >
                                  High Priority
                                </Badge>
                              )}
                              {announcement.priority === "urgent" && (
                                <Badge
                                  variant="secondary"
                                  className="h-4 text-[9px] bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                                >
                                  Urgent
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm mb-2">
                              {announcement.message}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>
                                {"By "}
                                {announcement.sender}
                              </span>
                              <span>•</span>
                              <span>
                                {formatTimeAgo(announcement.timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                }
                })}
              </>
            )}
          </div>
        </ScrollArea>
      </div>
      <Dialog open={showCreatePoll} onOpenChange={setShowCreatePoll}>
        <DialogContent className={createDialogClassName}>
          <DialogHeader>
            <DialogTitle className="text-sm">Create New Poll</DialogTitle>
            <DialogDescription className="text-xs">
              Get your team's input on important decisions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="poll-question" className="text-xs">
                Question *
              </Label>
              <Input
                id="poll-question"
                placeholder="What should we decide on?"
                value={newPoll.question}
                onChange={(e) =>
                  setNewPoll({
                    ...newPoll,
                    question: e.target.value,
                  })
                }
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="poll-description" className="text-xs">
                Description (optional)
              </Label>
              <Textarea
                id="poll-description"
                placeholder="Add context or details..."
                value={newPoll.description}
                onChange={(e) =>
                  setNewPoll({
                    ...newPoll,
                    description: e.target.value,
                  })
                }
                rows={2}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Options *</Label>
              <div className="space-y-1.5 mt-1.5">
                {newPoll.options.map((option, index) => (
                  <div key={index} className="flex gap-1.5">
                    <Input
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => {
                        const updated = [...newPoll.options];
                        updated[index] = e.target.value;
                        setNewPoll({
                          ...newPoll,
                          options: updated,
                        });
                      }}
                      className="h-8 text-sm"
                    />
                    {newPoll.options.length > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const updated = newPoll.options.filter(
                            (_, i) => i !== index,
                          );
                          setNewPoll({
                            ...newPoll,
                            options: updated,
                          });
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setNewPoll({
                      ...newPoll,
                      options: [...newPoll.options, ""],
                    })
                  }
                  className="w-full h-7 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Option
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <Checkbox
                  checked={newPoll.allowMultiple}
                  onCheckedChange={(checked) =>
                    setNewPoll({
                      ...newPoll,
                      allowMultiple: checked,
                    })
                  }
                  className="w-3.5 h-3.5"
                />
                <span>Allow multiple</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <Checkbox
                  checked={newPoll.anonymous}
                  onCheckedChange={(checked) =>
                    setNewPoll({
                      ...newPoll,
                      anonymous: checked,
                    })
                  }
                  className="w-3.5 h-3.5"
                />
                <span>Anonymous</span>
              </label>
            </div>
            <div>
              <Label htmlFor="poll-duration" className="text-xs">
                Duration (days)
              </Label>
              <Input
                id="poll-duration"
                type="number"
                min="1"
                max="30"
                value={newPoll.endsInDays}
                onChange={(e) =>
                  setNewPoll({
                    ...newPoll,
                    endsInDays: parseInt(e.target.value) || 7,
                  })
                }
                className="h-8 text-sm"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setShowCreatePoll(false)}
                className="flex-1 h-8 text-xs"
              >
                Cancel
              </Button>
              <Button onClick={createPoll} className="flex-1 h-8 text-xs">
                <Send className="w-3 h-3 mr-1" />
                Create Poll
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={showCreateAnnouncement}
        onOpenChange={setShowCreateAnnouncement}
      >
        <DialogContent className={createDialogClassName}>
          <DialogHeader>
            <DialogTitle className="text-sm">Create Announcement</DialogTitle>
            <DialogDescription className="text-xs">
              Share important updates with your team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="announcement-emoji" className="text-xs">
                Emoji
              </Label>
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                {emojiOptions.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() =>
                      setNewAnnouncement({
                        ...newAnnouncement,
                        emoji,
                      })
                    }
                    className={`text-base p-1 rounded border-2 transition-all ${newAnnouncement.emoji === emoji ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "border-border hover:border-blue-300"}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="announcement-message" className="text-xs">
                Message *
              </Label>
              <Textarea
                id="announcement-message"
                placeholder="What would you like to announce?"
                value={newAnnouncement.message}
                onChange={(e) =>
                  setNewAnnouncement({
                    ...newAnnouncement,
                    message: e.target.value,
                  })
                }
                rows={3}
                className="text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="announcement-priority" className="text-xs">
                  Priority
                </Label>
                <Select
                  value={newAnnouncement.priority}
                  onValueChange={(value) =>
                    setNewAnnouncement({
                      ...newAnnouncement,
                      priority: value,
                    })
                  }
                >
                  <SelectTrigger
                    id="announcement-priority"
                    className="h-8 text-xs mt-1.5"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[90]">
                    <SelectItem value="normal" className="text-xs">
                      Normal
                    </SelectItem>
                    <SelectItem value="high" className="text-xs">
                      High Priority
                    </SelectItem>
                    <SelectItem value="urgent" className="text-xs">
                      Urgent
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="announcement-category" className="text-xs">
                  Category
                </Label>
                <Select
                  value={newAnnouncement.category}
                  onValueChange={(value) =>
                    setNewAnnouncement({
                      ...newAnnouncement,
                      category: value,
                    })
                  }
                >
                  <SelectTrigger
                    id="announcement-category"
                    className="h-8 text-xs mt-1.5"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[90]">
                    <SelectItem value="general" className="text-xs">
                      General
                    </SelectItem>
                    <SelectItem value="team-events" className="text-xs">
                      Team Events
                    </SelectItem>
                    <SelectItem value="wall-of-wins" className="text-xs">
                      Wall of Wins
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setShowCreateAnnouncement(false)}
                className="flex-1 h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={createAnnouncement}
                className="flex-1 h-8 text-xs"
              >
                <Send className="w-3 h-3 mr-1" />
                Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
