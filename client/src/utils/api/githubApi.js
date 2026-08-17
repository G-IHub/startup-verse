import { request } from "../backendClient";

export async function getGithubConnection() {
  const payload = await request("/github/connection", { method: "GET" });
  return payload?.data || payload || { connected: false };
}

export async function getGithubAuthorizeUrl() {
  const payload = await request("/github/oauth/authorize", { method: "GET" });
  return payload?.data || payload || {};
}

export async function disconnectGithub() {
  const payload = await request("/github/connection", { method: "DELETE" });
  return payload?.data || payload;
}

export async function listGithubRepos(page = 1) {
  const payload = await request(`/github/repos?page=${page}`, { method: "GET" });
  return payload?.data || payload || { repos: [] };
}

export async function listGithubIssues(owner, repo, page = 1) {
  const payload = await request(
    `/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues?page=${page}`,
    { method: "GET" },
  );
  return payload?.data || payload || { issues: [] };
}

export async function importGithubIssues(owner, repo, issueNumbers) {
  const payload = await request("/github/import", {
    method: "POST",
    body: JSON.stringify({ owner, repo, issueNumbers }),
  });
  return payload?.data || payload || { created: [], skipped: [] };
}
