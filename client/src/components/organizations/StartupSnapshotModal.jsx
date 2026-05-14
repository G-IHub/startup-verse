import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Building2,
  Users,
  TrendingUp,
  Target,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import {
  StatusBadge,
  BrandProgress,
  ListRow,
} from "./_primitives";

const PANEL =
  "rounded-input border border-surface-border bg-surface-page p-3";
const MICRO_LABEL =
  "font-body text-[12px] font-semibold uppercase tracking-wide text-text-muted";

export default function StartupSnapshotModal({ isOpen, onClose, startup }) {
  if (!startup) return null;

  const status = (startup.status || "unknown").toLowerCase();
  const executionSummary = startup.executionSummary || {};
  const activitySummary = startup.activitySummary || {};
  const contributionBalance = startup.contributionBalance || {};

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading text-[18px] font-bold text-text-heading">
            <Building2 className="h-5 w-5 text-primary" />
            {startup.startupName || "Startup"}
          </DialogTitle>
          <DialogDescription className="font-body text-[13px] text-text-body">
            {startup.founderName && `${startup.founderName} • `}
            {startup.founderEmail || ""}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-3 font-body">
          <div className="grid grid-cols-2 gap-2">
            <div className={PANEL}>
              <p className={`${MICRO_LABEL} mb-1`}>Activity Status</p>
              <StatusBadge status={status} />
            </div>
            <div className={PANEL}>
              <p className={`${MICRO_LABEL} mb-1`}>Team Size</p>
              <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-primary" />
                <span className="font-heading text-[18px] font-bold text-text-heading">
                  {startup.teamSize || 1}
                </span>
              </div>
            </div>
          </div>

          {startup.stageName && (
            <div className={PANEL}>
              <p className={`${MICRO_LABEL} mb-1`}>Current Stage</p>
              <StatusBadge
                tone="info"
                label={
                  startup.currentStage
                    ? `Stage ${startup.currentStage}: ${startup.stageName}`
                    : startup.stageName
                }
              />
            </div>
          )}

          {executionSummary && (
            <div className={PANEL}>
              <div className="mb-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <h3 className="font-heading text-[14px] font-semibold text-text-heading">
                  Execution Metrics
                </h3>
              </div>
              <div className="mb-3 grid grid-cols-3 gap-2">
                <div className="rounded-input border border-surface-border bg-white p-2 text-center">
                  <p className={MICRO_LABEL}>Weekly Streak</p>
                  <p className="font-heading text-[18px] font-bold text-primary">
                    {executionSummary.weeklyStreak || 0}
                  </p>
                </div>
                {executionSummary.milestonesCompleted !== undefined && (
                  <div className="rounded-input border border-surface-border bg-white p-2 text-center">
                    <p className={MICRO_LABEL}>Milestones</p>
                    <p className="font-heading text-[18px] font-bold text-text-heading">
                      {executionSummary.milestonesCompleted || 0}
                    </p>
                  </div>
                )}
                {executionSummary.tasksCompletedThisWeek !== undefined && (
                  <div className="rounded-input border border-surface-border bg-white p-2 text-center">
                    <p className={MICRO_LABEL}>This Week</p>
                    <p className="font-heading text-[18px] font-bold text-[#00c896]">
                      {executionSummary.tasksCompletedThisWeek || 0}
                    </p>
                  </div>
                )}
              </div>

              {executionSummary.currentOutcome && (
                <div className="rounded-input border border-primary/20 bg-primary-tint p-3">
                  <p className={`${MICRO_LABEL} mb-1`}>Current Outcome</p>
                  <p className="mb-2 font-body text-[13px] font-medium text-text-heading">
                    {executionSummary.currentOutcome.title}
                  </p>
                  {executionSummary.currentOutcome.progress !== undefined && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between font-body text-[12px]">
                        <span className="text-text-muted">Progress</span>
                        <span className="font-medium text-text-heading">
                          {executionSummary.currentOutcome.progress}%
                        </span>
                      </div>
                      <BrandProgress
                        value={executionSummary.currentOutcome.progress}
                        size="sm"
                      />
                    </div>
                  )}
                  {executionSummary.currentOutcome.milestonesComplete !==
                    undefined &&
                    executionSummary.currentOutcome.milestonesTotal !==
                      undefined && (
                      <div className="mt-1.5 flex items-center justify-between font-body text-[12px]">
                        <span className="text-text-muted">Milestones</span>
                        <span className="font-medium text-text-heading">
                          {executionSummary.currentOutcome.milestonesComplete}/
                          {executionSummary.currentOutcome.milestonesTotal}{" "}
                          complete
                        </span>
                      </div>
                    )}
                </div>
              )}
            </div>
          )}

          {activitySummary && Object.keys(activitySummary).length > 0 && (
            <div className={PANEL}>
              <div className="mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <h3 className="font-heading text-[14px] font-semibold text-text-heading">
                  Recent Activity (30 days)
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {activitySummary.totalTasks !== undefined && (
                  <div className="rounded-input border border-surface-border bg-white p-2">
                    <p className={MICRO_LABEL}>Total Tasks</p>
                    <p className="font-heading text-[18px] font-bold text-text-heading">
                      {activitySummary.totalTasks}
                    </p>
                  </div>
                )}
                {activitySummary.completedTasks !== undefined && (
                  <div className="rounded-input border border-surface-border bg-white p-2">
                    <p className={MICRO_LABEL}>Completed</p>
                    <p className="font-heading text-[18px] font-bold text-[#00c896]">
                      {activitySummary.completedTasks}
                    </p>
                  </div>
                )}
              </div>
              {activitySummary.lastActivityAt && (
                <p className="mt-2 font-body text-[12px] text-text-muted">
                  Last activity:{" "}
                  {new Date(activitySummary.lastActivityAt).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {startup.lastActivity && !activitySummary?.lastActivityAt && (
            <div className={PANEL}>
              <p className={`${MICRO_LABEL} mb-1`}>Last Activity</p>
              <p className="font-body text-[13px] text-text-heading">
                {new Date(startup.lastActivity).toLocaleString()}
              </p>
            </div>
          )}

          {startup.joinedCohortAt && (
            <div className={PANEL}>
              <p className={`${MICRO_LABEL} mb-1`}>Joined Cohort</p>
              <p className="font-body text-[13px] text-text-heading">
                {new Date(startup.joinedCohortAt).toLocaleDateString()}
              </p>
            </div>
          )}

          {startup.teamMembers && startup.teamMembers.length > 0 && (
            <div className={PANEL}>
              <div className="mb-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <h3 className="font-heading text-[14px] font-semibold text-text-heading">
                  Team ({startup.teamMembers.length})
                </h3>
              </div>
              <div className="space-y-2">
                {startup.teamMembers.map((member, index) => (
                  <ListRow
                    key={member.id || index}
                    title={member.name}
                    description={member.role || undefined}
                    trailing={
                      member.joinedAt ? (
                        <span className="font-body text-[12px] text-text-muted">
                          Joined{" "}
                          {new Date(member.joinedAt).toLocaleDateString()}
                        </span>
                      ) : null
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {contributionBalance.topContributor && (
            <div className={PANEL}>
              <div className="mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h3 className="font-heading text-[14px] font-semibold text-text-heading">
                  Contribution Balance
                </h3>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="font-body text-[13px] text-text-muted">
                    Top Contributor
                  </p>
                  <p className="font-body text-[13px] font-medium text-text-heading">
                    {contributionBalance.topContributor.name} (
                    {contributionBalance.topContributor.percentage}%)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {contributionBalance.isBalanced ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#00c896]" />
                      <p className="font-body text-[13px] text-[#00c896]">
                        Well-balanced team contributions
                      </p>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-3.5 w-3.5 text-[#ffb300]" />
                      <p className="font-body text-[13px] text-[#ffb300]">
                        Single contributor dominating
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="rounded-input border border-primary/20 bg-primary-tint p-3">
            <p className="font-body text-[13px] text-primary">
              <strong>Privacy Note:</strong> This is a read-only aggregate view
              based on execution signals. Individual task details and sensitive
              data are protected.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
