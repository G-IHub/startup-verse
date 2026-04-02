/**
 * Week History Panel - Shows past weeks' outcomes and completion status
 */
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import {
  Calendar,
  CheckCircle2,
  Target,
  ChevronDown,
  ChevronRight,
  Clock,
  Award,
} from "lucide-react";
import { cn } from "../ui/utils";
export function WeekHistoryPanel({ history, onViewWeek, maxItems = 10 }) {
  const [expandedWeek, setExpandedWeek] = useState(null);
  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };
  const getCompletionColor = (rate) => {
    if (rate >= 90) return "text-green-600 dark:text-green-400";
    if (rate >= 70) return "text-blue-600 dark:text-blue-400";
    if (rate >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-orange-600 dark:text-orange-400";
  };
  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200 dark:border-green-800"
          >
            <CheckCircle2 className="size-3 mr-1" />
            Completed
          </Badge>
        );
      case "active":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800"
          >
            <Clock className="size-3 mr-1" />
            In Progress
          </Badge>
        );
      case "abandoned":
        return (
          <Badge
            variant="outline"
            className="bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300 border-gray-200 dark:border-gray-800"
          >
            Abandoned
          </Badge>
        );
    }
  };
  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="size-5" />
            Week History
          </CardTitle>
          <CardDescription>
            Your past weekly outcomes will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Calendar className="size-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No completed weeks yet</p>
            <p className="text-xs mt-1">
              Complete your first weekly outcome to start building your history
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  const displayHistory = history.slice(0, maxItems);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="size-5" />
          Week History
        </CardTitle>
        <CardDescription>
          {history.length} {history.length === 1 ? "week" : "weeks"}
          {" completed"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {displayHistory.map((week, index) => {
              const isExpanded = expandedWeek === week.weekId;
              return (
                <div key={week.weekId}>
                  <div
                    className={cn(
                      "p-4 rounded-lg border transition-all cursor-pointer",
                      isExpanded
                        ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800",
                    )}
                    onClick={() =>
                      setExpandedWeek(isExpanded ? null : week.weekId)
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="mt-0.5">
                          {isExpanded ? (
                            <ChevronDown className="size-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="size-4 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {"Week "}
                              {week.weekNumber}
                            </span>
                            {getStatusBadge(week.outcome.status)}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                            {formatDate(week.startDate)}
                            {" - "}
                            {formatDate(week.endDate)}
                          </p>
                          <p className="text-sm text-gray-800 dark:text-gray-200 truncate">
                            {week.outcome.title}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div
                          className={cn(
                            "text-2xl font-bold",
                            getCompletionColor(week.completionRate),
                          )}
                        >
                          {Math.round(week.completionRate)}%
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          completion
                        </div>
                      </div>
                    </div>
                    {isExpanded && (
                      <>
                        <Separator className="my-3" />
                        <div className="space-y-3">
                          {week.outcome.description && (
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {week.outcome.description}
                            </p>
                          )}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-white dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                              <div className="flex items-center gap-2 mb-1">
                                <Target className="size-4 text-blue-600 dark:text-blue-400" />
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  Milestones
                                </span>
                              </div>
                              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                {week.milestones.completed}/
                                {week.milestones.total}
                              </div>
                            </div>
                            <div className="p-3 bg-white dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                              <div className="flex items-center gap-2 mb-1">
                                <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  Tasks
                                </span>
                              </div>
                              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                {week.tasks.completed}/{week.tasks.total}
                              </div>
                            </div>
                          </div>
                          {week.outcome.completedAt && (
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <Award className="size-3" />
                              {"Completed "}
                              {new Date(
                                week.outcome.completedAt,
                              ).toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </div>
                          )}
                          {onViewWeek && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewWeek(week.weekId);
                              }}
                            >
                              View Full Details
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {history.length > maxItems && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {"Showing "}
                {maxItems}
                {" of "}
                {history.length}
                {" weeks"}
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
