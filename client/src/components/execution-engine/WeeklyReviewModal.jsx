import { motion, AnimatePresence } from "motion/react";
import { onWeeklyOutcomeCompleted as onWeeklyOutcomeCompletedOld } from "../../utils/automaticStageProgression";
import { onWeeklyReviewCompleted } from "../../utils/outcomeBasedProgression";
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Separator } from "../ui/separator";
import { Progress } from "../ui/progress";
import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";
import {
  CheckCircle2,
  Circle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Flame,
  Award,
  Calendar,
  Lightbulb,
  ArrowRight,
  PartyPopper,
  AlertCircle,
  Info,
} from "lucide-react";
import { toast } from "sonner";
export function WeeklyReviewModal({
  open,
  onClose,
  outcome,
  onComplete,
  currentStreak,
}) {
  const [step, setStep] = useState("summary");
  const [achievement, setAchievement] = useState("completed");
  const [whatWorked, setWhatWorked] = useState("");
  const [whatDidnt, setWhatDidnt] = useState("");
  const [learnings, setLearnings] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate progress stats
  const tasksCompleted =
    outcome?.milestones?.reduce(
      (acc, m) =>
        acc + (m.tasks?.filter((t) => t.status === "completed").length || 0),
      0,
    ) || 0;
  const tasksTotal =
    outcome?.milestones?.reduce((acc, m) => acc + (m.tasks?.length || 0), 0) ||
    0;
  const milestonesCompleted =
    outcome?.milestones?.filter((m) => m.status === "completed").length || 0;
  const milestonesTotal = outcome?.milestones?.length || 0;
  const taskCompletionRate =
    tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;
  const milestoneCompletionRate =
    milestonesTotal > 0
      ? Math.round((milestonesCompleted / milestonesTotal) * 100)
      : 0;

  // Reset form when outcome changes
  useEffect(() => {
    if (outcome) {
      if (outcome.status === "active") {
        setStep("summary");
        // Pre-select achievement based on completion rates
        if (taskCompletionRate >= 80 && milestoneCompletionRate >= 80) {
          setAchievement("completed");
        } else if (taskCompletionRate >= 50 || milestoneCompletionRate >= 50) {
          setAchievement("partial");
        } else {
          setAchievement("not-achieved");
        }
      } else {
        setStep("result");
      }
      setWhatWorked("");
      setWhatDidnt("");
      setLearnings("");
    }
  }, [outcome, taskCompletionRate, milestoneCompletionRate]);
  const handleSubmit = async () => {
    if (!outcome) return;

    // Validate reflection fields
    if (!whatWorked.trim() && achievement !== "not-achieved") {
      toast.error("Please share what worked this week");
      return;
    }
    setIsSubmitting(true);
    const completionData = {
      completedAt: new Date().toISOString(),
      achievement,
      whatWorked,
      whatDidnt,
      learnings,
      tasksCompleted,
      tasksTotal,
      milestonesCompleted,
      milestonesTotal,
    };

    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 1000));
    onComplete(outcome.id, completionData);
    setIsSubmitting(false);
    setStep("result");

    // 🎯 Trigger automatic stage progression check (OLD template-based system)
    onWeeklyOutcomeCompletedOld();

    // 🎯 NEW: Trigger outcome-based stage progression (COMPLETION phase)
    onWeeklyReviewCompleted(
      outcome.title,
      outcome.description || "",
      achievement,
      whatWorked,
      whatDidnt,
      learnings,
      outcome.id,
    );
  };
  const getAchievementIcon = (type) => {
    switch (type) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "partial":
        return <Minus className="w-5 h-5 text-yellow-600" />;
      case "not-achieved":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Circle className="w-5 h-5" />;
    }
  };
  const getAchievementColor = (type) => {
    switch (type) {
      case "completed":
        return "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800";
      case "partial":
        return "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800";
      case "not-achieved":
        return "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800";
      default:
        return "";
    }
  };
  const getStreakChange = () => {
    if (achievement === "completed" || achievement === "partial") {
      return currentStreak + 1;
    }
    return 0; // Streak broken
  };
  if (!outcome) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
            <Award className="w-5 h-5 text-primary" />
            {"Complete Week "}
            {outcome.weekNumber}
            <Tooltip>
              <TooltipTrigger asChild={true}>
                <Info className="w-4 h-4 text-muted-foreground cursor-help ml-1" />
              </TooltipTrigger>
              <TooltipContent>
                Review your progress and reflect on this week's outcome
              </TooltipContent>
            </Tooltip>
          </DialogTitle>
        </DialogHeader>
        <AnimatePresence mode="wait">
          {step === "summary" && (
            <motion.div
              key="summary"
              initial={{
                opacity: 0,
                x: 20,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              exit={{
                opacity: 0,
                x: -20,
              }}
              className="space-y-4"
            >
              <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border">
                <h3 className="font-semibold text-sm md:text-base mb-1">
                  {outcome.title}
                </h3>
                {outcome.description && (
                  <p className="text-xs text-muted-foreground mb-2">
                    {outcome.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span className="text-[10px]">
                      {new Date(outcome.weekStart).toLocaleDateString()}
                      {" - "}
                      {new Date(outcome.weekEnd).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  Progress Summary
                </h4>
                <div className="p-3 bg-primary/5 rounded-lg border">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium text-muted-foreground">
                          Milestones
                        </span>
                      </div>
                      <p className="text-xs font-semibold">
                        {milestonesCompleted}
                        {" / "}
                        {milestonesTotal}
                        {" completed"}
                      </p>
                      <Progress
                        value={milestoneCompletionRate}
                        className="h-1.5"
                      />
                      <p className="text-[9px] text-muted-foreground">
                        {milestoneCompletionRate}% complete
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium text-muted-foreground">
                          Tasks
                        </span>
                      </div>
                      <p className="text-xs font-semibold">
                        {tasksCompleted}
                        {" / "}
                        {tasksTotal}
                        {" completed"}
                      </p>
                      <Progress value={taskCompletionRate} className="h-1.5" />
                      <p className="text-[9px] text-muted-foreground">
                        {taskCompletionRate}% complete
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium">Current Streak</p>
                    <p className="text-xs text-muted-foreground">
                      Consecutive weeks achieved
                    </p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {currentStreak}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={() => setStep("achievement")}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}
          {step === "achievement" && (
            <motion.div
              key="achievement"
              initial={{
                opacity: 0,
                x: 20,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              exit={{
                opacity: 0,
                x: -20,
              }}
              className="space-y-4"
            >
              <div>
                <h4 className="font-semibold text-sm mb-3">
                  How did you achieve your weekly outcome?
                </h4>
                <div className="space-y-2">
                  <button
                    onClick={() => setAchievement("completed")}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${achievement === "completed" ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "border-gray-200 dark:border-gray-700 hover:border-green-300"}`}
                  >
                    <div className="flex items-start gap-2">
                      <CheckCircle2
                        className={`w-4 h-4 mt-0.5 ${achievement === "completed" ? "text-green-600" : "text-gray-400"}`}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm mb-0.5">Completed</p>
                        <p className="text-xs text-muted-foreground">
                          Achieved the outcome and all key milestones
                        </p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setAchievement("partial")}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${achievement === "partial" ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20" : "border-gray-200 dark:border-gray-700 hover:border-yellow-300"}`}
                  >
                    <div className="flex items-start gap-2">
                      <Minus
                        className={`w-4 h-4 mt-0.5 ${achievement === "partial" ? "text-yellow-600" : "text-gray-400"}`}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm mb-0.5">
                          Partially Achieved
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Made significant progress but didn't complete
                          everything
                        </p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setAchievement("not-achieved")}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${achievement === "not-achieved" ? "border-red-500 bg-red-50 dark:bg-red-950/20" : "border-gray-200 dark:border-gray-700 hover:border-red-300"}`}
                  >
                    <div className="flex items-start gap-2">
                      <XCircle
                        className={`w-4 h-4 mt-0.5 ${achievement === "not-achieved" ? "text-red-600" : "text-gray-400"}`}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm mb-0.5">
                          Not Achieved
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Didn't make meaningful progress this week
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
              <div
                className={`p-3 rounded-lg border ${achievement === "not-achieved" ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800" : "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame
                      className={`w-4 h-4 ${achievement === "not-achieved" ? "text-red-600" : "text-orange-600"}`}
                    />
                    <span className="text-sm font-medium">
                      {achievement === "not-achieved"
                        ? "Streak will be broken"
                        : "Streak continues!"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{currentStreak}</span>
                    <ArrowRight className="w-4 h-4" />
                    <span
                      className={`text-lg font-bold ${achievement === "not-achieved" ? "text-red-600" : "text-green-600"}`}
                    >
                      {getStreakChange()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setStep("summary")}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep("reflection")}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}
          {step === "reflection" && (
            <motion.div
              key="reflection"
              initial={{
                opacity: 0,
                x: 20,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              exit={{
                opacity: 0,
                x: -20,
              }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lightbulb className="w-4 h-4" />
                <span>Capture your learnings to improve next week</span>
              </div>
              {achievement !== "not-achieved" && (
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    What worked well this week?
                  </Label>
                  <Textarea
                    value={whatWorked}
                    onChange={(e) => setWhatWorked(e.target.value)}
                    placeholder="E.g., Daily standups kept team aligned, breaking tasks into smaller chunks helped momentum..."
                    className="min-h-[100px]"
                  />
                </div>
              )}
              <div>
                <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  What didn't work or blocked progress?
                </Label>
                <Textarea
                  value={whatDidnt}
                  onChange={(e) => setWhatDidnt(e.target.value)}
                  placeholder="E.g., Unclear requirements caused rework, too many meetings, unexpected dependencies..."
                  className="min-h-[100px]"
                />
              </div>
              <div>
                <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-purple-600" />
                  Key learnings for next week
                </Label>
                <Textarea
                  value={learnings}
                  onChange={(e) => setLearnings(e.target.value)}
                  placeholder="E.g., Need to validate designs earlier, should allocate more buffer time, team needs clearer priorities..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setStep("achievement")}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Completing...
                    </>
                  ) : (
                    <>
                      Complete Review
                      <CheckCircle2 className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
          {step === "result" && outcome.completionData && (
            <motion.div
              key="result"
              initial={{
                opacity: 0,
                scale: 0.95,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
              }}
              className="space-y-4"
            >
              <div
                className={`p-4 rounded-lg border-2 text-center ${getAchievementColor(outcome.completionData.achievement)}`}
              >
                <motion.div
                  initial={{
                    scale: 0,
                  }}
                  animate={{
                    scale: 1,
                  }}
                  transition={{
                    type: "spring",
                    delay: 0.2,
                  }}
                  className="flex justify-center mb-2"
                >
                  {outcome.completionData.achievement === "completed" ? (
                    <PartyPopper className="w-12 h-12 text-green-600" />
                  ) : outcome.completionData.achievement === "partial" ? (
                    <TrendingUp className="w-12 h-12 text-yellow-600" />
                  ) : (
                    <TrendingDown className="w-12 h-12 text-red-600" />
                  )}
                </motion.div>
                <h3 className="text-base md:text-lg font-bold mb-1">
                  {outcome.completionData.achievement === "completed" &&
                    "Outcome Completed! 🎉"}
                  {outcome.completionData.achievement === "partial" &&
                    "Partial Progress Made"}
                  {outcome.completionData.achievement === "not-achieved" &&
                    "Week Complete"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Your weekly review has been archived
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-600" />
                    <span className="font-semibold text-sm">
                      Weekly Outcome Streak
                    </span>
                  </div>
                  {outcome.completionData.achievement !== "not-achieved" ? (
                    <Award className="w-4 h-4 text-orange-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold text-orange-600">
                    {outcome.completionData.achievement !== "not-achieved"
                      ? currentStreak + 1
                      : 0}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {outcome.completionData.achievement !== "not-achieved" ? (
                      <>Weeks in a row! Keep the momentum going 🔥</>
                    ) : (
                      <>Streak reset. Start fresh next week! 💪</>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg border">
                  <p className="text-[10px] text-muted-foreground mb-0.5">
                    Milestones
                  </p>
                  <p className="text-base md:text-lg font-bold">
                    {outcome.completionData.milestonesCompleted}/
                    {outcome.completionData.milestonesTotal}
                  </p>
                </div>
                <div className="p-2 bg-purple-50 dark:bg-purple-950/20 rounded-lg border">
                  <p className="text-[10px] text-muted-foreground mb-0.5">
                    Tasks
                  </p>
                  <p className="text-base md:text-lg font-bold">
                    {outcome.completionData.tasksCompleted}/
                    {outcome.completionData.tasksTotal}
                  </p>
                </div>
              </div>
              {(outcome.completionData.whatWorked ||
                outcome.completionData.whatDidnt ||
                outcome.completionData.learnings) && (
                <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border">
                  <h4 className="font-semibold text-xs">Your Reflections</h4>
                  {outcome.completionData.whatWorked && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                        What worked
                      </p>
                      <p className="text-sm">
                        {outcome.completionData.whatWorked}
                      </p>
                    </div>
                  )}
                  {outcome.completionData.whatDidnt && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-orange-600" />
                        What didn't work
                      </p>
                      <p className="text-sm">
                        {outcome.completionData.whatDidnt}
                      </p>
                    </div>
                  )}
                  {outcome.completionData.learnings && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Lightbulb className="w-3 h-3 text-purple-600" />
                        Key learnings
                      </p>
                      <p className="text-sm">
                        {outcome.completionData.learnings}
                      </p>
                    </div>
                  )}
                </div>
              )}
              <div className="pt-2">
                <Button
                  onClick={onClose}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Done
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
