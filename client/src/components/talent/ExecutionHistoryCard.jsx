import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  Target,
  Zap,
  AlertCircle,
  Award,
} from "lucide-react";
import {
  calculateExecutionHistory,
  getExecutionScoreLabel,
} from "../../utils/executionHistory";
export default function ExecutionHistoryCard({
  userId,
  userName,
  founderId,
  compact = false,
}) {
  const history = calculateExecutionHistory(userId, userName, founderId);
  const scoreInfo = getExecutionScoreLabel(history.executionScore);
  if (compact) {
    return (
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Execution Score
              </p>
              <p className={`text-2xl font-bold ${scoreInfo.color}`}>
                {history.executionScore}
              </p>
            </div>
            <Award className={`w-10 h-10 ${scoreInfo.color}`} />
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            {scoreInfo.label}
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-green-600">
                {history.tasksCompleted}
              </p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div>
              <p className="text-lg font-bold text-primary">
                {history.currentStreak}
              </p>
              <p className="text-xs text-muted-foreground">Week Streak</p>
            </div>
            <div>
              <p className="text-lg font-bold text-blue-600">
                {history.uniqueMilestonesCount}
              </p>
              <p className="text-xs text-muted-foreground">Milestones</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Execution History
            </CardTitle>
            <CardDescription className="mt-1">
              Your track record on StartupVerse
            </CardDescription>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${scoreInfo.color}`}>
              {history.executionScore}
            </div>
            <Badge variant="outline" className="mt-1">
              {scoreInfo.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            {scoreInfo.description}
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <p className="text-xs text-green-700 font-medium">
                Completed
              </p>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {history.tasksCompleted}
            </p>
            <p className="text-xs text-green-600 mt-0.5">
              {history.completionRate}% rate
            </p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-600" />
              <p className="text-xs text-blue-700 font-medium">
                In Progress
              </p>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {history.tasksInProgress}
            </p>
            <p className="text-xs text-blue-600 mt-0.5">
              active now
            </p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-purple-600" />
              <p className="text-xs text-purple-700 font-medium">
                Milestones
              </p>
            </div>
            <p className="text-2xl font-bold text-purple-900">
              {history.uniqueMilestonesCount}
            </p>
            <p className="text-xs text-purple-600 mt-0.5">
              contributed
            </p>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-orange-600" />
              <p className="text-xs text-orange-700 font-medium">
                Streak
              </p>
            </div>
            <p className="text-2xl font-bold text-orange-900">
              {history.currentStreak}
            </p>
            <p className="text-xs text-orange-600 mt-0.5">
              {history.currentStreak === 1 ? "week" : "weeks"}
            </p>
          </div>
        </div>
        {history.totalTasksAssigned === 0 && (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium">No execution history yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Start contributing to tasks to build your track record
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
