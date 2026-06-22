import Task from "../models/Task.js";
import Project from "../models/Project.js";
import { syncProjectCounters } from "../utils/syncProjectCounters.js";

export async function syncProjectIssues(project) {
  const { owner, repo } = project.githubRepo || {};
  if (!owner || !repo) {
    throw new Error("GitHub repo not configured");
  }
  if (!process.env.GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN is not configured");
  }

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=100`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );
  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status}`);
  }
  const issues = await res.json();

  let created = 0;
  let updated = 0;

  for (const issue of issues) {
    if (issue.pull_request) continue;

    const githubIssueId = String(issue.number);
    const existing = await Task.findOne({
      projectId: project._id,
      githubIssueId,
    });

    const priorityLabel = issue.labels
      ?.find((l) => l.name.startsWith("priority:"))
      ?.name.split(":")[1];
    const priority = ["low", "medium", "high"].includes(priorityLabel)
      ? priorityLabel
      : "medium";

    const payload = {
      title: issue.title.slice(0, 200),
      description: (issue.body || "").slice(0, 5000),
      status: issue.state === "closed" ? "completed" : "pending",
      githubIssueUrl: issue.html_url,
      priority,
    };

    if (existing) {
      await Task.findByIdAndUpdate(existing._id, payload);
      updated++;
    } else {
      await Task.create({
        ...payload,
        founderId: project.founderId,
        startupId: project.startupId,
        projectId: project._id,
        githubIssueId,
      });
      created++;
    }
  }

  await Project.findByIdAndUpdate(project._id, {
    "githubRepo.lastSyncedAt": new Date(),
  });
  await syncProjectCounters(project._id);

  return { created, updated, total: issues.length };
}
