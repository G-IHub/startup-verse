import React, { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  CheckCircle2,
  Circle,
  Clock,
  Award,
  Wrench,
  Target,
  ArrowRight,
  CheckSquare,
  Trophy,
  Timer,
  Users,
  UserPlus,
  Mail,
  X,
  Sparkles,
  Search,
} from "lucide-react";
import {
  completeMilestone,
  completeCurrentStage,
} from "../utils/journeyProgress";
export function JourneyStageModal({
  isOpen,
  onClose,
  stage,
  journeyProgress,
  onProgressUpdate,
}) {
  const [localProgress, setLocalProgress] = useState(journeyProgress);

  // Stage 3 (Team Building) specific state
  const [hasTeam, setHasTeam] = useState(null);
  const [teamInvites, setTeamInvites] = useState([
    {
      name: "",
      email: "",
      role: "",
    },
  ]);
  const stageData = localProgress.stageData[stage.id];
  const isCompleted = localProgress.completedStages.includes(stage.id);
  const isCurrent = localProgress.currentStage === stage.id;
  const StageIcon = stage.icon;
  const handleToggleMilestone = (milestone) => {
    if (isCompleted) return; // Can't modify completed stages

    const isCurrentlyCompleted =
      stageData?.milestonesCompleted?.includes(milestone);
    if (isCurrentlyCompleted) {
      // Remove milestone
      const updatedMilestones = stageData.milestonesCompleted.filter(
        (m) => m !== milestone,
      );
      const updatedProgress = {
        ...localProgress,
        stageData: {
          ...localProgress.stageData,
          [stage.id]: {
            ...stageData,
            milestonesCompleted: updatedMilestones,
            completionPercentage: Math.round(
              (updatedMilestones.length / stage.keyMilestones.length) * 100,
            ),
          },
        },
      };
      setLocalProgress(updatedProgress);
      localStorage.setItem("journey_progress", JSON.stringify(updatedProgress));
      onProgressUpdate(updatedProgress);
    } else {
      // Add milestone
      const updatedProgress = completeMilestone(stage.id, milestone);
      setLocalProgress(updatedProgress);
      onProgressUpdate(updatedProgress);
    }
  };
  const handleToggleCompletionCriteria = (criteria, index) => {
    if (isCompleted) return;
    const criteriaKey = `criteria_${index}`;
    const completedCriteria =
      stageData?.milestonesCompleted?.filter((m) =>
        m.startsWith("criteria_"),
      ) || [];
    const isCurrentlyCompleted =
      stageData?.milestonesCompleted?.includes(criteriaKey);
    if (isCurrentlyCompleted) {
      // Remove criteria
      const updatedMilestones = stageData.milestonesCompleted.filter(
        (m) => m !== criteriaKey,
      );
      const totalItems =
        stage.keyMilestones.length + stage.completionCriteria.length;
      const updatedProgress = {
        ...localProgress,
        stageData: {
          ...localProgress.stageData,
          [stage.id]: {
            ...stageData,
            milestonesCompleted: updatedMilestones,
            completionPercentage: Math.round(
              (updatedMilestones.length / totalItems) * 100,
            ),
          },
        },
      };
      setLocalProgress(updatedProgress);
      localStorage.setItem("journey_progress", JSON.stringify(updatedProgress));
      onProgressUpdate(updatedProgress);
    } else {
      // Add criteria
      const updatedMilestones = [
        ...(stageData?.milestonesCompleted || []),
        criteriaKey,
      ];
      const totalItems =
        stage.keyMilestones.length + stage.completionCriteria.length;
      const updatedProgress = {
        ...localProgress,
        stageData: {
          ...localProgress.stageData,
          [stage.id]: {
            ...stageData,
            milestonesCompleted: updatedMilestones,
            completionPercentage: Math.round(
              (updatedMilestones.length / totalItems) * 100,
            ),
          },
        },
      };
      setLocalProgress(updatedProgress);
      localStorage.setItem("journey_progress", JSON.stringify(updatedProgress));
      onProgressUpdate(updatedProgress);
    }
  };
  const handleCompleteStage = () => {
    const updatedProgress = completeCurrentStage();
    setLocalProgress(updatedProgress);
    onProgressUpdate(updatedProgress);
    onClose();
  };
  const handleSkipToStage = () => {
    // Allow skipping to this stage if it's the next one
    if (stage.id === localProgress.currentStage + 1) {
      const updatedProgress = completeCurrentStage();
      setLocalProgress(updatedProgress);
      onProgressUpdate(updatedProgress);
    }
  };

  // Stage 3 specific handlers
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
    setTeamInvites(teamInvites.filter((_, i) => i !== index));
  };
  const handleTeamMemberChange = (index, field, value) => {
    const updated = [...teamInvites];
    updated[index][field] = value;
    setTeamInvites(updated);
  };
  const handleSendInvites = () => {
    // Validate invites
    const validInvites = teamInvites.filter(
      (inv) => inv.name && inv.email && inv.role,
    );
    if (validInvites.length === 0) {
      toast.error(
        "Please fill in at least one complete team member invitation",
      );
      return;
    }

    // Save to localStorage
    const existingMembers = JSON.parse(
      localStorage.getItem("team_members") || "[]",
    );
    const newMembers = validInvites.map((inv, idx) => ({
      id: `invited_${Date.now()}_${idx}`,
      name: inv.name,
      email: inv.email,
      role: inv.role,
      status: "invited",
      invitedAt: new Date().toISOString(),
    }));
    localStorage.setItem(
      "team_members",
      JSON.stringify([...existingMembers, ...newMembers]),
    );

    // Update progress
    const criteriaKey = "criteria_1"; // "Recruit co-founders or early team members"
    const updatedMilestones = [
      ...(stageData?.milestonesCompleted || []),
      criteriaKey,
    ];
    const totalItems =
      stage.keyMilestones.length + stage.completionCriteria.length;
    const updatedProgress = {
      ...localProgress,
      stageData: {
        ...localProgress.stageData,
        [stage.id]: {
          ...stageData,
          milestonesCompleted: updatedMilestones,
          completionPercentage: Math.round(
            (updatedMilestones.length / totalItems) * 100,
          ),
        },
      },
    };
    setLocalProgress(updatedProgress);
    localStorage.setItem("journey_progress", JSON.stringify(updatedProgress));
    onProgressUpdate(updatedProgress);
    toast.success(
      `Successfully sent ${validInvites.length} team invitation${validInvites.length > 1 ? "s" : ""}!`,
    );

    // Reset form
    setTeamInvites([
      {
        name: "",
        email: "",
        role: "",
      },
    ]);
    setHasTeam(null);
  };
  const canComplete = isCurrent && (stageData?.completionPercentage || 0) >= 60;
  const isUpcoming = stage.id === localProgress.currentStage + 1;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4 mb-2">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 ${isCurrent ? "bg-primary text-white" : isCompleted ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-8 h-8" />
              ) : (
                <StageIcon className="w-8 h-8" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {isCurrent && <Badge className="bg-primary">Current</Badge>}
                {isCompleted && (
                  <Badge className="bg-green-500">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Completed
                  </Badge>
                )}
                {isUpcoming && (
                  <Badge
                    variant="outline"
                    className="bg-blue-100 text-blue-700 border-blue-300"
                  >
                    Next Stage
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-2xl">{stage.title}</DialogTitle>
              <DialogDescription className="text-base mt-2">
                {stage.description}
              </DialogDescription>
            </div>
          </div>
          {!isCompleted && stageData && (
            <div className="space-y-2 pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Stage Progress</span>
                <span className="text-muted-foreground">
                  {stageData.completionPercentage}%
                </span>
              </div>
              <Progress
                value={stageData.completionPercentage}
                className="h-2"
              />
            </div>
          )}
        </DialogHeader>
        <div className="space-y-6 mt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Clock className="w-4 h-4" />
                <span>Estimated Duration</span>
              </div>
              <p className="font-semibold">{stage.estimatedDuration}</p>
            </div>
            {stageData?.startedAt && !isCompleted && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Timer className="w-4 h-4" />
                  <span>Time in Stage</span>
                </div>
                <p className="font-semibold">
                  {Math.ceil(
                    (Date.now() - new Date(stageData.startedAt).getTime()) /
                      (1000 * 60 * 60 * 24),
                  )}
                  {" days"}
                </p>
              </div>
            )}
          </div>
          {stage.id === 3 && isCurrent && !isCompleted && (
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3 mb-4">
                <Users className="w-6 h-6 text-primary flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-1">
                    Build Your Team
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Do you already have team members ready to join your startup?
                  </p>
                </div>
              </div>
              {hasTeam === null && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => setHasTeam("yes")}
                      variant="outline"
                      size="lg"
                      className="h-auto py-6 flex-col gap-2 bg-white dark:bg-gray-800 hover:bg-primary/5 hover:border-primary"
                    >
                      <UserPlus className="w-6 h-6 text-primary" />
                      <div className="text-center">
                        <p className="font-semibold">Yes, I have a team</p>
                        <p className="text-xs text-muted-foreground">
                          Invite them to join
                        </p>
                      </div>
                    </Button>
                    <Button
                      onClick={() => setHasTeam("no")}
                      variant="outline"
                      size="lg"
                      className="h-auto py-6 flex-col gap-2 bg-white dark:bg-gray-800 hover:bg-primary/5 hover:border-primary"
                    >
                      <Search className="w-6 h-6 text-primary" />
                      <div className="text-center">
                        <p className="font-semibold">No, I need help</p>
                        <p className="text-xs text-muted-foreground">
                          Find team members
                        </p>
                      </div>
                    </Button>
                  </div>
                </div>
              )}
              {hasTeam === "yes" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">
                      Invite your team members:
                    </p>
                    <Button
                      onClick={() => setHasTeam(null)}
                      variant="ghost"
                      size="sm"
                    >
                      ← Back
                    </Button>
                  </div>
                  {teamInvites.map((invite, index) => (
                    <div
                      key={index}
                      className="p-4 bg-white dark:bg-gray-800 rounded-lg border space-y-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">
                          {"Team Member "}
                          {index + 1}
                        </p>
                        {teamInvites.length > 1 && (
                          <Button
                            onClick={() => handleRemoveTeamMember(index)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Full Name</Label>
                          <Input
                            placeholder="John Doe"
                            value={invite.name}
                            onChange={(e) =>
                              handleTeamMemberChange(
                                index,
                                "name",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Email Address</Label>
                          <Input
                            type="email"
                            placeholder="john@example.com"
                            value={invite.email}
                            onChange={(e) =>
                              handleTeamMemberChange(
                                index,
                                "email",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Role/Position</Label>
                          <Input
                            placeholder="CTO"
                            value={invite.role}
                            onChange={(e) =>
                              handleTeamMemberChange(
                                index,
                                "role",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddTeamMember}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Another Member
                    </Button>
                    <Button
                      onClick={handleSendInvites}
                      size="sm"
                      className="flex-1 bg-primary"
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
                    <p className="text-sm font-medium">
                      Find your perfect team members:
                    </p>
                    <Button
                      onClick={() => setHasTeam(null)}
                      variant="ghost"
                      size="sm"
                    >
                      ← Back
                    </Button>
                  </div>
                  <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-primary/30 text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">
                        Smart Team Matching
                      </h4>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Our AI-powered matching system will help you find
                        co-founders and team members based on your industry,
                        stage, and specific needs.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => {
                          onClose();
                          // Navigate to team matching - you can add navigation logic here
                          window.dispatchEvent(
                            new CustomEvent("navigate-to-team-matching"),
                          );
                        }}
                        className="bg-primary"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Go to Smart Team Matching
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        💡 You can also explore our talent pool in the Virtual
                        Office
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {!isCompleted && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-primary" />
                Completion Criteria
              </h3>
              <div className="space-y-2">
                {stage.completionCriteria.map((criteria, index) => {
                  const criteriaKey = `criteria_${index}`;
                  const isChecked =
                    stageData?.milestonesCompleted?.includes(criteriaKey);
                  return (
                    <button
                      key={index}
                      onClick={() =>
                        handleToggleCompletionCriteria(criteria, index)
                      }
                      disabled={!isCurrent}
                      className={`w-full flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all ${isChecked ? "border-green-200 bg-green-50 dark:bg-green-950/20" : "border-muted bg-background hover:border-primary/50"} ${!isCurrent ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {isChecked ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <span
                        className={`text-sm ${isChecked ? "text-green-900 dark:text-green-100" : "text-foreground"}`}
                      >
                        {criteria}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Key Milestones
            </h3>
            <div className="space-y-2">
              {stage.keyMilestones.map((milestone, index) => {
                const isChecked =
                  stageData?.milestonesCompleted?.includes(milestone);
                return (
                  <button
                    key={index}
                    onClick={() => handleToggleMilestone(milestone)}
                    disabled={!isCurrent || isCompleted}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all ${isChecked ? "border-primary bg-primary/5" : "border-muted bg-background hover:border-primary/50"} ${!isCurrent || isCompleted ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {isChecked ? (
                        <Trophy className="w-5 h-5 text-primary" />
                      ) : (
                        <Award className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium ${isChecked ? "text-primary" : "text-foreground"}`}
                    >
                      {milestone}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-primary" />
              Available Tools & Resources
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {stage.tools.map((tool, index) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <p className="text-sm font-medium">{tool}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              💡 These tools will be available in the Startup Journey section of
              your Virtual Office
            </p>
          </div>
          <div className="flex gap-3 pt-4 border-t">
            {isCurrent && canComplete && (
              <Button
                onClick={handleCompleteStage}
                className="flex-1 bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Complete Stage & Move to Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            {isCurrent && !canComplete && (
              <div className="flex-1 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  Complete at least 60% of the criteria and milestones to finish
                  this stage.
                </p>
              </div>
            )}
            {isUpcoming && (
              <Button
                onClick={handleSkipToStage}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                Skip to This Stage
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            {isCompleted && (
              <div className="flex-1 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    Stage completed! Great progress on your startup journey. 🎉
                  </p>
                </div>
              </div>
            )}
            <Button onClick={onClose} variant="outline" size="lg">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
