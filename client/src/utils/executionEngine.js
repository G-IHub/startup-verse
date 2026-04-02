import * as founderApi from "./api/founderApi";

// Storage keys (fallback for localStorage)
const EXECUTION_DATA_KEY = "startupverse_execution_data";
const CURRENT_OUTCOME_KEY = "startupverse_current_outcome";
const STREAK_DATA_KEY = "startupverse_streak_data";
const TASKS_KEY = "startupverse_tasks";

// Outcome templates per stage
export const OUTCOME_TEMPLATES = {
  1: [
    // Idea & Validation
    {
      id: "validate-problem-interviews",
      title: "Validate problem with 10 user interviews",
      description:
        "Conduct structured interviews to confirm the problem is real and worth solving",
      defaultMilestones: [
        {
          title: "Interview plan ready",
          defaultTasks: [
            "Draft interview script with key questions",
            "Define target user criteria",
            "Prepare note-taking template",
          ],
        },
        {
          title: "Users recruited",
          defaultTasks: [
            "Identify and reach out to 15 potential interviewees",
            "Schedule 10 interview slots",
            "Send calendar invites and reminders",
          ],
        },
        {
          title: "Interviews completed",
          defaultTasks: [
            "Conduct all 10 interviews",
            "Document key insights and pain points",
            "Record quotes and feedback",
          ],
        },
        {
          title: "Insights synthesized",
          defaultTasks: [
            "Analyze patterns across interviews",
            "Validate or pivot problem statement",
            "Document key learnings",
          ],
        },
      ],
    },
    {
      id: "test-landing-page",
      title: "Test landing page conversion with 100 visitors",
      description:
        "Create and validate a simple landing page to gauge market interest",
      defaultMilestones: [
        {
          title: "Landing page designed",
          defaultTasks: [
            "Write compelling headline and value proposition",
            "Design simple landing page layout",
            "Add email signup form",
          ],
        },
        {
          title: "Page launched",
          defaultTasks: [
            "Build and deploy landing page",
            "Set up analytics tracking",
            "Test all forms and links",
          ],
        },
        {
          title: "Traffic generated",
          defaultTasks: [
            "Share on social media channels",
            "Post in relevant communities",
            "Drive 100+ visitors to page",
          ],
        },
      ],
    },
    {
      id: "validate-willingness-to-pay",
      title: "Validate willingness to pay with 5 potential customers",
      description:
        "Confirm customers would pay for your solution before building",
      defaultMilestones: [
        {
          title: "Pricing research completed",
          defaultTasks: [
            "Research competitor pricing",
            "Define pricing tiers",
            "Prepare pricing conversation guide",
          ],
        },
        {
          title: "Payment conversations conducted",
          defaultTasks: [
            "Reach out to 10 validated users",
            "Conduct 5 pricing discussions",
            "Document price sensitivity and objections",
          ],
        },
      ],
    },
    {
      id: "define-mvp-scope",
      title: "Define and validate MVP scope with target users",
      description:
        "Clearly scope your minimum viable product based on user feedback",
      defaultMilestones: [
        {
          title: "Feature list brainstormed",
          defaultTasks: [
            "List all possible features",
            "Map features to user problems",
            "Create priority matrix",
          ],
        },
        {
          title: "MVP features validated",
          defaultTasks: [
            "Show feature list to 5 potential users",
            "Document must-have vs nice-to-have",
            "Finalize MVP feature set",
          ],
        },
      ],
    },
    {
      id: "competitor-analysis",
      title: "Complete comprehensive competitor analysis",
      description: "Research and analyze 5 main competitors to find your edge",
      defaultMilestones: [
        {
          title: "Competitors identified",
          defaultTasks: [
            "List direct and indirect competitors",
            "Select 5 key competitors to analyze",
            "Create analysis framework",
          ],
        },
        {
          title: "Analysis completed",
          defaultTasks: [
            "Analyze competitor offerings and pricing",
            "Document strengths and weaknesses",
            "Identify differentiation opportunities",
          ],
        },
      ],
    },
    {
      id: "market-size-research",
      title: "Calculate TAM, SAM, and SOM for your market",
      description:
        "Quantify your market opportunity with data-backed estimates",
      defaultMilestones: [
        {
          title: "Market data collected",
          defaultTasks: [
            "Research industry reports and data",
            "Identify target market segments",
            "Gather pricing and customer data",
          ],
        },
        {
          title: "Market sizing completed",
          defaultTasks: [
            "Calculate Total Addressable Market (TAM)",
            "Define Serviceable Available Market (SAM)",
            "Estimate Serviceable Obtainable Market (SOM)",
          ],
        },
      ],
    },
    {
      id: "value-proposition-canvas",
      title: "Create value proposition canvas",
      description: "Map customer jobs, pains, and gains to your solution",
      defaultMilestones: [
        {
          title: "Customer profile mapped",
          defaultTasks: [
            "List customer jobs to be done",
            "Document customer pains",
            "Identify customer gains",
          ],
        },
        {
          title: "Value map completed",
          defaultTasks: [
            "Define pain relievers",
            "Define gain creators",
            "Map products and services",
          ],
        },
      ],
    },
    {
      id: "business-model-canvas",
      title: "Complete Business Model Canvas",
      description:
        "Design your business model across all 9 key building blocks",
      defaultMilestones: [
        {
          title: "Canvas drafted",
          defaultTasks: [
            "Define value propositions",
            "Identify customer segments and channels",
            "Map key activities and resources",
          ],
        },
        {
          title: "Canvas validated",
          defaultTasks: [
            "Review with mentor or advisor",
            "Test assumptions with potential customers",
            "Finalize business model",
          ],
        },
      ],
    },
  ],

  2: [
    // Company Formation
    {
      id: "register-company",
      title: "Register company and set up legal foundation",
      description: "Establish legal entity and basic compliance",
      defaultMilestones: [
        {
          title: "Entity type chosen",
          defaultTasks: [
            "Research entity types (LLC, C-Corp, etc.)",
            "Consult with legal advisor",
            "Make entity decision",
          ],
        },
        {
          title: "Company registered",
          defaultTasks: [
            "File formation documents",
            "Get EIN from tax authority",
            "Set up business bank account",
          ],
        },
      ],
    },
    {
      id: "founder-agreements",
      title: "Create and sign founder agreements",
      description: "Formalize equity split and vesting schedules",
      defaultMilestones: [
        {
          title: "Equity split agreed",
          defaultTasks: [
            "Discuss each founder contribution",
            "Agree on equity percentages",
            "Define vesting schedule (4 year, 1 year cliff)",
          ],
        },
        {
          title: "Agreements signed",
          defaultTasks: [
            "Draft founder agreement document",
            "Review with legal counsel",
            "All founders sign agreement",
          ],
        },
      ],
    },
    {
      id: "cap-table-setup",
      title: "Set up cap table and equity management",
      description: "Create system to track ownership and future dilution",
      defaultMilestones: [
        {
          title: "Cap table created",
          defaultTasks: [
            "Choose cap table tool (Carta, Pulley, etc.)",
            "Input founder equity split",
            "Set up option pool (10-20%)",
          ],
        },
        {
          title: "Future rounds modeled",
          defaultTasks: [
            "Model seed round dilution",
            "Model Series A dilution",
            "Understand founder ownership trajectory",
          ],
        },
      ],
    },
    {
      id: "business-bank-account",
      title: "Open business bank account and set up finances",
      description: "Separate personal and business finances properly",
      defaultMilestones: [
        {
          title: "Bank account opened",
          defaultTasks: [
            "Research business banking options",
            "Gather required documents",
            "Open business checking account",
          ],
        },
        {
          title: "Financial systems setup",
          defaultTasks: [
            "Set up accounting software (QuickBooks, Xero)",
            "Create expense tracking system",
            "Set up payroll if needed",
          ],
        },
      ],
    },
    {
      id: "ip-protection",
      title: "Protect intellectual property",
      description: "Secure trademarks, copyrights, or patents as needed",
      defaultMilestones: [
        {
          title: "IP audit completed",
          defaultTasks: [
            "Identify protectable IP",
            "Research trademark availability",
            "Assess patent needs",
          ],
        },
        {
          title: "IP filed",
          defaultTasks: [
            "File trademark application",
            "Register copyrights",
            "Begin patent process if applicable",
          ],
        },
      ],
    },
    {
      id: "compliance-setup",
      title: "Set up compliance and legal requirements",
      description: "Ensure you meet all regulatory requirements",
      defaultMilestones: [
        {
          title: "Requirements identified",
          defaultTasks: [
            "Research industry-specific regulations",
            "Identify required licenses and permits",
            "Create compliance checklist",
          ],
        },
        {
          title: "Compliance achieved",
          defaultTasks: [
            "File for required licenses",
            "Set up data privacy compliance (GDPR, etc.)",
            "Create terms of service and privacy policy",
          ],
        },
      ],
    },
  ],

  3: [
    // Team Building
    {
      id: "recruit-cofounder",
      title: "Find and onboard a co-founder",
      description:
        "Use Smart Team Matching to find a co-founder with complementary skills",
      defaultMilestones: [
        {
          title: "Profile and criteria optimized",
          defaultTasks: [
            "Complete your founder profile on StartupVerse",
            "Define co-founder role and complementary skills needed",
            "Set collaboration preferences and equity expectations",
          ],
        },
        {
          title: "Co-founder candidates identified",
          defaultTasks: [
            "Review Smart Team Matching co-founder recommendations",
            "Search StartupVerse for founders with specific skills",
            "Shortlist 3-5 top co-founder candidates",
          ],
        },
        {
          title: "Co-founder committed",
          defaultTasks: [
            "Send connection requests and schedule intro calls",
            "Conduct deep-dive alignment conversations",
            "Sign co-founder agreement with selected partner",
          ],
        },
      ],
    },
    {
      id: "hire-first-engineer",
      title: "Hire first full-time engineer",
      description:
        "Use Smart Team Matching to recruit technical talent to build your product",
      defaultMilestones: [
        {
          title: "Role requirements defined",
          defaultTasks: [
            "Define engineering role and tech stack requirements",
            "Set compensation range and equity allocation",
            "Update startup profile with engineering needs",
          ],
        },
        {
          title: "Engineer candidates identified",
          defaultTasks: [
            "Browse Smart Team Matching engineer recommendations",
            "Search for engineers with required tech skills",
            "Review profiles and shortlist 5-8 candidates",
          ],
        },
        {
          title: "Engineer hired",
          defaultTasks: [
            "Send connection requests and conduct technical screens",
            "Complete interviews and make offer to top candidate",
            "Onboard engineer and assign first tasks",
          ],
        },
      ],
    },
    {
      id: "build-advisor-board",
      title: "Recruit 3 strategic advisors",
      description:
        "Use Smart Team Matching to build advisory board and fill knowledge gaps",
      defaultMilestones: [
        {
          title: "Advisor needs identified",
          defaultTasks: [
            "Identify key knowledge gaps and expertise needed",
            "Define ideal advisor profiles (industry, fundraising, technical)",
            "Update startup profile with advisor requirements",
          ],
        },
        {
          title: "Advisors recruited",
          defaultTasks: [
            "Search StartupVerse for advisors with relevant expertise",
            "Send connection requests to 8-10 potential advisors",
            "Conduct advisor meetings and agree on 0.25-1% equity per advisor",
          ],
        },
        {
          title: "Advisory board activated",
          defaultTasks: [
            "Sign advisor agreements",
            "Schedule regular check-ins",
            "Get first round of strategic advice",
          ],
        },
      ],
    },
    {
      id: "define-team-culture",
      title: "Define company culture and values",
      description: "Establish culture early to guide hiring and operations",
      defaultMilestones: [
        {
          title: "Values workshops held",
          defaultTasks: [
            "Conduct founder values exercise",
            "Identify 5 core company values",
            "Define behaviors that embody values",
          ],
        },
        {
          title: "Culture documented",
          defaultTasks: [
            "Write culture deck",
            "Create team handbook",
            "Share with team for feedback",
          ],
        },
      ],
    },
    {
      id: "setup-hiring-process",
      title: "Create repeatable hiring process",
      description:
        "Build system to consistently hire great people using StartupVerse",
      defaultMilestones: [
        {
          title: "Interview process designed",
          defaultTasks: [
            "Define interview stages",
            "Create interview scorecards",
            "Train team on interviewing",
          ],
        },
        {
          title: "Recruiting workflow established",
          defaultTasks: [
            "Set up Smart Team Matching search criteria and alerts",
            "Create candidate evaluation process",
            "Build talent pipeline using platform connections",
          ],
        },
      ],
    },
    {
      id: "equity-compensation-plan",
      title: "Design equity compensation plan",
      description: "Create fair and competitive equity offers for team",
      defaultMilestones: [
        {
          title: "Equity bands defined",
          defaultTasks: [
            "Research market equity ranges by role",
            "Define equity bands for each level",
            "Create vesting schedule policy",
          ],
        },
        {
          title: "Option plan approved",
          defaultTasks: [
            "Draft equity incentive plan",
            "Get board approval",
            "Set up option grants system",
          ],
        },
      ],
    },
  ],

  4: [
    // Build MVP
    {
      id: "build-core-features",
      title: "Build and test 3 core MVP features",
      description:
        "Develop minimum viable product with essential functionality",
      defaultMilestones: [
        {
          title: "Features prioritized",
          defaultTasks: [
            "List all potential features",
            "Identify 3 must-have features",
            "Create user stories for each",
          ],
        },
        {
          title: "Development in progress",
          defaultTasks: [
            "Set up development environment",
            "Build feature 1",
            "Build features 2 & 3",
          ],
        },
        {
          title: "Features tested",
          defaultTasks: [
            "Conduct internal testing",
            "Fix critical bugs",
            "Get 3 users to test MVP",
          ],
        },
      ],
    },
    {
      id: "setup-tech-stack",
      title: "Set up production-ready tech stack and infrastructure",
      description: "Build scalable technical foundation for your product",
      defaultMilestones: [
        {
          title: "Tech stack decided",
          defaultTasks: [
            "Research technology options",
            "Choose frontend and backend frameworks",
            "Select database and hosting platform",
          ],
        },
        {
          title: "Development environment setup",
          defaultTasks: [
            "Set up version control (GitHub, GitLab)",
            "Configure local development environment",
            "Set up CI/CD pipeline",
          ],
        },
        {
          title: "Production infrastructure deployed",
          defaultTasks: [
            "Set up staging and production environments",
            "Configure monitoring and error tracking",
            "Implement security best practices",
          ],
        },
      ],
    },
    {
      id: "design-user-experience",
      title: "Design complete user experience and interface",
      description: "Create intuitive and beautiful product design",
      defaultMilestones: [
        {
          title: "User flows mapped",
          defaultTasks: [
            "Document key user journeys",
            "Create wireframes for main screens",
            "Get feedback on flows from potential users",
          ],
        },
        {
          title: "UI design completed",
          defaultTasks: [
            "Design high-fidelity mockups",
            "Create design system and component library",
            "Prototype interactive flows",
          ],
        },
        {
          title: "Design validated",
          defaultTasks: [
            "Conduct usability testing with 5 users",
            "Iterate based on feedback",
            "Finalize design for development",
          ],
        },
      ],
    },
    {
      id: "build-authentication",
      title: "Implement secure user authentication and onboarding",
      description: "Build signup, login, and user onboarding flows",
      defaultMilestones: [
        {
          title: "Auth system implemented",
          defaultTasks: [
            "Set up authentication service",
            "Build signup and login flows",
            "Implement password reset functionality",
          ],
        },
        {
          title: "Onboarding created",
          defaultTasks: [
            "Design onboarding flow",
            "Build welcome screens and tutorials",
            "Add user profile setup",
          ],
        },
      ],
    },
    {
      id: "alpha-testing",
      title: "Complete alpha testing with 5 users",
      description: "Get real users to test MVP and identify critical issues",
      defaultMilestones: [
        {
          title: "Alpha users recruited",
          defaultTasks: [
            "Identify 5 ideal alpha testers",
            "Send invitations and NDAs",
            "Schedule testing sessions",
          ],
        },
        {
          title: "Testing completed",
          defaultTasks: [
            "Conduct alpha testing sessions",
            "Document bugs and feedback",
            "Prioritize fixes and improvements",
          ],
        },
        {
          title: "Critical issues resolved",
          defaultTasks: [
            "Fix blocking bugs",
            "Implement high-priority feedback",
            "Prepare for beta launch",
          ],
        },
      ],
    },
    {
      id: "setup-analytics",
      title: "Implement product analytics and tracking",
      description: "Set up systems to measure user behavior and product usage",
      defaultMilestones: [
        {
          title: "Analytics platform chosen",
          defaultTasks: [
            "Research analytics tools (Mixpanel, Amplitude, etc.)",
            "Choose platform that fits needs",
            "Set up account and integration",
          ],
        },
        {
          title: "Key events tracked",
          defaultTasks: [
            "Define key user actions to track",
            "Implement event tracking code",
            "Set up conversion funnels and dashboards",
          ],
        },
      ],
    },
    {
      id: "build-payment-system",
      title: "Integrate payment processing system",
      description: "Enable users to pay for your product",
      defaultMilestones: [
        {
          title: "Payment provider integrated",
          defaultTasks: [
            "Choose payment processor (Stripe, PayPal, etc.)",
            "Set up merchant account",
            "Integrate payment SDK",
          ],
        },
        {
          title: "Checkout flow completed",
          defaultTasks: [
            "Build pricing page",
            "Create checkout experience",
            "Test payment flows end-to-end",
          ],
        },
        {
          title: "Billing system setup",
          defaultTasks: [
            "Implement subscription management",
            "Set up invoicing and receipts",
            "Handle payment failures and retries",
          ],
        },
      ],
    },
    {
      id: "technical-documentation",
      title: "Create technical documentation and API docs",
      description: "Document codebase and APIs for team and future developers",
      defaultMilestones: [
        {
          title: "Code documentation written",
          defaultTasks: [
            "Document code architecture",
            "Add inline code comments",
            "Create developer setup guide",
          ],
        },
        {
          title: "API documentation created",
          defaultTasks: [
            "Document all API endpoints",
            "Create API usage examples",
            "Set up API documentation site",
          ],
        },
      ],
    },
  ],

  5: [
    // Go to Market
    {
      id: "recruit-beta-users",
      title: "Recruit and onboard 20 beta users",
      description: "Get early adopters to test product and provide feedback",
      defaultMilestones: [
        {
          title: "Beta program defined",
          defaultTasks: [
            "Create beta user criteria",
            "Design feedback collection process",
            "Prepare onboarding materials",
          ],
        },
        {
          title: "Users recruited",
          defaultTasks: [
            "Launch beta signup campaign",
            "Reach out to warm leads",
            "Onboard first 20 beta users",
          ],
        },
        {
          title: "Feedback collected",
          defaultTasks: [
            "Conduct user feedback sessions",
            "Analyze usage patterns",
            "Document improvement priorities",
          ],
        },
      ],
    },
    {
      id: "launch-product-hunt",
      title: "Launch on Product Hunt and reach top 5",
      description: "Execute successful Product Hunt launch to gain visibility",
      defaultMilestones: [
        {
          title: "Launch prepared",
          defaultTasks: [
            "Create Product Hunt profile and product page",
            "Prepare launch assets (images, video, copy)",
            "Build launch day promotion plan",
          ],
        },
        {
          title: "Community mobilized",
          defaultTasks: [
            "Reach out to supporters for upvotes",
            "Prepare team for comment responses",
            "Schedule launch for optimal day (Tuesday-Thursday)",
          ],
        },
        {
          title: "Launch executed",
          defaultTasks: [
            "Launch product on Product Hunt",
            "Engage with comments and questions",
            "Track ranking and metrics throughout day",
          ],
        },
      ],
    },
    {
      id: "content-marketing-plan",
      title: "Create and execute content marketing strategy",
      description: "Build content engine to attract and educate customers",
      defaultMilestones: [
        {
          title: "Content strategy defined",
          defaultTasks: [
            "Identify target keywords and topics",
            "Research competitor content",
            "Create content calendar for 12 weeks",
          ],
        },
        {
          title: "First 5 pieces published",
          defaultTasks: [
            "Write and publish 3 blog posts",
            "Create 2 video tutorials or demos",
            "Promote content on social media",
          ],
        },
        {
          title: "Distribution channels setup",
          defaultTasks: [
            "Build email newsletter system",
            "Set up social media posting schedule",
            "Submit content to relevant communities",
          ],
        },
      ],
    },
    {
      id: "first-10-customers",
      title: "Acquire first 10 paying customers",
      description: "Convert early users into paying customers",
      defaultMilestones: [
        {
          title: "Pricing finalized",
          defaultTasks: [
            "Set launch pricing tiers",
            "Create pricing page",
            "Prepare discount/promo codes for early adopters",
          ],
        },
        {
          title: "Sales outreach launched",
          defaultTasks: [
            "Create list of 50 ideal customers",
            "Send personalized outreach emails",
            "Follow up with interested prospects",
          ],
        },
        {
          title: "First 10 customers onboarded",
          defaultTasks: [
            "Close first 10 sales",
            "Provide white-glove onboarding",
            "Collect testimonials and feedback",
          ],
        },
      ],
    },
    {
      id: "community-building",
      title: "Build engaged community of 100 members",
      description:
        "Create community around your product for support and advocacy",
      defaultMilestones: [
        {
          title: "Community platform chosen",
          defaultTasks: [
            "Choose platform (Slack, Discord, Circle, etc.)",
            "Set up community space",
            "Create welcome materials and guidelines",
          ],
        },
        {
          title: "First 100 members recruited",
          defaultTasks: [
            "Invite beta users and customers",
            "Promote community on website and social",
            "Reach 100 member milestone",
          ],
        },
        {
          title: "Community engagement initiated",
          defaultTasks: [
            "Host first community event or AMA",
            "Create weekly discussion threads",
            "Empower power users as moderators",
          ],
        },
      ],
    },
    {
      id: "partnership-outreach",
      title: "Establish 3 strategic partnerships",
      description: "Partner with complementary products or influencers",
      defaultMilestones: [
        {
          title: "Partner targets identified",
          defaultTasks: [
            "List 20 potential partners",
            "Research partnership opportunities",
            "Prioritize top 10 targets",
          ],
        },
        {
          title: "Outreach conducted",
          defaultTasks: [
            "Craft partnership proposals",
            "Reach out to decision makers",
            "Conduct partnership discussions",
          ],
        },
        {
          title: "Partnerships activated",
          defaultTasks: [
            "Finalize 3 partnership agreements",
            "Coordinate co-marketing campaigns",
            "Track partnership impact",
          ],
        },
      ],
    },
    {
      id: "referral-program",
      title: "Launch referral program and get 20 referrals",
      description: "Turn customers into advocates with incentivized referrals",
      defaultMilestones: [
        {
          title: "Referral program designed",
          defaultTasks: [
            "Define referral incentives (discounts, credits, etc.)",
            "Choose referral software platform",
            "Create referral landing page",
          ],
        },
        {
          title: "Program launched",
          defaultTasks: [
            "Integrate referral system into product",
            "Announce program to existing users",
            "Create promotional materials",
          ],
        },
        {
          title: "First 20 referrals achieved",
          defaultTasks: [
            "Track referral signups",
            "Follow up with referred users",
            "Optimize program based on data",
          ],
        },
      ],
    },
    {
      id: "press-coverage",
      title: "Get featured in 3 industry publications",
      description: "Build credibility through media coverage",
      defaultMilestones: [
        {
          title: "Press kit created",
          defaultTasks: [
            "Write press release",
            "Create founder/company fact sheet",
            "Prepare high-res images and assets",
          ],
        },
        {
          title: "Media outreach executed",
          defaultTasks: [
            "Build list of target publications",
            "Craft personalized pitches",
            "Send to 20+ journalists/bloggers",
          ],
        },
        {
          title: "Coverage secured",
          defaultTasks: [
            "Get featured in 3 publications",
            "Amplify coverage on social media",
            "Add press logos to website",
          ],
        },
      ],
    },
  ],

  6: [
    // Growth & Scaling
    {
      id: "growth-experiments",
      title: "Run 3 growth experiments to find scalable channel",
      description: "Test different acquisition channels to identify what works",
      defaultMilestones: [
        {
          title: "Experiments designed",
          defaultTasks: [
            "Identify 3 channels to test",
            "Define success metrics for each",
            "Create experiment plan",
          ],
        },
        {
          title: "Experiments executed",
          defaultTasks: [
            "Run experiment 1",
            "Run experiment 2",
            "Run experiment 3",
          ],
        },
        {
          title: "Results analyzed",
          defaultTasks: [
            "Measure results against goals",
            "Identify winning channel",
            "Plan scale-up strategy",
          ],
        },
      ],
    },
    {
      id: "reach-100-customers",
      title: "Scale to 100 paying customers",
      description: "Achieve first major customer milestone",
      defaultMilestones: [
        {
          title: "Sales process optimized",
          defaultTasks: [
            "Document successful sales playbook",
            "Optimize conversion funnel",
            "Set up lead scoring system",
          ],
        },
        {
          title: "Acquisition scaled",
          defaultTasks: [
            "Increase marketing spend on winning channels",
            "Launch automated email campaigns",
            "Implement retargeting ads",
          ],
        },
        {
          title: "100 customers reached",
          defaultTasks: [
            "Track progress to 100 customer goal",
            "Maintain high activation and retention",
            "Celebrate and share milestone",
          ],
        },
      ],
    },
    {
      id: "optimize-unit-economics",
      title: "Optimize unit economics to CAC:LTV ratio of 1:3",
      description: "Ensure profitable customer acquisition",
      defaultMilestones: [
        {
          title: "Metrics baseline established",
          defaultTasks: [
            "Calculate current Customer Acquisition Cost (CAC)",
            "Calculate current Lifetime Value (LTV)",
            "Identify areas for improvement",
          ],
        },
        {
          title: "Optimization experiments run",
          defaultTasks: [
            "Test ways to reduce CAC (better targeting, cheaper channels)",
            "Test ways to increase LTV (upsells, retention)",
            "Implement winning optimizations",
          ],
        },
        {
          title: "Target ratio achieved",
          defaultTasks: [
            "Measure improved CAC:LTV ratio",
            "Document scalable processes",
            "Prepare for growth investment",
          ],
        },
      ],
    },
    {
      id: "hire-growth-team",
      title: "Build growth team: marketing and sales hires",
      description:
        "Use Smart Team Matching to hire specialized talent to accelerate growth",
      defaultMilestones: [
        {
          title: "Growth roles defined",
          defaultTasks: [
            "Determine key growth hires needed (marketing, sales)",
            "Define role requirements and key responsibilities",
            "Set compensation and equity ranges",
          ],
        },
        {
          title: "Growth team hired",
          defaultTasks: [
            "Search Smart Team Matching for growth marketers and sales talent",
            "Review candidate profiles and conduct interviews",
            "Extend offers and complete onboarding",
          ],
        },
      ],
    },
    {
      id: "automate-operations",
      title: "Automate key operational processes",
      description: "Build systems to scale without linear headcount growth",
      defaultMilestones: [
        {
          title: "Process audit completed",
          defaultTasks: [
            "Map all operational processes",
            "Identify manual bottlenecks",
            "Prioritize automation opportunities",
          ],
        },
        {
          title: "Automation implemented",
          defaultTasks: [
            "Automate customer onboarding",
            "Set up automated reporting and dashboards",
            "Implement workflow automation tools",
          ],
        },
      ],
    },
    {
      id: "fundraising-prep",
      title: "Prepare for and close seed funding round",
      description: "Raise capital to accelerate growth",
      defaultMilestones: [
        {
          title: "Fundraising materials ready",
          defaultTasks: [
            "Create investor pitch deck",
            "Prepare financial model and projections",
            "Build data room with key documents",
          ],
        },
        {
          title: "Investor outreach launched",
          defaultTasks: [
            "Build list of 50 target investors",
            "Get warm introductions",
            "Conduct 20+ investor meetings",
          ],
        },
        {
          title: "Round closed",
          defaultTasks: [
            "Negotiate term sheets",
            "Complete due diligence",
            "Close seed round and announce",
          ],
        },
      ],
    },
    {
      id: "scale-customer-success",
      title: "Build customer success program to reduce churn",
      description: "Retain customers and drive expansion revenue",
      defaultMilestones: [
        {
          title: "Success metrics defined",
          defaultTasks: [
            "Measure current retention and churn",
            "Identify churn risk indicators",
            "Define customer health score",
          ],
        },
        {
          title: "Success program launched",
          defaultTasks: [
            "Create customer onboarding playbook",
            "Implement proactive check-ins",
            "Build customer education content",
          ],
        },
        {
          title: "Churn reduced",
          defaultTasks: [
            "Reduce monthly churn by 50%",
            "Increase NPS score",
            "Drive expansion revenue from existing customers",
          ],
        },
      ],
    },
    {
      id: "expand-product-offering",
      title: "Launch second product or major feature expansion",
      description: "Increase value and addressable market",
      defaultMilestones: [
        {
          title: "Expansion opportunity validated",
          defaultTasks: [
            "Research customer needs and requests",
            "Validate new product/feature demand",
            "Create product requirements document",
          ],
        },
        {
          title: "Product built and tested",
          defaultTasks: [
            "Build new product or features",
            "Beta test with select customers",
            "Iterate based on feedback",
          ],
        },
        {
          title: "Expansion launched",
          defaultTasks: [
            "Launch new offering to all customers",
            "Execute go-to-market campaign",
            "Track adoption and revenue impact",
          ],
        },
      ],
    },
  ],
};

// Get execution data for user (synchronous, with background backend sync)
export const getExecutionData = (userId) => {
  // Load from backend in background to sync latest data
  founderApi
    .getWeeklyOutcomes(userId)
    .then((response) => {
      if (
        response.success &&
        response.outcomes &&
        response.outcomes.length > 0
      ) {
        // Find the most recent active outcome
        const activeOutcome = response.outcomes.find(
          (o) => o.status === "active",
        );

        if (activeOutcome) {
          // Update localStorage cache with backend data
          const stored = localStorage.getItem(
            `${EXECUTION_DATA_KEY}_${userId}`,
          );
          const currentData = stored
            ? JSON.parse(stored)
            : {
                userId,
                streak: 0,
                hasPartialWeeks: false,
                weekHistory: [],
                lastUpdated: new Date().toISOString(),
              };

          currentData.currentOutcome = activeOutcome;
          localStorage.setItem(
            `${EXECUTION_DATA_KEY}_${userId}`,
            JSON.stringify(currentData),
          );
        }
      }
    })
    .catch((error) => {
      // Silently fail - backend sync is optional, localStorage is source of truth
      // Only log in development
      if (process.env.NODE_ENV === "development") {
        console.debug(
          "Background execution data sync from backend failed (expected in demo mode):",
          error.message,
        );
      }
    });

  // Return localStorage immediately for instant UI
  const stored = localStorage.getItem(`${EXECUTION_DATA_KEY}_${userId}`);
  if (stored) {
    return JSON.parse(stored);
  }

  // Initialize new execution data
  return {
    userId,
    currentOutcome: null,
    streak: 0,
    hasPartialWeeks: false,
    weekHistory: [],
    lastUpdated: new Date().toISOString(),
  };
};

// Save execution data (synchronous with background backend save)
export const saveExecutionData = (data) => {
  data.lastUpdated = new Date().toISOString();

  // Save to localStorage immediately for instant UI
  localStorage.setItem(
    `${EXECUTION_DATA_KEY}_${data.userId}`,
    JSON.stringify(data),
  );

  // If there's a current outcome, save it to backend in background
  if (data.currentOutcome) {
    founderApi
      .saveWeeklyOutcome(data.userId, data.currentOutcome)
      .then(() => {
        console.log("✅ Weekly outcome synced to backend");
      })
      .catch((error) => {
        // Silently fail - localStorage is primary storage
        if (process.env.NODE_ENV === "development") {
          console.debug(
            "Failed to sync weekly outcome to backend (expected in demo mode):",
            error.message,
          );
        }
      });
  }
};

// Get outcome templates for stage
export const getOutcomeTemplatesForStage = (stageId) => {
  return OUTCOME_TEMPLATES[stageId] || [];
};

// Create weekly outcome from template
export const createOutcomeFromTemplate = (templateId, stageId, weekNumber) => {
  const templates = OUTCOME_TEMPLATES[stageId] || [];
  const template = templates.find((t) => t.id === templateId);

  if (!template) return null;

  const milestones = template.defaultMilestones.map((m, index) => ({
    id: `milestone-${index + 1}`,
    title: m.title,
    status: "pending",
    tasksCompleted: 0,
    totalTasks: m.defaultTasks.length,
  }));

  return {
    id: `outcome-${Date.now()}`,
    title: template.title,
    description: template.description,
    milestones,
    weekNumber,
    startDate: new Date().toISOString(),
    status: "active",
  };
};

// Update milestone progress
export const updateMilestoneProgress = (
  outcome,
  milestoneId,
  tasksCompleted,
) => {
  const updatedMilestones = outcome.milestones.map((m) => {
    if (m.id === milestoneId) {
      const status =
        tasksCompleted >= m.totalTasks
          ? "completed"
          : tasksCompleted > 0
            ? "in-progress"
            : "pending";

      return { ...m, tasksCompleted, status };
    }
    return m;
  });

  return { ...outcome, milestones: updatedMilestones };
};

// Calculate outcome completion status
export const calculateOutcomeStatus = (outcome) => {
  const completedMilestones = outcome.milestones.filter(
    (m) => m.status === "completed",
  ).length;
  const totalMilestones = outcome.milestones.length;
  const completionRate = completedMilestones / totalMilestones;

  if (completionRate >= 0.8) return "completed"; // 80%+ = completed
  if (completionRate >= 0.4) return "partial"; // 40-79% = partial
  return "not-achieved"; // 0-39% = not achieved
};

// Complete weekly outcome and update streak
export const completeWeeklyOutcome = (executionData, outcome, status) => {
  const totalTasks = outcome.milestones.reduce(
    (sum, m) => sum + m.totalTasks,
    0,
  );
  const completedTasks = outcome.milestones.reduce(
    (sum, m) => sum + m.tasksCompleted,
    0,
  );
  const progressPercentage =
    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Add to history
  const history = {
    outcomeId: outcome.id,
    title: outcome.title,
    weekNumber: outcome.weekNumber,
    status,
    completedDate: new Date().toISOString(),
    progressPercentage,
  };

  // Update streak
  let newStreak = executionData.streak;
  let hasPartial = executionData.hasPartialWeeks;

  if (status === "completed") {
    newStreak += 1;
  } else if (status === "partial") {
    newStreak += 1;
    hasPartial = true;
  } else {
    // Streak breaks
    newStreak = 0;
    hasPartial = false;
  }

  return {
    ...executionData,
    currentOutcome: null,
    streak: newStreak,
    hasPartialWeeks: hasPartial,
    weekHistory: [...executionData.weekHistory, history],
    lastUpdated: new Date().toISOString(),
  };
};

// Complete weekly review with full completion data
export const completeWeeklyReview = (userId, outcomeId, completionData) => {
  const executionData = getExecutionData(userId);

  if (!executionData.currentOutcome) {
    throw new Error("No active outcome to complete");
  }

  // Update the outcome with completion data
  const completedOutcome = {
    ...executionData.currentOutcome,
    status: completionData.achievement,
    completionData: {
      ...completionData,
      completedAt: new Date().toISOString(),
    },
  };

  // Add to history with all completion data
  const history = {
    outcomeId: completedOutcome.id,
    title: completedOutcome.title,
    weekNumber: completedOutcome.weekNumber,
    status: completionData.achievement,
    completedDate: new Date().toISOString(),
    progressPercentage:
      completionData.tasksTotal > 0
        ? Math.round(
            (completionData.tasksCompleted / completionData.tasksTotal) * 100,
          )
        : 0,
    completionData,
  };

  // Update streak
  let newStreak = executionData.streak;
  let hasPartial = executionData.hasPartialWeeks;

  if (completionData.achievement === "completed") {
    newStreak += 1;
  } else if (completionData.achievement === "partial") {
    newStreak += 1;
    hasPartial = true;
  } else {
    // Streak breaks
    newStreak = 0;
    hasPartial = false;
  }

  // Archive the completed outcome
  const archivedOutcomes = getArchivedOutcomes(userId);
  archivedOutcomes.push(completedOutcome);
  saveArchivedOutcomes(userId, archivedOutcomes);

  // Update execution data
  const updatedData = {
    ...executionData,
    currentOutcome: null,
    streak: newStreak,
    hasPartialWeeks: hasPartial,
    weekHistory: [...executionData.weekHistory, history],
    lastUpdated: new Date().toISOString(),
  };

  saveExecutionData(updatedData);

  // Save completed outcome to backend
  founderApi
    .saveWeeklyOutcome(userId, completedOutcome)
    .then(() => {
      console.log("✅ Completed weekly outcome saved to backend");
    })
    .catch((error) => {
      // Silently fail - localStorage is primary storage
      if (process.env.NODE_ENV === "development") {
        console.debug(
          "Failed to save completed outcome to backend (expected in demo mode):",
          error.message,
        );
      }
    });

  return updatedData;
};

// Get archived outcomes
export const getArchivedOutcomes = (userId) => {
  const stored = localStorage.getItem(
    `startupverse_archived_outcomes_${userId}`,
  );
  return stored ? JSON.parse(stored) : [];
};

// Save archived outcomes
export const saveArchivedOutcomes = (userId, outcomes) => {
  localStorage.setItem(
    `startupverse_archived_outcomes_${userId}`,
    JSON.stringify(outcomes),
  );
};

// Get streak statistics
export const getStreakStats = (userId) => {
  const executionData = getExecutionData(userId);
  const history = executionData.weekHistory;

  const totalWeeks = history.length;
  const completedWeeks = history.filter((h) => h.status === "completed").length;
  const partialWeeks = history.filter((h) => h.status === "partial").length;
  const notAchievedWeeks = history.filter(
    (h) => h.status === "not-achieved",
  ).length;

  // Find longest streak
  let longestStreak = 0;
  let currentCount = 0;

  history.forEach((week) => {
    if (week.status === "completed" || week.status === "partial") {
      currentCount += 1;
      longestStreak = Math.max(longestStreak, currentCount);
    } else {
      currentCount = 0;
    }
  });

  return {
    currentStreak: executionData.streak,
    longestStreak,
    totalWeeks,
    completedWeeks,
    partialWeeks,
    notAchievedWeeks,
    completionRate:
      totalWeeks > 0 ? Math.round((completedWeeks / totalWeeks) * 100) : 0,
  };
};

// ===== TASK MANAGEMENT =====

// Generate tasks from outcome milestones
export const generateTasksFromOutcome = (
  outcome,
  userId,
  stageId,
  templateId,
) => {
  const templates = OUTCOME_TEMPLATES[stageId] || [];
  const template = templates.find((t) => t.id === templateId);

  if (!template) return [];

  const tasks = [];

  outcome.milestones.forEach((milestone, milestoneIndex) => {
    const milestoneTemplate = template.defaultMilestones[milestoneIndex];
    if (!milestoneTemplate) return;

    milestoneTemplate.defaultTasks.forEach((taskTitle, taskIndex) => {
      // Detect if task should have an action button
      const actionButton = getActionButtonForTask(taskTitle);

      if (actionButton) {
        console.log("Task with action button:", taskTitle, actionButton);
      }

      tasks.push({
        id: `task-${milestone.id}-${taskIndex}`,
        milestoneId: milestone.id,
        weekId: outcome.weekId, // ✅ FIX: Associate task with specific week
        outcomeId: outcome.id, // ✅ FIX: Associate task with specific outcome
        title: taskTitle,
        status: "pending",
        createdAt: new Date().toISOString(),
        ...(actionButton && { actionButton }),
      });
    });
  });

  console.log("Generated tasks with outcome association:", tasks);
  return tasks;
};

// Helper function to determine action button based on task content
export const getActionButtonForTask = (taskTitle) => {
  const lowerTitle = taskTitle.toLowerCase();

  // Smart Team Matching tasks
  if (
    lowerTitle.includes("smart team matching") ||
    lowerTitle.includes("browse smart team") ||
    lowerTitle.includes("search smart team") ||
    lowerTitle.includes("review smart team") ||
    lowerTitle.includes("search startupverse for") ||
    lowerTitle.includes("find and onboard a co-founder") ||
    lowerTitle.includes("hire first full-time engineer") ||
    (lowerTitle.includes("recruit") &&
      (lowerTitle.includes("co-founder") ||
        lowerTitle.includes("engineer") ||
        lowerTitle.includes("advisor"))) ||
    (lowerTitle.includes("search for") &&
      (lowerTitle.includes("co-founder") ||
        lowerTitle.includes("engineer") ||
        lowerTitle.includes("marketer") ||
        lowerTitle.includes("sales")))
  ) {
    return {
      label: "Open Smart Team Matching",
      route: "startup-office",
      icon: "search",
    };
  }

  // Profile completion tasks
  if (
    (lowerTitle.includes("complete your") && lowerTitle.includes("profile")) ||
    lowerTitle.includes("update startup profile") ||
    lowerTitle.includes("complete profile") ||
    (lowerTitle.includes("complete") && lowerTitle.includes("founder profile"))
  ) {
    return {
      label: "Edit Profile",
      route: "settings",
      icon: "user",
    };
  }

  // Team management tasks
  if (
    (lowerTitle.includes("onboard") &&
      (lowerTitle.includes("engineer") || lowerTitle.includes("co-founder"))) ||
    lowerTitle.includes("assign first tasks")
  ) {
    return {
      label: "View Team",
      route: "team",
      icon: "users",
    };
  }

  return undefined;
};

// Get tasks for user (synchronous, loads from localStorage, background sync from backend)
export const getTasks = (userId) => {
  // Load from backend in background to sync latest data
  founderApi
    .getTasks(userId)
    .then((response) => {
      if (response.success && response.tasks) {
        // Update localStorage cache with backend data
        localStorage.setItem(
          `${TASKS_KEY}_${userId}`,
          JSON.stringify(response.tasks),
        );
        console.log(
          `✅ [TASK SYNC] Updated ${response.tasks.length} tasks from backend for founder ${userId}`,
        );

        // Trigger storage event for cross-tab/component sync
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: `${TASKS_KEY}_${userId}`,
            newValue: JSON.stringify(response.tasks),
            storageArea: localStorage,
          }),
        );
      }
    })
    .catch((error) => {
      // Silently fail - backend sync is optional, localStorage is source of truth
      // Only log in development
      if (process.env.NODE_ENV === "development") {
        console.debug(
          "Background task sync from backend failed (expected in demo mode):",
          error.message,
        );
      }
    });

  // Return localStorage immediately for instant UI
  const stored = localStorage.getItem(`${TASKS_KEY}_${userId}`);
  return stored ? JSON.parse(stored) : [];
};

// Force refresh tasks from backend (async version)
export const refreshTasksFromBackend = async (userId) => {
  try {
    console.log(
      `🔄 [TASK SYNC] Force refreshing tasks from backend for ${userId}`,
    );
    const response = await founderApi.getTasks(userId, {}, true); // bustCache = true
    if (response.success && response.tasks) {
      // Update localStorage with fresh backend data
      localStorage.setItem(
        `${TASKS_KEY}_${userId}`,
        JSON.stringify(response.tasks),
      );
      console.log(
        `✅ [TASK SYNC] Force refresh complete - ${response.tasks.length} tasks synced`,
      );

      // Trigger storage event
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: `${TASKS_KEY}_${userId}`,
          newValue: JSON.stringify(response.tasks),
          storageArea: localStorage,
        }),
      );

      return response.tasks;
    }
  } catch (error) {
    console.error("❌ [TASK SYNC] Force refresh failed:", error);
  }

  // Fallback to localStorage
  const stored = localStorage.getItem(`${TASKS_KEY}_${userId}`);
  return stored ? JSON.parse(stored) : [];
};

// Save tasks for user (synchronous with background backend save)
export const saveTasks = (userId, tasks) => {
  // Save to localStorage immediately for instant UI update
  localStorage.setItem(`${TASKS_KEY}_${userId}`, JSON.stringify(tasks));

  // Save each task to backend in background (don't await)
  Promise.all(tasks.map((task) => founderApi.saveTask(userId, task)))
    .then(() => {
      console.log("✅ Tasks synced to backend");
    })
    .catch((error) => {
      // Silently fail - localStorage is primary storage
      if (process.env.NODE_ENV === "development") {
        console.debug(
          "Failed to sync tasks to backend (expected in demo mode):",
          error.message,
        );
      }
    });
};

// Sync tasks to milestones and update outcome progress
export const syncTasksToMilestones = (userId) => {
  const tasks = getTasks(userId);
  const executionData = getExecutionData(userId);

  if (!executionData.currentOutcome) {
    // No active outcome - nothing to sync
    return;
  }

  let outcome = executionData.currentOutcome;

  // Safety check: ensure milestones array exists
  if (!outcome.milestones || outcome.milestones.length === 0) {
    return;
  }

  let outcomeUpdated = false;

  // Update each milestone based on its tasks
  const updatedMilestones = outcome.milestones.map((milestone) => {
    // Find all tasks belonging to this milestone
    const milestoneTasks = tasks.filter((t) => t.milestoneId === milestone.id);
    const completedCount = milestoneTasks.filter(
      (t) => t.status === "completed",
    ).length;

    // Update if count changed
    if (milestone.tasksCompleted !== completedCount) {
      outcomeUpdated = true;

      // Determine milestone status based on task completion
      const status =
        completedCount >= milestone.totalTasks
          ? "completed"
          : completedCount > 0
            ? "in-progress"
            : "pending";

      return { ...milestone, tasksCompleted: completedCount, status };
    }

    return milestone;
  });

  if (outcomeUpdated) {
    // Update outcome with new milestone progress
    outcome = { ...outcome, milestones: updatedMilestones };

    // Save updated execution data
    const updatedData = { ...executionData, currentOutcome: outcome };
    localStorage.setItem(
      `${EXECUTION_DATA_KEY}_${userId}`,
      JSON.stringify(updatedData),
    );

    // Sync to backend in background
    founderApi.saveWeeklyOutcome(userId, outcome).catch((error) => {
      if (process.env.NODE_ENV === "development") {
        console.debug("Failed to sync outcome to backend:", error.message);
      }
    });

    console.log("✅ Milestones synced from task completion");
  }
};

// Toggle task completion
export const toggleTask = (userId, taskId) => {
  const tasks = getTasks(userId);
  const updatedTasks = tasks.map((task) => {
    if (task.id === taskId) {
      if (task.status === "completed") {
        return { ...task, status: "pending", completedAt: undefined };
      } else if (task.status !== "blocked") {
        return {
          ...task,
          status: "completed",
          completedAt: new Date().toISOString(),
        };
      }
    }
    return task;
  });

  saveTasks(userId, updatedTasks);

  // 🚀 NEW: Sync tasks to milestones and update outcome progress
  syncTasksToMilestones(userId);

  return updatedTasks;
};

// Block a task
export const blockTask = (userId, taskId, reason, note) => {
  const tasks = getTasks(userId);
  const updatedTasks = tasks.map((task) => {
    if (task.id === taskId) {
      return {
        ...task,
        status: "blocked",
        blockerReason: reason,
        blockerNote: note,
      };
    }
    return task;
  });

  saveTasks(userId, updatedTasks);

  // 🚀 NEW: Sync tasks to milestones (blocking reduces completion count)
  syncTasksToMilestones(userId);

  return updatedTasks;
};

// Unblock a task
export const unblockTask = (userId, taskId) => {
  const tasks = getTasks(userId);
  const updatedTasks = tasks.map((task) => {
    if (task.id === taskId && task.status === "blocked") {
      return {
        ...task,
        status: "pending",
        blockerReason: undefined,
        blockerNote: undefined,
      };
    }
    return task;
  });

  saveTasks(userId, updatedTasks);

  // 🚀 NEW: Sync tasks to milestones
  syncTasksToMilestones(userId);

  return updatedTasks;
};

// Assign a task to a team member
export const assignTask = (userId, taskId, assignedTo, assignedToName) => {
  const tasks = getTasks(userId);
  const updatedTasks = tasks.map((task) => {
    if (task.id === taskId) {
      return {
        ...task,
        assignedTo: assignedTo || undefined,
        assignedToName: assignedToName || undefined,
      };
    }
    return task;
  });

  saveTasks(userId, updatedTasks);
  return updatedTasks;
};

// Set incentive for a task (MVP - Incentive Recording)
export const setTaskIncentive = (userId, taskId, incentive) => {
  const tasks = getTasks(userId);
  const updatedTasks = tasks.map((task) => {
    if (task.id === taskId) {
      return {
        ...task,
        incentive,
      };
    }
    return task;
  });

  saveTasks(userId, updatedTasks);
  return updatedTasks;
};

// Add a comment to a task
export const addTaskComment = (founderId, taskId, userId, userName, text) => {
  const tasks = getTasks(founderId);
  const updatedTasks = tasks.map((task) => {
    if (task.id === taskId) {
      const comments = task.comments || [];
      return {
        ...task,
        comments: [
          ...comments,
          {
            id: `comment-${Date.now()}`,
            userId,
            userName,
            text,
            timestamp: new Date().toISOString(),
          },
        ],
      };
    }
    return task;
  });

  saveTasks(founderId, updatedTasks);
  return updatedTasks;
};

// Update outcome with task progress
export const updateOutcomeProgress = (outcome, tasks) => {
  const updatedMilestones = outcome.milestones.map((milestone) => {
    const milestoneTasks = tasks.filter((t) => t.milestoneId === milestone.id);
    const completedTasks = milestoneTasks.filter(
      (t) => t.status === "completed",
    ).length;
    const totalTasks = milestoneTasks.length;

    const status =
      completedTasks >= totalTasks && totalTasks > 0
        ? "completed"
        : completedTasks > 0
          ? "in-progress"
          : "pending";

    return {
      ...milestone,
      tasksCompleted: completedTasks,
      totalTasks,
      status,
    };
  });

  return { ...outcome, milestones: updatedMilestones };
};
