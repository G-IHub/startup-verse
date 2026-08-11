import React, { useEffect } from "react";
import VirtualStartupOfficeV2 from "./VirtualStartupOfficeWorkspaceV2";
import JourneyRoadmap from "../journey/JourneyRoadmap";
import PageLoadingFallback from "../shell/PageLoadingFallback";

/**
 * Adaptive office shell. Matching is no longer embedded here —
 * founders go to dedicated Browse Talent (`team-matching`);
 * talent goes to Browse Startups.
 */
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
  winToOpen,
  onWinOpened,
}) {
  useEffect(() => {
    if (view !== "matching") return;

    const browsePage =
      user?.role === "talent" ? "browse-startups" : "team-matching";
    onNavigate?.(browsePage);
  }, [view, user?.role, onNavigate]);

  if (view === "matching") {
    return (
      <div className="flex h-full flex-col bg-background font-body">
        <div className="flex-1 overflow-auto">
          <PageLoadingFallback />
        </div>
      </div>
    );
  }

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
      </div>
    </div>
  );
}
