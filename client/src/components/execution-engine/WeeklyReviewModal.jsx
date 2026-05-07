import { motion, AnimatePresence } from "motion/react";
import { onWeeklyReviewCompleted } from "../../utils/outcomeBasedProgression";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Progress } from "../ui/progress";
import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";
import {
  CheckCircle2,
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

const footerBar =
  "mt-5 flex gap-2 border-t border-primary/12 bg-[#fafbff] -mx-5 -mb-1 px-5 py-4";

function stepLabel(step) {
  if (step === "summary") return "Step 1 · Review";
  if (step === "achievement") return "Step 2 · Outcome";
  if (step === "reflection") return "Step 3 · Reflect";
  return "";
}

export function WeeklyReviewModal({
  open,
  onClose,
  outcome,
  tasks = [],
  onComplete,
  currentStreak,
  founderId,
}) {
  const [step, setStep] = useState("summary");
  const [achievement, setAchievement] = useState("completed");
  const [whatWorked, setWhatWorked] = useState("");
  const [whatDidnt, setWhatDidnt] = useState("");
  const [learnings, setLearnings] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedCompletionData, setSubmittedCompletionData] = useState(null);

  const tasksCompleted = tasks.filter(
    (t) => String(t?.status || "").toLowerCase() === "completed",
  ).length;
  const tasksTotal = tasks.length;
  const milestonesCompleted =
    outcome?.milestones?.filter((m) => m.status === "completed").length || 0;
  const milestonesTotal = outcome?.milestones?.length || 0;
  const taskCompletionRate =
    tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;
  const milestoneCompletionRate =
    milestonesTotal > 0
      ? Math.round((milestonesCompleted / milestonesTotal) * 100)
      : 0;
  const weekStartDate = (() => {
    const raw = outcome?.weekOf || outcome?.weekStart;
    const d = raw ? new Date(raw) : new Date();
    if (Number.isNaN(d.getTime())) return new Date();
    return d;
  })();
  const weekEndDate = (() => {
    const d = new Date(weekStartDate);
    d.setDate(d.getDate() + 6);
    return d;
  })();

  useEffect(() => {
    if (outcome) {
      if (outcome.status === "active") {
        setStep("summary");
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
      setSubmittedCompletionData(null);
    }
  }, [outcome, taskCompletionRate, milestoneCompletionRate]);

  const handleSubmit = async () => {
    if (!outcome) return;
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

    try {
      await onComplete(outcome.id, completionData);
      setSubmittedCompletionData(completionData);
      setStep("result");

      await onWeeklyReviewCompleted(
        outcome.title,
        outcome.description || "",
        achievement,
        whatWorked,
        whatDidnt,
        learnings,
        outcome.id,
        founderId,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const achievementOptionClass = (type, selected) => {
    const base =
      "w-full rounded-xl border px-3.5 py-3 text-left transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/25";
    if (!selected) {
      return `${base} border-primary/15 bg-white hover:border-primary/25 hover:bg-[#fafbff]`;
    }
    if (type === "completed") {
      return `${base} border-emerald-400/55 bg-emerald-50/90 ring-2 ring-emerald-500/20`;
    }
    if (type === "partial") {
      return `${base} border-amber-400/50 bg-amber-50/85 ring-2 ring-amber-400/18`;
    }
    return `${base} border-red-300/55 bg-red-50/90 ring-2 ring-red-400/15`;
  };

  const getAchievementColor = (type) => {
    switch (type) {
      case "completed":
        return "border-emerald-400/45 bg-emerald-50/95 text-[#0d0d0d]";
      case "partial":
        return "border-amber-400/45 bg-amber-50/95 text-[#0d0d0d]";
      case "not-achieved":
        return "border-red-300/50 bg-red-50/95 text-[#0d0d0d]";
      default:
        return "";
    }
  };

  const getStreakChange = () => {
    if (achievement === "completed" || achievement === "partial") {
      return currentStreak + 1;
    }
    return 0;
  };

  const resultData = submittedCompletionData || outcome?.completionData || null;
  if (!outcome) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        hideClose={step === "result"}
        className="flex max-h-[min(88vh,640px)] w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-[16px] border border-primary/18 bg-white p-0 text-[#4a4a5a] shadow-modal sm:max-w-xl"
      >
        <DialogDescription className="sr-only">
          Weekly outcome review and reflection for week {outcome.weekNumber}.
        </DialogDescription>

        <DialogHeader className="shrink-0 space-y-1 border-b border-primary/12 bg-[#fafbff] px-5 py-4 text-left">
          <div className="flex items-start gap-3 pr-10">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/[0.09] text-primary">
              <Award className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle className="flex flex-wrap items-center gap-2 text-[17px] font-semibold tracking-tight text-[#0d0d0d]">
                <span>
                  Complete Week {outcome.weekNumber}
                </span>
                <Tooltip>
                  <TooltipTrigger asChild={true}>
                    <button
                      type="button"
                      className="rounded-md p-1 text-[#6b6b7a] transition-colors hover:bg-white hover:text-primary"
                      aria-label="About this review"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    Review your progress and reflect on this week&apos;s outcome.
                  </TooltipContent>
                </Tooltip>
              </DialogTitle>
              {step !== "result" && (
                <p className="font-body text-[11px] font-medium text-[#6b6b7a]">
                  {stepLabel(step)}
                </p>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <AnimatePresence mode="wait">
            {step === "summary" && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="space-y-4"
              >
                <div className="rounded-xl border border-primary/15 bg-[#fafbff] px-4 py-3.5">
                  <h3 className="font-heading text-sm font-semibold text-[#0d0d0d]">
                    {outcome.title}
                  </h3>
                  {outcome.description ? (
                    <p className="mt-1 font-body text-xs leading-relaxed text-[#4a4a5a]">
                      {outcome.description}
                    </p>
                  ) : null}
                  <div className="mt-2 flex items-center gap-1.5 font-body text-[11px] text-[#6b6b7a]">
                    <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span>
                      {weekStartDate.toLocaleDateString()}
                      {" · "}
                      {weekEndDate.toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="mb-2.5 flex items-center gap-2 font-heading text-[13px] font-semibold text-[#0d0d0d]">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/[0.08] text-primary">
                      <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    Progress summary
                  </h4>
                  <div className="rounded-xl border border-primary/12 bg-white px-3 py-3 shadow-[0_1px_3px_rgba(58,90,254,0.06)]">
                    <div className="grid grid-cols-2 gap-4 divide-x divide-primary/10">
                      <div className="space-y-2 pr-2">
                        <span className="font-body text-[10px] font-semibold uppercase tracking-wide text-[#6b6b7a]">
                          Milestones
                        </span>
                        <p className="font-body text-xs font-semibold tabular-nums text-[#0d0d0d]">
                          {milestonesCompleted} / {milestonesTotal} completed
                        </p>
                        <Progress value={milestoneCompletionRate} className="h-1.5" />
                        <p className="font-body text-[10px] text-[#6b6b7a]">
                          {milestoneCompletionRate}% complete
                        </p>
                      </div>
                      <div className="space-y-2 pl-4">
                        <span className="font-body text-[10px] font-semibold uppercase tracking-wide text-[#6b6b7a]">
                          Tasks
                        </span>
                        <p className="font-body text-xs font-semibold tabular-nums text-[#0d0d0d]">
                          {tasksCompleted} / {tasksTotal} completed
                        </p>
                        <Progress value={taskCompletionRate} className="h-1.5" />
                        <p className="font-body text-[10px] text-[#6b6b7a]">
                          {taskCompletionRate}% complete
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-primary/15 bg-white px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/12 text-amber-700">
                      <Flame className="h-4 w-4" aria-hidden />
                    </span>
                    <div>
                      <p className="font-body text-sm font-semibold text-[#0d0d0d]">
                        Current streak
                      </p>
                      <p className="font-body text-[11px] text-[#6b6b7a]">
                        Consecutive strong weeks
                      </p>
                    </div>
                  </div>
                  <span className="font-heading text-2xl font-bold tabular-nums text-[#b45309]">
                    {currentStreak}
                  </span>
                </div>

                <div className={footerBar}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="h-9 flex-1 rounded-input border-primary/20 bg-white font-body text-xs font-semibold text-[#4a4a5a] hover:bg-[#f4f5ff]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setStep("achievement")}
                    className="h-9 flex-1 rounded-input bg-primary font-body text-xs font-semibold text-white shadow-[0_4px_16px_rgba(58,90,254,0.22)] hover:bg-primary-hover"
                  >
                    Continue
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "achievement" && (
              <motion.div
                key="achievement"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="space-y-4"
              >
                <div>
                  <h4 className="mb-3 font-heading text-[13px] font-semibold text-[#0d0d0d]">
                    How did you achieve your weekly outcome?
                  </h4>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setAchievement("completed")}
                      className={achievementOptionClass(
                        "completed",
                        achievement === "completed",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <CheckCircle2
                          className={`mt-0.5 h-5 w-5 shrink-0 ${achievement === "completed" ? "text-emerald-600" : "text-[#a0a0b0]"}`}
                        />
                        <div className="min-w-0">
                          <p className="font-body text-sm font-semibold text-[#0d0d0d]">
                            Completed
                          </p>
                          <p className="mt-0.5 font-body text-[11px] leading-snug text-[#4a4a5a]">
                            Achieved the outcome and key milestones.
                          </p>
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAchievement("partial")}
                      className={achievementOptionClass(
                        "partial",
                        achievement === "partial",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Minus
                          className={`mt-0.5 h-5 w-5 shrink-0 ${achievement === "partial" ? "text-amber-600" : "text-[#a0a0b0]"}`}
                        />
                        <div className="min-w-0">
                          <p className="font-body text-sm font-semibold text-[#0d0d0d]">
                            Partially achieved
                          </p>
                          <p className="mt-0.5 font-body text-[11px] leading-snug text-[#4a4a5a]">
                            Strong progress, but not everything shipped.
                          </p>
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAchievement("not-achieved")}
                      className={achievementOptionClass(
                        "not-achieved",
                        achievement === "not-achieved",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <XCircle
                          className={`mt-0.5 h-5 w-5 shrink-0 ${achievement === "not-achieved" ? "text-red-600" : "text-[#a0a0b0]"}`}
                        />
                        <div className="min-w-0">
                          <p className="font-body text-sm font-semibold text-[#0d0d0d]">
                            Not achieved
                          </p>
                          <p className="mt-0.5 font-body text-[11px] leading-snug text-[#4a4a5a]">
                            Limited meaningful progress this week.
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                <div
                  className={`rounded-xl border px-4 py-3 ${achievement === "not-achieved" ? "border-red-300/45 bg-red-50/70" : "border-emerald-300/40 bg-emerald-50/65"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Flame
                        className={`h-4 w-4 shrink-0 ${achievement === "not-achieved" ? "text-red-600" : "text-amber-600"}`}
                      />
                      <span className="font-body text-sm font-semibold text-[#0d0d0d]">
                        {achievement === "not-achieved"
                          ? "Streak will reset"
                          : "Streak continues"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-heading text-base font-bold tabular-nums">
                      <span className="text-[#4a4a5a]">{currentStreak}</span>
                      <ArrowRight className="h-4 w-4 text-[#a0a0b0]" />
                      <span
                        className={
                          achievement === "not-achieved"
                            ? "text-red-600"
                            : "text-emerald-700"
                        }
                      >
                        {getStreakChange()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={footerBar}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("summary")}
                    className="h-9 flex-1 rounded-input border-primary/20 bg-white font-body text-xs font-semibold text-[#4a4a5a] hover:bg-[#f4f5ff]"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setStep("reflection")}
                    className="h-9 flex-1 rounded-input bg-primary font-body text-xs font-semibold text-white shadow-[0_4px_16px_rgba(58,90,254,0.22)] hover:bg-primary-hover"
                  >
                    Continue
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "reflection" && (
              <motion.div
                key="reflection"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 rounded-lg border border-primary/12 bg-[#fafbff] px-3 py-2 font-body text-[12px] text-[#4a4a5a]">
                  <Lightbulb className="h-4 w-4 shrink-0 text-primary" />
                  Capture learnings so next week is sharper.
                </div>

                {achievement !== "not-achieved" && (
                  <div>
                    <Label className="mb-2 flex items-center gap-2 font-body text-xs font-semibold text-[#0d0d0d]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      What worked well?
                    </Label>
                    <Textarea
                      value={whatWorked}
                      onChange={(e) => setWhatWorked(e.target.value)}
                      placeholder="e.g. Daily standups, smaller tasks, clearer priorities…"
                      className="min-h-[88px] rounded-input border-primary/18 font-body text-sm"
                    />
                  </div>
                )}

                <div>
                  <Label className="mb-2 flex items-center gap-2 font-body text-xs font-semibold text-[#0d0d0d]">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                    What blocked progress?
                  </Label>
                  <Textarea
                    value={whatDidnt}
                    onChange={(e) => setWhatDidnt(e.target.value)}
                    placeholder="e.g. Rework, dependencies, scope creep…"
                    className="min-h-[88px] rounded-input border-primary/18 font-body text-sm"
                  />
                </div>

                <div>
                  <Label className="mb-2 flex items-center gap-2 font-body text-xs font-semibold text-[#0d0d0d]">
                    <Lightbulb className="h-3.5 w-3.5 text-primary" />
                    Key learnings for next week
                  </Label>
                  <Textarea
                    value={learnings}
                    onChange={(e) => setLearnings(e.target.value)}
                    placeholder="e.g. Validate earlier, add buffer, clarify ownership…"
                    className="min-h-[88px] rounded-input border-primary/18 font-body text-sm"
                  />
                </div>

                <div className={footerBar}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("achievement")}
                    className="h-9 flex-1 rounded-input border-primary/20 bg-white font-body text-xs font-semibold text-[#4a4a5a] hover:bg-[#f4f5ff]"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="h-9 flex-1 rounded-input bg-primary font-body text-xs font-semibold text-white shadow-[0_4px_16px_rgba(58,90,254,0.22)] hover:bg-primary-hover disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="mr-2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Completing…
                      </>
                    ) : (
                      <>
                        Complete review
                        <CheckCircle2 className="ml-1 h-3.5 w-3.5" />
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "result" && resultData && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-4 pb-2"
              >
                <div
                  className={`rounded-xl border px-4 py-5 text-center ${getAchievementColor(resultData.achievement)}`}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.12 }}
                    className="mb-3 flex justify-center"
                  >
                    {resultData.achievement === "completed" ? (
                      <PartyPopper className="h-11 w-11 text-emerald-600" />
                    ) : resultData.achievement === "partial" ? (
                      <TrendingUp className="h-11 w-11 text-amber-600" />
                    ) : (
                      <TrendingDown className="h-11 w-11 text-red-600" />
                    )}
                  </motion.div>
                  <h3 className="font-heading text-base font-bold text-[#0d0d0d]">
                    {resultData.achievement === "completed" &&
                      "Outcome completed"}
                    {resultData.achievement === "partial" &&
                      "Solid partial progress"}
                    {resultData.achievement === "not-achieved" &&
                      "Week closed"}
                  </h3>
                  <p className="mt-1 font-body text-[11px] text-[#4a4a5a]">
                    Your weekly review is saved.
                  </p>
                </div>

                <div className="rounded-xl border border-primary/15 bg-[#fafbff] px-4 py-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="h-4 w-4 text-amber-600" />
                      <span className="font-body text-sm font-semibold text-[#0d0d0d]">
                        Weekly streak
                      </span>
                    </div>
                    {resultData.achievement !== "not-achieved" ? (
                      <Award className="h-4 w-4 text-primary" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-heading text-2xl font-bold tabular-nums text-[#b45309]">
                      {resultData.achievement !== "not-achieved"
                        ? currentStreak + 1
                        : 0}
                    </span>
                    <span className="font-body text-[11px] text-[#4a4a5a]">
                      {resultData.achievement !== "not-achieved"
                        ? "weeks in a row — keep the cadence."
                        : "Reset — start fresh next week."}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-primary/12 bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(58,90,254,0.05)]">
                    <p className="font-body text-[10px] font-medium uppercase tracking-wide text-[#6b6b7a]">
                      Milestones
                    </p>
                    <p className="font-heading text-lg font-bold tabular-nums text-[#0d0d0d]">
                      {resultData.milestonesCompleted}/{resultData.milestonesTotal}
                    </p>
                  </div>
                  <div className="rounded-xl border border-primary/12 bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(58,90,254,0.05)]">
                    <p className="font-body text-[10px] font-medium uppercase tracking-wide text-[#6b6b7a]">
                      Tasks
                    </p>
                    <p className="font-heading text-lg font-bold tabular-nums text-[#0d0d0d]">
                      {resultData.tasksCompleted}/{resultData.tasksTotal}
                    </p>
                  </div>
                </div>

                {(resultData.whatWorked ||
                  resultData.whatDidnt ||
                  resultData.learnings) && (
                  <div className="space-y-3 rounded-xl border border-primary/12 bg-[#fafbff] px-3 py-3">
                    <h4 className="font-heading text-xs font-semibold text-[#0d0d0d]">
                      Reflections
                    </h4>
                    {resultData.whatWorked && (
                      <div>
                        <p className="mb-1 flex items-center gap-1 font-body text-[10px] font-medium text-[#6b6b7a]">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          What worked
                        </p>
                        <p className="font-body text-sm leading-relaxed text-[#0d0d0d]">
                          {resultData.whatWorked}
                        </p>
                      </div>
                    )}
                    {resultData.whatDidnt && (
                      <div>
                        <p className="mb-1 flex items-center gap-1 font-body text-[10px] font-medium text-[#6b6b7a]">
                          <AlertCircle className="h-3 w-3 text-amber-600" />
                          Blockers
                        </p>
                        <p className="font-body text-sm leading-relaxed text-[#0d0d0d]">
                          {resultData.whatDidnt}
                        </p>
                      </div>
                    )}
                    {resultData.learnings && (
                      <div>
                        <p className="mb-1 flex items-center gap-1 font-body text-[10px] font-medium text-[#6b6b7a]">
                          <Lightbulb className="h-3 w-3 text-primary" />
                          Learnings
                        </p>
                        <p className="font-body text-sm leading-relaxed text-[#0d0d0d]">
                          {resultData.learnings}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  type="button"
                  onClick={onClose}
                  className="h-10 w-full rounded-input bg-primary font-body text-sm font-semibold text-white shadow-[0_4px_16px_rgba(58,90,254,0.22)] hover:bg-primary-hover"
                >
                  Done
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
