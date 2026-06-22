import { create } from "zustand";
import { apiPost, apiPut, apiDelete } from "../utils/apiClient.js";
import * as projectApi from "../utils/api/projectApi.js";
import {
  mapProjectsList,
  mapProjectDetail,
} from "../domains/founder/mappers/projectMapper.js";
import { subscribeToProjectRealtime } from "../utils/socketIoRealtime.js";

function asList(value) {
  return Array.isArray(value) ? value : [];
}

function taskIdOf(task) {
  return String(task?.id || task?._id || "");
}

let unsubscribeRealtime = null;

function teardownRealtime() {
  if (typeof unsubscribeRealtime === "function") {
    unsubscribeRealtime();
  }
  unsubscribeRealtime = null;
}

const initialState = {
  founderId: null,
  projects: [],
  activeProject: null,
  activeProjectSlug: null,
  projectMilestones: [],
  projectTasks: [],
  viewModel: null,
  loading: false,
  refreshing: false,
  error: null,
  lastLoadedAt: null,
};

export const useProjectStore = create((set, get) => ({
  ...initialState,

  setFounderId(founderId) {
    set({ founderId: founderId || null });
  },

  async load(founderId, options = {}) {
    const id = founderId || get().founderId;
    if (!id) return null;

    const silent = options.silent === true;
    const bustCache = options.bustCache === true;
    if (silent) {
      set({ refreshing: true });
    } else {
      set({ loading: true, error: null });
    }

    try {
      const projects = await projectApi.listProjects(id, {
        status: options.status,
      });
      const viewModel = mapProjectsList(projects);
      set({
        founderId: id,
        projects,
        viewModel,
        loading: false,
        refreshing: false,
        error: null,
        lastLoadedAt: new Date().toISOString(),
      });
      return viewModel;
    } catch (error) {
      set({ loading: false, refreshing: false, error });
      throw error;
    }
  },

  async refresh(founderIdOverride) {
    const id = founderIdOverride || get().founderId;
    if (!id) return null;
    await get().load(id, { silent: true, bustCache: true });
    const slug = get().activeProjectSlug;
    if (slug) {
      await get().setActiveProject(slug, { silent: true });
    }
    return get().viewModel;
  },

  async setActiveProject(projectSlug, options = {}) {
    const id = get().founderId;
    if (!id || !projectSlug) return null;

    const silent = options.silent === true;
    if (!silent) {
      set({ loading: true, error: null, activeProjectSlug: projectSlug });
    } else {
      set({ refreshing: true, activeProjectSlug: projectSlug });
    }

    try {
      const [project, milestones, tasks] = await Promise.all([
        projectApi.getProject(id, projectSlug),
        projectApi.getProjectMilestones(id, projectSlug),
        projectApi.getProjectTasks(id, projectSlug),
      ]);

      const detail = mapProjectDetail(project);
      const startupId = String(project?.startupId || "");

      teardownRealtime();
      if (startupId) {
        unsubscribeRealtime = subscribeToProjectRealtime(startupId, {
          onTaskUpdated: (task) => {
            const tid = taskIdOf(task);
            if (!tid) return;
            get().patchTask(tid, task);
          },
          onProjectUpdated: ({ projectId, changes }) => {
            const active = get().activeProject;
            if (!active || String(active.id || active._id) !== String(projectId)) {
              return;
            }
            set({
              activeProject: { ...active, ...changes },
            });
          },
          onProjectSynced: ({ projectId }) => {
            const active = get().activeProject;
            if (!active || String(active.id || active._id) !== String(projectId)) {
              return;
            }
            const slug = get().activeProjectSlug;
            if (slug) {
              projectApi.getProjectTasks(id, slug).then((rows) => {
                set({ projectTasks: asList(rows) });
              });
            }
          },
        });
      }

      set({
        activeProject: project,
        activeProjectSlug: projectSlug,
        projectMilestones: asList(milestones),
        projectTasks: asList(tasks),
        viewModel: detail,
        loading: false,
        refreshing: false,
        error: null,
        lastLoadedAt: new Date().toISOString(),
      });

      return detail;
    } catch (error) {
      set({ loading: false, refreshing: false, error });
      throw error;
    }
  },

  clearActiveProject() {
    teardownRealtime();
    set({
      activeProject: null,
      activeProjectSlug: null,
      projectMilestones: [],
      projectTasks: [],
    });
  },

  async createProject(data) {
    const id = get().founderId;
    if (!id) throw new Error("Missing founder context.");
    const created = await projectApi.createProject(id, data);
    if (created) {
      set((state) => {
        const nextProjects = [
          created,
          ...state.projects.filter((p) => taskIdOf(p) !== taskIdOf(created)),
        ];
        return {
          projects: nextProjects,
          viewModel: mapProjectsList(nextProjects),
        };
      });
    }
    return created;
  },

  async updateProject(slug, data) {
    const id = get().founderId;
    if (!id || !slug) return null;
    const updated = await projectApi.updateProject(id, slug, data);
    if (updated) {
      set((state) => {
        const nextProjects = state.projects.map((p) =>
          String(p.slug) === String(slug) ? updated : p,
        );
        const nextActive =
          state.activeProjectSlug === slug ? updated : state.activeProject;
        return {
          projects: nextProjects,
          activeProject: nextActive,
          viewModel: mapProjectsList(nextProjects),
        };
      });
    }
    return updated;
  },

  async archiveProject(slug) {
    const id = get().founderId;
    if (!id || !slug) return null;
    await projectApi.archiveProject(id, slug);
    set((state) => {
      const nextProjects = state.projects.filter((p) => String(p.slug) !== String(slug));
      const clearActive = state.activeProjectSlug === slug;
      if (clearActive) teardownRealtime();
      return {
        projects: nextProjects,
        viewModel: mapProjectsList(nextProjects),
        ...(clearActive
          ? {
              activeProject: null,
              activeProjectSlug: null,
              projectMilestones: [],
              projectTasks: [],
            }
          : {}),
      };
    });
    return { archived: true };
  },

  async addMember(slug, { userId, role }) {
    const id = get().founderId;
    if (!id || !slug) return null;
    const updated = await projectApi.addProjectMember(id, slug, { userId, role });
    if (updated && get().activeProjectSlug === slug) {
      set({ activeProject: updated });
    }
    return updated;
  },

  async removeMember(slug, userId) {
    const id = get().founderId;
    if (!id || !slug || !userId) return null;
    const updated = await projectApi.removeProjectMember(id, slug, userId);
    if (updated && get().activeProjectSlug === slug) {
      set({ activeProject: updated });
    }
    return updated;
  },

  async connectGithub(slug, { owner, repo, syncEnabled }) {
    const id = get().founderId;
    if (!id || !slug) return null;
    const updated = await projectApi.connectProjectGithub(id, slug, {
      owner,
      repo,
      syncEnabled,
    });
    if (updated && get().activeProjectSlug === slug) {
      set({ activeProject: updated });
    }
    return updated;
  },

  async triggerGithubSync(slug) {
    const id = get().founderId;
    if (!id || !slug) return null;
    const result = await projectApi.syncProjectGithub(id, slug);
    await get().setActiveProject(slug, { silent: true });
    return result;
  },

  async loadProjectMilestones(projectSlug) {
    const id = get().founderId;
    const slug = projectSlug || get().activeProjectSlug;
    if (!id || !slug) return [];
    const milestones = await projectApi.getProjectMilestones(id, slug);
    if (get().activeProjectSlug === slug) {
      set({ projectMilestones: asList(milestones) });
    }
    return milestones;
  },

  async loadProjectTasks(projectSlug, query) {
    const id = get().founderId;
    const slug = projectSlug || get().activeProjectSlug;
    if (!id || !slug) return [];
    const tasks = await projectApi.getProjectTasks(id, slug, query || {});
    if (get().activeProjectSlug === slug) {
      set({ projectTasks: asList(tasks) });
    }
    return tasks;
  },

  async createMilestone(projectSlug, data) {
    const id = get().founderId;
    const slug = projectSlug || get().activeProjectSlug;
    const project = get().activeProject;
    if (!id || !slug || !project) return null;
    const projectId = project.id || project._id;
    await apiPost(`/founders/${id}/milestones`, {
      milestone: { ...data, projectId },
    });
    return get().loadProjectMilestones(slug);
  },

  async updateMilestone(projectSlug, milestoneId, data) {
    const id = get().founderId;
    const slug = projectSlug || get().activeProjectSlug;
    if (!id || !milestoneId) return null;
    await apiPut(`/founders/${id}/milestones/${milestoneId}`, {
      milestone: data || {},
    });
    return get().loadProjectMilestones(slug);
  },

  async deleteMilestone(projectSlug, milestoneId) {
    const id = get().founderId;
    const slug = projectSlug || get().activeProjectSlug;
    if (!id || !milestoneId) return null;
    await apiDelete(`/founders/${id}/milestones/${milestoneId}`);
    await get().loadProjectMilestones(slug);
    await get().loadProjectTasks(slug);
    return { deleted: true };
  },

  async createTask(projectSlug, data) {
    const id = get().founderId;
    const slug = projectSlug || get().activeProjectSlug;
    const project = get().activeProject;
    if (!id || !slug || !project) return null;
    const projectId = project.id || project._id;
    const created = await apiPost(`/founders/${id}/tasks`, {
      task: { ...data, projectId },
    });
    await get().loadProjectTasks(slug);
    return created;
  },

  async updateTaskStatus(taskId, status, blockerPayload = {}) {
    const id = get().founderId;
    if (!id || !taskId) return null;
    await apiPut(`/founders/${id}/tasks/${taskId}/status`, {
      status,
      ...blockerPayload,
      updatedAt: new Date().toISOString(),
    });
    const slug = get().activeProjectSlug;
    if (slug) {
      await get().loadProjectTasks(slug);
    }
    return null;
  },

  patchTask(taskId, updates) {
    const tid = String(taskId || "");
    if (!tid) return;
    set((state) => ({
      projectTasks: state.projectTasks.map((t) =>
        taskIdOf(t) === tid ? { ...t, ...updates } : t,
      ),
    }));
  },
}));
