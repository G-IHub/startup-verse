import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import {
  Building2,
  Users,
  TrendingUp,
  Target,
  Calendar,
  CheckCircle2,
} from "lucide-react";

// Using a relaxed type since the actual data structure from CohortDashboard
// doesn't fully match the types/organizations.ts definition

export default function StartupSnapshotModal({ isOpen, onClose, startup }) {
  // Guard against undefined data
  if (!startup) {
    return null;
  }

  // Calculate activity status based on the status field
  const getActivityStatus = () => {
    const status = startup.status || "unknown";
    switch (status.toLowerCase()) {
      case "active":
        return {
          label: "Active",
          color:
            "text-green-600 bg-green-100 dark:bg-green-950 border-green-300",
        };
      case "slowing":
        return {
          label: "Slowing",
          color:
            "text-yellow-600 bg-yellow-100 dark:bg-yellow-950 border-yellow-300",
        };
      case "stalled":
        return {
          label: "Stalled",
          color: "text-red-600 bg-red-100 dark:bg-red-950 border-red-300",
        };
      default:
        return {
          label: "Unknown",
          color: "text-gray-600 bg-gray-100 dark:bg-gray-950 border-gray-300",
        };
    }
  };
  const activityStatus = getActivityStatus();
  const executionSummary = startup.executionSummary || {};
  const activitySummary = startup.activitySummary || {};
  const contributionBalance = startup.contributionBalance || {};
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            {startup.startupName || "Startup"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {startup.founderName && `${startup.founderName} • `}
            {startup.founderEmail || ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 bg-muted/30 rounded-lg border">
              <p className="text-[9px] text-muted-foreground uppercase mb-1">
                Activity Status
              </p>
              <Badge className={`text-[9px] ${activityStatus.color}`}>
                {activityStatus.label}
              </Badge>
            </div>
            <div className="p-2.5 bg-muted/30 rounded-lg border">
              <p className="text-[9px] text-muted-foreground uppercase mb-1">
                Team Size
              </p>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 text-primary" />
                <span className="text-sm font-bold">
                  {startup.teamSize || 1}
                </span>
              </div>
            </div>
          </div>
          {startup.stageName && (
            <div className="p-2.5 bg-muted/30 rounded-lg border">
              <p className="text-[9px] text-muted-foreground uppercase mb-1">
                Current Stage
              </p>
              <Badge variant="outline" className="text-[9px]">
                {startup.currentStage && `Stage ${startup.currentStage}: `}
                {startup.stageName}
              </Badge>
            </div>
          )}
          {executionSummary && (
            <div className="p-2.5 bg-muted/30 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-3.5 h-3.5 text-primary" />
                <h3 className="text-xs font-semibold">Execution Metrics</h3>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="p-1.5 bg-background rounded border text-center">
                  <p className="text-[9px] text-muted-foreground uppercase">
                    Weekly Streak
                  </p>
                  <p className="text-sm font-bold text-primary">
                    {executionSummary.weeklyStreak || 0}
                  </p>
                </div>
                {executionSummary.milestonesCompleted !== undefined && (
                  <div className="p-1.5 bg-background rounded border text-center">
                    <p className="text-[9px] text-muted-foreground uppercase">
                      Milestones
                    </p>
                    <p className="text-sm font-bold">
                      {executionSummary.milestonesCompleted || 0}
                    </p>
                  </div>
                )}
                {executionSummary.tasksCompletedThisWeek !== undefined && (
                  <div className="p-1.5 bg-background rounded border text-center">
                    <p className="text-[9px] text-muted-foreground uppercase">
                      This Week
                    </p>
                    <p className="text-sm font-bold text-green-600">
                      {executionSummary.tasksCompletedThisWeek || 0}
                    </p>
                  </div>
                )}
              </div>
              {executionSummary.currentOutcome && (
                <div className="p-2 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-[9px] text-muted-foreground uppercase mb-1">
                    Current Outcome
                  </p>
                  <p className="text-xs font-medium mb-2">
                    {executionSummary.currentOutcome.title}
                  </p>
                  {executionSummary.currentOutcome.progress !== undefined && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[9px]">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                          {executionSummary.currentOutcome.progress}%
                        </span>
                      </div>
                      <Progress
                        value={executionSummary.currentOutcome.progress}
                        className="h-1.5"
                      />
                    </div>
                  )}
                  {executionSummary.currentOutcome.milestonesComplete !==
                    undefined &&
                    executionSummary.currentOutcome.milestonesTotal !==
                      undefined && (
                      <div className="flex items-center justify-between text-[9px] mt-1.5">
                        <span className="text-muted-foreground">
                          Milestones
                        </span>
                        <span className="font-medium">
                          {executionSummary.currentOutcome.milestonesComplete}/
                          {executionSummary.currentOutcome.milestonesTotal}
                          {" complete"}
                        </span>
                      </div>
                    )}
                </div>
              )}
            </div>
          )}
          {activitySummary && Object.keys(activitySummary).length > 0 && (
            <div className="p-2.5 bg-muted/30 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <h3 className="text-xs font-semibold">
                  Recent Activity (30 days)
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {activitySummary.totalTasks !== undefined && (
                  <div className="p-1.5 bg-background rounded border">
                    <p className="text-[9px] text-muted-foreground uppercase">
                      Total Tasks
                    </p>
                    <p className="text-sm font-bold">
                      {activitySummary.totalTasks}
                    </p>
                  </div>
                )}
                {activitySummary.completedTasks !== undefined && (
                  <div className="p-1.5 bg-background rounded border">
                    <p className="text-[9px] text-muted-foreground uppercase">
                      Completed
                    </p>
                    <p className="text-sm font-bold text-green-600">
                      {activitySummary.completedTasks}
                    </p>
                  </div>
                )}
              </div>
              {activitySummary.lastActivityAt && (
                <p className="text-[9px] text-muted-foreground mt-2">
                  {"Last activity: "}
                  {new Date(activitySummary.lastActivityAt).toLocaleString()}
                </p>
              )}
            </div>
          )}
          {startup.lastActivity && !activitySummary?.lastActivityAt && (
            <div className="p-2.5 bg-muted/30 rounded-lg border">
              <p className="text-[9px] text-muted-foreground uppercase mb-1">
                Last Activity
              </p>
              <p className="text-xs">
                {new Date(startup.lastActivity).toLocaleString()}
              </p>
            </div>
          )}
          {startup.joinedCohortAt && (
            <div className="p-2.5 bg-muted/30 rounded-lg border">
              <p className="text-[9px] text-muted-foreground uppercase mb-1">
                Joined Cohort
              </p>
              <p className="text-xs">
                {new Date(startup.joinedCohortAt).toLocaleDateString()}
              </p>
            </div>
          )}
          {startup.teamMembers && startup.teamMembers.length > 0 && (
            <div className="p-2.5 bg-muted/30 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-3.5 h-3.5 text-primary" />
                <h3 className="text-xs font-semibold">
                  Team ({startup.teamMembers.length})
                </h3>
              </div>
              <div className="space-y-1">
                {startup.teamMembers.map((member, index) => (
                  <div
                    key={member.id || index}
                    className="flex items-center justify-between p-1.5 bg-background rounded border"
                  >
                    <div>
                      <p className="text-[10px] font-medium">{member.name}</p>
                      {member.role && (
                        <p className="text-[9px] text-muted-foreground">
                          {member.role}
                        </p>
                      )}
                    </div>
                    {member.joinedAt && (
                      <p className="text-[9px] text-muted-foreground">
                        {"Joined "}
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {contributionBalance.topContributor && (
            <div className="p-2.5 bg-muted/30 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                <h3 className="text-xs font-semibold">Contribution Balance</h3>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground">
                    Top Contributor
                  </p>
                  <p className="text-[10px] font-medium">
                    {contributionBalance.topContributor.name}
                    {" ("}
                    {contributionBalance.topContributor.percentage}%)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {contributionBalance.isBalanced ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-green-600" />
                      <p className="text-[10px] text-green-600">
                        Well-balanced team contributions
                      </p>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-3 h-3 text-yellow-600" />
                      <p className="text-[10px] text-yellow-600">
                        Single contributor dominating
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
            <p className="text-[10px] text-blue-900 dark:text-blue-100">
              <strong>Privacy Note:</strong>
              {
                " This is a read-only aggregate view based on execution signals. Individual task details and sensitive data are protected."
              }
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
