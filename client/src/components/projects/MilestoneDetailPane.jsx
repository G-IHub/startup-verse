import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useProjectStore } from "../../state/useProjectStore";
import { statusBadgeClass } from "./projectUiUtils";
import { cn } from "../ui/utils";

function idOf(row) {
  return String(row?.id || row?._id || "");
}

const STATUSES = ["pending", "in-progress", "completed", "blocked"];

export default function MilestoneDetailPane({
  projectSlug,
  milestone,
  tasks,
  onSelectTask,
  onUpdated,
}) {
  const updateMilestone = useProjectStore((s) => s.updateMilestone);
  const deleteMilestone = useProjectStore((s) => s.deleteMilestone);
  const createTask = useProjectStore((s) => s.createTask);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("pending");
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const mid = idOf(milestone);

  useEffect(() => {
    if (!milestone) return;
    setTitle(milestone.title || "");
    setDescription(milestone.description || "");
    setStatus(milestone.status || "pending");
    setDueDate(
      milestone.dueDate
        ? new Date(milestone.dueDate).toISOString().slice(0, 10)
        : "",
    );
  }, [milestone]);

  const relatedTasks = useMemo(
    () =>
      (tasks || []).filter((t) => String(t.milestoneId || "") === mid),
    [tasks, mid],
  );

  const done = relatedTasks.filter((t) => t.status === "completed").length;
  const total = relatedTasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const handleSave = async () => {
    try {
      await updateMilestone(projectSlug, mid, {
        title: title.trim(),
        description: description.trim(),
        status,
        ...(dueDate ? { dueDate: new Date(dueDate).toISOString() } : {}),
      });
      toast.success("Milestone saved");
      onUpdated?.();
    } catch (err) {
      toast.error(err?.message || "Could not save milestone");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this milestone?")) return;
    try {
      await deleteMilestone(projectSlug, mid);
      toast.success("Milestone deleted");
      onUpdated?.();
    } catch (err) {
      toast.error(err?.message || "Could not delete");
    }
  };

  const handleAddTask = async () => {
    const t = newTaskTitle.trim();
    if (!t) return;
    try {
      await createTask(projectSlug, {
        title: t,
        status: "pending",
        milestoneId: mid,
      });
      setNewTaskTitle("");
      onUpdated?.();
    } catch (err) {
      toast.error(err?.message || "Could not add task");
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold text-text-heading">Milestone</h2>
        <span
          className={cn(
            "rounded-pill px-2 py-0.5 font-body text-[10px] font-semibold capitalize",
            statusBadgeClass(status),
          )}
        >
          {status}
        </span>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Due date</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <div className="mb-1 flex justify-between font-body text-xs text-text-muted">
            <span>{pct}%</span>
            <span>
              {done}/{total} tasks
            </span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-surface-border">
            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" onClick={handleSave}>
            Save
          </Button>
          <Button type="button" variant="outline" className="text-red-600" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>

      <div className="border-t border-surface-border pt-4">
        <h3 className="mb-2 font-body text-sm font-medium text-text-heading">Tasks</h3>
        <ul className="space-y-1">
          {relatedTasks.map((t) => (
            <li key={idOf(t)}>
              <button
                type="button"
                className="w-full rounded-input px-2 py-1.5 text-left font-body text-sm hover:bg-surface-page"
                onClick={() => onSelectTask?.(idOf(t))}
              >
                {t.title || "Task"}
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex gap-2">
          <Input
            placeholder="New task…"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="h-9"
          />
          <Button type="button" onClick={handleAddTask}>
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
