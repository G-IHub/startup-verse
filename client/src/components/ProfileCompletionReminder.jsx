import React, { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import {
  Maximize2,
  CheckCircle2,
  Sparkles,
  UserCircle,
  Briefcase,
  Code,
  GraduationCap,
  Award,
  Calendar,
  Link2,
  FolderKanban,
  Target,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  flattenTalentUserForCompletion,
  getTalentProfileCompletionPercent,
} from "../utils/talentProfileCompletion";

const COMPLETION_THRESHOLD = 80; // Profile must be 80% complete to permanently dismiss

export default function ProfileCompletionReminder({
  user,
  onNavigateToProfile,
}) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const calculateCompletion = () => {
    const percentage = getTalentProfileCompletionPercent(user);
    return {
      percentage,
      requiredCompleted: 0,
      requiredTotal: 0,
      optionalCompleted: 0,
      optionalTotal: 0,
    };
  };
  const getProfileSegments = () => {
    const f = flattenTalentUserForCompletion(user);
    const segments = [
      {
        id: "professional-profile",
        label: "Professional Profile",
        icon: UserCircle,
        isComplete: !!(
          f.name &&
          f.email &&
          f.professionalTitle &&
          f.yearsOfExperience &&
          f.bio
        ),
      },
      {
        id: "skills-expertise",
        label: "Skills & Expertise",
        icon: Code,
        isComplete: Array.isArray(f.skills) && f.skills.length > 0,
      },
      {
        id: "professional-links",
        label: "Professional Links",
        icon: Link2,
        isComplete: !!(f.linkedin || f.github || f.website),
      },
      {
        id: "work-experience",
        label: "Work Experience",
        icon: Briefcase,
        isComplete:
          Array.isArray(f.workExperience) && f.workExperience.length > 0,
      },
      {
        id: "education",
        label: "Education",
        icon: GraduationCap,
        isComplete: Array.isArray(f.education) && f.education.length > 0,
      },
      {
        id: "certifications",
        label: "Certifications & Credentials",
        icon: Award,
        isComplete:
          Array.isArray(f.certifications) && f.certifications.length > 0,
      },
      {
        id: "portfolio",
        label: "Portfolio & Projects",
        icon: FolderKanban,
        isComplete:
          Array.isArray(f.portfolioItems) && f.portfolioItems.length > 0,
      },
      {
        id: "availability",
        label: "Availability & Preferences",
        icon: Calendar,
        isComplete: !!(
          f.availabilityStatus &&
          f.preferredCommitment &&
          f.experience &&
          f.availability
        ),
      },
      {
        id: "career-goals",
        label: "Career Goals & Industries",
        icon: Target,
        isComplete: !!(
          (f.professionalGoals && String(f.professionalGoals).trim()) ||
          (Array.isArray(f.interests) && f.interests.length > 0) ||
          (Array.isArray(f.industryPreferences) &&
            f.industryPreferences.length > 0)
        ),
      },
    ];
    return segments;
  };
  const completion = calculateCompletion();
  const profileSegments = getProfileSegments();
  const incompleteSegments = profileSegments.filter((s) => !s.isComplete);

  // Check if profile completion is below threshold
  const shouldShowReminder = completion.percentage < COMPLETION_THRESHOLD;

  // Initialize popup state on mount
  useEffect(() => {
    if (shouldShowReminder) {
      // Check if user manually minimized (stored separately from auto-show)
      const isManuallyMinimized =
        localStorage.getItem("profileReminder_minimized") === "true";
      if (isManuallyMinimized) {
        // User clicked minimize - keep it minimized
        setIsMinimized(true);
      } else {
        // Check if we should auto-show popup
        const lastShown = localStorage.getItem("profileReminder_lastShown");
        if (lastShown) {
          const lastShownTime = new Date(lastShown);
          const hoursSinceShown =
            (new Date().getTime() - lastShownTime.getTime()) / (1000 * 60 * 60);

          // Show popup again if more than 2 hours has passed
          if (hoursSinceShown >= 2) {
            setShowPopup(true);
            setIsMinimized(false);
            localStorage.setItem(
              "profileReminder_lastShown",
              new Date().toISOString(),
            );
            localStorage.removeItem("profileReminder_minimized");
          } else {
            // If shown recently, start minimized
            setIsMinimized(true);
          }
        } else {
          // First time - show the popup
          setShowPopup(true);
          setIsMinimized(false);
          localStorage.setItem(
            "profileReminder_lastShown",
            new Date().toISOString(),
          );
        }
      }
    }
  }, [shouldShowReminder]);

  // Don't render anything if profile is above threshold
  if (!shouldShowReminder) {
    return null;
  }
  const handleMinimize = () => {
    setShowPopup(false);
    setIsMinimized(true);
    // Mark as manually minimized so it stays minimized
    localStorage.setItem("profileReminder_minimized", "true");
  };
  const handleMaximize = () => {
    setIsMinimized(false);
    setShowPopup(true);
    // Clear the minimized flag when user manually expands
    localStorage.removeItem("profileReminder_minimized");
    localStorage.setItem("profileReminder_lastShown", new Date().toISOString());
  };
  const handleCompleteProfile = () => {
    setShowPopup(false);
    setIsMinimized(false);
    // Clear all reminder state when navigating to profile
    localStorage.removeItem("profileReminder_minimized");
    onNavigateToProfile();
  };

  // Minimized floating widget
  if (isMinimized && !showPopup) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4">
        <Card
          className="border-2 border-yellow-500 shadow-xl max-w-xs cursor-pointer hover:shadow-2xl transition-all hover:scale-105 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30"
          onClick={handleMaximize}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-20" />
                <div className="relative p-2 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold">Complete Your Profile</p>
                  <Maximize2 className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-2">
                  <Progress
                    value={completion.percentage}
                    className="h-1.5 flex-1"
                  />
                  <span className="text-xs font-bold text-primary">
                    {completion.percentage}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Full popup dialog
  return (
    <Dialog open={showPopup} onOpenChange={setShowPopup}>
      <DialogContent className="max-w-[calc(100%-3rem)] sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-start gap-2">
            <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-base mb-0.5">
                Complete Your Profile
              </DialogTitle>
              <DialogDescription className="text-xs">
                {"Reach "}
                {COMPLETION_THRESHOLD}% to maximize your visibility
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-3 mt-1">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Your Progress
              </span>
              <span
                className={`text-lg font-bold ${completion.percentage >= COMPLETION_THRESHOLD ? "text-green-600" : "text-primary"}`}
              >
                {completion.percentage}%
              </span>
            </div>
            <Progress value={completion.percentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {COMPLETION_THRESHOLD - completion.percentage}% more to unlock
              full visibility
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">
              Quick wins to boost your profile:
            </p>
            <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
              {profileSegments.map((segment) => {
                const Icon = segment.icon;
                return (
                  <div
                    key={segment.id}
                    className={`flex items-center gap-2 p-2 rounded-md transition-colors ${segment.isComplete ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800" : "bg-muted/50 hover:bg-muted"}`}
                  >
                    <div
                      className={`p-1 rounded ${segment.isComplete ? "bg-green-100 dark:bg-green-900/30" : "bg-background"}`}
                    >
                      <Icon
                        className={`w-3.5 h-3.5 ${segment.isComplete ? "text-green-600 dark:text-green-400" : "text-primary"}`}
                      />
                    </div>
                    <span
                      className={`text-xs flex-1 ${segment.isComplete ? "text-muted-foreground line-through" : ""}`}
                    >
                      {segment.label}
                    </span>
                    {segment.isComplete ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="space-y-1.5 pt-1">
            <Button
              onClick={handleCompleteProfile}
              size="sm"
              className="w-full gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Complete Profile Now
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMinimize}
              className="w-full text-xs h-8"
            >
              Do this later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
