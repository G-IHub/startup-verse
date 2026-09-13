/**
 * V2AIDeveloperWorkspace — AI Developer's real workspace.
 *
 * Unlike the other 3 agent workspaces (Finance/Legal/Marketing/Sales), which
 * are still illustrative mock UI pending Phase 3 integrations, this one is
 * real end to end per docs/ai-agent-roadmap.md Phase 1: a founder connects
 * their own GitHub account (reusing the existing per-founder OAuth connection
 * — client/src/utils/api/githubApi.js, same one "Import from GitHub" uses),
 * proposes a real coding task, and watches AI Developer open a real PR, merge
 * it to staging autonomously, and hit a genuinely hard-locked approval gate
 * before anything reaches production — all backed by real AgentEvent rows,
 * live over Socket.IO.
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { cn } from "../ui/utils";
import { Github, Loader2, ExternalLink } from "lucide-react";
import { useOfficeStore } from "../../state/useOfficeStore";
import * as githubApi from "../../utils/api/githubApi";
import {
  getAgents, getActionTypes, getAgentEvents, proposeAgentAction,
} from "../../utils/api/agentOrchestrationApi";
import { subscribeToAgentEvents } from "../../utils/socketIoRealtime";
import { formatEventTime } from "../../utils/agentDisplay";

function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-gray-900 px-5 py-2.5 font-body text-[12px] font-medium text-white shadow-lg">
      {msg}
    </div>
  );
}

const STAGE_META = {
  open_pr: { label: "PR opened", bg: "#EEEDFE", color: "#3C3489" },
  staged: { label: "Merged to staging", bg: "#E6F1FB", color: "#0C447C" },
  prod_pending: { label: "Awaiting prod approval", bg: "#FCEBEB", color: "#791F1F" },
  prod_done: { label: "Live in production", bg: "#EAF3DE", color: "#27500A" },
  failed: { label: "Failed", bg: "#FCEBEB", color: "#791F1F" },
};

// A resolveApproval() call leaves TWO github_merge_main rows behind for the
// same targetId: the original request (mutated in place to "approved"/
// "declined") and a separate execution row ("human_completed", the one that
// actually ran the merge). Both can be present when grouping by targetId —
// pick the most-advanced one rather than whichever happened to iterate last.
const STATUS_PRIORITY = { pending_approval: 0, declined: 1, approved: 1, autonomous_completed: 2, human_completed: 2, failed: 2 };
function pickBest(existing, incoming) {
  if (!existing) return incoming;
  const a = STATUS_PRIORITY[existing.status] ?? 0;
  const b = STATUS_PRIORITY[incoming.status] ?? 0;
  return b >= a ? incoming : existing;
}

/** Groups the agent's raw AgentEvents (one per pipeline step) into one card per real task (targetId). */
function buildTasks(events) {
  const byTarget = new Map();
  for (const e of events) {
    const key = e.targetId || e.id;
    if (!byTarget.has(key)) byTarget.set(key, { targetId: key, openPr: null, staging: null, prod: null, createdAt: e.createdAt });
    const bucket = byTarget.get(key);
    const actionKey = e.actionTypeId?.actionKey;
    if (actionKey === "github_open_pr") bucket.openPr = pickBest(bucket.openPr, e);
    else if (actionKey === "github_merge_staging") bucket.staging = pickBest(bucket.staging, e);
    else if (actionKey === "github_merge_main") bucket.prod = pickBest(bucket.prod, e);
    if (new Date(e.createdAt) < new Date(bucket.createdAt)) bucket.createdAt = e.createdAt;
  }
  return Array.from(byTarget.values())
    .filter((t) => t.openPr)
    .map((t) => {
      let stage = "open_pr";
      if (t.openPr.status === "failed") stage = "failed";
      else if (t.staging?.status === "autonomous_completed" || t.staging?.status === "human_completed") {
        stage = "staged";
        if (t.prod?.status === "pending_approval") stage = "prod_pending";
        if (t.prod?.status === "human_completed") stage = "prod_done";
        if (t.prod?.status === "failed" || t.staging?.status === "failed") stage = "failed";
      }
      return { ...t, stage };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export default function V2AIDeveloperWorkspace({ user, onBack, onNavigate }) {
  const founderId = useOfficeStore((s) => s.founderId);
  const loadWorkspace = useOfficeStore((s) => s.loadWorkspace);
  const resolvedFounderId = founderId || String(user?._id ?? user?.id ?? "");

  const [gh, setGh] = useState({ connected: false, configured: true, githubLogin: "" });
  const [ghLoading, setGhLoading] = useState(true);
  const [ghBusy, setGhBusy] = useState(false);
  const [repos, setRepos] = useState([]);

  const [agent, setAgent] = useState(null);
  const [actionTypes, setActionTypes] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [selectedRepo, setSelectedRepo] = useState("");
  const [filePath, setFilePath] = useState("");
  const [taskDescription, setTaskDescription] = useState("");

  const [creatingRepo, setCreatingRepo] = useState(false);
  const [newRepoName, setNewRepoName] = useState("");
  const [newRepoPrivate, setNewRepoPrivate] = useState(true);
  const [repoCreateBusy, setRepoCreateBusy] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  useEffect(() => { if (user) loadWorkspace(user); }, [user, loadWorkspace]);

  const refreshGithub = useCallback(async () => {
    try {
      const status = await githubApi.getGithubConnection();
      setGh(status);
      if (status.connected) {
        const { repos: rows } = await githubApi.listGithubRepos(1);
        setRepos(rows || []);
      }
    } catch (err) {
      showToast(err?.message || "Could not check GitHub status.");
    } finally {
      setGhLoading(false);
    }
  }, []);

  useEffect(() => { refreshGithub(); }, [refreshGithub]);

  const connectGithub = () => {
    setGhBusy(true);
    githubApi.getGithubAuthorizeUrl()
      .then((data) => {
        if (!data.authUrl) throw new Error("GitHub authorize URL missing.");
        const popup = window.open(data.authUrl, "GitHub OAuth", "width=600,height=700");
        if (!popup) throw new Error("Allow popups to connect GitHub.");
        const timer = setInterval(() => {
          if (popup.closed) {
            clearInterval(timer);
            refreshGithub().finally(() => setGhBusy(false));
          }
        }, 500);
      })
      .catch((err) => { showToast(err?.message || "Could not start GitHub connect."); setGhBusy(false); });
  };

  const disconnectGithub = async () => {
    setGhBusy(true);
    try {
      await githubApi.disconnectGithub();
      await refreshGithub();
      showToast("GitHub disconnected");
    } catch (err) {
      showToast(err?.message || "Could not disconnect GitHub.");
    } finally {
      setGhBusy(false);
    }
  };

  const createRepo = async (e) => {
    e.preventDefault();
    const name = newRepoName.trim();
    if (!name) { showToast("Give the repo a name."); return; }
    setRepoCreateBusy(true);
    try {
      const repo = await githubApi.createGithubRepo(name, newRepoPrivate);
      setRepos((prev) => [{ id: repo.id, fullName: repo.fullName, owner: repo.owner, name: repo.name, private: repo.private }, ...prev]);
      setSelectedRepo(repo.fullName);
      setCreatingRepo(false);
      setNewRepoName("");
      showToast(repo.stagingCreated ? "Repo created, ready to use." : "Repo created — couldn't auto-create a staging branch, add one manually before merging.");
    } catch (err) {
      showToast(err?.message || "Could not create the repo.");
    } finally {
      setRepoCreateBusy(false);
    }
  };

  useEffect(() => {
    if (!resolvedFounderId) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([getAgents(resolvedFounderId), getActionTypes(resolvedFounderId), getAgentEvents(resolvedFounderId)])
      .then(([agents, types, rows]) => {
        if (cancelled) return;
        const dev = (agents || []).find((a) => a.agentKey === "dev") || null;
        setAgent(dev);
        setActionTypes((types || []).filter((t) => t.agentId?.agentKey === "dev"));
        setEvents((rows || []).filter((e) => e.actionTypeId?.agentId?.agentKey === "dev"));
        setError("");
      })
      .catch((err) => { if (!cancelled) setError(err?.message || "Could not load AI Developer's data."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [resolvedFounderId]);

  const upsertEvent = useCallback((incoming) => {
    if (!incoming?.id || incoming.actionTypeId?.agentId?.agentKey !== "dev") return;
    setEvents((prev) => {
      const idx = prev.findIndex((e) => e.id === incoming.id);
      const next = idx === -1 ? [incoming, ...prev] : prev.map((e) => (e.id === incoming.id ? { ...e, ...incoming } : e));
      return next.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });
  }, []);

  useEffect(() => {
    if (!resolvedFounderId) return undefined;
    return subscribeToAgentEvents(resolvedFounderId, upsertEvent);
  }, [resolvedFounderId, upsertEvent]);

  const openPrType = useMemo(() => actionTypes.find((t) => t.actionKey === "github_open_pr"), [actionTypes]);
  const mergeStagingType = useMemo(() => actionTypes.find((t) => t.actionKey === "github_merge_staging"), [actionTypes]);
  const mergeMainType = useMemo(() => actionTypes.find((t) => t.actionKey === "github_merge_main"), [actionTypes]);

  const tasks = useMemo(() => buildTasks(events), [events]);

  const submitTask = async (e) => {
    e.preventDefault();
    if (!agent || !openPrType) { showToast("AI Developer isn't set up for this founder yet."); return; }
    if (!selectedRepo || !filePath.trim() || !taskDescription.trim()) { showToast("Fill in repo, file path, and task description."); return; }
    const [owner, repo] = selectedRepo.split("/");
    setSubmitting(true);
    try {
      const targetId = `task-${Date.now()}`;
      await proposeAgentAction(resolvedFounderId, {
        actorType: "agent",
        actorId: agent.id,
        actionTypeId: openPrType.id,
        targetType: "pr",
        targetId,
        payload: { owner, repo, filePath: filePath.trim(), taskDescription: taskDescription.trim() },
      });
      showToast("AI Developer is drafting and opening a PR…");
      setFilePath("");
      setTaskDescription("");
    } catch (err) {
      showToast(err?.message || "Could not propose the task.");
    } finally {
      setSubmitting(false);
    }
  };

  const mergeToStaging = async (task) => {
    if (!mergeStagingType) return;
    const { owner, repo } = task.openPr.payload || {};
    const prNumber = task.openPr.result?.prNumber;
    if (!prNumber) { showToast("No PR number recorded for this task."); return; }
    try {
      await proposeAgentAction(resolvedFounderId, {
        actorType: "agent",
        actorId: agent.id,
        actionTypeId: mergeStagingType.id,
        targetType: "pr",
        targetId: task.targetId,
        payload: { owner, repo, prNumber },
      });
      showToast("Merging to staging…");
    } catch (err) {
      showToast(err?.message || "Could not merge to staging.");
    }
  };

  const requestProdDeploy = async (task) => {
    if (!mergeMainType) return;
    const { owner, repo } = task.openPr.payload || {};
    try {
      await proposeAgentAction(resolvedFounderId, {
        actorType: "agent",
        actorId: agent.id,
        actionTypeId: mergeMainType.id,
        targetType: "repo",
        targetId: task.targetId,
        payload: { owner, repo },
      });
      showToast("Production deploy requires your approval — sent to the Approval Queue.");
    } catch (err) {
      showToast(err?.message || "Could not request a production deploy.");
    }
  };

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-v2-page">
      <div className="min-h-0 flex-1 overflow-y-auto">

        {/* Topbar */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-v2-border bg-white px-5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={onBack} className="font-body text-[12px] text-v2-muted hover:text-v2-heading transition-colors">← Back</button>
            <span className="text-gray-300">·</span>
            <span className="font-body text-[12px] text-v2-muted">AI Staff</span>
            <span className="text-gray-300">›</span>
            <span className="font-body text-[13px] font-medium text-v2-heading">AI Developer</span>
          </div>
          <button type="button" onClick={() => onNavigate?.("audit-trail")} className="rounded-full border border-v2-border bg-white px-3 py-1.5 font-body text-[12px] font-medium text-v2-heading hover:bg-gray-50 transition-colors">
            View in Audit Trail
          </button>
        </div>

        <div className="space-y-3 p-5">

          {error && (
            <div className="rounded-2xl border border-[#791F1F]/20 bg-[#FCEBEB] p-3 font-body text-[11px] text-[#791F1F]">{error}</div>
          )}

          {/* GitHub connection */}
          <div className="rounded-2xl border border-v2-border bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Github className="h-4 w-4 text-v2-heading" />
                <div>
                  <div className="font-body text-[12px] font-semibold text-v2-heading">GitHub connection</div>
                  <div className="font-body text-[11px] text-v2-muted">
                    {ghLoading ? "Checking…" : gh.connected ? `Connected as ${gh.githubLogin}` : gh.configured ? "Connect a repo so AI Developer can open real PRs." : "GitHub OAuth isn't configured on this server yet."}
                  </div>
                </div>
              </div>
              {gh.connected ? (
                <button type="button" onClick={disconnectGithub} disabled={ghBusy} className="rounded-full border border-v2-border bg-white px-3 py-1.5 font-body text-[11px] font-medium text-v2-heading hover:bg-gray-50 transition-colors disabled:opacity-60">
                  {ghBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Disconnect"}
                </button>
              ) : (
                <button type="button" onClick={connectGithub} disabled={ghBusy || !gh.configured} className="rounded-full bg-v2-purple px-3 py-1.5 font-body text-[11px] font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-60">
                  {ghBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Connect GitHub"}
                </button>
              )}
            </div>
          </div>

          {/* New task */}
          {gh.connected && (
            <form onSubmit={submitTask} className="rounded-2xl border border-v2-border bg-white p-4 space-y-3">
              <div className="font-body text-[12px] font-semibold text-v2-heading">Give AI Developer a real task</div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={selectedRepo}
                  onChange={(e) => {
                    if (e.target.value === "__create__") { setCreatingRepo(true); return; }
                    setSelectedRepo(e.target.value);
                  }}
                  className="rounded-xl border border-v2-border px-3 py-2 font-body text-[12px] outline-none focus:border-v2-purple"
                >
                  <option value="">Choose a repo…</option>
                  {repos.map((r) => <option key={r.id} value={r.fullName}>{r.fullName}</option>)}
                  <option value="__create__">+ Create new repo…</option>
                </select>
                <input value={filePath} onChange={(e) => setFilePath(e.target.value)} placeholder="File path, e.g. FEATURE.md" className="rounded-xl border border-v2-border px-3 py-2 font-body text-[12px] outline-none focus:border-v2-purple" />
              </div>

              {creatingRepo && (
                <div className="flex flex-wrap items-center gap-2 rounded-xl bg-v2-page p-3">
                  <input
                    value={newRepoName}
                    onChange={(e) => setNewRepoName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); createRepo(e); } }}
                    placeholder="Repo name, e.g. my-startup-app"
                    className="min-w-[200px] flex-1 rounded-lg border border-v2-border px-3 py-1.5 font-body text-[12px] outline-none focus:border-v2-purple"
                  />
                  <label className="flex items-center gap-1.5 font-body text-[11px] text-v2-muted">
                    <input type="checkbox" checked={newRepoPrivate} onChange={(e) => setNewRepoPrivate(e.target.checked)} />
                    Private
                  </label>
                  <button type="button" onClick={createRepo} disabled={repoCreateBusy} className="rounded-full bg-v2-purple px-3 py-1.5 font-body text-[11px] font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-60">
                    {repoCreateBusy ? "Creating…" : "Create →"}
                  </button>
                  <button type="button" onClick={() => setCreatingRepo(false)} className="font-body text-[11px] text-v2-muted hover:text-v2-heading">
                    Cancel
                  </button>
                </div>
              )}

              <textarea value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} placeholder="Describe what to write into that file…" rows={2} className="w-full rounded-xl border border-v2-border px-3 py-2 font-body text-[12px] outline-none focus:border-v2-purple" />
              <button type="submit" disabled={submitting} className="rounded-full bg-v2-green px-4 py-2 font-body text-[12px] font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-60">
                {submitting ? "Working…" : "Open a real PR →"}
              </button>
            </form>
          )}

          {/* Task pipeline */}
          <div className="rounded-2xl border border-v2-border bg-white p-4">
            <div className="mb-3 font-body text-[12px] font-semibold text-v2-heading">Recent work</div>
            {loading && <div className="py-6 text-center font-body text-[12px] text-v2-muted">Loading…</div>}
            {!loading && tasks.length === 0 && (
              <div className="py-6 text-center font-body text-[12px] text-v2-muted">No real tasks yet — connect GitHub and give AI Developer something to build.</div>
            )}
            <div className="space-y-2.5">
              {tasks.map((t) => {
                const meta = STAGE_META[t.stage];
                return (
                  <div key={t.targetId} className="rounded-xl border border-v2-border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-body text-[12px] font-medium text-v2-heading">{t.openPr.payload?.taskDescription || t.targetId}</div>
                        <div className="mt-0.5 font-body text-[10px] text-v2-muted">{t.openPr.payload?.owner}/{t.openPr.payload?.repo} · {formatEventTime(t.createdAt)}</div>
                      </div>
                      <span className="shrink-0 rounded-lg px-2.5 py-1 font-body text-[9px] font-medium" style={{ background: meta.bg, color: meta.color }}>{meta.label}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {t.openPr.result?.prUrl && (
                        <a href={t.openPr.result.prUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-body text-[11px] text-v2-blue hover:underline">
                          PR #{t.openPr.result.prNumber} <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {t.stage === "open_pr" && (
                        <button type="button" onClick={() => mergeToStaging(t)} className="rounded-full bg-v2-purple px-3 py-1 font-body text-[10px] font-medium text-white hover:opacity-90 transition-opacity">
                          Merge to staging →
                        </button>
                      )}
                      {t.stage === "staged" && (
                        <button type="button" onClick={() => requestProdDeploy(t)} className="rounded-full bg-[#791F1F] px-3 py-1 font-body text-[10px] font-medium text-white hover:opacity-90 transition-opacity">
                          Request production deploy →
                        </button>
                      )}
                      {t.stage === "prod_pending" && (
                        <button type="button" onClick={() => onNavigate?.("approval-queue")} className="font-body text-[11px] text-[#791F1F] hover:underline">
                          Awaiting your approval — open Approval Queue →
                        </button>
                      )}
                      {t.stage === "prod_done" && t.prod?.result?.pagesUrl && (
                        <a href={t.prod.result.pagesUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full bg-v2-green px-3 py-1 font-body text-[10px] font-medium text-white hover:opacity-90 transition-opacity">
                          View live site <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {t.stage === "failed" && (t.staging?.result?.error || t.prod?.result?.error || t.openPr.result?.error) && (
                        <span className="font-body text-[10px] text-[#791F1F]">{t.staging?.result?.error || t.prod?.result?.error || t.openPr.result?.error}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex w-[300px] shrink-0 flex-col gap-3 overflow-y-auto border-l border-v2-border bg-white p-4">
        <div className="rounded-2xl bg-v2-page p-3">
          <div className="mb-2 font-heading text-[11px] font-semibold text-v2-heading">Real, not illustrative</div>
          <p className="font-body text-[10px] leading-relaxed text-v2-muted">
            This is the one AI Staff workspace backed by a real integration today. PRs, merges, and the production-deploy lock are all real GitHub actions — see docs/ai-agent-roadmap.md Phase 1.
          </p>
        </div>
        <div className="rounded-2xl bg-v2-page p-3">
          <div className="mb-2 font-heading text-[11px] font-semibold text-v2-heading">Pipeline stats</div>
          {[
            { k: "PRs opened", v: tasks.length },
            { k: "In staging", v: tasks.filter((t) => ["staged", "prod_pending", "prod_done"].includes(t.stage)).length },
            { k: "Live in production", v: tasks.filter((t) => t.stage === "prod_done").length },
            { k: "Awaiting your approval", v: tasks.filter((t) => t.stage === "prod_pending").length },
          ].map((r) => (
            <div key={r.k} className="flex items-center justify-between border-b border-gray-100 py-1 last:border-b-0">
              <span className="font-body text-[10px] text-v2-muted">{r.k}</span>
              <span className="font-body text-[10px] font-medium text-v2-heading">{r.v}</span>
            </div>
          ))}
        </div>
      </div>

      <Toast msg={toast} />
    </div>
  );
}
