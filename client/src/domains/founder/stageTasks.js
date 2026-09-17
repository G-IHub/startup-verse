/**
 * Per-journey-stage task checklists. Each task has a stable `id` used as the
 * key in useStageTaskStore's `responses[stageId][taskId]` map, so founders'
 * saved text/completion state survives regardless of task ordering.
 *
 * Shared between the V1 FounderDashboard and V2 journey-stage tracker.
 */
export const STAGE_TASKS = {
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
