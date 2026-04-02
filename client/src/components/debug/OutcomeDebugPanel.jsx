import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import {
  Bug,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  RefreshCw,
  Database,
  Eye,
  EyeOff,
} from "lucide-react";
import * as coreEngineApi from "../../utils/api/coreEngineApi";
import { toast } from "sonner";
export function OutcomeDebugPanel({ userId, visible = true }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [debugData, setDebugData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const loadDebugData = async () => {
    setIsLoading(true);
    try {
      const [outcomes, tasks, executionData] = await Promise.all([
        coreEngineApi.getWeeklyOutcomes(userId),
        coreEngineApi.getTasks(userId),
        coreEngineApi.getExecutionData(userId),
      ]);

      // Analyze for issues
      const activeOutcomes = outcomes.filter((o) => o.status === "active");
      const tasksWithoutOutcome = tasks.filter(
        (t) => !t.weekId && !t.outcomeId,
      );
      const orphanedTasks = tasks.filter((t) => {
        if (!t.milestoneId) return false;
        const hasOutcome = outcomes.some((o) =>
          o.milestones?.some((m) => m.id === t.milestoneId),
        );
        return !hasOutcome;
      });
      setDebugData({
        outcomes,
        tasks,
        executionData,
        issues: {
          multipleActiveOutcomes: activeOutcomes.length > 1,
          activeOutcomes,
          tasksWithoutOutcomeId: tasksWithoutOutcome.length,
          tasksWithoutOutcome,
          orphanedTasks: orphanedTasks.length,
          orphanedTasksList: orphanedTasks,
        },
      });
      console.log("📊 OUTCOME DEBUG DATA:", {
        outcomes,
        tasks,
        executionData,
        activeOutcomes: activeOutcomes.length,
        tasksWithoutOutcome: tasksWithoutOutcome.length,
        orphanedTasks: orphanedTasks.length,
      });
    } catch (error) {
      console.error("❌ Error loading debug data:", error);
      toast.error("Failed to load debug data");
    } finally {
      setIsLoading(false);
    }
  };
  const fixMultipleActiveOutcomes = async () => {
    if (
      !debugData?.issues?.activeOutcomes ||
      debugData.issues.activeOutcomes.length <= 1
    ) {
      toast.info("No multiple active outcomes to fix");
      return;
    }
    try {
      // Keep the most recent one, mark others as completed
      const sorted = [...debugData.issues.activeOutcomes].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      const toKeep = sorted[0];
      const toComplete = sorted.slice(1);
      console.log("🔧 Fixing multiple active outcomes:", {
        keeping: toKeep.id,
        completing: toComplete.map((o) => o.id),
      });

      // Mark old ones as completed
      for (const outcome of toComplete) {
        await coreEngineApi.updateWeeklyOutcome(userId, outcome.id, {
          status: "completed",
          completedAt: new Date().toISOString(),
        });
      }
      toast.success(
        `Fixed! Kept most recent outcome, marked ${toComplete.length} old ones as completed`,
      );
      await loadDebugData();
    } catch (error) {
      console.error("❌ Error fixing outcomes:", error);
      toast.error("Failed to fix outcomes");
    }
  };
  const associateTasksWithCurrentOutcome = async () => {
    if (!debugData?.executionData?.currentOutcome) {
      toast.error("No current outcome to associate tasks with");
      return;
    }
    try {
      const currentOutcome = debugData.executionData.currentOutcome;
      const tasksToFix = debugData.issues.tasksWithoutOutcome || [];
      console.log("🔧 Associating tasks with outcome:", {
        outcomeId: currentOutcome.id,
        weekId: currentOutcome.weekId,
        tasksCount: tasksToFix.length,
      });

      // Update each task to include weekId and outcomeId
      for (const task of tasksToFix) {
        const updatedTask = {
          ...task,
          weekId: currentOutcome.weekId,
          outcomeId: currentOutcome.id,
        };
        await coreEngineApi.saveTask(userId, updatedTask);
      }
      toast.success(
        `Associated ${tasksToFix.length} tasks with current outcome`,
      );
      await loadDebugData();
    } catch (error) {
      console.error("❌ Error associating tasks:", error);
      toast.error("Failed to associate tasks");
    }
  };
  const deleteOrphanedTasks = async () => {
    if (
      !debugData?.issues?.orphanedTasksList ||
      debugData.issues.orphanedTasksList.length === 0
    ) {
      toast.info("No orphaned tasks to delete");
      return;
    }
    try {
      const tasksToDelete = debugData.issues.orphanedTasksList;
      console.log(
        "🗑️ Deleting orphaned tasks:",
        tasksToDelete.map((t) => t.id),
      );
      for (const task of tasksToDelete) {
        await coreEngineApi.deleteTask(userId, task.id);
      }
      toast.success(`Deleted ${tasksToDelete.length} orphaned tasks`);
      await loadDebugData();
    } catch (error) {
      console.error("❌ Error deleting tasks:", error);
      toast.error("Failed to delete tasks");
    }
  };
  useEffect(() => {
    if (isExpanded && !debugData) {
      loadDebugData();
    }
  }, [isExpanded]);
  if (!visible) return null;
  return (
    <Card className="border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-yellow-600" />
            <div>
              <CardTitle className="text-sm">
                Outcome & Task Debug Panel
              </CardTitle>
              <CardDescription className="text-xs">
                Diagnose and fix outcome/task issues
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8"
          >
            {isExpanded ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadDebugData}
              disabled={isLoading}
              className="flex-1"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              {isLoading ? "Loading..." : "Scan for Issues"}
            </Button>
          </div>
          {debugData && (
            <>
              <Separator />
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 bg-white dark:bg-gray-900 rounded border">
                  <div className="text-muted-foreground">Outcomes</div>
                  <div className="text-lg font-bold">
                    {debugData.outcomes.length}
                  </div>
                </div>
                <div className="p-2 bg-white dark:bg-gray-900 rounded border">
                  <div className="text-muted-foreground">Tasks</div>
                  <div className="text-lg font-bold">
                    {debugData.tasks.length}
                  </div>
                </div>
                <div className="p-2 bg-white dark:bg-gray-900 rounded border">
                  <div className="text-muted-foreground">Streak</div>
                  <div className="text-lg font-bold">
                    {debugData.executionData.streak}
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Issues Detected
                </h4>
                {debugData.issues.multipleActiveOutcomes ? (
                  <div className="p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="font-medium text-sm">
                            Multiple Active Outcomes
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {"Found "}
                          {debugData.issues.activeOutcomes.length}
                          {" active outcomes. Only 1 should be active."}
                        </p>
                        <div className="space-y-1 mb-2">
                          {debugData.issues.activeOutcomes.map((o) => (
                            <div
                              key={o.id}
                              className="text-xs bg-white dark:bg-gray-900 p-1 rounded"
                            >
                              <div className="font-medium">{o.title}</div>
                              <div className="text-muted-foreground">
                                {"Week "}
                                {o.weekNumber}
                                {" • Created: "}
                                {new Date(o.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={fixMultipleActiveOutcomes}
                      className="w-full"
                    >
                      Fix: Keep Most Recent
                    </Button>
                  </div>
                ) : (
                  <div className="p-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Active outcomes: OK</span>
                    </div>
                  </div>
                )}
                {debugData.issues.tasksWithoutOutcomeId > 0 ? (
                  <div className="p-2 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className="w-4 h-4 text-orange-600" />
                          <span className="font-medium text-sm">
                            Tasks Missing Outcome Association
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {debugData.issues.tasksWithoutOutcomeId}
                          {" tasks don't have weekId/outcomeId fields"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={associateTasksWithCurrentOutcome}
                      className="w-full"
                    >
                      Fix: Associate with Current Outcome
                    </Button>
                  </div>
                ) : (
                  <div className="p-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Task associations: OK</span>
                    </div>
                  </div>
                )}
                {debugData.issues.orphanedTasks > 0 ? (
                  <div className="p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="font-medium text-sm">
                            Orphaned Tasks
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {debugData.issues.orphanedTasks}
                          {" tasks reference non-existent milestones"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={deleteOrphanedTasks}
                      className="w-full"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Orphaned Tasks
                    </Button>
                  </div>
                ) : (
                  <div className="p-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm">No orphaned tasks</span>
                    </div>
                  </div>
                )}
              </div>
              <Separator />
              <details className="text-xs">
                <summary className="cursor-pointer font-medium hover:underline">
                  <Database className="w-3 h-3 inline mr-1" />
                  View Raw Data
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded overflow-auto max-h-64 text-[10px]">
                  {JSON.stringify(debugData, null, 2)}
                </pre>
              </details>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
