/**
 * Outcome-Based Stage Progression System
 *
 * Analyzes weekly outcomes and automatically increments stage progress
 * based on keyword matching and outcome relevance to each stage.
 *
 * This works alongside template completion to provide flexible progression.
 */

import {
  getJourneyProgress,
  updateStageProgress,
  completeCurrentStage,
  JOURNEY_STAGES,
} from "./journeyProgress";
import { syncJourneyProgressToServer } from "./founderJourneyApi.js";
import { useJourneyStore } from "../state/useJourneyStore.js";
import { toast } from "sonner";

/**
 * Stage Keyword Mapping
 * Maps stages to relevant keywords/phrases that indicate progress in that stage
 */
const STAGE_KEYWORDS = {
  1: [
    // Idea & Validation
    "idea",
    "validation",
    "validate",
    "customer interview",
    "market research",
    "target audience",
    "target market",
    "competitor",
    "competition",
    "analysis",
    "problem",
    "solution",
    "value proposition",
    "mvp scope",
    "product-market fit",
    "tam",
    "sam",
    "som",
    "market size",
    "beta user",
    "user feedback",
    "survey",
    "hypothesis",
    "assumption",
    "tested",
    "pivot",
    "niche",
    "persona",
    "pain point",
  ],

  2: [
    // Company Formation
    "register",
    "registration",
    "incorporate",
    "incorporation",
    "cac",
    "delaware",
    "llc",
    "company name",
    "business name",
    "entity",
    "legal",
    "founder agreement",
    "cap table",
    "equity split",
    "shares",
    "vesting",
    "ein",
    "tin",
    "tax id",
    "business bank",
    "corporate account",
    "certificate",
    "memorandum",
    "articles",
    "shareholder",
    "director",
    "secretary",
    "registered",
    "rc number",
  ],

  3: [
    // Team Building
    "hire",
    "hired",
    "recruit",
    "recruited",
    "co-founder",
    "cofounder",
    "team member",
    "cto",
    "cmo",
    "coo",
    "designer",
    "developer",
    "engineer",
    "talent",
    "onboard",
    "onboarded",
    "role",
    "responsibility",
    "team",
    "collaboration",
    "equity offer",
    "compensation",
    "salary",
    "contract",
    "full-time",
    "part-time",
    "freelance",
    "team culture",
    "team values",
    "working agreement",
    "team charter",
  ],

  4: [
    // Product Development
    "mvp",
    "build",
    "built",
    "develop",
    "developed",
    "code",
    "coded",
    "feature",
    "functionality",
    "prototype",
    "wireframe",
    "design",
    "ui",
    "ux",
    "tech stack",
    "database",
    "api",
    "frontend",
    "backend",
    "deploy",
    "deployed",
    "launch",
    "ship",
    "shipped",
    "version",
    "release",
    "beta",
    "testing",
    "bug",
    "fix",
    "sprint",
    "milestone",
    "roadmap",
    "backlog",
    "user story",
    "agile",
  ],

  5: [
    // Go to Market
    "launch",
    "launched",
    "marketing",
    "customer",
    "user",
    "acquisition",
    "growth",
    "channel",
    "traffic",
    "conversion",
    "funnel",
    "campaign",
    "ad",
    "ads",
    "content",
    "seo",
    "social media",
    "email",
    "newsletter",
    "blog",
    "pr",
    "press release",
    "product hunt",
    "first customer",
    "paying customer",
    "sale",
    "revenue",
    "pricing",
    "monetization",
    "onboarding",
    "activation",
    "retention",
  ],

  6: [
    // Growth & Scaling
    "scale",
    "scaling",
    "growth",
    "expand",
    "expansion",
    "hire team",
    "process",
    "automation",
    "metric",
    "kpi",
    "dashboard",
    "analytics",
    "mrr",
    "arr",
    "churn",
    "ltv",
    "cac",
    "unit economics",
    "fundraising",
    "investor",
    "pitch",
    "deck",
    "series",
    "seed",
    "round",
    "valuation",
    "term sheet",
    "dilution",
    "operations",
    "efficiency",
    "optimization",
    "system",
    "infrastructure",
  ],
};

/**
 * Analyze outcome text and determine which stage(s) it relates to
 * Returns stage IDs with confidence scores (0-100)
 */
export function analyzeOutcomeForStages(outcomeTitle, outcomeDescription = "") {
  const text = `${outcomeTitle} ${outcomeDescription}`.toLowerCase();
  const results = [];

  // Check each stage for keyword matches
  Object.entries(STAGE_KEYWORDS).forEach(([stageIdStr, keywords]) => {
    const stageId = parseInt(stageIdStr);
    let matchCount = 0;

    keywords.forEach((keyword) => {
      if (text.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    });

    if (matchCount > 0) {
      // Calculate confidence (percentage of keywords matched)
      const confidence = Math.min(
        100,
        (matchCount / keywords.length) * 100 * 5,
      ); // Boost by 5x
      results.push({ stageId, confidence });
    }
  });

  // Sort by confidence (highest first)
  results.sort((a, b) => b.confidence - a.confidence);

  return results;
}

/**
 * Calculate progress increment based on outcome quality and stage relevance
 * Returns a number between 10-35 representing percentage to add
 */
export function calculateProgressIncrement(
  outcomeTitle,
  outcomeDescription,
  achievement,
  stageConfidence,
) {
  let baseIncrement = 0;

  // Base increment depends on achievement level
  switch (achievement) {
    case "completed":
      baseIncrement = 25; // Completed outcome = 25% base
      break;
    case "partial":
      baseIncrement = 15; // Partial outcome = 15% base
      break;
    case "not-achieved":
      baseIncrement = 5; // Still acknowledge the effort
      break;
  }

  // Adjust based on confidence that outcome relates to stage
  const confidenceMultiplier = stageConfidence / 100;
  const finalIncrement = Math.round(baseIncrement * confidenceMultiplier);

  // Ensure reasonable bounds
  return Math.max(10, Math.min(35, finalIncrement));
}

/**
 * Process a completed weekly outcome and update stage progress
 * This is called after a founder completes their weekly review
 */
export async function processOutcomeForProgression(
  outcomeTitle,
  outcomeDescription,
  achievement,
  whatWorked = "",
  learnings = "",
  userId,
) {
  const progress = getJourneyProgress();
  const currentStage = progress.currentStage;

  // Combine all text for analysis
  const fullText = `${outcomeTitle} ${outcomeDescription} ${whatWorked} ${learnings}`;

  // Analyze which stage(s) this outcome relates to
  const stageMatches = analyzeOutcomeForStages(outcomeTitle, fullText);

  console.log("📊 [OutcomeProgression] Analyzing outcome:", {
    title: outcomeTitle,
    achievement,
    currentStage,
    stageMatches,
  });

  // Update progress for matching stages
  stageMatches.forEach(({ stageId, confidence }) => {
    // Only update current stage and next stage (can work 1 ahead)
    if (stageId === currentStage || stageId === currentStage + 1) {
      const currentProgress =
        progress.stageData[stageId]?.completionPercentage || 0;

      if (currentProgress < 100) {
        const increment = calculateProgressIncrement(
          outcomeTitle,
          outcomeDescription,
          achievement,
          confidence,
        );
        const newProgress = Math.min(100, currentProgress + increment);

        console.log(
          `📈 [OutcomeProgression] Stage ${stageId} progress: ${currentProgress}% → ${newProgress}% (+${increment}%)`,
        );

        updateStageProgress(stageId, newProgress);

        // Show progress notification for current stage only
        if (stageId === currentStage && increment > 0) {
          const stageName =
            JOURNEY_STAGES.find((s) => s.id === stageId)?.name ||
            `Stage ${stageId}`;

          toast.success(`🎯 ${stageName} Progress: ${newProgress}%`, {
            description: `+${increment}% from this week's outcome`,
            duration: 4000,
          });
        }

        // Auto-complete stage if it hits 80%+
        if (newProgress >= 80 && !progress.completedStages.includes(stageId)) {
          autoCompleteStage(stageId);
        }
      }
    }
  });

  // If no stage matches found, give small progress to current stage
  if (stageMatches.length === 0 && achievement !== "not-achieved") {
    const currentProgress =
      progress.stageData[currentStage]?.completionPercentage || 0;
    if (currentProgress < 100) {
      const smallIncrement = achievement === "completed" ? 10 : 5;
      const newProgress = Math.min(100, currentProgress + smallIncrement);

      console.log(
        `📈 [OutcomeProgression] Generic progress for Stage ${currentStage}: ${currentProgress}% → ${newProgress}%`,
      );

      updateStageProgress(currentStage, newProgress);

      // Auto-complete if threshold reached
      if (
        newProgress >= 80 &&
        !progress.completedStages.includes(currentStage)
      ) {
        autoCompleteStage(currentStage);
      }
    }
  }

  if (userId) {
    try {
      await syncJourneyProgressToServer(userId);
      useJourneyStore.getState().refresh();
    } catch (e) {
      console.warn("[OutcomeProgression] Journey sync failed:", e?.message || e);
    }
  }
}

/**
 * Auto-complete a stage when it reaches 80%+ progress
 */
function autoCompleteStage(stageId) {
  const progress = getJourneyProgress();
  const stageName =
    JOURNEY_STAGES.find((s) => s.id === stageId)?.name || `Stage ${stageId}`;

  // Mark as complete if it's the current stage
  if (progress.currentStage === stageId) {
    completeCurrentStage();

    toast.success(`🎉 ${stageName} Complete!`, {
      description: `Next stage unlocked. Keep building!`,
      duration: 6000,
    });

    console.log(
      `✅ [OutcomeProgression] Stage ${stageId} (${stageName}) auto-completed at 80%+`,
    );
  } else {
    // Just mark progress as 100% if working ahead
    updateStageProgress(stageId, 100);
  }
}

/**
 * Get progress summary for display
 */
export function getStageProgressSummary(stageId) {
  const progress = getJourneyProgress();
  const stageData = progress.stageData[stageId];

  // Count outcomes that contributed to this stage (stored in localStorage)
  const outcomeHistory = JSON.parse(
    localStorage.getItem("outcome_stage_history") || "{}",
  );
  const outcomesContributed = outcomeHistory[stageId]?.length || 0;

  // Templates completed (would come from another system)
  const templatesCompleted = stageData?.milestonesCompleted?.length || 0;

  return {
    percentage: stageData?.completionPercentage || 0,
    outcomesContributed,
    templatesCompleted,
  };
}

/**
 * Track which outcomes contributed to which stages (for analytics)
 */
export function trackOutcomeContribution(outcomeId, stageId) {
  const history = JSON.parse(
    localStorage.getItem("outcome_stage_history") || "{}",
  );

  if (!history[stageId]) {
    history[stageId] = [];
  }

  if (!history[stageId].includes(outcomeId)) {
    history[stageId].push(outcomeId);
  }

  localStorage.setItem("outcome_stage_history", JSON.stringify(history));
}

/**
 * Calculate combined progress from all sources
 * (outcomes + templates + manual tasks)
 */
export function calculateCombinedProgress(stageId) {
  const progress = getJourneyProgress();
  const outcomeProgress =
    progress.stageData[stageId]?.completionPercentage || 0;

  // Template completion (check localStorage for template tasks)
  const stageTasks = JSON.parse(
    localStorage.getItem(`stage_${stageId}_tasks`) || "[]",
  );
  const completedTasks = stageTasks.filter((t) => t.completed).length;
  const templateProgress =
    stageTasks.length > 0
      ? Math.round((completedTasks / stageTasks.length) * 100)
      : 0;

  // Take the MAX of both sources (whichever is higher)
  return Math.max(outcomeProgress, templateProgress);
}

/**
 * Export hook for weekly review completion
 */
export async function onWeeklyReviewCompleted(
  outcomeTitle,
  outcomeDescription,
  achievement,
  whatWorked,
  whatDidnt,
  learnings,
  outcomeId,
  userId,
) {
  console.log(
    "🎯 [OutcomeProgression] Weekly review completed, processing for progression...",
  );

  await processOutcomeForProgression(
    outcomeTitle,
    outcomeDescription,
    achievement,
    whatWorked,
    learnings,
    userId,
  );

  // Track this outcome's contribution
  const stageMatches = analyzeOutcomeForStages(
    outcomeTitle,
    `${outcomeDescription} ${whatWorked}`,
  );
  stageMatches.forEach(({ stageId }) => {
    trackOutcomeContribution(outcomeId, stageId);
  });
}
