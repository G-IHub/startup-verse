/**
 * Stage Roadmap Modal - Shows all 6 stages with detailed information
 */
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import { cn } from "../ui/utils";
import { Check, Lock, ChevronDown, ChevronUp } from "lucide-react";
import { JOURNEY_STAGES } from "../../utils/journeyProgress";
import { apiGet } from "../../utils/apiClient";
export default function StageRoadmapModal({
  isOpen,
  onClose,
  journeyProgress,
  currentStageId,
  founderId,
}) {
  const [expandedStages, setExpandedStages] = useState(new Set());
  const [stageCompletions, setStageCompletions] = useState([]);

  useEffect(() => {
    if (!isOpen || !founderId) return;
    apiGet(`/founders/${founderId}/stage-completions`)
      .then((data) => {
        if (Array.isArray(data?.stageCompletions)) {
          setStageCompletions(data.stageCompletions);
        }
      })
      .catch(() => {});
  }, [isOpen, founderId]);

  const getCompletionRecord = (stageId) =>
    stageCompletions.find((c) => c.stageId === stageId) || null;

  const formatDate = (iso) => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return "";
    }
  };

  const toggleStage = (stageId) => {
    const newExpanded = new Set(expandedStages);
    if (newExpanded.has(stageId)) {
      newExpanded.delete(stageId);
    } else {
      newExpanded.add(stageId);
    }
    setExpandedStages(newExpanded);
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        overlayClassName="bg-[rgba(10,10,30,0.45)] backdrop-blur-sm"
        closeClassName="text-text-muted hover:text-text-heading hover:opacity-100"
        className="max-h-[85vh] max-w-2xl gap-4 overflow-y-auto rounded-2xl border border-surface-border bg-white p-6 shadow-[0_8px_40px_rgba(58,90,254,0.15)] sm:max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading text-lg font-bold text-text-heading">
            Your Startup Stage
          </DialogTitle>
          <DialogDescription className="font-body text-sm text-text-body">
            Your complete startup journey across 6 algorithmic stages. Stages
            unlock automatically as you hit progress milestones.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2.5 mt-3">
          {JOURNEY_STAGES.map((stage) => {
            const isCompleted = journeyProgress?.completedStages.includes(
              stage.id,
            );
            const isCurrent = currentStageId === stage.id;
            const isLocked = stage.id > currentStageId;
            const isExpanded = expandedStages.has(stage.id);
            return (
              <div
                key={stage.id}
                className={cn(
                  "relative overflow-hidden rounded-xl transition-all duration-200 ease-in-out",
                  isLocked &&
                    "border border-surface-border bg-surface-page opacity-70 dark:bg-surface-page",
                  isCurrent && "border-[1.5px] border-primary bg-primary-tint",
                  !isLocked &&
                    !isCurrent &&
                    "border border-surface-border bg-white dark:bg-card",
                )}
              >
                <div className="flex items-start gap-2.5 p-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl",
                      isLocked && "bg-surface-border text-text-muted",
                      isCurrent && "bg-primary text-white",
                      !isLocked &&
                        !isCurrent &&
                        isCompleted &&
                        "bg-primary-tint text-status-success",
                      !isLocked &&
                        !isCurrent &&
                        !isCompleted &&
                        "bg-primary-tint text-primary",
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : isLocked ? (
                      <Lock className="h-4 w-4 text-text-muted" />
                    ) : (
                      <stage.icon className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
                      <h3
                        className={cn(
                          "font-heading text-[10px] font-semibold md:text-xs",
                          isLocked && "text-text-muted",
                          isCurrent && "font-bold text-primary",
                          !isLocked &&
                            !isCurrent &&
                            "text-text-heading dark:text-foreground",
                        )}
                      >
                        {"Stage "}
                        {stage.id}
                        {": "}
                        {stage.name}
                      </h3>
                      {isCurrent && (
                        <Badge className="h-auto rounded-pill bg-primary px-2.5 py-0.5 font-body text-[11px] font-semibold text-white hover:bg-primary">
                          CURRENT
                        </Badge>
                      )}
                      {isLocked && (
                        <Badge
                          variant="outline"
                          className="h-auto rounded-pill border-0 bg-surface-border px-2.5 py-0.5 font-body text-[11px] font-semibold text-text-muted"
                        >
                          LOCKED
                        </Badge>
                      )}
                    </div>
                    <p
                      className={cn(
                        "font-body text-[10px] leading-relaxed md:text-xs",
                        isLocked ? "text-text-muted" : "text-text-body",
                      )}
                    >
                      {stage.description}
                    </p>
                  </div>
                  {!isLocked && (
                    <button
                      onClick={() => toggleStage(stage.id)}
                      className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-input transition-colors duration-200 ease-in-out hover:bg-surface-page"
                      aria-label={
                        isExpanded ? "Collapse details" : "Expand details"
                      }
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-text-muted" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-text-muted" />
                      )}
                    </button>
                  )}
                </div>
                {!isLocked && isExpanded && (
                  <div className="mt-1 space-y-2.5 border-t border-surface-border px-3 pb-3 pt-0">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground pt-2 flex-wrap">
                      <span className="font-medium">
                        {"⏱️ Estimated: "}
                        {stage.estimatedDuration}
                      </span>
                      {(() => {
                        const rec = getCompletionRecord(stage.id);
                        if (!rec) return null;
                        const dateStr = formatDate(rec.completedAt);
                        const wasSkipped = rec.method === "skipped";
                        return (
                          <span className="flex items-center gap-1 ml-auto">
                            {dateStr && (
                              <span className="text-[9px] text-muted-foreground">{dateStr}</span>
                            )}
                            {wasSkipped ? (
                              <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 border-amber-400 text-amber-600 dark:text-amber-400">
                                skipped
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 border-green-500 text-green-600 dark:text-green-400">
                                completed
                              </Badge>
                            )}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">
                        Completion Criteria
                      </h4>
                      <ul className="space-y-0.5">
                        {stage.completionCriteria.map((criterion, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-1.5 text-[10px]"
                          >
                            <span
                              className={`mt-0.5 flex-shrink-0 ${isCompleted ? "text-green-600" : "text-muted-foreground"}`}
                            >
                              {isCompleted ? "✅" : "▫️"}
                            </span>
                            <span
                              className={`leading-relaxed ${isCompleted ? "line-through text-muted-foreground" : ""}`}
                            >
                              {criterion}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">
                        Key Milestones
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {stage.keyMilestones.map((milestone, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className={`text-[9px] px-1.5 py-0 ${isCompleted ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700" : ""}`}
                          >
                            {milestone}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {stage.tools && stage.tools.length > 0 && (
                      <div className="space-y-1.5">
                        <h4 className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">
                          Available Tools
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {stage.tools.map((tool, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-[9px] px-1.5 py-0"
                            >
                              {tool}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {isLocked && (
                  <div className="px-3 pb-3 font-body text-[10px] italic text-text-muted">
                    Complete your current stage to unlock this stage and see
                    details
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4 border-t border-surface-border pt-3 text-center font-body text-[10px] text-text-muted">
          Stages are algorithmically determined based on your progress metrics
          and execution outcomes
        </div>
      </DialogContent>
    </Dialog>
  );
}
