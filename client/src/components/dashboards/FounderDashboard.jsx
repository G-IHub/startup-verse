/**
 * StartupVerse Founder Dashboard
 */
import React, { useState, useEffect, useMemo } from "react";
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
import { TalentProfileModal } from "../TalentProfileModal";
import OutcomeSelectionModal from "../execution-engine/OutcomeSelectionModal";
import MilestoneDetailView from "../execution-engine/MilestoneDetailView";
import IntentCaptureModal from "../execution-engine/IntentCaptureModal";
import { WeeklyReviewModal } from "../execution-engine/WeeklyReviewModal";
import ExecutionScoreBreakdownDialog from "../execution-engine/ExecutionScoreBreakdownDialog";
import StageLearningModal from "../learning/StageLearningModal";
import StageRoadmapModal from "../roadmap/StageRoadmapModal";
import CohortMembershipBadge from "../organizations/CohortMembershipBadge";

import { useHomeStore } from "../../state/useHomeStore";
import { useStageTaskStore } from "../../state/useStageTaskStore";
import { useWeeklyLoopStore } from "../../state/useWeeklyLoopStore";
import { useExecutionScoreStore } from "../../state/useExecutionScoreStore";
import { useTeamStore } from "../../state/useTeamStore";
import { useDeliverablesStore } from "../../state/useDeliverablesStore";
import { useJourneyStore } from "../../state/useJourneyStore";
import {
  useNotificationsStore,
  selectUnreadCount,
} from "../../state/useNotificationsStore";

import OrganizationAnnouncementsWidget from "../organizations/OrganizationAnnouncementsWidget";
import OrganizationEventsWidget from "../organizations/OrganizationEventsWidget";
import { checkAndSendEventReminders } from "../../utils/eventReminders";
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
  Loader2,
} from "lucide-react";
import {
  generateSmartTeamRecommendations,
  getTalentMatchesForRoles,
} from "../../utils/smartTeamMatching";
import { useNavigate } from "react-router-dom";
import { JOURNEY_STAGES } from "../../utils/journeyProgress";
import {
  buildWeeklyPlanCustom,
  buildWeeklyPlanFromIntent,
  buildWeeklyPlanFromTemplate,
  validateWeeklyPlanMilestones,
} from "../../domains/founder/mappers/weeklyPlanPayload.js";
import PendingCompensationCard from "../compensation/PendingCompensationCard";
import * as founderApi from "../../utils/api/founderApi";

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
  const scoreData = useExecutionScoreStore((state) => state.score);
  const storeLoading = useExecutionScoreStore((state) => state.loading);
  const storeUserId = useExecutionScoreStore((state) => state.userId);
  const loadScore = useExecutionScoreStore((state) => state.load);
  const loading = storeLoading && !scoreData;
  const [showBreakdown, setShowBreakdown] = React.useState(false);
  React.useEffect(() => {
    if (userId && String(storeUserId) !== String(userId)) {
      loadScore(userId).catch(() => {});
    }
  }, [userId, storeUserId, loadScore]);
  const getScoreColor = (score) => {
    if (score >= 80) return "text-status-success";
    if (score >= 60) return "text-primary";
    if (score >= 40) return "text-status-warning";
    return "text-primary";
  };
  return (
    <>
      <Card className="flex flex-col rounded-card border border-surface-border bg-white shadow-soft transition-shadow duration-200 ease-in-out hover:shadow-[0_4px_24px_rgba(58,90,254,0.08)]">
        <CardContent className="flex min-h-[80px] flex-1 flex-col p-4 md:min-h-[90px]">
          <div className="flex flex-1 flex-col items-center justify-center space-y-0.5 text-center">
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4 text-status-warning" />
              <span className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
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
                  className={`font-heading text-3xl font-extrabold ${getScoreColor(scoreData.score)}`}
                >
                  {scoreData.score}
                </span>
                <div className="flex items-center gap-1">
                  {scoreData.weeklyChange !== 0 && (
                    <>
                      {scoreData.weeklyChange > 0 ? (
                        <TrendingUp className="h-2 w-2 text-status-success" />
                      ) : (
                        <TrendingUp className="h-2 w-2 rotate-180 text-status-error" />
                      )}
                      <span className="font-body text-[8px] font-medium text-text-body">
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
              className="flex items-center justify-center gap-0.5 py-0.5 font-body text-[8px] font-medium text-primary transition-colors duration-200 ease-in-out hover:text-primary/80"
            >
              View Breakdown
              <ChevronRight className="w-2 h-2" />
            </button>
          )}
        </CardContent>
      </Card>
      <ExecutionScoreBreakdownDialog
        open={showBreakdown}
        onOpenChange={setShowBreakdown}
        scoreData={scoreData}
      />
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
  const navigate = useNavigate();
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [showSkipWarning, setShowSkipWarning] = useState(false);
  const [teamRecommendations, setTeamRecommendations] = useState([]);
  const [talentMatches, setTalentMatches] = useState([]);
  const [selectedTalent, setSelectedTalent] = useState(null);
  const [isTalentModalOpen, setIsTalentModalOpen] = useState(false);

  // Modal state
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [showIntentCaptureModal, setShowIntentCaptureModal] = useState(false);
  const [showMilestoneDetailView, setShowMilestoneDetailView] = useState(false);
  const [showWeeklyReviewModal, setShowWeeklyReviewModal] = useState(false);
  /** True while saving a new weekly outcome (modal closes; this section shows progress). */
  const [weeklyOutcomeSubmitting, setWeeklyOutcomeSubmitting] =
    useState(false);

  // Deliverable submission form state (UI only; data comes from store)
  const [submittingDeliverable, setSubmittingDeliverable] = useState(null);
  const [deliverableSubmissionData, setDeliverableSubmissionData] = useState({
    submissionUrl: "",
    notes: "",
  });

  // Zustand store subscriptions (primary data layer)
  const homeLoading = useHomeStore((s) => s.loading);
  const homeRefreshing = useHomeStore((s) => s.refreshing);
  const homeBootstrapped = useHomeStore((s) => s.bootstrapped);
  const loadHome = useHomeStore((s) => s.loadAll);
  const refreshHome = useHomeStore((s) => s.refresh);

  const outcomesRaw = useWeeklyLoopStore((s) => s.outcomes);
  const milestonesRaw = useWeeklyLoopStore((s) => s.milestones);
  const weeklyTasksRaw = useWeeklyLoopStore((s) => s.tasks);
  const executionScore = useWeeklyLoopStore((s) => s.executionScore);
  const weeklyLoopLoading = useWeeklyLoopStore((s) => s.loading);
  const weeklyLoopLastLoadedAt = useWeeklyLoopStore((s) => s.lastLoadedAt);
  const weeklyLoop = useWeeklyLoopStore();

  /** API + stores use string id; session user may only have Mongo `_id`. */
  const founderId = useMemo(() => {
    const raw = user?._id ?? user?.id;
    if (raw == null || raw === "") return null;
    return String(raw);
  }, [user?._id, user?.id]);

  const teamMembers = useTeamStore((s) => s.members);

  const deliverables = useDeliverablesStore((s) => s.deliverables);
  const submitDeliverableAction = useDeliverablesStore((s) => s.submit);

  const journeyProgress = useJourneyStore((s) => s.progress);
  const overallProgress = useJourneyStore((s) => s.overallProgress);
  const timeInStage = useJourneyStore((s) => s.timeInStage);

  const stageTaskGetResponse = useStageTaskStore((s) => s.getResponse);
  const stageTaskIsCompleted = useStageTaskStore((s) => s.isCompleted);
  const stageTaskGetCompleted = useStageTaskStore((s) => s.getCompletedTaskIds);
  const stageTaskSave = useStageTaskStore((s) => s.saveResponse);
  const stageTaskMarkComplete = useStageTaskStore((s) => s.markComplete);

  const unreadNotificationsCount = useNotificationsStore(selectUnreadCount);

  const isLoading = homeLoading && !homeBootstrapped;
  const isRefreshing = homeRefreshing;
  const isLoadingExecutionData = weeklyLoopLoading && !executionScore && outcomesRaw.length === 0;

  // Derive the legacy `executionData` shape from store state for minimal UI churn.
  const executionData = useMemo(() => {
    if (!founderId) return null;
    const idKey = (v) => {
      if (v == null || v === "") return "";
      if (typeof v === "object") {
        if (typeof v.toString === "function") {
          const s = v.toString();
          if (s && s !== "[object Object]") return s;
        }
        return String(v._id ?? v.id ?? "");
      }
      return String(v);
    };
    const outcomes = Array.isArray(outcomesRaw) ? outcomesRaw : [];
    const milestones = Array.isArray(milestonesRaw) ? milestonesRaw : [];
    const isStatus = (row, target) =>
      String(row?.status || "").toLowerCase() === target;
    const sortedOutcomes = [...outcomes].sort(
      (a, b) =>
        new Date(b.weekOf || b.createdAt || 0) -
        new Date(a.weekOf || a.createdAt || 0),
    );
    const activeRaw =
      sortedOutcomes.find((o) => isStatus(o, "active")) || null;
    const completedOutcomes = outcomes.filter(
      (o) =>
        isStatus(o, "completed") ||
        isStatus(o, "partial") ||
        isStatus(o, "missed"),
    );
    const hasPartialWeeks = outcomes.some((o) => isStatus(o, "partial"));
    const streak = Number(
      executionScore?.currentStreak ||
        executionScore?.streak ||
        executionScore?.streakCount ||
        0,
    );

    let currentOutcome = activeRaw;
    if (activeRaw) {
      const oid = idKey(activeRaw._id ?? activeRaw.id);
      const linked = milestones.filter((m) => idKey(m.weeklyOutcomeId) === oid);
      const title = activeRaw.goal || activeRaw.title || "This week";
      const weekNumber = completedOutcomes.length + 1;

      if (linked.length > 0) {
        currentOutcome = {
          ...activeRaw,
          id: activeRaw._id || activeRaw.id,
          title,
          weekNumber,
          milestones: linked.map((m) => {
            const total = Number(m.totalTasks ?? 0);
            const done = Number(m.tasksCompleted ?? 0);
            let status = String(m.status || "pending").toLowerCase();
            if (total > 0 && done >= total) status = "completed";
            else if (done > 0) status = "in-progress";
            return {
              id: String(m._id || m.id),
              title: m.title,
              description: m.description || "",
              status,
              tasksCompleted: done,
              totalTasks: total,
            };
          }),
        };
      } else {
        currentOutcome = {
          ...activeRaw,
          id: activeRaw._id || activeRaw.id,
          title,
          weekNumber,
          milestones: Array.isArray(activeRaw.milestones)
            ? activeRaw.milestones
            : [],
        };
      }
    }

    return {
      userId: founderId,
      currentOutcome,
      streak,
      hasPartialWeeks,
      weekHistory: completedOutcomes.map((o) => ({
        outcomeId: o.id || o._id,
        title: o.goal || o.title,
        weekNumber: o.weekNumber,
        status: o.status,
        completedDate: o.completedAt || "",
        progressPercentage: o.completionPercentage || 0,
        completionData: o.completionData,
        achievement: o.completionData?.achievement || o.status,
      })),
      lastUpdated: weeklyLoopLastLoadedAt,
    };
  }, [
    outcomesRaw,
    milestonesRaw,
    executionScore,
    founderId,
    weeklyLoopLastLoadedAt,
  ]);

  // Tasks filtered to the current outcome. Avoid `undefined === undefined` on weekId,
  // which previously matched every task and inflated counts (e.g. 58 vs 9 in the modal).
  const tasks = useMemo(() => {
    const all = Array.isArray(weeklyTasksRaw) ? weeklyTasksRaw : [];
    const current = executionData?.currentOutcome;
    if (!current) return [];
    const curOutcomeId = String(current.id || current._id || "");
    const milestoneIds = new Set(
      (current.milestones || []).map((m) => String(m.id || m._id || "")),
    );
    return all.filter((t) => {
      const mid = String(t.milestoneId ?? "");
      if (mid && milestoneIds.has(mid)) return true;

      const taskOutcomeId = String(
        t.outcomeId ?? t.raw?.weeklyOutcomeId ?? "",
      );
      if (curOutcomeId && taskOutcomeId && taskOutcomeId === curOutcomeId) {
        return true;
      }

      const tw = t.weekId ?? t.raw?.weekId;
      const cw = current.weekId ?? current.raw?.weekId;
      if (tw != null && cw != null && String(tw) === String(cw)) return true;

      return false;
    });
  }, [weeklyTasksRaw, executionData]);

  // Stage Learning Modal State
  const [showStageLearningModal, setShowStageLearningModal] = useState(false);

  // Stage Roadmap Modal State
  const [showRoadmapModal, setShowRoadmapModal] = useState(false);

  // Refs for height syncing
  const leftColumnRef = React.useRef(null);
  const rightCardRef = React.useRef(null);
  const teamSize = teamMembers.length + 1;

  // Orchestrate Home hydration through the Zustand stores.
  // Guarded by founderId so we never fire `/founders/undefined/...` requests.
  useEffect(() => {
    if (!founderId) return undefined;

    checkAndSendEventReminders(founderId).catch((err) => {
      console.warn("Event reminder check failed:", err);
    });

    loadHome({ userId: founderId, startupId: user.startupId || founderId }).catch(
      (error) => {
        console.warn("Home data load failed:", error);
      },
    );

    return undefined;
  }, [founderId, user?.startupId, loadHome]);

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

  // Calculate stage completion based on tasks (from store)
  const completedTaskIdsForStage = stageTaskGetCompleted(currentStageId);
  const completedTasksSet = new Set(completedTaskIdsForStage);
  const tasksCompleted = currentTasks.filter((task) =>
    completedTasksSet.has(task.id),
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

  const unreadNotifications = unreadNotificationsCount;
  const onlineMembers =
    teamMembers.filter((m) => m.status === "online" || m.isOnline).length + 1;

  // 🎯 Generate Inspirational Startup Insight - Company stories + motivational coaching
  const getSmartInsight = () => {
    const weekNumber = (executionData?.weekHistory.length || 0) + 1;
    const totalTasks = tasks.length;
    const taskDone = (t) =>
      Boolean(t?.completed) || String(t?.status || "").toLowerCase() === "completed";
    const taskBlocked = (t) =>
      Boolean(t?.blocked) || String(t?.status || "").toLowerCase() === "blocked";
    const completedTasksCount = tasks.filter(taskDone).length;
    const blockedTasksCount = tasks.filter(taskBlocked).length;
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
        `Discord shipped their first stable voice chat in 72 hours during beta testing when a critical bug blocked everything. You're at ${outcomeProgress}% completion with just ${tasks.filter((t) => !taskDone(t)).length} task${tasks.filter((t) => !taskDone(t)).length !== 1 ? "s" : ""} remaining—you're in the final sprint. Studies show 80% → 100% is where most teams lose focus and add scope. Stay disciplined. Finish this week strong and you'll be in the top 12% of startups who actually complete their weekly outcomes.`,
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

  const [startupMissingBanner, setStartupMissingBanner] = useState(false);
  useEffect(() => {
    if (!founderId || !user?.onboardingComplete) {
      setStartupMissingBanner(false);
      return;
    }
    let cancelled = false;
    founderApi.getFounderStartupSafe(founderId).then((doc) => {
      if (!cancelled) setStartupMissingBanner(!doc);
    });
    return () => {
      cancelled = true;
    };
  }, [founderId, user?.onboardingComplete]);
  const handleCompleteTask = async (taskId) => {
    const textForTask = stageTaskGetResponse(currentStageId, taskId)?.text || "";
    await stageTaskMarkComplete(founderId, currentStageId, taskId, textForTask);

    const newCompletedIds = useStageTaskStore.getState().getCompletedTaskIds(currentStageId);
    const newCount = newCompletedIds.length;
    const newProgress = currentTasks.length > 0 ? (newCount / currentTasks.length) * 100 : 0;
    useJourneyStore.getState().setStageCompletion(
      currentStageId,
      Math.min(newProgress, 95),
    );
    toast.success("Task completed! 🎉", {
      description: "Great progress on your startup journey!",
    });
    setActiveTaskId(null);

    if (newCount >= currentTasks.length) {
      toast.success("🎊 Stage Complete!", {
        description: `You've finished ${currentStage.name}! Ready to move to the next stage?`,
        action: {
          label: "Continue",
          onClick: handleCompleteStage,
        },
      });
    }
  };
  const handleCompleteStage = () => {
    const completedCount = stageTaskGetCompleted(currentStageId).length;
    useJourneyStore.getState().completeStage({
      method: "completed",
      tasksCompletedCount: completedCount,
      tasksTotal: currentTasks.length,
    });
    toast.success("🚀 Moving to next stage!", {
      description: `Welcome to ${JOURNEY_STAGES[currentStageId]?.name || "the next phase"}!`,
    });
  };
  const handleSkipStage = () => {
    setShowSkipWarning(false);
    const completedCount = stageTaskGetCompleted(currentStageId).length;
    useJourneyStore.getState().completeStage({
      method: "skipped",
      tasksCompletedCount: completedCount,
      tasksTotal: currentTasks.length,
    });
    toast.success("🚀 Moving to next stage!", {
      description: `Welcome to ${JOURNEY_STAGES[currentStageId]?.name || "the next phase"}!`,
    });
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
      await refreshHome();
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh data");
    }
  };

  // ===== EXECUTION ENGINE HANDLERS =====

  const handleSelectOutcome = async (
    templateId,
    customTitle,
    customDescription,
    customMilestones,
  ) => {
    if (!founderId) {
      toast.error("Could not identify your account", {
        description: "Please sign in again, then set your weekly goal.",
      });
      throw new Error("Missing founder id");
    }
    const weekNumber = (executionData?.weekHistory?.length ?? 0) + 1;

    const plan =
      templateId === "custom"
        ? buildWeeklyPlanCustom(
            customTitle,
            customDescription,
            currentStageId,
            weekNumber,
            outcomesRaw,
            customMilestones,
          )
        : buildWeeklyPlanFromTemplate(
            templateId,
            currentStageId,
            weekNumber,
            { customTitle, customDescription, customMilestones },
            outcomesRaw,
          );
    if (!plan?.goal) {
      toast.error("Failed to create outcome", {
        description:
          templateId === "custom"
            ? "Add a title and description for your weekly goal."
            : "Pick a template or try another stage.",
      });
      return;
    }

    const milestoneCheck = validateWeeklyPlanMilestones(plan.milestones);
    if (!milestoneCheck.ok) {
      toast.error("Complete each milestone", {
        description: milestoneCheck.message,
      });
      return;
    }

    setWeeklyOutcomeSubmitting(true);
    setShowOutcomeModal(false);
    try {
      await weeklyLoop.saveWeeklyPlan(plan, founderId);
      await refreshHome();

      toast.success("🎯 Weekly outcome set!", {
        description: `${plan.goal} - Let's make it happen this week!`,
      });
    } catch (error) {
      console.error("Error setting outcome:", error);
      toast.error("Failed to set outcome", {
        description:
          error?.message ||
          "Could not save your weekly plan. Create a startup profile first if you have not.",
      });
      setShowOutcomeModal(true);
    } finally {
      setWeeklyOutcomeSubmitting(false);
    }
  };
  const taskIdStr = (t) => String(t?.id ?? t?._id ?? "");

  const handleCommitTaskDraft = async (payload) => {
    const baseline = payload?.baselineTasks ?? [];
    const draft = payload?.draftTasks ?? [];
    const baselineMilestones = Array.isArray(payload?.baselineMilestones)
      ? payload.baselineMilestones
      : [];
    const draftMilestones = Array.isArray(payload?.draftMilestones)
      ? payload.draftMilestones
      : [];
    const skip = { skipRefresh: true };
    const baseById = new Map(baseline.map((t) => [taskIdStr(t), t]));
    const baselineMidSet = new Set(
      baselineMilestones.map((m) => String(m.id)),
    );
    const weeklyOutcomeId = executionData?.currentOutcome?.id;
    const milestoneIdMap = new Map();

    try {
      const milestonesPayload = draftMilestones.map((m) => ({
        title: m.title,
        tasks: draft
          .filter((t) => String(t.milestoneId ?? "") === String(m.id))
          .map((t) => ({ title: t.title })),
      }));
      const milestoneCheck = validateWeeklyPlanMilestones(milestonesPayload);
      if (!milestoneCheck.ok) {
        toast.error("Cannot save week plan", {
          description: milestoneCheck.message,
        });
        throw new Error(milestoneCheck.message);
      }

      const draftTaskIdSet = new Set(draft.map((t) => taskIdStr(t)));
      const draftMilestoneIdSet = new Set(
        draftMilestones.map((m) => String(m.id)),
      );
      const deletedMilestoneIdSet = new Set(
        baselineMilestones
          .filter((bm) => !draftMilestoneIdSet.has(String(bm.id)))
          .map((bm) => String(bm.id)),
      );

      for (const mid of deletedMilestoneIdSet) {
        if (mid.startsWith("temp-ms-")) continue;
        await weeklyLoop.deleteMilestone(mid, skip);
      }

      for (const t of baseline) {
        const tid = taskIdStr(t);
        if (tid.startsWith("temp-task-")) continue;
        if (draftTaskIdSet.has(tid)) continue;
        const tMid = String(t.milestoneId || "");
        if (deletedMilestoneIdSet.has(tMid)) continue;
        await weeklyLoop.deleteTask(tid, skip);
      }

      for (const dm of draftMilestones) {
        const mid = String(dm.id);
        if (baselineMidSet.has(mid)) continue;
        const titleRaw = String(dm.title || "").trim();
        const title = titleRaw.slice(0, 200);
        const created = await weeklyLoop.saveMilestone(
          {
            title,
            description: String(dm.description || "").trim().slice(0, 5000),
            weeklyOutcomeId,
            sequence:
              Number(dm.sequence) ||
              draftMilestones.findIndex((x) => String(x.id) === mid) + 1,
          },
          skip,
        );
        const realId = String(created?._id || created?.id || "");
        if (realId) milestoneIdMap.set(mid, realId);
      }

      for (const dm of draftMilestones) {
        const mid = String(dm.id);
        if (!baselineMidSet.has(mid)) continue;
        const bm = baselineMilestones.find((b) => String(b.id) === mid);
        if (!bm) continue;
        if (
          String(bm.title || "").trim() !== String(dm.title || "").trim() ||
          String(bm.description || "").trim() !==
            String(dm.description || "").trim()
        ) {
          const nextTitle = String(dm.title || "").trim();
          await weeklyLoop.updateMilestone(
            mid,
            {
              title: nextTitle.slice(0, 200),
              description: String(dm.description || "").trim().slice(0, 5000),
            },
            skip,
          );
        }
      }

      const resolveMilestoneId = (raw) => {
        const s = String(raw ?? "");
        return milestoneIdMap.get(s) || s;
      };

      for (const d of draft) {
        const id = taskIdStr(d);
        const base = baseById.get(id);
        if (!base) {
          const mid = resolveMilestoneId(d.milestoneId);
          if (!mid) continue;
          await weeklyLoop.saveTask(
            {
              title: String(d.title || "").trim().slice(0, 500),
              description: String(d.description || "").trim().slice(0, 5000),
              milestoneId: mid,
              status: d.status || "pending",
              priority: String(d.priority || "medium").toLowerCase(),
              assignedTo: d.assignedTo || null,
              assignedToName: String(d.assignedToName || "").trim(),
              assignedToAvatar: String(d.assignedToAvatar || "").trim(),
            },
            skip,
          );
          continue;
        }

        const wasBlocked = base.status === "blocked";
        const isBlocked = d.status === "blocked";
        const statusChanged = base.status !== d.status;
        const blockMetaChanged =
          isBlocked &&
          (base.blockerReason !== d.blockerReason ||
            base.blockerNote !== d.blockerNote);

        if (isBlocked) {
          const needBlock =
            !wasBlocked || statusChanged || blockMetaChanged;
          if (needBlock) {
            const noteRaw =
              (d.blockerNote && String(d.blockerNote).trim()) || "(none)";
            await weeklyLoop.blockTask(
              id,
              d.blockerReason || "scope",
              noteRaw,
              skip,
            );
            const { sendTaskBlockedNotification } = await import(
              "../../utils/emailNotifications"
            );
            sendTaskBlockedNotification({
              userId: founderId,
              founderEmail: user.email || "",
              founderName: user.name,
              taskTitle: d.title,
              blockerReason: d.blockerReason,
              blockerNote: d.blockerNote,
              teamMemberName: d.assignedToName || "",
            }).catch((err) => console.warn("Email notification failed:", err));
          }
        } else if (!isBlocked && (wasBlocked || statusChanged)) {
          await weeklyLoop.applyTaskStatusTransition(
            id,
            base.status,
            d.status,
            skip,
          );
        }

        const bp = String(base.priority || "medium").toLowerCase();
        const dp = String(d.priority || "medium").toLowerCase();
        if (["low", "medium", "high"].includes(dp) && bp !== dp) {
          await weeklyLoop.setTaskPriority(id, dp, skip);
        }

        const a0 = String(base.assignedTo ?? "");
        const a1 = String(d.assignedTo ?? "");
        const n0 = base.assignedToName || "";
        const n1 = d.assignedToName || "";
        const v0 = base.assignedToAvatar || "";
        const v1 = d.assignedToAvatar || "";
        if (a0 !== a1 || n0 !== n1 || v0 !== v1) {
          await weeklyLoop.assignTask(id, a1, n1, v1, skip);
          if (n1 && a1) {
            const teamMember = teamMembers.find((m) => m.id === a1);
            const { sendTaskAssignedNotification } = await import(
              "../../utils/emailNotifications"
            );
            sendTaskAssignedNotification({
              userId: a1,
              teamMemberEmail: teamMember?.email || "",
              teamMemberName: n1,
              taskTitle: d.title,
              taskDescription: d.description || "",
              founderName: user.name,
              milestoneName: d.milestoneName || "General Tasks",
            }).catch((err) => console.warn("Email notification failed:", err));
          }
        }

        const bt = String(base.title || "").trim();
        const dt = String(d.title || "").trim();
        const bde = String(base.description || "").trim();
        const dde = String(d.description || "").trim();
        if (bt !== dt || bde !== dde) {
          await weeklyLoop.updateTaskPatch(
            id,
            { title: dt.slice(0, 200), description: dde },
            skip,
          );
        }
      }

      await weeklyLoop.refresh();
      toast.success("Week plan updated");
    } catch (error) {
      console.error("Error saving task changes:", error);
      toast.error("Failed to save task changes", {
        description:
          error?.message &&
          String(error.message).length > 0 &&
          error.message !== "Failed to save task changes"
            ? error.message
            : undefined,
      });
      throw error;
    }
  };
  const handleSetTaskIncentive = async (taskId, incentive) => {
    try {
      await weeklyLoop.setTaskIncentive(taskId, incentive);
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
    if (!founderId) {
      toast.error("Could not identify your account", {
        description: "Please sign in again, then set your weekly goal.",
      });
      throw new Error("Missing founder id");
    }
    const weekNumber = (executionData?.weekHistory?.length ?? 0) + 1;

    const plan = buildWeeklyPlanFromIntent(
      parsedIntent,
      weekNumber,
      {
        customTitle,
        customDescription,
      },
      outcomesRaw,
    );
    if (!plan?.goal) {
      toast.error("Failed to set outcome");
      return;
    }

    const milestoneCheck = validateWeeklyPlanMilestones(plan.milestones);
    if (!milestoneCheck.ok) {
      toast.error("Complete each milestone", {
        description: milestoneCheck.message,
      });
      return;
    }

    setWeeklyOutcomeSubmitting(true);
    setShowIntentCaptureModal(false);
    try {
      await weeklyLoop.saveWeeklyPlan(plan, founderId);
      await refreshHome();

      toast.success("🎯 Weekly outcome set!", {
        description: `${plan.goal} - Powered by your vision!`,
      });
    } catch (error) {
      console.error("Error confirming intent:", error);
      toast.error("Failed to set outcome", {
        description: error?.message || "Please try again.",
      });
      setShowIntentCaptureModal(true);
    } finally {
      setWeeklyOutcomeSubmitting(false);
    }
  };
  const handleParseIntent = async (inputText) => {
    if (!founderId) {
      throw new Error("Missing founder id");
    }
    return founderApi.parseFounderIntent(founderId, inputText);
  };

  // ===== PHASE 5: WEEKLY REVIEW HANDLER =====

  const handleCompleteWeeklyReview = async (outcomeId, completionData) => {
    try {
      await weeklyLoop.completeWeeklyReview(outcomeId, completionData);
      await refreshHome();

      const streak = Number(
        useWeeklyLoopStore.getState().executionScore?.currentStreak ||
          useWeeklyLoopStore.getState().executionScore?.streak ||
          0,
      );

      if (completionData.achievement === "completed") {
        toast.success("🎉 Outstanding! Week completed!", {
          description: `Streak: ${streak} weeks! Keep the momentum going!`,
        });
      } else if (completionData.achievement === "partial") {
        toast.success(`💪 Good progress! Streak: ${streak}`, {
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
      throw error;
    }
  };
  const renderTaskForm = (task) => {
    const isActive = activeTaskId === task.id;
    const isCompleted = stageTaskIsCompleted(currentStageId, task.id);
    const savedResponse = stageTaskGetResponse(currentStageId, task.id);
    const currentText = savedResponse?.text || "";
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
              value={currentText}
              onChange={(e) =>
                stageTaskSave(founderId, currentStageId, task.id, e.target.value)
              }
              className="min-h-[120px]"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => handleCompleteTask(task.id)}
                disabled={!currentText.trim()}
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
      <div className="h-screen flex items-center justify-center">
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
    <div className="flex min-h-screen flex-col bg-surface-page pb-12 pt-2 font-body md:pb-16">
      {isRefreshing && (
        <div className="fixed top-16 right-4 z-50">
          <span className="inline-flex items-center gap-1.5 rounded-pill border border-primary/20 bg-primary-tint px-3 py-1 font-body text-[10px] font-medium text-primary shadow-sm">
            <div className="inline-block h-2.5 w-2.5 animate-spin rounded-full border border-primary border-t-transparent" />
            Syncing
          </span>
        </div>
      )}
      {startupMissingBanner && (
        <div className="mx-3 md:mx-4 mb-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-sm text-foreground">
            Finish startup setup so weekly goals and execution data can sync to
            your company record.
          </p>
          {onNavigate && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => onNavigate("settings")}
            >
              Open settings
            </Button>
          )}
        </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sv-modal-backdrop">
          <Card className="sv-modal-panel w-full max-w-md rounded-[16px] border-0 shadow-modal">
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
      <div className="flex flex-shrink-0 items-center justify-between rounded-card bg-[linear-gradient(135deg,#3a5afe_0%,#7c4dff_100%)] px-4 py-3 shadow-[0_4px_24px_rgba(58,90,254,0.18)] transition-shadow duration-200 ease-in-out">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-input bg-white/15">
            <Rocket className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="font-heading text-sm font-bold text-white md:text-base">
              {"Welcome back, "}
              {user.name}
            </h1>
            <p className="mt-0.5 font-body text-[10px] text-white/80 md:text-xs">
              {"Building "}
              {user.profile?.startupName || "Your Startup"}
              {" · Let's make progress today!"}
            </p>
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
                  onClick={() => navigate("/onboarding")}
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
            founderId={founderId}
            onCompensationSet={() => {
              // Optionally reload team members or show success message
              console.log("✅ Compensation set, reloading team data...");
            }}
          />
        </div>
      )}
      {user.onboardingComplete && (
        <>
          <div
            className="flex w-full flex-col min-h-[calc(100dvh-11rem)] sm:min-h-[calc(100dvh-12rem)] lg:min-h-[calc(100dvh-13rem)]"
          >
            <div className="flex flex-col gap-6 mt-3 mb-2 lg:grid lg:grid-cols-5 shrink-0">
            <div className="flex flex-col lg:col-span-2 min-h-0 lg:max-h-[calc(100vh-140px)]">
              <Card className="flex h-full flex-col overflow-hidden rounded-card border border-surface-border bg-white shadow-soft transition-all duration-200 ease-in-out hover:border-primary hover:shadow-[0_4px_24px_rgba(58,90,254,0.08)]">
                <CardHeader className="flex-shrink-0 border-b border-surface-border px-4 pb-1.5 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRoadmapModal(true)}
                    className="flex h-7 w-full items-center justify-between border-0 bg-transparent px-2.5 text-[10px] font-body font-medium text-text-body shadow-none transition-all duration-200 ease-in-out hover:bg-surface-page"
                  >
                    <span className="flex items-center gap-1.5">
                      <Rocket className="h-3.5 w-3.5 text-primary" />
                      <span className="font-medium">Your Startup Stage</span>
                      <span className="text-[8px] text-primary">
                        • View all 6 stages
                      </span>
                    </span>
                    <ChevronRight className="h-3 w-3 text-primary" />
                  </Button>
                </CardHeader>
                <CardContent className="py-3 px-4 flex-1 flex flex-col overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
                  <TooltipProvider>
                    <div className="flex items-start justify-between gap-1.5 mb-2">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl bg-primary-tint md:h-8 md:w-8">
                          <currentStage.icon className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-0.5 flex items-center gap-0.5">
                            <span className="font-body text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
                              Current Stage
                            </span>
                            <Tooltip delayDuration={0}>
                              <TooltipTrigger asChild={true}>
                                <button className="focus:outline-none">
                                  <Info className="h-2.5 w-2.5 cursor-help text-primary" />
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
                          <h3 className="font-heading text-xs font-bold text-text-heading md:text-sm">
                            {currentStage.name}
                          </h3>
                        </div>
                      </div>
                      <span className="flex flex-shrink-0 items-center gap-0.5 rounded-pill bg-primary-tint px-2.5 py-0.5 font-body text-[9px] font-semibold text-primary">
                        Stage {currentStageId}/6
                      </span>
                    </div>
                  </TooltipProvider>
                  <div className="space-y-1 mb-2">
                    <div className="flex items-center justify-between text-[9px] md:text-[10px]">
                      <span className="font-body text-text-muted">
                        Startup Stage Progress
                      </span>
                      <span className="font-body font-semibold text-primary">
                        {startupStageProgress}%
                      </span>
                    </div>
                    <Progress
                      value={startupStageProgress}
                      className="h-1.5 border-0 bg-surface-border [&_[data-slot=progress-indicator]]:!bg-gradient-to-r [&_[data-slot=progress-indicator]]:!from-primary [&_[data-slot=progress-indicator]]:!to-accent"
                    />
                    <p className="mt-0.5 font-body text-[8px] text-text-muted">
                      {startupStageProgress >= 100
                        ? "Journey Complete! 🎉"
                        : `${executionData?.weekHistory.length || 0} outcomes completed • ${currentStage.name}`}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowStageLearningModal(true)}
                    className="mb-2 flex h-8 w-full items-center justify-between rounded-input border border-surface-border bg-surface-page px-3 font-body text-[10px] font-medium text-primary transition-all duration-200 ease-in-out hover:border-primary hover:bg-primary-tint"
                  >
                    <span className="flex items-center">
                      Learn About This Stage from YC Experts
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-primary" />
                  </Button>
                  <div className="mb-2">
                    <CohortMembershipBadge startupId={user.startupId || founderId} />
                  </div>
                  <div className="my-2 border-t border-surface-border" />
                  <div className="flex-1 flex flex-col gap-2 py-2">
                    <h3 className="font-body text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
                      Weekly Outcome Streak
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      <Card className="rounded-card border border-surface-border bg-white shadow-soft transition-shadow duration-200 ease-in-out hover:shadow-[0_4px_24px_rgba(58,90,254,0.08)]">
                        <CardContent className="flex min-h-[80px] items-center justify-center p-4 md:min-h-[90px]">
                          <div className="flex flex-col items-center space-y-0.5 text-center">
                            <div className="flex items-center gap-1">
                              <Flame
                                className={`h-5 w-5 ${(executionData?.streak || 0) === 0 ? "text-text-muted/40" : "text-[#ff6b00]"}`}
                              />
                              <span className="font-heading text-3xl font-extrabold text-primary">
                                {executionData?.streak || 0}
                              </span>
                              <span className="font-body text-xs text-text-muted">
                                {(executionData?.streak || 0) === 1
                                  ? "wk"
                                  : "wks"}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center gap-1">
                              <TrendingUp className="h-2.5 w-2.5 text-status-success" />
                              <span className="font-body text-[9px] font-medium text-text-body">
                                {outcomeProgress}% this week
                              </span>
                            </div>
                            <p className="font-body text-[8px] text-text-muted">
                              {(executionData?.streak || 0) === 0
                                ? "Start your first week"
                                : "Keep it going!"}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="rounded-card border border-surface-border bg-white shadow-soft transition-shadow duration-200 ease-in-out hover:shadow-[0_4px_24px_rgba(58,90,254,0.08)]">
                        <CardContent className="flex min-h-[80px] items-center justify-center p-4 md:min-h-[90px]">
                          <div className="relative flex flex-col items-center gap-1">
                            <div className="relative">
                              <svg
                                width="60"
                                height="60"
                                viewBox="0 0 60 60"
                                className="-rotate-90 transform"
                              >
                                <circle
                                  cx="30"
                                  cy="30"
                                  r="25"
                                  className="stroke-surface-border"
                                  strokeWidth="3"
                                  fill="none"
                                />
                                <circle
                                  cx="30"
                                  cy="30"
                                  r="25"
                                  className="stroke-primary"
                                  strokeWidth="3"
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
                                <span className="font-heading text-sm font-bold text-primary">
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
                      <ExecutionScoreInlineCard userId={founderId} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="flex flex-col min-h-0 lg:col-span-3 lg:max-h-[calc(100vh-140px)]">
              <Card className="relative flex h-full flex-col overflow-hidden rounded-card border border-surface-border bg-white shadow-soft transition-all duration-200 ease-in-out hover:shadow-[0_4px_24px_rgba(58,90,254,0.08)]">
                <CardHeader className="flex-shrink-0 border-b border-surface-border px-4 pb-2 pt-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-body text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
                      This Week&#39;s Focus
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
                      {executionData?.currentOutcome && tasks.length > 0 && (
                        <span className="rounded-pill bg-primary-tint px-2 py-0.5 font-body text-[9px] font-semibold text-primary">
                          Week {(executionData?.weekHistory.length || 0) + 1}
                        </span>
                      )}
                    </div>
                  </div>
                  {executionData?.currentOutcome && tasks.length > 0 && (
                    <p className="mt-1 font-body text-[13px] font-medium leading-snug text-text-heading md:text-[14px]">
                      {executionData.currentOutcome.title}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="flex-1 pt-3 px-4 pb-3 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
                  {weeklyOutcomeSubmitting ? (
                    <div
                      className="flex min-h-[120px] flex-col items-center justify-center gap-2 px-4 text-center"
                      role="status"
                      aria-live="polite"
                    >
                      <Loader2
                        className="h-8 w-8 animate-spin text-primary"
                        aria-hidden
                      />
                      <p className="text-xs font-medium text-foreground">
                        Saving your weekly goal…
                      </p>
                      <p className="max-w-[240px] text-[10px] leading-snug text-muted-foreground">
                        We received your request and are updating your plan. This
                        usually takes a few seconds.
                      </p>
                    </div>
                  ) : isLoadingExecutionData ? (
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
                  ) : (
                    <TooltipProvider>
                      {executionData?.currentOutcome && tasks.length > 0 ? (
                      <div className="space-y-1.5 md:space-y-2 pb-0.5">
                        <div className="space-y-1 md:space-y-1.5">
                          <div className="flex items-center justify-between">
                            <h4 className="font-body text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
                              Milestones
                            </h4>
                            <span className="rounded-pill border border-surface-border bg-white px-2 py-0.5 font-body text-[9px] font-medium text-text-muted">
                              {
                                executionData.currentOutcome.milestones.filter(
                                  (m) => m.tasksCompleted === m.totalTasks,
                                ).length
                              }
                              /{executionData.currentOutcome.milestones.length}
                              {" complete"}
                            </span>
                          </div>
                          <div className="space-y-0">
                            {executionData.currentOutcome.milestones.map(
                              (milestone, milestoneIdx) => {
                                const progress =
                                  milestone.totalTasks > 0
                                    ? (milestone.tasksCompleted /
                                        milestone.totalTasks) *
                                      100
                                    : 0;
                                const dotColor =
                                  milestone.status === 'completed'
                                    ? '#00c896'
                                    : milestone.status === 'in-progress'
                                      ? '#3a5afe'
                                      : '#a0a0b0';
                                return (
                                  <div
                                    key={milestone.id}
                                    className={`space-y-1.5 rounded-input border border-surface-border p-2 md:p-2.5 ${
                                      milestoneIdx % 2 === 1
                                        ? 'bg-surface-page'
                                        : 'bg-white'
                                    }`}
                                    style={{ marginBottom: '6px' }}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <span
                                          className="flex-shrink-0 rounded-full"
                                          style={{ width: 6, height: 6, background: dotColor }}
                                        />
                                        <Tooltip>
                                          <TooltipTrigger asChild={true}>
                                            <button className="focus:outline-none text-left">
                                              <p className="font-body text-[9px] font-medium text-text-heading md:text-[10px]">
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
                                      <span className="flex-shrink-0 rounded-pill border border-surface-border bg-white px-1.5 py-0.5 font-body text-[9px] font-medium text-text-muted">
                                        {milestone.tasksCompleted}/{milestone.totalTasks}
                                      </span>
                                    </div>
                                    <Progress
                                      value={progress}
                                      className="h-1 rounded-full border-0 bg-surface-border [&_[data-slot=progress-indicator]]:!bg-gradient-to-r [&_[data-slot=progress-indicator]]:!from-primary [&_[data-slot=progress-indicator]]:!to-accent"
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
                                <FileText className="h-3 w-3 text-primary" />
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
                                          className={`text-[7px] ${deliverable.mySubmission.status === "approved" ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20" : deliverable.mySubmission.status === "revision_requested" || deliverable.mySubmission.status === "needs-revision" ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20" : deliverable.mySubmission.status === "rejected" ? "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20" : "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20"}`}
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
                                                const result =
                                                  await submitDeliverableAction(
                                                    deliverable.id,
                                                    {
                                                      founderId,
                                                      submissionUrl:
                                                        deliverableSubmissionData.submissionUrl,
                                                      notes:
                                                        deliverableSubmissionData.notes,
                                                      attachments: [],
                                                    },
                                                  );
                                                if (!result?.ok) {
                                                  throw result?.error || new Error("Failed to submit");
                                                }
                                                setDeliverableSubmissionData({
                                                  submissionUrl: "",
                                                  notes: "",
                                                });
                                                setSubmittingDeliverable(null);
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
                        <div className="flex gap-2 border-t border-surface-border pt-2">
                          <Button
                            size="sm"
                            onClick={() => setShowMilestoneDetailView(true)}
                            className="flex-1 h-11 rounded-input bg-primary font-body text-[11px] font-semibold text-white shadow-[0_4px_16px_rgba(58,90,254,0.25)] transition-all duration-200 ease-in-out hover:bg-primary-hover"
                          >
                            <Eye className="mr-1.5 h-3 w-3" />
                            View Tasks
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowWeeklyReviewModal(true)}
                            className="h-11 rounded-input border border-surface-border bg-white font-body text-[11px] font-medium text-primary transition-all duration-200 ease-in-out hover:bg-primary-tint"
                          >
                            <CheckCircle2 className="mr-1.5 h-3 w-3" />
                            Complete Week
                          </Button>
                        </div>
                      </div>
                      ) : (
                        <div className="flex min-h-[120px] flex-col items-center justify-center px-2 py-4 text-center md:px-3 md:py-5">
                          <Target className="mb-1.5 h-8 w-8 text-surface-border md:mb-2 md:h-9 md:w-9" />
                          <h3 className="mb-1 font-heading text-xs font-semibold text-text-heading md:text-sm">
                            No weekly outcome set yet
                          </h3>
                          <p className="mb-2 max-w-md font-body text-[9px] text-text-body md:mb-3 md:text-[10px]">
                            Set a clear, achievable goal for this week to drive your
                            startup forward
                          </p>
                          <Button
                            onClick={() => setShowOutcomeModal(true)}
                            className="h-6 gap-1.5 rounded-input bg-primary font-body text-[9px] font-semibold text-white shadow-[0_4px_16px_rgba(58,90,254,0.25)] transition-all duration-200 ease-in-out hover:bg-primary-hover md:h-7 md:text-[10px]"
                          >
                            <PlayCircle className="w-2.5 h-2.5" />
                            Set This Week's Goal
                          </Button>
                        </div>
                      )}
                    </TooltipProvider>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
            {founderId ? (
              <div className="mt-4 grid shrink-0 grid-cols-1 gap-4 lg:grid-cols-2">
                <OrganizationAnnouncementsWidget founderId={founderId} />
                <OrganizationEventsWidget
                  founderId={founderId}
                  founderName={user.name || ""}
                />
              </div>
            ) : null}
            <div className="min-h-6 flex-1 basis-0 sm:min-h-8" aria-hidden />
            <div className="mb-12 flex-shrink-0 md:mb-16">
              <div className="flex flex-col gap-3 border-t border-surface-border bg-surface-page py-3 md:flex-row md:items-center md:justify-between md:gap-4 md:px-1">
                <p className="flex-1 font-body text-[14px] italic leading-relaxed text-text-body">
                  {smartInsight.message}
                </p>
                {smartInsight.action && smartInsight.actionLabel && (
                  <div className="flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-input border border-surface-border bg-white px-4 font-body text-[10px] font-semibold text-primary transition-all duration-200 ease-in-out hover:bg-primary-tint md:text-[11px]"
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
                )}
              </div>
            </div>
          </div>
          <StageLearningModal
            isOpen={showStageLearningModal}
            onClose={() => setShowStageLearningModal(false)}
            stageName={currentStage.name}
            stageKey={currentStage.id.toString()}
            founderId={founderId}
          />
          <StageRoadmapModal
            isOpen={showRoadmapModal}
            onClose={() => setShowRoadmapModal(false)}
            journeyProgress={journeyProgress}
            currentStageId={currentStageId}
            founderId={founderId}
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
            onParseIntent={handleParseIntent}
            onConfirmIntent={handleConfirmIntent}
          />
          {executionData?.currentOutcome && (
            <MilestoneDetailView
              isOpen={showMilestoneDetailView}
              onClose={() => setShowMilestoneDetailView(false)}
              outcome={executionData.currentOutcome}
              tasks={tasks}
              onCommitTaskDraft={handleCommitTaskDraft}
              onSetTaskIncentive={handleSetTaskIncentive}
              teamMembers={teamMembers.map((m) => ({
                id: m.id,
                name: m.name,
                role: m.role,
                avatar: m.avatar,
                status: m.status,
              }))}
              founderId={founderId}
              founderName={user.name}
              founderAvatar={user.avatar || user.profileImage || ""}
              onNavigate={onNavigate}
              onVirtualOfficeViewChange={onVirtualOfficeViewChange}
            />
          )}
          {executionData?.currentOutcome && (
            <WeeklyReviewModal
              open={showWeeklyReviewModal}
              onClose={() => setShowWeeklyReviewModal(false)}
              outcome={executionData.currentOutcome}
              tasks={tasks}
              onComplete={handleCompleteWeeklyReview}
              currentStreak={executionData.streak}
              founderId={founderId}
            />
          )}
        </>
      )}
    </div>
  );
}
