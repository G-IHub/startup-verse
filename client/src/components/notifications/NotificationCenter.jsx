import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  Target,
  Flame,
  Users,
  MessageSquare,
  X,
  Check,
  Trash2,
  Settings,
  Calendar,
  Megaphone,
  Building2,
} from "lucide-react";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { useNotifications } from "../../contexts/NotificationContext";
import { useAuth } from "../../contexts/AuthContext";
import { parseDeepLink } from "../../app/deepLinks";
import {
  isInviteNotificationType,
  NOTIFICATION_HUB_EVENT,
} from "../../utils/inboxNormalize";
import { isFounderInboxRole, isTalentInboxRole } from "../../utils/inboxItemKind";
import { useInboxActions, resolveInboxItem } from "../../hooks/useInboxActions";
import {
  applySyntheticNotificationState,
  fetchPendingOnboarding,
  buildSyntheticPendingNotifications,
} from "../../utils/pendingOnboarding";
import { getStartupId } from "../../utils/startupId";
import NotificationInviteRow from "./NotificationInviteRow";
import InviteDetailModal from "./InviteDetailModal";
import OrgMessageComposer from "./OrgMessageComposer";

function getNotificationIcon(type) {
  switch (type) {
    case "task-assigned":
      return <Target className="h-4 w-4 text-primary" />;
    case "task-completed":
      return <CheckCircle2 className="h-4 w-4 text-status-success" />;
    case "task-blocked":
      return <AlertCircle className="h-4 w-4 text-status-error" />;
    case "deadline-approaching":
    case "deadline-overdue":
      return <Clock className="h-4 w-4 text-status-warning" />;
    case "weekly-review-reminder":
      return <Target className="h-4 w-4 text-accent" />;
    case "milestone-completed":
      return <CheckCircle2 className="h-4 w-4 text-status-success" />;
    case "outcome-achieved":
    case "outcome-partial":
      return <Target className="h-4 w-4 text-primary" />;
    case "streak-milestone":
      return <Flame className="h-4 w-4 text-status-warning" />;
    case "team-member-joined":
      return <Users className="h-4 w-4 text-primary" />;
    case "comment-added":
      return <MessageSquare className="h-4 w-4 text-text-muted" />;
    case "announcement-reaction":
      return <Users className="h-4 w-4 text-accent" />;
    case "announcement-comment":
      return <MessageSquare className="h-4 w-4 text-primary" />;
    case "event-reminder":
    case "meeting-scheduled":
      return <Calendar className="h-4 w-4 text-primary" />;
    case "org-announcement":
    case "org-announcement-urgent":
      return <Megaphone className="h-4 w-4 text-accent" />;
    default:
      return <Bell className="h-4 w-4 text-text-muted" />;
  }
}

function formatTime(date) {
  if (!date) return "Recently";
  const timestamp = typeof date === "string" ? new Date(date) : date;
  if (!timestamp || Number.isNaN(timestamp.getTime())) return "Recently";
  const diffMs = Date.now() - timestamp.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return timestamp.toLocaleDateString();
}

function getInviteIdsFromNotification(notification) {
  const meta = notification?.metadata || {};
  return {
    invitationId: meta.invitationId || meta.inviteId || null,
    interestId: meta.interestId || null,
    messageId: meta.messageId || meta.orgMessageId || null,
  };
}

function isSyntheticNotification(notification) {
  return (
    Boolean(notification?.metadata?.synthetic) ||
    String(notification?.id || "").startsWith("pending-")
  );
}

export default function NotificationCenter({ onNavigate }) {
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refreshNotifications,
  } = useNotifications();
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailIds, setDetailIds] = useState({
    invitationId: null,
    interestId: null,
    messageId: null,
  });
  const [composerOpen, setComposerOpen] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [syntheticNotifications, setSyntheticNotifications] = useState([]);
  const [pendingRefreshKey, setPendingRefreshKey] = useState(0);
  const syntheticReadIdsRef = useRef(new Set());
  const syntheticDismissedIdsRef = useRef(new Set());
  const pendingRequestIdRef = useRef(0);
  const readPendingSyntheticRefreshRef = useRef(false);
  const dismissPendingSyntheticRefreshRef = useRef(false);

  const isFounder = isFounderInboxRole(user?.role);
  const isTalent = isTalentInboxRole(user?.role);
  const founderId = user?._id || user?.id;

  useEffect(() => {
    pendingRequestIdRef.current += 1;
    syntheticReadIdsRef.current.clear();
    syntheticDismissedIdsRef.current.clear();
    readPendingSyntheticRefreshRef.current = false;
    dismissPendingSyntheticRefreshRef.current = false;
    setSyntheticNotifications([]);
    return () => {
      pendingRequestIdRef.current += 1;
    };
  }, [founderId]);

  const refreshPendingNotifications = useCallback(async () => {
    const requestId = pendingRequestIdRef.current + 1;
    pendingRequestIdRef.current = requestId;
    if (!isFounder || !founderId) {
      setSyntheticNotifications([]);
      return;
    }
    const pending = await fetchPendingOnboarding(founderId, getStartupId(user));
    if (requestId !== pendingRequestIdRef.current) return;
    const generated = buildSyntheticPendingNotifications(pending, notifications);
    if (readPendingSyntheticRefreshRef.current) {
      for (const notification of generated) {
        syntheticReadIdsRef.current.add(notification.id);
      }
      readPendingSyntheticRefreshRef.current = false;
    }
    if (dismissPendingSyntheticRefreshRef.current) {
      for (const notification of generated) {
        syntheticDismissedIdsRef.current.add(notification.id);
      }
      dismissPendingSyntheticRefreshRef.current = false;
    }
    setSyntheticNotifications(
      applySyntheticNotificationState(generated, {
        readIds: syntheticReadIdsRef.current,
        dismissedIds: syntheticDismissedIdsRef.current,
      }),
    );
  }, [isFounder, founderId, user, notifications]);

  useEffect(() => {
    void refreshPendingNotifications();
  }, [refreshPendingNotifications, pendingRefreshKey]);

  useEffect(() => {
    if (!open || !isFounder) return;
    setPendingRefreshKey((key) => key + 1);
  }, [open, isFounder]);

  const displayNotifications = useMemo(() => {
    const merged = [...notifications, ...syntheticNotifications];
    return merged.sort((a, b) => {
      const aTime = new Date(a.timestamp || a.createdAt || 0).getTime();
      const bTime = new Date(b.timestamp || b.createdAt || 0).getTime();
      return bTime - aTime;
    });
  }, [notifications, syntheticNotifications]);

  const displayUnreadCount =
    unreadCount + syntheticNotifications.filter((n) => !n.read).length;

  const inboxActions = useInboxActions({
    user,
    onNavigate,
    onItemUpdated: () => {},
  });

  useEffect(() => {
    const onHubEvent = (event) => {
      const detail = event?.detail || {};
      if (detail.open) setOpen(true);
      if (detail.composer) {
        setComposerOpen(true);
        return;
      }
      if (detail.invitationId || detail.interestId || detail.messageId) {
        setDetailIds({
          invitationId: detail.invitationId || null,
          interestId: detail.interestId || null,
          messageId: detail.messageId || null,
        });
        setDetailOpen(true);
        setOpen(false);
      }
    };
    window.addEventListener(NOTIFICATION_HUB_EVENT, onHubEvent);
    return () => window.removeEventListener(NOTIFICATION_HUB_EVENT, onHubEvent);
  }, []);

  const markNotificationRead = useCallback(
    (notification) => {
      if (isSyntheticNotification(notification)) {
        syntheticReadIdsRef.current.add(notification.id);
        setSyntheticNotifications((prev) =>
          prev.map((row) =>
            row.id === notification.id ? { ...row, read: true } : row,
          ),
        );
        return;
      }
      void markAsRead(notification.id);
    },
    [markAsRead],
  );

  const handleMarkAllAsRead = useCallback(() => {
    readPendingSyntheticRefreshRef.current = true;
    setSyntheticNotifications((prev) =>
      prev.map((notification) => {
        syntheticReadIdsRef.current.add(notification.id);
        return { ...notification, read: true };
      }),
    );
    void markAllAsRead();
  }, [markAllAsRead]);

  const handleClearAll = useCallback(() => {
    dismissPendingSyntheticRefreshRef.current = true;
    for (const notification of syntheticNotifications) {
      syntheticDismissedIdsRef.current.add(notification.id);
    }
    setSyntheticNotifications([]);
    void clearAll();
  }, [clearAll, syntheticNotifications]);

  const openInviteDetail = useCallback(
    (notification) => {
      markNotificationRead(notification);
      const ids = getInviteIdsFromNotification(notification);
      setDetailIds(ids);
      setDetailOpen(true);
      setOpen(false);
    },
    [markNotificationRead],
  );

  const handleDeleteNotification = useCallback(
    (notification) => {
      if (isSyntheticNotification(notification)) {
        syntheticDismissedIdsRef.current.add(notification.id);
        setSyntheticNotifications((prev) =>
          prev.filter((row) => row.id !== notification.id),
        );
        return;
      }
      deleteNotification(notification.id);
    },
    [deleteNotification],
  );

  const handleOnboardingComplete = useCallback(
    async (completed) => {
      const matchingServer = notifications.find((n) => {
        const meta = n.metadata || {};
        if (completed.invitationId) {
          return String(meta.invitationId || meta.inviteId || "") === completed.invitationId;
        }
        if (completed.interestId) {
          return String(meta.interestId || "") === completed.interestId;
        }
        return false;
      });
      if (matchingServer?.id) {
        await deleteNotification(matchingServer.id);
      }
      setSyntheticNotifications((prev) =>
        prev.filter((row) => {
          const meta = row.metadata || {};
          if (completed.invitationId) {
            return String(meta.invitationId || "") !== completed.invitationId;
          }
          if (completed.interestId) {
            return String(meta.interestId || "") !== completed.interestId;
          }
          return true;
        }),
      );
      await refreshNotifications();
      setPendingRefreshKey((key) => key + 1);
    },
    [notifications, deleteNotification, refreshNotifications],
  );

  const handleAlertClick = (notification) => {
    if (isInviteNotificationType(notification.type)) {
      openInviteDetail(notification);
      return;
    }

    markNotificationRead(notification);

    if (!notification.actionUrl || !onNavigate) return;

    const url = notification.actionUrl;

    if (url.includes("/room/") || url.includes("/office/room/")) {
      window.location.href = url;
      setOpen(false);
      return;
    }

    if (url.startsWith("/?") && new URLSearchParams(url.slice(2)).get("invitation")) {
      window.location.assign(url);
      setOpen(false);
      return;
    }

    const intent = parseDeepLink(
      url,
      notification.metadata || {},
      user?.role || "founder",
    );

    if (intent) {
      if (String(intent.page || "").startsWith("inbox")) {
        openInviteDetail(notification);
        return;
      }
      onNavigate(intent.page, intent.options || {});
    } else {
      onNavigate("dashboard");
    }

    setOpen(false);
  };

  const handleQuickAccept = async (notification) => {
    setActionBusy(true);
    try {
      const ids = getInviteIdsFromNotification(notification);
      const item = await resolveInboxItem({
        userId: user?._id || user?.id,
        role: user?.role,
        ...ids,
      });
      if (!item) {
        openInviteDetail(notification);
        return;
      }
      markAsRead(notification.id);
      if (item.itemType === "interest" && isFounder) {
        await inboxActions.quickAcceptInterest(item);
      } else if (item.itemType === "invitation" && isTalent) {
        setDetailIds(ids);
        setDetailOpen(true);
        setOpen(false);
        return;
      } else if (item.itemType === "organization-invitation" && isFounder) {
        await inboxActions.respondToOrgInvitation(item, "accept");
      } else {
        openInviteDetail(notification);
        return;
      }
      await deleteNotification(notification.id);
    } finally {
      setActionBusy(false);
    }
  };

  const handleQuickDecline = async (notification) => {
    setActionBusy(true);
    try {
      const ids = getInviteIdsFromNotification(notification);
      const item = await resolveInboxItem({
        userId: user?._id || user?.id,
        role: user?.role,
        ...ids,
      });
      if (!item) {
        openInviteDetail(notification);
        return;
      }
      markAsRead(notification.id);
      if (item.itemType === "interest" && isFounder) {
        await inboxActions.quickDeclineInterest(item);
      } else if (item.itemType === "invitation" && isTalent) {
        await inboxActions.respondToInvitation(item, "decline");
      } else if (item.itemType === "organization-invitation" && isFounder) {
        await inboxActions.respondToOrgInvitation(item, "decline");
      } else {
        openInviteDetail(notification);
        return;
      }
      await deleteNotification(notification.id);
    } finally {
      setActionBusy(false);
    }
  };

  const handleOpenChatFromNotification = (notification) => {
    markNotificationRead(notification);
    const meta = notification.metadata || {};
    const peerId =
      meta.talentId || meta.founderId || meta.peerUserId || meta.with || null;
    if (peerId && onNavigate) {
      const chatPage = isTalent ? "talent-chat" : "founder-chat";
      onNavigate(chatPage, { messageUserId: String(peerId) });
      setOpen(false);
      return;
    }
    openInviteDetail(notification);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild={true}>
          <Button
            variant="ghost"
            size="sm"
            data-tour="notifications"
            className="relative h-9 w-9 cursor-pointer rounded-input border border-surface-border/60 bg-surface-card p-0 shadow-none transition-all duration-200 hover:border-surface-border hover:bg-surface-page"
            aria-label="Notifications"
          >
            <Bell className="h-[17px] w-[17px] text-text-body" strokeWidth={1.75} />
            {displayUnreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-pill bg-status-error px-1 font-body text-[10px] font-semibold leading-none text-white shadow-[0_1px_4px_rgba(255,79,107,0.45)]">
                {displayUnreadCount > 9 ? "9+" : displayUnreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="flex w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-card border border-surface-border bg-surface-card p-0 shadow-card"
          align="end"
          sideOffset={8}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-surface-border/80 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-input bg-primary/10">
                <Bell className="h-4 w-4 text-primary" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="font-heading text-sm font-semibold leading-tight text-text-heading">
                  Notifications
                </h3>
                <p className="font-body text-[11px] leading-tight text-text-muted">
                  {displayUnreadCount > 0 ? `${displayUnreadCount} unread` : "All caught up"}
                </p>
              </div>
            </div>
            {displayNotifications.length > 0 && (
              <div className="flex gap-0.5">
                {displayUnreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="h-7 px-2 text-[11px] font-normal text-text-body"
                  >
                    <Check className="h-3 w-3" />
                    Mark read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearAll}
                  className="h-7 w-7 text-text-muted"
                  aria-label="Clear all notifications"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>

          {displayNotifications.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-8 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/12 to-accent/8 ring-1 ring-primary/10">
                <Bell className="h-5 w-5 text-primary/80" strokeWidth={1.5} />
              </div>
              <p className="mb-1 font-heading text-[13px] font-semibold text-text-heading">
                No notifications yet
              </p>
              <p className="max-w-[16rem] font-body text-[12px] leading-relaxed text-text-muted">
                Invites, interests, messages, and team updates will show up here
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[min(360px,50vh)]">
              <div className="px-2.5 py-2.5">
                {displayNotifications.map((notification) =>
                  isInviteNotificationType(notification.type) ? (
                    <NotificationInviteRow
                      key={notification.id}
                      notification={notification}
                      formatTime={formatTime}
                      disabled={actionBusy}
                      canQuickRespond={
                        !isSyntheticNotification(notification) &&
                        (notification.type === "interest-received" ||
                          notification.type === "talent-invitation-received" ||
                          notification.type === "cohort-invitation" ||
                          notification.type === "team-invitation")
                      }
                      onOpen={openInviteDetail}
                      onDelete={handleDeleteNotification}
                      onAccept={handleQuickAccept}
                      onDecline={handleQuickDecline}
                      onOpenChat={handleOpenChatFromNotification}
                    />
                  ) : (
                    <div
                      key={notification.id}
                      className={`group relative mb-2 cursor-pointer rounded-xl px-3 py-2.5 transition-all duration-200 ${
                        !notification.read
                          ? "border border-primary/12 bg-surface-card shadow-[0_1px_3px_rgba(58,90,254,0.06)] hover:border-primary/20 hover:shadow-[0_2px_8px_rgba(58,90,254,0.08)]"
                          : "border border-transparent bg-surface-page/50 hover:border-surface-border/60 hover:bg-surface-page"
                      }`}
                      onClick={() => handleAlertClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            !notification.read
                              ? "bg-primary/10 ring-1 ring-primary/15"
                              : "bg-surface-page ring-1 ring-surface-border/80"
                          }`}
                        >
                          {getNotificationIcon(notification.type)}
                          {!notification.read ? (
                            <span
                              className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary ring-2 ring-surface-card"
                              aria-hidden="true"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={`font-body text-[13px] leading-snug ${
                                !notification.read
                                  ? "font-semibold text-text-heading"
                                  : "font-medium text-text-body"
                              }`}
                            >
                              {notification.title}
                            </p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0 rounded-lg text-text-muted opacity-0 transition-opacity hover:bg-surface-page hover:text-text-heading group-hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNotification(notification);
                              }}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <p className="mt-1 line-clamp-2 font-body text-[12px] leading-relaxed text-text-muted">
                            {notification.message}
                          </p>
                          <p className="mt-2 font-body text-[11px] text-text-muted/80">
                            {formatTime(notification.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </ScrollArea>
          )}

          <div className="shrink-0 border-t border-surface-border/80 bg-surface-page/50 px-2 py-2">
            <div className="flex flex-col gap-0.5">
              {isFounder ? (
                <Button
                  variant="ghost"
                  className="h-8 w-full justify-start gap-2 px-2.5 text-[11px] font-normal text-text-body hover:text-text-heading"
                  size="sm"
                  onClick={() => {
                    setComposerOpen(true);
                    setOpen(false);
                  }}
                >
                  <Building2 className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                  Message organization
                </Button>
              ) : null}
              <Button
                variant="ghost"
                className="h-8 w-full justify-start gap-2 px-2.5 text-[11px] font-normal text-text-body hover:text-text-heading"
                size="sm"
                onClick={() => {
                  setOpen(false);
                  onNavigate?.("settings");
                }}
              >
                <Settings className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                Notification settings
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <InviteDetailModal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        user={user}
        onNavigate={onNavigate}
        invitationId={detailIds.invitationId}
        interestId={detailIds.interestId}
        messageId={detailIds.messageId}
        onOnboardingComplete={handleOnboardingComplete}
      />

      <OrgMessageComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        user={user}
        isSending={inboxActions.isSending}
        onSend={inboxActions.sendOrgMessage}
      />
    </>
  );
}
