/**
 * Stage Progress Indicator
 *
 * Shows founders how their weekly outcomes contribute to stage completion.
 * Displays progress sources (outcomes vs templates) and upcoming milestones.
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import {
  Target,
  CheckCircle2,
  TrendingUp,
  Award,
  Sparkles,
  Info,
  Zap,
} from "lucide-react";
import { JOURNEY_STAGES } from "../../utils/journeyProgress";
import { useJourneyStore } from "../../state/useJourneyStore";
import { getStageProgressSummary } from "../../utils/outcomeBasedProgression";
export default function StageProgressIndicator({
  compact = false,
  showUpcoming = true,
}) {
  const progress = useJourneyStore((s) => s.progress);
  if (!progress) return null;
  const currentStageId = progress.currentStage;
  const currentStageInfo = JOURNEY_STAGES.find((s) => s.id === currentStageId);
  const currentStageData = progress.stageData[currentStageId];

  // Get progress breakdown
  const progressSummary = getStageProgressSummary(currentStageId);
  const totalProgress = currentStageData?.completionPercentage || 0;

  // Get next stage info
  const nextStageId = currentStageId + 1;
  const nextStageInfo = JOURNEY_STAGES.find((s) => s.id === nextStageId);
  const nextStageData = progress.stageData[nextStageId];
  const nextStageProgress = nextStageData?.completionPercentage || 0;
  if (!currentStageInfo) return null;

  // Compact view for sidebar/header
  if (compact) {
    return (
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">
                {currentStageInfo.title}
              </span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {totalProgress}%
            </Badge>
          </div>
          <Progress value={totalProgress} className="h-2 mb-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {progressSummary.outcomesContributed}
              {" outcomes"}
            </span>
            <span>
              {80 - totalProgress > 0
                ? `${80 - totalProgress}% to complete`
                : "Ready!"}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full view for dashboard
  return (
    <div className="space-y-4">
      <Card className="border-2 border-primary/30 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              {"Stage "}
              {currentStageId}
              {": "}
              {currentStageInfo.title}
            </CardTitle>
            <Tooltip>
              <TooltipTrigger asChild={true}>
                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Progress updates automatically when you complete weekly
                  outcomes. Reaches 80%+ progress by describing your work each
                  week.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {currentStageInfo.description}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Overall Progress</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-primary">
                  {totalProgress}%
                </span>
                {totalProgress >= 80 && (
                  <Badge className="bg-green-600">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Ready to Complete!
                  </Badge>
                )}
              </div>
            </div>
            <Progress value={totalProgress} className="h-3" />
            {totalProgress < 80 && (
              <p className="text-xs text-muted-foreground">
                <strong>{80 - totalProgress}% more</strong>
                {" to auto-complete this stage"}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold">Weekly Outcomes</span>
              </div>
              <p className="text-2xl font-bold text-blue-600 mb-1">
                {progressSummary.outcomesContributed}
              </p>
              <p className="text-xs text-muted-foreground">
                outcomes completed
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-semibold">Template Tasks</span>
              </div>
              <p className="text-2xl font-bold text-purple-600 mb-1">
                {progressSummary.templatesCompleted}
              </p>
              <p className="text-xs text-muted-foreground">milestones done</p>
            </div>
          </div>
          <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-900 mb-1">
                  How to Complete This Stage
                </p>
                <ul className="text-xs text-green-800 space-y-1">
                  {currentStageInfo.completionCriteria
                    .slice(0, 3)
                    .map((criteria, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-green-600 mt-0.5">•</span>
                        <span>{criteria}</span>
                      </li>
                    ))}
                </ul>
                <p className="text-xs text-green-700 mt-2 italic">
                  💡 Just describe these in your weekly outcomes!
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium">Estimated Duration</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {currentStageInfo.estimatedDuration}
            </Badge>
          </div>
        </CardContent>
      </Card>
      {showUpcoming && nextStageInfo && nextStageProgress > 0 && (
        <Card className="border-dashed border-2 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="w-4 h-4 text-amber-500" />
              {"Working Ahead: "}
              {nextStageInfo.title}
              <Badge variant="secondary" className="text-xs">
                {nextStageProgress}%
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={nextStageProgress} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">
              You're already making progress on the next stage! Complete your
              current stage first to unlock full access.
            </p>
          </CardContent>
        </Card>
      )}
      <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground">
            <strong className="text-foreground">Pro Tip:</strong>
            {
              " You don't need to complete template tasks. Just describe what you accomplish each week in your outcomes, and the system will auto-detect your progress toward stage completion."
            }
          </div>
        </div>
      </div>
    </div>
  );
}
