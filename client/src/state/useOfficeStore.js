import { create } from "zustand";
import * as teamMemberApi from "../utils/api/teamMemberApi";
import * as activityApi from "../utils/activityApi";
import * as presenceApi from "../utils/presenceApi";
import * as agendaApi from "../utils/api/agendaApi";
import * as taskApi from "../utils/api/taskApi";
import * as meetingApi from "../utils/api/meetingApi";
import { getStartupAnnouncements, postStartupAnnouncement } from "../utils/announcementApi";
import { postWin } from "../utils/activityApi";
import { getReceivedInterests } from "../utils/api/inboxApi";
import { normalizePresenceRow } from "../domains/presence/presenceModel.js";
import { getStartupId } from "../utils/startupId.js";

function initialState() {
  return {
    startupId: "",
    founderId: "",
    userId: "",
    userRole: "",
    teamMembers: [],
    pendingTalents: [],
    presenceRows: [],
    activities: [],
    wins: [],
    announcements: [],
    agenda: [],
    meetings: [],
    tasks: [],
    loading: false,
    error: "",
    lastUpdatedAt: 0,
  };
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function mergeById(existing, incoming) {
  const map = new Map();
  safeArray(existing).forEach((row) => {
    map.set(String(row?.id || row?._id || ""), row);
  });
  safeArray(incoming).forEach((row) => {
    const id = String(row?.id || row?._id || "");
    if (!id) return;
    map.set(id, { ...(map.get(id) || {}), ...row });
  });
  return Array.from(map.values());
}

function resolveFounderId(user = {}) {
  if (user?.role === "founder") return String(user._id ?? user.id ?? "");
  return String(user?.startupId || user?.founderId || "");
}

export const useOfficeStore = create((set, get) => ({
  ...initialState(),

  async loadWorkspace(user, options = {}) {
    const rawId = String(user?._id ?? user?.id ?? "");
    const startupId = getStartupId(user);
    const founderId =
      user?.role === "founder" ? rawId : String(user?.founderId || startupId || "");
    const userId = rawId;
    const userRole = String(user?.role || "");

    if (!startupId || !founderId || !userId) {
      set({
        ...initialState(),
        error: "Office workspace needs a valid user and startup context.",
      });
      return;
    }

    if (!options.silent) {
      set({ loading: true, error: "" });
    } else {
      set({ error: "" });
    }

    const tasksPromise =
      userRole === "founder"
        ? taskApi.getFounderTasks(founderId)
        : taskApi.getTeamMemberTasks(userId);

    const [
      teamMembersRes,
      activitiesRes,
      winsRes,
      announcementsRes,
      agendaRes,
      meetingsRes,
      presenceRes,
      tasksRes,
      pendingTalentsRes,
    ] = await Promise.allSettled([
      teamMemberApi.getStartupTeamMembers(startupId),
      activityApi.getStartupActivities(startupId, { limit: 50 }),
      activityApi.getStartupWins(startupId, { limit: 50 }),
      getStartupAnnouncements(startupId),
      agendaApi.getUpcomingAgenda(userId, 14),
      meetingApi.getStartupMeetings(startupId),
      presenceApi.getActiveUsers(startupId),
      tasksPromise,
      userRole === "founder" ? getReceivedInterests(founderId) : Promise.resolve([]),
    ]);

    const hasCriticalError =
      activitiesRes.status === "rejected" &&
      announcementsRes.status === "rejected" &&
      tasksRes.status === "rejected";

    set((previous) => ({
      startupId,
      founderId,
      userId,
      userRole,
      teamMembers:
        teamMembersRes.status === "fulfilled"
          ? safeArray(teamMembersRes.value)
          : previous.teamMembers,
      pendingTalents:
        pendingTalentsRes.status === "fulfilled"
          ? (() => {
              // Dedup by talentId — keep the most recent interest per talent
              const byTalentId = new Map();
              for (const i of safeArray(pendingTalentsRes.value)) {
                if (i.status !== "pending" && i.status !== "proposed-by-talent") continue;
                const tid = String(i.talentId?._id || i.talentId || "");
                if (!tid) continue;
                const existing = byTalentId.get(tid);
                if (!existing || new Date(i.createdAt) > new Date(existing.createdAt)) {
                  byTalentId.set(tid, i);
                }
              }
              return Array.from(byTalentId.values()).map((i) => ({
                id: String(i.talentId?._id || i.talentId || ""),
                name: String(i.talentName || i.talentId?.name || "Interested Talent"),
                role: "talent",
                title: String(i.talentArea || ""),
                interestId: String(i._id || i.id || ""),
              }));
            })()
          : previous.pendingTalents,
      activities:
        activitiesRes.status === "fulfilled" && activitiesRes.value?.success
          ? safeArray(activitiesRes.value.activities)
          : previous.activities,
      wins:
        winsRes.status === "fulfilled" && winsRes.value?.success
          ? safeArray(winsRes.value.wins)
          : previous.wins,
      announcements:
        announcementsRes.status === "fulfilled" && announcementsRes.value?.success
          ? safeArray(announcementsRes.value.announcements)
          : previous.announcements,
      agenda:
        agendaRes.status === "fulfilled" && agendaRes.value?.success
          ? safeArray(agendaRes.value.agenda)
          : previous.agenda,
      meetings:
        meetingsRes.status === "fulfilled"
          ? safeArray(meetingsRes.value)
          : previous.meetings,
      presenceRows:
        presenceRes.status === "fulfilled" && presenceRes.value?.success
          ? safeArray(presenceRes.value.presence)
              .map((row) => normalizePresenceRow(row))
              .filter(Boolean)
          : previous.presenceRows,
      tasks:
        tasksRes.status === "fulfilled"
          ? safeArray(tasksRes.value)
          : previous.tasks,
      loading: false,
      error: hasCriticalError ? "Could not sync Office workspace from backend." : "",
      lastUpdatedAt: Date.now(),
    }));
  },

  async refresh(user) {
    return get().loadWorkspace(user, { silent: true });
  },

  /** Authoritative snapshot from GET /presence/:startupId — replaces roster presence. */
  setPresenceFromServer(rows) {
    const normalized = safeArray(rows)
      .map((row) => normalizePresenceRow(row))
      .filter(Boolean);
    set({ presenceRows: normalized });
  },

  /** @deprecated Prefer setPresenceFromServer. */
  patchPresence(rows) {
    get().setPresenceFromServer(rows);
  },

  patchTask(task) {
    if (!task) return;
    set((previous) => ({ tasks: mergeById(previous.tasks, [task]) }));
  },

  removeTask(taskId) {
    if (!taskId) return;
    set((previous) => ({
      tasks: previous.tasks.filter(
        (row) => String(row?.id || row?._id || "") !== String(taskId),
      ),
    }));
  },

  patchActivity(activity) {
    if (!activity) return;
    set((previous) => ({ activities: mergeById(previous.activities, [activity]) }));
  },

  patchAnnouncement(announcement) {
    if (!announcement) return;
    set((previous) => ({
      announcements: mergeById(previous.announcements, [announcement]),
    }));
  },

  patchWin(win) {
    if (!win) return;
    set((previous) => ({ wins: mergeById(previous.wins, [win]) }));
  },

  async createTask(task) {
    const founderId = get().founderId;
    if (!founderId) throw new Error("Founder context missing for task creation.");
    const created = await taskApi.saveTask(founderId, task);
    get().patchTask(created);
    return created;
  },

  async updateTaskStatus(taskId, status, additionalData = {}) {
    const founderId = get().founderId;
    if (!founderId) throw new Error("Founder context missing for task update.");
    const updated = await taskApi.updateTaskStatus(
      founderId,
      taskId,
      status,
      additionalData,
    );
    get().patchTask(updated);
    return updated;
  },

  async assignTask(taskId, assigneeId, assigneeName) {
    const founderId = get().founderId;
    if (!founderId) throw new Error("Founder context missing for task assignment.");
    const updated = await taskApi.assignTask(founderId, taskId, assigneeId, assigneeName);
    get().patchTask(updated);
    return updated;
  },

  async deleteTask(taskId) {
    const founderId = get().founderId;
    if (!founderId) throw new Error("Founder context missing for task deletion.");
    await taskApi.deleteTask(founderId, taskId);
    get().removeTask(taskId);
  },

  async createAnnouncement(input) {
    const startupId = get().startupId;
    if (!startupId) throw new Error("Startup context missing for announcements.");
    const result = await postStartupAnnouncement(startupId, input);
    if (!result?.success || !result?.announcement) {
      throw new Error("Unable to publish announcement.");
    }
    get().patchAnnouncement(result.announcement);
    return result.announcement;
  },

  async createWin(input) {
    const startupId = get().startupId;
    const userId = get().userId;
    if (!startupId || !userId) throw new Error("Workspace context missing for wins.");
    const result = await postWin({
      startupId,
      userId,
      message: input?.message || "",
    });
    if (!result?.success || !result?.win) {
      throw new Error("Unable to publish win.");
    }
    get().patchWin(result.win);
    return result.win;
  },
}));

