import React, { useEffect, useMemo, useRef, useState } from "react";
import { SimpleTeamMessaging } from "../office/SimpleTeamMessaging";
import { useOfficeWorkspaceData } from "../../domains/office/hooks/useOfficeWorkspaceData";
import { useCallCoordinator } from "../../contexts/CallCoordinatorContext";
import { getStartupId } from "../../utils/startupId";
import { MessageCircle } from "lucide-react";
import { buildFounderChatRoster } from "../../utils/chatRosterBuilder";
import * as inboxApi from "../../utils/api/inboxApi";

/** List/roster-shaped skeleton while chat connections load. */
function FounderChatRosterSkeleton() {
  return (
    <div
      className="flex h-full bg-surface-page"
      role="status"
      aria-live="polite"
      aria-label="Loading chats"
    >
      <div className="flex w-full max-w-sm flex-col border-r border-surface-border bg-surface-card sm:max-w-xs">
        <div className="animate-pulse space-y-3 border-b border-surface-border px-4 py-4">
          <div className="h-4 w-24 rounded bg-surface-border/70" />
          <div className="h-9 w-full rounded-input bg-surface-border/50" />
        </div>
        <div className="animate-pulse flex-1 space-y-1 p-2">
          {Array.from({ length: 7 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-input px-3 py-2.5"
            >
              <div className="h-10 w-10 shrink-0 rounded-full bg-surface-border/80" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3.5 w-28 rounded bg-surface-border" />
                <div className="h-3 w-40 max-w-full rounded bg-surface-border/60" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="hidden flex-1 animate-pulse flex-col sm:flex">
        <div className="border-b border-surface-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-surface-border/80" />
            <div className="space-y-2">
              <div className="h-4 w-32 rounded bg-surface-border" />
              <div className="h-3 w-20 rounded bg-surface-border/60" />
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-end gap-3 p-5">
          <div className="ml-auto h-10 w-48 rounded-input bg-surface-border/40" />
          <div className="h-10 w-56 rounded-input bg-surface-border/50" />
          <div className="ml-auto h-10 w-40 rounded-input bg-surface-border/35" />
        </div>
        <div className="border-t border-surface-border px-5 py-3">
          <div className="h-10 w-full rounded-input bg-surface-border/50" />
        </div>
      </div>
    </div>
  );
}

export default function FounderChatPage({
  user,
  onNavigate,
  initialSelectedUserId = null,
}) {
  const currentUserId = String(user._id ?? user.id ?? "");
  const startupId = getStartupId(user);
  const office = useOfficeWorkspaceData({ user });
  const { startDirectCall, registerTeamRoster } = useCallCoordinator();

  // Fetch interests and invitations
  const [receivedInterests, setReceivedInterests] = useState([]);
  const [sentInvitations, setSentInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!currentUserId || fetchedRef.current) return;
    fetchedRef.current = true;

    const loadData = async () => {
      try {
        const [interests, invitations] = await Promise.all([
          inboxApi.getReceivedInterests(currentUserId),
          inboxApi.getSentInvitations(currentUserId),
        ]);
        setReceivedInterests(interests || []);
        setSentInvitations(invitations || []);
      } catch (err) {
        console.warn("Failed to load chat connections:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUserId]);

  // Build unified roster combining interests, invitations, and team members
  const roster = useMemo(() => {
    return buildFounderChatRoster(
      currentUserId,
      receivedInterests,
      sentInvitations,
      office.chatRoster,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentUserId,
    receivedInterests.map((i) => String(i._id || i.id)).join(","),
    sentInvitations.map((i) => String(i._id || i.id)).join(","),
    office.chatRoster.map((m) => m.id).join(","),
  ]);

  useEffect(() => {
    registerTeamRoster(roster);
  }, [roster, registerTeamRoster]);

  const isLoading = loading || (office.loading && roster.length === 0);

  if (isLoading) {
    return <FounderChatRosterSkeleton />;
  }

  if (!isLoading && roster.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-surface-page">
        <div className="max-w-xs space-y-3 px-4 text-center">
          <MessageCircle className="mx-auto h-12 w-12 text-surface-border" />
          <p className="font-body text-sm font-medium text-text-heading">No chats yet</p>
          <p className="font-body text-xs text-text-muted">
            Browse talent to send invites, or wait for talents to express interest in your startup.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-surface-page">
      <SimpleTeamMessaging
        fullPage
        onClose={() => onNavigate?.("startup-office")}
        currentUserId={currentUserId}
        currentUserName={String(user.name || "")}
        currentUserRole={user.role}
        startupId={startupId}
        teamMembers={roster}
        initialSelectedUserId={initialSelectedUserId}
        onSelectedPeerChange={(peerUserId) => {
          onNavigate?.(
            "founder-chat",
            peerUserId ? { messageUserId: peerUserId } : {},
          );
        }}
        onStartVideoCall={(peerUserId) => startDirectCall(peerUserId)}
        strictMode={true}
        onViewPeerProfile={(peerUserId) => {
          if (!peerUserId) return;
          onNavigate?.("talent-profile", {
            talentId: peerUserId,
            returnToChat: true,
            profileFromChat: true,
            messageUserId: peerUserId,
          });
        }}
      />
    </div>
  );
}
