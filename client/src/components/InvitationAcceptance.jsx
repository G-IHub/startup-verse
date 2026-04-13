import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
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
import { getAccessToken } from "../app/session";

export default function InvitationAcceptance({ token, onAccept, onCancel }) {
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
          import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
        const response = await fetch(`${API_URL}/invitations/token/${token}`, {
          headers: {
            Authorization: `Bearer ${getAccessToken()}`,
          },
        });
        if (!response.ok) {
          console.error("❌ [InvitationAcceptance] Failed to fetch invitation");
          setError("Invalid or expired invitation");
          setLoading(false);
          return;
        }
        const data = await response.json();
        if (!data.success || !data.invitation) {
          console.error("❌ [InvitationAcceptance] Invitation not found");
          setError("Invalid or expired invitation");
          setLoading(false);
          return;
        }
        console.log(
          "✅ [InvitationAcceptance] Invitation loaded:",
          data.invitation,
        );
        const foundInvitation = data.invitation;

        // Parse dates from stored strings
        const parsedInvitation = {
          ...foundInvitation,
          createdAt: new Date(foundInvitation.createdAt),
          expiresAt: foundInvitation.expiresAt
            ? new Date(foundInvitation.expiresAt)
            : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        };

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
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!invitation) return;

    // Validation
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

    // Create user account
    const newUser = {
      id: `user_${Date.now()}`,
      role: "team-member",
      name: formData.name,
      email: invitation.email,
      onboardingComplete: true,
      startupId: invitation.startupId,
      founderId: invitation.founderId,
      // ✅ ADD: Link team member to founder for task assignment
      companyId: invitation.startupId,
      // ✅ ADD: Also set companyId for compatibility
      profile: {
        role: invitation.role,
        department: invitation.department,
        startupName: invitation.startupName,
        joinedViaInvitation: true,
        invitedBy: invitation.founderName,
      },
    };

    // Update invitation status
    const invitations = JSON.parse(
      localStorage.getItem("startupverse_invitations") || "[]",
    );
    const updatedInvitations = invitations.map((inv) =>
      inv.token === token
        ? {
            ...inv,
            status: "accepted",
          }
        : inv,
    );
    localStorage.setItem(
      "startupverse_invitations",
      JSON.stringify(updatedInvitations),
    );

    // **AUTO-UPDATE TEAM BUILDING & EQUITY TRACKING**
    // Add team member to Team Building section
    const teamMembers = JSON.parse(
      localStorage.getItem("team_members") || "[]",
    );
    const newTeamMember = {
      id: `member_${Date.now()}`,
      name: formData.name,
      email: invitation.email,
      role: invitation.role,
      department: invitation.department,
      joinDate: new Date().toISOString(),
      equity: invitation.equityPercentage || 0,
      status: "Active",
    };
    teamMembers.push(newTeamMember);
    localStorage.setItem("team_members", JSON.stringify(teamMembers));

    // Add/Update equity offer in Team Building section
    if (invitation.equityPercentage) {
      const equityOffers = JSON.parse(
        localStorage.getItem("team_equity_offers") || "[]",
      );
      const newEquityOffer = {
        id: `offer_${Date.now()}`,
        recipientName: formData.name,
        recipientEmail: invitation.email,
        role: invitation.role,
        equityPercentage: invitation.equityPercentage,
        vestingYears: invitation.vestingYears || 4,
        cliffMonths: invitation.cliffMonths || 12,
        salary: invitation.salary || "",
        benefits: invitation.benefits || "",
        startDate: invitation.startDate || new Date().toISOString(),
        status: "Accepted",
        sentDate: new Date().toISOString(),
      };
      equityOffers.push(newEquityOffer);
      localStorage.setItem("team_equity_offers", JSON.stringify(equityOffers));
    }

    // **AUTO-UPDATE ROLE DEFINITIONS**
    // Check if role already exists in role definitions, if not create it, if yes mark as filled
    const roles = JSON.parse(localStorage.getItem("team_roles") || "[]");
    const existingRoleIndex = roles.findIndex(
      (r) =>
        r.title.toLowerCase() === invitation.role.toLowerCase() &&
        r.department.toLowerCase() === invitation.department.toLowerCase(),
    );
    if (existingRoleIndex >= 0) {
      // Role exists - mark as filled
      roles[existingRoleIndex].isFilled = true;
      roles[existingRoleIndex].filledBy = formData.name;
      roles[existingRoleIndex].filledDate = new Date().toISOString();
    } else {
      // Role doesn't exist - create new role definition
      const newRole = {
        id: `role_${Date.now()}`,
        title: invitation.role,
        department: invitation.department,
        level: "Mid",
        // Default level, can be updated later
        responsibilities: `Key responsibilities for ${invitation.role} position`,
        requiredSkills: "To be defined",
        reportingTo: "Founder/CEO",
        teamSize: "0",
        isFilled: true,
        filledBy: formData.name,
        filledDate: new Date().toISOString(),
      };
      roles.push(newRole);
    }
    localStorage.setItem("team_roles", JSON.stringify(roles));

    // **AUTO-UPDATE CAP TABLE IN COMPANY FORMATION**
    // Add team member to Company Formation cap table if they have equity
    if (invitation.equityPercentage) {
      const companyFounders = JSON.parse(
        localStorage.getItem("company_founders") || "[]",
      );
      const newFounderEntry = {
        id: `founder_${Date.now()}`,
        name: formData.name,
        email: invitation.email,
        role: invitation.role,
        equity: invitation.equityPercentage,
        vestingYears: invitation.vestingYears || 4,
        cliffMonths: invitation.cliffMonths || 12,
        isTeamMember: true,
        // Flag to distinguish from original founders
        joinDate: new Date().toISOString(),
      };
      companyFounders.push(newFounderEntry);
      localStorage.setItem("company_founders", JSON.stringify(companyFounders));
    }

    // **AUTO-UPDATE FOUNDER JOURNEY PROGRESS**
    // Mark Team Building stage as in-progress or increase progress
    const journeyProgress = JSON.parse(
      localStorage.getItem("founder_journey_progress") || "{}",
    );
    if (!journeyProgress.teamBuilding) {
      journeyProgress.teamBuilding = {
        status: "in-progress",
        progress: 20,
        startedAt: new Date().toISOString(),
      };
    } else {
      // Increment progress (each team member adds progress)
      journeyProgress.teamBuilding.progress = Math.min(
        (journeyProgress.teamBuilding.progress || 0) + 15,
        100,
      );
      // Mark as completed if progress reaches 80%+
      if (journeyProgress.teamBuilding.progress >= 80) {
        journeyProgress.teamBuilding.status = "completed";
        journeyProgress.teamBuilding.completedAt = new Date().toISOString();
      } else {
        journeyProgress.teamBuilding.status = "in-progress";
      }
    }
    localStorage.setItem(
      "founder_journey_progress",
      JSON.stringify(journeyProgress),
    );

    // **AUTO-UPDATE VIRTUAL OFFICE TEAM LIST**
    // Add team member to virtual office with online status
    const virtualOfficeTeam = JSON.parse(
      localStorage.getItem("virtual_office_team") || "[]",
    );
    const newOfficeTeamMember = {
      id: `office_${Date.now()}`,
      name: formData.name,
      email: invitation.email,
      role: invitation.role,
      department: invitation.department,
      status: "online",
      currentActivity: "Just joined the team!",
      location: "Remote",
      avatar: null,
      joinedAt: new Date().toISOString(),
    };
    virtualOfficeTeam.push(newOfficeTeamMember);
    localStorage.setItem(
      "virtual_office_team",
      JSON.stringify(virtualOfficeTeam),
    );

    // **AUTO-CREATE NOTIFICATION FOR FOUNDER**
    // Notify the founder that someone accepted their invitation
    const notifications = JSON.parse(
      localStorage.getItem("founder_notifications") || "[]",
    );
    const newNotification = {
      id: `notif_${Date.now()}`,
      type: "team_member_joined",
      title: "New Team Member Joined! 🎉",
      message: `${formData.name} has accepted your invitation and joined as ${invitation.role}`,
      timestamp: new Date().toISOString(),
      read: false,
      priority: "high",
      actionUrl: "team:members",
      metadata: {
        memberName: formData.name,
        role: invitation.role,
        equity: invitation.equityPercentage,
      },
    };
    notifications.unshift(newNotification); // Add to beginning
    localStorage.setItem(
      "founder_notifications",
      JSON.stringify(notifications),
    );

    // **AUTO-UPDATE COMPANY STATS**
    // Track company growth metrics
    const companyStats = JSON.parse(
      localStorage.getItem("company_stats") || "{}",
    );
    if (!companyStats.teamGrowth) {
      companyStats.teamGrowth = [];
    }
    companyStats.teamGrowth.push({
      date: new Date().toISOString(),
      teamSize: teamMembers.length + 1,
      // +1 for the new member
      event: "member_joined",
      memberName: formData.name,
      role: invitation.role,
    });
    companyStats.currentTeamSize = teamMembers.length + 1;
    companyStats.lastUpdated = new Date().toISOString();
    localStorage.setItem("company_stats", JSON.stringify(companyStats));

    // Remove from talent pool if they were a talent user
    const talentProfiles = JSON.parse(
      localStorage.getItem("startupverse_talent_profiles") || "[]",
    );
    const updatedTalentProfiles = talentProfiles.filter(
      (profile) => profile.email !== invitation.email,
    );
    localStorage.setItem(
      "startupverse_talent_profiles",
      JSON.stringify(updatedTalentProfiles),
    );
    toast.success("Welcome to the team!");
    onAccept(newUser);
  };
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2>Invalid Invitation</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={onCancel} variant="outline">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="w-full max-w-2xl space-y-6">
        <Card className="border-primary/20">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle>You're Invited!</CardTitle>
            <CardDescription>
              {invitation.founderName}
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
                    <p className="text-sm">{invitation.startupName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Role</p>
                    <p className="text-sm">{invitation.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p className="text-sm">{invitation.department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-green-600" />
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
                        <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                          <p className="text-xs text-muted-foreground">
                            Salary
                          </p>
                          <p className="text-sm">{invitation.salary}</p>
                        </div>
                      )}
                      {invitation.benefits && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900 md:col-span-2">
                          <p className="text-xs text-muted-foreground">
                            Benefits
                          </p>
                          <p className="text-sm">{invitation.benefits}</p>
                        </div>
                      )}
                      {invitation.startDate && (
                        <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-900 md:col-span-2">
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
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Account</CardTitle>
            <CardDescription>
              Create your account to join the team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={invitation.email}
                  disabled={true}
                  className="bg-muted"
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
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password (min. 6 characters)"
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
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
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
                  className="flex-1"
                >
                  Decline
                </Button>
                <Button type="submit" className="flex-1">
                  Accept & Join Team
                  <ArrowRight className="w-4 h-4 ml-2" />
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
