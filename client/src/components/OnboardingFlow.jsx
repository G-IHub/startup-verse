import React, { useState } from "react";
import SimpleAuth from "./SimpleAuth";
import FounderOnboarding from "./onboarding/FounderOnboarding";
import { Card, CardContent } from "./ui/card";
import { Progress } from "./ui/progress";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  determineInitialStage,
  getStageName,
} from "../utils/algorithmicStageDetection";
import { setCurrentStage } from "../utils/journeyProgress";
export default function OnboardingFlow({ role, onComplete, onBack }) {
  const [currentStep, setCurrentStep] = useState("auth");
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [profileStep, setProfileStep] = useState(0);
  const [collectedData, setCollectedData] = useState({});

  // For non-founders, just do simple auth
  if (role !== "founder") {
    return <SimpleAuth role={role} onComplete={onComplete} />;
  }

  // Founder flow: Auth -> Profile Setup
  const handleAuthComplete = (user) => {
    setAuthenticatedUser(user);
    setCurrentStep("profile");
    toast.success("Account created! Now let's set up your founder profile.");
  };
  const handleProfileNext = (data) => {
    const updatedData = {
      ...collectedData,
      ...data,
    };
    setCollectedData(updatedData);
    if (profileStep < 6) {
      setProfileStep(profileStep + 1);
    } else {
      // Profile setup complete
      handleProfileComplete(updatedData);
    }
  };
  const handleProfilePrevious = () => {
    if (profileStep > 0) {
      setProfileStep(profileStep - 1);
    }
  };
  const handleProfileComplete = (data) => {
    if (!authenticatedUser) return;

    // 🎯 ALGORITHMIC STAGE DETERMINATION
    const algorithmicStageId = determineInitialStage({
      hasValidatedIdea: data.hasValidatedIdea,
      hasMVP: data.hasMVP,
      hasCustomers: data.hasCustomers,
      currentTeamSize: data.currentTeamSize,
      monthlyRevenue: data.monthlyRevenue,
    });

    // Set the algorithmically-determined stage
    setCurrentStage(algorithmicStageId);

    // Merge profile data with user
    const completedUser = {
      ...authenticatedUser,
      profile: {
        ...authenticatedUser.profile,
        ...data,
      },
      onboardingComplete: true,
    };

    // Mark Stage 0 (Profile Setup) as complete
    const journeyProgress = JSON.parse(
      localStorage.getItem("founder_journey_progress") || "{}",
    );
    journeyProgress.profileSetup = {
      status: "completed",
      progress: 100,
      completedAt: new Date().toISOString(),
    };
    localStorage.setItem(
      "founder_journey_progress",
      JSON.stringify(journeyProgress),
    );

    // Save founder profile
    localStorage.setItem("founder_profile", JSON.stringify(data));
    toast.success("🎉 Profile setup complete! Welcome to StartupVerse!", {
      description: `Based on your startup's current state, you're in: ${getStageName(algorithmicStageId)}`,
    });
    onComplete(completedUser);
  };
  if (currentStep === "auth") {
    return <SimpleAuth role={role} onComplete={handleAuthComplete} />;
  }

  // Profile setup with progress indicator
  const totalProfileSteps = 7;
  const progressPercentage = ((profileStep + 1) / totalProfileSteps) * 100;
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-4xl space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="text-sm">Stage 0: Profile Setup</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {"Step "}
                {profileStep + 1}
                {" of "}
                {totalProfileSteps}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <FounderOnboarding
              currentStep={profileStep}
              userData={collectedData}
              onNext={handleProfileNext}
              onPrevious={handleProfilePrevious}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
