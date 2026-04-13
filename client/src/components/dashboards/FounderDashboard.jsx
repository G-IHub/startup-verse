/**
 * StartupVerse Founder Dashboard
 */
import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/apiBase.js";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
// 🔥 REALTIME: Import team member real-time broadcasting

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import ProfileCompletionModal from "../ProfileCompletionModal";
import { TalentProfileModal } from "../TalentProfileModal";
import OutcomeSelectionModal from "../execution-engine/OutcomeSelectionModal";
import MilestoneDetailView from "../execution-engine/MilestoneDetailView";
import IntentCaptureModal from "../execution-engine/IntentCaptureModal";
import { WeeklyReviewModal } from "../execution-engine/WeeklyReviewModal";
import Phase3Welcome from "../execution-engine/Phase3Welcome";
import StageLearningModal from "../learning/StageLearningModal";
import StageRoadmapModal from "../roadmap/StageRoadmapModal";
import CohortMembershipBadge from "../organizations/CohortMembershipBadge";
import { getAccessToken, STORAGE_KEYS } from "../../app/session";

// 🔥 REMOVED: OrganizationEventsWidget and OrganizationAnnouncementsWidget
// Events appear in Virtual Office updates/calendar, announcements in inbox
import { checkAndSendEventReminders } from "../../utils/eventReminders";
import { initializeStageProgressionCheck } from "../../utils/automaticStageProgression";
import {
  Rocket,
  Building,
  AlertCircle,
  Sparkles,
  Target,
  Eye,
  UserPlus,
  TrendingUp,
  CheckCircle2,
  X,
  ChevronRight,
  FileText,
  Zap,
  Info,
  PlayCircle,
  Check,
  Upload,
  Flame,
  Share2,
  Copy,
} from "lucide-react";
import {
  generateSmartTeamRecommendations,
  getTalentMatchesForRoles,
} from "../../utils/smartTeamMatching";
import { getUnreadCount } from "../../utils/messaging";
import {
  getJourneyProgress,
  completeCurrentStage,
  updateStageProgress,
  autoDetectStageProgression,
  getOverallProgress,
  getTimeInCurrentStage,
  JOURNEY_STAGES,
} from "../../utils/journeyProgress";
import {
  createOutcomeFromTemplate,
  generateTasksFromOutcome,
  getActionButtonForTask,
} from "../../utils/executionEngine";
import * as coreEngineApi from "../../utils/api/coreEngineApi";
import * as teamMemberApi from "../../utils/api/teamMemberApi";
import { migrateTasksToBackend } from "../../utils/taskMigration";
import {
  createOutcomeFromIntent,
  generateTasksFromIntent,
} from "../../utils/intentParser";
import PendingCompensationCard from "../compensation/PendingCompensationCard";

// Stage-specific task definitions
const STAGE_TASKS = {
  1: [
    // Idea & Validation
    {
      id: "problem-statement",
      title: "Define Your Problem Statement",
      description: "Clearly articulate the problem your startup is solving",
      type: "form",
    },
    {
      id: "your-solution",
      title: "Describe Your Solution",
      description: "What are you building? How does it solve the problem?",
      type: "form",
    },
    {
      id: "target-audience",
      title: "Identify Your Target Audience",
      description: "Who are your ideal customers? Be specific.",
      type: "form",
    },
    {
      id: "market-size",
      title: "Calculate Market Size (TAM/SAM/SOM)",
      description: "Estimate your total addressable market",
      type: "form",
    },
    {
      id: "value-proposition",
      title: "Craft Your Value Proposition",
      description: "What makes your solution unique and valuable?",
      type: "form",
    },
    {
      id: "competitor-analysis",
      title: "Complete Competitor Analysis",
      description: "Research and document 3-5 main competitors",
      type: "form",
    },
    {
      id: "customer-interviews",
      title: "Conduct Customer Interviews (5-10 People)",
      description: "Talk to potential customers to validate your assumptions",
      type: "action",
    },
    {
      id: "pricing-model",
      title: "Define Your Pricing Model",
      description: "How will you monetize? What will customers pay?",
      type: "form",
    },
  ],
  2: [
    // Company Formation
    {
      id: "choose-entity",
      title: "Choose Entity Type",
      description: "CAC Business Name, CAC LLC, or Delaware LLC?",
      type: "navigation",
    },
    {
      id: "register-company",
      title: "Register Your Company",
      description: "Complete incorporation documents and submit",
      type: "action",
    },
    {
      id: "founder-agreements",
      title: "Create Founder Agreements",
      description: "Formalize roles, responsibilities, and vesting",
      type: "form",
    },
    {
      id: "cap-table",
      title: "Set Up Cap Table",
      description: "Document founder equity split and ownership",
      type: "action",
    },
    {
      id: "ein-tin",
      title: "Get EIN/TIN Registration",
      description: "Register for tax identification number",
      type: "action",
    },
    {
      id: "bank-account",
      title: "Open Business Bank Account",
      description: "Set up dedicated business banking",
      type: "action",
    },
  ],
  3: [
    // Team Building
    {
      id: "roles-needed",
      title: "Define Critical Roles Needed",
      description: "What positions do you need to fill first?",
      type: "form",
    },
    {
      id: "find-team",
      title: "Find Your Team Members",
      description: "Use Smart Team Matching or invite existing teammates",
      type: "action",
    },
    {
      id: "equity-split",
      title: "Agree on Equity Distribution",
      description: "Fair equity split for co-founders and early team",
      type: "form",
    },
    {
      id: "collaboration-agreement",
      title: "Sign Collaboration Agreement",
      description: "Formalize roles, responsibilities, and equity",
      type: "form",
    },
  ],
  4: [
    // Product Development
    {
      id: "mvp-scope",
      title: "Define MVP Scope",
      description: "What features are absolutely essential for launch?",
      type: "form",
    },
    {
      id: "tech-stack",
      title: "Choose Your Tech Stack",
      description: "Select technologies and tools for development",
      type: "form",
    },
    {
      id: "development-timeline",
      title: "Create Development Timeline",
      description: "Break down MVP into sprints with deadlines",
      type: "form",
    },
    {
      id: "build-mvp",
      title: "Build Your MVP",
      description: "Start developing your minimum viable product",
      type: "action",
    },
  ],
  5: [
    // Go to Market
    {
      id: "launch-strategy",
      title: "Plan Your Launch Strategy",
      description: "How will you introduce your product to the market?",
      type: "form",
    },
    {
      id: "marketing-channels",
      title: "Select Marketing Channels",
      description: "Where will you find your first customers?",
      type: "form",
    },
    {
      id: "beta-users",
      title: "Recruit 20 Beta Users",
      description: "Get early adopters to test and provide feedback",
      type: "action",
    },
    {
      id: "launch-product",
      title: "Launch Your Product",
      description: "Go live and start acquiring real customers",
      type: "action",
    },
  ],
  6: [
    // Growth & Scaling
    {
      id: "metrics-dashboard",
      title: "Set Up Metrics Dashboard",
      description: "Track key metrics: MRR, CAC, LTV, churn rate",
      type: "form",
    },
    {
      id: "growth-experiments",
      title: "Run Growth Experiments",
      description: "Test different channels and tactics to scale",
      type: "action",
    },
    {
      id: "fundraising",
      title: "Prepare Fundraising Materials",
      description: "Pitch deck, financial projections, investor list",
      type: "form",
    },
    {
      id: "scale-team",
      title: "Scale Your Team",
      description: "Hire for sales, marketing, and customer success",
      type: "action",
    },
  ],
};

// Inline Execution Score Card for 3-card layout
function ExecutionScoreInlineCard({ userId }) {
  const [scoreData, setScoreData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [showBreakdown, setShowBreakdown] = React.useState(false);
  const [showShareOptions, setShowShareOptions] = React.useState(false);
  const [copySuccess, setCopySuccess] = React.useState(false);
  React.useEffect(() => {
    const loadScore = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/execution-score/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${getAccessToken()}`,
            },
          },
        );
        if (response.ok) {
          const data = await response.json();
          setScoreData(data);
        }
      } catch (err) {
        console.error("Error loading execution score:", err);
      } finally {
        setLoading(false);
      }
    };
    loadScore();
  }, [userId]);
  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-primary";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };
  const generateShareText = () => {
    const percentileText =
      scoreData.percentile >= 90
        ? "Top 10%"
        : scoreData.percentile >= 75
          ? "Top 25%"
          : scoreData.percentile >= 50
            ? "Top 50%"
            : "Building momentum";
    const changeText =
      scoreData.weeklyChange > 0
        ? `📈 +${scoreData.weeklyChange} this week`
        : "";
    return `🚀 Execution Score: ${scoreData.score}/100 ${changeText}
${percentileText} among founders in the 12-Week Execution Challenge

Proving execution beats ideas. Join the challenge:
https://startupverse.com/12-week-challenge

#BuildInPublic #FounderJourney #StartupExecution #12WeekChallenge`;
  };
  const handleShare = async (platform) => {
    const shareText = generateShareText();
    const url = "https://startupverse.com/12-week-challenge";
    if (platform === "twitter") {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
      window.open(twitterUrl, "_blank");
    } else if (platform === "linkedin") {
      const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
      window.open(linkedinUrl, "_blank");
      // Note: LinkedIn doesn't support pre-filled text, user will need to paste
      navigator.clipboard.writeText(shareText);
      toast.success("Share text copied! Paste it in your LinkedIn post");
    } else if (platform === "copy") {
      navigator.clipboard.writeText(shareText);
      setCopySuccess(true);
      toast.success("Share text copied to clipboard!");
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };
  return (
    <>
      <Card className="border shadow-none flex flex-col">
        <CardContent className="p-1 flex flex-col flex-1 min-h-[80px] md:min-h-[90px]">
          <div className="flex flex-col space-y-0.5 items-center text-center flex-1 justify-center">
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-[8px] font-medium text-muted-foreground uppercase">
                Score
              </span>
            </div>
            {loading ? (
              <div className="animate-pulse">
                <div className="h-8 w-12 bg-muted rounded" />
              </div>
            ) : scoreData ? (
              <>
                <span
                  className={`text-3xl font-bold ${getScoreColor(scoreData.score)}`}
                >
                  {scoreData.score}
                </span>
                <div className="flex items-center gap-1">
                  {scoreData.weeklyChange !== 0 && (
                    <>
                      {scoreData.weeklyChange > 0 ? (
                        <TrendingUp className="w-2 h-2 text-green-600" />
                      ) : (
                        <TrendingUp className="w-2 h-2 text-red-600 rotate-180" />
                      )}
                      <span className="text-[8px] font-medium">
                        {scoreData.weeklyChange > 0 ? "+" : ""}
                        {scoreData.weeklyChange}
                      </span>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <span className="text-3xl font-bold text-muted-foreground">
                  --
                </span>
                <p className="text-[7px] text-muted-foreground">
                  Complete week 1
                </p>
              </>
            )}
          </div>
          {scoreData && (
            <button
              onClick={() => setShowBreakdown(true)}
              className="text-[8px] text-primary hover:text-primary/80 font-medium py-0.5 flex items-center justify-center gap-0.5 transition-colors"
            >
              View Breakdown
              <ChevronRight className="w-2 h-2" />
            </button>
          )}
        </CardContent>
      </Card>
      {showBreakdown && scoreData && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowBreakdown(false)}
        >
          <Card
            className="w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Execution Score Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div
                  className={`text-5xl font-bold ${getScoreColor(scoreData.score)}`}
                >
                  {scoreData.score}
                  <span className="text-xl text-muted-foreground">/100</span>
                </div>
                {scoreData.weeklyChange !== 0 && (
                  <div
                    className={`flex items-center gap-1 justify-center mt-2 ${scoreData.weeklyChange > 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {scoreData.weeklyChange > 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingUp className="w-4 h-4 rotate-180" />
                    )}
                    <span>
                      {scoreData.weeklyChange > 0 ? "+" : ""}
                      {scoreData.weeklyChange}
                      {" this week"}
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-muted-foreground">
                      Weekly Completion
                    </span>
                    <span className="text-xs font-medium">
                      {scoreData.breakdown.weeklyCompletion}/100
                    </span>
                  </div>
                  <Progress
                    value={scoreData.breakdown.weeklyCompletion}
                    className="h-1.5"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-muted-foreground">
                      Outcome Quality
                    </span>
                    <span className="text-xs font-medium">
                      {scoreData.breakdown.outcomeQuality}/100
                    </span>
                  </div>
                  <Progress
                    value={scoreData.breakdown.outcomeQuality}
                    className="h-1.5"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-muted-foreground">
                      Consistency
                    </span>
                    <span className="text-xs font-medium">
                      {scoreData.breakdown.consistency}/100
                    </span>
                  </div>
                  <Progress
                    value={scoreData.breakdown.consistency}
                    className="h-1.5"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-muted-foreground">
                      Progression
                    </span>
                    <span className="text-xs font-medium">
                      {scoreData.breakdown.progression}/100
                    </span>
                  </div>
                  <Progress
                    value={scoreData.breakdown.progression}
                    className="h-1.5"
                  />
                </div>
              </div>
              {!showShareOptions ? (
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => setShowShareOptions(true)}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share My Progress
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleShare("twitter")}
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      Twitter/X
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleShare("linkedin")}
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
                      </svg>
                      LinkedIn
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleShare("copy")}
                  >
                    {copySuccess ? (
                      <>
                        <Check className="w-4 h-4 mr-2 text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Share Text
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-xs"
                    onClick={() => setShowShareOptions(false)}
                  >
                    Back
                  </Button>
                </div>
              )}
              {!showShareOptions && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowBreakdown(false)}
                >
                  Close
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
export default function FounderDashboard({
  user,
  onLogout,
  onUpdateUser,
  onNavigate,
  onVirtualOfficeViewChange,
}) {
  const [showProfileModal, setShowProfileModal] = useState(
    !user.onboardingComplete,
  );
  const [journeyProgress, setJourneyProgress] = useState(null);
  const [completedTasks, setCompletedTasks] = useState(new Set());
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [taskFormData, setTaskFormData] = useState({});
  const [showSkipWarning, setShowSkipWarning] = useState(false);
  const [teamRecommendations, setTeamRecommendations] = useState([]);
  const [talentMatches, setTalentMatches] = useState([]);
  const [selectedTalent, setSelectedTalent] = useState(null);
  const [isTalentModalOpen, setIsTalentModalOpen] = useState(false);

  // Execution Engine State
  const [executionData, setExecutionData] = useState(null);
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [showIntentCaptureModal, setShowIntentCaptureModal] = useState(false);
  const [showMilestoneDetailView, setShowMilestoneDetailView] = useState(false);
  const [showWeeklyReviewModal, setShowWeeklyReviewModal] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingExecutionData, setIsLoadingExecutionData] = useState(true); // ⚡ Specific loading state for This Week's Focus

  // Deliverables State - From Organization Cohorts
  const [deliverables, setDeliverables] = useState([]);
  const [submittingDeliverable, setSubmittingDeliverable] = useState(null);
  const [deliverableSubmissionData, setDeliverableSubmissionData] = useState({
    submissionUrl: "",
    notes: "",
  });

  // Team Members State - Load from backend
  const [teamMembers, setTeamMembers] = useState([]);

  // Phase 3 Welcome - Show once per user
  const [showPhase3Welcome, setShowPhase3Welcome] = useState(() => {
    const seen = localStorage.getItem(`phase3_welcome_seen_${user.id}`);
    return !seen && user.onboardingComplete;
  });

  // Stage Learning Modal State
  const [showStageLearningModal, setShowStageLearningModal] = useState(false);

  // Stage Roadmap Modal State
  const [showRoadmapModal, setShowRoadmapModal] = useState(false);

  // Refs for height syncing
  const leftColumnRef = React.useRef(null);
  const rightCardRef = React.useRef(null);
  const teamSize = teamMembers.length + 1;

  // Initialize execution engine data - ASYNC BACKEND LOADING
  useEffect(() => {
    let mounted = true;

    // 🎯 Initialize automatic stage progression system
    initializeStageProgressionCheck();

    // 🔔 Check for upcoming event reminders (async, non-blocking)
    checkAndSendEventReminders(user.id).catch((err) => {
      console.warn("Event reminder check failed:", err);
    });
    const loadData = async () => {
      try {
        // ⚡ PERFORMANCE: Show UI immediately, load data in background
        setIsLoading(false);
        setIsLoadingExecutionData(true); // ⚡ Start loading execution data

        // ⚡ Migrate tasks in background (non-blocking)
        migrateTasksToBackend(user.id)
          .then((migrationResult) => {
            if (migrationResult.migrated > 0) {
              console.log(
                `🔄 Migrated ${migrationResult.migrated} tasks from localStorage to backend`,
              );
            }
          })
          .catch(() => {});

        // Load from backend (async)
        const [data, existingTasks] = await Promise.all([
          coreEngineApi.getExecutionData(user.id),
          coreEngineApi.getTasks(user.id),
        ]);
        if (!mounted) return;
        console.log("✅ Loaded execution data from backend:", data);
        console.log("✅ Loaded tasks from backend:", existingTasks);
        setExecutionData(data);
        setIsLoadingExecutionData(false); // ⚡ Done loading execution data

        // Load deliverables from organizations (non-blocking)
        loadDeliverables();

        // ✅ FILTER: Only show tasks for current outcome
        const currentOutcomeTasks = data.currentOutcome
          ? existingTasks.filter(
              (t) =>
                t.weekId === data.currentOutcome.weekId ||
                t.outcomeId === data.currentOutcome.id ||
                // Fallback: if task has no weekId/outcomeId, check if milestone exists in current outcome
                data.currentOutcome.milestones?.some(
                  (m) => m.id === t.milestoneId,
                ),
            )
          : [];
        console.log(
          `📊 Filtered tasks for current outcome: ${existingTasks.length} total → ${currentOutcomeTasks.length} for current`,
        );

        // Add action buttons to existing tasks that don't have them
        const tasksWithButtons = currentOutcomeTasks.map((task) => {
          if (!task.actionButton) {
            const actionButton = getActionButtonForTask(task.title);
            if (actionButton) {
              console.log(
                "Adding action button to task:",
                task.title,
                actionButton,
              );
            }
            return actionButton
              ? {
                  ...task,
                  actionButton,
                }
              : task;
          }
          return task;
        });

        // Save updated tasks in background (non-blocking)
        if (
          JSON.stringify(tasksWithButtons) !==
          JSON.stringify(currentOutcomeTasks)
        ) {
          console.log("Saving migrated tasks with action buttons");
          coreEngineApi.saveTasks(user.id, tasksWithButtons).catch(() => {});
        }
        setTasks(tasksWithButtons);
      } catch (error) {
        // Debug log only - backend is optional in demo mode
        if (process.env.NODE_ENV === "development") {
          console.debug(
            "Backend execution data fetch failed (using localStorage):",
            error.message,
          );
        }

        // Don't show error toast - silently fallback to localStorage
        console.log("Using cached execution data due to backend error");
        setIsLoadingExecutionData(false); // ⚡ Stop loading even on error
      }
    };
    loadData();
    return () => {
      mounted = false;
    };
  }, [user.id]);

  // Load team members from backend
  useEffect(() => {
    let mounted = true;
    const loadTeamMembers = async () => {
      try {
        // 1. Load from localStorage first (fast initial render)
        const allUsersFromMultipleSources = [
          ...JSON.parse(localStorage.getItem(STORAGE_KEYS.teamMembers) || "[]"),
          ...JSON.parse(
            localStorage.getItem("startupverse_registered_users") || "[]",
          ),
        ];
        const userMap = {};
        allUsersFromMultipleSources.forEach((u) => {
          if (u && u.id) {
            userMap[u.id] = u;
          }
        });
        const uniqueUsers = Object.values(userMap);

        // 🔒 SECURITY FIX: Use startupId/founderId ONLY, removed companyId matching
        const filtered = uniqueUsers.filter(
          (u) =>
            u.id !== user.id &&
            (u.role === "team-member" || u.role === "team") &&
            (u.startupId === user.id || u.founderId === user.id),
        );
        setTeamMembers(filtered);
        console.log(
          "📊 [FounderDashboard] Team members loaded from localStorage:",
          filtered.length,
        );

        // 2. Fetch from backend in BACKGROUND to get fresh data
        const backendTeamMembers = await teamMemberApi.getStartupTeamMembers(
          user.id,
        );
        if (!mounted) return;
        if (backendTeamMembers && backendTeamMembers.length > 0) {
          // Map backend data to consistent format
          const mappedMembers = backendTeamMembers
            .filter((m) => m.id !== user.id) // Exclude founder
            .map((member) => ({
              id: member.id,
              name: member.name || member.talentName || "Unknown User",
              role: member.role || member.talentArea || "Team Member",
              email: member.email,
              avatar: member.avatar,
              title:
                member.title || member.talentArea || member.professionalTitle,
              skills: member.skills || member.talentSkills || [],
              startupId: member.startupId || user.id,
              founderId: member.founderId || user.id,
            }));
          setTeamMembers(mappedMembers);
          console.log(
            "✅ [FounderDashboard] Team members updated from backend:",
            mappedMembers.length,
          );
        }
      } catch (error) {
        // Silently fail - localStorage data is already displayed
        if (process.env.NODE_ENV === "development") {
          console.debug(
            "Failed to load team members from backend (expected in demo mode):",
            error.message,
          );
        }
      }
    };
    loadTeamMembers();

    // ✅ REALTIME: Removed team member polling (was every 10s) - using real-time subscription

    return () => {
      mounted = false;
      // Real-time subscription cleanup handled separately
    };
  }, [user.id, user.companyId]);

  // Load deliverables from organizations
  const loadDeliverables = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/deliverables/founder/${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${getAccessToken()}`,
          },
        },
      );
      if (!response.ok) {
        console.warn("Failed to fetch deliverables:", response.status);
        return;
      }
      const data = await response.json();
      setDeliverables(data.deliverables || []);
      console.log("✅ Loaded deliverables:", data.deliverables?.length || 0);
    } catch (error) {
      console.error("Error loading deliverables:", error);
    }
  };

  // Initialize journey progress
  useEffect(() => {
    // Load or initialize journey progress
    let progress = getJourneyProgress();

    // Only initialize if no progress exists at all
    if (!progress || !progress.currentStage) {
      const initialProgress = {
        currentStage: 1,
        // Default to Stage 1 for truly new users
        completedStages: [],
        stageData: {
          1: {
            startedAt: new Date().toISOString(),
            completionPercentage: 0,
            milestonesCompleted: [],
          },
        },
      };
      localStorage.setItem("journey_progress", JSON.stringify(initialProgress));
      progress = initialProgress;
      console.log(
        "📊 [FounderDashboard] Initialized new journey progress for first-time user",
      );
    } else {
      console.log(
        `📊 [FounderDashboard] Loaded existing journey progress - Stage ${progress.currentStage}`,
      );
    }
    setJourneyProgress(progress);
    autoDetectStageProgression(user.id);

    // Load completed tasks from localStorage
    const saved = localStorage.getItem(`completed_tasks_${user.id}`);
    if (saved) {
      setCompletedTasks(new Set(JSON.parse(saved)));
    }
  }, [user.id]);

  // Generate team recommendations for Stage 3
  useEffect(() => {
    if (
      user.profile &&
      user.onboardingComplete &&
      journeyProgress?.currentStage === 3
    ) {
      const recommendations = generateSmartTeamRecommendations({
        industryFocus: user.profile.industryFocus,
        stage: user.profile.stage,
        targetAudience: user.profile.targetAudience,
        rolesNeeded: user.profile.rolesNeeded,
        teamSize: user.profile.teamSize,
        startupDescription: user.profile.startupDescription,
      });
      setTeamRecommendations(recommendations);
      const topRoles = recommendations.slice(0, 3).map((r) => r.role);
      const matches = getTalentMatchesForRoles(topRoles, 6);
      setTalentMatches(matches);
    }
  }, [user.profile, user.onboardingComplete, journeyProgress?.currentStage]);

  // Get current stage info
  const currentStageId = journeyProgress?.currentStage || 1;
  const currentStage =
    JOURNEY_STAGES.find((s) => s.id === currentStageId) || JOURNEY_STAGES[0];
  const currentTasks = STAGE_TASKS[currentStageId] || [];
  const overallProgress = getOverallProgress();
  const timeInStage = getTimeInCurrentStage();

  // 🎯 Calculate Startup Stage Progress based on completed weekly outcomes
  // This creates incremental progress (0.5-2% per outcome) that moves with every execution
  const calculateStartupStageProgress = () => {
    // Count total completed outcomes from week history + current outcome if completed
    const completedOutcomes = executionData?.weekHistory.length || 0;

    // Average startup journey: ~50-80 weekly outcomes to go from 0 → 100%
    // Stage 1 (Ideation): ~8-12 weeks
    // Stage 2 (Formation): ~4-6 weeks
    // Stage 3 (Team Building): ~8-12 weeks
    // Stage 4 (Product Dev): ~12-20 weeks
    // Stage 5 (Go-to-Market): ~10-15 weeks
    // Stage 6 (Operations): ~12-20 weeks
    // Total: ~54-85 weeks (we'll use 70 as middle ground)
    const ESTIMATED_TOTAL_OUTCOMES = 70;

    // Calculate progress: each outcome = ~1.43% progress
    const progress = Math.min(
      100,
      (completedOutcomes / ESTIMATED_TOTAL_OUTCOMES) * 100,
    );

    // Round to 1 decimal for granular display (shows 0.5%, 1.4%, etc.)
    return Math.round(progress * 10) / 10;
  };
  const startupStageProgress = calculateStartupStageProgress();

  // Calculate stage completion based on tasks
  const tasksCompleted = currentTasks.filter((task) =>
    completedTasks.has(task.id),
  ).length;
  const stageProgress =
    currentTasks.length > 0 ? (tasksCompleted / currentTasks.length) * 100 : 0;

  // 🚀 Calculate current outcome progress (for Current Stage card)
  const getCurrentOutcomeProgress = () => {
    if (
      !executionData?.currentOutcome ||
      !executionData.currentOutcome.milestones
    ) {
      return 0;
    }
    const milestones = executionData.currentOutcome.milestones;
    if (milestones.length === 0) return 0;

    // Calculate progress based on milestone completion
    const completedMilestones = milestones.filter(
      (m) => m.status === "completed",
    ).length;
    const inProgressMilestones = milestones.filter(
      (m) => m.status === "in-progress",
    ).length;

    // Give partial credit for in-progress milestones based on their task completion
    let totalProgress = completedMilestones;
    milestones.forEach((m) => {
      if (m.status === "in-progress" && m.totalTasks > 0) {
        totalProgress += m.tasksCompleted / m.totalTasks;
      }
    });
    return Math.round((totalProgress / milestones.length) * 100);
  };
  const outcomeProgress = getCurrentOutcomeProgress();

  // Quick access metrics
  const unreadMessages = getUnreadCount();
  const notifications = JSON.parse(
    localStorage.getItem("founder_notifications") || "[]",
  );
  const unreadNotifications = notifications.filter((n) => !n.read).length;
  const onlineMembers =
    teamMembers.filter((m) => m.status === "online").length + 1;

  // 🎯 Generate Inspirational Startup Insight - Company stories + motivational coaching
  const getSmartInsight = () => {
    const weekNumber = (executionData?.weekHistory.length || 0) + 1;
    const totalTasks = tasks.length;
    const completedTasksCount = tasks.filter((t) => t.completed).length;
    const blockedTasksCount = tasks.filter((t) => t.blocked).length;
    const activeTeamCount = teamSize;
    const streakCount = executionData?.streak || 0;
    const totalCompletedWeeks =
      executionData?.weekHistory.filter((w) => w.achievement === "completed")
        .length || 0;

    // CRITICAL: Blocked tasks - Company stories about unblocking
    if (blockedTasksCount > 0) {
      const blockerStories = [
        `Slack's first version was blocked for 2 weeks on infrastructure issues. Stewart Butterfield made unblocking technical debt his #1 priority, leading to their fastest product iteration cycle. Your ${blockedTasksCount} blocked task${blockedTasksCount > 1 ? "s are" : " is"} the exact type of friction that separates teams who ship from those who stall. Great founders unblock relentlessly—your team is waiting on these decisions to maintain momentum.`,
        `When Airbnb was stuck during the 2008 financial crisis with zero traction, the founders identified their blocker: bad product photos. They flew to New York, photographed listings themselves, and revenue doubled overnight. You have ${blockedTasksCount} blocker${blockedTasksCount > 1 ? "s" : ""} across your ${activeTeamCount}-person team. Every day these stay blocked is a day your startup isn't learning. Address them now.`,
        `Stripe's early team had a rule: no task could be blocked for more than 24 hours. Patrick Collison personally unblocked payment integration issues, which became their competitive moat. Your ${blockedTasksCount} blocked task${blockedTasksCount > 1 ? "s represent" : " represents"} hidden leverage—unblocking often reveals the fastest path to progress. This is your highest-ROI activity right now.`,
      ];
      return {
        message: blockerStories[blockedTasksCount % blockerStories.length],
        action: "milestone-detail",
        actionLabel: "Unblock Now",
        variant: "warning",
      };
    }

    // Week complete - Streak psychology & compound growth stories
    if (executionData?.currentOutcome && outcomeProgress >= 100) {
      if (streakCount >= 3) {
        return {
          message: `🔥 ${streakCount}-Week Streak! You're in elite territory. Notion shipped their first public version after a 4-week unbroken execution streak in 2016. Y Combinator data shows startups with 4+ consecutive weekly wins have 3.2x higher success rates. You've completed ${totalCompletedWeeks} total week${totalCompletedWeeks !== 1 ? "s" : ""} in "${currentStage.name}"—this compound momentum is how iconic companies are built. Lock in Week ${weekNumber} now to keep the streak alive.`,
          action: "complete-week",
          actionLabel: "Lock In Week " + weekNumber,
          variant: "success",
        };
      } else if (streakCount === 2) {
        return {
          message: `💪 2-Week Streak! Instagram's MVP was built in exactly 2 weeks of focused execution by Kevin Systrom and Mike Krieger. You're matching their pace. Research shows the hardest streak to build is 2→3 weeks—once you hit 3, momentum becomes self-reinforcing. Complete your review now to hit that critical inflection point where weekly execution becomes a habit.`,
          action: "complete-week",
          actionLabel: "Build 3-Week Streak",
          variant: "success",
        };
      } else if (streakCount === 1) {
        return {
          message: `✨ Week ${weekNumber} Complete! Twitter's first complete week of development in 2006 laid the foundation for their entire platform architecture. One week doesn't seem like much, but WhatsApp was just a status app after their first complete week—they pivoted to messaging in Week 2. Your ${streakCount}-week streak is the beginning of compounding progress. Complete review to start your 2-week streak.`,
          action: "complete-week",
          actionLabel: "Start 2-Week Streak",
          variant: "success",
        };
      } else {
        return {
          message: `🎉 Week ${weekNumber} Complete! Figma's founders spent their entire first month just setting up their first weekly outcome in 2012. You've completed ${totalCompletedWeeks} week${totalCompletedWeeks !== 1 ? "s" : ""} in "${currentStage.name}". The hardest part of any startup is finishing what you start—most founders plan but never ship. You just proved you can execute. Complete your review to begin your first streak.`,
          action: "complete-week",
          actionLabel: "Start Your Streak",
          variant: "success",
        };
      }
    }

    // High progress (80-99%) - Speed & finishing stories
    if (executionData?.currentOutcome && outcomeProgress >= 80) {
      const speedStories = [
        `Discord shipped their first stable voice chat in 72 hours during beta testing when a critical bug blocked everything. You're at ${outcomeProgress}% completion with just ${tasks.filter((t) => !t.completed).length} task${tasks.filter((t) => !t.completed).length !== 1 ? "s" : ""} remaining—you're in the final sprint. Studies show 80% → 100% is where most teams lose focus and add scope. Stay disciplined. Finish this week strong and you'll be in the top 12% of startups who actually complete their weekly outcomes.`,
        `Dropbox's Drew Houston coded the entire first MVP demo video in one final 36-hour push at 93% complete. You're at ${outcomeProgress}%—so close you can taste it. The last 20% is often the most valuable: polish, edge cases, and completeness separate "works on my machine" from "ready to ship." Your ${activeTeamCount}-person team is almost there. Push through to 100%.`,
        `Shopify's Tobias Lütke has a rule: "90% done is 0% done." You're at ${outcomeProgress}% for Week ${weekNumber}. The graveyard of startups is filled with "almost finished" features. ${totalCompletedWeeks > 0 ? `You've already completed ${totalCompletedWeeks} week${totalCompletedWeeks !== 1 ? "s" : ""}—you know how to finish.` : "Prove you can finish, not just start."} Cross the finish line and lock in this weekly win.`,
      ];
      return {
        message: speedStories[weekNumber % speedStories.length],
        action: "milestone-detail",
        actionLabel: "Finish Strong",
        variant: "default",
      };
    }

    // Mid progress (50-79%) - Persistence through "messy middle"
    if (executionData?.currentOutcome && outcomeProgress >= 50) {
      const momentumStories = [
        `Notion's Ivan Zhao spent 18 months at exactly this midpoint—${outcomeProgress}% through their vision—before their first big customer signed. You're ${outcomeProgress}% through Week ${weekNumber} in "${currentStage.name}" with ${activeTeamCount} team member${activeTeamCount > 1 ? "s" : ""} executing. The middle of any outcome is the hardest: past the excitement of starting, before the satisfaction of finishing. But this is where great companies separate from the rest. Keep pushing.`,
        `Linear's first version took 8 weeks of sustained ${Math.round(outcomeProgress)}%-range progress before they hit their breakthrough. You're at ${outcomeProgress}% this week with ${completedTasksCount}/${totalTasks} tasks complete${streakCount > 0 ? ` and a ${streakCount}-week streak` : ""}. Data shows startups who maintain 50-80% weekly progress consistently for 4+ weeks have 2.7x better retention and fundraising outcomes. You're building the right habits.`,
        `When Superhuman was at ${outcomeProgress}% through their beta testing phase, Rahul Vohra said "We're in the messy middle where nothing feels finished but everything's in motion." That's exactly where you are: Week ${weekNumber}, ${outcomeProgress}% complete, ${activeTeamCount} people executing. This isn't the glamorous part—it's the grind. But this grind compounds into product-market fit.`,
      ];
      return {
        message: momentumStories[totalCompletedWeeks % momentumStories.length],
        variant: "default",
      };
    }

    // Low progress (1-49%) - Early execution encouragement
    if (executionData?.currentOutcome && outcomeProgress > 0) {
      const earlyStories = [
        `Uber's first ride ever was just 1% of their vision—a single black car in San Francisco. You're at ${outcomeProgress}% progress in Week ${weekNumber} with ${completedTasksCount} task${completedTasksCount !== 1 ? "s" : ""} complete. Every iconic company started exactly here: early momentum, long runway ahead, everything still possible. ${streakCount > 0 ? `Your ${streakCount}-week streak proves you're consistent.` : "The first tasks are the hardest—you've overcome inertia."} Keep shipping.`,
        `Pinterest's Ben Silbermann personally emailed their first 5,000 users when they were at ${Math.round(outcomeProgress)}% of their growth goals. You're ${outcomeProgress}% through "${executionData.currentOutcome.title}" this week. Early progress feels slow because you're building foundations. But Airbnb took 1,000 days to get to $1M revenue, then 365 days to get to $200M. The early grind unlocks exponential later.`,
        `Figma's Dylan Field said their first year felt like ${outcomeProgress}% progress every single week—slow, uncertain, but directional. You're in Week ${weekNumber} of "${currentStage.name}" with ${activeTeamCount} team member${activeTeamCount > 1 ? "s" : ""} shipping alongside you. ${totalCompletedWeeks > 0 ? `You've completed ${totalCompletedWeeks} week${totalCompletedWeeks !== 1 ? "s" : ""} already.` : "This is your first week executing."} Progress is progress. Trust the process.`,
      ];
      return {
        message:
          earlyStories[
            (weekNumber + completedTasksCount) % earlyStories.length
          ],
        action: "milestone-detail",
        actionLabel: "View Progress",
        variant: "default",
      };
    }

    // Active outcome but no tasks started - First step psychology
    if (executionData?.currentOutcome) {
      const firstStepStories = [
        `Netflix's Reed Hastings says "The hardest step is always from 0% to 1%." You've set Week ${weekNumber}: "${executionData.currentOutcome.title}" with ${totalTasks} task${totalTasks !== 1 ? "s" : ""} across ${executionData.currentOutcome.milestones.length} milestone${executionData.currentOutcome.milestones.length !== 1 ? "s" : ""}. ${activeTeamCount} team member${activeTeamCount > 1 ? "s are" : " is"} waiting to execute. Analysis of 1,000+ YC startups shows those who start execution within 24 hours of planning have 5x better weekly completion rates. Start your first task now.`,
        `Stripe's first line of code wasn't elegant—it was fast. John and Patrick Collison shipped a working payment in 3 hours from zero. You've got Week ${weekNumber} planned: "${executionData.currentOutcome.title}". Your ${activeTeamCount}-person team has ${totalTasks} tasks ready. ${streakCount > 0 ? `You have a ${streakCount}-week streak to protect.` : totalCompletedWeeks > 0 ? `You've finished ${totalCompletedWeeks} week${totalCompletedWeeks !== 1 ? "s" : ""} before.` : "This is your fresh start."} Don't overthink it. Just start.`,
        `Y Combinator's motto is "Make something people want," but Paul Graham says the unspoken rule is "Make ANYTHING this week." You've set "${executionData.currentOutcome.title}" for Week ${weekNumber} in "${currentStage.name}". ${totalTasks} tasks generated, ${activeTeamCount} people aligned, 0% complete. Most startups fail not from bad ideas but from planning without shipping. Prove you're different. Execute task #1 today.`,
      ];
      return {
        message: firstStepStories[weekNumber % firstStepStories.length],
        action: "milestone-detail",
        actionLabel: "Start First Task",
        variant: "info",
      };
    }

    // No active outcome - First week stories & execution mindset
    const noOutcomeStories = [
      `Airbnb's first weekly goal was hilariously simple: "Get 1 booking." They were broke, desperate, and in the "${currentStage.name}" stage just like you. That one goal became 3 bookings, then 100, then millions. You have ${activeTeamCount} team member${activeTeamCount > 1 ? "s" : ""} ready${totalCompletedWeeks > 0 ? ` and ${totalCompletedWeeks} completed week${totalCompletedWeeks !== 1 ? "s" : ""} of momentum` : ""}${streakCount > 0 ? ` with a ${streakCount}-week streak` : ""}. Set Week ${weekNumber}'s outcome—make it simple, concrete, and finishable. Every unicorn started with Week 1.`,
      `Notion spent 3 years "figuring things out" before they started weekly execution. By the time they launched, they'd been passed by 12 competitors. Don't make that mistake. You're in "${currentStage.name}" with ${activeTeamCount} people${totalCompletedWeeks > 0 ? ` and ${totalCompletedWeeks} successful week${totalCompletedWeeks !== 1 ? "s" : ""} under your belt` : " ready to execute"}. The companies that win aren't the ones with perfect plans—they're the ones who set Week ${weekNumber} outcomes and ship. What will you commit to this week?`,
      `Superhuman's Rahul Vohra: "Every startup is just a series of weekly bets that compound." You're in "${currentStage.name}"${totalCompletedWeeks > 0 ? ` with ${totalCompletedWeeks} winning week${totalCompletedWeeks !== 1 ? "s" : ""} already` : ", ready to place your first bet"}. ${activeTeamCount} team member${activeTeamCount > 1 ? "s are" : " is"} waiting for direction. ${streakCount > 0 ? `Your ${streakCount}-week streak is at risk—` : ""}Set a clear, achievable Week ${weekNumber} outcome that moves you forward. Execution beats perfection every time.`,
    ];
    return {
      message:
        noOutcomeStories[
          (weekNumber + totalCompletedWeeks) % noOutcomeStories.length
        ],
      action: "set-outcome",
      actionLabel: "Set Week " + weekNumber + " Outcome",
      variant: "info",
    };
  };
  const smartInsight = getSmartInsight();
  const handleProfileComplete = (profileData) => {
    onUpdateUser({
      ...user,
      profile: {
        ...user.profile,
        ...profileData,
      },
      onboardingComplete: true,
    });
    updateStageProgress(1, 25);
  };
  const handleCompleteTask = (taskId) => {
    const newCompleted = new Set(completedTasks);
    newCompleted.add(taskId);
    setCompletedTasks(newCompleted);
    localStorage.setItem(
      `completed_tasks_${user.id}`,
      JSON.stringify(Array.from(newCompleted)),
    );

    // Update journey progress
    const newProgress = (newCompleted.size / currentTasks.length) * 100;
    updateStageProgress(currentStageId, Math.min(newProgress, 95));
    toast.success("Task completed! 🎉", {
      description: "Great progress on your startup journey!",
    });
    setActiveTaskId(null);
    setTaskFormData({});

    // Check if stage is complete
    if (newCompleted.size === currentTasks.length) {
      toast.success("🎊 Stage Complete!", {
        description: `You've finished ${currentStage.title}! Ready to move to the next stage?`,
        action: {
          label: "Continue",
          onClick: handleCompleteStage,
        },
      });
    }
  };
  const handleCompleteStage = () => {
    const updatedProgress = completeCurrentStage();
    setJourneyProgress(updatedProgress);
    setCompletedTasks(new Set()); // Reset tasks for new stage
    toast.success("🚀 Moving to next stage!", {
      description: `Welcome to ${JOURNEY_STAGES[currentStageId]?.title || "the next phase"}!`,
    });
  };
  const handleSkipStage = () => {
    setShowSkipWarning(false);
    handleCompleteStage();
  };
  const handleViewTalent = (talent) => {
    const recommendation = teamRecommendations.find(
      (rec) => rec.role === talent.role,
    );
    setSelectedTalent({
      ...talent,
      priority: recommendation?.priority || "high",
      reasoning:
        recommendation?.reasoning ||
        `Recommended for your ${currentStage.title} stage`,
    });
    setIsTalentModalOpen(true);
  };

  // ===== HELPER: REFRESH DATA FROM BACKEND =====

  const refreshExecutionData = async () => {
    try {
      setIsRefreshing(true);
      const [data, latestTasks] = await Promise.all([
        coreEngineApi.getExecutionData(user.id),
        coreEngineApi.getTasks(user.id),
      ]);
      console.log("✅ Data refreshed from backend");
      setExecutionData(data);

      // ✅ FILTER: Only show tasks for current outcome
      // This prevents old tasks from previous outcomes from appearing
      const currentOutcomeTasks = data.currentOutcome
        ? latestTasks.filter(
            (t) =>
              t.weekId === data.currentOutcome.weekId ||
              t.outcomeId === data.currentOutcome.id ||
              // Fallback: if task has no weekId/outcomeId, check if milestone exists in current outcome
              data.currentOutcome.milestones?.some(
                (m) => m.id === t.milestoneId,
              ),
          )
        : [];
      console.log(
        `📊 Filtered tasks: ${latestTasks.length} total → ${currentOutcomeTasks.length} for current outcome`,
      );
      setTasks(currentOutcomeTasks);
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  };

  // ===== EXECUTION ENGINE HANDLERS =====

  const handleSelectOutcome = async (
    templateId,
    customTitle,
    customDescription,
  ) => {
    if (!executionData) return;
    try {
      setIsRefreshing(true);

      // Calculate current week number
      const weekNumber = (executionData.weekHistory.length || 0) + 1;

      // Create outcome from template
      const outcome = createOutcomeFromTemplate(
        templateId,
        currentStageId,
        weekNumber,
      );
      if (!outcome) {
        toast.error("Failed to create outcome");
        return;
      }

      // Apply custom title/description if provided
      if (customTitle) outcome.title = customTitle;
      if (customDescription) outcome.description = customDescription;

      // Generate tasks from outcome
      const newTasks = generateTasksFromOutcome(
        outcome,
        user.id,
        currentStageId,
        templateId,
      );

      // Save to backend (async)
      await coreEngineApi.saveTasks(user.id, newTasks);
      await coreEngineApi.saveWeeklyOutcome(user.id, outcome);

      // Refresh data from backend
      await refreshExecutionData();
      toast.success("🎯 Weekly outcome set!", {
        description: `${outcome.title} - Let's make it happen this week!`,
      });
      setShowOutcomeModal(false);
    } catch (error) {
      console.error("Error setting outcome:", error);
      toast.error("Failed to set outcome", {
        description: "Please try again",
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  const handleToggleTask = async (taskId) => {
    try {
      // Toggle task in backend (async)
      await coreEngineApi.toggleTask(user.id, taskId);

      // Sync milestones and outcome progress
      await coreEngineApi.syncTasksToMilestones(user.id);

      // Refresh data from backend
      await refreshExecutionData();
      toast.success("Task updated! ✓");
    } catch (error) {
      console.error("Error toggling task:", error);
      toast.error("Failed to update task");
    }
  };
  const handleBlockTask = async (taskId, reason, note) => {
    try {
      // Block task in backend (async)
      await coreEngineApi.blockTask(user.id, taskId, reason, note);

      // Sync milestones
      await coreEngineApi.syncTasksToMilestones(user.id);

      // Refresh data
      await refreshExecutionData();
      toast.info("Task marked as blocked", {
        description: "Your team will be notified",
      });

      // Send email notification to founder (MVP Gap 3)
      const updatedTasks = await coreEngineApi.getTasks(user.id);
      const task = updatedTasks.find((t) => t.id === taskId);
      if (task && task.assignedToName && user.email) {
        const { sendTaskBlockedNotification } =
          await import("../../utils/emailNotifications");
        sendTaskBlockedNotification(
          user.email,
          user.name,
          task.title,
          reason,
          note,
          task.assignedToName,
        ).catch((err) => console.warn("Email notification failed:", err));
      }
    } catch (error) {
      console.error("Error blocking task:", error);
      toast.error("Failed to block task");
    }
  };
  const handleUnblockTask = async (taskId) => {
    try {
      // Unblock task in backend (async)
      await coreEngineApi.unblockTask(user.id, taskId);

      // Sync milestones
      await coreEngineApi.syncTasksToMilestones(user.id);

      // Refresh data
      await refreshExecutionData();
      toast.success("Task unblocked!");
    } catch (error) {
      console.error("Error unblocking task:", error);
      toast.error("Failed to unblock task");
    }
  };
  const handleAssignTask = async (taskId, assignedTo, assignedToName) => {
    try {
      // Assign task in backend (async)
      await coreEngineApi.assignTask(
        user.id,
        taskId,
        assignedTo,
        assignedToName,
      );

      // Refresh data
      await refreshExecutionData();
      if (assignedToName) {
        toast.success(`Task assigned to ${assignedToName}! 👤`);

        // Send email notification (MVP Gap 3)
        const updatedTasks = await coreEngineApi.getTasks(user.id);
        const task = updatedTasks.find((t) => t.id === taskId);
        const teamMember = teamMembers.find((m) => m.id === assignedTo);
        if (task && teamMember?.email) {
          const { sendTaskAssignedNotification } =
            await import("../../utils/emailNotifications");
          sendTaskAssignedNotification(
            teamMember.email,
            assignedToName,
            task.title,
            task.description || "",
            user.name,
            task.milestoneName || "General Tasks",
          ).catch((err) => console.warn("Email notification failed:", err));
        }
      } else {
        toast.success("Task unassigned");
      }
    } catch (error) {
      console.error("Error assigning task:", error);
      toast.error("Failed to assign task");
    }
  };
  const handleSetTaskIncentive = async (taskId, incentive) => {
    try {
      // Set task incentive in backend (async)
      await coreEngineApi.setTaskIncentive(user.id, taskId, incentive);

      // Refresh data
      await refreshExecutionData();
      const incentiveLabel =
        incentive.type === "equity"
          ? `${incentive.equity} equity`
          : incentive.type === "paid"
            ? incentive.pay
            : incentive.type === "hourly"
              ? incentive.hourlyRate
              : "unpaid/volunteer";
      toast.success(`Incentive set: ${incentiveLabel} 💰`);
    } catch (error) {
      console.error("Error setting task incentive:", error);
      toast.error("Failed to set incentive");
    }
  };
  const handleConfirmIntent = async (
    parsedIntent,
    customTitle,
    customDescription,
  ) => {
    if (!executionData) return;
    try {
      setIsRefreshing(true);

      // Calculate current week number
      const weekNumber = (executionData.weekHistory.length || 0) + 1;

      // Create outcome from parsed intent
      const outcome = createOutcomeFromIntent(parsedIntent, weekNumber);

      // Apply custom overrides if provided
      if (customTitle) outcome.title = customTitle;
      if (customDescription) outcome.description = customDescription;

      // Generate tasks from intent
      const newTasks = generateTasksFromIntent(parsedIntent, outcome, user.id);

      // Save to backend (async)
      await coreEngineApi.saveTasks(user.id, newTasks);
      await coreEngineApi.saveWeeklyOutcome(user.id, outcome);

      // Refresh data from backend
      await refreshExecutionData();
      toast.success("🎯 Weekly outcome set!", {
        description: `${outcome.title} - Powered by your vision!`,
      });
      setShowIntentCaptureModal(false);
    } catch (error) {
      console.error("Error confirming intent:", error);
      toast.error("Failed to set outcome");
    } finally {
      setIsRefreshing(false);
    }
  };

  // ===== PHASE 5: WEEKLY REVIEW HANDLER =====

  const handleCompleteWeeklyReview = async (outcomeId, completionData) => {
    try {
      setIsRefreshing(true);

      // Complete weekly review in backend (async)
      const updatedData = await coreEngineApi.completeWeeklyReview(
        user.id,
        outcomeId,
        completionData,
      );

      // Refresh data from backend
      await refreshExecutionData();

      // Show celebration toast
      if (completionData.achievement === "completed") {
        toast.success("🎉 Outstanding! Week completed!", {
          description: `Streak: ${updatedData.streak} weeks! Keep the momentum going!`,
        });
      } else if (completionData.achievement === "partial") {
        toast.success(`💪 Good progress! Streak: ${updatedData.streak}`, {
          description: "Apply your learnings next week!",
        });
      } else {
        toast.info("Week archived. Fresh start next week!", {
          description: "Every setback is a learning opportunity.",
        });
      }
      setShowWeeklyReviewModal(false);
    } catch (error) {
      console.error("Error completing weekly review:", error);
      toast.error("Failed to complete review");
    } finally {
      setIsRefreshing(false);
    }
  };
  const renderTaskForm = (task) => {
    const isActive = activeTaskId === task.id;
    const isCompleted = completedTasks.has(task.id);
    if (isCompleted) {
      return (
        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-green-900 dark:text-green-100">
              {task.title}
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">
              Completed ✓
            </p>
          </div>
        </div>
      );
    }
    if (!isActive) {
      return (
        <div
          className="flex items-start gap-3 p-4 bg-background border-2 border-border hover:border-primary/50 rounded-lg transition-all cursor-pointer group"
          onClick={() => setActiveTaskId(task.id)}
        >
          <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0 mt-0.5 group-hover:border-primary" />
          <div className="flex-1">
            <p className="font-medium mb-1">{task.title}</p>
            <p className="text-sm text-muted-foreground">{task.description}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="opacity-0 group-hover:opacity-100"
          >
            {"Start "}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      );
    }

    // Active task form
    return (
      <div className="p-6 bg-primary/5 border-2 border-primary rounded-lg space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-lg mb-1">{task.title}</p>
            <p className="text-sm text-muted-foreground">{task.description}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setActiveTaskId(null)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        {task.type === "form" && (
          <div className="space-y-3">
            <Textarea
              placeholder={`Enter your ${task.title.toLowerCase()}...`}
              value={taskFormData[task.id] || ""}
              onChange={(e) =>
                setTaskFormData({
                  ...taskFormData,
                  [task.id]: e.target.value,
                })
              }
              className="min-h-[120px]"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => handleCompleteTask(task.id)}
                disabled={!taskFormData[task.id]?.trim()}
                className="flex-1"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark as Complete
              </Button>
            </div>
          </div>
        )}
        {task.type === "action" && task.id === "find-team" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => {
                  onNavigate?.("startup-office");
                  handleCompleteTask(task.id);
                }}
                className="h-auto py-4"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                <div className="text-left">
                  <div className="font-semibold">Smart Matching</div>
                  <div className="text-xs opacity-90">Find teammates</div>
                </div>
              </Button>
              <Button
                onClick={() => handleCompleteTask(task.id)}
                variant="outline"
                className="h-auto py-4"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                <div className="text-left">
                  <div className="font-semibold">Invite Team</div>
                  <div className="text-xs opacity-70">I have teammates</div>
                </div>
              </Button>
            </div>
          </div>
        )}
        {task.type === "navigation" && task.id === "choose-entity" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-3">
              Navigate to Company Formation to choose your entity type and
              register your company
            </p>
            <Button
              onClick={() => onNavigate?.("formation")}
              className="w-full"
            >
              <Building className="w-4 h-4 mr-2" />
              Go to Company Formation
            </Button>
          </div>
        )}
        {task.type === "action" && task.id !== "find-team" && (
          <Button
            onClick={() => handleCompleteTask(task.id)}
            className="w-full"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Mark as Complete
          </Button>
        )}
      </div>
    );
  };

  // Show loading state while fetching data from backend
  if (isLoading) {
    return (
      <div className="p-2 md:p-3 h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
          <p className="text-sm text-gray-600">
            Loading your execution data...
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="p-2 md:p-3 min-h-screen flex flex-col pt-2 pb-12 md:pb-16">
      {isRefreshing && (
        <div className="fixed top-16 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          <span className="text-sm">Syncing...</span>
        </div>
      )}
      {showProfileModal && !user.onboardingComplete && (
        <ProfileCompletionModal
          role={user.role}
          onComplete={handleProfileComplete}
          onClose={() => setShowProfileModal(false)}
        />
      )}
      {selectedTalent && (
        <TalentProfileModal
          isOpen={isTalentModalOpen}
          onClose={() => {
            setIsTalentModalOpen(false);
            setSelectedTalent(null);
          }}
          talent={selectedTalent}
        />
      )}
      {showSkipWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                Skip This Stage?
              </CardTitle>
              <CardDescription>
                We recommend completing all tasks to build a strong foundation
                for your startup.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {"You've only completed "}
                {tasksCompleted}
                {" of "}
                {currentTasks.length}
                {
                  " tasks. Skipping stages may lead to gaps in your startup's foundation."
                }
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSkipWarning(false)}
                  className="flex-1"
                >
                  Keep Working
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleSkipStage}
                  className="flex-1"
                >
                  Skip Anyway
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-2 md:p-2.5 text-white shadow-md flex-shrink-0">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />
        <div className="relative flex items-center justify-between flex-wrap gap-1.5">
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Rocket className="w-4 h-4 md:w-4.5 md:h-4.5 text-white" />
              </div>
              <div>
                <h1 className="text-sm md:text-base font-bold text-white">
                  {"Welcome back, "}
                  {user.name}
                </h1>
                <p className="text-white/90 text-[10px] md:text-xs mt-0.5">
                  {"Building "}
                  {user.profile?.startupName || "Your Startup"}
                  {" - Let's make progress today!"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {!user.onboardingComplete && (
        <Card className="border-2 border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 mt-1.5 flex-shrink-0">
          <CardContent className="p-1.5">
            <div className="flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-[11px] text-orange-900 dark:text-orange-100">
                  Complete your profile to unlock your journey
                </p>
                <p className="text-[9px] text-orange-700 dark:text-orange-300 mt-0.5">
                  Tell us about your startup to get personalized guidance and
                  team recommendations.
                </p>
                <Button
                  size="sm"
                  className="mt-1 h-5 text-[9px] px-2"
                  onClick={() => setShowProfileModal(true)}
                >
                  Complete Profile
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {user.onboardingComplete && user.startupId && (
        <div className="mt-3">
          <PendingCompensationCard
            startupId={user.startupId}
            founderId={user.id}
            onCompensationSet={() => {
              // Optionally reload team members or show success message
              console.log("✅ Compensation set, reloading team data...");
            }}
          />
        </div>
      )}
      {user.onboardingComplete && (
        <>
          <div className="flex flex-col gap-3 mt-3 mb-2 lg:grid lg:grid-cols-5">
            <div className="flex flex-col lg:col-span-2 min-h-0 lg:max-h-[calc(100vh-140px)]">
              <Card className="border flex flex-col h-full overflow-hidden">
                <CardHeader className="pb-1.5 pt-2 border-b flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRoadmapModal(true)}
                    className="w-full h-7 text-[10px] border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/40 dark:hover:to-purple-900/40 text-gray-700 dark:text-gray-300 flex items-center justify-between px-2.5"
                  >
                    <span className="flex items-center gap-1.5">
                      <Rocket className="w-3.5 h-3.5 text-primary" />
                      <span className="font-semibold">Your Startup Stage</span>
                      <span className="text-[8px] text-muted-foreground">
                        • View all 6 stages
                      </span>
                    </span>
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                </CardHeader>
                <CardContent className="py-2 flex-1 flex flex-col overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
                  <TooltipProvider>
                    <div className="flex items-start justify-between gap-1.5 mb-2">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <div className="w-7 h-7 md:w-7.5 md:h-7.5 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0 shadow-md">
                          <currentStage.icon className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-0.5 mb-0.5">
                            <span className="text-[8px] md:text-[9px] font-medium text-muted-foreground uppercase tracking-wide">
                              Current Stage
                            </span>
                            <Tooltip delayDuration={0}>
                              <TooltipTrigger asChild={true}>
                                <button className="focus:outline-none">
                                  <Info className="w-2.5 h-2.5 text-blue-600 cursor-help" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent
                                side="right"
                                className="max-w-xs bg-gray-900 border-gray-700"
                              >
                                <p className="text-xs text-white">
                                  {currentStage.description}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <h3 className="text-xs md:text-sm font-bold">
                            {currentStage.name}
                          </h3>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-[8px] md:text-[9px] px-1.5 py-0 flex-shrink-0 flex items-center gap-0.5"
                      >
                        <span className="text-[7px]">🤖</span>
                        {"Stage "}
                        {currentStageId}/6
                      </Badge>
                    </div>
                  </TooltipProvider>
                  <div className="space-y-1 mb-2">
                    <div className="flex items-center justify-between text-[9px] md:text-[10px]">
                      <span className="text-muted-foreground">
                        Startup Stage Progress
                      </span>
                      <span className="font-semibold text-primary">
                        {startupStageProgress}%
                      </span>
                    </div>
                    <Progress
                      value={startupStageProgress}
                      className="h-1 bg-primary/10 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-primary/80"
                    />
                    <p className="text-[8px] text-muted-foreground mt-0.5">
                      {startupStageProgress >= 100
                        ? "Journey Complete! 🎉"
                        : `${executionData?.weekHistory.length || 0} outcomes completed • ${currentStage.name}`}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowStageLearningModal(true)}
                    className="w-full h-7 text-[10px] border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 mb-2 flex items-center justify-between px-3"
                  >
                    <span className="flex items-center">
                      Learn About This Stage from YC Experts
                    </span>
                    <div
                      className="ml-2 w-5 h-5 rounded bg-blue-600 dark:bg-blue-500 flex items-center justify-center hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowStageLearningModal(true);
                      }}
                    >
                      <ChevronRight className="w-3 h-3 text-white" />
                    </div>
                  </Button>
                  <div className="mb-2">
                    <CohortMembershipBadge startupId={user.id} />
                  </div>
                  <div className="border-t my-2" />
                  <div className="flex-1 flex flex-col gap-2 py-2">
                    <h3 className="text-[8px] md:text-[9px] font-medium text-muted-foreground uppercase tracking-wide">
                      WEEKLY OUTCOME STREAK
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      <Card className="border shadow-none">
                        <CardContent className="p-1 flex items-center justify-center min-h-[80px] md:min-h-[90px]">
                          <div className="flex flex-col space-y-0.5 items-center text-center">
                            <div className="flex items-center gap-1">
                              <Flame
                                className={`w-5 h-5 ${(executionData?.streak || 0) === 0 ? "text-muted-foreground" : (executionData?.streak || 0) < 4 ? "text-orange-500" : (executionData?.streak || 0) < 8 ? "text-orange-600" : "text-red-500"}`}
                              />
                              <span className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                                {executionData?.streak || 0}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {(executionData?.streak || 0) === 1
                                  ? "wk"
                                  : "wks"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-2 h-2 text-muted-foreground" />
                              <span className="text-[8px] font-medium">
                                {outcomeProgress}% this week
                              </span>
                            </div>
                            <p className="text-[7px] text-muted-foreground">
                              {(executionData?.streak || 0) === 0
                                ? "Start your first week"
                                : "Keep it going!"}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border shadow-none">
                        <CardContent className="p-1.5 flex items-center justify-center min-h-[80px] md:min-h-[90px]">
                          <div className="relative flex flex-col items-center gap-1">
                            <div className="relative">
                              <svg
                                width="60"
                                height="60"
                                viewBox="0 0 60 60"
                                className="transform -rotate-90"
                              >
                                <defs>
                                  <linearGradient
                                    id="progress-grad"
                                    x1="100%"
                                    y1="100%"
                                    x2="0%"
                                    y2="0%"
                                  >
                                    <stop offset="0%" stopColor="#ef4444" />
                                    <stop offset="50%" stopColor="#f97316" />
                                    <stop offset="100%" stopColor="#047857" />
                                  </linearGradient>
                                </defs>
                                <circle
                                  cx="30"
                                  cy="30"
                                  r="25"
                                  stroke="#e5e7eb"
                                  strokeWidth="5"
                                  fill="none"
                                  opacity="0.3"
                                />
                                <circle
                                  cx="30"
                                  cy="30"
                                  r="25"
                                  stroke="url(#progress-grad)"
                                  strokeWidth="5"
                                  fill="none"
                                  strokeLinecap="round"
                                  strokeDasharray={2 * Math.PI * 25}
                                  strokeDashoffset={
                                    2 * Math.PI * 25 -
                                    (outcomeProgress / 100) * 2 * Math.PI * 25
                                  }
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-sm font-bold">
                                  {outcomeProgress}%
                                </span>
                              </div>
                            </div>
                            {executionData?.hasPartialWeeks && (
                              <Badge
                                variant="secondary"
                                className="text-[7px] px-1 py-0"
                              >
                                + partial
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                      <ExecutionScoreInlineCard userId={user.id} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="flex flex-col min-h-0 lg:col-span-3 lg:max-h-[calc(100vh-140px)]">
              <Card className="border flex flex-col h-full overflow-hidden">
                <CardHeader className="flex-shrink-0 pb-1.5 pt-2 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-1 text-xs">
                      <Target className="w-3 h-3 text-green-600" />
                      This Week's Focus
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      {executionData?.currentOutcome?.isOrganizationDriven && (
                        <Tooltip>
                          <TooltipTrigger asChild={true}>
                            <Badge
                              variant="outline"
                              className="text-[7px] md:text-[8px] bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700"
                            >
                              <Building className="w-2.5 h-2.5 mr-0.5" />
                              {executionData.currentOutcome.cohortName ||
                                "Organization"}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-xs">
                            <p className="text-xs">
                              This outcome was automatically set by your
                              accelerator/organization
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {executionData?.currentOutcome && (
                        <Badge
                          variant="outline"
                          className="text-[8px] md:text-[9px]"
                        >
                          {"Week "}
                          {(executionData?.weekHistory.length || 0) + 1}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {executionData?.currentOutcome && (
                    <CardDescription className="mt-0.5 text-[9px] md:text-[10px]">
                      {executionData.currentOutcome.title}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex-1 pt-2 pb-2 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
                  {isLoadingExecutionData ? (
                    <div className="space-y-2 py-3 px-2">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-16 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="w-20 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </div>
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="space-y-1 p-1.5 rounded-lg bg-muted/30 border"
                        >
                          <div className="flex items-center justify-between">
                            <div className="w-3/4 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                            <div className="w-8 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                          </div>
                          <div className="w-full h-0.5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        </div>
                      ))}
                      <div className="flex gap-1.5 pt-2 border-t">
                        <div className="flex-1 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="w-24 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </div>
                    </div>
                  ) : executionData?.currentOutcome ? (
                    <TooltipProvider>
                      <div className="space-y-1.5 md:space-y-2 pb-0.5">
                        <div className="space-y-1 md:space-y-1.5">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[9px] md:text-[10px] font-semibold">
                              Milestones
                            </h4>
                            <span className="text-[8px] md:text-[9px] text-muted-foreground">
                              {
                                executionData.currentOutcome.milestones.filter(
                                  (m) => m.tasksCompleted === m.totalTasks,
                                ).length
                              }
                              /{executionData.currentOutcome.milestones.length}
                              {" complete"}
                            </span>
                          </div>
                          <div className="space-y-1 md:space-y-1.5">
                            {executionData.currentOutcome.milestones.map(
                              (milestone) => {
                                const progress =
                                  milestone.totalTasks > 0
                                    ? (milestone.tasksCompleted /
                                        milestone.totalTasks) *
                                      100
                                    : 0;
                                return (
                                  <div
                                    key={milestone.id}
                                    className="space-y-0.5 md:space-y-1 p-1.5 rounded-lg bg-muted/30 border"
                                  >
                                    <div className="flex items-start justify-between gap-1.5">
                                      <div className="flex-1 min-w-0 flex items-center gap-0.5">
                                        <Tooltip>
                                          <TooltipTrigger asChild={true}>
                                            <button className="focus:outline-none text-left">
                                              <p className="font-medium text-[9px] md:text-[10px]">
                                                {milestone.title}
                                              </p>
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent
                                            side="bottom"
                                            className="max-w-xs bg-gray-900 border-gray-700"
                                          >
                                            <p className="text-xs text-white">
                                              {milestone.description}
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </div>
                                      <Badge
                                        variant={
                                          progress === 100
                                            ? "default"
                                            : "secondary"
                                        }
                                        className="text-[8px] md:text-[9px] px-1 py-0 flex-shrink-0"
                                      >
                                        {milestone.tasksCompleted}/
                                        {milestone.totalTasks}
                                      </Badge>
                                    </div>
                                    <Progress
                                      value={progress}
                                      className="h-0.5"
                                    />
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </div>
                        {deliverables.length > 0 && (
                          <div className="space-y-1 md:space-y-1.5 pt-2 mt-2 border-t">
                            <div className="flex items-center justify-between">
                              <h4 className="text-[9px] md:text-[10px] font-semibold flex items-center gap-1">
                                <FileText className="w-3 h-3 text-blue-600" />
                                Organization Deliverables
                              </h4>
                              <span className="text-[8px] md:text-[9px] text-muted-foreground">
                                {
                                  deliverables.filter((d) => d.mySubmission)
                                    .length
                                }
                                /{deliverables.length}
                                {" submitted"}
                              </span>
                            </div>
                            <div className="space-y-1 md:space-y-1.5">
                              {deliverables.map((deliverable) => {
                                const daysUntil = Math.ceil(
                                  (new Date(deliverable.dueDate).getTime() -
                                    new Date().getTime()) /
                                    (1000 * 60 * 60 * 24),
                                );
                                const isPastDue = daysUntil < 0;
                                const isSubmitted = !!deliverable.mySubmission;
                                const isSubmitting =
                                  submittingDeliverable === deliverable.id;
                                return (
                                  <div
                                    key={deliverable.id}
                                    className="space-y-0.5 md:space-y-1 p-1.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800"
                                  >
                                    <div className="flex items-start justify-between gap-1.5">
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-[9px] md:text-[10px]">
                                          {deliverable.title}
                                        </p>
                                        <p className="text-[8px] text-muted-foreground">
                                          {deliverable.cohortName}
                                          {" • Due "}
                                          {new Date(
                                            deliverable.dueDate,
                                          ).toLocaleDateString()}
                                        </p>
                                      </div>
                                      {isSubmitted ? (
                                        <Badge
                                          variant="outline"
                                          className={`text-[7px] ${deliverable.mySubmission.status === "approved" ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20" : deliverable.mySubmission.status === "needs-revision" ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20" : "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20"}`}
                                        >
                                          {deliverable.mySubmission.status}
                                        </Badge>
                                      ) : isPastDue ? (
                                        <Badge
                                          variant="outline"
                                          className="text-[7px] bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
                                        >
                                          Past Due
                                        </Badge>
                                      ) : daysUntil <= 3 ? (
                                        <Badge
                                          variant="outline"
                                          className="text-[7px] bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20"
                                        >
                                          {daysUntil}d left
                                        </Badge>
                                      ) : (
                                        <Badge
                                          variant="outline"
                                          className="text-[7px]"
                                        >
                                          {daysUntil}d left
                                        </Badge>
                                      )}
                                    </div>
                                    {!isSubmitted && !isSubmitting && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          setSubmittingDeliverable(
                                            deliverable.id,
                                          )
                                        }
                                        className="w-full h-5 text-[8px]"
                                      >
                                        <Upload className="w-2.5 h-2.5 mr-1" />
                                        Submit Work
                                      </Button>
                                    )}
                                    {isSubmitting && (
                                      <div className="space-y-1 pt-1">
                                        <Input
                                          value={
                                            deliverableSubmissionData.submissionUrl
                                          }
                                          onChange={(e) =>
                                            setDeliverableSubmissionData({
                                              ...deliverableSubmissionData,
                                              submissionUrl: e.target.value,
                                            })
                                          }
                                          placeholder="Submission URL"
                                          className="h-5 text-[8px]"
                                        />
                                        <div className="flex gap-1">
                                          <Button
                                            size="sm"
                                            onClick={async () => {
                                              try {
                                                const response = await fetch(
                                                  `${API_BASE_URL}/deliverables/${deliverable.id}/submit`,
                                                  {
                                                    method: "POST",
                                                    headers: {
                                                      Authorization: `Bearer ${getAccessToken()}`,
                                                      "Content-Type":
                                                        "application/json",
                                                    },
                                                    body: JSON.stringify({
                                                      founderId: user.id,
                                                      submissionUrl:
                                                        deliverableSubmissionData.submissionUrl,
                                                      notes:
                                                        deliverableSubmissionData.notes,
                                                      attachments: [],
                                                    }),
                                                  },
                                                );
                                                if (!response.ok)
                                                  throw new Error(
                                                    "Failed to submit",
                                                  );
                                                setDeliverableSubmissionData({
                                                  submissionUrl: "",
                                                  notes: "",
                                                });
                                                setSubmittingDeliverable(null);
                                                loadDeliverables();
                                                toast.success(
                                                  "Deliverable submitted!",
                                                );
                                              } catch (error) {
                                                console.error(
                                                  "Error submitting deliverable:",
                                                  error,
                                                );
                                                toast.error("Failed to submit");
                                              }
                                            }}
                                            disabled={
                                              !deliverableSubmissionData.submissionUrl
                                            }
                                            className="flex-1 h-5 text-[8px]"
                                          >
                                            Submit
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                              setSubmittingDeliverable(null);
                                              setDeliverableSubmissionData({
                                                submissionUrl: "",
                                                notes: "",
                                              });
                                            }}
                                            className="h-5 text-[8px]"
                                          >
                                            Cancel
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        <div className="flex gap-1 md:gap-1.5 pt-1.5 border-t">
                          <Button
                            size="sm"
                            onClick={() => setShowMilestoneDetailView(true)}
                            className="flex-1 h-6 md:h-6.5 text-[9px] md:text-[10px]"
                          >
                            <Eye className="w-2.5 h-2.5 mr-1" />
                            View Tasks
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowWeeklyReviewModal(true)}
                            className="h-6 md:h-6.5 text-[9px] md:text-[10px]"
                          >
                            <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                            Complete Week
                          </Button>
                        </div>
                      </div>
                    </TooltipProvider>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-4 md:py-5 px-2 md:px-3 text-center min-h-[120px]">
                      <Target className="w-8 h-8 md:w-9 md:h-9 text-muted-foreground/30 mb-1.5 md:mb-2" />
                      <h3 className="text-xs md:text-sm font-semibold mb-1">
                        No weekly outcome set yet
                      </h3>
                      <p className="text-[9px] md:text-[10px] text-muted-foreground mb-2 md:mb-3 max-w-md">
                        Set a clear, achievable goal for this week to drive your
                        startup forward
                      </p>
                      <Button
                        onClick={() => setShowOutcomeModal(true)}
                        className="gap-1.5 h-6 md:h-6.5 text-[9px] md:text-[10px]"
                      >
                        <PlayCircle className="w-2.5 h-2.5" />
                        Set This Week's Goal
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          <Card
            className={`mt-1.5 mb-12 md:mb-16 flex-shrink-0 border-l-4 ${smartInsight.variant === "success" ? "border-l-green-500 bg-green-50/50 dark:bg-green-950/20" : smartInsight.variant === "warning" ? "border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20" : smartInsight.variant === "info" ? "border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20" : "border-l-primary bg-primary/5"}`}
          >
            <CardContent className="py-2 px-2.5 md:py-2.5 md:px-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-3">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <Sparkles
                    className={`w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0 mt-0.5 ${smartInsight.variant === "success" ? "text-green-600" : smartInsight.variant === "warning" ? "text-orange-600" : smartInsight.variant === "info" ? "text-blue-600" : "text-primary"}`}
                  />
                  <p className="md:text-xs font-medium flex-1 leading-relaxed text-[11px]">
                    {smartInsight.message}
                  </p>
                </div>
                {smartInsight.action && smartInsight.actionLabel && (
                  <>
                    <div className="hidden md:flex md:items-center md:px-2">
                      <div className="w-px h-12 bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
                    </div>
                    <div className="flex justify-center md:flex md:items-center">
                      <Button
                        size="sm"
                        variant={
                          smartInsight.variant === "success"
                            ? "default"
                            : "outline"
                        }
                        className="h-7 md:h-8 text-[10px] md:text-xs px-4 md:px-5"
                        onClick={() => {
                          if (smartInsight.action === "set-outcome") {
                            setShowOutcomeModal(true);
                          } else if (
                            smartInsight.action === "milestone-detail"
                          ) {
                            setShowMilestoneDetailView(true);
                          } else if (smartInsight.action === "complete-week") {
                            setShowWeeklyReviewModal(true);
                          }
                        }}
                      >
                        {smartInsight.actionLabel}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          <StageLearningModal
            isOpen={showStageLearningModal}
            onClose={() => setShowStageLearningModal(false)}
            stageName={currentStage.name}
            stageKey={currentStage.id.toString()}
          />
          <StageRoadmapModal
            isOpen={showRoadmapModal}
            onClose={() => setShowRoadmapModal(false)}
            journeyProgress={journeyProgress}
            currentStageId={currentStageId}
          />
          <OutcomeSelectionModal
            isOpen={showOutcomeModal}
            onClose={() => setShowOutcomeModal(false)}
            currentStage={currentStageId}
            stageName={currentStage.name}
            weekNumber={(executionData?.weekHistory.length || 0) + 1}
            onSelectOutcome={handleSelectOutcome}
            onOpenIntentCapture={() => {
              setShowOutcomeModal(false);
              setShowIntentCaptureModal(true);
            }}
          />
          <IntentCaptureModal
            isOpen={showIntentCaptureModal}
            onClose={() => setShowIntentCaptureModal(false)}
            stageName={currentStage.name}
            weekNumber={(executionData?.weekHistory.length || 0) + 1}
            onConfirmIntent={handleConfirmIntent}
          />
          {executionData?.currentOutcome && (
            <MilestoneDetailView
              isOpen={showMilestoneDetailView}
              onClose={() => setShowMilestoneDetailView(false)}
              outcome={executionData.currentOutcome}
              tasks={tasks}
              onToggleTask={handleToggleTask}
              onBlockTask={handleBlockTask}
              onUnblockTask={handleUnblockTask}
              onAssignTask={handleAssignTask}
              onSetTaskIncentive={handleSetTaskIncentive}
              teamMembers={teamMembers.map((m) => ({
                id: m.id,
                name: m.name,
                role: m.role,
                avatar: m.avatar,
                status: m.status,
              }))}
              founderId={user.id}
              founderName={user.name}
              onNavigate={onNavigate}
              onVirtualOfficeViewChange={onVirtualOfficeViewChange}
            />
          )}
          {showPhase3Welcome && (
            <Phase3Welcome
              onDismiss={() => {
                setShowPhase3Welcome(false);
                localStorage.setItem(`phase3_welcome_seen_${user.id}`, "true");
              }}
              onStartFlow={() => {
                setShowPhase3Welcome(false);
                localStorage.setItem(`phase3_welcome_seen_${user.id}`, "true");
                setShowOutcomeModal(true);
              }}
            />
          )}
          {executionData?.currentOutcome && (
            <WeeklyReviewModal
              open={showWeeklyReviewModal}
              onClose={() => setShowWeeklyReviewModal(false)}
              outcome={executionData.currentOutcome}
              onComplete={handleCompleteWeeklyReview}
              currentStreak={executionData.streak}
            />
          )}
        </>
      )}
    </div>
  );
}
