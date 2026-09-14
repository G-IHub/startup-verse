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

  // Real bug found live: a new branch forked from an existing baseBranch
  // inherits whatever's already there — so re-writing a file that already
  // exists (e.g. asking AI Developer to redo/revise index.html) always hit
  // a real "sha wasn't supplied" error, since GitHub's Contents API requires
  // the current file's sha to update it and only omits it for a genuine
  // create. This PUT always omitted it, so it only ever worked once per
  // path. Check for an existing file on the new branch first and include
  // its real sha when found, so a revision updates instead of failing.
  const existing = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}?ref=${encodeURIComponent(branchName)}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "StartupVerse-AI-Developer",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  const existingSha = existing.status === 200 ? (await existing.json())?.sha : null;

  await gh(token, `/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}`, {
    method: "PUT",
    body: JSON.stringify({
      message: commitMessage,
      content: Buffer.from(fileContent, "utf8").toString("base64"),
      branch: branchName,
      ...(existingSha ? { sha: existingSha } : {}),
    }),
  });

  const pr = await gh(token, `/repos/${owner}/${repo}/pulls`, {
    method: "POST",
    body: JSON.stringify({ title, body, head: branchName, base: baseBranch }),
  });

  return { prNumber: pr.number, prUrl: pr.html_url, branch: branchName };
}

/**
 * Commits an updated version of a file onto an already-existing branch —
 * the real primitive AI Developer's design-review revision loop needs
 * (agentExecutors.js's executeReviseFile, 2026-09-14): the branch and PR
 * from the original openPullRequest call already exist, only the file
 * content needs updating. Reuses the exact same existing-sha lookup
 * openPullRequest itself already does above, since the Contents API
 * requires the current file's real sha to update rather than create.
 */
export async function updateFileContent({ founderId, owner, repo, branch, filePath, fileContent, commitMessage }) {
  const token = await getFounderToken(founderId);
  const existing = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}?ref=${encodeURIComponent(branch)}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "StartupVerse-AI-Developer",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (existing.status !== 200) {
    throw new Error(`Cannot revise "${filePath}" on branch "${branch}" — the file wasn't found there for real.`);
  }
  const existingSha = (await existing.json())?.sha;
  const result = await gh(token, `/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}`, {
    method: "PUT",
    body: JSON.stringify({
      message: commitMessage,
      content: Buffer.from(fileContent, "utf8").toString("base64"),
      branch,
      sha: existingSha,
    }),
  });
  return { updated: true, sha: result.content?.sha || null };
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

/**
 * Ensures a real GitHub Pages site exists for this repo, serving from
 * `branch` at the repo root — the only real way to give a founder an actual
 * clickable link to what AI Developer built. Without this, AI Developer's
 * work only ever lands as a git branch; GitHub does not serve arbitrary repo
 * files as a website on its own. Idempotent: a GET first checks whether
 * Pages is already enabled (real founders will hit this on every deploy,
 * not just the first) and just returns its existing real URL rather than
 * re-creating it. Real, visible side effect on the founder's own repo
 * settings — deliberately only ever called after a real production deploy
 * succeeds, never speculatively.
 */
export async function ensureGithubPagesEnabled({ founderId, owner, repo, branch }) {
  const token = await getFounderToken(founderId);
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "User-Agent": "StartupVerse-AI-Developer",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const existing = await fetch(`https://api.github.com/repos/${owner}/${repo}/pages`, { headers });
  if (existing.status === 200) {
    const data = await existing.json();
    return { url: data.html_url, alreadyEnabled: true };
  }

  const created = await gh(token, `/repos/${owner}/${repo}/pages`, {
    method: "POST",
    body: JSON.stringify({ source: { branch, path: "/" } }),
  });
  return { url: created.html_url || `https://${owner}.github.io/${repo}/`, alreadyEnabled: false };
}

/**
 * Real file content via the Contents API — added so AI PM can actually read
 * a repo (README, a specific file) instead of only ever seeing metadata
 * about PRs/deploys. GitHub returns file content base64-encoded for files
 * under 1MB; returns null (not a thrown error) for a 404 so callers can try
 * a few candidate paths (e.g. README.md vs Readme.md) without noise.
 */
export async function getFileContent({ founderId, owner, repo, path, ref }) {
  const token = await getFounderToken(founderId);
  const qs = ref ? `?ref=${encodeURIComponent(ref)}` : "";
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}${qs}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "StartupVerse-AI-Developer",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (response.status === 404) return null;
  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || `GitHub API error (${response.status})`);
  if (Array.isArray(data)) throw new Error(`"${path}" is a directory, not a file.`);
  if (data.encoding !== "base64") throw new Error(`Unexpected encoding "${data.encoding}" for "${path}".`);
  return { path: data.path, content: Buffer.from(data.content, "base64").toString("utf8"), sha: data.sha };
}

/** Real changed-file list (with diffs) for one PR — what AI PM needs to answer "what did this PR actually do." */
export async function getPullRequestFiles({ founderId, owner, repo, prNumber }) {
  const token = await getFounderToken(founderId);
  const files = await gh(token, `/repos/${owner}/${repo}/pulls/${prNumber}/files?per_page=30`);
  return (Array.isArray(files) ? files : []).map((f) => ({
    filename: f.filename,
    status: f.status,
    additions: f.additions,
    deletions: f.deletions,
    patch: f.patch || "",
  }));
}
