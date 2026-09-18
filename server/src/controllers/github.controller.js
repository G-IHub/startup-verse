import GitHubConnection from "../models/GitHubConnection.js";
import Task from "../models/Task.js";
import Startup from "../models/Startup.js";
import {
  error as apiError,
  success as apiSuccess,
} from "../utils/apiResponse.js";
import {
  decryptGithubToken,
  encryptGithubToken,
  githubOAuthConfigured,
  issueIdentity,
  signOauthState,
  stripIssueBody,
  verifyOauthState,
} from "../utils/githubCrypto.js";
import { logger } from "../config/logger.js";

function requireFounder(req, res) {
  if (req.user?.isAdmin === true) return true;
  if (req.user?.role === "founder") return true;
  apiError(res, "Forbidden.", 403);
  return false;
}

// Real bug found live, 2026-09-18: the opener's popup-completion check only
// ever watched for the popup window closing — it had no way to tell a real
// successful authorization apart from the user closing/cancelling the popup,
// or this page's own script erroring before the postMessage below existed.
// A stale/reconnect attempt could "close the popup" without ever completing
// OAuth and the founder would still see a false "GitHub connected" toast.
// Posting the real outcome to the opener lets it react to what actually
// happened instead of guessing from "the window closed."
function popupHtml(ok, message) {
  const safe = String(message || "").replace(/[<>]/g, "");
  return `<!doctype html><html><body><p>${ok ? "Connected." : safe}</p><script>
    try { window.opener && window.opener.postMessage({ source: "startupverse-github-oauth", ok: ${ok ? "true" : "false"} }, "*"); } catch (e) {}
    window.close();
  </script></body></html>`;
}

async function githubJson(url, token, options = {}) {
  const response = await fetch(url, {
    method: options.method || "GET",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "StartupVerse",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }
  return { status: response.status, data };
}

async function loadActiveConnection(userId) {
  return GitHubConnection.findOne({
    userId,
    revokedAt: null,
  });
}

async function markRevoked(connection) {
  if (!connection) return;
  connection.revokedAt = new Date();
  await connection.save();
}

export async function authorize(req, res) {
  if (!requireFounder(req, res)) return;
  if (!githubOAuthConfigured()) {
    return apiError(
      res,
      "GitHub is not configured. Set GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_CALLBACK_URL, and GITHUB_TOKEN_ENCRYPTION_KEY.",
      503,
    );
  }
  const state = signOauthState(req.user.id);
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_CALLBACK_URL,
    scope: "read:user repo",
    state,
  });
  return apiSuccess(res, {
    authUrl: `https://github.com/login/oauth/authorize?${params.toString()}`,
  });
}

export async function callback(req, res) {
  const userId = verifyOauthState(req.query?.state);
  if (!userId) {
    res.status(400).type("html").send(popupHtml(false, "Invalid GitHub state."));
    return;
  }
  const code = String(req.query?.code || "");
  if (!code) {
    res.status(400).type("html").send(popupHtml(false, "Missing GitHub code."));
    return;
  }
  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_CALLBACK_URL,
      }),
    });
    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson?.access_token;
    if (!accessToken) {
      logger.warn("GitHub OAuth token exchange failed");
      res.status(401).type("html").send(popupHtml(false, "GitHub login failed."));
      return;
    }
    const userRes = await githubJson("https://api.github.com/user", accessToken);
    if (userRes.status !== 200) {
      res.status(401).type("html").send(popupHtml(false, "Could not read GitHub user."));
      return;
    }
    await GitHubConnection.findOneAndUpdate(
      { userId },
      {
        userId,
        githubUserId: String(userRes.data.id || ""),
        githubLogin: String(userRes.data.login || ""),
        accessTokenEncrypted: encryptGithubToken(accessToken),
        scope: String(tokenJson.scope || "read:user repo"),
        connectedAt: new Date(),
        revokedAt: null,
      },
      { upsert: true, new: true },
    );
    res.status(200).type("html").send(popupHtml(true, "Connected."));
  } catch (err) {
    logger.warn("GitHub OAuth callback error", { message: err?.message });
    res.status(500).type("html").send(popupHtml(false, "GitHub connect failed."));
  }
}

export async function getConnection(req, res) {
  if (!requireFounder(req, res)) return;
  const row = await loadActiveConnection(req.user.id);
  return apiSuccess(res, {
    connected: Boolean(row),
    githubLogin: row?.githubLogin || "",
    configured: githubOAuthConfigured(),
  });
}

export async function deleteConnection(req, res) {
  if (!requireFounder(req, res)) return;
  const row = await loadActiveConnection(req.user.id);
  if (!row) return apiError(res, "GitHub is not connected.", 404);
  row.revokedAt = new Date();
  row.accessTokenEncrypted = encryptGithubToken("revoked");
  await row.save();
  return apiSuccess(res, { connected: false });
}

async function tokenFor(req, res) {
  const row = await loadActiveConnection(req.user.id);
  if (!row) {
    apiError(res, "Connect GitHub first.", 401);
    return null;
  }
  try {
    return { row, token: decryptGithubToken(row.accessTokenEncrypted) };
  } catch {
    await markRevoked(row);
    apiError(res, "Reconnect GitHub.", 401);
    return null;
  }
}

export async function listRepos(req, res) {
  if (!requireFounder(req, res)) return;
  const auth = await tokenFor(req, res);
  if (!auth) return;
  const page = Math.max(1, Number(req.query.page) || 1);
  const result = await githubJson(
    `https://api.github.com/user/repos?per_page=30&page=${page}&sort=updated`,
    auth.token,
  );
  if (result.status === 401) {
    await markRevoked(auth.row);
    return apiError(res, "Reconnect GitHub.", 401);
  }
  const repos = Array.isArray(result.data)
    ? result.data.map((repo) => ({
        id: repo.id,
        fullName: repo.full_name,
        owner: repo.owner?.login,
        name: repo.name,
        private: Boolean(repo.private),
      }))
    : [];
  return apiSuccess(res, { repos, page });
}

const REPO_NAME_RE = /^[A-Za-z0-9._-]{1,100}$/;

/**
 * Creates a real GitHub repo under the founder's own account (their token,
 * their `repo` scope — no extra permission needed), auto-initialized with a
 * README so there's a real first commit, then creates a real `staging`
 * branch off it. That second step matters: AI Developer's adapter
 * (githubAdapter.js) always opens PRs against `staging`, and a brand-new
 * GitHub repo only ever has its default branch — without this, every
 * founder would hit the same "create a staging branch" manual step this
 * feature exists to remove.
 */
export async function createRepo(req, res) {
  if (!requireFounder(req, res)) return;
  const auth = await tokenFor(req, res);
  if (!auth) return;

  const name = String(req.body?.name || "").trim();
  if (!REPO_NAME_RE.test(name)) {
    return apiError(res, "Repo name must be 1-100 characters: letters, numbers, dots, hyphens, underscores only.", 422);
  }
  const isPrivate = Boolean(req.body?.private);

  const created = await githubJson("https://api.github.com/user/repos", auth.token, {
    method: "POST",
    body: { name, private: isPrivate, auto_init: true },
  });
  if (created.status === 401) {
    await markRevoked(auth.row);
    return apiError(res, "Reconnect GitHub.", 401);
  }
  if (created.status !== 201) {
    return apiError(res, created.data?.errors?.[0]?.message || created.data?.message || "Could not create the repo.", created.status >= 400 && created.status < 500 ? 422 : 502);
  }

  const owner = created.data.owner?.login;
  const defaultBranch = created.data.default_branch || "main";

  // Best-effort staging branch — the repo itself is already real and
  // returned to the client either way; a failure here just means the
  // founder (or AI Developer's own baseBranch fallback) needs to create
  // `staging` manually, same as before this feature existed.
  let stagingCreated = false;
  try {
    const baseRef = await githubJson(`https://api.github.com/repos/${owner}/${name}/git/ref/heads/${defaultBranch}`, auth.token);
    if (baseRef.status === 200) {
      const branchResult = await githubJson(`https://api.github.com/repos/${owner}/${name}/git/refs`, auth.token, {
        method: "POST",
        body: { ref: "refs/heads/staging", sha: baseRef.data.object.sha },
      });
      stagingCreated = branchResult.status === 201;
    }
  } catch {
    // Non-fatal — see comment above.
  }

  return apiSuccess(res, {
    id: created.data.id,
    fullName: created.data.full_name,
    owner,
    name: created.data.name,
    private: Boolean(created.data.private),
    defaultBranch,
    stagingCreated,
  }, 201);
}

/**
 * The default repo AI PM's automatic build-task hand-offs (orchestrator.
 * service.js's advanceBuildQueueIfIdle) use — separate from "connected,"
 * since a connected founder can have many repos and connecting doesn't say
 * which one is the actual product. Set here from the Integrations page's
 * GitHub card, or by AI PM itself once a founder names a repo in chat.
 */
export async function getDefaultRepo(req, res) {
  if (!requireFounder(req, res)) return;
  const startup = await Startup.findOne({ founderId: req.user.id }).lean();
  return apiSuccess(res, {
    owner: startup?.defaultGithubRepo?.owner || "",
    repo: startup?.defaultGithubRepo?.repo || "",
  });
}

export async function setDefaultRepo(req, res) {
  if (!requireFounder(req, res)) return;
  const owner = String(req.body?.owner || "").trim();
  const repo = String(req.body?.repo || "").trim();
  if (!owner || !repo) {
    return apiError(res, "owner and repo are required.", 422);
  }
  const startup = await Startup.findOneAndUpdate(
    { founderId: req.user.id },
    { defaultGithubRepo: { owner, repo } },
    { new: true },
  );
  if (!startup) {
    return apiError(res, "Create a startup before setting a default repo.", 422);
  }
  return apiSuccess(res, { owner, repo });
}

export async function listIssues(req, res) {
  if (!requireFounder(req, res)) return;
  const auth = await tokenFor(req, res);
  if (!auth) return;
  const owner = String(req.params.owner || "");
  const repo = String(req.params.repo || "");
  const page = Math.max(1, Number(req.query.page) || 1);
  const result = await githubJson(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues?state=open&per_page=30&page=${page}`,
    auth.token,
  );
  if (result.status === 401) {
    await markRevoked(auth.row);
    return apiError(res, "Reconnect GitHub.", 401);
  }
  if (result.status === 404) {
    return apiError(res, "Repository not found.", 404);
  }
  const issues = Array.isArray(result.data)
    ? result.data
        .filter((row) => !row.pull_request)
        .map((row) => ({
          number: row.number,
          title: row.title,
          body: stripIssueBody(row.body),
          htmlUrl: row.html_url,
        }))
    : [];
  return apiSuccess(res, { issues, page });
}

export async function importIssues(req, res) {
  if (!requireFounder(req, res)) return;
  const owner = String(req.body?.owner || "").trim();
  const repo = String(req.body?.repo || "").trim();
  const numbers = Array.isArray(req.body?.issueNumbers)
    ? req.body.issueNumbers.map((n) => Number(n)).filter((n) => n > 0)
    : [];
  if (!owner || !repo || numbers.length === 0) {
    return apiError(res, "owner, repo, and issueNumbers are required.", 422);
  }

  const startup = await Startup.findOne({ founderId: req.user.id });
  if (!startup) {
    return apiError(res, "Create a startup before importing issues.", 422);
  }

  const auth = await tokenFor(req, res);
  if (!auth) return;

  const created = [];
  const skipped = [];

  for (const number of numbers) {
    const identity = issueIdentity(owner, repo, number);
    const existing = await Task.findOne({
      startupId: startup._id,
      githubIssueId: identity,
    });
    if (existing) {
      skipped.push({ number, reason: "already imported", taskId: String(existing._id) });
      continue;
    }
    const result = await githubJson(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${number}`,
      auth.token,
    );
    if (result.status === 401) {
      await markRevoked(auth.row);
      return apiError(res, "Reconnect GitHub.", 401);
    }
    if (result.status !== 200 || result.data?.pull_request) {
      skipped.push({ number, reason: "not found" });
      continue;
    }
    try {
      const issueUrl = String(result.data.html_url || "");
      const task = await Task.create({
        founderId: req.user.id,
        startupId: startup._id,
        title: String(result.data.title || `Issue ${number}`).slice(0, 200),
        description: stripIssueBody(result.data.body),
        status: "pending",
        githubIssueId: identity,
        githubIssueUrl: issueUrl,
        githubRepo: `${owner}/${repo}`,
        links: issueUrl ? [{ url: issueUrl, label: identity }] : [],
      });
      created.push(task);
    } catch (err) {
      if (err?.code === 11000) {
        skipped.push({ number, reason: "already imported" });
        continue;
      }
      throw err;
    }
  }

  return apiSuccess(res, { created, skipped });
}
