import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Label } from "./ui/label";
import {
  Rocket,
  User,
  Mail,
  Lock,
  Briefcase,
  Building2,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
export function TeamMemberOnboarding({ invitationToken, onComplete }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    bio: "",
    linkedin: "",
    github: "",
  });

  // Fetch invitation details on mount
  useEffect(() => {
    fetchInvitationDetails();
  }, [invitationToken]);
  const fetchInvitationDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const projectId = "zuvrtclwxqycfskgtpbs";
      const publicAnonKey =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1dnJ0Y2x3eHF5Y2Zza2d0cGJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNzA4NTcsImV4cCI6MjA4Mzk0Njg1N30.4QY7N-tAXL9LNzK5_c9WGF1UPbezNaWABkV7n29bM1M";
      const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-78157e08`;
      console.log("🔍 Fetching invitation details for token:", invitationToken);
      const response = await fetch(
        `${API_URL}/founders/invitations/${invitationToken}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
          },
        },
      );
      if (!response.ok) {
        throw new Error("Failed to fetch invitation details");
      }
      const data = await response.json();
      if (!data.success || !data.invitation) {
        throw new Error(data.error || "Invitation not found");
      }
      const invitationData = data.invitation;

      // Check if invitation is expired
      if (new Date(invitationData.expiresAt) < new Date()) {
        throw new Error("This invitation has expired");
      }

      // Check if invitation is already accepted
      if (invitationData.status === "accepted") {
        throw new Error("This invitation has already been used");
      }
      setInvitation(invitationData);

      // Pre-fill form data
      setFormData((prev) => ({
        ...prev,
        email: invitationData.email,
        name: invitationData.name || "",
      }));
      console.log("✅ Invitation details loaded:", invitationData);
    } catch (err) {
      console.error("❌ Error fetching invitation:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load invitation",
      );
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Please fill in all required fields");
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
    try {
      setSubmitting(true);
      const projectId = "zuvrtclwxqycfskgtpbs";
      const publicAnonKey =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1dnJ0Y2x3eHF5Y2Zza2d0cGJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNzA4NTcsImV4cCI6MjA4Mzk0Njg1N30.4QY7N-tAXL9LNzK5_c9WGF1UPbezNaWABkV7n29bM1M";
      const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-78157e08`;
      console.log("📝 Submitting team member onboarding...");

      // Create user account and accept invitation
      const response = await fetch(
        `${API_URL}/founders/invitations/${invitationToken}/accept`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            bio: formData.bio,
            linkedin: formData.linkedin,
            github: formData.github,
          }),
        },
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to complete onboarding");
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to complete onboarding");
      }
      console.log("✅ Onboarding completed successfully:", result);
      toast.success(`🎉 Welcome to ${invitation?.startupName}!`);

      // Call onComplete callback with user data
      // IMPORTANT: Use the role from backend (team-member), not from invitation (position like "CTO")
      onComplete({
        ...result.user,
        startupId: invitation?.startupId,
        startupName: invitation?.startupName,
        // Don't overwrite role - backend already set it to 'team-member'
        // The position (like "CTO") is stored separately in result.user.position
        department: invitation?.department,
      });
    } catch (err) {
      console.error("❌ Error during onboarding:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to complete onboarding",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-600 dark:text-gray-300">
              Loading invitation...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200 dark:border-red-800">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-red-600 dark:text-red-400">
                Invalid Invitation
              </CardTitle>
            </div>
            <CardDescription className="text-red-600/80 dark:text-red-400/80">
              {error || "This invitation link is not valid"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              This could happen if:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400 mb-6">
              <li>The invitation has expired (14 days)</li>
              <li>The invitation has already been used</li>
              <li>The invitation link is incorrect</li>
            </ul>
            <Button
              onClick={() => (window.location.href = "/")}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main onboarding form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center pb-6">
          <div className="mb-6 p-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg text-white">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="p-3 bg-white/20 rounded-full">
                <Rocket className="w-8 h-8" />
              </div>
              <div className="text-left">
                <h2 className="text-2xl font-bold">{invitation.startupName}</h2>
                <p className="text-blue-100 text-sm">
                  invites you to join their team
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                <span>
                  {"Invited by "}
                  {invitation.founderName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                <span>
                  {"Role: "}
                  {invitation.role}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <span>{invitation.department}</span>
              </div>
            </div>
            {invitation.message && (
              <div className="mt-4 p-3 bg-white/10 rounded-lg border border-white/20">
                <p className="text-sm italic">“{invitation.message}”</p>
              </div>
            )}
          </div>
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>
            Set up your account to start collaborating with the team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name *
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    name: e.target.value,
                  })
                }
                required={true}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                readOnly={true}
                disabled={true}
                className="w-full bg-gray-50 dark:bg-gray-800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password *
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    password: e.target.value,
                  })
                }
                required={true}
                minLength={6}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Confirm Password *
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    confirmPassword: e.target.value,
                  })
                }
                required={true}
                minLength={6}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio (Optional)</Label>
              <Textarea
                id="bio"
                placeholder="Tell us a bit about yourself..."
                value={formData.bio}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bio: e.target.value,
                  })
                }
                rows={3}
                className="w-full resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn Profile (Optional)</Label>
              <Input
                id="linkedin"
                type="url"
                placeholder="https://linkedin.com/in/yourprofile"
                value={formData.linkedin}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    linkedin: e.target.value,
                  })
                }
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="github">GitHub Profile (Optional)</Label>
              <Input
                id="github"
                type="url"
                placeholder="https://github.com/yourusername"
                value={formData.github}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    github: e.target.value,
                  })
                }
                className="w-full"
              />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-6 text-lg font-semibold mt-6"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Completing Setup...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Accept Invitation & Join Team
                </>
              )}
            </Button>
            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
              {"By joining, you agree to collaborate with "}
              {invitation.startupName}
              {" on StartupVerse"}
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
