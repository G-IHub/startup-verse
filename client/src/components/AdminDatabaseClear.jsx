import { useState } from "react";
import { API_BASE_URL } from "../config/apiBase.js";
import { AlertTriangle, BarChart3 } from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { toast } from "sonner";

const defaultOptions = {
  credentials: "include",
  headers: { "Content-Type": "application/json" },
};

/**
 * Admin-only database stats. Server wipe endpoints return 501 by design;
 * do not call server admin wipe endpoints from the client (Step 5.2).
 */
export function AdminDatabaseClear() {
  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        ...defaultOptions,
        method: "GET",
      });
      const data = await response.json();
      if (data.success) {
        const payload = data.data ?? data;
        setStats(payload.stats ?? payload);
      } else {
        toast.error("Failed to fetch database stats");
      }
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      toast.error("Error connecting to server");
    } finally {
      setIsLoadingStats(false);
    }
  };

  const statEntries = stats
    ? [
        ["Users", stats.users],
        ["Startups", stats.startups],
        ["Talents", stats.talents],
        ["Invites", stats.invites],
        ["Tasks", stats.tasks],
        ["Messages", stats.messages],
        ["Activities", stats.activities],
        ["Notifications", stats.notifications],
        ["Organizations", stats.organizations],
      ]
    : [];

  return (
    <Card className="border-0 bg-surface-card shadow-soft rounded-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-heading text-base font-semibold text-text-heading">
          <AlertTriangle className="h-5 w-5 shrink-0 text-text-muted" />
          Admin: database overview
        </CardTitle>
        <CardDescription className="font-body text-text-body">
          View aggregate counts. Full database wipe is disabled on the API
          (COMPAT_NOT_IMPLEMENTED). Use staging tools or migrations for resets.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 font-body">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-text-heading">
            Database statistics
          </h4>
          <Button
            variant="outline"
            size="sm"
            className="rounded-input border border-surface-border bg-surface-card font-body font-semibold text-text-body shadow-none transition-colors duration-200 ease-in-out hover:border-primary hover:text-primary"
            onClick={fetchStats}
            disabled={isLoadingStats}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            {isLoadingStats ? "Loading..." : "Refresh stats"}
          </Button>
        </div>
        {statEntries.length > 0 && (
          <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-3">
            {statEntries.map(([label, value]) => (
              <div key={label} className="rounded-input bg-surface-page p-2">
                <div className="text-text-muted">{label}</div>
                <div className="font-heading text-lg font-bold text-text-heading">
                  {value ?? 0}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
