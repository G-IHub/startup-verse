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
import FounderHomeHero from "./founder/FounderHomeHero";
import FounderMetricsRow from "./founder/FounderMetricsRow";
import FounderQuickActions from "./founder/FounderQuickActions";
import SectionCard from "../organizations/_primitives/SectionCard";
import BrandProgress from "../organizations/_primitives/BrandProgress";

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
  const [showShareOptions, setShowShareOptions] = React.useState(false);
  const [copySuccess, setCopySuccess] = React.useState(false);
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
      <Card className="h-full rounded-card border-0 bg-white shadow-soft transition-shadow duration-200 ease-in-out hover:shadow-[0_4px_24px_rgba(58,90,254,0.08)]">
        <CardContent className="flex h-full items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-input bg-primary-tint text-primary">
            <Zap className="h-4 w-4 text-status-warning" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-body text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
              Score
            </p>
            {loading ? (
              <div className="mt-2 h-7 w-12 animate-pulse rounded bg-surface-border" />
            ) : scoreData ? (
              <>
                <div className="mt-1 flex items-end gap-2">
                  <span
                    className={`font-heading text-[28px] font-extrabold leading-none ${getScoreColor(scoreData.score)}`}
                  >
                    {scoreData.score}
                  </span>
                  {scoreData.weeklyChange !== 0 ? (
                    <span className="flex items-center gap-0.5 pb-1 font-body text-[12px] font-medium text-text-body">
                      {scoreData.weeklyChange > 0 ? (
                        <TrendingUp className="h-3 w-3 text-status-success" />
                      ) : (
                        <TrendingUp className="h-3 w-3 rotate-180 text-status-error" />
                      )}
                      {scoreData.weeklyChange > 0 ? "+" : ""}
                      {scoreData.weeklyChange}
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setShowBreakdown(true)}
                  className="mt-1.5 inline-flex items-center gap-0.5 font-body text-[12px] font-medium text-primary transition-colors hover:text-primary/80"
                >
                  View breakdown
                  <ChevronRight className="h-3 w-3" />
                </button>
              </>
            ) : (
              <>
                <span className="mt-1 block font-heading text-[28px] font-extrabold leading-none text-text-muted">
                  --
                </span>
                <p className="mt-1.5 font-body text-[12px] text-text-muted">
                  Complete week 1
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      {showBreakdown && scoreData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sv-modal-backdrop"
          onClick={() => setShowBreakdown(false)}
        >
          <Card
            className="sv-modal-panel w-full max-w-md rounded-[16px] border-0 shadow-modal"
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

  const [founderLaunchStatus, setFounderLaunchStatus] = useState("loading");
  useEffect(() => {
    if (!founderId) {
      setFounderLaunchStatus("not-launched");
      return;
    }
    let cancelled = false;
    founderApi
      .getFounderPosts(founderId)
      .then((posts) => {
        if (cancelled) return;
        const list = Array.isArray(posts) ? posts : [];
        setFounderLaunchStatus(list.length > 0 ? "launched" : "not-launched");
      })
      .catch(() => {
        if (!cancelled) setFounderLaunchStatus("not-launched");
      });
    return () => {
      cancelled = true;
    };
  }, [founderId]);

  const founderNeedsLaunch = founderLaunchStatus === "not-launched";
  const founderLaunchLoading = founderLaunchStatus === "loading";

  const requestWeeklyOutcome = () => {
    if (founderNeedsLaunch) {
      onNavigate?.("post-startup");
      return;
    }
    setShowOutcomeModal(true);
  };

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

  // Short coaching line for the home footer (≤120 chars). Long stories stay out of the dashboard.
  const getSmartInsight = () => {
    const weekNumber = (executionData?.weekHistory.length || 0) + 1;
    const taskDone = (t) =>
      Boolean(t?.completed) || String(t?.status || "").toLowerCase() === "completed";
    const taskBlocked = (t) =>
      Boolean(t?.blocked) || String(t?.status || "").toLowerCase() === "blocked";
    const blockedTasksCount = tasks.filter(taskBlocked).length;
    const remainingTasks = tasks.filter((t) => !taskDone(t)).length;
    const streakCount = executionData?.streak || 0;

    if (blockedTasksCount > 0) {
      return {
        message: `${blockedTasksCount} blocked task${blockedTasksCount > 1 ? "s" : ""} — unblock to keep the team moving.`,
        action: "milestone-detail",
        actionLabel: "Unblock",
        variant: "warning",
      };
    }

    if (executionData?.currentOutcome && outcomeProgress >= 100) {
      return {
        message:
          streakCount >= 1
            ? `${streakCount}-week streak ready to lock. Complete your review to keep momentum.`
            : `Week ${weekNumber} is done. Complete your review to start a streak.`,
        action: "complete-week",
        actionLabel: "Complete Week",
        variant: "success",
      };
    }

    if (executionData?.currentOutcome && outcomeProgress >= 80) {
      return {
        message: `${outcomeProgress}% done — ${remainingTasks} task${remainingTasks !== 1 ? "s" : ""} left. Finish strong this week.`,
        action: "milestone-detail",
        actionLabel: "View Tasks",
        variant: "default",
      };
    }

    if (executionData?.currentOutcome && outcomeProgress > 0) {
      return {
        message: `${outcomeProgress}% through this week. Keep shipping milestones with your team.`,
        action: "milestone-detail",
        actionLabel: "View Progress",
        variant: "default",
      };
    }

    if (executionData?.currentOutcome) {
      return {
        message: `Week ${weekNumber} is set. Start the first task to build momentum.`,
        action: "milestone-detail",
        actionLabel: "Start Tasks",
        variant: "info",
      };
    }

    // Launch / set-outcome CTAs live on the hero + focus empty state — no duplicate here.
    if (founderNeedsLaunch) {
      return {
        message: "Launch your startup to unlock weekly goals and team matching.",
        variant: "info",
      };
    }

    return {
      message: `Set a clear Week ${weekNumber} outcome — simple, concrete, finishable.`,
      action: "set-outcome",
      actionLabel: "Set Goal",
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
    if (founderNeedsLaunch) {
      toast.info("Launch your startup first", {
        description:
          "Publish your startup post before setting weekly goals.",
      });
      onNavigate?.("post-startup");
      throw new Error("Startup not launched");
    }
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
    if (founderNeedsLaunch) {
      toast.info("Launch your startup first", {
        description:
          "Publish your startup post before setting weekly goals.",
      });
      onNavigate?.("post-startup");
      throw new Error("Startup not launched");
    }
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
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-green-900">
              {task.title}
            </p>
            <p className="text-sm text-green-700">
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
              onClick={() => onNavigate("post-startup")}
            >
              Launch startup
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
      <div className="mx-auto w-full max-w-[1400px] space-y-4 px-1 sm:px-0">
        <FounderHomeHero
          firstName={(user.name || "Founder").split(" ")[0]}
          startupName={
            user.profile?.startupName ||
            user.startupName ||
            ""
          }
          founderNeedsLaunch={founderNeedsLaunch}
          founderLaunchLoading={founderLaunchLoading}
          hasActiveOutcome={Boolean(
            executionData?.currentOutcome && tasks.length > 0,
          )}
          onLaunch={() => onNavigate?.("post-startup")}
          onSetOutcome={requestWeeklyOutcome}
          onViewTasks={() => setShowMilestoneDetailView(true)}
          onBrowseTalent={() => onNavigate?.("team-matching")}
        />
        {user.onboardingComplete && user.startupId && (
          <PendingCompensationCard
            startupId={user.startupId}
            founderId={founderId}
            onCompensationSet={() => {}}
          />
        )}
        {user.onboardingComplete && (
          <>
            <FounderMetricsRow
              streak={executionData?.streak || 0}
              outcomeProgress={outcomeProgress}
              hasPartialWeeks={Boolean(executionData?.hasPartialWeeks)}
              stageName={currentStage.name}
              stageId={currentStageId}
              stageProgress={startupStageProgress}
              stageIcon={currentStage.icon}
              onOpenRoadmap={() => setShowRoadmapModal(true)}
              scoreSlot={<ExecutionScoreInlineCard userId={founderId} />}
            />

            <SectionCard>
              <SectionCard.Header
                title="This Week's Focus"
                description={
                  executionData?.currentOutcome && tasks.length > 0
                    ? executionData.currentOutcome.title
                    : "Set an outcome, ship milestones, and complete the week."
                }
                action={
                  <div className="flex flex-wrap items-center gap-2">
                    {executionData?.currentOutcome?.isOrganizationDriven ? (
                      <Badge
                        variant="outline"
                        className="border-primary/25 bg-primary-tint text-[11px] font-semibold text-primary"
                      >
                        <Building className="mr-1 h-3 w-3" />
                        {executionData.currentOutcome.cohortName ||
                          "Organization"}
                      </Badge>
                    ) : null}
                    {executionData?.currentOutcome && tasks.length > 0 ? (
                      <span className="rounded-pill bg-primary-tint px-2.5 py-1 font-body text-[11px] font-semibold text-primary">
                        Week {(executionData?.weekHistory.length || 0) + 1}
                      </span>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowStageLearningModal(true)}
                      className="h-8 rounded-input border-surface-border font-body text-[12px] font-medium text-primary hover:bg-primary-tint"
                    >
                      Learn stage
                      <ChevronRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </div>
                }
              >
                {user.startupId || founderId ? (
                  <div className="mt-2">
                    <CohortMembershipBadge
                      startupId={user.startupId || founderId}
                    />
                  </div>
                ) : null}
              </SectionCard.Header>
              <SectionCard.Body className="space-y-4">
                {weeklyOutcomeSubmitting ? (
                  <div
                    className="flex min-h-[140px] flex-col items-center justify-center gap-2 px-4 text-center"
                    role="status"
                    aria-live="polite"
                  >
                    <Loader2
                      className="h-8 w-8 animate-spin text-primary"
                      aria-hidden
                    />
                    <p className="font-body text-[13px] font-medium text-text-heading">
                      Saving your weekly goal…
                    </p>
                    <p className="max-w-sm font-body text-[12px] text-text-muted">
                      Updating your plan — this usually takes a few seconds.
                    </p>
                  </div>
                ) : isLoadingExecutionData ? (
                  <div className="space-y-3 py-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="space-y-2 rounded-input border border-surface-border p-3"
                      >
                        <div className="h-3 w-3/4 animate-pulse rounded bg-surface-border" />
                        <div className="h-1.5 w-full animate-pulse rounded bg-surface-border" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <TooltipProvider>
                    {executionData?.currentOutcome && tasks.length > 0 ? (
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-body text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
                              Milestones
                            </h4>
                            <span className="rounded-pill border border-surface-border bg-surface-page px-2.5 py-1 font-body text-[11px] font-medium text-text-muted">
                              {
                                executionData.currentOutcome.milestones.filter(
                                  (m) => m.tasksCompleted === m.totalTasks,
                                ).length
                              }
                              /{executionData.currentOutcome.milestones.length}{" "}
                              complete
                            </span>
                          </div>
                          <div className="space-y-2">
                            {executionData.currentOutcome.milestones.map(
                              (milestone) => {
                                const progress =
                                  milestone.totalTasks > 0
                                    ? (milestone.tasksCompleted /
                                        milestone.totalTasks) *
                                      100
                                    : 0;
                                const tone =
                                  milestone.status === "completed"
                                    ? "success"
                                    : milestone.status === "in-progress"
                                      ? "brand"
                                      : "info";
                                return (
                                  <div
                                    key={milestone.id}
                                    className="space-y-2 rounded-input border border-surface-border bg-surface-page/40 p-3"
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="min-w-0 flex-1">
                                        <Tooltip>
                                          <TooltipTrigger asChild={true}>
                                            <button
                                              type="button"
                                              className="text-left focus:outline-none"
                                            >
                                              <p className="font-body text-[13px] font-semibold text-text-heading">
                                                {milestone.title}
                                              </p>
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent
                                            side="bottom"
                                            className="max-w-xs border border-border bg-popover text-popover-foreground"
                                          >
                                            <p className="text-xs text-white">
                                              {milestone.description}
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </div>
                                      <span className="shrink-0 rounded-pill border border-surface-border bg-white px-2 py-0.5 font-body text-[11px] font-medium text-text-muted">
                                        {milestone.tasksCompleted}/
                                        {milestone.totalTasks}
                                      </span>
                                    </div>
                                    <BrandProgress
                                      value={progress}
                                      tone={
                                        tone === "info" && progress === 0
                                          ? "brand"
                                          : tone
                                      }
                                      className="h-1.5"
                                    />
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </div>
                        {deliverables.length > 0 && (
                          <div className="space-y-3 border-t border-surface-border pt-4">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="flex items-center gap-1.5 font-body text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
                                <FileText className="h-3.5 w-3.5 text-primary" />
                                Organization deliverables
                              </h4>
                              <span className="font-body text-[11px] text-text-muted">
                                {
                                  deliverables.filter((d) => d.mySubmission)
                                    .length
                                }
                                /{deliverables.length} submitted
                              </span>
                            </div>
                            <div className="space-y-2">
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
                                    className="space-y-2 rounded-input border border-primary/20 bg-primary-tint/40 p-3"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="min-w-0 flex-1">
                                        <p className="font-body text-[13px] font-semibold text-text-heading">
                                          {deliverable.title}
                                        </p>
                                        <p className="mt-0.5 font-body text-[12px] text-text-muted">
                                          {deliverable.cohortName}
                                          {" · Due "}
                                          {new Date(
                                            deliverable.dueDate,
                                          ).toLocaleDateString()}
                                        </p>
                                      </div>
                                      {isSubmitted ? (
                                        <Badge
                                          variant="outline"
                                          className="text-[11px] capitalize"
                                        >
                                          {deliverable.mySubmission.status}
                                        </Badge>
                                      ) : isPastDue ? (
                                        <Badge
                                          variant="outline"
                                          className="border-status-error/25 bg-status-error/10 text-[11px] text-status-error"
                                        >
                                          Past due
                                        </Badge>
                                      ) : (
                                        <Badge
                                          variant="outline"
                                          className="text-[11px]"
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
                                        className="h-8 w-full rounded-input text-[12px]"
                                      >
                                        <Upload className="mr-1.5 h-3.5 w-3.5" />
                                        Submit work
                                      </Button>
                                    )}
                                    {isSubmitting && (
                                      <div className="space-y-2 pt-1">
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
                                          className="h-9 text-[13px]"
                                        />
                                        <div className="flex gap-2">
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
                                                  throw (
                                                    result?.error ||
                                                    new Error(
                                                      "Failed to submit",
                                                    )
                                                  );
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
                                            className="h-8 flex-1 text-[12px]"
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
                                            className="h-8 text-[12px]"
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
                        <div className="flex flex-col gap-2 border-t border-surface-border pt-4 sm:flex-row">
                          <Button
                            size="sm"
                            onClick={() => setShowMilestoneDetailView(true)}
                            className="h-10 flex-1 rounded-input bg-primary font-body text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(58,90,254,0.25)] hover:bg-primary-hover"
                          >
                            <Eye className="mr-1.5 h-4 w-4" />
                            View Tasks
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowWeeklyReviewModal(true)}
                            className="h-10 rounded-input border-surface-border bg-white font-body text-[13px] font-medium text-primary hover:bg-primary-tint sm:min-w-[160px]"
                          >
                            <CheckCircle2 className="mr-1.5 h-4 w-4" />
                            Complete Week
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex min-h-[160px] flex-col items-center justify-center px-4 py-8 text-center">
                        {founderLaunchLoading ? (
                          <>
                            <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" />
                            <p className="font-body text-[13px] text-text-muted">
                              Checking your startup profile…
                            </p>
                          </>
                        ) : founderNeedsLaunch ? (
                          <>
                            <Rocket className="mb-3 h-10 w-10 text-surface-border" />
                            <h3 className="mb-1 font-heading text-[16px] font-semibold text-text-heading">
                              Launch your startup first
                            </h3>
                            <p className="mb-4 max-w-md font-body text-[13px] text-text-body">
                              Publish your startup post before setting weekly
                              goals so your team can align with you.
                            </p>
                            <Button
                              onClick={() => onNavigate?.("post-startup")}
                              className="h-10 gap-2 rounded-input bg-primary font-body text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(58,90,254,0.25)] hover:bg-primary-hover"
                            >
                              <Rocket className="h-4 w-4" />
                              Launch Startup
                            </Button>
                          </>
                        ) : (
                          <>
                            <Target className="mb-3 h-10 w-10 text-surface-border" />
                            <h3 className="mb-1 font-heading text-[16px] font-semibold text-text-heading">
                              No weekly outcome set yet
                            </h3>
                            <p className="mb-4 max-w-md font-body text-[13px] text-text-body">
                              Set a clear, achievable goal for this week to drive
                              your startup forward.
                            </p>
                            <Button
                              onClick={requestWeeklyOutcome}
                              className="h-10 gap-2 rounded-input bg-primary font-body text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(58,90,254,0.25)] hover:bg-primary-hover"
                            >
                              <PlayCircle className="h-4 w-4" />
                              Set This Week&apos;s Goal
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </TooltipProvider>
                )}
              </SectionCard.Body>
            </SectionCard>

            <FounderQuickActions onNavigate={onNavigate} />

            {founderId ? (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <OrganizationAnnouncementsWidget founderId={founderId} />
                <OrganizationEventsWidget
                  founderId={founderId}
                  founderName={user.name || ""}
                />
              </div>
            ) : null}

            {smartInsight?.message ? (
              <div className="flex flex-col gap-2 rounded-card border border-surface-border/70 bg-white px-4 py-3 shadow-soft sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <p className="font-body text-[13px] leading-snug text-text-body">
                  {smartInsight.message}
                </p>
                {smartInsight.action && smartInsight.actionLabel ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 shrink-0 rounded-input border-surface-border bg-white px-3 font-body text-[12px] font-semibold text-primary hover:bg-primary-tint"
                    onClick={() => {
                      if (smartInsight.action === "set-outcome") {
                        requestWeeklyOutcome();
                      } else if (smartInsight.action === "milestone-detail") {
                        setShowMilestoneDetailView(true);
                      } else if (smartInsight.action === "complete-week") {
                        setShowWeeklyReviewModal(true);
                      }
                    }}
                  >
                    {smartInsight.actionLabel}
                  </Button>
                ) : null}
              </div>
            ) : null}

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
    </div>
  );
}
