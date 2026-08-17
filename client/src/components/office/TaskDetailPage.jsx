import React, { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Link2,
  Paperclip,
  MessageSquare,
  Send,
  Trash2,
  Plus,
  Github,
  Loader2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import UserAvatar from "../shared/UserAvatar";
import * as taskApi from "../../utils/api/taskApi";
import { uploadFile } from "../../utils/api/uploadApi";
import { resolveMediaUrl } from "../../utils/resolveMediaUrl";

function founderIdForUser(user) {
  if (!user) return "";
  if (user.role === "founder") return String(user._id ?? user.id ?? "");
  return String(user.founderId || "");
}

function statusLabel(status) {
  const value = String(status || "pending");
  if (value === "in-progress") return "In progress";
  if (value === "pending") return "To do";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function TaskDetailPage({ user, taskId, onNavigate }) {
  const founderId = founderIdForUser(user);
  const userId = String(user?._id ?? user?.id ?? "");
  const isFounder = user?.role === "founder";
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [legacyComments, setLegacyComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [brief, setBrief] = useState("");
  const [savingBrief, setSavingBrief] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    if (!founderId || !taskId) return;
    setLoading(true);
    setError("");
    try {
      const [detail, thread] = await Promise.all([
        taskApi.getTask(founderId, taskId),
        taskApi.getTaskComments(founderId, taskId, { page: 1, pageSize: 50 }),
      ]);
      if (!detail?.id) {
        setError("This task could not be found.");
        setTask(null);
        return;
      }
      setTask(detail);
      setBrief(detail.description || "");
      setComments(thread.comments || []);
      setLegacyComments(thread.legacyComments || detail.legacyComments || []);
    } catch (err) {
      setError(err?.message || "Could not load this task.");
      setTask(null);
    } finally {
      setLoading(false);
    }
  }, [founderId, taskId]);

  useEffect(() => {
    load();
  }, [load]);

  const canEdit = Boolean(task?.canEditBrief) || isFounder;

  const saveBrief = async () => {
    if (!canEdit) return;
    setSavingBrief(true);
    try {
      const updated = await taskApi.updateTaskBrief(founderId, taskId, {
        description: brief,
      });
      setTask((prev) => ({ ...prev, ...updated, description: brief }));
      toast.success("Brief saved");
    } catch (err) {
      toast.error(err?.message || "Could not save the brief.");
    } finally {
      setSavingBrief(false);
    }
  };

  const addLink = async () => {
    if (!canEdit) return;
    const url = linkUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      toast.error("Links need to start with http:// or https://");
      return;
    }
    const next = [
      ...(task.links || []),
      { url, label: linkLabel.trim() },
    ];
    try {
      const updated = await taskApi.updateTaskBrief(founderId, taskId, {
        links: next,
      });
      setTask((prev) => ({ ...prev, ...updated, links: next }));
      setLinkUrl("");
      setLinkLabel("");
    } catch (err) {
      toast.error(err?.message || "Could not add the link.");
    }
  };

  const removeLink = async (index) => {
    if (!canEdit) return;
    const next = (task.links || []).filter((_, i) => i !== index);
    try {
      const updated = await taskApi.updateTaskBrief(founderId, taskId, {
        links: next,
      });
      setTask((prev) => ({ ...prev, ...updated, links: next }));
    } catch (err) {
      toast.error(err?.message || "Could not remove the link.");
    }
  };

  const onFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !canEdit) return;
    setUploading(true);
    try {
      const uploaded = await uploadFile(file, "tasks");
      const updated = await taskApi.addTaskAttachment(founderId, taskId, {
        url: uploaded.url,
        name: file.name,
        mimeType: uploaded.mimeType || file.type,
        size: uploaded.size || file.size,
      });
      setTask((prev) => ({ ...prev, ...updated }));
      toast.success("File attached");
    } catch (err) {
      toast.error(err?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = async (attachmentId) => {
    if (!canEdit) return;
    try {
      const updated = await taskApi.deleteTaskAttachment(
        founderId,
        taskId,
        attachmentId,
      );
      setTask((prev) => ({ ...prev, ...updated }));
    } catch (err) {
      toast.error(err?.message || "Could not remove the file.");
    }
  };

  const postComment = async () => {
    const body = commentBody.trim();
    if (!body) return;
    setPosting(true);
    try {
      const created = await taskApi.addTaskPageComment(founderId, taskId, body);
      setComments((prev) => [...prev, created]);
      setCommentBody("");
    } catch (err) {
      toast.error(err?.message || "Could not post the comment.");
    } finally {
      setPosting(false);
    }
  };

  const messageFounder = () => {
    const founder = String(task?.founderId || founderId);
    if (!founder) return;
    onNavigate?.("founder-chat", {
      messageUserId: founder,
      taskId: String(task.id || taskId),
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
        <span className="sr-only">Loading task</span>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="font-heading text-lg font-bold text-text-heading">
          {error || "Task not found"}
        </p>
        <Button
          className="mt-6"
          variant="outline"
          onClick={() => onNavigate?.("startup-office", { officeTab: "tasks" })}
        >
          Back to office
        </Button>
      </div>
    );
  }

  const attachments = Array.isArray(task.attachments) ? task.attachments : [];
  const links = Array.isArray(task.links) ? task.links : [];
  const thread = [...legacyComments, ...comments];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1 space-y-4">
        <button
          type="button"
          onClick={() => onNavigate?.("startup-office", { officeTab: "tasks" })}
          className="inline-flex items-center gap-2 font-body text-sm text-text-muted hover:text-text-heading"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Office tasks
        </button>

        <header className="rounded-card border border-surface-border bg-surface-card p-5 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-heading text-2xl font-extrabold text-text-heading">
                {task.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{statusLabel(task.status)}</Badge>
                {task.priority ? (
                  <Badge variant="outline" className="capitalize">
                    {task.priority}
                  </Badge>
                ) : null}
                {task.githubIssueUrl ? (
                  <a
                    href={task.githubIssueUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-body text-xs text-primary hover:underline"
                  >
                    <Github className="h-3.5 w-3.5" aria-hidden />
                    GitHub issue
                  </a>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2 font-body text-sm text-text-muted">
              <UserAvatar
                name={task.assignedToName || "Unassigned"}
                src={task.assignedToAvatar}
                size="sm"
              />
              <span>{task.assignedToName || "Unassigned"}</span>
            </div>
          </div>
        </header>

        <section className="rounded-card border border-surface-border bg-surface-card p-5 shadow-soft">
          <h2 className="font-heading text-sm font-bold text-text-heading">
            Brief
          </h2>
          <p className="mt-1 font-body text-xs text-text-muted">
            Instructions, requirements, and guidelines for this task.
          </p>
          {canEdit ? (
            <>
              <Textarea
                className="mt-3 min-h-[160px]"
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="Write what done looks like, who it is for, and any constraints."
              />
              <Button
                className="mt-3"
                onClick={saveBrief}
                disabled={savingBrief}
              >
                {savingBrief ? "Saving…" : "Save brief"}
              </Button>
            </>
          ) : (
            <p className="mt-3 whitespace-pre-wrap font-body text-sm text-text-body">
              {task.description || "No brief yet. The founder will add instructions here."}
            </p>
          )}
        </section>

        <section className="rounded-card border border-surface-border bg-surface-card p-5 shadow-soft">
          <h2 className="font-heading text-sm font-bold text-text-heading">
            Links
          </h2>
          <ul className="mt-3 space-y-2">
            {links.length === 0 ? (
              <li className="font-body text-sm text-text-muted">No links yet.</li>
            ) : (
              links.map((link, index) => (
                <li
                  key={`${link.url}-${index}`}
                  className="flex items-center justify-between gap-2 rounded-input border border-surface-border/80 px-3 py-2"
                >
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-w-0 items-center gap-2 font-body text-sm text-primary hover:underline"
                  >
                    <Link2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span className="truncate">{link.label || link.url}</span>
                  </a>
                  {canEdit ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLink(index)}
                      aria-label="Remove link"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                </li>
              ))
            )}
          </ul>
          {canEdit ? (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://"
              />
              <Input
                value={linkLabel}
                onChange={(e) => setLinkLabel(e.target.value)}
                placeholder="Label (optional)"
              />
              <Button type="button" variant="outline" onClick={addLink}>
                <Plus className="mr-1 h-4 w-4" aria-hidden />
                Add
              </Button>
            </div>
          ) : null}
        </section>

        <section className="rounded-card border border-surface-border bg-surface-card p-5 shadow-soft">
          <h2 className="font-heading text-sm font-bold text-text-heading">
            Files
          </h2>
          <ul className="mt-3 space-y-2">
            {attachments.length === 0 ? (
              <li className="font-body text-sm text-text-muted">No files yet.</li>
            ) : (
              attachments.map((file) => (
                <li
                  key={file._id || file.id || file.url}
                  className="flex items-center justify-between gap-2 rounded-input border border-surface-border/80 px-3 py-2"
                >
                  <a
                    href={resolveMediaUrl(file.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-w-0 items-center gap-2 font-body text-sm text-primary hover:underline"
                  >
                    <Paperclip className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span className="truncate">{file.name || "Attachment"}</span>
                  </a>
                  {canEdit ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        removeAttachment(String(file._id || file.id))
                      }
                      aria-label="Remove file"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                </li>
              ))
            )}
          </ul>
          {canEdit ? (
            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 font-body text-sm text-primary">
              <input
                type="file"
                className="sr-only"
                onChange={onFile}
                disabled={uploading}
              />
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Paperclip className="h-4 w-4" aria-hidden />
              )}
              {uploading ? "Uploading…" : "Attach a file"}
            </label>
          ) : null}
        </section>
      </div>

      <aside className="w-full shrink-0 space-y-4 lg:w-[380px]">
        {!isFounder ? (
          <Button className="w-full" onClick={messageFounder}>
            <MessageSquare className="mr-2 h-4 w-4" aria-hidden />
            Message founder
          </Button>
        ) : null}

        <section className="rounded-card border border-surface-border bg-surface-card p-5 shadow-soft">
          <h2 className="font-heading text-sm font-bold text-text-heading">
            Comments
          </h2>
          <div className="mt-3 max-h-[420px] space-y-3 overflow-y-auto">
            {thread.length === 0 ? (
              <p className="font-body text-sm text-text-muted">
                No comments yet. Ask a question or leave an update.
              </p>
            ) : (
              thread.map((row) => (
                <article
                  key={row.id}
                  className="rounded-input border border-surface-border/70 bg-surface-page/50 px-3 py-2"
                >
                  <div className="flex items-center gap-2 font-body text-xs text-text-muted">
                    <User className="h-3.5 w-3.5" aria-hidden />
                    <span className="font-medium text-text-heading">
                      {row.authorName || "Teammate"}
                    </span>
                    {row.legacy ? <span>(earlier note)</span> : null}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap font-body text-sm text-text-body">
                    {row.body}
                  </p>
                </article>
              ))
            )}
          </div>
          <div className="mt-3 space-y-2">
            <Textarea
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder="Write a comment"
              rows={3}
            />
            <Button
              onClick={postComment}
              disabled={posting || !commentBody.trim()}
              className="w-full"
            >
              <Send className="mr-2 h-4 w-4" aria-hidden />
              {posting ? "Posting…" : "Comment"}
            </Button>
          </div>
        </section>
      </aside>
    </div>
  );
}
