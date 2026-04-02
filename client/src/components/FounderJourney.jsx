import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import {
  Lightbulb,
  FileText,
  Users,
  Rocket,
  TrendingUp,
  Briefcase,
  CheckCircle2,
  Circle,
  Lock,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Award,
  UserPlus,
  Mail,
  X,
  Search,
} from "lucide-react";
export default function FounderJourney({ user, onNavigate }) {
  const [selectedStage, setSelectedStage] = useState(null);

  // Team Building specific state
  const [expandedStage, setExpandedStage] = useState(null);
  const [hasTeam, setHasTeam] = useState(null);
  const [teamInvites, setTeamInvites] = useState([
    {
      name: "",
      email: "",
      role: "",
    },
  ]);

  // Load progress from localStorage
  const savedProgress = JSON.parse(
    localStorage.getItem("founder_journey_progress") || "{}",
  );
  const stages = [
    {
      id: "ideation",
      number: 1,
      title: "Ideation & Validation",
      description: "Validate your idea before building",
      icon: Lightbulb,
      estimatedWeeks: "1-4 weeks",
      status: savedProgress.ideation?.status || "in-progress",
      progress: savedProgress.ideation?.progress || 35,
      badge: "Idea Validated",
      features: [
        "Idea Canvas - Problem, solution, market analysis",
        "Market Research Hub - Target audience & size",
        "Competitor Analysis - Track & compare",
        "Customer Discovery - Interview tracker",
        "Validation Checklist - 15 critical points",
      ],
      completionCriteria: [
        "Idea canvas 100% complete",
        "20+ customer interviews",
        "5+ competitors analyzed",
        "Clear problem-solution fit",
      ],
    },
    {
      id: "formation",
      number: 2,
      title: "Company Formation",
      description: "Establish legal entity and documents",
      icon: FileText,
      estimatedWeeks: "1-2 weeks",
      status: savedProgress.formation?.status || "available",
      progress: savedProgress.formation?.progress || 0,
      badge: "Company Formed",
      features: [
        "Entity Setup Wizard - LLC/C-Corp guidance",
        "Founder Agreement Generator - Equity & roles",
        "Cap Table Management - Equity tracking",
        "Document Vault - Store all legal docs",
        "IP Protection - Trademark tracking",
      ],
      completionCriteria: [
        "Legal entity formed",
        "Founder agreements signed",
        "Cap table initialized",
        "Business bank account opened",
      ],
    },
    {
      id: "team-building",
      number: 3,
      title: "Team Building",
      description: "Assemble your founding team",
      icon: Users,
      estimatedWeeks: "4-8 weeks",
      status: savedProgress.teamBuilding?.status || "available",
      progress: savedProgress.teamBuilding?.progress || 0,
      badge: "Team Built",
      features: [
        "Smart Team Matching - Find cofounders",
        "Equity Offer Builder - Send compensation offers",
        "Team Charter - Mission, values & culture",
        "Role Definitions - Team structure mapping",
        "Invitation System - Onboard team members",
      ],
      completionCriteria: [
        "At least 2 team members",
        "Team charter created",
        "Roles defined",
        "Equity structure planned",
      ],
    },
    {
      id: "product-dev",
      number: 4,
      title: "Product Development",
      description: "Build and launch your MVP",
      icon: Rocket,
      estimatedWeeks: "8-16 weeks",
      status: savedProgress.productDev?.status || "available",
      progress: savedProgress.productDev?.progress || 0,
      badge: "MVP Launched",
      features: [
        "Product Roadmap - Visual timeline",
        "Sprint Planning - 2-week cycles",
        "Enhanced Task Management",
        "Feature Prioritization - MoSCoW",
        "GitHub Integration - Track commits",
        "Launch Checklist - 50-point verification",
      ],
      completionCriteria: [
        "MVP features defined",
        "Development sprints completed",
        "MVP launched to users",
      ],
    },
    {
      id: "go-to-market",
      number: 5,
      title: "Go-to-Market",
      description: "Acquire your first 100 customers",
      icon: TrendingUp,
      estimatedWeeks: "8-12 weeks",
      status: savedProgress.goToMarket?.status || "locked",
      progress: savedProgress.goToMarket?.progress || 0,
      badge: "First Revenue",
      features: [
        "Customer CRM - Lead management",
        "Sales Pipeline - Track conversions",
        "Marketing Hub - Campaigns & content",
        "Landing Page Builder",
        "Email Campaigns - Automation",
        "Analytics Dashboard - Metrics tracking",
      ],
      completionCriteria: [
        "10+ paying customers",
        "Product-market fit signals",
        "CAC < LTV established",
      ],
    },
    {
      id: "operations",
      number: 6,
      title: "Operations & Growth",
      description: "Scale operations systematically",
      icon: Briefcase,
      estimatedWeeks: "12-24 weeks",
      status: savedProgress.operations?.status || "locked",
      progress: savedProgress.operations?.progress || 0,
      badge: "Product-Market Fit",
      features: [
        "Financial Dashboard - Real-time metrics",
        "Budget Planning - Forecasting",
        "Invoice & Expense Management",
        "OKR Tracking - Quarterly goals",
        "Knowledge Base - Internal wiki",
      ],
      completionCriteria: [
        "Positive unit economics",
        "Processes documented",
        "Team > 5 people",
        "MRR established",
      ],
    },
  ];
  const completedStages = stages.filter((s) => s.status === "completed").length;
  const inProgressStages = stages.filter(
    (s) => s.status === "in-progress",
  ).length;
  const overallProgress = (completedStages / stages.length) * 100;
  const getStatusBadge = (status) => {
    const badgeStyles = {
      completed: "bg-green-100 text-green-700 border-green-300",
      "in-progress": "bg-blue-100 text-blue-700 border-blue-300",
      available: "bg-orange-100 text-orange-700 border-orange-300",
      locked: "bg-gray-100 text-gray-700 border-gray-300",
    };
    const labels = {
      completed: "Completed",
      "in-progress": "In Progress",
      available: "Available",
      locked: "Locked",
    };
    const style = badgeStyles[status] || badgeStyles.available;
    const label = labels[status] || "Available";
    return (
      <Badge variant="outline" className={`text-xs ${style}`}>
        {label}
      </Badge>
    );
  };
  const handleStartStage = (stage) => {
    if (stage.status === "locked") return;

    // Special handling for Stage 3: Team Building
    if (stage.id === "team-building") {
      if (expandedStage === "team-building") {
        setExpandedStage(null);
        setHasTeam(null);
      } else {
        setExpandedStage("team-building");
      }
      return;
    }
    onNavigate(stage.id);
  };

  // Team Building handlers
  const handleAddTeamMember = () => {
    setTeamInvites([
      ...teamInvites,
      {
        name: "",
        email: "",
        role: "",
      },
    ]);
  };
  const handleRemoveTeamMember = (index) => {
    const updated = teamInvites.filter((_, i) => i !== index);
    setTeamInvites(
      updated.length > 0
        ? updated
        : [
            {
              name: "",
              email: "",
              role: "",
            },
          ],
    );
  };
  const handleTeamInviteChange = (index, field, value) => {
    const updated = [...teamInvites];
    updated[index][field] = value;
    setTeamInvites(updated);
  };
  const handleSendInvites = () => {
    // Validate at least one complete invite
    const validInvites = teamInvites.filter(
      (invite) =>
        invite.name.trim() && invite.email.trim() && invite.role.trim(),
    );
    if (validInvites.length === 0) {
      toast.error(
        "Please fill out at least one complete team member invitation",
      );
      return;
    }

    // Save to localStorage
    const existingMembers = JSON.parse(
      localStorage.getItem("team_invitations") || "[]",
    );
    const newInvitations = validInvites.map((invite) => ({
      ...invite,
      id: Date.now() + Math.random(),
      invitedAt: new Date().toISOString(),
      status: "pending",
    }));
    localStorage.setItem(
      "team_invitations",
      JSON.stringify([...existingMembers, ...newInvitations]),
    );

    // Show success message
    toast.success(
      `🎉 ${validInvites.length} invitation${validInvites.length > 1 ? "s" : ""} sent successfully!`,
      {
        description:
          "Your team members will receive an email invitation to join your startup.",
      },
    );

    // Reset form
    setHasTeam(null);
    setTeamInvites([
      {
        name: "",
        email: "",
        role: "",
      },
    ]);
    setExpandedStage(null);
  };
  const handleSmartMatching = () => {
    toast.success("Redirecting to Smart Team Matching...", {
      description:
        "Find the perfect co-founders and team members for your startup!",
    });

    // Navigate to team matching
    setTimeout(() => {
      onNavigate("startup-office");
    }, 1000);
  };
  return (
    <div className="py-8 px-4 md:px-8 space-y-8 max-w-7xl mx-auto">
      <div className="space-y-3">
        <h1 className="flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-foreground" />
          Your Startup Journey
        </h1>
        <p className="text-muted-foreground">
          A simple 6-stage framework to build your startup
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stages.map((stage) => {
          const Icon = stage.icon;
          const isLocked = stage.status === "locked";
          const isCurrent = stage.status === "in-progress";
          const isCompleted = stage.status === "completed";
          return (
            <div
              key={stage.id}
              onClick={() => !isLocked && handleStartStage(stage)}
              className={`p-4 border rounded-lg hover:shadow-md transition-shadow bg-background ${isLocked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isCurrent ? "bg-primary text-white" : isCompleted ? "bg-green-500 text-white" : isLocked ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : isLocked ? (
                    <Lock className="w-6 h-6" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-0.5">
                    {"Stage "}
                    {stage.number}
                  </p>
                  <p className="font-medium leading-tight">{stage.title}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {stage.description}
              </p>
              <Button
                className="w-full"
                variant={isCurrent ? "default" : "outline"}
                size="sm"
                disabled={isLocked}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartStage(stage);
                }}
              >
                {isCompleted && "Review"}
                {isCurrent && "Continue"}
                {stage.status === "available" && "Start"}
                {isLocked && "Locked"}
                {!isLocked && <ArrowRight className="w-4 h-4 ml-1" />}
              </Button>
            </div>
          );
        })}
      </div>
      {expandedStage === "team-building" && (
        <Card className="border-2 border-primary/50 shadow-lg">
          <CardHeader className="bg-gradient-to-br from-primary/5 to-purple-50 dark:from-primary/10 dark:to-purple-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Stage 3</p>
                  <CardTitle>Build Your Team</CardTitle>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setExpandedStage(null);
                  setHasTeam(null);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <p className="text-muted-foreground">
              Do you already have team members ready to join your startup?
            </p>
            {hasTeam === null && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => setHasTeam("yes")}
                  className="h-auto p-6 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-foreground border-2 hover:border-primary transition-all justify-start"
                  variant="outline"
                >
                  <div className="flex items-start gap-4 w-full">
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                      <UserPlus className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-semibold mb-1">Yes, I have a team</p>
                      <p className="text-sm text-muted-foreground">
                        Invite co-founders and team members to join your startup
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </Button>
                <Button
                  onClick={() => setHasTeam("no")}
                  className="h-auto p-6 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-foreground border-2 hover:border-primary transition-all justify-start"
                  variant="outline"
                >
                  <div className="flex items-start gap-4 w-full">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                      <Search className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-semibold mb-1">
                        No, I need help finding one
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Use Smart Team Matching to find co-founders
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </Button>
              </div>
            )}
            {hasTeam === "yes" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Team Member Invitations</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setHasTeam(null)}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Invite your co-founders and early team members to join your
                  startup.
                </p>
                {teamInvites.map((invite, index) => (
                  <Card key={index} className="border-2">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">Team Member #{index + 1}</p>
                        {teamInvites.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveTeamMember(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor={`name-${index}`}>Full Name</Label>
                          <Input
                            id={`name-${index}`}
                            placeholder="John Doe"
                            value={invite.name}
                            onChange={(e) =>
                              handleTeamInviteChange(
                                index,
                                "name",
                                e.target.value,
                              )
                            }
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`email-${index}`}>Email</Label>
                          <Input
                            id={`email-${index}`}
                            type="email"
                            placeholder="john@example.com"
                            value={invite.email}
                            onChange={(e) =>
                              handleTeamInviteChange(
                                index,
                                "email",
                                e.target.value,
                              )
                            }
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`role-${index}`}>Role</Label>
                          <Input
                            id={`role-${index}`}
                            placeholder="Co-Founder, CTO, etc."
                            value={invite.role}
                            onChange={(e) =>
                              handleTeamInviteChange(
                                index,
                                "role",
                                e.target.value,
                              )
                            }
                            className="mt-1.5"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleAddTeamMember}
                    className="flex-1"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Another Member
                  </Button>
                  <Button
                    onClick={handleSendInvites}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send Invitations
                  </Button>
                </div>
              </div>
            )}
            {hasTeam === "no" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Find Your Perfect Team</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setHasTeam(null)}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                </div>
                <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-purple-100 dark:from-primary/20 dark:to-purple-950/40">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-8 h-8 text-primary flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-2">
                          Smart Team Matching
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Our AI-powered system will match you with the perfect
                          co-founders and team members based on:
                        </p>
                      </div>
                    </div>
                    <ul className="space-y-2.5 ml-11">
                      <li className="text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                        Your startup's industry and stage
                      </li>
                      <li className="text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                        Required skills and experience
                      </li>
                      <li className="text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                        Cultural fit and working style
                      </li>
                      <li className="text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                        Availability and commitment level
                      </li>
                    </ul>
                    <Button
                      onClick={handleSmartMatching}
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Start Smart Team Matching
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {selectedStage && (
        <Card className="border-2 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedStage.status === "in-progress" ? "bg-primary text-white" : selectedStage.status === "completed" ? "bg-green-500 text-white" : "bg-orange-100 text-orange-600"}`}
                >
                  <selectedStage.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {"Stage "}
                    {selectedStage.number}
                  </p>
                  <CardTitle>{selectedStage.title}</CardTitle>
                </div>
              </div>
              <Button
                onClick={() => handleStartStage(selectedStage)}
                disabled={selectedStage.status === "locked"}
              >
                {selectedStage.status === "in-progress" ? "Continue" : "Start"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-primary" />
                  Features & Tools
                </h4>
                <ul className="space-y-2">
                  {selectedStage.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-muted-foreground flex items-start gap-2"
                    >
                      <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Completion Criteria
                </h4>
                <ul className="space-y-2">
                  {selectedStage.completionCriteria.map((criteria, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-muted-foreground flex items-start gap-2"
                    >
                      <Circle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{criteria}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {selectedStage.badge && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted border border-border">
                <Award className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">
                  Earn badge:
                </span>
                <Badge variant="secondary">{selectedStage.badge}</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
