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
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[10px] font-semibold flex items-center gap-2">
            🚀 Your Startup Stage
          </DialogTitle>
          <DialogDescription className="text-[10px]">
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
                className={`
                  relative rounded-lg border-2 transition-all overflow-hidden
                  ${isCurrent ? "border-primary bg-primary/5" : ""}
                  ${isCompleted ? "border-green-500 bg-green-50 dark:bg-green-950/20" : ""}
                  ${isLocked ? "border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20 opacity-60" : ""}
                  ${!isCurrent && !isCompleted && !isLocked ? "border-gray-200 dark:border-gray-700" : ""}
                `}
              >
                <div className="flex items-start gap-2.5 p-3">
                  <div
                    className={`
                    w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
                    ${isCurrent ? "bg-primary text-white" : ""}
                    ${isCompleted ? "bg-green-600 text-white" : ""}
                    ${isLocked ? "bg-gray-300 dark:bg-gray-700 text-gray-500" : ""}
                    ${!isCurrent && !isCompleted && !isLocked ? "bg-gray-200 dark:bg-gray-800 text-gray-600" : ""}
                  `}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : isLocked ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      <stage.icon className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h3
                        className={`text-[10px] font-bold ${isCurrent ? "text-primary" : isCompleted ? "text-green-700 dark:text-green-400" : ""}`}
                      >
                        {"Stage "}
                        {stage.id}
                        {": "}
                        {stage.name}
                      </h3>
                      {isCurrent && (
                        <Badge
                          variant="default"
                          className="text-[8px] px-1.5 py-0 h-4"
                        >
                          CURRENT
                        </Badge>
                      )}
                      {isCompleted && (
                        <Badge className="text-[8px] px-1.5 py-0 h-4 bg-green-600">
                          COMPLETED
                        </Badge>
                      )}
                      {isLocked && (
                        <Badge
                          variant="outline"
                          className="text-[8px] px-1.5 py-0 h-4"
                        >
                          LOCKED
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      {stage.description}
                    </p>
                  </div>
                  {!isLocked && (
                    <button
                      onClick={() => toggleStage(stage.id)}
                      className="flex-shrink-0 w-6 h-6 rounded hover:bg-muted/50 flex items-center justify-center transition-colors"
                      aria-label={
                        isExpanded ? "Collapse details" : "Expand details"
                      }
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  )}
                </div>
                {!isLocked && isExpanded && (
                  <div className="px-3 pb-3 pt-0 space-y-2.5 border-t border-border/50 mt-1">
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
                  <div className="px-3 pb-3 text-[10px] text-muted-foreground italic">
                    🔒 Complete your current stage to unlock this stage and see
                    details
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-3 border-t text-center text-[10px] text-muted-foreground">
          💡 Stages are algorithmically determined based on your progress
          metrics and execution outcomes
        </div>
      </DialogContent>
    </Dialog>
  );
}
