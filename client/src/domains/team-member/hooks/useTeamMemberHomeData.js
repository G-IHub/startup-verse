import { useCallback, useEffect, useMemo, useState } from "react";
import * as teamMemberApi from "../../../utils/api/teamMemberApi";
import * as agendaApi from "../../../utils/api/agendaApi";
import * as presenceApi from "../../../utils/presenceApi";
import { getTasks } from "../../../utils/executionEngine";
import { mapTeamMemberHomeViewModel } from "../mappers/teamMemberViewModel";

function readFallbackUsers() {
  return [];
}

function readFallbackTasks(user) {
  const founderId = String(user?.startupId || user?.founderId || "");
  const normalizedUserId = String(user?._id || user?.id || "");
  if (!founderId) return [];
  const rows = getTasks(founderId);
  return (Array.isArray(rows) ? rows : []).filter(
    (task) => String(task.assignedTo || "") === normalizedUserId,
  );
}

export function useTeamMemberHomeData({ user }) {
  const startupId = String(user?.startupId || user?.founderId || "");
  const normalizedUserId = String(user?._id || user?.id || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingTaskId, setUpdatingTaskId] = useState("");
  const [savingCheckIn, setSavingCheckIn] = useState(false);
  const [rawData, setRawData] = useState({
    tasks: [],
    status: null,
    presence: [],
    agenda: [],
    fallbackUsers: [],
    fallbackTasks: [],
  });

  const loadData = useCallback(
    async ({ silent = false } = {}) => {
      if (!normalizedUserId) {
        setLoading(false);
        return;
      }

      if (!silent) setLoading(true);
      setError("");

      const fallbackUsers = readFallbackUsers();
      const fallbackTasks = readFallbackTasks(user);

      const [tasksResult, statusResult, agendaResult, presenceResult] =
        await Promise.allSettled([
          teamMemberApi.getTeamMemberTasks(normalizedUserId),
          teamMemberApi.getTeamMemberStatus(normalizedUserId),
          agendaApi.getUpcomingAgenda(normalizedUserId, 14),
          startupId ? presenceApi.getActiveUsers(startupId) : Promise.resolve({ success: true, presence: [] }),
        ]);

      const tasks = tasksResult.status === "fulfilled" ? tasksResult.value || [] : [];
      const status = statusResult.status === "fulfilled" ? statusResult.value || null : null;
      const agenda =
        agendaResult.status === "fulfilled" && agendaResult.value?.success
          ? agendaResult.value.agenda || []
          : [];
      const presence =
        presenceResult.status === "fulfilled" && presenceResult.value?.success
          ? presenceResult.value.presence || []
          : [];

      setRawData({
        tasks,
        status,
        agenda,
        presence,
        fallbackUsers,
        fallbackTasks,
      });

      const criticalFailed =
        tasksResult.status === "rejected" &&
        statusResult.status === "rejected" &&
        agendaResult.status === "rejected";

      if (criticalFailed) {
        setError("Could not sync team workspace from backend. Showing fallback data.");
      }

      setLoading(false);
    },
    [normalizedUserId, startupId, user],
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const updateTaskStatus = useCallback(
    async (task, update) => {
      if (!task?.id || !update?.status) {
        return { success: false, error: "Missing task update payload." };
      }

      setUpdatingTaskId(String(task.id));
      try {
        const payload = {
          status: update.status,
        };

        if (update.status === "completed") {
          payload.completedAt = new Date().toISOString();
          payload.completedBy = normalizedUserId;
          payload.completedByName = user.name;
        }

        if (update.status === "blocked") {
          payload.blockerReason = String(update.blockerReason || "");
          payload.blockerNote = String(update.blockerNote || "");
        }

        await teamMemberApi.updateTaskStatus(normalizedUserId, task.id, payload);
        await loadData({ silent: true });
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Could not update task.",
        };
      } finally {
        setUpdatingTaskId("");
      }
    },
    [loadData, normalizedUserId, user.name],
  );

  const saveCheckIn = useCallback(
    async ({ status, note }) => {
      setSavingCheckIn(true);
      try {
        await teamMemberApi.saveTeamMemberStatus(normalizedUserId, {
          status,
          note,
          startupId,
        });
        await loadData({ silent: true });
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Could not save check-in.",
        };
      } finally {
        setSavingCheckIn(false);
      }
    },
    [loadData, normalizedUserId, startupId],
  );

  const viewModel = useMemo(
    () =>
      mapTeamMemberHomeViewModel({
        user,
        taskRows: rawData.tasks,
        statusRow: rawData.status,
        presenceRows: rawData.presence,
        agendaRows: rawData.agenda,
        fallbackUsers: rawData.fallbackUsers,
        fallbackTaskRows: rawData.fallbackTasks,
      }),
    [rawData, user],
  );

  return {
    loading,
    error,
    startupId,
    updatingTaskId,
    savingCheckIn,
    viewModel,
    refresh: loadData,
    updateTaskStatus,
    saveCheckIn,
  };
}
