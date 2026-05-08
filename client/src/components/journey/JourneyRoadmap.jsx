import React, { useEffect } from "react";
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
import { useJourneyStore } from "../../state/useJourneyStore";
import { getStageStatus } from "../../utils/journeyProgress";

function roadmapStage(
  jp,
  stageNum,
  fallbackStatus,
  fallbackProgress,
  fallbackTasksCompleted,
  fallbackAchievements,
) {
  if (!jp) {
    return {
      status: fallbackStatus,
      progress: fallbackProgress,
      tasksCompleted: fallbackTasksCompleted,
      achievements: fallbackAchievements,
    };
  }
  const server = getStageStatus(stageNum);
  const status =
    server === "completed"
      ? "completed"
      : server === "current"
        ? "in-progress"
        : server === "upcoming"
          ? "available"
          : "locked";
  const sd = jp.stageData?.[stageNum];
  const progress =
    typeof sd?.completionPercentage === "number"
      ? sd.completionPercentage
      : status === "completed"
        ? 100
        : fallbackProgress;
  const tasksCompleted = Array.isArray(sd?.milestonesCompleted)
    ? sd.milestonesCompleted.length
    : fallbackTasksCompleted;
  return {
    status,
    progress,
    tasksCompleted,
    achievements: fallbackAchievements,
  };
}

export default function JourneyRoadmap({ user, onNavigateToStage }) {
  useEffect(() => {
    const uid = user?._id ?? user?.id;
    if (uid) void useJourneyStore.getState().hydrate(String(uid));
  }, [user?._id, user?.id]);

  const jp = useJourneyStore((s) => s.progress);

  const r1 = roadmapStage(jp, 1, "in-progress", 35, 3, [
    "First Idea Created",
    "Market Research Started",
  ]);
  const r2 = roadmapStage(jp, 2, "available", 0, 0, []);
  const r3 = roadmapStage(jp, 3, "available", 0, 0, []);
  const r4 = roadmapStage(jp, 4, "available", 0, 0, []);
  const r5 = roadmapStage(jp, 5, "available", 0, 0, []);
  const r6 = roadmapStage(jp, 6, "available", 0, 0, []);

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
      status: r1.status,
      progress: r1.progress,
      tasksCompleted: r1.tasksCompleted,
      totalTasks: 8,
      achievements: r1.achievements,
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
      status: r2.status,
      progress: r2.progress,
      tasksCompleted: r2.tasksCompleted,
      totalTasks: 6,
      achievements: r2.achievements,
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
      status: r3.status,
      progress: r3.progress,
      tasksCompleted: r3.tasksCompleted,
      totalTasks: 7,
      achievements: r3.achievements,
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
      status: r4.status,
      progress: r4.progress,
      tasksCompleted: r4.tasksCompleted,
      totalTasks: 9,
      achievements: r4.achievements,
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
      status: r5.status,
      progress: r5.progress,
      tasksCompleted: r5.tasksCompleted,
      totalTasks: 8,
      achievements: r5.achievements,
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
      status: r6.status,
      progress: r6.progress,
      tasksCompleted: r6.tasksCompleted,
      totalTasks: 10,
      achievements: r6.achievements,
    },
  ];

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
