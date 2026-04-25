import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
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

  // Combine founder + team members
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

  // Filter by search
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4">
      <Card className="max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Assign Task
              </CardTitle>
              <CardDescription className="mt-2 line-clamp-2">
                {task.title}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {task.assignedToName && (
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                CURRENTLY ASSIGNED TO
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{task.assignedToName}</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={handleUnassign}>
                  Unassign
                </Button>
              </div>
            </div>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              TEAM MEMBERS ({filteredMembers.length})
            </p>
            {filteredMembers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No team members found</p>
              </div>
            )}
            {filteredMembers.map((member) => {
              const isAssigned =
                assigneeIdOnTask(task) === String(member.id ?? "");
              return (
                <div
                  key={member.id}
                  onClick={() => !isAssigned && handleAssign(member)}
                  className={`p-3 rounded-lg border-2 transition-all ${isAssigned ? "border-primary bg-primary/5 cursor-default" : "border-border hover:border-primary/50 cursor-pointer"}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      {member.avatar && <AvatarImage src={member.avatar} />}
                      <AvatarFallback>
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">
                          {member.name}
                        </p>
                        {member.status === "online" && (
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.role}
                      </p>
                    </div>
                    {isAssigned && (
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {task.assignedToName && (
            <div className="pt-3 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleUnassign}
              >
                Leave Unassigned
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
