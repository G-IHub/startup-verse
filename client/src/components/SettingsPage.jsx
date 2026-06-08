import React, { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
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
import {
  SettingsPanelCard,
  SettingsGroup,
  SettingsToggleRow,
  SettingsActionRow,
  SETTINGS_CARD,
  settingsBtnPrimary,
  settingsBtnOutline,
  settingsBtnDangerOutline,
  settingsBtnDanger,
} from "./settings/SettingsPrimitives.jsx";
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
    "rounded-none border-0 border-b-2 border-transparent bg-transparent px-1 pb-3 pt-1 font-body text-sm font-medium text-text-muted shadow-none transition-colors duration-200 ease-in-out hover:text-primary data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-primary data-[state=active]:shadow-none [&_svg]:text-text-muted data-[state=active]:[&_svg]:text-primary hover:[&_svg]:text-primary";

  return (
    <div className="min-h-full space-y-4 bg-surface-page p-2 font-body md:space-y-5 md:p-3 lg:p-4">
      <div className="w-full">
        <h1 className="mb-1 font-heading text-xl font-extrabold text-text-heading md:text-2xl">
          Settings
        </h1>
        <p className="font-body text-xs text-text-body md:text-sm">
          {hasVirtualOffice
            ? "Profile, Virtual Office preferences, and data controls"
            : "Profile, preferences, and account controls"}
        </p>
      </div>
      <Tabs defaultValue="profile" className="w-full">
        {hasVirtualOffice ? (
          <TabsList className="grid h-auto min-h-10 w-full grid-cols-3 gap-0 rounded-none border-0 border-b border-surface-border bg-transparent p-0">
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
          <TabsList className="grid h-auto min-h-10 w-full grid-cols-2 gap-0 rounded-none border-0 border-b border-surface-border bg-transparent p-0">
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
        <TabsContent value="profile" className="mt-4 w-full space-y-4">
          {user && onUpdateUser ? (
            <ProfilePage
              user={user}
              onUpdateUser={onUpdateUser}
              initialEditing={initialProfileEditing}
              embeddedInSettings
            />
          ) : (
            <Card className={SETTINGS_CARD}>
              <CardContent className="py-8">
                <p className="text-center font-body text-sm text-text-muted">
                  Profile settings not available
                </p>
              </CardContent>
            </Card>
          )}
          {isTeamMember && (
            <SettingsPanelCard
              className="mt-4"
              icon={Building2}
              title="Startup membership"
              description="You are an active team member of a startup"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full border-0 bg-primary-tint px-2.5 py-0.5 font-body text-[11px] font-semibold text-primary">
                  Team member
                </Badge>
                {user?.startupId ? (
                  <Badge
                    variant="outline"
                    className="rounded-full border-surface-border font-mono text-[10px] text-text-muted"
                  >
                    …{String(user.startupId).slice(-8)}
                  </Badge>
                ) : null}
              </div>
              <p className="font-body text-xs leading-relaxed text-text-body md:text-sm">
                Leaving reverts your role to <strong className="text-text-heading">talent</strong>{" "}
                and detaches you from the startup. Your profile data stays intact and you can join
                another team later.
              </p>
              <Button
                variant="outline"
                className={settingsBtnDangerOutline}
                onClick={() => setShowLeaveConfirm(true)}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Leave startup
              </Button>
            </SettingsPanelCard>
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
                className={settingsBtnOutline}
                onClick={() => setShowLeaveConfirm(false)}
                disabled={isLeaving}
              >
                Cancel
              </Button>
              <Button
                className={settingsBtnDanger}
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
          <TabsContent value="virtual-office" className="mt-4 w-full space-y-4">
            <SettingsPanelCard
              icon={Monitor}
              title="Virtual Office"
              description="Workspace visibility and collaboration"
            >
              <SettingsGroup title="Workspace">
                <SettingsToggleRow
                  id="show-activity-feed"
                  icon={Radio}
                  title="Live activity feed"
                  description="Show real-time team activities in the sidebar"
                  checked={officeSettings.settings.showActivityFeed}
                  onCheckedChange={(checked) =>
                    officeSettings.updateSettings({ showActivityFeed: checked })
                  }
                />
                <SettingsToggleRow
                  id="show-presence-bar"
                  icon={Users}
                  title="Team presence bar"
                  description="Show who is online and their current status"
                  checked={officeSettings.settings.showPresenceBar}
                  onCheckedChange={(checked) =>
                    officeSettings.updateSettings({ showPresenceBar: checked })
                  }
                />
              </SettingsGroup>
              <SettingsGroup title="Notifications" icon={Bell}>
                <SettingsToggleRow
                  id="activity-notifications"
                  title="Activity notifications"
                  description="Notify you about team activities and updates"
                  checked={officeSettings.settings.activityNotifications}
                  onCheckedChange={(checked) =>
                    officeSettings.updateSettings({ activityNotifications: checked })
                  }
                />
                <SettingsToggleRow
                  id="join-leave-alerts"
                  title="Join and leave alerts"
                  description="Alert when team members join or leave"
                  checked={officeSettings.settings.teamJoinLeaveAlerts}
                  onCheckedChange={(checked) =>
                    officeSettings.updateSettings({ teamJoinLeaveAlerts: checked })
                  }
                />
              </SettingsGroup>
              <div className="border-t border-surface-border/60 pt-4">
                <Button
                  variant="outline"
                  className={settingsBtnOutline}
                  onClick={() => {
                    officeSettings.resetToDefaults();
                    toast.success("Settings reset to defaults");
                  }}
                >
                  Reset to defaults
                </Button>
              </div>
            </SettingsPanelCard>
          </TabsContent>
        )}
        <TabsContent value="data" className="mt-4 w-full space-y-4">
          <SettingsPanelCard
            icon={Database}
            title="Data & backup"
            description="Export, import, or reset your preferences"
          >
            <SettingsGroup title="Backup">
              <SettingsActionRow
                icon={Download}
                iconTint="primary"
                title="Export data"
                description="Download your preferences as JSON for backup or migration"
              >
                <Button onClick={exportData} size="sm" className={settingsBtnPrimary}>
                  <Download className="mr-2 h-4 w-4" />
                  Export JSON
                </Button>
              </SettingsActionRow>
              <SettingsActionRow
                icon={Upload}
                iconTint="success"
                title="Import data"
                description="Restore from a previously exported JSON file"
              >
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                  id="import-file"
                />
                <Button asChild size="sm" className={settingsBtnOutline}>
                  <label htmlFor="import-file" className="cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" />
                    Import JSON
                  </label>
                </Button>
              </SettingsActionRow>
              <SettingsActionRow
                icon={FileJson}
                iconTint="neutral"
                title="Load sample data"
                description="Populate the workspace with example data to explore features"
              >
                <Button onClick={loadSample} size="sm" className={settingsBtnOutline}>
                  <FileJson className="mr-2 h-4 w-4" />
                  Load sample
                </Button>
              </SettingsActionRow>
            </SettingsGroup>

            <SettingsGroup title="Danger zone" icon={AlertCircle}>
              <SettingsActionRow
                icon={Trash2}
                iconTint="danger"
                danger
                title="Clear local data"
                description="Remove legacy browser storage on this device. Cannot be undone."
              >
                {!showConfirmClear ? (
                  <Button
                    onClick={() => setShowConfirmClear(true)}
                    size="sm"
                    className={settingsBtnDangerOutline}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear data
                  </Button>
                ) : (
                  <>
                    <Button onClick={clearData} size="sm" className={settingsBtnDanger}>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Confirm clear
                    </Button>
                    <Button
                      onClick={() => setShowConfirmClear(false)}
                      size="sm"
                      className={settingsBtnOutline}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </SettingsActionRow>
              <SettingsActionRow
                icon={Trash2}
                iconTint="danger"
                danger
                title="Delete account"
                description="Permanently delete your account and all associated server data."
              >
                {!showConfirmDeleteAccount ? (
                  <Button
                    onClick={() => setShowConfirmDeleteAccount(true)}
                    size="sm"
                    className={settingsBtnDangerOutline}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete account
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={deleteAccount}
                      size="sm"
                      className={settingsBtnDanger}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                      )}
                      {isDeleting ? "Deleting…" : "Confirm delete"}
                    </Button>
                    <Button
                      onClick={() => setShowConfirmDeleteAccount(false)}
                      size="sm"
                      className={settingsBtnOutline}
                      disabled={isDeleting}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </SettingsActionRow>
            </SettingsGroup>

            <div className="flex items-center justify-between rounded-input border border-surface-border bg-surface-page px-4 py-3 font-body text-sm">
              <div className="flex items-center gap-2 text-text-muted">
                <Calendar className="h-4 w-4" />
                <span>Last backup</span>
              </div>
              <Badge className="rounded-full border-0 bg-surface-page font-body text-[11px] font-medium text-text-muted ring-1 ring-surface-border">
                No backups yet
              </Badge>
            </div>
          </SettingsPanelCard>
          <AdminDatabaseClear />
        </TabsContent>
      </Tabs>
    </div>
  );
}
