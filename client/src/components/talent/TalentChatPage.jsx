import React, { useEffect, useRef, useState, useMemo } from "react";
import { getSentInterests } from "../../utils/api/inboxApi";
import { SimpleTeamMessaging } from "../office/SimpleTeamMessaging";
import { MessageCircle } from "lucide-react";

function buildRosterFromInterests(interests) {
  const byFounder = new Map();
  for (const interest of interests) {
    const fid = String(interest.founderId?._id || interest.founderId || "");
    if (!fid) continue;
    const existing = byFounder.get(fid);
    if (!existing || new Date(interest.createdAt) > new Date(existing.createdAt)) {
      byFounder.set(fid, interest);
    }
  }
  return Array.from(byFounder.values()).map((interest) => ({
    id: String(interest.founderId?._id || interest.founderId || ""),
    name: String(
      interest.founderName ||
        interest.founderId?.name ||
        interest.startupTitle ||
        "Founder"
    ),
    role: "founder",
    title: String(interest.startupTitle || ""),
    avatar: "",
    isOnline: false,
    status: "away",
  }));
}

export default function TalentChatPage({ user, onNavigate }) {
  const talentId = String(user._id ?? user.id ?? "");

  // Raw interests — only fetched once on mount, never re-fetched on re-render.
  const [rawInterests, setRawInterests] = useState(null); // null = not yet loaded
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!talentId || fetchedRef.current) return;
    fetchedRef.current = true;
    getSentInterests(talentId)
      .then((interests) => setRawInterests(Array.isArray(interests) ? interests : []))
      .catch(() => setRawInterests([]));
  }, [talentId]);

  // Stable roster — only recomputes when the set of founder IDs actually changes.
  const roster = useMemo(() => {
    if (!rawInterests) return [];
    return buildRosterFromInterests(rawInterests);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawInterests?.map((i) => String(i.founderId?._id || i.founderId || "")).join(",")]);

  // Still loading
  if (rawInterests === null) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading chats...</p>
        </div>
      </div>
    );
  }

  // Loaded but empty
  if (roster.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-3 max-w-xs px-4">
          <MessageCircle className="w-12 h-12 text-muted-foreground/40 mx-auto" />
          <p className="text-sm font-medium text-foreground">No chats yet</p>
          <p className="text-xs text-muted-foreground">
            Express interest in a startup to start chatting with the founder.
          </p>
        </div>
      </div>
    );
  }

  // SimpleTeamMessaging is mounted once and never torn down — parent re-renders
  // don't affect the conversation state inside it.
  return (
    <div className="h-full w-full">
      <SimpleTeamMessaging
        fullPage
        onClose={() => onNavigate?.("dashboard")}
        currentUserId={talentId}
        currentUserName={String(user.name || "")}
        currentUserRole="talent"
        startupId={null}
        teamMembers={roster}
        strictMode={false}
      />
    </div>
  );
}
