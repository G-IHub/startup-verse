import { apiGet, apiPost, apiPut, apiDelete } from "../apiClient.js";

function normalizeProject(row) {
  if (!row || typeof row !== "object") return null;
  return {
    ...row,
    id: String(row.id || row._id || ""),
  };
}

function normalizeProjectList(payload) {
  if (Array.isArray(payload)) return payload.map(normalizeProject).filter(Boolean);
  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.projects)) {
      return payload.projects.map(normalizeProject).filter(Boolean);
    }
    if (Array.isArray(payload.items)) {
      return payload.items.map(normalizeProject).filter(Boolean);
    }
  }
  return [];
}

function projectPath(founderId, slug) {
  return `/founders/${founderId}/projects/${encodeURIComponent(slug)}`;
}

export async function listProjects(founderId, { status } = {}) {
  const params = status ? { status } : undefined;
  const data = await apiGet(`/founders/${founderId}/projects`, { params });
  return normalizeProjectList(data);
}

export async function createProject(founderId, project) {
  const data = await apiPost(`/founders/${founderId}/projects`, { project });
  return normalizeProject(data);
}

export async function getProject(founderId, slug) {
  const data = await apiGet(projectPath(founderId, slug));
  return normalizeProject(data);
}

export async function updateProject(founderId, slug, project) {
  const data = await apiPut(projectPath(founderId, slug), { project });
  return normalizeProject(data);
}

export async function archiveProject(founderId, slug) {
  const data = await apiDelete(projectPath(founderId, slug));
  return normalizeProject(data);
}

export async function addProjectMember(founderId, slug, member) {
  const data = await apiPost(`${projectPath(founderId, slug)}/members`, { member });
  return normalizeProject(data);
}

export async function removeProjectMember(founderId, slug, userId) {
  const data = await apiDelete(
    `${projectPath(founderId, slug)}/members/${encodeURIComponent(userId)}`,
  );
  return normalizeProject(data);
}

export async function connectProjectGithub(founderId, slug, github) {
  const data = await apiPut(`${projectPath(founderId, slug)}/github`, { github });
  return normalizeProject(data);
}

export async function syncProjectGithub(founderId, slug) {
  return apiPost(`${projectPath(founderId, slug)}/github/sync`, {});
}

export async function getProjectMilestones(founderId, slug) {
  const data = await apiGet(`${projectPath(founderId, slug)}/milestones`);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.milestones)) return data.milestones;
  return [];
}

export async function getProjectTasks(founderId, slug, query = {}) {
  const params = {};
  if (query.status) params.status = query.status;
  if (query.milestoneId) params.milestoneId = query.milestoneId;
  if (query.assignedTo) params.assignedTo = query.assignedTo;
  const data = await apiGet(`${projectPath(founderId, slug)}/tasks`, {
    params: Object.keys(params).length ? params : undefined,
  });
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.tasks)) return data.tasks;
  return [];
}
