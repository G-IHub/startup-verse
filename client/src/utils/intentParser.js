// Intent categories we can detect

// Keyword patterns for intent detection
const INTENT_PATTERNS = {
  validation: {
    keywords: [
      "validate",
      "test",
      "verify",
      "confirm",
      "proof",
      "assumption",
      "hypothesis",
      "interview",
      "survey",
      "feedback",
    ],
    title: (input) => {
      if (input.toLowerCase().includes("interview"))
        return "Validate problem through customer interviews";
      if (input.toLowerCase().includes("survey"))
        return "Validate market demand with customer survey";
      return "Validate core assumptions with real users";
    },
    description: (input) =>
      `Test and validate key assumptions about ${extractSubject(input) || "the problem, solution, and market fit"}`,
    milestones: [
      {
        title: "Define validation criteria",
        tasks: [
          "List key assumptions to validate",
          "Define success metrics",
          "Create validation plan",
        ],
      },
      {
        title: "Recruit participants",
        tasks: [
          "Define target participant criteria",
          "Reach out to potential participants",
          "Schedule validation sessions",
        ],
      },
      {
        title: "Conduct validation",
        tasks: [
          "Run validation sessions",
          "Document results and insights",
          "Analyze patterns and learnings",
        ],
      },
    ],
  },
  "customer-research": {
    keywords: [
      "customer",
      "user",
      "research",
      "talk to",
      "speak with",
      "understand",
      "pain point",
      "interview customer",
      "customer interview",
      "user interview",
      "customer feedback",
    ],
    title: (input) => {
      const num = extractNumber(input);
      return num
        ? `Conduct ${num} customer discovery interviews`
        : "Conduct customer discovery research";
    },
    description: (input) =>
      `Understand ${extractSubject(input) || "customer needs, pain points, and willingness to pay"}`,
    milestones: [
      {
        title: "Research plan ready",
        tasks: [
          "Draft interview guide with key questions",
          "Define target customer profile",
          "Prepare documentation template",
        ],
      },
      {
        title: "Customers recruited",
        tasks: [
          "Identify potential interview candidates",
          "Schedule interview sessions",
          "Send reminders and confirmations",
        ],
      },
      {
        title: "Interviews completed",
        tasks: [
          "Conduct all scheduled interviews",
          "Document insights and quotes",
          "Identify patterns and themes",
        ],
      },
    ],
  },
  "product-development": {
    keywords: [
      "build",
      "develop",
      "create",
      "feature",
      "mvp",
      "prototype",
      "design",
      "code",
      "implement",
      "ship",
    ],
    title: (input) => {
      if (input.toLowerCase().includes("mvp")) return "Build and launch MVP";
      if (input.toLowerCase().includes("prototype"))
        return "Create working prototype";
      if (input.toLowerCase().includes("feature"))
        return `Build ${extractSubject(input) || "core features"}`;
      return "Develop core product functionality";
    },
    description: (input) =>
      `Build ${extractSubject(input) || "the minimum viable product with essential features"}`,
    milestones: [
      {
        title: "Scope defined",
        tasks: [
          "List all potential features",
          "Prioritize must-have features",
          "Create technical specification",
        ],
      },
      {
        title: "Development in progress",
        tasks: [
          "Set up development environment",
          "Build core functionality",
          "Implement key features",
        ],
      },
      {
        title: "Testing complete",
        tasks: [
          "Conduct internal testing",
          "Fix critical bugs",
          "Get user feedback on prototype",
        ],
      },
    ],
  },
  "team-building": {
    keywords: [
      "hire",
      "recruit",
      "find",
      "team",
      "cofounder",
      "co-founder",
      "developer",
      "designer",
      "engineer",
      "talent",
      "team member",
      "team members",
      "need team",
      "find team",
      "hiring",
      "onboard",
      "cto",
      "cpo",
      "employee",
      "staff",
      "partner",
    ],
    title: (input) => {
      const role = extractRole(input);
      return role
        ? `Find and onboard ${role}`
        : "Build your team on StartupVerse";
    },
    description: (input) =>
      `Use Smart Team Matching to find ${extractSubject(input) || "talented team members who align with your vision"}`,
    milestones: [
      {
        title: "Profile optimized for matching",
        tasks: [
          "Complete your founder profile with skills and vision",
          "Define the roles you need on your team",
          "Set your collaboration preferences and expectations",
        ],
      },
      {
        title: "Team candidates identified",
        tasks: [
          "Browse Smart Team Matching recommendations",
          "Search for specific skills or roles you need",
          "Review and shortlist potential team members",
        ],
      },
      {
        title: "Team members connected",
        tasks: [
          "Send connection requests to top candidates",
          "Schedule intro calls with matched talent",
          "Invite selected members to join your startup",
        ],
      },
    ],
  },
  "legal-setup": {
    keywords: [
      "legal",
      "incorporate",
      "register",
      "company",
      "llc",
      "c-corp",
      "formation",
      "contract",
      "agreement",
      "compliance",
    ],
    title: (input) => {
      if (input.toLowerCase().includes("incorporate"))
        return "Incorporate company";
      if (input.toLowerCase().includes("contract"))
        return "Create legal agreements";
      return "Set up legal foundation";
    },
    description: (input) =>
      `Establish ${extractSubject(input) || "legal structure and compliance framework"}`,
    milestones: [
      {
        title: "Entity structure decided",
        tasks: [
          "Research entity types",
          "Consult with legal advisor",
          "Choose optimal structure",
        ],
      },
      {
        title: "Company registered",
        tasks: [
          "File formation documents",
          "Obtain tax ID number",
          "Set up business bank account",
        ],
      },
    ],
  },
  fundraising: {
    keywords: [
      "raise",
      "fundraise",
      "funding",
      "investment",
      "investor",
      "pitch",
      "deck",
      "capital",
      "seed",
      "series",
    ],
    title: (input) => {
      const amount = extractNumber(input);
      return amount
        ? `Raise $${amount}k in funding`
        : "Prepare for fundraising";
    },
    description: (input) =>
      `Secure ${extractSubject(input) || "investment to fuel growth and scale operations"}`,
    milestones: [
      {
        title: "Fundraising materials ready",
        tasks: [
          "Create pitch deck",
          "Prepare financial projections",
          "Compile investor list",
        ],
      },
      {
        title: "Investor meetings scheduled",
        tasks: [
          "Reach out to potential investors",
          "Schedule pitch meetings",
          "Prepare Q&A responses",
        ],
      },
      {
        title: "Funding secured",
        tasks: [
          "Conduct investor presentations",
          "Negotiate terms",
          "Close funding round",
        ],
      },
    ],
  },
  marketing: {
    keywords: [
      "market",
      "campaign",
      "content",
      "social media",
      "seo",
      "ads",
      "advertising",
      "brand",
      "awareness",
      "launch",
    ],
    title: (input) => {
      if (input.toLowerCase().includes("launch"))
        return "Launch marketing campaign";
      if (input.toLowerCase().includes("content"))
        return "Build content marketing engine";
      return "Execute marketing strategy";
    },
    description: (input) =>
      `Drive ${extractSubject(input) || "awareness and customer acquisition through marketing"}`,
    milestones: [
      {
        title: "Strategy defined",
        tasks: [
          "Identify target channels",
          "Create marketing calendar",
          "Define success metrics",
        ],
      },
      {
        title: "Content created",
        tasks: [
          "Develop marketing materials",
          "Create content pieces",
          "Design campaign assets",
        ],
      },
      {
        title: "Campaign launched",
        tasks: [
          "Execute marketing campaign",
          "Monitor performance metrics",
          "Optimize based on results",
        ],
      },
    ],
  },
  sales: {
    keywords: [
      "sell",
      "sales",
      "revenue",
      "customer",
      "close",
      "deal",
      "acquisition",
      "convert",
      "pipeline",
    ],
    title: (input) => {
      const num = extractNumber(input);
      return num ? `Acquire ${num} paying customers` : "Build sales pipeline";
    },
    description: (input) =>
      `Generate ${extractSubject(input) || "revenue through customer acquisition and sales"}`,
    milestones: [
      {
        title: "Sales process defined",
        tasks: [
          "Map customer journey",
          "Create sales materials",
          "Define pricing and packages",
        ],
      },
      {
        title: "Leads generated",
        tasks: [
          "Identify target customers",
          "Build prospect list",
          "Initiate outreach",
        ],
      },
      {
        title: "Customers acquired",
        tasks: [
          "Conduct sales conversations",
          "Handle objections and close deals",
          "Onboard new customers",
        ],
      },
    ],
  },
  growth: {
    keywords: [
      "grow",
      "scale",
      "expand",
      "increase",
      "optimize",
      "experiment",
      "test",
      "metric",
      "kpi",
      "analytics",
    ],
    title: (input) => {
      if (input.toLowerCase().includes("experiment"))
        return "Run growth experiments";
      return "Scale customer acquisition";
    },
    description: (input) =>
      `Scale ${extractSubject(input) || "operations and accelerate growth"}`,
    milestones: [
      {
        title: "Growth experiments designed",
        tasks: [
          "Identify channels to test",
          "Define success metrics",
          "Create experiment plan",
        ],
      },
      {
        title: "Experiments executed",
        tasks: ["Run experiment 1", "Run experiment 2", "Run experiment 3"],
      },
      {
        title: "Winning strategy identified",
        tasks: [
          "Analyze results",
          "Identify best channel",
          "Plan scale-up strategy",
        ],
      },
    ],
  },
  general: {
    keywords: [],
    title: (input) => {
      return input.length > 50 ? input.substring(0, 50) + "..." : input;
    },
    description: (input) => `Achieve measurable progress on: ${input}`,
    milestones: [
      {
        title: "Plan and prepare",
        tasks: [
          "Define success criteria",
          "Break down into steps",
          "Gather necessary resources",
        ],
      },
      {
        title: "Execute core work",
        tasks: [
          "Complete main deliverables",
          "Track progress regularly",
          "Adjust approach as needed",
        ],
      },
      {
        title: "Review and complete",
        tasks: [
          "Review outcomes",
          "Document learnings",
          "Celebrate completion",
        ],
      },
    ],
  },
};

// Helper functions to extract information from input
function extractNumber(input) {
  const match = input.match(/\b(\d+)\b/);
  return match ? parseInt(match[1]) : null;
}

function extractSubject(input) {
  // Remove common action words and get the subject
  const cleaned = input
    .toLowerCase()
    .replace(
      /^(i want to|i need to|we need to|help me|let's|can you help|i'd like to)\s+/i,
      "",
    )
    .replace(
      /^(validate|test|build|create|find|hire|launch|grow|scale|increase)\s+/i,
      "",
    );

  return cleaned.length > 10 ? cleaned : null;
}

function extractRole(input) {
  const roles = [
    "technical co-founder",
    "cofounder",
    "co-founder",
    "cto",
    "ceo",
    "cmo",
    "cfo",
    "developer",
    "engineer",
    "designer",
    "product manager",
    "marketer",
    "sales person",
    "data scientist",
  ];

  const lowerInput = input.toLowerCase();
  for (const role of roles) {
    if (lowerInput.includes(role)) {
      return `a ${role}`;
    }
  }
  return null;
}

// Main intent parser
export function parseFounderIntent(input) {
  const lowerInput = input.toLowerCase();
  let bestMatch = "general";
  let maxScore = 0;
  const detectedKeywords = [];

  // Find best matching category
  for (const [category, pattern] of Object.entries(INTENT_PATTERNS)) {
    let score = 0;
    for (const keyword of pattern.keywords) {
      if (lowerInput.includes(keyword)) {
        score++;
        detectedKeywords.push(keyword);
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestMatch = category;
    }
  }

  const pattern = INTENT_PATTERNS[bestMatch];
  const confidence =
    bestMatch === "general" ? 0.5 : Math.min(0.6 + maxScore * 0.1, 0.95);

  return {
    category: bestMatch,
    confidence,
    suggestedTitle: pattern.title(input),
    suggestedDescription: pattern.description(input),
    detectedKeywords: [...new Set(detectedKeywords)],
    suggestedMilestones: pattern.milestones,
    originalInput: input,
  };
}

// Create outcome from parsed intent
export function createOutcomeFromIntent(parsedIntent, weekNumber) {
  const milestones = parsedIntent.suggestedMilestones.map((m, index) => ({
    id: `milestone-${index + 1}`,
    title: m.title,
    status: "pending",
    tasksCompleted: 0,
    totalTasks: m.tasks.length,
  }));

  return {
    id: `outcome-${Date.now()}`,
    title: parsedIntent.suggestedTitle,
    description: parsedIntent.suggestedDescription,
    milestones,
    weekNumber,
    startDate: new Date().toISOString(),
    status: "active",
  };
}

// Generate tasks from parsed intent
export function generateTasksFromIntent(parsedIntent, outcome, userId) {
  const tasks = [];

  outcome.milestones.forEach((milestone, milestoneIndex) => {
    const milestoneTasks =
      parsedIntent.suggestedMilestones[milestoneIndex]?.tasks || [];

    milestoneTasks.forEach((taskTitle, taskIndex) => {
      tasks.push({
        id: `task-${milestone.id}-${taskIndex}`,
        milestoneId: milestone.id,
        weekId: outcome.weekId, // ✅ FIX: Associate task with specific week
        outcomeId: outcome.id, // ✅ FIX: Associate task with specific outcome
        title: taskTitle,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
    });
  });

  return tasks;
}

// Suggest refinements based on intent
export function suggestRefinements(parsedIntent) {
  const suggestions = [];

  if (parsedIntent.confidence < 0.7) {
    suggestions.push(
      "Add more specific details about what you want to accomplish",
    );
  }

  if (
    !extractNumber(parsedIntent.originalInput) &&
    ["validation", "customer-research", "sales"].includes(parsedIntent.category)
  ) {
    suggestions.push(
      'Consider adding a specific number (e.g., "10 interviews" or "5 customers")',
    );
  }

  if (parsedIntent.originalInput.length < 20) {
    suggestions.push("Provide more context about why this matters this week");
  }

  return suggestions;
}
