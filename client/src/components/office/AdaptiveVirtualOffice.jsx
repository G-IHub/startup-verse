import React from "react";
import { Button } from "../ui/button";
import VirtualStartupOfficeV2 from "./VirtualStartupOfficeWorkspaceV2";
import JourneyRoadmap from "../journey/JourneyRoadmap";
import TeamMatching from "../TeamMatching";
export default function AdaptiveVirtualOffice({
  user,
  onNavigate,
  onUpdateUser,
  view,
  onViewChange,
  taskToOpen,
  onTaskOpened,
  announcementToOpen,
  onAnnouncementOpened,
  messageUserToOpen,
  onMessageUserOpened,
  winToOpen,
  onWinOpened,
}) {
  return (
    <div className="flex h-full flex-col bg-background font-body">
      <div className="flex-1 overflow-auto">
        {view === "workspace" && (
          <VirtualStartupOfficeV2
            user={user}
            onNavigate={onNavigate}
            onUpdateUser={onUpdateUser}
            taskToOpen={taskToOpen}
            onTaskOpened={onTaskOpened}
            announcementToOpen={announcementToOpen}
            onAnnouncementOpened={onAnnouncementOpened}
            messageUserToOpen={messageUserToOpen}
            onMessageUserOpened={onMessageUserOpened}
            winToOpen={winToOpen}
            onWinOpened={onWinOpened}
          />
        )}
        {view === "journey" && (
          <JourneyRoadmap
            user={user}
            onNavigateToStage={(stage) => onNavigate(stage)}
          />
        )}
        {view === "matching" && (
          user?.role === "talent" ? (
            <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-border bg-card p-6">
              <h3 className="text-xl font-semibold text-foreground">
                Browse Opportunities From Talent Home
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Talent browsing is now canonical on Home. Use Browse/Home to
                open opportunities and send interest from one flow.
              </p>
              <div className="mt-4">
                <Button
                  type="button"
                  onClick={() => onNavigate("team-matching")}
                >
                  Open Browse
                </Button>
              </div>
            </div>
          ) : (
            <TeamMatching user={user} onNavigate={onNavigate} />
          )
        )}
      </div>
    </div>
  );
}
