import React, { useEffect, useRef, useState, useMemo } from "react";
import { getSentInterests, getReceivedInvitations } from "../../utils/api/inboxApi";
import { SimpleTeamMessaging } from "../office/SimpleTeamMessaging";
import { MessageCircle } from "lucide-react";
import { buildTalentChatRoster } from "../../utils/chatRosterBuilder";
import { Button } from "../ui/button";

export default function TalentChatPage({
  user,
  onNavigate,
  initialSelectedUserId = null,
  onInitialSelectionApplied,
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

  useEffect(() => {
    if (initialSelectedUserId && onInitialSelectionApplied) {
      onInitialSelectionApplied();
    }
  }, [initialSelectedUserId, onInitialSelectionApplied]);

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
      <div className="flex h-full w-full items-center justify-center bg-[#f4f5ff]">
          <div className="space-y-3 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-3 border-[#3a5afe] border-t-transparent" />
            <p className="font-body text-sm text-[#4a4a5a]">Loading your conversations...</p>
          </div>
      </div>
    );
  }

  if (!loading && roster.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#f4f5ff]">
          <div className="max-w-sm space-y-4 px-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-[14px] bg-[#f4f5ff] flex items-center justify-center">
              <MessageCircle className="h-8 w-8 text-[#a0a0b0]" />
            </div>
            <div>
              <p className="font-heading text-lg font-semibold text-[#0d0d0d]">No chats yet</p>
              <p className="font-body text-sm text-[#4a4a5a] mt-2 leading-relaxed">
                Express interest in startups to connect with founders, or wait for startup invitations.
              </p>
            </div>
            <Button
              onClick={() => onNavigate?.("team-matching")}
              className="mt-4 bg-[#3a5afe] hover:bg-[#304ffe] text-white rounded-[10px] px-6 py-2.5 font-body text-sm font-medium shadow-[0_4px_12px_rgba(58,90,254,0.25)] transition-all duration-200 ease"
            >
              Browse Startups
            </Button>
          </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-[#f4f5ff]">
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
          strictMode={false}
        />
      </div>
    </div>
  );
}
