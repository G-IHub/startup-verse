/**
 * Week Timeline - Visual indicator showing current week and progress
 */
import React from "react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Calendar, CheckCircle2, Circle, TrendingUp } from "lucide-react";
import { cn } from "../ui/utils";
export function WeekTimeline({
  currentWeek,
  totalWeeks = 52,
  // Default to 52 weeks (1 year)
  completedWeeks,
  currentWeekProgress,
  currentWeekStartDate,
  showCompact = false,
}) {
  // Calculate week dates
  const weekEndDate = new Date(currentWeekStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + 6);
  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };
  if (showCompact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-900">
            {"Week "}
            {currentWeek}
          </span>
        </div>
        <div className="flex-1">
          <Progress value={currentWeekProgress} className="h-2" />
        </div>
        <span className="text-xs text-gray-600">
          {Math.round(currentWeekProgress)}%
        </span>
      </div>
    );
  }
  return (
    <Card className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-blue-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Calendar className="size-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {"Week "}
                {currentWeek}
                {" of "}
                {totalWeeks}
              </h3>
              <p className="text-sm text-gray-600">
                {formatDate(currentWeekStartDate)}
                {" - "}
                {formatDate(weekEndDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-white">
              <TrendingUp className="size-3 mr-1" />
              {completedWeeks}
              {" weeks completed"}
            </Badge>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700 font-medium">
              Week Progress
            </span>
            <span className="text-gray-600">
              {Math.round(currentWeekProgress)}% complete
            </span>
          </div>
          <Progress
            value={currentWeekProgress}
            className="h-3 bg-white/50"
          />
        </div>
        <div className="mt-4 flex items-center gap-2">
          {Array.from({
            length: Math.min(5, totalWeeks),
          }).map((_, i) => {
            const weekNum = completedWeeks - 2 + i;
            const isCompleted = weekNum < currentWeek;
            const isCurrent = weekNum === currentWeek;
            if (weekNum < 1) return null;
            return (
              <div
                key={i}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 p-2 rounded-lg transition-all",
                  isCurrent && "bg-blue-100",
                  !isCurrent && "opacity-60",
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="size-4 text-green-600" />
                ) : (
                  <Circle
                    className={cn(
                      "size-4",
                      isCurrent
                        ? "text-blue-600 fill-blue-600"
                        : "text-gray-400",
                    )}
                  />
                )}
                <span
                  className={cn(
                    "text-xs font-medium",
                    isCurrent
                      ? "text-blue-900"
                      : "text-gray-600",
                  )}
                >
                  W{weekNum}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
