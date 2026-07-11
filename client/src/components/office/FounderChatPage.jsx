import React, { useEffect, useMemo, useRef, useState } from "react";
import { SimpleTeamMessaging } from "../office/SimpleTeamMessaging";
import { useOfficeWorkspaceData } from "../../domains/office/hooks/useOfficeWorkspaceData";
import { useCallCoordinator } from "../../contexts/CallCoordinatorContext";
import { getStartupId } from "../../utils/startupId";
import { MessageCircle } from "lucide-react";
import { buildFounderChatRoster } from "../../utils/chatRosterBuilder";
import * as inboxApi from "../../utils/api/inboxApi";

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
    return (
      <div className="flex h-full items-center justify-center bg-surface-page">
        <div className="space-y-2 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="font-body text-sm text-text-muted">Loading chats...</p>
        </div>
      </div>
    );
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
