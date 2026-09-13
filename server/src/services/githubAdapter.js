/**
 * githubAdapter.js — real GitHub REST calls for AI Developer (Phase 1,
 * docs/ai-agent-roadmap.md). Reuses the existing per-founder GitHubConnection
 * (server/src/models/GitHubConnection.js) built for the "Import from GitHub"
 * task feature — same encrypted-token storage, same decrypt path — rather
 * than standing up a separate credential system for this agent. Whether that
 * connection came from the real OAuth flow (github.controller.js) or was
 * seeded directly with a Personal Access Token makes no difference here;
 * both end up as a decrypted bearer token on the same model.
 */
import GitHubConnection from "../models/GitHubConnection.js";
import { decryptGithubToken } from "../utils/githubCrypto.js";

async function getFounderToken(founderId) {
  const connection = await GitHubConnection.findOne({ userId: founderId, revokedAt: null });
  if (!connection) {
    throw new Error("No active GitHub connection for this founder.");
  }
  return decryptGithubToken(connection.accessTokenEncrypted);
}

async function gh(token, path, options = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "StartupVerse-AI-Developer",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }
  if (!response.ok) {
    throw new Error(data?.message || `GitHub API error (${response.status})`);
  }
  return data;
}

/**
 * Creates a branch off `baseBranch`, commits one file to it via the Contents
 * API, and opens a PR back into `baseBranch`. Deliberately uses the Contents
 * API (not the full Git Data blob/tree/commit dance) — Phase 1 only needs a
 * single real file change to prove the loop, not a general multi-file commit
 * primitive; that can be added later if a real agent task needs it.
 */
export async function openPullRequest({ founderId, owner, repo, branchName, baseBranch, filePath, fileContent, commitMessage, title, body }) {
  const token = await getFounderToken(founderId);
  const baseRef = await gh(token, `/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`);
  const baseSha = baseRef.object.sha;

  await gh(token, `/repos/${owner}/${repo}/git/refs`, {
    method: "POST",
    body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: baseSha }),
  });

  await gh(token, `/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}`, {
    method: "PUT",
    body: JSON.stringify({
      message: commitMessage,
      content: Buffer.from(fileContent, "utf8").toString("base64"),
      branch: branchName,
    }),
  });

  const pr = await gh(token, `/repos/${owner}/${repo}/pulls`, {
    method: "POST",
    body: JSON.stringify({ title, body, head: branchName, base: baseBranch }),
  });

  return { prNumber: pr.number, prUrl: pr.html_url, branch: branchName };
}

export async function mergePullRequest({ founderId, owner, repo, prNumber, commitMessage }) {
  const token = await getFounderToken(founderId);
  const result = await gh(token, `/repos/${owner}/${repo}/pulls/${prNumber}/merge`, {
    method: "PUT",
    body: JSON.stringify({ commit_title: commitMessage, merge_method: "merge" }),
  });
  return { merged: Boolean(result.merged), sha: result.sha || null };
}

/** Promotes one branch into another directly (no PR) — used for deploy_prod's staging→main promotion. */
export async function mergeBranches({ founderId, owner, repo, base, head, commitMessage }) {
  const token = await getFounderToken(founderId);
  const result = await gh(token, `/repos/${owner}/${repo}/merges`, {
    method: "POST",
    body: JSON.stringify({ base, head, commit_message: commitMessage }),
  });
  return { merged: true, sha: result.sha || null };
}
