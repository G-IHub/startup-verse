import React from "react";
import VirtualStartupOffice from "./VirtualStartupOfficeWorkspace";
import JourneyRoadmap from "../journey/JourneyRoadmap";
import TeamMatching from "../TeamMatching";
export default function AdaptiveVirtualOffice({
  user,
  onNavigate,
  view,
  onViewChange,
  taskToOpen,
  onTaskOpened,
  announcementToOpen,
  onAnnouncementOpened,
  messageUserToOpen,
  onMessageUserOpened,
}) {
  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex-1 overflow-auto">
        {view === "workspace" && (
          <VirtualStartupOffice
            user={user}
            onNavigate={onNavigate}
            taskToOpen={taskToOpen}
            onTaskOpened={onTaskOpened}
            announcementToOpen={announcementToOpen}
            onAnnouncementOpened={onAnnouncementOpened}
            messageUserToOpen={messageUserToOpen}
            onMessageUserOpened={onMessageUserOpened}
          />
        )}
        {view === "journey" && (
          <JourneyRoadmap onNavigateToStage={(stage) => onNavigate(stage)} />
        )}
        {view === "matching" && (
          <TeamMatching user={user} onNavigate={onNavigate} />
        )}
      </div>
    </div>
  );
}
