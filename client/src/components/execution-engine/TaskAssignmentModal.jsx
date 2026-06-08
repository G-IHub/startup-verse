import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { X, User, CheckCircle2, Search } from "lucide-react";

function assigneeIdOnTask(t) {
  const a = t?.assignedTo;
  if (a == null || a === "") return "";
  if (typeof a === "object")
    return String(a._id || a.id || "").trim();
  return String(a).trim();
}

export default function TaskAssignmentModal({
  isOpen,
  onClose,
  task,
  teamMembers,
  founderId,
  founderName,
  founderAvatar,
  onAssign,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  if (!isOpen) return null;

  const taskPrimaryId = String(task?.id ?? task?._id ?? "").trim();

  const allMembers = [
    {
      id: founderId,
      name: founderName,
      role: "Founder",
      status: "online",
      avatar: founderAvatar || null,
    },
    ...teamMembers,
  ];

  const filteredMembers = allMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAssign = (member) => {
    onAssign(
      taskPrimaryId,
      member.id,
      member.name,
      member.avatar || "",
    );
    onClose();
  };

  const handleUnassign = () => {
    onAssign(taskPrimaryId, "", "", "");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sv-modal-backdrop">
      <Card className="sv-modal-panel flex max-h-[82vh] w-full max-w-[min(100%,22rem)] flex-col overflow-hidden rounded-[14px] border-0 shadow-modal sm:max-w-md">
        <CardHeader className="flex-shrink-0 space-y-0 border-b border-primary/12 pb-3 pt-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold leading-snug md:text-[15px]">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/[0.08] text-primary">
                  <User className="h-4 w-4" aria-hidden />
                </span>
                Assign task
              </CardTitle>
              <CardDescription className="mt-1 line-clamp-3 text-[11px] text-text-muted md:text-xs">
                {task.title}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="h-8 w-8 shrink-0 rounded-md text-muted-foreground hover:bg-transparent hover:text-foreground"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 space-y-3 overflow-y-auto px-3 py-3 md:space-y-4 md:px-4 md:py-4">
          {task.assignedToName && (
            <div className="rounded-lg border border-primary/18 bg-primary/[0.04] p-2.5">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                Currently assigned
              </p>
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                    <User className="h-4 w-4" aria-hidden />
                  </div>
                  <p className="truncate text-sm font-medium text-card-foreground">
                    {task.assignedToName}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  type="button"
                  className="h-8 shrink-0 text-xs text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                  onClick={handleUnassign}
                >
                  Unassign
                </Button>
              </div>
            </div>
          )}

          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              placeholder="Search team members…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 border-primary/18 bg-card pl-9 text-xs hover:border-primary/28 focus-visible:border-primary md:text-sm"
              autoComplete="off"
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
              Team members ({filteredMembers.length})
            </p>
            {filteredMembers.length === 0 && (
              <div className="rounded-lg border border-dashed border-primary/20 bg-muted/20 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No members match your search.
                </p>
              </div>
            )}
            <div className="flex flex-col gap-2">
              {filteredMembers.map((member) => {
                const isAssigned =
                  assigneeIdOnTask(task) === String(member.id ?? "");
                return (
                  <button
                    key={member.id}
                    type="button"
                    disabled={isAssigned}
                    onClick={() => !isAssigned && handleAssign(member)}
                    className={`w-full rounded-lg border px-2.5 py-2 text-left transition-colors md:px-3 md:py-2.5 ${
                      isAssigned
                        ? "cursor-default border-primary/35 bg-primary/[0.06]"
                        : "border-primary/15 bg-card hover:border-primary/30 hover:bg-primary/[0.04]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-primary/12 shadow-none">
                        {member.avatar ? (
                          <AvatarImage src={member.avatar} alt="" />
                        ) : null}
                        <AvatarFallback className="bg-muted text-[11px] font-medium">
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-card-foreground">
                            {member.name}
                          </p>
                          {member.status === "online" && (
                            <span
                              className="h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                              title="Online"
                            />
                          )}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {member.role}
                        </p>
                      </div>
                      {isAssigned && (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {task.assignedToName && (
            <div className="border-t border-primary/10 pt-3">
              <Button
                type="button"
                variant="outline"
                className="w-full border-primary/22 bg-card text-sm font-semibold hover:bg-primary/[0.04]"
                onClick={handleUnassign}
              >
                Leave unassigned
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
