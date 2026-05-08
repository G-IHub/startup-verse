import { useCallback, useEffect, useMemo, useState } from "react";
import * as performanceApi from "../../../utils/api/performanceApi";
import * as teamMemberApi from "../../../utils/api/teamMemberApi";
import { getTasks } from "../../../utils/executionEngine";
import { mapTeamMemberPerformanceViewModel } from "../mappers/teamMemberViewModel";

function readFallbackTasks(user) {
  const founderId = String(user?.startupId || user?.founderId || "");
  if (!founderId) return [];
  const rows = getTasks(founderId);
  return (Array.isArray(rows) ? rows : []).filter(
    (task) => String(task.assignedTo || "") === String(user?.id || ""),
  );
}

export function useTeamMemberPerformanceData({ user }) {
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [error, setError] = useState("");
  const [rawData, setRawData] = useState({
    performance: null,
    tasks: [],
    usedFallback: false,
  });

  const loadMetrics = useCallback(async () => {
    if (!user?.id) return;
    setLoadingMetrics(true);
    setError("");

    const fallbackTasks = readFallbackTasks(user);

    const [performanceResult, tasksResult] = await Promise.allSettled([
      performanceApi.getPerformanceMetrics(user.id),
      teamMemberApi.getTeamMemberTasks(user.id),
    ]);

    const performanceOk = performanceResult.status === "fulfilled";
    const tasksOk = tasksResult.status === "fulfilled";
    const performance =
      performanceOk ? performanceResult.value || null : null;
    const tasks = tasksOk ? tasksResult.value || [] : fallbackTasks;
    const usedFallback = !performanceOk || !tasksOk;

    if (!performanceOk && !tasksOk) {
      setError(
        "Could not sync performance metrics from backend. Showing fallback values.",
      );
    } else if (usedFallback) {
      setError(
        "Performance is partially synced. Some cards are using fallback values.",
      );
    }

    setRawData({
      performance,
      tasks,
      usedFallback,
    });
    setLoadingMetrics(false);
  }, [user]);

  useEffect(() => {
    void loadMetrics();
  }, [loadMetrics]);

  const viewModel = useMemo(
    () =>
      mapTeamMemberPerformanceViewModel({
        taskRows: rawData.tasks,
        performanceRow: rawData.performance,
      }),
    [rawData],
  );

  return {
    loadingMetrics,
    error,
    hasPerformanceContract: Boolean(rawData.performance),
    usedFallback: rawData.usedFallback,
    performance: rawData.performance,
    viewModel,
    refresh: loadMetrics,
  };
}
