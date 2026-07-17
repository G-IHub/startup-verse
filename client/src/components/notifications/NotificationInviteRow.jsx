import React from "react";
import {
  Building2,
  Check,
  Heart,
  Megaphone,
  UserPlus,
  X,
  MoreHorizontal,
  MessageCircle,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { isInviteNotificationType } from "../../utils/inboxNormalize";

function InviteTypeIcon({ type }) {
  switch (type) {
    case "interest-received":
      return <Heart className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />;
    case "talent-invitation-received":
    case "team-invitation":
    case "invitation-accepted":
      return <UserPlus className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />;
    case "cohort-invitation":
    case "cohort-invitation-expiring":
    case "cohort-invitation-response":
      return <Building2 className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />;
    case "org-announcement":
    case "org-announcement-urgent":
    case "message-received":
      return <Megaphone className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />;
    default:
      return <UserPlus className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />;
  }
}

/**
 * Modern compact row for invite / interest / org notifications in the bell panel.
 */
export default function NotificationInviteRow({
  notification,
  formatTime,
  onOpen,
  onDelete,
  onAccept,
  onDecline,
  onOpenChat,
  canQuickRespond = false,
  disabled = false,
}) {
  if (!isInviteNotificationType(notification.type)) return null;

  const pending =
    canQuickRespond &&
    (notification.type === "interest-received" ||
      notification.type === "talent-invitation-received" ||
      notification.type === "cohort-invitation" ||
      notification.type === "team-invitation");

  return (
    <div
      className={`group relative mb-2 cursor-pointer rounded-xl px-3 py-2.5 transition-all duration-200 ${
        !notification.read
          ? "border border-primary/12 bg-surface-card shadow-[0_1px_3px_rgba(58,90,254,0.06)] hover:border-primary/20 hover:shadow-[0_2px_8px_rgba(58,90,254,0.08)]"
          : "border border-transparent bg-surface-page/50 hover:border-surface-border/60 hover:bg-surface-page"
      }`}
      onClick={() => onOpen?.(notification)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen?.(notification);
        }
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className={`relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            !notification.read
              ? "bg-primary/10 ring-1 ring-primary/15"
              : "bg-surface-page ring-1 ring-surface-border/80"
          }`}
        >
          <InviteTypeIcon type={notification.type} />
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
            <div className="flex shrink-0 items-center gap-0.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg text-text-muted opacity-0 transition-opacity hover:bg-surface-page hover:text-text-heading group-hover:opacity-100 data-[state=open]:opacity-100"
                    disabled={disabled}
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Invite actions"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {onOpenChat ? (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenChat(notification);
                      }}
                    >
                      <MessageCircle className="mr-2 h-3.5 w-3.5" />
                      Open chat
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpen?.(notification);
                    }}
                  >
                    Review
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-status-error focus:text-status-error"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(notification);
                    }}
                  >
                    <X className="mr-2 h-3.5 w-3.5" />
                    Dismiss
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <p className="mt-1 line-clamp-2 font-body text-[12px] leading-relaxed text-text-muted">
            {notification.message}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <p className="font-body text-[11px] text-text-muted/80">
              {formatTime(notification.timestamp)}
            </p>
            {pending ? (
              <div className="ml-auto flex items-center gap-1">
                <Button
                  type="button"
                  size="sm"
                  className="h-6 rounded-lg bg-primary px-2.5 font-body text-[10px] font-semibold text-white hover:bg-primary-hover"
                  disabled={disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAccept?.(notification);
                  }}
                >
                  <Check className="mr-0.5 h-3 w-3" />
                  Accept
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-6 rounded-lg border-surface-border px-2.5 font-body text-[10px] font-semibold text-text-body hover:border-primary hover:bg-primary-tint hover:text-primary"
                  disabled={disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDecline?.(notification);
                  }}
                >
                  Decline
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
