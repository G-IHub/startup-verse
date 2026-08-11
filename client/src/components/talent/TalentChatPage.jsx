import React, { useEffect, useRef, useState, useMemo } from "react";
import { getSentInterests, getReceivedInvitations } from "../../utils/api/inboxApi";
import { SimpleTeamMessaging } from "../office/SimpleTeamMessaging";
import { MessageCircle } from "lucide-react";
import { buildTalentChatRoster } from "../../utils/chatRosterBuilder";
import { Button } from "../ui/button";
import EmptyStateBlock from "../organizations/_primitives/EmptyStateBlock";
import { SETTINGS_CARD } from "../settings/SettingsPrimitives";
import { authBtnPrimary } from "../auth/AuthPrimitives";
import { cn } from "../ui/utils";

function ChatRosterSkeleton({ count = 6 }) {
  return (
    <div
      className="flex h-full w-full overflow-hidden rounded-card border border-surface-border bg-surface-card shadow-soft"
      aria-busy="true"
      aria-label="Loading conversations"
    >
      <aside className="flex w-full max-w-[280px] flex-col border-r border-surface-border bg-surface-page">
        <div className="animate-pulse space-y-3 border-b border-surface-border px-4 py-4">
          <div className="h-4 w-28 rounded bg-surface-border/50" />
          <div className="h-9 w-full rounded-input bg-surface-border/40" />
        </div>
        <ul className="flex-1 space-y-1 overflow-hidden p-2">
          {Array.from({ length: count }, (_, i) => (
            <li
              key={i}
              className="animate-pulse flex items-center gap-3 rounded-input px-3 py-2.5"
            >
              <div className="h-10 w-10 shrink-0 rounded-full bg-surface-border/60" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3.5 w-2/3 rounded bg-surface-border/50" />
                <div className="h-3 w-4/5 rounded bg-surface-border/35" />
              </div>
            </li>
          ))}
        </ul>
      </aside>
      <div className="hidden min-w-0 flex-1 animate-pulse flex-col sm:flex">
        <div className="flex items-center gap-3 border-b border-surface-border px-5 py-4">
          <div className="h-10 w-10 rounded-full bg-surface-border/50" />
          <div className="space-y-2">
            <div className="h-4 w-32 rounded bg-surface-border/50" />
            <div className="h-3 w-20 rounded bg-surface-border/35" />
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-end gap-3 p-5">
          <div className="ml-auto h-10 w-2/5 rounded-input bg-surface-border/30" />
          <div className="h-10 w-1/2 rounded-input bg-surface-border/35" />
          <div className="ml-auto h-10 w-1/3 rounded-input bg-surface-border/30" />
        </div>
        <div className="border-t border-surface-border p-4">
          <div className="h-10 w-full rounded-input bg-surface-border/40" />
        </div>
      </div>
    </div>
  );
}

export default function TalentChatPage({
  user,
  onNavigate,
  initialSelectedUserId = null,
}) {
  const talentId = String(user._id ?? user.id ?? "");

  // Fetch both sent interests and received invitations
  const [sentInterests, setSentInterests] = useState([]);
  const [receivedInvitations, setReceivedInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!talentId || fetchedRef.current) return;
    fetchedRef.current = true;

    const loadData = async () => {
      try {
        const [interests, invitations] = await Promise.all([
          getSentInterests(talentId),
          getReceivedInvitations(talentId),
        ]);
        setSentInterests(interests || []);
        setReceivedInvitations(invitations || []);
      } catch (err) {
        console.warn("Failed to load chat connections:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [talentId]);

  // Build unified roster combining interests and invitations
  const roster = useMemo(() => {
    return buildTalentChatRoster(talentId, sentInterests, receivedInvitations);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    talentId,
    sentInterests.map((i) => String(i._id || i.id)).join(","),
    receivedInvitations.map((i) => String(i._id || i.id)).join(","),
  ]);

  if (loading) {
    return (
      <div className="flex h-full w-full bg-surface-page p-2 md:p-3">
        <ChatRosterSkeleton />
      </div>
    );
  }

  if (!loading && roster.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-surface-page p-4">
        <div className={cn("w-full max-w-md overflow-hidden", SETTINGS_CARD)}>
          <EmptyStateBlock
            icon={MessageCircle}
            tone="info"
            title="No chats yet"
            description="Express interest in startups to connect with founders, or wait for startup invitations."
            className="min-h-[240px] rounded-none bg-transparent"
            action={
              <Button
                onClick={() => onNavigate?.("team-matching")}
                className={cn("mt-1", authBtnPrimary)}
              >
                Browse Startups
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-surface-page">
      <div className="flex-1 overflow-hidden">
        <SimpleTeamMessaging
          fullPage
          onClose={() => onNavigate?.("dashboard")}
          currentUserId={talentId}
          currentUserName={String(user.name || "")}
          currentUserRole="talent"
          startupId={null}
          teamMembers={roster}
          initialSelectedUserId={initialSelectedUserId}
          onSelectedPeerChange={(peerUserId) => {
            onNavigate?.(
              "talent-chat",
              peerUserId ? { messageUserId: peerUserId } : {},
            );
          }}
          onViewPeerProfile={(peerUserId) => {
            if (!peerUserId) return;
            const peer = roster.find((member) => member.id === peerUserId);
            const startupId = String(peer?.startupId || "");
            if (!startupId) return;
            onNavigate?.("startup-detail", {
              startupId,
              returnToChat: true,
              profileFromChat: true,
              messageUserId: peerUserId,
              founderUserId: peerUserId,
            });
          }}
          strictMode={false}
        />
      </div>
    </div>
  );
}
