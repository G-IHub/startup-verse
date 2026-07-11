import React, { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
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
  Trash2,
  AlertCircle,
  CheckCircle2,
  LogOut,
  Building2,
  Loader2,
  Shield,
  UserCircle,
} from "lucide-react";
import { toast } from "sonner";
import * as authApi from "../utils/api/authApi";
import { leaveStartup } from "../utils/api/teamMemberApi";
import {
  SettingsPanelCard,
  SettingsGroup,
  SettingsActionRow,
  SETTINGS_CARD,
  settingsBtnOutline,
  settingsBtnDangerOutline,
  settingsBtnDanger,
} from "./settings/SettingsPrimitives.jsx";

export default function SettingsPage({
  user,
  onUpdateUser,
  onNavigate,
}) {
  const [showConfirmDeleteAccount, setShowConfirmDeleteAccount] =
    useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const isTeamMember = user?.role === "team-member";

  const handleLeaveStartup = async () => {
    const userId = String(user?._id ?? user?.id ?? "");
    if (!userId) return;
    setIsLeaving(true);
    try {
      await leaveStartup(userId);
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

  const deleteAccount = async () => {
    if (!user) {
      toast.error("No user found");
      setShowConfirmDeleteAccount(false);
      return;
    }
    setIsDeleting(true);
    try {
      const result = await authApi.deleteAccount(user.id);
      if (result.success) {
        if (onUpdateUser) {
          onUpdateUser(null);
        }
        toast.success("Account deleted successfully!");
        setTimeout(() => {
          window.location.replace("/");
        }, 500);
      } else {
        toast.error(result.error || "Failed to delete account");
        setShowConfirmDeleteAccount(false);
        setIsDeleting(false);
      }
    } catch {
      toast.error("Failed to delete account. Please try again.");
      setShowConfirmDeleteAccount(false);
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-full space-y-4 bg-surface-page p-2 font-body md:space-y-5 md:p-3 lg:p-4">
      <div className="w-full space-y-4">
        <SettingsPanelCard
          icon={UserCircle}
          title="Account identity"
          description="Your signed-in account details"
        >
          {user ? (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-input border border-surface-border bg-surface-page px-4 py-3">
                <p className="font-body text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                  Name
                </p>
                <p className="mt-1 font-body text-sm font-semibold text-text-heading">
                  {user.name || "Not specified"}
                </p>
              </div>
              <div className="rounded-input border border-surface-border bg-surface-page px-4 py-3">
                <p className="font-body text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                  Email
                </p>
                <p className="mt-1 truncate font-body text-sm font-semibold text-text-heading">
                  {user.email || "Not specified"}
                </p>
              </div>
              <div className="rounded-input border border-surface-border bg-surface-page px-4 py-3">
                <p className="font-body text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                  Role
                </p>
                <p className="mt-1 font-body text-sm font-semibold capitalize text-text-heading">
                  {user.role?.replace(/-/g, " ") || "Member"}
                </p>
              </div>
              <div className="rounded-input border border-surface-border bg-surface-page px-4 py-3">
                <p className="font-body text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                  Profile page
                </p>
                <p className="mt-1 font-body text-sm text-text-body">
                  Use the Profile switcher above to edit public profile details.
                </p>
              </div>
            </div>
          ) : (
            <Card className={SETTINGS_CARD}>
              <CardContent className="py-8">
                <p className="text-center font-body text-sm text-text-muted">
                  Account settings not available
                </p>
              </CardContent>
            </Card>
          )}
        </SettingsPanelCard>

        <SettingsPanelCard
          icon={Shield}
          title="Security & preferences"
          description="Manage account-level preferences and privacy controls"
        >
          <SettingsActionRow
            icon={Shield}
            iconTint="neutral"
            title="Account preferences"
            description="Public profile editing has moved to a dedicated page so account settings stay focused."
          >
            <Button
              type="button"
              size="sm"
              className={settingsBtnOutline}
              onClick={() => onNavigate?.("profile")}
            >
              Open profile
            </Button>
          </SettingsActionRow>
        </SettingsPanelCard>

        {isTeamMember && (
          <SettingsPanelCard
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

        <SettingsPanelCard
          icon={AlertCircle}
          title="Account"
          description="Permanent account actions"
        >
          <SettingsGroup title="Danger zone" icon={AlertCircle}>
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
        </SettingsPanelCard>
      </div>

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
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Leaving...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Yes, Leave Startup
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
