import React from "react";
import { SimpleTeamMessaging } from "../office/SimpleTeamMessaging";
import { useOfficeWorkspaceData } from "../../domains/office/hooks/useOfficeWorkspaceData";
import { getStartupId } from "../../utils/startupId";
import { MessageCircle } from "lucide-react";

export default function FounderChatPage({ user, onNavigate }) {
  const office = useOfficeWorkspaceData({ user });
  const currentUserId = String(user._id ?? user.id ?? "");
  const startupId = getStartupId(user);

  if (office.loading && office.chatRoster.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-surface-page">
        <div className="space-y-2 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="font-body text-sm text-text-muted">Loading chats...</p>
        </div>
      </div>
    );
  }

  if (!office.loading && office.chatRoster.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-surface-page">
        <div className="max-w-xs space-y-3 px-4 text-center">
          <MessageCircle className="mx-auto h-12 w-12 text-surface-border" />
          <p className="font-body text-sm font-medium text-text-heading">No chats yet</p>
          <p className="font-body text-xs text-text-muted">
            Team members and interested talents will appear here once connected.
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
        teamMembers={office.chatRoster}
        strictMode={true}
      />
    </div>
  );
}
