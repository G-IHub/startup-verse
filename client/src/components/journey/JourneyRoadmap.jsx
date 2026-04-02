import React, { useState } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Lightbulb,
  FileText,
  Users,
  Rocket,
  TrendingUp,
  Target,
  CheckCircle2,
  Lock,
  ArrowRight,
} from "lucide-react";
export default function JourneyRoadmap({ onNavigateToStage }) {
  const [hoveredStage, setHoveredStage] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Load journey progress from localStorage
  const savedProgress = JSON.parse(
    localStorage.getItem("founder_journey_progress") || "{}",
  );
  const stages = [
    {
      id: "ideation",
      number: 1,
      title: "Ideation & Validation",
      shortTitle: "Ideation",
      description: "Validate your idea with real customer feedback",
      icon: Lightbulb,
      color: "from-yellow-500 to-orange-500",
      estimatedWeeks: "1-4 weeks",
      status: savedProgress.ideation?.status || "in-progress",
      progress: savedProgress.ideation?.progress || 35,
      tasksCompleted: savedProgress.ideation?.tasksCompleted || 3,
      totalTasks: 8,
      achievements: savedProgress.ideation?.achievements || [
        "First Idea Created",
        "Market Research Started",
      ],
    },
    {
      id: "formation",
      number: 2,
      title: "Company Formation",
      shortTitle: "Formation",
      description: "Set up your legal entity and foundational documents",
      icon: FileText,
      color: "from-blue-500 to-cyan-500",
      estimatedWeeks: "1-2 weeks",
      status: savedProgress.formation?.status || "available",
      progress: savedProgress.formation?.progress || 0,
      tasksCompleted: 0,
      totalTasks: 6,
      achievements: [],
    },
    {
      id: "team-building",
      number: 3,
      title: "Team Building",
      shortTitle: "Team",
      description: "Assemble your founding team and early hires",
      icon: Users,
      color: "from-purple-500 to-pink-500",
      estimatedWeeks: "2-8 weeks",
      status: savedProgress["team-building"]?.status || "available",
      progress: savedProgress["team-building"]?.progress || 0,
      tasksCompleted: 0,
      totalTasks: 7,
      achievements: [],
    },
    {
      id: "product-dev",
      number: 4,
      title: "Product Development",
      shortTitle: "Product",
      description: "Build and iterate your MVP",
      icon: Rocket,
      color: "from-green-500 to-emerald-500",
      estimatedWeeks: "4-12 weeks",
      status: savedProgress["product-dev"]?.status || "available",
      progress: savedProgress["product-dev"]?.progress || 0,
      tasksCompleted: 0,
      totalTasks: 9,
      achievements: [],
    },
    {
      id: "go-to-market",
      number: 5,
      title: "Go-to-Market",
      shortTitle: "Launch",
      description: "Launch and acquire your first customers",
      icon: TrendingUp,
      color: "from-red-500 to-rose-500",
      estimatedWeeks: "2-6 weeks",
      status: savedProgress["go-to-market"]?.status || "available",
      progress: savedProgress["go-to-market"]?.progress || 0,
      tasksCompleted: 0,
      totalTasks: 8,
      achievements: [],
    },
    {
      id: "operations",
      number: 6,
      title: "Operations & Growth",
      shortTitle: "Growth",
      description: "Scale operations and optimize for growth",
      icon: Target,
      color: "from-indigo-500 to-violet-500",
      estimatedWeeks: "Ongoing",
      status: savedProgress.operations?.status || "available",
      progress: savedProgress.operations?.progress || 0,
      tasksCompleted: 0,
      totalTasks: 10,
      achievements: [],
    },
  ];

  // Calculate overall journey progress
  const overallProgress = Math.round(
    stages.reduce((sum, stage) => sum + stage.progress, 0) / stages.length,
  );
  const currentStage =
    stages.find((s) => s.status === "in-progress") || stages[0];
  const completedStages = stages.filter((s) => s.status === "completed").length;
  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl">Your Startup Journey</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A proven 6-stage framework to guide you from idea to launch
          </p>
        </div>
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stages.map((stage, index) => {
              const isCurrentStage = stage.status === "in-progress";
              const isCompleted = stage.status === "completed";
              const isLocked = stage.status === "locked";
              const StageIcon = stage.icon;
              return (
                <div
                  key={stage.id}
                  onClick={() => !isLocked && onNavigateToStage(stage.id)}
                  className={`p-4 border rounded-lg hover:shadow-md transition-shadow bg-background ${isLocked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isCurrentStage ? "bg-primary text-white" : isCompleted ? "bg-green-500 text-white" : isLocked ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}
                    >
                      {isLocked ? (
                        <Lock className="w-6 h-6" />
                      ) : isCompleted ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <StageIcon className="w-6 h-6" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        {"Stage "}
                        {stage.number}
                      </p>
                      <p className="font-medium mb-1 leading-tight">
                        {stage.title}
                      </p>
                      {isCurrentStage && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-blue-100 text-blue-700 border-blue-300"
                        >
                          Current Stage
                        </Badge>
                      )}
                      {isCompleted && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-green-100 text-green-700 border-green-300"
                        >
                          Completed
                        </Badge>
                      )}
                      {isLocked && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-gray-100 text-gray-700 border-gray-300"
                        >
                          Locked
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {stage.description}
                  </p>
                  <Button
                    className="w-full"
                    variant={isCurrentStage ? "default" : "outline"}
                    size="sm"
                    disabled={isLocked}
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateToStage(stage.id);
                    }}
                  >
                    {isCompleted && "Review"}
                    {isCurrentStage && "Continue"}
                    {!isCompleted && !isCurrentStage && !isLocked && "Start"}
                    {isLocked && "Locked"}
                    {!isLocked && <ArrowRight className="w-4 h-4 ml-1" />}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
