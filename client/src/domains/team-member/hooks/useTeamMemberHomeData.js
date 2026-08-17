import { useCallback, useEffect, useMemo, useState } from "react";
import * as teamMemberApi from "../../../utils/api/teamMemberApi";
import * as agendaApi from "../../../utils/api/agendaApi";
import * as presenceApi from "../../../utils/presenceApi";
import { uploadFile } from "../../../utils/api/uploadApi";
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
  const [savingWorkLog, setSavingWorkLog] = useState(false);
  const [rawData, setRawData] = useState({
    tasks: [],
    status: null,
    presence: [],
    agenda: [],
    workLogs: [],
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

      const [tasksResult, statusResult, agendaResult, presenceResult, workLogsResult] =
        await Promise.allSettled([
          teamMemberApi.getTeamMemberTasks(normalizedUserId),
          teamMemberApi.getTeamMemberStatus(normalizedUserId),
          agendaApi.getUpcomingAgenda(normalizedUserId, 14),
          startupId ? presenceApi.getActiveUsers(startupId) : Promise.resolve({ success: true, presence: [] }),
          teamMemberApi.getTeamMemberWorkLogs(normalizedUserId),
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

      const workLogs =
        workLogsResult.status === "fulfilled" ? workLogsResult.value || [] : [];

      setRawData({
        tasks,
        status,
        agenda,
        presence,
        workLogs,
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

  const persistWorkLog = useCallback(
    async ({ title, description, linkUrl, imageFile, removeImage, existingImage }, workLogId) => {
      setSavingWorkLog(true);
      try {
        let image;
        if (imageFile) {
          const uploaded = await uploadFile(imageFile, "work-log");
          image = {
            url: uploaded.url,
            name: imageFile.name || uploaded.key || "image",
            mimeType: uploaded.mimeType || imageFile.type || "",
            size: uploaded.size || imageFile.size || 0,
          };
        } else if (removeImage) {
          image = null;
        } else if (!workLogId) {
          image = existingImage || null;
        }

        const payload = {
          title,
          description,
          linkUrl: linkUrl || "",
        };
        if (image !== undefined) payload.image = image;

        if (workLogId) {
          await teamMemberApi.updateTeamMemberWorkLog(
            normalizedUserId,
            workLogId,
            payload,
          );
        } else {
          await teamMemberApi.createTeamMemberWorkLog(normalizedUserId, payload);
        }
        await loadData({ silent: true });
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Could not save extra work.",
        };
      } finally {
        setSavingWorkLog(false);
      }
    },
    [loadData, normalizedUserId],
  );

  const deleteWorkLog = useCallback(
    async (workLogId) => {
      try {
        await teamMemberApi.deleteTeamMemberWorkLog(normalizedUserId, workLogId);
        await loadData({ silent: true });
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Could not delete extra work.",
        };
      }
    },
    [loadData, normalizedUserId],
  );

  const viewModel = useMemo(
    () =>
      mapTeamMemberHomeViewModel({
        user,
        taskRows: rawData.tasks,
        statusRow: rawData.status,
        presenceRows: rawData.presence,
        agendaRows: rawData.agenda,
        workLogRows: rawData.workLogs,
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
    savingWorkLog,
    viewModel,
    refresh: loadData,
    updateTaskStatus,
    saveCheckIn,
    persistWorkLog,
    deleteWorkLog,
  };
}
