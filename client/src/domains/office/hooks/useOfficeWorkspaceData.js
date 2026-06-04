import { useCallback, useEffect, useMemo, useState } from "react";
import { getStartupId } from "../../../utils/startupId";
import {
  subscribeToActivities,
  subscribeToAnnouncements,
  subscribeToTasks,
  subscribeToWins,
  isRealtimeConnected,
} from "../../../utils/realtimeSubscriptions";
import { refreshPresenceSnapshot } from "../../presence/presenceSync";
import {
  mapOfficeWorkspaceModel,
} from "../mappers/officeViewModel";
import { useOfficeStore } from "../../../state/useOfficeStore";

export function useOfficeWorkspaceData({ user }) {
  const startupId = useMemo(() => getStartupId(user || {}), [user]);
  const loading = useOfficeStore((s) => s.loading);
  const error = useOfficeStore((s) => s.error);
  const loadWorkspace = useOfficeStore((s) => s.loadWorkspace);
  const refreshWorkspace = useOfficeStore((s) => s.refresh);
  const teamMembers = useOfficeStore((s) => s.teamMembers);
  const pendingTalents = useOfficeStore((s) => s.pendingTalents);
  const presenceRows = useOfficeStore((s) => s.presenceRows);
  const activityRows = useOfficeStore((s) => s.activities);
  const winRows = useOfficeStore((s) => s.wins);
  const announcementRows = useOfficeStore((s) => s.announcements);
  const taskRows = useOfficeStore((s) => s.tasks);
  const agendaRows = useOfficeStore((s) => s.agenda);
  const patchTask = useOfficeStore((s) => s.patchTask);
  const patchActivity = useOfficeStore((s) => s.patchActivity);
  const patchAnnouncement = useOfficeStore((s) => s.patchAnnouncement);
  const patchWin = useOfficeStore((s) => s.patchWin);

  const [realtimeOnline, setRealtimeOnline] = useState(isRealtimeConnected());

  const resolvedUserId = String(user?._id ?? user?.id ?? "");

  const loadInitial = useCallback(
    async ({ silent = false } = {}) => {
      if (!startupId || !resolvedUserId) {
        return;
      }
      await loadWorkspace(user, { silent });
    },
    [startupId, resolvedUserId, user, loadWorkspace],
  );

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (!startupId) return undefined;
    let stopped = false;

    const probe = setInterval(() => {
      const connected = isRealtimeConnected();
      setRealtimeOnline(connected);
      if (!stopped && !connected) {
        void refreshPresenceSnapshot(startupId);
      }
    }, 8000);

    return () => {
      stopped = true;
      clearInterval(probe);
    };
  }, [startupId]);

  useEffect(() => {
    if (!startupId) return undefined;
    const unsubscribe = subscribeToActivities(startupId, (incomingRow) => {
      patchActivity(incomingRow);
    });
    return () => unsubscribe?.();
  }, [startupId, patchActivity]);

  useEffect(() => {
    if (!startupId) return undefined;
    const unsubscribe = subscribeToWins(startupId, (update) => {
      if (!update?.win) return;
      patchWin(update.win);
    });
    return () => unsubscribe?.();
  }, [startupId, patchWin]);

  useEffect(() => {
    if (!startupId) return undefined;
    const unsubscribe = subscribeToAnnouncements(startupId, (update) => {
      if (!update?.announcement) return;
      patchAnnouncement(update.announcement);
    });
    return () => unsubscribe?.();
  }, [startupId, patchAnnouncement]);

  useEffect(() => {
    if (!startupId || !resolvedUserId) return undefined;
    const pollContext = {
      role: user.role === "founder" ? "founder" : "team-member",
      founderId: startupId,
      userId: resolvedUserId,
    };
    const unsubscribe = subscribeToTasks(
      startupId,
      (update) => {
        if (!update?.task) return;
        patchTask(update.task);
      },
      pollContext,
    );
    return () => unsubscribe?.();
  }, [startupId, resolvedUserId, user?.role, patchTask]);

  const model = useMemo(
    () =>
      mapOfficeWorkspaceModel({
        user,
        teamMembers,
        pendingTalents,
        presenceRows,
        activityRows,
        winRows,
        announcementRows,
        taskRows,
        agendaRows,
      }),
    [
      user,
      teamMembers,
      pendingTalents,
      presenceRows,
      activityRows,
      winRows,
      announcementRows,
      taskRows,
      agendaRows,
    ],
  );

  return {
    ...model,
    loading,
    error: error || "",
    startupId,
    realtimeOnline,
    refresh: (options) => {
      if (options?.silent) return refreshWorkspace(user);
      return loadInitial(options);
    },
  };
}
