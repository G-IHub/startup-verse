/**
 * Algorithmic Stage Detection
 *
 * This utility determines a startup's stage based on objective facts,
 * NOT founder self-selection. Stages serve the algorithm, not founder ego.
 */

/**
 * Determines initial stage during onboarding based on factual answers
 */
export function determineInitialStage(facts) {
  const {
    hasValidatedIdea,
    hasMVP,
    hasCustomers,
    currentTeamSize,
    monthlyRevenue,
  } = facts;

  // Stage 6: Scale (10+ team, $50K+ MRR, paying customers)
  if (
    currentTeamSize === "10+" &&
    monthlyRevenue === "50k+" &&
    hasCustomers === "yes-paying"
  ) {
    return 6;
  }

  // Stage 5: Growth ($10K+ MRR, 6+ team, paying customers)
  if (
    (monthlyRevenue === "10k-50k" || monthlyRevenue === "50k+") &&
    (currentTeamSize === "6-10" || currentTeamSize === "10+") &&
    hasCustomers === "yes-paying"
  ) {
    return 5;
  }

  // Stage 4: Team Building (4+ team OR $1K+ MRR with team)
  if (
    currentTeamSize === "4-5" ||
    currentTeamSize === "6-10" ||
    currentTeamSize === "10+" ||
    ((monthlyRevenue === "1k-10k" ||
      monthlyRevenue === "10k-50k" ||
      monthlyRevenue === "50k+") &&
      (currentTeamSize === "2-3" || currentTeamSize === "4-5"))
  ) {
    return 4;
  }

  // Stage 3: Early Traction (Has customers/users with MVP)
  if (
    (hasCustomers === "yes-paying" || hasCustomers === "yes-users") &&
    hasMVP === "yes"
  ) {
    return 3;
  }

  // Stage 2: MVP Development (Has validated idea, building or has MVP, but no traction)
  if (
    (hasMVP === "yes" || hasMVP === "in-progress") &&
    hasValidatedIdea === "yes" &&
    hasCustomers === "no"
  ) {
    return 2;
  }

  // Stage 1: Idea Validation (Default - no validated idea or just starting)
  return 1;
}

/**
 * Determines stage progression based on runtime metrics
 * Called periodically (e.g., after outcome completion, milestone achievement)
 */
export function determineStageFromMetrics(metrics, currentStage) {
  const {
    completedOutcomes = 0,
    completedMilestones = 0,
    weeklyStreak = 0,
    totalTasks = 0,
    completedTasks = 0,
    teamSize = 1,
    activeUsers = 0,
    customerCount = 0,
    monthlyRevenue = 0,
  } = metrics;

  const taskCompletionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

  // Stage 6: Scale
  // - 10+ team members
  // - $50K+ MRR
  // - 100+ customers
  // - High execution rate (80%+ task completion)
  if (
    teamSize >= 10 &&
    monthlyRevenue >= 50000 &&
    customerCount >= 100 &&
    taskCompletionRate >= 0.8
  ) {
    return 6;
  }

  // Stage 5: Growth
  // - 6+ team members
  // - $10K+ MRR
  // - 50+ customers
  // - 8+ week streak OR 20+ completed outcomes
  if (
    teamSize >= 6 &&
    monthlyRevenue >= 10000 &&
    customerCount >= 50 &&
    (weeklyStreak >= 8 || completedOutcomes >= 20)
  ) {
    return Math.max(5, currentStage); // Never regress
  }

  // Stage 4: Team Building
  // - 4+ team members OR
  // - $1K+ MRR with 3+ team members
  // - 10+ customers
  // - 12+ completed outcomes
  if (
    (teamSize >= 4 || (teamSize >= 3 && monthlyRevenue >= 1000)) &&
    customerCount >= 10 &&
    completedOutcomes >= 12
  ) {
    return Math.max(4, currentStage);
  }

  // Stage 3: Early Traction
  // - 5+ customers OR 20+ active users
  // - 8+ completed outcomes
  // - 4+ week streak
  // - 50+ completed tasks
  if (
    (customerCount >= 5 || activeUsers >= 20) &&
    completedOutcomes >= 8 &&
    weeklyStreak >= 4 &&
    completedTasks >= 50
  ) {
    return Math.max(3, currentStage);
  }

  // Stage 2: MVP Development
  // - 4+ completed outcomes
  // - 2+ completed milestones
  // - 20+ completed tasks
  // - 2+ week streak
  if (
    completedOutcomes >= 4 &&
    completedMilestones >= 2 &&
    completedTasks >= 20 &&
    weeklyStreak >= 2
  ) {
    return Math.max(2, currentStage);
  }

  // Stage 1: Idea Validation (Default)
  // - Starting point for everyone
  // - Progresses once basic execution is demonstrated
  return Math.max(1, currentStage); // Never go below 1
}

/**
 * Get stage name (for display purposes only - not selectable)
 */
export function getStageName(stageId) {
  const stageNames = {
    1: "Idea Validation",
    2: "MVP Development",
    3: "Early Traction",
    4: "Team Building",
    5: "Growth",
    6: "Scale",
  };
  return stageNames[stageId] || "Unknown";
}

/**
 * Get stage description (informational only)
 */
export function getStageDescription(stageId) {
  const descriptions = {
    1: "Validate your problem and solution with potential customers",
    2: "Build your minimum viable product and test with early users",
    3: "Get your first customers and validate product-market fit",
    4: "Build your core team and scale operations",
    5: "Accelerate growth and expand your market reach",
    6: "Scale your business and optimize for efficiency",
  };
  return descriptions[stageId] || "";
}
