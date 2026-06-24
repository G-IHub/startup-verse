import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { useProjectStore } from "../../state/useProjectStore";
import { formatShortDate } from "./projectUiUtils";

export default function ProjectDetailPane({ project, projectSlug, onArchived }) {
  const updateProject = useProjectStore((s) => s.updateProject);
  const archiveProject = useProjectStore((s) => s.archiveProject);
  const connectGithub = useProjectStore((s) => s.connectGithub);
  const triggerGithubSync = useProjectStore((s) => s.triggerGithubSync);

  const [name, setName] = useState("");
  const [ghOwner, setGhOwner] = useState("");
  const [ghRepo, setGhRepo] = useState("");
  const [ghSync, setGhSync] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!project) return;
    setName(project.name || "");
    const gh = project.githubRepo || {};
    setGhOwner(gh.owner || "");
    setGhRepo(gh.repo || "");
    setGhSync(gh.syncEnabled !== false);
  }, [project]);

  const handleRename = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      toast.error("Project name must be at least 2 characters");
      return;
    }
    setSaving(true);
    try {
      await updateProject(projectSlug, { name: trimmed });
      toast.success("Project renamed");
    } catch (err) {
      toast.error(err?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const handleGithub = async () => {
    setSaving(true);
    try {
      await connectGithub(projectSlug, {
        owner: ghOwner.trim(),
        repo: ghRepo.trim(),
        syncEnabled: ghSync,
      });
      toast.success("GitHub settings saved");
    } catch (err) {
      toast.error(err?.message || "Could not save GitHub settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    try {
      await triggerGithubSync(projectSlug);
      toast.success("GitHub sync complete");
    } catch (err) {
      toast.error(err?.message || "Sync failed");
    }
  };

  const handleArchive = async () => {
    if (!window.confirm("Archive this project? Milestones and tasks are preserved.")) return;
    try {
      await archiveProject(projectSlug);
      toast.success("Project archived");
      onArchived?.();
    } catch (err) {
      toast.error(err?.message || "Could not archive");
    }
  };

  if (!project) {
    return (
      <p className="font-body text-sm text-text-muted">Loading project…</p>
    );
  }

  const lastSynced = project.githubRepo?.lastSyncedAt;

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <h2 className="font-heading text-lg font-semibold text-text-heading">Project</h2>
        <p className="mt-1 font-body text-sm text-text-muted">
          A container for milestones, tasks, and synced GitHub issues.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="project-name">Name</Label>
        <Input
          id="project-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="button" size="sm" onClick={handleRename} disabled={saving}>
          Save name
        </Button>
      </div>

      <div className="space-y-3 border-t border-surface-border pt-6">
        <h3 className="font-heading text-sm font-semibold text-text-heading">
          GitHub Integration
        </h3>
        <p className="font-body text-xs text-text-muted">
          Connect a repository to sync issues as tasks under this project.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Owner</Label>
            <Input value={ghOwner} onChange={(e) => setGhOwner(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Repository</Label>
            <Input value={ghRepo} onChange={(e) => setGhRepo(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={ghSync} onCheckedChange={setGhSync} id="gh-sync" />
          <Label htmlFor="gh-sync">Sync enabled</Label>
        </div>
        {lastSynced ? (
          <p className="font-body text-xs text-text-muted">
            Last synced {formatShortDate(lastSynced)}
          </p>
        ) : null}
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleSync}>
            Sync now
          </Button>
          <Button type="button" size="sm" onClick={handleGithub} disabled={saving}>
            Save GitHub
          </Button>
        </div>
      </div>

      <div className="border-t border-surface-border pt-6">
        <Button
          type="button"
          variant="outline"
          className="border-red-200 text-red-700"
          onClick={handleArchive}
        >
          Archive project
        </Button>
      </div>
    </div>
  );
}
