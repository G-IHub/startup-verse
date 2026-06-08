/**
 * Week Completion Celebration - Enhanced celebration modal when completing a week
 */
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import {
  Trophy,
  Target,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Calendar,
  Award,
  ArrowRight,
  PartyPopper,
} from "lucide-react";
import { cn } from "../ui/utils";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
export function WeekCompletionCelebration({
  isOpen,
  onClose,
  weekNumber,
  completionData,
  onStartNewWeek,
}) {
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(false);
  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      // Stop confetti after 5 seconds
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  const getPerformanceLevel = (rate) => {
    if (rate >= 90)
      return {
        level: "Outstanding",
        color: "text-green-600",
        icon: Trophy,
      };
    if (rate >= 70)
      return {
        level: "Great",
        color: "text-blue-600",
        icon: Award,
      };
    if (rate >= 50)
      return {
        level: "Good",
        color: "text-yellow-600",
        icon: CheckCircle2,
      };
    return {
      level: "Progress Made",
      color: "text-orange-600",
      icon: TrendingUp,
    };
  };
  const performance = getPerformanceLevel(completionData.completionRate);
  const PerformanceIcon = performance.icon;
  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.3}
        />
      )}
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />
          <div className="relative z-10">
            <div className="flex items-center justify-center mb-4">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-full">
                <PartyPopper className="size-12" />
              </div>
            </div>
            <DialogHeader>
              <DialogTitle className="text-3xl font-bold text-center text-white mb-2">
                {"Week "}
                {weekNumber}
                {" Complete! 🎉"}
              </DialogTitle>
              <DialogDescription className="text-center text-blue-100 text-lg">
                {completionData.outcomeTitle}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex justify-center">
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="p-6 text-center">
                <PerformanceIcon
                  className={cn("size-12 mx-auto mb-3", performance.color)}
                />
                <div
                  className={cn("text-2xl font-bold mb-1", performance.color)}
                >
                  {Math.round(completionData.completionRate)}%
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {performance.level}
                  {" Performance"}
                </div>
                <Progress
                  value={completionData.completionRate}
                  className="h-2 bg-white"
                />
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle2 className="size-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {completionData.completedTasks}/
                      {completionData.totalTasks}
                    </div>
                    <div className="text-sm text-gray-600">
                      Tasks Completed
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Target className="size-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {completionData.completedMilestones}/
                      {completionData.totalMilestones}
                    </div>
                    <div className="text-sm text-gray-600">
                      Milestones Hit
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Calendar className="size-4" />
            <span>
              {formatDate(completionData.startDate)}
              {" - "}
              {formatDate(completionData.endDate)}
            </span>
          </div>
          {completionData.streakDays !== undefined &&
            completionData.streakDays > 0 && (
              <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Sparkles className="size-5 text-orange-600" />
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {completionData.streakDays}
                          {" Day Streak"}
                        </div>
                        <div className="text-xs text-gray-600">
                          Keep the momentum going!
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-orange-100 text-orange-700 border-orange-300"
                    >
                      +{completionData.streakDays}
                      {" bonus"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
            <p className="text-sm text-gray-700">
              {getMotivationalMessage(completionData.completionRate)}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Review Later
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={() => {
                onClose();
                onStartNewWeek();
              }}
            >
              {"Start Week "}
              {weekNumber + 1}
              <ArrowRight className="size-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
function getMotivationalMessage(completionRate) {
  if (completionRate >= 90) {
    return "Outstanding work! You're crushing your goals. This is the kind of execution that builds successful startups. 🚀";
  }
  if (completionRate >= 70) {
    return "Great progress! You're maintaining solid momentum. Keep this pace and you'll achieve amazing things. 💪";
  }
  if (completionRate >= 50) {
    return "Good work! You're making steady progress. Remember, consistency beats perfection. Keep going! 🎯";
  }
  return "You completed another week! Progress is progress. Learn from this week and come back stronger. 📈";
}
