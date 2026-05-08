import { useState } from "react";
import { API_BASE_URL } from "../config/apiBase.js";
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
import { clearAllBrowserKV } from "../utils/clearLegacyClientStorage.js";

// Default fetch options for cookie-based auth

const defaultOptions = {
  credentials: "include",
  headers: { "Content-Type": "application/json" },
};

export function AdminDatabaseClear() {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/stats`,
        {
          ...defaultOptions,
          method: "GET",
        },
      );
      const data = await response.json();
      if (data.success) {
        const payload = data.data ?? data;
        setStats(payload.stats ?? payload);
        console.log("📊 Database stats:", payload.stats ?? payload);
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
        `${API_BASE_URL}/admin/clear-all-data`,
        {
          ...defaultOptions,
          method: "DELETE",
        },
      );
      const data = await response.json();
      if (data.success) {
        console.log("✅ Database cleared:", data);
        toast.success(`Database cleared! Deleted ${data.deletedKeys} records.`);

        clearAllBrowserKV();
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
      <Card className="border-0 bg-surface-card shadow-soft rounded-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-base font-semibold text-status-error">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            🔥 Admin: MEGA NUCLEAR WIPE
          </CardTitle>
          <CardDescription className="font-body text-text-body">
            ⚠️ Development Only - Completely wipe database + logout current
            session
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 font-body">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-text-heading">
                Database Statistics
              </h4>
              <Button
                variant="outline"
                size="sm"
                className="rounded-input border border-surface-border bg-surface-card font-body font-semibold text-text-body shadow-none transition-colors duration-200 ease-in-out hover:border-primary hover:text-primary"
                onClick={fetchStats}
                disabled={isLoadingStats}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                {isLoadingStats ? "Loading..." : "Refresh Stats"}
              </Button>
            </div>
            {stats && (
              <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-3">
                <div className="rounded-input bg-surface-page p-2">
                  <div className="text-text-muted">Users</div>
                  <div className="font-heading text-lg font-bold text-text-heading">
                    {stats.users}
                  </div>
                </div>
                <div className="rounded-input bg-surface-page p-2">
                  <div className="text-text-muted">Startups</div>
                  <div className="font-heading text-lg font-bold text-text-heading">
                    {stats.startups}
                  </div>
                </div>
                <div className="rounded-input bg-surface-page p-2">
                  <div className="text-text-muted">Talents</div>
                  <div className="font-heading text-lg font-bold text-text-heading">
                    {stats.talents}
                  </div>
                </div>
                <div className="rounded-input bg-surface-page p-2">
                  <div className="text-text-muted">Invites</div>
                  <div className="font-heading text-lg font-bold text-text-heading">
                    {stats.invites}
                  </div>
                </div>
                <div className="rounded-input bg-surface-page p-2">
                  <div className="text-text-muted">Tasks</div>
                  <div className="font-heading text-lg font-bold text-text-heading">
                    {stats.tasks}
                  </div>
                </div>
                <div className="rounded-input bg-surface-page p-2">
                  <div className="text-text-muted">Messages</div>
                  <div className="font-heading text-lg font-bold text-text-heading">
                    {stats.messages}
                  </div>
                </div>
                <div className="rounded-input bg-surface-page p-2">
                  <div className="text-text-muted">Activities</div>
                  <div className="font-heading text-lg font-bold text-text-heading">
                    {stats.activities}
                  </div>
                </div>
                <div className="rounded-input bg-surface-page p-2">
                  <div className="text-text-muted">Notifications</div>
                  <div className="font-heading text-lg font-bold text-text-heading">
                    {stats.notifications}
                  </div>
                </div>
                <div className="rounded-input bg-surface-page p-2">
                  <div className="text-text-muted">Organizations</div>
                  <div className="font-heading text-lg font-bold text-text-heading">
                    {stats.organizations}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="rounded-input bg-status-error/5 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-status-error" />
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-text-heading">
                  This will permanently delete:
                </p>
                <ul className="list-inside list-disc space-y-0.5 text-text-body">
                  <li>🔥 YOUR CURRENT ACCOUNT (you will be logged out)</li>
                  <li>All user accounts (founders, team members, talent)</li>
                  <li>All startup profiles and team data</li>
                  <li>All tasks, milestones, and outcomes</li>
                  <li>All messages and notifications</li>
                  <li>All activities and presence data</li>
                  <li>All organizations and cohorts</li>
                  <li>🔥 All persistent browser key/value data (complete reset)</li>
                </ul>
                <p className="mt-2 font-semibold text-status-error">
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
            <DialogTitle className="flex items-center gap-2 font-heading font-semibold text-status-error">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              Confirm Database Clear
            </DialogTitle>
            <DialogDescription className="font-body text-text-body">
              Are you absolutely sure you want to delete all user data from the
              database? This action cannot be undone and will permanently delete
              all records.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 rounded-input bg-status-error/5 p-4">
            <p className="font-body text-sm font-semibold text-text-heading">
              🔥 MEGA NUCLEAR WIPE - This will delete EVERYTHING including your
              current account and log you out completely!
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-input border border-surface-border bg-surface-card font-body font-semibold text-text-body transition-colors duration-200 ease-in-out hover:border-status-error hover:text-status-error"
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
