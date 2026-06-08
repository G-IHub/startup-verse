import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import {
  X,
  CheckCircle2,
  PlayCircle,
  Flag,
  AlertCircle,
  Clock,
  User,
} from "lucide-react";
const blockerReasons = [
  {
    value: "waiting-on-others",
    label: "Waiting on Others",
  },
  {
    value: "missing-info",
    label: "Missing Information",
  },
  {
    value: "technical-issue",
    label: "Technical Issue",
  },
  {
    value: "resource-constraint",
    label: "Resource Constraint",
  },
];
export default function TaskActionModal({
  isOpen,
  onClose,
  task,
  onStart,
  onComplete,
  onBlock,
}) {
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [blockNote, setBlockNote] = useState("");
  if (!isOpen) return null;
  const handleBlock = () => {
    if (!blockReason) return;
    onBlock(task.id, blockReason, blockNote);
    setShowBlockForm(false);
    setBlockReason("");
    setBlockNote("");
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "blocked":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sv-modal-backdrop">
      <Card className="sv-modal-panel max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[16px] border-0 shadow-modal">
        <CardHeader className="border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={getStatusColor(task.status)}>
                  {task.status === "in-progress" ? "Active" : task.status}
                </Badge>
                {task.priority && (
                  <Badge
                    variant="outline"
                    className={
                      task.priority === "high"
                        ? "border-red-500 text-red-600"
                        : task.priority === "medium"
                          ? "border-orange-500 text-orange-600"
                          : "border-gray-500 text-gray-600"
                    }
                  >
                    {task.priority}
                    {" priority"}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-xl">{task.title}</CardTitle>
              <CardDescription className="mt-1">
                {task.milestoneName}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {task.description && (
            <div>
              <h3 className="font-semibold mb-2 text-sm text-muted-foreground">
                DESCRIPTION
              </h3>
              <p className="text-sm">{task.description}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2 text-sm text-muted-foreground">
                ASSIGNED TO
              </h3>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  {task.assignedToName || "Unassigned"}
                </span>
              </div>
            </div>
            {task.dueDate && (
              <div>
                <h3 className="font-semibold mb-2 text-sm text-muted-foreground">
                  DUE DATE
                </h3>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}
          </div>
          {task.status === "blocked" && task.blockerNote && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-sm text-orange-900 mb-1">
                    {blockerReasons.find((r) => r.value === task.blockerReason)
                      ?.label || "Blocked"}
                  </p>
                  <p className="text-sm text-orange-800">
                    {task.blockerNote}
                  </p>
                </div>
              </div>
            </div>
          )}
          {task.status === "completed" && task.completedAt && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-semibold text-sm text-green-900">
                    Completed
                  </p>
                  <p className="text-xs text-green-700">
                    {new Date(task.completedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
          {showBlockForm && task.status !== "completed" && (
            <div className="p-4 bg-muted rounded-lg space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Reason for blocking
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {blockerReasons.map((reason) => (
                    <Button
                      key={reason.value}
                      variant={
                        blockReason === reason.value ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setBlockReason(reason.value)}
                      className="justify-start"
                    >
                      {reason.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Additional details
                </label>
                <Textarea
                  placeholder="Explain what's blocking you..."
                  value={blockNote}
                  onChange={(e) => setBlockNote(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBlockForm(false);
                    setBlockReason("");
                    setBlockNote("");
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBlock}
                  disabled={!blockReason}
                  className="flex-1"
                >
                  Mark as Blocked
                </Button>
              </div>
            </div>
          )}
          {!showBlockForm && (
            <div className="flex flex-col gap-3 pt-4 border-t">
              {task.status === "pending" && (
                <>
                  <Button onClick={onStart} size="lg" className="w-full">
                    <PlayCircle className="w-5 h-5 mr-2" />
                    Start Working on This
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowBlockForm(true)}
                    className="w-full"
                  >
                    <Flag className="w-5 h-5 mr-2" />
                    Report Blocker
                  </Button>
                </>
              )}
              {task.status === "in-progress" && (
                <>
                  <Button
                    onClick={onComplete}
                    size="lg"
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Mark as Complete
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowBlockForm(true)}
                    className="w-full"
                  >
                    <Flag className="w-5 h-5 mr-2" />
                    Report Blocker
                  </Button>
                </>
              )}
              {task.status === "blocked" && (
                <Button onClick={onStart} size="lg" className="w-full">
                  <PlayCircle className="w-5 h-5 mr-2" />
                  Resume Task
                </Button>
              )}
              {task.status === "completed" && (
                <div className="text-center py-4">
                  <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    This task is complete!
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
