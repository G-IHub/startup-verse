import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import * as githubApi from "../../utils/api/githubApi";

export default function GitHubImportDialog({ open, onOpenChange, onImported }) {
  const [repos, setRepos] = useState([]);
  const [issues, setIssues] = useState([]);
  const [repo, setRepo] = useState(null);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRepo(null);
    setIssues([]);
    setSelected({});
    setLoading(true);
    githubApi
      .listGithubRepos(1)
      .then((data) => setRepos(data.repos || []))
      .catch((err) => toast.error(err?.message || "Could not load repos."))
      .finally(() => setLoading(false));
  }, [open]);

  const pickRepo = async (row) => {
    setRepo(row);
    setLoading(true);
    try {
      const data = await githubApi.listGithubIssues(row.owner, row.name, 1);
      setIssues(data.issues || []);
    } catch (err) {
      toast.error(err?.message || "Could not load issues.");
    } finally {
      setLoading(false);
    }
  };

  const importSelected = async () => {
    const numbers = Object.entries(selected)
      .filter(([, on]) => on)
      .map(([n]) => Number(n));
    if (!repo || numbers.length === 0) return;
    setLoading(true);
    try {
      const result = await githubApi.importGithubIssues(
        repo.owner,
        repo.name,
        numbers,
      );
      const created = result.created?.length || 0;
      const skipped = result.skipped?.length || 0;
      toast.success(
        `Imported ${created} issue${created === 1 ? "" : "s"}${skipped ? `, skipped ${skipped}` : ""}`,
      );
      onImported?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.message || "Import failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="z-[80] max-w-lg office-dialog-panel"
        overlayClassName="z-[75]"
      >
        <DialogHeader>
          <DialogTitle>Import GitHub issues</DialogTitle>
          <DialogDescription>
            Pick a repo, choose issues, import them as tasks. Already imported issues are skipped.
          </DialogDescription>
        </DialogHeader>
        {loading && !issues.length && !repos.length ? (
          <p className="font-body text-sm text-text-muted">Loading…</p>
        ) : !repo ? (
          <ul className="max-h-72 space-y-1 overflow-y-auto">
            {repos.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  className="w-full rounded-input px-3 py-2 text-left font-body text-sm hover:bg-primary-tint"
                  onClick={() => pickRepo(row)}
                >
                  {row.fullName}
                  {row.private ? " (private)" : ""}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="space-y-3">
            <Button variant="ghost" size="sm" onClick={() => setRepo(null)}>
              Back to repos
            </Button>
            <ul className="max-h-72 space-y-2 overflow-y-auto">
              {issues.map((issue) => (
                <li key={issue.number} className="flex items-start gap-2">
                  <Checkbox
                    checked={Boolean(selected[issue.number])}
                    onCheckedChange={(on) =>
                      setSelected((prev) => ({ ...prev, [issue.number]: Boolean(on) }))
                    }
                    id={`issue-${issue.number}`}
                  />
                  <label
                    htmlFor={`issue-${issue.number}`}
                    className="font-body text-sm text-text-body"
                  >
                    #{issue.number} {issue.title}
                  </label>
                </li>
              ))}
            </ul>
            <Button onClick={importSelected} disabled={loading}>
              Import selected
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
