import { useState } from "react";
import { Trash2, AlertTriangle, Database, BarChart3 } from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { toast } from "sonner";
export function AdminDatabaseClear() {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/admin/stats`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
        console.log("📊 Database stats:", data.stats);
      } else {
        toast.error("Failed to fetch database stats");
        console.error("❌ Stats error:", data);
      }
    } catch (error) {
      console.error("❌ Error fetching stats:", error);
      toast.error("Error connecting to server");
    } finally {
      setIsLoadingStats(false);
    }
  };
  const handleClearDatabase = async () => {
    setIsClearing(true);
    try {
      console.log("🗑️ Starting database clear...");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/admin/clear-all-data`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json();
      if (data.success) {
        console.log("✅ Database cleared:", data);
        toast.success(`Database cleared! Deleted ${data.deletedKeys} records.`);

        // 🔥 MEGA NUCLEAR WIPE - Clear ALL localStorage including current session
        console.log(
          "🔥 Clearing ALL localStorage (including current session)...",
        );
        localStorage.clear();
        console.log("🔥 Logging out and redirecting to home...");

        // Force complete logout and redirect to home page
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      } else {
        toast.error("Failed to clear database");
        console.error("❌ Clear error:", data);
      }
    } catch (error) {
      console.error("❌ Error clearing database:", error);
      toast.error("Error connecting to server");
    } finally {
      setIsClearing(false);
      setShowConfirmDialog(false);
    }
  };
  return (
    <>
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5" />
            🔥 Admin: MEGA NUCLEAR WIPE
          </CardTitle>
          <CardDescription>
            ⚠️ Development Only - Completely wipe database + logout current
            session
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Database Statistics</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchStats}
                disabled={isLoadingStats}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                {isLoadingStats ? "Loading..." : "Refresh Stats"}
              </Button>
            </div>
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-gray-500 dark:text-gray-400">Users</div>
                  <div className="font-bold text-lg">{stats.users}</div>
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-gray-500 dark:text-gray-400">
                    Startups
                  </div>
                  <div className="font-bold text-lg">{stats.startups}</div>
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-gray-500 dark:text-gray-400">
                    Talents
                  </div>
                  <div className="font-bold text-lg">{stats.talents}</div>
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-gray-500 dark:text-gray-400">
                    Invites
                  </div>
                  <div className="font-bold text-lg">{stats.invites}</div>
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-gray-500 dark:text-gray-400">Tasks</div>
                  <div className="font-bold text-lg">{stats.tasks}</div>
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-gray-500 dark:text-gray-400">
                    Messages
                  </div>
                  <div className="font-bold text-lg">{stats.messages}</div>
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-gray-500 dark:text-gray-400">
                    Activities
                  </div>
                  <div className="font-bold text-lg">{stats.activities}</div>
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-gray-500 dark:text-gray-400">
                    Notifications
                  </div>
                  <div className="font-bold text-lg">{stats.notifications}</div>
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-gray-500 dark:text-gray-400">
                    Organizations
                  </div>
                  <div className="font-bold text-lg">{stats.organizations}</div>
                </div>
              </div>
            )}
          </div>
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm space-y-1">
                <p className="font-semibold text-red-900 dark:text-red-100">
                  This will permanently delete:
                </p>
                <ul className="list-disc list-inside text-red-700 dark:text-red-300 space-y-0.5">
                  <li>🔥 YOUR CURRENT ACCOUNT (you will be logged out)</li>
                  <li>All user accounts (founders, team members, talent)</li>
                  <li>All startup profiles and team data</li>
                  <li>All tasks, milestones, and outcomes</li>
                  <li>All messages and notifications</li>
                  <li>All activities and presence data</li>
                  <li>All organizations and cohorts</li>
                  <li>🔥 ALL localStorage data (complete reset)</li>
                </ul>
                <p className="font-semibold text-red-900 dark:text-red-100 mt-2">
                  ⚠️ MEGA NUCLEAR WIPE - This cannot be undone!
                </p>
              </div>
            </div>
          </div>
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => setShowConfirmDialog(true)}
            disabled={isClearing}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All Database
          </Button>
        </CardContent>
      </Card>
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
              Confirm Database Clear
            </DialogTitle>
            <DialogDescription>
              Are you absolutely sure you want to delete all user data from the
              database? This action cannot be undone and will permanently delete
              all records.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-lg p-4 my-4">
            <p className="text-sm text-red-900 dark:text-red-100 font-semibold">
              🔥 MEGA NUCLEAR WIPE - This will delete EVERYTHING including your
              current account and log you out completely!
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isClearing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearDatabase}
              disabled={isClearing}
            >
              <Database className="w-4 h-4 mr-2" />
              {isClearing ? "Clearing..." : "Yes, Clear Database"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
