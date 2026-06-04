import React from "react";
import {
  CheckCircle2,
  Eye,
  MessageCircle,
  MoreHorizontal,
  Trash2,
  XCircle,
  MailOpen,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  isOrgInboxMessage,
  isInboxInterest,
  isInboxInvitation,
  isFounderInboxRole,
  isTalentInboxRole,
} from "../utils/inboxItemKind";

const isOrgInvitation = (item) =>
  item?.itemType === "organization-invitation";

export function InboxItemMenu({
  item,
  activeTab,
  userRole,
  isFounderInboxUser: isFounderProp,
  isTalentInboxUser: isTalentProp,
  isNew,
  hasNavigate,
  disabled,
  onMarkRead,
  onOpenChat,
  onViewProfile,
  onAccept,
  onDecline,
  onDelete,
  onOpenDetail,
}) {
  const stop = (e) => e.stopPropagation();

  const isFounder =
    isFounderProp ?? isFounderInboxRole(userRole);
  const isTalent =
    isTalentProp ?? isTalentInboxRole(userRole);

  const isPending = item?.status === "pending";
  const interest = isInboxInterest(item);
  const invitation = isInboxInvitation(item);
  const orgMessage = isOrgInboxMessage(item);

  if (orgMessage) {
    const orgActions = [
      isNew && onMarkRead,
      onOpenDetail,
      onDelete,
    ].some(Boolean);
    if (!orgActions) return null;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 shrink-0 p-0 text-text-muted hover:text-text-heading"
            disabled={disabled}
            onClick={stop}
            aria-label="Message actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48" onClick={stop}>
          {isNew && onMarkRead ? (
            <DropdownMenuItem onClick={onMarkRead}>
              <MailOpen className="mr-2 h-4 w-4" />
              Mark as read
            </DropdownMenuItem>
          ) : null}
          {onOpenDetail ? (
            <DropdownMenuItem onClick={onOpenDetail}>
              <Eye className="mr-2 h-4 w-4" />
              View message
            </DropdownMenuItem>
          ) : null}
          {onDelete ? (
            <>
              {(isNew && onMarkRead) || onOpenDetail ? (
                <DropdownMenuSeparator />
              ) : null}
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  const showChat =
    hasNavigate &&
    ((isFounder && interest && activeTab === "received") ||
      (isTalent && invitation && activeTab === "received"));

  const showProfile =
    hasNavigate && isFounder && interest && activeTab === "received";

  const showAcceptDecline =
    isPending &&
    ((isFounder && interest && activeTab === "received") ||
      (isTalent && invitation && activeTab === "received") ||
      (isFounder && isOrgInvitation(item) && activeTab === "received"));

  const showWithdraw =
    isPending &&
    activeTab === "sent" &&
    (interest || invitation);

  const showDelete =
    item?.status !== "accepted" && (interest || invitation);

  const hasActions =
    showChat ||
    showProfile ||
    showAcceptDecline ||
    showWithdraw ||
    showDelete ||
    (isNew && onMarkRead);

  if (!hasActions) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 shrink-0 p-0 text-text-muted hover:text-text-heading"
          disabled={disabled}
          onClick={stop}
          aria-label="Inbox item actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52" onClick={stop}>
        {isNew && onMarkRead ? (
          <DropdownMenuItem onClick={onMarkRead}>
            <MailOpen className="mr-2 h-4 w-4" />
            Mark as read
          </DropdownMenuItem>
        ) : null}
        {showChat ? (
          <DropdownMenuItem onClick={onOpenChat}>
            <MessageCircle className="mr-2 h-4 w-4" />
            Open chat
          </DropdownMenuItem>
        ) : null}
        {showProfile ? (
          <DropdownMenuItem onClick={onViewProfile}>
            <Eye className="mr-2 h-4 w-4" />
            View profile
          </DropdownMenuItem>
        ) : null}
        {showAcceptDecline ? (
          <>
            {(isNew && onMarkRead) || showChat || showProfile ? (
              <DropdownMenuSeparator />
            ) : null}
            <DropdownMenuItem onClick={onAccept}>
              <CheckCircle2 className="mr-2 h-4 w-4 text-status-success" />
              Accept
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDecline}>
              <XCircle className="mr-2 h-4 w-4 text-status-error" />
              Decline
            </DropdownMenuItem>
          </>
        ) : null}
        {showWithdraw || showDelete ? (
          <>
            <DropdownMenuSeparator />
            {showWithdraw && onDecline ? (
              <DropdownMenuItem onClick={onDecline}>
                <XCircle className="mr-2 h-4 w-4" />
                Withdraw
              </DropdownMenuItem>
            ) : null}
            {showDelete ? (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            ) : null}
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default InboxItemMenu;
