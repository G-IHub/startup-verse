import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../config/apiBase.js";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { PasswordInput } from "./ui/password-input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import {
  Building,
  Mail,
  User,
  Briefcase,
  Calendar,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { clearAuthSession } from "../app/session";
import {
  AUTH_CARD,
  AUTH_CALLOUT,
  authBtnPrimary,
  authBtnOutline,
  authFieldClass,
  authLabelClass,
} from "./auth/AuthPrimitives";

const INVITE_PAGE =
  "min-h-screen flex items-center justify-center p-4 bg-surface-page font-body";

// Default fetch options for cookie-based auth

const defaultOptions = {
  credentials: "include",
  headers: { "Content-Type": "application/json" },
};

function CohortInvitationPanel({ invitation, onCancel, onCohortResolved }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const orgName = invitation.displayOrganizationName || "Program";
  const cohortName = invitation.displayCohortName || "Cohort";
  const founderId = invitation.founderId ? String(invitation.founderId) : "";
  const userId = user ? String(user._id ?? user.id ?? "") : "";
  const founderMatch = Boolean(user && founderId && userId === founderId);

  const respond = async (accept) => {
    if (!user) {
      toast.error("Log in with your founder account to respond.");
      return;
    }
    if (!founderMatch) {
      toast.error(
        "Sign in as the invited founder (this invitation is tied to another account).",
      );
      return;
    }
    const id = invitation._id ? String(invitation._id) : "";
    if (!id) {
      toast.error("Invalid invitation.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE_URL}/invitations/${id}/respond`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: accept ? "accepted" : "declined" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.message || "Could not update invitation");
      }
      toast.success(
        accept ? "You're in the cohort." : "Invitation declined.",
      );
      onCohortResolved?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={INVITE_PAGE}>
      <Card className={`w-full max-w-lg ${AUTH_CARD}`}>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-primary-tint">
            <Building className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="font-heading text-text-heading">Cohort invitation</CardTitle>
          <CardDescription className="font-body text-text-body">
            {orgName}
            {" invites your startup to join "}
            <span className="font-medium text-foreground">{cohortName}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {invitation.message ? (
            <div className={`text-sm ${AUTH_CALLOUT}`}>
              <p className="mb-1 font-body text-xs text-text-muted">Message</p>
              <p className="italic">"{invitation.message}"</p>
            </div>
          ) : null}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>
              Expires{" "}
              {invitation.expiresAt
                ? new Date(invitation.expiresAt).toLocaleDateString()
                : "—"}
            </span>
          </div>
          {!user ? (
            <p className="text-sm text-center text-muted-foreground">
              Log in with the founder account that received this link, then
              accept or decline.
            </p>
          ) : null}
          {user && !founderMatch ? (
            <p className="text-sm text-center text-amber-600">
              You’re signed in as a different user. Switch to the invited founder
              account to respond.
            </p>
          ) : null}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className={`flex-1 ${authBtnOutline}`}
              disabled={busy}
              onClick={() => onCancel?.()}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              className={`flex-1 ${authBtnOutline}`}
              disabled={busy || !founderMatch}
              onClick={() => respond(false)}
            >
              Decline
            </Button>
            <Button
              type="button"
              className={`flex-1 ${authBtnPrimary}`}
              disabled={busy || !founderMatch}
              onClick={() => respond(true)}
            >
              Accept
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function InvitationAcceptance({
  token,
  onAccept,
  onCancel,
  onCohortResolved,
}) {
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    confirmPassword: "",
  });
  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        console.log(
          "🔍 [InvitationAcceptance] Fetching invitation with token:",
          token,
        );

        // Fetch invitation from backend
        const API_URL =
          API_BASE_URL;
        const response = await fetch(`${API_URL}/invitations/token/${token}`, {
          ...defaultOptions,
        });
        if (!response.ok) {
          console.error("❌ [InvitationAcceptance] Failed to fetch invitation");
          setError("Invalid or expired invitation");
          setLoading(false);
          return;
        }
        const payload = await response.json();
        const data = payload?.data;
        if (!payload?.success || !data?.invitation) {
          console.error("❌ [InvitationAcceptance] Invitation not found");
          setError("Invalid or expired invitation");
          setLoading(false);
          return;
        }
        console.log("✅ [InvitationAcceptance] Invitation loaded:", data);
        const foundInvitation = data.invitation;
        const meta =
          foundInvitation.metadata &&
          typeof foundInvitation.metadata === "object"
            ? foundInvitation.metadata
            : {};

        const kind = data.kind === "cohort" ? "cohort" : "talent";

        // Parse dates from stored strings
        const parsedInvitation = {
          ...foundInvitation,
          kind,
          createdAt: new Date(foundInvitation.createdAt),
          expiresAt: foundInvitation.expiresAt
            ? new Date(foundInvitation.expiresAt)
            : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        };

        if (kind === "cohort") {
          parsedInvitation.displayCohortName =
            data.cohortName || data.cohort?.name || "";
          parsedInvitation.displayOrganizationName =
            data.organizationName || data.organization?.name || "";
        } else {
          parsedInvitation.startupName =
            data.startupName || meta.startupName || "";
          parsedInvitation.founderName =
            meta.founderName || meta.invitedByName || "A founder";
          parsedInvitation.role = meta.role || meta.position || "Team member";
          parsedInvitation.department = meta.department || "—";
        }

        // Check if invitation is expired
        if (parsedInvitation.expiresAt < new Date()) {
          setError("This invitation has expired");
          setLoading(false);
          return;
        }

        // Check if invitation is already accepted
        if (parsedInvitation.status === "accepted") {
          setError("This invitation has already been used");
          setLoading(false);
          return;
        }
        setInvitation(parsedInvitation);
        setLoading(false);
      } catch (error) {
        console.error(
          "❌ [InvitationAcceptance] Error fetching invitation:",
          error,
        );
        setError("Failed to load invitation");
        setLoading(false);
      }
    };
    fetchInvitation();
  }, [token]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!invitation || invitation.kind === "cohort") return;

    if (!formData.name || !formData.password || !formData.confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setSubmitting(true);
    try {
      clearAuthSession();
      const response = await fetch(
        `${API_BASE_URL}/invitations/token/${encodeURIComponent(token)}/accept`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: invitation.email,
            password: formData.password,
          }),
        },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to complete signup");
      }
      if (!payload?.success) {
        throw new Error(payload?.message || "Failed to complete signup");
      }
      const authData = payload.data || {};
      const resultUser = authData.user;
      if (!resultUser) {
        throw new Error("No user returned from server");
      }
      toast.success("Welcome to the team!");
      onAccept({
        ...resultUser,
        startupId: invitation.startupId,
        startupName: invitation.startupName,
        department: invitation.department,
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to complete signup",
      );
    } finally {
      setSubmitting(false);
    }
  };
  if (loading) {
    return (
      <div className={INVITE_PAGE}>
        <Card className={`w-full max-w-md ${AUTH_CARD}`}>
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
            <p className="font-body text-text-muted">Loading invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (error || !invitation) {
    return (
      <div className={INVITE_PAGE}>
        <Card className={`w-full max-w-md ${AUTH_CARD}`}>
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-status-error/10">
              <AlertCircle className="h-8 w-8 text-status-error" />
            </div>
            <h2 className="font-heading text-lg font-semibold text-text-heading">Invalid Invitation</h2>
            <p className="mb-6 font-body text-text-muted">{error}</p>
            <Button onClick={onCancel} variant="outline" className={authBtnOutline}>
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitation.kind === "cohort") {
    return (
      <CohortInvitationPanel
        invitation={invitation}
        onCancel={onCancel}
        onCohortResolved={onCohortResolved}
      />
    );
  }

  return (
    <div className={INVITE_PAGE}>
      <div className="w-full max-w-2xl space-y-6">
        <Card className={AUTH_CARD}>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-primary-tint">
              <UserPlus className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="font-heading text-text-heading">You&apos;re Invited!</CardTitle>
            <CardDescription className="font-body text-text-body">
              {invitation.founderName || "A founder"}
              {" has invited you to join their startup team"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Building className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Startup</p>
                    <p className="text-sm">
                      {invitation.startupName || "Startup"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Role</p>
                    <p className="text-sm">{invitation.role || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-input border border-surface-border bg-surface-page p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-tint">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p className="text-sm">{invitation.department || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-input border border-surface-border bg-surface-page p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-status-success/15">
                    <Mail className="h-5 w-5 text-status-success" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm truncate">{invitation.email}</p>
                  </div>
                </div>
              </div>
              {invitation.message && (
                <>
                  <Separator />
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="text-xs text-muted-foreground mb-1">
                      Personal Message
                    </p>
                    <p className="text-sm italic">"{invitation.message}"</p>
                  </div>
                </>
              )}
              {(invitation.equityPercentage || invitation.salary) && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground font-medium">
                      Compensation Package
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {invitation.equityPercentage && (
                        <div className="p-3 bg-accent/5 rounded-lg border border-accent/10">
                          <p className="text-xs text-muted-foreground">
                            Equity
                          </p>
                          <p className="text-sm">
                            {invitation.equityPercentage}%
                          </p>
                          {invitation.vestingYears && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {invitation.vestingYears}
                              {" year vesting"}
                              {invitation.cliffMonths &&
                                `, ${invitation.cliffMonths} month cliff`}
                            </p>
                          )}
                        </div>
                      )}
                      {invitation.salary && (
                        <div className="rounded-input border border-status-success/30 bg-status-success/10 p-3">
                          <p className="text-xs text-muted-foreground">
                            Salary
                          </p>
                          <p className="text-sm">{invitation.salary}</p>
                        </div>
                      )}
                      {invitation.benefits && (
                        <div className="rounded-input border border-primary/20 bg-primary-tint p-3 md:col-span-2">
                          <p className="text-xs text-muted-foreground">
                            Benefits
                          </p>
                          <p className="text-sm">{invitation.benefits}</p>
                        </div>
                      )}
                      {invitation.startDate && (
                        <div className="rounded-input border border-accent/20 bg-accent-tint p-3 md:col-span-2">
                          <p className="text-xs text-muted-foreground">
                            Start Date
                          </p>
                          <p className="text-sm">
                            {new Date(
                              invitation.startDate,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>
                  {"Invitation expires on "}
                  {new Date(invitation.expiresAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={AUTH_CARD}>
          <CardHeader>
            <CardTitle className="font-heading text-text-heading">Complete Your Account</CardTitle>
            <CardDescription className="font-body text-text-body">
              Create your account to join the team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className={authLabelClass}>Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={invitation.email}
                  disabled={true}
                  className={authFieldClass}
                />
                <p className="text-xs text-muted-foreground">
                  This email is pre-assigned by your invitation
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value,
                    })
                  }
                  required={true}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <PasswordInput
                  id="password"
                  autoComplete="new-password"
                  placeholder="Please choose a password (min. 6 characters)"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      password: e.target.value,
                    })
                  }
                  required={true}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <PasswordInput
                  id="confirmPassword"
                  autoComplete="new-password"
                  placeholder="Re-enter your password to confirm"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  required={true}
                />
              </div>
              <Separator />
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className={`flex-1 ${authBtnOutline}`}
                >
                  Decline
                </Button>
                <Button type="submit" className={`flex-1 ${authBtnPrimary}`} disabled={submitting}>
                  {submitting ? "Submitting…" : "Accept & Join Team"}
                  {!submitting ? (
                    <ArrowRight className="w-4 h-4 ml-2" />
                  ) : null}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h4 className="text-sm mb-2">What you'll get access to:</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Find New Opportunities</Badge>
                  <Badge variant="secondary">Virtual Office</Badge>
                  <Badge variant="secondary">Video Collaboration</Badge>
                  <Badge variant="secondary">Task Management</Badge>
                  <Badge variant="secondary">Team Messaging</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
