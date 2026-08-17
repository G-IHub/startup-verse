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

function popupHtml(ok, message) {
  const safe = String(message || "").replace(/[<>]/g, "");
  return `<!doctype html><html><body><p>${ok ? "Connected." : safe}</p><script>window.close();</script></body></html>`;
}

async function githubJson(url, token) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "StartupVerse",
      "X-GitHub-Api-Version": "2022-11-28",
    },
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
