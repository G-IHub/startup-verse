import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  X,
  CheckCircle2,
  Circle,
  Lightbulb,
  Users,
  HelpCircle,
  User,
  ArrowRight,
  Sparkles,
} from "lucide-react";
export default function GettingStartedWidget({ onDismiss, onNavigate }) {
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem("getting_started_dismissed") === "true";
  });
  const handleDismiss = () => {
    localStorage.setItem("getting_started_dismissed", "true");
    setIsDismissed(true);
    onDismiss?.();
  };
  const handleStartIdeation = () => {
    // Mark ideation as started
    const journeyProgress = JSON.parse(
      localStorage.getItem("founder_journey_progress") || "{}",
    );
    journeyProgress.ideation = {
      status: "in-progress",
      startedAt: new Date().toISOString(),
    };
    localStorage.setItem(
      "founder_journey_progress",
      JSON.stringify(journeyProgress),
    );

    // Navigate to Startup Journey
    if (onNavigate) {
      onNavigate("journey");
    }
  };
  const handleAddMembers = () => {
    // Navigate to Virtual Office where team features are accessible
    onNavigate?.("startup-office");
  };

  // Check completion status
  const journeyProgress = JSON.parse(
    localStorage.getItem("founder_journey_progress") || "{}",
  );
  const isProfileComplete =
    journeyProgress.profileSetup?.status === "completed";
  const hasStartedIdeation =
    journeyProgress.ideation?.status === "in-progress" ||
    journeyProgress.ideation?.status === "completed";

  // Member task is complete if user has sent an invitation OR visited the find talent feature
  const hasInvitations =
    JSON.parse(localStorage.getItem("startupverse_invitations") || "[]")
      .length > 0;
  const hasVisitedFindTalent =
    localStorage.getItem("has_visited_find_talent") === "true";
  const hasAddedMembers = hasInvitations || hasVisitedFindTalent;
  const steps = [
    {
      icon: User,
      title: "Complete Profile Setup (Stage 0)",
      description: "Set up your founder & startup profile",
      action: null,
      completed: isProfileComplete,
      onClick: null,
    },
    {
      icon: Lightbulb,
      title: "Start Stage 1: Ideation & Validation",
      description: "Validate your startup idea with market research",
      action: "Start Stage 1",
      completed: hasStartedIdeation,
      onClick: handleStartIdeation,
    },
    {
      icon: Users,
      title: "Add or Find Team Members",
      description: "Build your team using Smart Team Matching",
      action: "Find Members",
      completed: hasAddedMembers,
      onClick: handleAddMembers,
    },
  ];

  // Check if all steps are completed
  const allStepsCompleted = steps.every((step) => step.completed);

  // Auto-dismiss if all steps are completed
  if (allStepsCompleted && !isDismissed) {
    handleDismiss();
  }
  if (isDismissed) return null;
  return (
    <Card className="border-primary/30 relative overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Getting Started with StartupVerse
            </CardTitle>
            <p className="text-body-medium text-muted-foreground mt-1">
              Follow these steps to begin your startup journey
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="relative p-4 rounded-lg border bg-card transition-colors"
              >
                <div className="absolute top-3 right-3">
                  {step.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <Icon className="w-5 h-5 text-primary mb-3" />
                <div className="mb-3">
                  <h4 className="text-sm mb-2 pr-6">{step.title}</h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    {step.description}
                  </p>
                </div>
                {step.action && !step.completed && step.onClick && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={step.onClick}
                    className="w-full text-xs"
                  >
                    {step.action}
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
                {step.completed && (
                  <div className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Completed
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <HelpCircle className="w-4 h-4" />
              <span>Complete all steps to unlock Quick Actions</span>
            </div>
            {allStepsCompleted && (
              <Badge
                variant="outline"
                className="text-green-600 border-green-600"
              >
                All Done!
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
