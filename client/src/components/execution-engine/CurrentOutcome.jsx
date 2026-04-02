import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Button } from "../ui/button";
import { Target, CheckCircle2, Circle, ChevronRight, Flag } from "lucide-react";
export default function CurrentOutcome({
  outcome,
  onSelectOutcome,
  onViewDetails,
  onCompleteWeekReview,
  isLoading = false,
}) {
  // ⚡ LOADING STATE - Show skeleton while fetching data
  if (isLoading) {
    return (
      <Card className="shadow-lg border-primary/30">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
                <div className="w-24 h-5 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="w-3/4 h-7 bg-gray-200 rounded animate-pulse" />
              <div className="w-full h-4 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="text-right ml-4">
              <div className="w-12 h-9 bg-gray-200 rounded animate-pulse mx-auto" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="w-full h-3 bg-gray-200 rounded animate-pulse" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse" />
                <div className="flex-1 h-5 bg-gray-200 rounded animate-pulse" />
                <div className="w-12 h-5 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  if (!outcome) {
    return (
      <Card className="border-2 border-dashed border-primary/30 hover:border-primary/50 transition-all">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Weekly Outcome Set</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Choose one focused outcome to achieve this week. This becomes your
            team's north star and drives measurable progress.
          </p>
          <Button onClick={onSelectOutcome} size="lg" className="gap-2">
            <Target className="w-5 h-5" />
            Set This Week's Outcome
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            💡 Tip: Try the "Describe in Your Own Words" option - just tell us
            what you want to accomplish!
          </p>
        </CardContent>
      </Card>
    );
  }
  const calculateProgress = () => {
    const totalTasks = outcome.milestones.reduce(
      (sum, m) => sum + m.totalTasks,
      0,
    );
    const completedTasks = outcome.milestones.reduce(
      (sum, m) => sum + m.tasksCompleted,
      0,
    );
    return totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  };
  const completedMilestones = outcome.milestones.filter(
    (m) => m.status === "completed",
  ).length;
  const totalMilestones = outcome.milestones.length;
  const progress = calculateProgress();
  const getMilestoneIcon = (status) => {
    if (status === "completed")
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (status === "in-progress")
      return <Circle className="w-4 h-4 text-primary fill-primary/20" />;
    return <Circle className="w-4 h-4 text-muted-foreground" />;
  };
  return (
    <Card className="shadow-lg border-primary/30">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-primary" />
              <Badge variant="outline" className="text-primary border-primary">
                {"Week "}
                {outcome.weekNumber}
                {" Focus"}
              </Badge>
            </div>
            <CardTitle className="text-2xl">{outcome.title}</CardTitle>
            <CardDescription className="text-base mt-1">
              {outcome.description}
            </CardDescription>
          </div>
          <div className="text-right ml-4">
            <div className="text-3xl font-bold text-primary">
              {Math.round(progress)}%
            </div>
            <p className="text-xs text-muted-foreground">Complete</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Progress value={progress} className="h-3 [&>div]:bg-[#3A5AFE]" />
          <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
            <span>
              {completedMilestones}
              {" of "}
              {totalMilestones}
              {" milestones complete"}
            </span>
            <span>{Math.round(progress)}% progress</span>
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Milestones</h4>
          <div className="space-y-2">
            {outcome.milestones.map((milestone) => (
              <div
                key={milestone.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${milestone.status === "completed" ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900" : milestone.status === "in-progress" ? "bg-primary/5 border-primary/20" : "bg-muted/30"}`}
              >
                <div className="flex items-center gap-3 flex-1">
                  {getMilestoneIcon(milestone.status)}
                  <div>
                    <p
                      className={`font-medium ${milestone.status === "completed" ? "line-through text-muted-foreground" : ""}`}
                    >
                      {milestone.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {milestone.tasksCompleted}/{milestone.totalTasks}
                      {" tasks"}
                    </p>
                  </div>
                </div>
                {milestone.status === "in-progress" && (
                  <Progress
                    value={
                      (milestone.tasksCompleted / milestone.totalTasks) * 100
                    }
                    className="w-20 h-2"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        <Button onClick={onViewDetails} variant="outline" className="w-full">
          View All Tasks & Details
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
        <Button
          onClick={onCompleteWeekReview}
          className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white"
          size="lg"
        >
          <Flag className="w-5 h-5 mr-2" />
          Complete Week Review
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          Review your progress, capture learnings, and update your streak 🔥
        </p>
      </CardContent>
    </Card>
  );
}
