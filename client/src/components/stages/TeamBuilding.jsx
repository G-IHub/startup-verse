import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  Users,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Eye,
  UserPlus,
  CheckCircle2,
  Clock,
  Briefcase,
  FastForward,
} from "lucide-react";
import { toast } from "sonner";
import {
  generateSmartTeamRecommendations,
  getTalentMatchesForRoles,
} from "../../utils/smartTeamMatching";
import { TalentProfileModal } from "../TalentProfileModal";
import CompensationSetupWizard from "../compensation/CompensationSetupWizard";
import { createCompensationContract } from "../../utils/api/compensationApi";
import CompensationDemoPage from "../compensation/CompensationDemoPage";
import { DollarSign } from "lucide-react";
export default function TeamBuilding({ user, onBack }) {
  const [teamNeeds, setTeamNeeds] = useState({
    rolesNeeded: "",
    skillsRequired: "",
    timeline: "",
  });
  const [teamRecommendations, setTeamRecommendations] = useState([]);
  const [talentMatches, setTalentMatches] = useState([]);
  const [selectedTalent, setSelectedTalent] = useState(null);
  const [isTalentModalOpen, setIsTalentModalOpen] = useState(false);

  // Compensation state
  const [showCompensationWizard, setShowCompensationWizard] = useState(false);
  const [selectedTalentForCompensation, setSelectedTalentForCompensation] =
    useState(null);
  const [contracts, setContracts] = useState([]);
  const [acceptedApplicationIds, setAcceptedApplicationIds] = useState([]);
  const [showCompensationManager, setShowCompensationManager] = useState(false);

  // Mock pending applications (in real app, this would come from API)
  const mockApplications = [
    {
      id: "app-1",
      talentId: "talent-001",
      talentName: "Sarah Chen",
      talentEmail: "sarah@example.com",
      role: "Senior Full-Stack Engineer",
      skills: ["React", "Node.js", "TypeScript", "PostgreSQL"],
      experience: "5 years",
      matchScore: 95,
      appliedDate: "2026-01-10",
      status: "pending",
    },
    {
      id: "app-2",
      talentId: "talent-002",
      talentName: "Michael Rodriguez",
      talentEmail: "michael@example.com",
      role: "Product Designer",
      skills: ["Figma", "UI/UX", "User Research", "Prototyping"],
      experience: "4 years",
      matchScore: 88,
      appliedDate: "2026-01-12",
      status: "pending",
    },
    {
      id: "app-3",
      talentId: "talent-003",
      talentName: "Emily Watson",
      talentEmail: "emily@example.com",
      role: "Marketing Lead",
      skills: ["Growth Marketing", "SEO", "Content Strategy", "Analytics"],
      experience: "6 years",
      matchScore: 92,
      appliedDate: "2026-01-14",
      status: "pending",
    },
  ];

  // Filter out accepted applications
  const pendingApplications = mockApplications.filter(
    (app) => !acceptedApplicationIds.includes(app.id),
  );

  // Load saved data
  useEffect(() => {
    const savedData = localStorage.getItem("team_needs");
    if (savedData) {
      setTeamNeeds(JSON.parse(savedData));
    }
  }, []);

  // Generate team recommendations based on user profile
  useEffect(() => {
    if (user.profile) {
      const recommendations = generateSmartTeamRecommendations({
        industryFocus: user.profile.industryFocus,
        stage: user.profile.stage,
        targetAudience: user.profile.targetAudience,
        rolesNeeded: user.profile.rolesNeeded,
        teamSize: user.profile.teamSize,
        startupDescription: user.profile.startupDescription,
      });
      setTeamRecommendations(recommendations);

      // Get talent matches for top recommended roles
      const topRoles = recommendations.slice(0, 6).map((r) => r.role);
      const matches = getTalentMatchesForRoles(topRoles, 6);
      setTalentMatches(matches);
    }
  }, [user.profile]);

  // Save and continue to next stage
  const saveAndContinue = () => {
    localStorage.setItem("team_needs", JSON.stringify(teamNeeds));
    toast.success("Progress saved! Moving to next stage...");
    setTimeout(() => onBack(), 500);
  };
  const handleSkipPhase = () => {
    // Save skip state
    const skipData = {
      ...teamNeeds,
      skipped: true,
      skipReason:
        "Already completed independently or proceeding with current team",
    };
    localStorage.setItem("team_needs", JSON.stringify(skipData));
    toast.success(
      "Phase skipped - You can come back anytime to find team members",
    );
    setTimeout(() => onBack(), 500);
  };
  const handleViewTalent = (talent) => {
    setSelectedTalent(talent);
    setIsTalentModalOpen(true);
  };
  const handleAcceptTalent = (application) => {
    setSelectedTalentForCompensation(application);
    setShowCompensationWizard(true);
  };
  const handleCompensationComplete = async (compensationConfig) => {
    console.log(
      "📥 handleCompensationComplete called with config:",
      compensationConfig,
    );
    if (!selectedTalentForCompensation) {
      console.error("❌ No selected talent!");
      return;
    }
    console.log("👤 Selected talent:", selectedTalentForCompensation);
    console.log(
      "🏢 Creating contract for startup:",
      user.startupId || user.companyId || "demo-startup-id",
    );
    try {
      // Create the compensation contract
      console.log("🚀 Calling createCompensationContract API...");
      const result = await createCompensationContract(
        user.id,
        selectedTalentForCompensation.talentId,
        user.startupId || user.companyId || "demo-startup-id",
        compensationConfig,
      );
      console.log("📊 API Result:", result);
      if (result.success) {
        toast.success(
          `✅ Compensation contract created for ${selectedTalentForCompensation.talentName}!`,
        );

        // Mark application as accepted (remove from pending)
        setAcceptedApplicationIds([
          ...acceptedApplicationIds,
          selectedTalentForCompensation.id,
        ]);

        // Add to local contracts list
        setContracts([
          ...contracts,
          {
            ...result.contract,
            talentName: selectedTalentForCompensation.talentName,
            talentRole: selectedTalentForCompensation.role,
            applicationId: selectedTalentForCompensation.id,
          },
        ]);
        console.log("✅ Contract added to local state");

        // Close wizard
        setShowCompensationWizard(false);
        setSelectedTalentForCompensation(null);
        console.log("✅ Wizard closed");
      } else {
        console.error("❌ API returned success: false");
        toast.error("Failed to create compensation contract");
      }
    } catch (error) {
      console.error("❌ Error creating compensation contract:", error);
      toast.error(
        `Failed to create compensation contract: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };
  return (
    <>
      <div className="h-full overflow-auto bg-gradient-to-br from-background via-background to-primary/5">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
          <div className="space-y-4">
            <Button
              variant="ghost"
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Journey
            </Button>
            <div>
              <h1 className="mb-2 flex items-center gap-2">
                <Users className="w-8 h-8 text-foreground" />
                Stage 3: Team Building
              </h1>
              <p className="text-muted-foreground">
                Assemble your founding team and early hires
              </p>
            </div>
            <Card className="border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20">
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <FastForward className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    <div>
                      <p className="font-semibold text-sm">
                        Already Have Your Team?
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Skip this phase if you've already assembled your team or
                        prefer to build it independently
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSkipPhase}
                    className="flex-shrink-0"
                  >
                    <FastForward className="w-4 h-4 mr-1" />
                    Skip Phase
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">
                        Compensation Management
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Manage compensation contracts & team agreements
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowCompensationManager(true)}
                    size="sm"
                    variant="default"
                  >
                    <DollarSign className="w-4 h-4 mr-1" />
                    Open Manager
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          {teamRecommendations.length > 0 && (
            <Card className="border-2 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  {"Your Ideal Team for "}
                  {user.profile?.stage || "MVP Development"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Based on your industry and stage, here are the roles you
                  should hire first
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {teamRecommendations.slice(0, 6).map((rec, index) => (
                    <div
                      key={index}
                      className="p-4 border-2 rounded-lg bg-background hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-semibold mb-1">{rec.role}</p>
                        </div>
                        <span className="text-2xl text-muted-foreground/30">
                          #{index + 1}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {rec.reasoning}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {rec.skills.slice(0, 3).map((skill, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Specify Your Team Needs</CardTitle>
              <p className="text-sm text-muted-foreground">
                Provide details about the team members you're looking to hire
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="rolesNeeded">
                  Additional Roles or Specific Requirements
                </Label>
                <Textarea
                  id="rolesNeeded"
                  placeholder="e.g., Need a CTO with blockchain experience, or a designer who specializes in healthcare UX"
                  value={teamNeeds.rolesNeeded}
                  onChange={(e) =>
                    setTeamNeeds({
                      ...teamNeeds,
                      rolesNeeded: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="skillsRequired">
                  Key Skills & Experience Required
                </Label>
                <Textarea
                  id="skillsRequired"
                  placeholder="e.g., React/Node.js expertise, 5+ years product design, B2B SaaS experience"
                  value={teamNeeds.skillsRequired}
                  onChange={(e) =>
                    setTeamNeeds({
                      ...teamNeeds,
                      skillsRequired: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeline">Hiring Timeline</Label>
                <Textarea
                  id="timeline"
                  placeholder="e.g., Looking to hire 2 developers in the next 60 days, designer by Q2"
                  value={teamNeeds.timeline}
                  onChange={(e) =>
                    setTeamNeeds({
                      ...teamNeeds,
                      timeline: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-2 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="w-5 h-5" />
                  Pending Applications
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Review and set compensation for talent
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingApplications.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-medium mb-1">
                      All Applications Processed! 🎉
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Check "Active Contracts" to see your team.
                    </p>
                  </div>
                ) : (
                  pendingApplications.map((application) => (
                    <div
                      key={application.id}
                      className="p-3 border rounded-lg hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10 flex-shrink-0">
                          <AvatarFallback>
                            {application.talentName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div>
                              <h3 className="font-semibold text-sm">
                                {application.talentName}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {application.role}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className="text-xs flex-shrink-0"
                            >
                              {application.matchScore}% Match
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {application.skills
                              .slice(0, 3)
                              .map((skill, idx) => (
                                <Badge
                                  key={idx}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {skill}
                                </Badge>
                              ))}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <span>
                              {application.experience}
                              {" experience"}
                            </span>
                            <span>•</span>
                            <span>
                              {"Applied "}
                              {new Date(
                                application.appliedDate,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleAcceptTalent(application)}
                            className="w-full text-xs"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Accept & Set Compensation
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
            <Card className="border-2 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Briefcase className="w-5 h-5" />
                  Active Contracts ({contracts.length})
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Your team with active compensation
                </p>
              </CardHeader>
              <CardContent>
                {contracts.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-medium mb-1">
                      No Active Contracts
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Accept talent to create compensation contracts
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {contracts.map((contract, idx) => (
                      <div
                        key={idx}
                        className="p-3 border rounded-lg bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarFallback className="text-xs">
                              {contract.talentName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm">
                              {contract.talentName}
                            </h3>
                            <p className="text-xs text-muted-foreground mb-2">
                              {contract.talentRole}
                            </p>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">
                                  Type:
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {contract.compensationType === "equity" &&
                                    "💎 Equity Only"}
                                  {contract.compensationType === "fixed" &&
                                    "💰 Fixed Payment"}
                                  {contract.compensationType === "hourly" &&
                                    "⏰ Hourly Rate"}
                                  {contract.compensationType ===
                                    "equity-fixed" && "💎💰 Hybrid"}
                                  {contract.compensationType === "unpaid" &&
                                    "🤝 Unpaid"}
                                </Badge>
                              </div>
                              {contract.config.equity && (
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">
                                    Equity:
                                  </span>
                                  <span className="font-medium">
                                    {contract.config.equity.totalEquity}%
                                  </span>
                                </div>
                              )}
                              {contract.config.fixed && (
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">
                                    Payment:
                                  </span>
                                  <span className="font-medium">
                                    ${contract.config.fixed.amount}/
                                    {contract.config.fixed.paymentType ===
                                    "monthly"
                                      ? "mo"
                                      : "once"}
                                  </span>
                                </div>
                              )}
                              {contract.config.hourly && (
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">
                                    Rate:
                                  </span>
                                  <span className="font-medium">
                                    ${contract.config.hourly.rate}/hr
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">
                                  Status:
                                </span>
                                <Badge variant="default" className="text-xs">
                                  Active
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          {talentMatches.length > 0 && (
            <Card className="border-2 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Top Matched Talent ({talentMatches.length})
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Highly-matched candidates ready to join your team
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {talentMatches.map((match) => (
                    <div
                      key={match.id}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-background"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <Avatar className="w-12 h-12 flex-shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {match.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium mb-0.5">{match.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {match.role}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <span
                                  key={i}
                                  className={`text-xs ${i < Math.floor(match.match / 20) ? "text-yellow-500" : "text-gray-300"}`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                            <span className="text-xs font-semibold text-primary">
                              {match.match}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {match.skills.slice(0, 3).map((skill, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleViewTalent(match)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1"
                          disabled={!match.available}
                          onClick={() => handleViewTalent(match)}
                        >
                          <UserPlus className="w-3 h-3 mr-1" />
                          {match.available ? "Invite" : "Unavailable"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent className="pt-6">
              <Button
                onClick={saveAndContinue}
                className="w-full gap-2"
                size="lg"
              >
                Save & Continue to Next Stage
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      {selectedTalent && (
        <TalentProfileModal
          isOpen={isTalentModalOpen}
          onClose={() => setIsTalentModalOpen(false)}
          talent={selectedTalent}
        />
      )}
      {showCompensationWizard && selectedTalentForCompensation && (
        <CompensationSetupWizard
          isOpen={showCompensationWizard}
          onClose={() => {
            setShowCompensationWizard(false);
            setSelectedTalentForCompensation(null);
          }}
          teamMemberName={selectedTalentForCompensation.talentName}
          teamMemberId={selectedTalentForCompensation.talentId}
          founderId={user.id}
          startupId={user.startupId || user.companyId || "demo-startup-id"}
          onComplete={handleCompensationComplete}
        />
      )}
      {showCompensationManager && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl h-[90vh] bg-background rounded-lg shadow-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-primary" />
                Compensation Management System
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCompensationManager(false)}
              >
                ✕
              </Button>
            </div>
            <div className="flex-1 overflow-auto">
              <CompensationDemoPage user={user} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
