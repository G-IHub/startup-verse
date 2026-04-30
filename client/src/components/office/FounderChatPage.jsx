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
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading chats...</p>
        </div>
      </div>
    );
  }

  if (!office.loading && office.chatRoster.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-3 max-w-xs px-4">
          <MessageCircle className="w-12 h-12 text-muted-foreground/40 mx-auto" />
          <p className="text-sm font-medium text-foreground">No chats yet</p>
          <p className="text-xs text-muted-foreground">
            Team members and interested talents will appear here once connected.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
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
