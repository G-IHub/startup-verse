import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import {
  UserCircle,
  Monitor,
  Database,
  Download,
  Upload,
  Trash2,
  AlertCircle,
  FileJson,
  Radio,
  Users,
  Bell,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { useOfficeSettings } from "../hooks/useOfficeSettings";
import * as authApi from "../utils/api/authApi";
import { AdminDatabaseClear } from "./AdminDatabaseClear";
import ProfilePage from "./ProfilePage";
export default function SettingsPage({ user, onUpdateUser }) {
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showConfirmDeleteAccount, setShowConfirmDeleteAccount] =
    useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const officeSettings = useOfficeSettings();

  // Determine if user has access to Virtual Office (founders and team members only)
  const hasVirtualOffice =
    user &&
    (user.role === "founder" ||
      user.role === "team-member" ||
      user.role === "team");
  const getAllStorageData = () => {
    const keys = [
      "founder_journey_progress",
      "ideation_canvas",
      "ideation_competitors",
      "ideation_interviews",
      "company_entity",
      "company_founders",
      "company_documents",
      "company_ip",
      "product_milestones",
      "product_sprints",
      "product_tech_stack",
      "product_launch_checklist",
      "gtm_contacts",
      "gtm_deals",
      "gtm_campaigns",
      "gtm_feedback",
      "ops_financials",
      "ops_budget",
      "ops_invoices",
      "ops_okrs",
      "startupverse_office_settings",
    ];
    const data = {
      exportDate: new Date().toISOString(),
      version: "1.0",
      appName: "StartupVerse",
    };
    keys.forEach((key) => {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          data[key] = JSON.parse(value);
        } catch (e) {
          data[key] = value;
        }
      }
    });
    return data;
  };
  const exportData = () => {
    const data = getAllStorageData();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `startupverse-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Data exported successfully!");
  };
  const importData = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result);

        // Restore all data except metadata
        Object.keys(data).forEach((key) => {
          if (key !== "exportDate" && key !== "version" && key !== "appName") {
            localStorage.setItem(key, JSON.stringify(data[key]));
          }
        });
        toast.success(
          "Data imported successfully! Refresh the page to see changes.",
        );
      } catch (error) {
        toast.error("Failed to import data. Invalid file format.");
      }
    };
    reader.readAsText(file);
  };
  const clearData = () => {
    // Clear all localStorage
    localStorage.clear();
    setShowConfirmClear(false);
    toast.success("All data cleared successfully!");
    setTimeout(() => window.location.reload(), 1000);
  };
  const loadSample = () => {
    toast.info("Sample data feature is temporarily disabled");
  };
  const deleteAccount = async () => {
    if (!user) {
      toast.error("No user found");
      setShowConfirmDeleteAccount(false);
      return;
    }
    setIsDeleting(true);
    try {
      console.log(
        "🗑️ [SettingsPage] Starting account deletion for user:",
        user.id,
      );
      const result = await authApi.deleteAccount(user.id);
      console.log("🗑️ [SettingsPage] Delete account result:", result);
      if (result.success) {
        console.log(
          "✅ [SettingsPage] Account deleted successfully, clearing data...",
        );

        // Clear local storage
        localStorage.clear();
        console.log("✅ [SettingsPage] Local data cleared");

        // Update parent component to clear user state immediately
        if (onUpdateUser) {
          console.log(
            "✅ [SettingsPage] Calling onUpdateUser(null) to clear parent state",
          );
          onUpdateUser(null);
        }
        toast.success("Account deleted successfully!");

        // Force immediate full page reload and redirect
        console.log("🔄 [SettingsPage] Forcing full page reload...");
        setTimeout(() => {
          window.location.replace("/");
        }, 500);
      } else {
        console.error("❌ [SettingsPage] Delete account failed:", result.error);
        toast.error(result.error || "Failed to delete account");
        setShowConfirmDeleteAccount(false);
        setIsDeleting(false);
      }
    } catch (error) {
      console.error("❌ [SettingsPage] Error deleting account:", error);
      toast.error("Failed to delete account. Please try again.");
      setShowConfirmDeleteAccount(false);
      setIsDeleting(false);
    }
  };
  return (
    <div className="p-2 md:p-3 lg:p-4 space-y-3 md:space-y-4">
      <div>
        <h1 className="text-2xl mb-2">Settings</h1>
        <p className="text-sm text-muted-foreground">
          {hasVirtualOffice
            ? "Manage your platform preferences, Virtual Office settings, and data"
            : "Manage your platform preferences and data"}
        </p>
      </div>
      <Tabs defaultValue="profile" className="w-full">
        {hasVirtualOffice ? (
          <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
            <TabsTrigger value="profile">
              <UserCircle className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="virtual-office">
              <Monitor className="w-4 h-4 mr-2" />
              Virtual Office
            </TabsTrigger>
            <TabsTrigger value="data">
              <Database className="w-4 h-4 mr-2" />
              Data & Backup
            </TabsTrigger>
          </TabsList>
        ) : (
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="profile">
              <UserCircle className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="data">
              <Database className="w-4 h-4 mr-2" />
              Data & Backup
            </TabsTrigger>
          </TabsList>
        )}
        <TabsContent value="profile" className="space-y-0">
          {user && onUpdateUser ? (
            <ProfilePage user={user} onUpdateUser={onUpdateUser} />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">
                  Profile settings not available
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        {hasVirtualOffice && (
          <TabsContent value="virtual-office" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  Virtual Office Preferences
                </CardTitle>
                <CardDescription>
                  Control workspace visibility and collaboration features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between space-x-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Radio className="w-4 h-4 text-purple-600" />
                        <Label
                          htmlFor="show-activity-feed"
                          className="text-base"
                        >
                          Live Activity Feed
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Display real-time team activities in the sidebar
                      </p>
                    </div>
                    <Switch
                      id="show-activity-feed"
                      checked={officeSettings.settings.showActivityFeed}
                      onCheckedChange={(checked) =>
                        officeSettings.updateSettings({
                          showActivityFeed: checked,
                        })
                      }
                    />
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-start justify-between space-x-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        <Label
                          htmlFor="show-presence-bar"
                          className="text-base"
                        >
                          Team Presence Bar
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Show who's online and their current status
                      </p>
                    </div>
                    <Switch
                      id="show-presence-bar"
                      checked={officeSettings.settings.showPresenceBar}
                      onCheckedChange={(checked) =>
                        officeSettings.updateSettings({
                          showPresenceBar: checked,
                        })
                      }
                    />
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Bell className="w-4 h-4" />
                    <h3 className="font-semibold">Notifications</h3>
                  </div>
                  <div className="flex items-start justify-between space-x-4">
                    <div className="flex-1 space-y-1">
                      <Label
                        htmlFor="activity-notifications"
                        className="text-base"
                      >
                        Activity Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified about team activities and updates
                      </p>
                    </div>
                    <Switch
                      id="activity-notifications"
                      checked={officeSettings.settings.activityNotifications}
                      onCheckedChange={(checked) =>
                        officeSettings.updateSettings({
                          activityNotifications: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-start justify-between space-x-4">
                    <div className="flex-1 space-y-1">
                      <Label htmlFor="join-leave-alerts" className="text-base">
                        Join/Leave Alerts
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Show alerts when team members join or leave
                      </p>
                    </div>
                    <Switch
                      id="join-leave-alerts"
                      checked={officeSettings.settings.teamJoinLeaveAlerts}
                      onCheckedChange={(checked) =>
                        officeSettings.updateSettings({
                          teamJoinLeaveAlerts: checked,
                        })
                      }
                    />
                  </div>
                </div>
                <Separator />
                <div className="pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      officeSettings.resetToDefaults();
                      toast.success("Settings reset to defaults");
                    }}
                  >
                    Reset to Defaults
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Data Management
              </CardTitle>
              <CardDescription>
                Export, import, or reset your StartupVerse data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <Download className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                      Export Data
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Download all your data as a JSON file for backup or
                      migration
                    </p>
                  </div>
                  <Button onClick={exportData} size="sm" variant="default">
                    <Download className="w-4 h-4 mr-2" />
                    Export to JSON
                  </Button>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <Upload className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="font-semibold text-green-900 dark:text-green-100">
                      Import Data
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Restore your data from a previously exported JSON file
                    </p>
                  </div>
                  <div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={importData}
                      className="hidden"
                      id="import-file"
                    />
                    <Button asChild={true} size="sm" variant="default">
                      <label htmlFor="import-file" className="cursor-pointer">
                        <Upload className="w-4 h-4 mr-2" />
                        Import from JSON
                      </label>
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <FileJson className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="font-semibold text-purple-900 dark:text-purple-100">
                      Load Sample Data
                    </h3>
                    <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                      Populate your workspace with example data to explore
                      features
                    </p>
                  </div>
                  <Button onClick={loadSample} size="sm" variant="default">
                    <FileJson className="w-4 h-4 mr-2" />
                    Load Sample Data
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="font-semibold text-red-900 dark:text-red-100">
                        Danger Zone
                      </h3>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        Permanently delete all your data from this device. This
                        action cannot be undone.
                      </p>
                    </div>
                    {!showConfirmClear ? (
                      <Button
                        onClick={() => setShowConfirmClear(true)}
                        size="sm"
                        variant="destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear All Data
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          onClick={clearData}
                          size="sm"
                          variant="destructive"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Yes, Delete Everything
                        </Button>
                        <Button
                          onClick={() => setShowConfirmClear(false)}
                          size="sm"
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="font-semibold text-red-900 dark:text-red-100">
                        Delete Account
                      </h3>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        Permanently delete your account and all associated data.
                        This action cannot be undone.
                      </p>
                    </div>
                    {!showConfirmDeleteAccount ? (
                      <Button
                        onClick={() => setShowConfirmDeleteAccount(true)}
                        size="sm"
                        variant="destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Account
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          onClick={deleteAccount}
                          size="sm"
                          variant="destructive"
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                          )}
                          {isDeleting ? "Deleting..." : "Yes, Delete Account"}
                        </Button>
                        <Button
                          onClick={() => setShowConfirmDeleteAccount(false)}
                          size="sm"
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <AdminDatabaseClear />
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Last backup</span>
                  </div>
                  <Badge variant="secondary">No backups yet</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
