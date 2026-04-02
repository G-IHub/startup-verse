import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { getTasks } from "../../utils/executionEngine";
export default function Phase4Debug({ user }) {
  // Get all users to find founder
  const allUsers = JSON.parse(
    localStorage.getItem("startupverse_users") || "[]",
  );
  const founder = allUsers.find(
    (u) => u.id === user.startupId && u.role === "founder",
  );

  // Get tasks if founder exists
  let tasks = [];
  let myTasks = [];
  if (founder) {
    tasks = getTasks(founder.id);
    myTasks = tasks.filter((t) => t.assignedTo === user.id);
  }
  return (
    <Card className="border-4 border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20">
      <CardHeader>
        <CardTitle className="text-yellow-900 dark:text-yellow-100">
          🐛 Phase 4 Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <p className="font-semibold mb-2">Your Account:</p>
          <div className="space-y-1 pl-4">
            <p>
              {"• Name: "}
              <Badge>{user.name}</Badge>
            </p>
            <p>
              {"• Email: "}
              <Badge>{user.email}</Badge>
            </p>
            <p>
              {"• Role: "}
              <Badge
                variant={
                  user.role === "team-member" ? "default" : "destructive"
                }
              >
                {user.role}
              </Badge>
            </p>
            <p>
              {"• User ID: "}
              <code className="text-xs">{user.id}</code>
            </p>
            <p>
              {"• Startup ID: "}
              <code className="text-xs">{user.startupId || "NONE"}</code>
            </p>
          </div>
        </div>
        <div>
          <p className="font-semibold mb-2">Founder Detection:</p>
          <div className="pl-4">
            {founder ? (
              <div className="space-y-1">
                <p>
                  {"✅ "}
                  <Badge variant="default">Founder Found!</Badge>
                </p>
                <p>
                  {"• Name: "}
                  {founder.name}
                </p>
                <p>
                  {"• ID: "}
                  <code className="text-xs">{founder.id}</code>
                </p>
              </div>
            ) : (
              <p>
                {"❌ "}
                <Badge variant="destructive">No Founder Found</Badge>
              </p>
            )}
          </div>
        </div>
        <div>
          <p className="font-semibold mb-2">Tasks Status:</p>
          <div className="pl-4 space-y-1">
            <p>
              {"• Total tasks in system: "}
              <Badge>{tasks.length}</Badge>
            </p>
            <p>
              {"• Tasks assigned to you: "}
              <Badge variant={myTasks.length > 0 ? "default" : "destructive"}>
                {myTasks.length}
              </Badge>
            </p>
            {myTasks.length > 0 && (
              <div className="mt-2 p-2 bg-green-100 dark:bg-green-950/30 rounded border border-green-300">
                <p className="font-semibold text-green-800 dark:text-green-200">
                  Your Tasks:
                </p>
                {myTasks.map((task, idx) => (
                  <p key={idx} className="text-xs">
                    {"• "}
                    {task.title}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
        <div>
          <p className="font-semibold mb-2">Phase 4 Component Status:</p>
          <div className="pl-4 space-y-1">
            <p>
              {"• MyTasksView exists: "}
              <Badge>✅ Yes</Badge>
            </p>
            <p>
              {"• Should render: "}
              <Badge variant={founder ? "default" : "destructive"}>
                {founder ? "✅ Yes" : "❌ No (no founder)"}
              </Badge>
            </p>
          </div>
        </div>
        {!founder && (
          <div className="p-3 bg-red-100 dark:bg-red-950/30 border border-red-300 rounded">
            <p className="font-semibold text-red-800 dark:text-red-200">
              ❌ Action Required:
            </p>
            <p className="text-red-700 dark:text-red-300 mt-1">
              {"No founder found for startup ID: "}
              {user.startupId}
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-2">
              This means your startupId doesn't match any founder's ID in the
              system.
            </p>
          </div>
        )}
        {founder && tasks.length === 0 && (
          <div className="p-3 bg-orange-100 dark:bg-orange-950/30 border border-orange-300 rounded">
            <p className="font-semibold text-orange-800 dark:text-orange-200">
              ⚠️ Action Required:
            </p>
            <p className="text-orange-700 dark:text-orange-300 mt-1">
              Founder hasn't created any tasks yet.
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
              Login as founder ({founder.name}) and set a weekly outcome first.
            </p>
          </div>
        )}
        {founder && tasks.length > 0 && myTasks.length === 0 && (
          <div className="p-3 bg-blue-100 dark:bg-blue-950/30 border border-blue-300 rounded">
            <p className="font-semibold text-blue-800 dark:text-blue-200">
              ℹ️ Info:
            </p>
            <p className="text-blue-700 dark:text-blue-300 mt-1">
              {"Founder has "}
              {tasks.length}
              {" tasks, but none assigned to you yet."}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              Login as founder and assign some tasks to "{user.name}".
            </p>
          </div>
        )}
        {myTasks.length > 0 && (
          <div className="p-3 bg-green-100 dark:bg-green-950/30 border border-green-300 rounded">
            <p className="font-semibold text-green-800 dark:text-green-200">
              ✅ Success!
            </p>
            <p className="text-green-700 dark:text-green-300 mt-1">
              Phase 4 should be visible below this debug panel.
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-2">
              {"Scroll down to see your "}
              {myTasks.length}
              {" assigned task(s)!"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
