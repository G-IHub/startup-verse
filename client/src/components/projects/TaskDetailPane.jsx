import React, { useEffect, useState } from "react";
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
import { apiPut } from "../../utils/apiClient";
import * as taskApi from "../../utils/api/taskApi";
import * as teamMemberApi from "../../utils/api/teamMemberApi";
import { useProjectStore } from "../../state/useProjectStore";

const STATUSES = [
  { id: "pending", label: "Pending" },
  { id: "in-progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
  { id: "blocked", label: "Blocked" },
];

function idOf(row) {
  return String(row?.id || row?._id || "");
}

export default function TaskDetailPane({
  user,
  founderId,
  projectSlug,
  task,
  milestones,
  onUpdated,
}) {
  const updateTaskStatus = useProjectStore((s) => s.updateTaskStatus);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("pending");
  const [milestoneId, setMilestoneId] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [blockerReason, setBlockerReason] = useState("");
  const [blockerNote, setBlockerNote] = useState("");
  const [teamMembers, setTeamMembers] = useState([]);
  const [saving, setSaving] = useState(false);

  const tid = idOf(task);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title || "");
    setStatus(task.status || "pending");
    setMilestoneId(String(task.milestoneId || ""));
    setAssignedTo(String(task.assignedTo || task.assigneeId || ""));
    setBlockerReason(task.blockerReason || task.blockedReason || "");
    setBlockerNote(task.blockerNote || task.blockedNote || "");
  }, [task]);

  useEffect(() => {
    if (!founderId) return;
    teamMemberApi
      .getStartupTeamMembers(founderId)
      .then((rows) =>
        setTeamMembers(
          (rows || []).map((m) => ({
            id: String(m.id || m._id || ""),
            name: m.name || m.talentName || "Member",
          })),
        ),
      )
      .catch(() => setTeamMembers([]));
  }, [founderId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiPut(`/founders/${founderId}/tasks/${tid}`, {
        task: {
          title: title.trim(),
          milestoneId: milestoneId || null,
        },
      });

      if (status === "blocked") {
        await updateTaskStatus(tid, "blocked", {
          blockerReason,
          blockerNote,
        });
      } else if (String(task.status) !== status) {
        await updateTaskStatus(tid, status);
      }

      if (assignedTo) {
        const member = teamMembers.find((m) => m.id === assignedTo);
        await taskApi.assignTask(
          founderId,
          tid,
          assignedTo,
          member?.name || user?.name || "",
        );
      }

      toast.success("Task saved");
      await useProjectStore.getState().setActiveProject(projectSlug, { silent: true });
      onUpdated?.();
    } catch (err) {
      toast.error(err?.message || "Could not save task");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h2 className="font-heading text-lg font-semibold text-text-heading">Task</h2>

      <div className="space-y-3">
        <div className="space-y-1">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="space-y-1">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>Milestone</Label>
          <Select
            value={milestoneId || "none"}
            onValueChange={(v) => setMilestoneId(v === "none" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="No milestone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No milestone</SelectItem>
              {(milestones || []).map((m) => (
                <SelectItem key={idOf(m)} value={idOf(m)}>
                  {m.title || "Milestone"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>Assignee</Label>
          <Select
            value={assignedTo || "none"}
            onValueChange={(v) => setAssignedTo(v === "none" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Unassigned</SelectItem>
              {teamMembers.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {status === "blocked" ? (
          <>
            <div className="space-y-1">
              <Label>Blocker reason</Label>
              <Input
                value={blockerReason}
                onChange={(e) => setBlockerReason(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Blocker note</Label>
              <Textarea
                value={blockerNote}
                onChange={(e) => setBlockerNote(e.target.value)}
                rows={2}
              />
            </div>
          </>
        ) : null}

        <Button type="button" onClick={handleSave} disabled={saving}>
          Save task
        </Button>
      </div>
    </div>
  );
}
