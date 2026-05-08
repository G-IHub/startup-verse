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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
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
  LogOut,
  Building2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useOfficeSettings } from "../hooks/useOfficeSettings";
import * as authApi from "../utils/api/authApi";
import {
  fetchClientPreferences,
  mergeClientPreferencesPatch,
} from "../utils/api/clientPreferencesApi";
import { wipeLegacyStartupVerseStorage } from "../utils/clearLegacyClientStorage";
import { leaveStartup } from "../utils/api/teamMemberApi";
import { AdminDatabaseClear } from "./AdminDatabaseClear";
import ProfilePage from "./ProfilePage";
export default function SettingsPage({
  user,
  onUpdateUser,
  initialProfileEditing = false,
}) {
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showConfirmDeleteAccount, setShowConfirmDeleteAccount] =
    useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const officeSettings = useOfficeSettings(user?._id ?? user?.id);

  const isTeamMember = user?.role === "team-member";

  const handleLeaveStartup = async () => {
    const userId = String(user?._id ?? user?.id ?? "");
    if (!userId) return;
    setIsLeaving(true);
    try {
      const result = await leaveStartup(userId);
      const updatedUser = {
        ...user,
        role: "talent",
        startupId: null,
        founderId: null,
        onboardingComplete: false,
      };
      setShowLeaveConfirm(false);
      toast.success("You have left the startup. Your profile data is preserved.");
      if (onUpdateUser) onUpdateUser(updatedUser);
    } catch (err) {
      toast.error(err?.message || "Failed to leave startup. Please try again.");
    } finally {
      setIsLeaving(false);
    }
  };

  // Determine if user has access to Virtual Office (founders and team members only)
  const hasVirtualOffice =
    user &&
    (user.role === "founder" ||
      user.role === "team-member" ||
      user.role === "team");
  const exportUserId = user?._id ?? user?.id;

  const exportData = async () => {
    let prefs = {};
    if (exportUserId) {
      try {
        prefs = await fetchClientPreferences(String(exportUserId));
      } catch {
        /* ignore */
      }
    }
    const data = {
      exportDate: new Date().toISOString(),
      version: "2.0",
      appName: "StartupVerse",
      clientPreferences: prefs,
    };
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
    toast.success("Preferences exported.");
  };
  const importData = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result);
        const uid = user?._id ?? user?.id;
        if (
          uid &&
          data.clientPreferences &&
          typeof data.clientPreferences === "object"
        ) {
          await mergeClientPreferencesPatch(String(uid), data.clientPreferences);
          toast.success("Preferences imported from file.");
          return;
        }
        toast.error(
          "Invalid backup. Export again from Settings — file must include clientPreferences.",
        );
      } catch {
        toast.error("Failed to import data. Invalid file format.");
      }
    };
    reader.readAsText(file);
  };
  const clearData = () => {
    wipeLegacyStartupVerseStorage();
    setShowConfirmClear(false);
    toast.success("Legacy browser keys cleared.");
    setTimeout(() => window.location.reload(), 800);
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
          "✅ [SettingsPage] Account deleted successfully",
        );

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
  const tabTriggerClass =
    "rounded-none border-0 border-b-2 border-transparent bg-transparent font-body font-medium text-text-body shadow-none transition-colors duration-200 ease-in-out hover:text-primary data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-primary data-[state=active]:shadow-none [&_svg]:text-text-muted data-[state=active]:[&_svg]:text-primary hover:[&_svg]:text-primary";

  return (
    <div className="min-h-full space-y-3 bg-surface-page p-2 font-body md:space-y-4 md:p-3 lg:p-4">
      <div>
        <h1 className="mb-2 font-heading text-2xl font-bold text-text-heading">
          Settings
        </h1>
        <p className="font-body text-sm text-text-body">
          {hasVirtualOffice
            ? "Manage your platform preferences, Virtual Office settings, and data"
            : "Manage your platform preferences and data"}
        </p>
      </div>
      <Tabs defaultValue="profile" className="w-full">
        {hasVirtualOffice ? (
          <TabsList className="grid h-auto min-h-10 w-full grid-cols-3 gap-0 rounded-none border-0 border-b border-surface-border bg-transparent p-0 lg:w-[600px]">
            <TabsTrigger value="profile" className={tabTriggerClass}>
              <UserCircle className="mr-2 h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="virtual-office" className={tabTriggerClass}>
              <Monitor className="mr-2 h-4 w-4" />
              Virtual Office
            </TabsTrigger>
            <TabsTrigger value="data" className={tabTriggerClass}>
              <Database className="mr-2 h-4 w-4" />
              Data & Backup
            </TabsTrigger>
          </TabsList>
        ) : (
          <TabsList className="grid h-auto min-h-10 w-full grid-cols-2 gap-0 rounded-none border-0 border-b border-surface-border bg-transparent p-0 lg:w-[400px]">
            <TabsTrigger value="profile" className={tabTriggerClass}>
              <UserCircle className="mr-2 h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="data" className={tabTriggerClass}>
              <Database className="mr-2 h-4 w-4" />
              Data & Backup
            </TabsTrigger>
          </TabsList>
        )}
        <TabsContent value="profile" className="space-y-0">
          {user && onUpdateUser ? (
            <ProfilePage
              user={user}
              onUpdateUser={onUpdateUser}
              initialEditing={initialProfileEditing}
            />
          ) : (
            <Card className="border-0 bg-surface-card shadow-soft rounded-card">
              <CardContent className="pt-6">
                <p className="text-center font-body text-text-muted">
                  Profile settings not available
                </p>
              </CardContent>
            </Card>
          )}
          {isTeamMember && (
            <Card className="mt-4 border-0 bg-surface-card shadow-soft rounded-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading text-base font-semibold text-text-heading">
                  <Building2 className="h-5 w-5 text-primary" />
                  Startup Membership
                </CardTitle>
                <CardDescription className="font-body text-text-body">
                  You are currently an active team member of a startup.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-text-muted" />
                    <span className="font-body text-sm text-text-muted">
                      Role:
                    </span>
                    <Badge variant="secondary">Team Member</Badge>
                  </div>
                  {user?.startupId && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-text-muted" />
                      <span className="font-body text-sm text-text-muted">
                        Startup ID:
                      </span>
                      <Badge variant="outline" className="font-mono text-xs">
                        {String(user.startupId).slice(-8)}
                      </Badge>
                    </div>
                  )}
                </div>
                <Separator className="bg-surface-border" />
                <div className="space-y-2">
                  <p className="font-body text-sm text-text-body">
                    Leaving will revert your role to <strong>talent</strong>{" "}
                    and detach you from the startup. All your profile data —
                    skills, experience, education, and certifications — will be
                    fully preserved. You can be re-onboarded to a startup at any
                    time.
                  </p>
                  <Button
                    variant="outline"
                    className="rounded-input border border-status-error/40 bg-surface-card font-body font-semibold text-status-error transition-colors duration-200 ease-in-out hover:border-status-error hover:bg-surface-card hover:text-status-error"
                    onClick={() => setShowLeaveConfirm(true)}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Leave Startup
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Leave Startup Confirmation Dialog */}
        <Dialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-heading font-semibold text-text-heading">
                <LogOut className="h-5 w-5 text-status-error" />
                Leave Startup?
              </DialogTitle>
              <DialogDescription className="space-y-2 pt-1 font-body text-text-body">
                <p>
                  You will be removed from the startup team and your role will
                  revert to <strong>talent</strong>.
                </p>
                <p className="text-sm">
                  Your profile data (skills, experience, education,
                  certifications) will <strong>not</strong> be deleted. You can
                  join a new startup at any time without re-filling your
                  profile.
                </p>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                className="rounded-input border border-surface-border bg-surface-card font-body font-semibold text-text-body transition-colors duration-200 ease-in-out hover:border-status-error hover:text-status-error"
                onClick={() => setShowLeaveConfirm(false)}
                disabled={isLeaving}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleLeaveStartup}
                disabled={isLeaving}
              >
                {isLeaving ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Leaving...</>
                ) : (
                  <><LogOut className="w-4 h-4 mr-2" />Yes, Leave Startup</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {hasVirtualOffice && (
          <TabsContent value="virtual-office" className="space-y-4">
            <Card className="border-0 bg-surface-card shadow-soft rounded-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading text-base font-semibold text-text-heading">
                  <Monitor className="h-5 w-5 text-primary" />
                  Virtual Office Preferences
                </CardTitle>
                <CardDescription className="font-body text-text-body">
                  Control workspace visibility and collaboration features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between space-x-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Radio className="h-4 w-4 text-primary" />
                        <Label
                          htmlFor="show-activity-feed"
                          className="font-body text-base font-medium text-text-heading"
                        >
                          Live Activity Feed
                        </Label>
                      </div>
                      <p className="font-body text-sm text-text-muted">
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
                <Separator className="bg-surface-border" />
                <div className="space-y-4">
                  <div className="flex items-start justify-between space-x-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <Label
                          htmlFor="show-presence-bar"
                          className="font-body text-base font-medium text-text-heading"
                        >
                          Team Presence Bar
                        </Label>
                      </div>
                      <p className="font-body text-sm text-text-muted">
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
                <Separator className="bg-surface-border" />
                <div className="space-y-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary" />
                    <h3 className="font-heading text-base font-semibold text-text-heading">
                      Notifications
                    </h3>
                  </div>
                  <div className="flex items-start justify-between space-x-4">
                    <div className="flex-1 space-y-1">
                      <Label
                        htmlFor="activity-notifications"
                        className="font-body text-base font-medium text-text-heading"
                      >
                        Activity Notifications
                      </Label>
                      <p className="font-body text-sm text-text-muted">
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
                      <Label
                        htmlFor="join-leave-alerts"
                        className="font-body text-base font-medium text-text-heading"
                      >
                        Join/Leave Alerts
                      </Label>
                      <p className="font-body text-sm text-text-muted">
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
                <Separator className="bg-surface-border" />
                <div className="pt-2">
                  <Button
                    variant="outline"
                    className="rounded-input border border-surface-border bg-surface-card font-body font-semibold text-text-body shadow-none transition-colors duration-200 ease-in-out hover:border-primary hover:text-primary"
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
          <Card className="border-0 bg-surface-card shadow-soft rounded-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading text-base font-semibold text-text-heading">
                <Database className="h-5 w-5 text-primary" />
                Data Management
              </CardTitle>
              <CardDescription className="font-body text-text-body">
                Export, import, or reset your StartupVerse data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4 rounded-input bg-primary-tint p-4">
                <Download className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="font-heading text-base font-semibold text-text-heading">
                      Export Data
                    </h3>
                    <p className="mt-1 font-body text-sm text-text-body">
                      Download all your data as a JSON file for backup or
                      migration
                    </p>
                  </div>
                  <Button
                    onClick={exportData}
                    size="sm"
                    variant="default"
                    className="rounded-input bg-primary font-body font-semibold text-white shadow-[0_4px_16px_rgba(58,90,254,0.20)] transition-colors duration-200 ease-in-out hover:bg-primary-hover [&_svg]:text-white"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export to JSON
                  </Button>
                </div>
              </div>
              <div className="flex items-start gap-4 rounded-input bg-surface-page p-4">
                <Upload className="mt-0.5 h-5 w-5 shrink-0 text-status-success" />
                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="font-heading text-base font-semibold text-text-heading">
                      Import Data
                    </h3>
                    <p className="mt-1 font-body text-sm text-text-body">
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
                    <Button
                      asChild={true}
                      size="sm"
                      variant="default"
                      className="rounded-input bg-primary font-body font-semibold text-white shadow-[0_4px_16px_rgba(58,90,254,0.20)] transition-colors duration-200 ease-in-out hover:bg-primary-hover [&_svg]:text-white"
                    >
                      <label htmlFor="import-file" className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" />
                        Import from JSON
                      </label>
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-4 rounded-input bg-surface-page p-4">
                <FileJson className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="font-heading text-base font-semibold text-text-heading">
                      Load Sample Data
                    </h3>
                    <p className="mt-1 font-body text-sm text-text-body">
                      Populate your workspace with example data to explore
                      features
                    </p>
                  </div>
                  <Button
                    onClick={loadSample}
                    size="sm"
                    variant="default"
                    className="rounded-input bg-primary font-body font-semibold text-white shadow-[0_4px_16px_rgba(58,90,254,0.20)] transition-colors duration-200 ease-in-out hover:bg-primary-hover [&_svg]:text-white"
                  >
                    <FileJson className="mr-2 h-4 w-4" />
                    Load Sample Data
                  </Button>
                </div>
              </div>
              <Separator className="bg-surface-border" />
              <div className="space-y-4">
                <div className="flex items-start gap-4 rounded-input bg-status-error/5 p-4">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-status-error" />
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="font-heading text-base font-semibold text-text-heading">
                        Danger Zone
                      </h3>
                      <p className="mt-1 font-body text-sm text-text-body">
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
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear All Data
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          onClick={clearData}
                          size="sm"
                          variant="destructive"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Yes, Delete Everything
                        </Button>
                        <Button
                          onClick={() => setShowConfirmClear(false)}
                          size="sm"
                          variant="outline"
                          className="rounded-input border border-surface-border bg-surface-card font-body font-semibold text-text-body transition-colors duration-200 ease-in-out hover:border-status-error hover:text-status-error"
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-4 rounded-input bg-status-error/5 p-4">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-status-error" />
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="font-heading text-base font-semibold text-text-heading">
                        Delete Account
                      </h3>
                      <p className="mt-1 font-body text-sm text-text-body">
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
                        <Trash2 className="mr-2 h-4 w-4" />
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
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                          ) : (
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                          )}
                          {isDeleting ? "Deleting..." : "Yes, Delete Account"}
                        </Button>
                        <Button
                          onClick={() => setShowConfirmDeleteAccount(false)}
                          size="sm"
                          variant="outline"
                          className="rounded-input border border-surface-border bg-surface-card font-body font-semibold text-text-body transition-colors duration-200 ease-in-out hover:border-status-error hover:text-status-error"
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <AdminDatabaseClear />
              <div className="border-t border-surface-border pt-4">
                <div className="flex items-center justify-between font-body text-sm text-text-muted">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
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
