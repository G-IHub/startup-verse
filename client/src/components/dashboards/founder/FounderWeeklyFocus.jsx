import React from "react";
import { toast } from "sonner";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip";
import BrandProgress from "../../organizations/_primitives/BrandProgress";
import CohortMembershipBadge from "../../organizations/CohortMembershipBadge";
import {
  Check,
  CheckCircle2,
  Circle,
  Eye,
  FileText,
  Loader2,
  PlayCircle,
  Rocket,
  Target,
  Upload,
} from "lucide-react";
import { cn } from "../../ui/utils";

function MilestoneRow({ milestone, onOpen }) {
  const done = milestone.status === "completed";
  const active = milestone.status === "in-progress";
  const total = milestone.totalTasks || 0;
  const doneCount = milestone.tasksCompleted || 0;

  return (
    <li>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onOpen}
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-200 ease-in-out hover:bg-primary-tint/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:px-5"
          >
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                done
                  ? "bg-status-success text-white"
                  : active
                    ? "bg-primary text-white"
                    : "border border-surface-border bg-surface-page text-text-muted",
              )}
              aria-hidden
            >
              {done ? (
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              ) : active ? (
                <Circle className="h-2.5 w-2.5 fill-current" />
              ) : (
                <Circle className="h-3.5 w-3.5" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  "block font-body text-[13px] font-semibold leading-snug",
                  done
                    ? "text-text-muted line-through decoration-surface-border"
                    : "text-text-heading",
                )}
              >
                {milestone.title}
              </span>
              <span className="mt-0.5 block font-body text-[11px] text-text-muted">
                {done
                  ? "Complete"
                  : active
                    ? "In progress"
                    : "Not started"}
              </span>
            </span>
            {total > 0 ? (
              <span className="shrink-0 font-body text-[12px] tabular-nums text-text-muted">
                {doneCount}/{total}
              </span>
            ) : null}
          </button>
        </TooltipTrigger>
        {milestone.description ? (
          <TooltipContent
            side="bottom"
            className="max-w-xs border border-border bg-popover text-popover-foreground"
          >
            <p className="text-xs text-white">{milestone.description}</p>
          </TooltipContent>
        ) : null}
      </Tooltip>
    </li>
  );
}

export default function FounderWeeklyFocus({
  executionData,
  outcomeProgress = 0,
  weeklyOutcomeSubmitting = false,
  isLoadingExecutionData = false,
  founderLaunchLoading = false,
  founderNeedsLaunch = false,
  deliverables = [],
  submittingDeliverable,
  setSubmittingDeliverable,
  deliverableSubmissionData,
  setDeliverableSubmissionData,
  submitDeliverableAction,
  founderId,
  startupId,
  onNavigate,
  onOpenTasks,
  onCompleteWeek,
  onLearnStage,
  onSetOutcome,
  onLaunchStartup,
}) {
  const outcome = executionData?.currentOutcome;
  const hasPlan = Boolean(outcome);
  const milestones = outcome?.milestones || [];
  const completedMilestones = milestones.filter(
    (m) => m.tasksCompleted === m.totalTasks && m.totalTasks > 0,
  ).length;
  const weekNumber = (executionData?.weekHistory?.length || 0) + 1;

  return (
    <section className="overflow-hidden rounded-card border border-surface-border bg-surface-card shadow-soft">
      <header className="flex flex-col gap-4 px-4 pt-5 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-body text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
              This week&apos;s focus
            </p>
            <h2 className="mt-1 font-heading text-[18px] font-semibold leading-snug text-text-heading md:text-[20px]">
              {hasPlan
                ? outcome.title
                : "Set an outcome and ship the week"}
            </h2>
            {hasPlan && outcome.isOrganizationDriven ? (
              <p className="mt-1 font-body text-[12px] text-text-muted">
                Assigned by {outcome.cohortName || "your program"}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center">
            {hasPlan ? (
              <span className="rounded-pill bg-primary-tint px-2.5 py-1 font-body text-[11px] font-semibold text-primary">
                Week {weekNumber}
              </span>
            ) : null}
            <button
              type="button"
              onClick={onLearnStage}
              className="inline-flex h-8 items-center rounded-input px-2 font-body text-[12px] font-semibold text-primary hover:bg-primary-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Learn stage
            </button>
          </div>
        </div>

        {startupId || founderId ? (
          <CohortMembershipBadge
            startupId={startupId || founderId}
            onNavigate={onNavigate}
          />
        ) : null}

        {hasPlan ? (
          <div>
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <p className="font-body text-[12px] text-text-body">
                {completedMilestones} of {milestones.length} milestones
              </p>
              <p className="font-heading text-[15px] font-bold tabular-nums text-text-heading">
                {outcomeProgress}%
              </p>
            </div>
            <BrandProgress value={outcomeProgress} className="h-2" />
          </div>
        ) : null}
      </header>

      <div className="px-4 pb-4 pt-4 sm:px-5">
        {weeklyOutcomeSubmitting ? (
          <div
            className="flex min-h-[140px] flex-col items-center justify-center gap-2 px-4 text-center"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
            <p className="font-body text-[13px] font-medium text-text-heading">
              Saving your weekly goal…
            </p>
            <p className="max-w-sm font-body text-[12px] text-text-muted">
              Updating your plan. This usually takes a few seconds.
            </p>
          </div>
        ) : isLoadingExecutionData ? (
          <div className="space-y-2" aria-hidden>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-input bg-surface-page"
              />
            ))}
          </div>
        ) : hasPlan ? (
          <TooltipProvider>
            <div className="overflow-hidden rounded-input border border-surface-border">
              <ul className="divide-y divide-surface-border">
                {milestones.map((milestone) => (
                  <MilestoneRow
                    key={milestone.id}
                    milestone={milestone}
                    onOpen={onOpenTasks}
                  />
                ))}
              </ul>
            </div>

            {deliverables.length > 0 ? (
              <div className="mt-4 space-y-2">
                <h3 className="flex items-center gap-1.5 font-body text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
                  <FileText className="h-3.5 w-3.5 text-primary" aria-hidden />
                  Program deliverables
                </h3>
                {deliverables.map((deliverable) => {
                  const daysUntil = Math.ceil(
                    (new Date(deliverable.dueDate).getTime() -
                      new Date().getTime()) /
                      (1000 * 60 * 60 * 24),
                  );
                  const isPastDue = daysUntil < 0;
                  const isSubmitted = Boolean(deliverable.mySubmission);
                  const isSubmitting = submittingDeliverable === deliverable.id;
                  return (
                    <div
                      key={deliverable.id}
                      className="space-y-2 rounded-input border border-surface-border bg-surface-page/60 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-body text-[13px] font-semibold text-text-heading">
                            {deliverable.title}
                          </p>
                          <p className="mt-0.5 font-body text-[12px] text-text-muted">
                            {deliverable.cohortName}
                            {" · Due "}
                            {new Date(deliverable.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                        {isSubmitted ? (
                          <Badge variant="outline" className="text-[11px] capitalize">
                            {deliverable.mySubmission.status}
                          </Badge>
                        ) : isPastDue ? (
                          <Badge
                            variant="outline"
                            className="border-status-error/25 bg-status-error/10 text-[11px] text-status-error"
                          >
                            Past due
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[11px]">
                            {daysUntil}d left
                          </Badge>
                        )}
                      </div>
                      {!isSubmitted && !isSubmitting ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSubmittingDeliverable(deliverable.id)}
                          className="h-8 w-full rounded-input text-[12px]"
                        >
                          <Upload className="mr-1.5 h-3.5 w-3.5" />
                          Submit work
                        </Button>
                      ) : null}
                      {isSubmitting ? (
                        <div className="space-y-2 pt-1">
                          <Input
                            value={deliverableSubmissionData.submissionUrl}
                            onChange={(e) =>
                              setDeliverableSubmissionData({
                                ...deliverableSubmissionData,
                                submissionUrl: e.target.value,
                              })
                            }
                            placeholder="Submission URL"
                            aria-label="Submission URL"
                            className="h-9 text-[13px]"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={async () => {
                                try {
                                  const result = await submitDeliverableAction(
                                    deliverable.id,
                                    {
                                      founderId,
                                      submissionUrl:
                                        deliverableSubmissionData.submissionUrl,
                                      notes: deliverableSubmissionData.notes,
                                      attachments: [],
                                    },
                                  );
                                  if (!result?.ok) {
                                    throw (
                                      result?.error ||
                                      new Error("Failed to submit")
                                    );
                                  }
                                  setDeliverableSubmissionData({
                                    submissionUrl: "",
                                    notes: "",
                                  });
                                  setSubmittingDeliverable(null);
                                  toast.success("Deliverable submitted!");
                                } catch (error) {
                                  console.error(
                                    "Error submitting deliverable:",
                                    error,
                                  );
                                  toast.error("Failed to submit");
                                }
                              }}
                              disabled={!deliverableSubmissionData.submissionUrl}
                              className="h-8 flex-1 text-[12px]"
                            >
                              Submit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSubmittingDeliverable(null);
                                setDeliverableSubmissionData({
                                  submissionUrl: "",
                                  notes: "",
                                });
                              }}
                              className="h-8 text-[12px]"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                size="sm"
                onClick={onOpenTasks}
                className="h-10 rounded-input bg-primary font-body text-[13px] font-semibold text-white hover:bg-primary-hover"
              >
                <Eye className="mr-1.5 h-4 w-4" />
                View tasks
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onCompleteWeek}
                className="h-10 rounded-input border-surface-border bg-white font-body text-[13px] font-semibold text-primary hover:bg-primary-tint"
              >
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                Complete week
              </Button>
            </div>
          </TooltipProvider>
        ) : (
          <div className="flex min-h-[148px] flex-col items-center justify-center px-4 py-6 text-center">
            {founderLaunchLoading ? (
              <>
                <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" />
                <p className="font-body text-[13px] text-text-muted">
                  Checking your startup profile…
                </p>
              </>
            ) : founderNeedsLaunch ? (
              <>
                <Rocket className="mb-3 h-9 w-9 text-primary" aria-hidden />
                <h3 className="mb-1 font-heading text-[16px] font-semibold text-text-heading">
                  Launch your startup first
                </h3>
                <p className="mb-4 max-w-md font-body text-[13px] text-text-body">
                  Publish your startup post before setting weekly goals so your
                  team can align with you.
                </p>
                <Button
                  onClick={onLaunchStartup}
                  className="h-10 gap-2 rounded-input bg-primary font-body text-[13px] font-semibold text-white hover:bg-primary-hover"
                >
                  <Rocket className="h-4 w-4" />
                  Launch startup
                </Button>
              </>
            ) : (
              <>
                <Target className="mb-3 h-9 w-9 text-primary" aria-hidden />
                <h3 className="mb-1 font-heading text-[16px] font-semibold text-text-heading">
                  No weekly outcome yet
                </h3>
                <p className="mb-4 max-w-md font-body text-[13px] text-text-body">
                  Set a clear, achievable goal for this week to drive your
                  startup forward.
                </p>
                <Button
                  onClick={onSetOutcome}
                  className="h-10 gap-2 rounded-input bg-primary font-body text-[13px] font-semibold text-white hover:bg-primary-hover"
                >
                  <PlayCircle className="h-4 w-4" />
                  Set this week&apos;s goal
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
