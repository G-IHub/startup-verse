import React, { useCallback, useEffect, useState } from "react";
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
import { Separator } from "../ui/separator";
import { useNotifications } from "../../contexts/NotificationContext";
import { useAuth } from "../../contexts/AuthContext";
import { parseDeepLink } from "../../app/deepLinks";
import {
  isInviteNotificationType,
  NOTIFICATION_HUB_EVENT,
} from "../../utils/inboxNormalize";
import { isFounderInboxRole, isTalentInboxRole } from "../../utils/inboxItemKind";
import { useInboxActions, resolveInboxItem } from "../../hooks/useInboxActions";
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

export default function NotificationCenter({ onNavigate }) {
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
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

  const isFounder = isFounderInboxRole(user?.role);
  const isTalent = isTalentInboxRole(user?.role);

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

  const openInviteDetail = useCallback((notification) => {
    markAsRead(notification.id);
    const ids = getInviteIdsFromNotification(notification);
    setDetailIds(ids);
    setDetailOpen(true);
    setOpen(false);
  }, [markAsRead]);

  const handleAlertClick = (notification) => {
    markAsRead(notification.id);

    if (isInviteNotificationType(notification.type)) {
      openInviteDetail(notification);
      return;
    }

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
    markAsRead(notification.id);
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
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-pill bg-status-error px-1 font-body text-[10px] font-semibold leading-none text-white shadow-[0_1px_4px_rgba(255,79,107,0.45)]">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[min(100vw-2rem,28rem)] overflow-hidden rounded-card border border-surface-border bg-surface-card p-0 shadow-(--shadow-soft)"
          align="end"
          sideOffset={8}
        >
          <div className="flex items-center justify-between border-b border-surface-border/80 bg-surface-page/40 px-3 py-2.5">
            <div>
              <h3 className="font-heading text-sm font-bold text-text-heading">
                Notifications
              </h3>
              <p className="font-body text-xs text-text-muted">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
              </p>
            </div>
            {notifications.length > 0 && (
              <div className="flex gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="h-7 px-2.5 text-[11px]"
                  >
                    <Check className="mr-1 h-3 w-3" />
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearAll}
                  className="h-7 w-7"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
          <ScrollArea className="h-[360px]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-10">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <p className="mb-1 font-body text-[13px] font-semibold text-text-heading">
                  No notifications yet
                </p>
                <p className="text-center font-body text-[12px] text-text-muted">
                  Invites, interests, messages, and team updates will show up here
                </p>
              </div>
            ) : (
              <div className="px-1.5 py-1.5">
                {notifications.map((notification) =>
                  isInviteNotificationType(notification.type) ? (
                    <NotificationInviteRow
                      key={notification.id}
                      notification={notification}
                      formatTime={formatTime}
                      disabled={actionBusy}
                      canQuickRespond={
                        notification.type === "interest-received" ||
                        notification.type === "talent-invitation-received" ||
                        notification.type === "cohort-invitation" ||
                        notification.type === "team-invitation"
                      }
                      onOpen={openInviteDetail}
                      onDelete={deleteNotification}
                      onAccept={handleQuickAccept}
                      onDecline={handleQuickDecline}
                      onOpenChat={handleOpenChatFromNotification}
                    />
                  ) : (
                    <div
                      key={notification.id}
                      className={`group relative mb-1.5 cursor-pointer rounded-input border border-surface-border/70 px-2.5 py-2 transition-colors hover:bg-surface-page ${
                        !notification.read
                          ? "border-primary/30 bg-primary/5"
                          : "bg-surface-card"
                      }`}
                      onClick={() => handleAlertClick(notification)}
                    >
                      <div
                        className={`absolute left-0.5 top-2.5 h-[calc(100%-1.25rem)] w-[2px] rounded-full ${
                          !notification.read ? "bg-primary/70" : "bg-transparent"
                        }`}
                      />
                      <div className="ml-1 flex items-start gap-2.5">
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-page">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={`font-body text-[13px] leading-tight ${
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
                              className="h-6 w-6 shrink-0 rounded-md opacity-60 transition-opacity hover:opacity-100 group-hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="mt-0.5 line-clamp-2 font-body text-[12px] text-text-muted">
                            {notification.message}
                          </p>
                          <p className="mt-1 font-body text-[11px] text-text-muted">
                            {formatTime(notification.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </ScrollArea>
          <Separator />
          <div className="flex flex-col gap-1 p-2">
            {isFounder ? (
              <Button
                variant="ghost"
                className="w-full justify-start text-xs"
                size="sm"
                onClick={() => {
                  setComposerOpen(true);
                  setOpen(false);
                }}
              >
                <Building2 className="mr-1 h-3 w-3" />
                Message organization
              </Button>
            ) : null}
            <Button
              variant="ghost"
              className="w-full text-xs"
              size="sm"
              onClick={() => {
                setOpen(false);
                onNavigate?.("settings");
              }}
            >
              <Settings className="mr-1 h-3 w-3" />
              Notification Settings
            </Button>
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
