/**
 * 🚀 SMART STAGE PROGRESSION SYSTEM
 *
 * Hybrid + Outcome-Focused Auto-Completion
 *
 * This system automatically progresses founders through the 7-stage journey based on:
 * 1. Template task completion
 * 2. Weekly outcome achievements (keyword-based AI detection)
 * 3. Manual goal/task completion
 * 4. Manual stage completion or skip
 */

// 🎯 STAGE DEFINITIONS (7 stages)
export const STAGES = [
  {
    id: "ideation",
    name: "Ideation & Validation",
    order: 1,
    keywords: [
      "idea",
      "validate",
      "research",
      "market",
      "competitor",
      "interview",
      "survey",
      "mvp concept",
      "problem",
      "solution",
      "customer",
      "pain point",
    ],
  },
  {
    id: "formation",
    name: "Company Formation",
    order: 2,
    keywords: [
      "register",
      "cac",
      "incorporate",
      "company",
      "entity",
      "llc",
      "delaware",
      "founder agreement",
      "cap table",
      "equity",
      "legal",
      "business name",
    ],
  },
  {
    id: "teamBuilding",
    name: "Team Building",
    order: 3,
    keywords: [
      "hire",
      "team",
      "cofounder",
      "recruit",
      "developer",
      "designer",
      "cto",
      "engineer",
      "onboard",
      "equity offer",
      "role",
      "talent",
    ],
  },
  {
    id: "productDev",
    name: "Product Development",
    order: 4,
    keywords: [
      "build",
      "develop",
      "code",
      "prototype",
      "mvp",
      "feature",
      "ship",
      "deploy",
      "launch",
      "beta",
      "test",
      "sprint",
      "product",
      "design",
      "ui",
      "ux",
    ],
  },
  {
    id: "goToMarket",
    name: "Go-to-Market",
    order: 5,
    keywords: [
      "launch",
      "customer",
      "user",
      "marketing",
      "sales",
      "growth",
      "acquisition",
      "onboard",
      "beta",
      "traction",
      "revenue",
      "conversion",
      "campaign",
    ],
  },
  {
    id: "operations",
    name: "Operations & Growth",
    order: 6,
    keywords: [
      "scale",
      "process",
      "operations",
      "metrics",
      "analytics",
      "dashboard",
      "okr",
      "kpi",
      "finance",
      "hiring",
      "revenue",
      "growth",
      "expand",
    ],
  },
  {
    id: "fundraising",
    name: "Scale & Fundraising",
    order: 7,
    keywords: [
      "fundraise",
      "investor",
      "pitch",
      "deck",
      "round",
      "seed",
      "series",
      "venture",
      "capital",
      "valuation",
      "term sheet",
      "raise",
      "funding",
    ],
  },
];

const COMPLETION_THRESHOLD = 80; // % needed to auto-complete stage
const OUTCOME_PROGRESS_PER_MATCH = 25; // % progress per relevant outcome

/**
 * 🔍 Detect which stage a weekly outcome belongs to based on keywords
 */
export function detectOutcomeStage(outcome) {
  const text = `${outcome.title} ${outcome.description || ""}`.toLowerCase();

  // Check each stage's keywords
  for (const stage of STAGES) {
    const matchedKeywords = stage.keywords.filter((keyword) =>
      text.includes(keyword.toLowerCase()),
    );

    // If 2+ keywords match, it's likely this stage
    if (matchedKeywords.length >= 2) {
      return stage.id;
    }
  }

  // Fallback: check for single strong keyword matches
  for (const stage of STAGES) {
    const strongKeywords = stage.keywords.slice(0, 3); // First 3 are strongest
    if (
      strongKeywords.some((keyword) => text.includes(keyword.toLowerCase()))
    ) {
      return stage.id;
    }
  }

  return null;
}

/**
 * 📊 Calculate stage progress from multiple sources
 * Progress = MAX(templateProgress, outcomeProgress, manualProgress)
 */
export function calculateStageProgress(
  stageId,
  templateProgress = 0,
  outcomes = [],
  manualProgress = 0,
) {
  // Filter outcomes for this stage
  const stageOutcomes = outcomes.filter(
    (o) => o.stageId === stageId || detectOutcomeStage(o) === stageId,
  );

  // Calculate outcome-based progress
  const completedOutcomes = stageOutcomes.filter(
    (o) => o.status === "completed",
  ).length;
  const outcomeProgress = Math.min(
    completedOutcomes * OUTCOME_PROGRESS_PER_MATCH,
    100,
  );

  // Return maximum progress from all sources
  return Math.max(templateProgress, outcomeProgress, manualProgress);
}

/**
 * ✅ Check if stage should auto-complete
 */
export function shouldAutoComplete(progress) {
  return progress >= COMPLETION_THRESHOLD;
}

/**
 * 🔓 Get next unlockable stage
 */
export function getNextStage(currentStageId) {
  const currentStage = STAGES.find((s) => s.id === currentStageId);
  if (!currentStage) return null;

  const nextStage = STAGES.find((s) => s.order === currentStage.order + 1);
  return nextStage?.id || null;
}

/**
 * 📈 Update stage progress after weekly outcome completion
 */
export function updateProgressAfterOutcome(stageId, currentProgress, outcome) {
  // Detect if outcome is relevant to this stage
  const detectedStage = detectOutcomeStage(outcome);
  if (detectedStage !== stageId) {
    return currentProgress; // No change
  }

  // Increment outcome progress
  const newOutcomeProgress = Math.min(
    (currentProgress.outcomeProgress || 0) + OUTCOME_PROGRESS_PER_MATCH,
    100,
  );

  // Calculate total progress
  const totalProgress = Math.max(
    currentProgress.templateProgress || 0,
    newOutcomeProgress,
    currentProgress.manualProgress || 0,
  );

  // Check if should auto-complete
  const shouldComplete = shouldAutoComplete(totalProgress);

  return {
    ...currentProgress,
    outcomeProgress: newOutcomeProgress,
    progress: totalProgress,
    status: shouldComplete
      ? "completed"
      : currentProgress.status === "locked"
        ? "in-progress"
        : currentProgress.status,
    completedAt: shouldComplete
      ? new Date().toISOString()
      : currentProgress.completedAt,
    startedAt: currentProgress.startedAt || new Date().toISOString(),
  };
}

/**
 * 🎯 Get completion message for auto-completed stage
 */
export function getCompletionMessage(stageId, outcomes) {
  const stage = STAGES.find((s) => s.id === stageId);
  if (!stage) return "";

  const stageOutcomes = outcomes.filter(
    (o) => o.stageId === stageId || detectOutcomeStage(o) === stageId,
  );

  const nextStage = getNextStage(stageId);
  const nextStageName = STAGES.find((s) => s.id === nextStage)?.name;

  return `🎉 ${stage.name} Complete! You've achieved ${stageOutcomes.length} key outcome${stageOutcomes.length !== 1 ? "s" : ""} in this stage.${nextStageName ? ` ${nextStageName} is now unlocked!` : " Amazing progress!"}`;
}

/**
 * 📋 Load journey progress from localStorage
 */
export function loadJourneyProgress() {
  const saved = localStorage.getItem("founder_journey_progress");
  return saved ? JSON.parse(saved) : {};
}

/**
 * 💾 Save journey progress to localStorage
 */
export function saveJourneyProgress(progress) {
  localStorage.setItem("founder_journey_progress", JSON.stringify(progress));
}

/**
 * 🔄 Process weekly outcome and update all relevant stages
 */
export function processWeeklyOutcome(outcome) {
  const journeyProgress = loadJourneyProgress();
  const updatedStages = [];
  const completedStages = [];
  const unlockedStages = [];

  // Detect which stage this outcome belongs to
  const stageId = outcome.stageId || detectOutcomeStage(outcome);

  if (!stageId) {
    return {
      updatedStages: [],
      completedStages: [],
      unlockedStages: [],
      message: "",
    };
  }

  // Initialize stage if not exists
  if (!journeyProgress[stageId]) {
    journeyProgress[stageId] = {
      status: "in-progress",
      progress: 0,
      startedAt: new Date().toISOString(),
    };
  }

  // Update progress
  const oldProgress = journeyProgress[stageId];
  const newProgress = updateProgressAfterOutcome(stageId, oldProgress, outcome);

  journeyProgress[stageId] = newProgress;
  updatedStages.push(stageId);

  // Check if stage just completed
  if (
    newProgress.status === "completed" &&
    oldProgress.status !== "completed"
  ) {
    completedStages.push(stageId);

    // Unlock next stage
    const nextStageId = getNextStage(stageId);
    if (
      nextStageId &&
      (!journeyProgress[nextStageId] ||
        journeyProgress[nextStageId].status === "locked")
    ) {
      journeyProgress[nextStageId] = {
        status: "available",
        progress: 0,
      };
      unlockedStages.push(nextStageId);
    }
  }

  // Save progress
  saveJourneyProgress(journeyProgress);

  // Generate message
  let message = "";
  if (completedStages.length > 0) {
    const outcomes = [outcome]; // In real implementation, load all outcomes
    message = getCompletionMessage(stageId, outcomes);
  } else if (newProgress.progress > oldProgress.progress) {
    const stage = STAGES.find((s) => s.id === stageId);
    message = `+${OUTCOME_PROGRESS_PER_MATCH}% ${stage?.name} progress! (${newProgress.progress}% total)`;
  }

  return {
    updatedStages,
    completedStages,
    unlockedStages,
    message,
  };
}

/**
 * 🎓 Mark stage as manually completed
 */
export function markStageComplete(
  stageId,
  reason = "Manually marked complete",
) {
  const journeyProgress = loadJourneyProgress();

  journeyProgress[stageId] = {
    ...(journeyProgress[stageId] || {}),
    status: "completed",
    progress: 100,
    completedAt: new Date().toISOString(),
    manualProgress: 100,
  };

  // Unlock next stage
  const nextStageId = getNextStage(stageId);
  if (
    nextStageId &&
    (!journeyProgress[nextStageId] ||
      journeyProgress[nextStageId].status === "locked")
  ) {
    journeyProgress[nextStageId] = {
      status: "available",
      progress: 0,
    };
  }

  saveJourneyProgress(journeyProgress);
}

/**
 * ⏭️ Skip stage
 */
export function skipStage(stageId, reason) {
  const journeyProgress = loadJourneyProgress();

  journeyProgress[stageId] = {
    ...(journeyProgress[stageId] || {}),
    status: "skipped",
    progress: 0,
    completedAt: new Date().toISOString(),
    skipReason: reason,
  };

  // Unlock next stage
  const nextStageId = getNextStage(stageId);
  if (
    nextStageId &&
    (!journeyProgress[nextStageId] ||
      journeyProgress[nextStageId].status === "locked")
  ) {
    journeyProgress[nextStageId] = {
      status: "available",
      progress: 0,
    };
  }

  saveJourneyProgress(journeyProgress);
}

/**
 * 📊 Get overall journey completion percentage
 */
export function getOverallJourneyProgress() {
  const journeyProgress = loadJourneyProgress();
  const totalStages = STAGES.length;

  const completedStages = STAGES.filter(
    (stage) =>
      journeyProgress[stage.id]?.status === "completed" ||
      journeyProgress[stage.id]?.status === "skipped",
  ).length;

  return Math.round((completedStages / totalStages) * 100);
}

/**
 * 🎯 Get current active stage
 */
export function getCurrentStage() {
  const journeyProgress = loadJourneyProgress();

  // Find first in-progress stage
  const inProgressStage = STAGES.find(
    (stage) => journeyProgress[stage.id]?.status === "in-progress",
  );

  if (inProgressStage) return inProgressStage.id;

  // Find first available stage
  const availableStage = STAGES.find(
    (stage) =>
      journeyProgress[stage.id]?.status === "available" ||
      !journeyProgress[stage.id],
  );

  return availableStage?.id || null;
}

/**
 * 🔍 Analyze outcome text and suggest which stage it belongs to
 */
export function analyzeOutcomeForStage(outcomeText) {
  const text = outcomeText.toLowerCase();
  let bestMatch = null;

  for (const stage of STAGES) {
    const matchedKeywords = stage.keywords.filter((keyword) =>
      text.includes(keyword.toLowerCase()),
    );

    if (matchedKeywords.length > 0) {
      const score = matchedKeywords.length;
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = {
          stageId: stage.id,
          keywords: matchedKeywords,
          score,
        };
      }
    }
  }

  if (!bestMatch) {
    return {
      suggestedStage: null,
      confidence: 0,
      matchedKeywords: [],
    };
  }

  // Calculate confidence (0-100)
  const maxPossibleMatches = STAGES.reduce(
    (max, s) => Math.max(max, s.keywords.length),
    0,
  );
  const confidence = Math.min(
    (bestMatch.score / maxPossibleMatches) * 100,
    100,
  );

  return {
    suggestedStage: bestMatch.stageId,
    confidence: Math.round(confidence),
    matchedKeywords: bestMatch.keywords,
  };
}
