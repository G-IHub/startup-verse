import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import CompensationSetupWizard from "./CompensationSetupWizard";
import * as inboxApi from "../../utils/api/inboxApi";
import { getStartupTeamMembers } from "../../utils/api/teamMemberApi";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  Users,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
export default function TeamOnboardingManager({ user }) {
  const [showWizard, setShowWizard] = useState(false);
  const [selectedTalent, setSelectedTalent] = useState(null);
  const [acceptedTalent, setAcceptedTalent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onboardedIds, setOnboardedIds] = useState([]);
  useEffect(() => {
    if (user.role === "founder") {
      loadAcceptedTalent();
    }
  }, [user]);
  const loadAcceptedTalent = async () => {
    try {
      setLoading(true);

      // Fetch accepted interests (talent who expressed interest and founder accepted)
      const interests = await inboxApi.getReceivedInterests(user.id);
      const acceptedInterests = interests.filter(
        (i) => i.status === "accepted",
      );

      // Fetch sent invitations that were accepted by talent
      const sentInvitations = await inboxApi.getSentInvitations(user.id);
      const acceptedInvitations = sentInvitations.filter(
        (i) => i.status === "accepted",
      );

      // NEW: Fetch team members who completed onboarding via email invitation
      console.log(
        "📥 [TeamOnboardingManager] Fetching team members from backend...",
      );
      let teamMembers = [];
      try {
        teamMembers = await getStartupTeamMembers(user.id);
        console.log(
          "✅ [TeamOnboardingManager] Fetched team members:",
          teamMembers.length,
        );
      } catch (error) {
        console.error(
          "❌ [TeamOnboardingManager] Error fetching team members:",
          error,
        );
      }

      // Filter team members who have onboardingComplete but no compensation setup
      // (They completed onboarding but haven't been through compensation wizard)
      const teamMembersNeedingCompensation = teamMembers.filter((member) => {
        const hasCompletedOnboarding = member.onboardingComplete === true;
        const hasCompensation = member.hasCompensation === true; // This will be set by compensation wizard
        console.log(`🔍 [TeamOnboardingManager] Member ${member.name}:`, {
          onboardingComplete: hasCompletedOnboarding,
          hasCompensation,
          needsCompensation: hasCompletedOnboarding && !hasCompensation,
        });
        return hasCompletedOnboarding && !hasCompensation;
      });
      console.log(
        "🔍 [TeamOnboardingManager] Team members needing compensation:",
        teamMembersNeedingCompensation.length,
      );
      if (teamMembersNeedingCompensation.length > 0) {
        console.log(
          "📋 [TeamOnboardingManager] Members needing compensation:",
          teamMembersNeedingCompensation.map((m) => m.name),
        );
      }

      // Combine both into a unified list
      const combined = [
        ...acceptedInterests.map((interest) => ({
          id: `interest-${interest.id}`,
          talentId: interest.talentId,
          talentName: interest.talentName,
          talentArea: interest.talentArea,
          talentSkills: interest.talentSkills,
          role: interest.talentArea || "Team Member",
          source: "interest",
          acceptedDate: interest.respondedAt || interest.sentAt,
          interestId: interest.id,
          onboarded: false,
        })),
        ...acceptedInvitations.map((invitation) => ({
          id: `invitation-${invitation.id}`,
          talentId: invitation.talentId,
          talentName: invitation.talentName,
          role: "Team Member",
          source: "invitation",
          acceptedDate: invitation.respondedAt || invitation.sentAt,
          invitationId: invitation.id,
          onboarded: false,
        })),
        // NEW: Add team members who completed onboarding but need compensation
        ...teamMembersNeedingCompensation.map((member) => ({
          id: `team-member-${member.id}`,
          talentId: member.id,
          talentName: member.name || member.fullName || "Team Member",
          talentEmail: member.email,
          talentArea: member.role || member.position,
          talentSkills: member.skills || [],
          role: member.role || member.position || "Team Member",
          source: "invitation",
          // They were invited via email
          acceptedDate: member.createdAt || new Date().toISOString(),
          onboarded: false,
        })),
      ];

      // Sort by acceptance date (most recent first)
      combined.sort(
        (a, b) =>
          new Date(b.acceptedDate).getTime() -
          new Date(a.acceptedDate).getTime(),
      );
      console.log(
        "📊 [TeamOnboardingManager] Total accepted talent:",
        combined.length,
      );
      setAcceptedTalent(combined);
      setLoading(false);
    } catch (error) {
      console.error("Error loading accepted talent:", error);
      toast.error("Failed to load accepted talent");
      setLoading(false);
    }
  };
  const handleSetupCompensation = (talent) => {
    setSelectedTalent(talent);
    setShowWizard(true);
  };
  const handleCompensationComplete = async (compensationConfig) => {
    console.log(
      "📥 handleCompensationComplete called with config:",
      compensationConfig,
    );
    if (!selectedTalent) {
      console.error("❌ No selected talent!");
      return;
    }
    console.log("👤 Selected talent:", selectedTalent);
    console.log(
      "🏢 Creating contract for startup:",
      user.startupId || user.companyId || "demo-startup-id",
    );
    try {
      if (!selectedTalent.interestId) {
        toast.error(
          "Cannot onboard without an interest record. Complete onboarding from the Inbox.",
        );
        return;
      }
      await inboxApi.markInterestAsOnboarded(selectedTalent.interestId);
      toast.success(
        `🎉 ${selectedTalent.talentName} has been successfully onboarded to your team!`,
      );

      setOnboardedIds([...onboardedIds, selectedTalent.id]);
      setShowWizard(false);
      setSelectedTalent(null);

      await loadAcceptedTalent();
    } catch (error) {
      console.error("❌ Onboarding failed:", error);
      toast.error(error.message || "Failed to onboard team member");
    }
  };
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };
  const pendingOnboarding = acceptedTalent.filter(
    (t) => !onboardedIds.includes(t.id),
  );
  const onboardedTalent = acceptedTalent.filter((t) =>
    onboardedIds.includes(t.id),
  );
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingOnboarding.length}</p>
                <p className="text-xs text-muted-foreground">
                  Pending Onboarding
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{onboardedTalent.length}</p>
                <p className="text-xs text-muted-foreground">Onboarded</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{acceptedTalent.length}</p>
                <p className="text-xs text-muted-foreground">Total Accepted</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {pendingOnboarding.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              Pending Onboarding ({pendingOnboarding.length})
            </CardTitle>
            <CardDescription>
              These team members have accepted but need compensation setup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingOnboarding.map((talent) => (
                <div
                  key={talent.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:border-primary/50 transition-colors"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials(talent.talentName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold truncate">
                        {talent.talentName}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {talent.source === "interest"
                          ? "Expressed Interest"
                          : "Invited"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {talent.role}
                    </p>
                    {talent.talentSkills && talent.talentSkills.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {talent.talentSkills.slice(0, 3).map((skill, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs"
                          >
                            {skill}
                          </Badge>
                        ))}
                        {talent.talentSkills.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{talent.talentSkills.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-2">
                      {"Accepted "}
                      {formatDate(talent.acceptedDate)}
                    </p>
                    <Button
                      onClick={() => handleSetupCompensation(talent)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Onboard Team
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {onboardedTalent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Onboarded ({onboardedTalent.length})
            </CardTitle>
            <CardDescription>
              Compensation has been set up for these team members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {onboardedTalent.map((talent) => (
                <div
                  key={talent.id}
                  className="flex items-center gap-4 p-4 border rounded-lg bg-green-50"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-green-100 text-green-700 font-semibold">
                      {getInitials(talent.talentName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold truncate">
                        {talent.talentName}
                      </h4>
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {talent.role}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant="outline"
                      className="text-green-700 border-green-600"
                    >
                      Onboarded
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {acceptedTalent.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No Accepted Talent Yet
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Once talent accepts your invitations or you accept their
                interest, they'll appear here for onboarding.
              </p>
              <Button variant="outline" onClick={loadAcceptedTalent}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {showWizard && selectedTalent && (
        <CompensationSetupWizard
          isOpen={showWizard}
          onClose={() => {
            setShowWizard(false);
            setSelectedTalent(null);
          }}
          teamMemberName={selectedTalent.talentName}
          teamMemberId={selectedTalent.talentId}
          founderId={user.id}
          startupId={user.startupId || user.companyId || "demo-startup-id"}
          onComplete={handleCompensationComplete}
        />
      )}
    </div>
  );
}
