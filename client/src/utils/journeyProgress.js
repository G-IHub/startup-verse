import {
  Lightbulb,
  Building,
  Users,
  Rocket,
  TrendingUp,
  Target,
} from "lucide-react";

export const JOURNEY_STAGES = [
  {
    id: 1,
    name: "Idea & Validation",
    title: "Idea & Validation",
    description:
      "Validate your startup idea and understand your target market.",
    icon: Lightbulb,
    estimatedDuration: "2-4 weeks",
    completionCriteria: [
      "Define your problem statement",
      "Describe your solution",
      "Identify target audience",
      "Calculate market size (TAM/SAM/SOM)",
      "Create value proposition",
      "Conduct customer interviews",
    ],

    keyMilestones: [
      "Problem-Solution Fit Validated",
      "Target Market Defined",
      "Customer Interviews Completed",
    ],

    tools: [
      "Idea Canvas",
      "Market Sizing Calculator",
      "Customer Interview Template",
      "Competitor Analysis",
    ],
  },
  {
    id: 2,
    name: "Company Formation",
    title: "Company Formation",
    description:
      "Register your company legally and set up foundational structure.",
    icon: Building,
    estimatedDuration: "2-4 weeks",
    completionCriteria: [
      "Choose entity type (CAC/Delaware/LLC)",
      "Register company name",
      "Complete incorporation documents",
      "Set up cap table with founder equity",
      "Get EIN/TIN registration",
    ],

    keyMilestones: [
      "Company Legally Registered",
      "Founder Equity Split Agreed",
      "Business Bank Account Ready",
    ],

    tools: [
      "CAC Registration Wizard",
      "Delaware LLC Setup",
      "Cap Table Manager",
      "Document Vault",
    ],
  },
  {
    id: 3,
    name: "Team Building",
    title: "Team Building",
    description:
      "Assemble your core team and define roles and responsibilities.",
    icon: Users,
    estimatedDuration: "4-8 weeks",
    completionCriteria: [
      "Define key roles needed",
      "Recruit co-founders or early team members",
      "Agree on equity distribution",
      "Create collaboration agreements",
      "Establish team culture and values",
    ],

    keyMilestones: [
      "Core Team Assembled (2+ members)",
      "Roles & Responsibilities Defined",
      "Equity Split Agreed",
    ],

    tools: [
      "Smart Team Matching",
      "Role Definition Template",
      "Equity Split Calculator",
      "Collaboration Agreement Builder",
    ],
  },
  {
    id: 4,
    name: "Product Development",
    title: "Product Development",
    description: "Build your Minimum Viable Product and prepare for launch.",
    icon: Rocket,
    estimatedDuration: "2-4 months",
    completionCriteria: [
      "Define MVP scope and features",
      "Choose tech stack",
      "Create development timeline",
      "Build core functionality",
      "Test with beta users",
    ],

    keyMilestones: [
      "MVP Features Defined",
      "First Version Built",
      "Beta Testing Complete",
    ],

    tools: [
      "Product Roadmap",
      "Feature Prioritization Matrix",
      "Development Sprint Planner",
      "Beta Testing Framework",
    ],
  },
  {
    id: 5,
    name: "Go to Market",
    title: "Go to Market",
    description: "Launch your product and acquire your first customers.",
    icon: TrendingUp,
    estimatedDuration: "3-6 months",
    completionCriteria: [
      "Plan launch strategy",
      "Select marketing channels",
      "Recruit beta users",
      "Launch product publicly",
      "Acquire first paying customers",
    ],

    keyMilestones: [
      "Launch Strategy Complete",
      "Product Launched",
      "First 10 Customers Acquired",
    ],

    tools: [
      "Launch Checklist",
      "Marketing Channel Planner",
      "Beta User Tracker",
      "Customer Acquisition Dashboard",
    ],
  },
  {
    id: 6,
    name: "Growth & Scaling",
    title: "Growth & Scaling",
    description: "Scale your business and optimize for sustainable growth.",
    icon: Target,
    estimatedDuration: "Ongoing",
    completionCriteria: [
      "Set up metrics dashboard",
      "Run growth experiments",
      "Prepare fundraising materials",
      "Scale team and operations",
      "Build scalable systems and processes",
    ],

    keyMilestones: [
      "Consistent Month-over-Month Growth",
      "Team Scaled Beyond 5 Members",
      "Revenue Targets Hit",
      "Funding Secured (Optional)",
    ],

    tools: [
      "Growth Strategy Framework",
      "Metrics Dashboard",
      "Fundraising Toolkit",
      "Operations Playbook",
    ],
  },
];

let journeyUserId = null;

export function configureJourneyUser(userId) {
  journeyUserId = userId || null;
}

function journeyStorageKey() {
  return journeyUserId ? `journey_progress_${journeyUserId}` : "journey_progress";
}

/**
 * Overwrite local journey state from server (Startup.data.journey).
 */
export function applyServerJourneySnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return;
  const stage = Number(snapshot.currentStage);
  if (!Number.isFinite(stage) || stage < 1) return;
  const key = journeyStorageKey();
  localStorage.setItem(key, JSON.stringify(snapshot));
}

// Initialize journey progress for new users
export function initializeJourneyProgress() {
  const key = journeyStorageKey();
  let existingProgress = localStorage.getItem(key);

  if (!existingProgress && journeyUserId) {
    const legacy = localStorage.getItem("journey_progress");
    if (legacy) {
      existingProgress = legacy;
      localStorage.setItem(key, legacy);
    }
  }

  if (existingProgress) {
    return JSON.parse(existingProgress);
  }

  const initialProgress = {
    currentStage: 1, // Always start at Idea & Validation
    completedStages: [],
    stageData: {
      1: {
        startedAt: new Date().toISOString(),
        completionPercentage: 0,
        milestonesCompleted: [],
      },
    },
  };

  localStorage.setItem(key, JSON.stringify(initialProgress));
  return initialProgress;
}

// Get current journey progress
export function getJourneyProgress() {
  return initializeJourneyProgress();
}

// Get current stage ID
export function getCurrentStage() {
  const progress = getJourneyProgress();
  return progress.currentStage;
}

// Update journey progress
export function updateJourneyProgress(progress) {
  localStorage.setItem(journeyStorageKey(), JSON.stringify(progress));
}

// Mark current stage as complete and move to next
export function completeCurrentStage() {
  const progress = getJourneyProgress();
  const currentStageId = progress.currentStage;

  // Mark current stage as completed
  if (!progress.completedStages.includes(currentStageId)) {
    progress.completedStages.push(currentStageId);
  }

  // Update stage data
  progress.stageData[currentStageId] = {
    ...progress.stageData[currentStageId],
    completedAt: new Date().toISOString(),
    completionPercentage: 100,
  };

  // Move to next stage if available
  if (currentStageId < JOURNEY_STAGES.length) {
    const nextStageId = currentStageId + 1;
    progress.currentStage = nextStageId;

    // Initialize next stage
    if (!progress.stageData[nextStageId]) {
      progress.stageData[nextStageId] = {
        startedAt: new Date().toISOString(),
        completionPercentage: 0,
        milestonesCompleted: [],
      };
    }
  }

  updateJourneyProgress(progress);
  return progress;
}

// Update stage completion percentage
export function updateStageProgress(stageId, percentage) {
  const progress = getJourneyProgress();

  if (!progress.stageData[stageId]) {
    progress.stageData[stageId] = {
      startedAt: new Date().toISOString(),
      completionPercentage: 0,
      milestonesCompleted: [],
    };
  }

  progress.stageData[stageId].completionPercentage = Math.min(
    100,
    Math.max(0, percentage),
  );

  updateJourneyProgress(progress);
  return progress;
}

// Set current stage (for manual stage switching)
export function setCurrentStage(stageId) {
  const progress = getJourneyProgress();

  // Validate stage ID
  if (stageId < 1 || stageId > JOURNEY_STAGES.length) {
    throw new Error(`Invalid stage ID: ${stageId}`);
  }

  progress.currentStage = stageId;

  // Initialize stage data if it doesn't exist
  if (!progress.stageData[stageId]) {
    progress.stageData[stageId] = {
      startedAt: new Date().toISOString(),
      completionPercentage: 0,
      milestonesCompleted: [],
    };
  }

  updateJourneyProgress(progress);
  return progress;
}

// Mark a milestone as completed
export function completeMilestone(stageId, milestone) {
  const progress = getJourneyProgress();

  if (!progress.stageData[stageId]) {
    progress.stageData[stageId] = {
      startedAt: new Date().toISOString(),
      completionPercentage: 0,
      milestonesCompleted: [],
    };
  }

  if (!progress.stageData[stageId].milestonesCompleted.includes(milestone)) {
    progress.stageData[stageId].milestonesCompleted.push(milestone);
  }

  // Auto-update completion percentage based on milestones
  const stage = JOURNEY_STAGES.find((s) => s.id === stageId);
  if (stage) {
    const totalMilestones = stage.keyMilestones.length;
    const completedCount =
      progress.stageData[stageId].milestonesCompleted.length;
    progress.stageData[stageId].completionPercentage = Math.round(
      (completedCount / totalMilestones) * 100,
    );
  }

  updateJourneyProgress(progress);
  return progress;
}

// Get stage status
export function getStageStatus(stageId) {
  const progress = getJourneyProgress();

  if (progress.completedStages.includes(stageId)) {
    return "completed";
  }

  if (progress.currentStage === stageId) {
    return "current";
  }

  if (stageId === progress.currentStage + 1) {
    return "upcoming";
  }

  return "locked";
}

// Auto-detect stage progression based on activity
export function autoDetectStageProgression(userId) {
  const progress = getJourneyProgress();
  const currentStage = progress.currentStage;

  // Stage 1: Idea & Validation - Auto-complete if profile is complete
  if (currentStage === 1) {
    const profileComplete = localStorage.getItem(
      `user_${userId}_onboarding_complete`,
    );
    if (profileComplete === "true") {
      updateStageProgress(1, 50); // Profile completion = 50% of stage 1
    }
  }

  // Stage 3: Team Building - Auto-progress based on team size
  if (currentStage === 3) {
    const teamMembers = JSON.parse(
      localStorage.getItem("team_members") || "[]",
    );
    const teamSize = teamMembers.length + 1;

    if (teamSize >= 3) {
      updateStageProgress(3, 100);
      // Auto-complete if team is built
      if (!progress.completedStages.includes(3)) {
        completeCurrentStage();
      }
    } else if (teamSize === 2) {
      updateStageProgress(3, 50);
    }
  }

  // Stage 4: MVP Development - Check for tasks or product activity
  if (currentStage === 4) {
    const tasks = JSON.parse(localStorage.getItem("founder_tasks") || "[]");
    const completedTasks = tasks.filter((t) => t.completed).length;

    if (completedTasks > 0) {
      const progressPercentage = Math.min(100, (completedTasks / 10) * 100); // 10 tasks = 100%
      updateStageProgress(4, progressPercentage);
    }
  }
}

// Get overall journey completion percentage
export function getOverallProgress() {
  const progress = getJourneyProgress();
  const totalStages = JOURNEY_STAGES.length;
  const completedCount = progress.completedStages.length;
  const currentStageProgress =
    progress.stageData[progress.currentStage]?.completionPercentage || 0;

  // Calculate: (completed stages + current stage progress) / total stages
  const overallPercentage =
    ((completedCount + currentStageProgress / 100) / totalStages) * 100;
  return Math.round(overallPercentage);
}

// Get time spent in current stage
export function getTimeInCurrentStage() {
  const progress = getJourneyProgress();
  const currentStageData = progress.stageData[progress.currentStage];

  if (!currentStageData?.startedAt) {
    return "0 days";
  }

  const startDate = new Date(currentStageData.startedAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return "1 day";
  if (diffDays < 7) return `${diffDays} days`;

  const weeks = Math.floor(diffDays / 7);
  if (weeks === 1) return "1 week";
  if (weeks < 4) return `${weeks} weeks`;

  const months = Math.floor(diffDays / 30);
  if (months === 1) return "1 month";
  return `${months} months`;
}

// Reset journey progress (for testing or restart)
export function resetJourneyProgress() {
  localStorage.removeItem(journeyStorageKey());
  initializeJourneyProgress();
}
