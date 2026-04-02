import React, { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { ChevronDown, ChevronUp, CheckCircle, Circle } from "lucide-react";
export default function ProfileCompletionBanner({ role, onStepClick }) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Define steps based on role
  const founderSteps = [
    {
      id: "startup-info",
      label: "Startup Information",
      completed: false,
      description: "Add your startup name, description, and industry",
    },
    {
      id: "startup-progress",
      label: "Startup Progress",
      completed: false,
      description: "Share your startup's current metrics and progress",
    },
    {
      id: "team-needs",
      label: "Team Needs",
      completed: false,
      description: "Specify roles you're looking to fill",
    },
    {
      id: "profile-photo",
      label: "Profile Photo",
      completed: false,
      description: "Upload your profile picture",
    },
    {
      id: "bio",
      label: "Bio & Experience",
      completed: false,
      description: "Tell others about your background",
    },
  ];
  const talentSteps = [
    {
      id: "skills",
      label: "Skills & Expertise",
      completed: false,
      description: "Add your technical and professional skills",
    },
    {
      id: "experience",
      label: "Work Experience",
      completed: false,
      description: "Add your work history and achievements",
    },
    {
      id: "interests",
      label: "Startup Interests",
      completed: false,
      description: "Industries and roles you're interested in",
    },
    {
      id: "profile-photo",
      label: "Profile Photo",
      completed: false,
      description: "Upload your profile picture",
    },
    {
      id: "bio",
      label: "Bio & Portfolio",
      completed: false,
      description: "Share your story and portfolio links",
    },
  ];
  const steps = role === "founder" ? founderSteps : talentSteps;
  const completedCount = steps.filter((s) => s.completed).length;
  const totalCount = steps.length;
  const progress = (completedCount / totalCount) * 100;
  return (
    <Card className="border-2 bg-muted/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <h3 className="font-medium">Complete Your Profile</h3>
            </div>
            <span className="text-sm text-muted-foreground">
              {completedCount}
              {" of "}
              {totalCount}
              {" steps complete"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
        <Progress value={progress} className="h-2 mb-3" />
        {isExpanded && (
          <div className="space-y-2 mt-4">
            <p className="text-sm text-muted-foreground mb-3">
              {role === "founder"
                ? "Help talented people find your startup by completing your profile"
                : "Stand out to founders by showcasing your skills and experience"}
            </p>
            <div className="grid gap-2">
              {steps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => onStepClick(step.id)}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left w-full group"
                >
                  {step.completed ? (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5 group-hover:text-foreground" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{step.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {step.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
