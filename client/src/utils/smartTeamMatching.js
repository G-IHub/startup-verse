// Smart Team Matching Algorithm
// Generates intelligent team recommendations based on founder profile

// Industry-specific technology requirements
const industryTechStacks = {
  "Health Tech": [
    "Backend Developer",
    "Frontend Developer",
    "ML Engineer",
    "Data Scientist",
    "Product Designer",
    "Compliance Officer",
    "Healthcare Specialist",
  ],
  FinTech: [
    "Backend Developer",
    "Frontend Developer",
    "Security Engineer",
    "Blockchain Developer",
    "Compliance Officer",
    "Financial Analyst",
    "Product Designer",
  ],
  "AI/Machine Learning": [
    "ML Engineer",
    "Data Scientist",
    "Backend Developer",
    "Frontend Developer",
    "ML Ops Engineer",
    "Product Designer",
    "Research Scientist",
  ],
  "E-commerce": [
    "Full-stack Developer",
    "Product Designer",
    "Growth Marketing Lead",
    "Backend Developer",
    "Frontend Developer",
    "Operations Manager",
  ],
  SaaS: [
    "Full-stack Developer",
    "Product Designer",
    "Backend Developer",
    "Frontend Developer",
    "DevOps Engineer",
    "Growth Marketing Lead",
    "Customer Success Lead",
  ],
  EdTech: [
    "Full-stack Developer",
    "Product Designer",
    "Content Strategist",
    "Backend Developer",
    "Frontend Developer",
    "Education Specialist",
  ],
  IoT: [
    "Embedded Systems Engineer",
    "Backend Developer",
    "Frontend Developer",
    "Hardware Engineer",
    "Product Designer",
    "Firmware Developer",
  ],
  "Blockchain/Web3": [
    "Blockchain Developer",
    "Smart Contract Developer",
    "Backend Developer",
    "Frontend Developer",
    "Security Engineer",
    "Community Manager",
  ],
  Gaming: [
    "Game Developer",
    "Unity Developer",
    "Product Designer",
    "Backend Developer",
    "Sound Designer",
    "Game Artist",
  ],
  DevTools: [
    "Full-stack Developer",
    "Backend Developer",
    "Developer Advocate",
    "Technical Writer",
    "Product Designer",
    "DevOps Engineer",
  ],
};

// Stage-specific role priorities
const stagePriorities = {
  "Idea/Concept": {
    core: ["Product Designer", "Full-stack Developer", "Market Researcher"],
    supporting: ["Growth Marketing Lead", "Business Analyst"],
    future: ["DevOps Engineer", "Customer Success Lead", "Sales Lead"],
  },
  "MVP Development": {
    core: [
      "Full-stack Developer",
      "Backend Developer",
      "Frontend Developer",
      "Product Designer",
    ],
    supporting: ["QA Engineer", "Growth Marketing Lead", "Technical Writer"],
    future: ["DevOps Engineer", "Customer Success Lead", "Sales Lead"],
  },
  "Beta/Testing": {
    core: [
      "QA Engineer",
      "Product Designer",
      "Growth Marketing Lead",
      "Customer Success Lead",
    ],
    supporting: ["Backend Developer", "Frontend Developer", "DevOps Engineer"],
    future: ["Sales Lead", "Operations Manager"],
  },
  Launch: {
    core: [
      "Growth Marketing Lead",
      "Customer Success Lead",
      "Sales Lead",
      "Product Designer",
    ],
    supporting: [
      "DevOps Engineer",
      "Backend Developer",
      "Frontend Developer",
      "QA Engineer",
    ],
    future: ["Operations Manager", "HR Manager", "Finance Manager"],
  },
  "Post-Launch/Growth": {
    core: [
      "Sales Lead",
      "Growth Marketing Lead",
      "Customer Success Lead",
      "DevOps Engineer",
    ],
    supporting: [
      "Product Designer",
      "Backend Developer",
      "Frontend Developer",
      "Operations Manager",
    ],
    future: ["Finance Manager", "HR Manager", "Legal Counsel"],
  },
  Scaling: {
    core: [
      "Operations Manager",
      "Sales Lead",
      "HR Manager",
      "DevOps Engineer",
      "Engineering Manager",
    ],
    supporting: [
      "Growth Marketing Lead",
      "Customer Success Lead",
      "Finance Manager",
    ],
    future: [
      "Legal Counsel",
      "Chief Technology Officer",
      "Chief Marketing Officer",
    ],
  },
};

// Team size-based recommendations
const teamSizeGuidance = {
  "Just me (Solo founder)": 3,
  "2-5 people": 2,
  "6-10 people": 1,
  "11-20 people": 1,
  "21-50 people": 0,
  "51-100 people": 0,
  "100+ people": 0,
};

// Role skill mappings
const roleSkills = {
  "Frontend Developer": [
    "React",
    "TypeScript",
    "Tailwind CSS",
    "Next.js",
    "HTML/CSS",
    "JavaScript",
  ],
  "Backend Developer": [
    "Node.js",
    "Python",
    "PostgreSQL",
    "REST APIs",
    "GraphQL",
    "AWS",
  ],
  "Full-stack Developer": [
    "React",
    "Node.js",
    "TypeScript",
    "PostgreSQL",
    "AWS",
    "Docker",
  ],
  "ML Engineer": [
    "Python",
    "TensorFlow",
    "PyTorch",
    "ML Ops",
    "Data Processing",
    "Model Deployment",
  ],
  "Data Scientist": [
    "Python",
    "R",
    "Statistics",
    "Data Analysis",
    "Machine Learning",
    "Visualization",
  ],
  "Product Designer": [
    "Figma",
    "User Research",
    "Prototyping",
    "UI/UX Design",
    "Design Systems",
    "Wireframing",
  ],
  "DevOps Engineer": [
    "AWS",
    "Docker",
    "Kubernetes",
    "CI/CD",
    "Terraform",
    "Monitoring",
  ],
  "Growth Marketing Lead": [
    "SEO",
    "Content Marketing",
    "Analytics",
    "A/B Testing",
    "Social Media",
    "Email Marketing",
  ],
  "QA Engineer": [
    "Test Automation",
    "Selenium",
    "Jest",
    "Test Strategy",
    "Bug Tracking",
    "API Testing",
  ],
  "Security Engineer": [
    "Cybersecurity",
    "Penetration Testing",
    "Encryption",
    "Security Audits",
    "Compliance",
  ],
  "Blockchain Developer": [
    "Solidity",
    "Web3.js",
    "Smart Contracts",
    "Ethereum",
    "DeFi",
    "NFT",
  ],
  "Mobile Developer": [
    "React Native",
    "Swift",
    "Kotlin",
    "iOS",
    "Android",
    "Mobile UI",
  ],
  "Customer Success Lead": [
    "Customer Support",
    "CRM",
    "Communication",
    "Problem Solving",
    "Training",
  ],
  "Sales Lead": [
    "B2B Sales",
    "Lead Generation",
    "CRM",
    "Negotiation",
    "Pipeline Management",
  ],
  "Operations Manager": [
    "Project Management",
    "Process Optimization",
    "Team Coordination",
    "Budget Management",
  ],
  "Technical Writer": [
    "Documentation",
    "API Docs",
    "Technical Writing",
    "Markdown",
    "Content Strategy",
  ],
  "Community Manager": [
    "Community Building",
    "Social Media",
    "Discord/Slack",
    "Content Creation",
    "Engagement",
  ],
  "Healthcare Specialist": [
    "Clinical Knowledge",
    "Medical Research",
    "HIPAA",
    "Healthcare IT",
    "Patient Care",
  ],
  "Compliance Officer": [
    "Regulatory Compliance",
    "Risk Management",
    "Legal",
    "Auditing",
    "Policy Development",
  ],
  "Embedded Systems Engineer": [
    "C/C++",
    "Firmware",
    "RTOS",
    "Hardware Integration",
    "IoT Protocols",
  ],
  "Hardware Engineer": [
    "Circuit Design",
    "PCB Design",
    "Electronics",
    "Prototyping",
    "Testing",
  ],
  "Financial Analyst": [
    "Financial Modeling",
    "Excel",
    "Forecasting",
    "Investment Analysis",
    "Reporting",
  ],
  "Market Researcher": [
    "Market Analysis",
    "Surveys",
    "Data Collection",
    "Competitive Analysis",
    "Insights",
  ],
};

// Mock talent pool - In production, this would be fetched from a database
const usedNames = new Set();

const generateMockTalent = (role) => {
  const names = [
    "Alex Rodriguez",
    "Sarah Chen",
    "Marcus Johnson",
    "Emily Zhang",
    "David Kumar",
    "Lisa Park",
    "James Wilson",
    "Maya Patel",
    "Chris Anderson",
    "Sophia Lee",
    "Michael Brown",
    "Olivia Garcia",
    "Daniel Kim",
    "Emma Martinez",
    "Ryan Taylor",
    "Jessica Wang",
    "Tom Anderson",
    "Priya Sharma",
    "Carlos Martinez",
    "Nina Patel",
    "Kevin Liu",
    "Rachel Green",
    "Jordan Smith",
    "Aisha Khan",
    "Lucas Brown",
    "Zoe Williams",
    "Nathan Chen",
    "Isabella Rodriguez",
    "Eric Thompson",
    "Mia Davis",
  ];

  // Filter out used names
  const availableNames = names.filter((name) => !usedNames.has(name));

  // If all names used, reset
  if (availableNames.length === 0) {
    usedNames.clear();
    availableNames.push(...names);
  }

  // Pick a random available name
  const randomName =
    availableNames[Math.floor(Math.random() * availableNames.length)];
  usedNames.add(randomName);

  const skills = roleSkills[role] || [];
  const matchScore = 75 + Math.floor(Math.random() * 25); // 75-100% match

  // Generate rich profile data
  const experienceYears = ["2-5 years", "5-8 years", "8+ years"][
    Math.floor(Math.random() * 3)
  ];
  const locations = [
    "San Francisco, CA",
    "New York, NY",
    "Austin, TX",
    "Seattle, WA",
    "Boston, MA",
    "Remote - US",
    "London, UK",
    "Berlin, Germany",
    "Remote - Global",
  ];

  const companies = [
    ["Google", "Meta", "Amazon"],
    ["Stripe", "Airbnb", "Uber"],
    ["Microsoft", "Apple", "Netflix"],
    ["Salesforce", "Adobe", "Oracle"],
    ["Tesla", "SpaceX", "Rivian"],
    ["Y Combinator Startup", "Series A Startup", "Series B Startup"],
  ];

  const industries = [
    ["AI/ML", "SaaS", "FinTech"],
    ["HealthTech", "EdTech", "E-commerce"],
    ["Blockchain", "Web3", "DeFi"],
    ["DevTools", "Enterprise", "B2B SaaS"],
    ["Consumer Tech", "Social", "Gaming"],
  ];

  const roleBios = {
    "ML Engineer": [
      "Specialized in building production-grade ML systems with 8+ years of experience. Led ML infrastructure at top tech companies.",
      "Passionate about bringing AI to production. Built recommendation systems serving millions of users daily.",
      "Expert in MLOps and model deployment. Previously scaled ML systems at Fortune 500 companies.",
    ],

    "Backend Developer": [
      "Full-stack engineer with deep backend expertise. Built scalable APIs handling 100M+ requests/day.",
      "Passionate about clean architecture and microservices. Led backend teams at high-growth startups.",
      "Expert in distributed systems and database optimization. Previously at FAANG companies.",
    ],

    "Frontend Developer": [
      "Crafting beautiful, performant user interfaces. Expert in React ecosystem and modern web technologies.",
      "Passionate about user experience and accessibility. Built products used by millions globally.",
      "Specializing in design systems and component architecture. Previously at leading design-focused companies.",
    ],

    "Product Designer": [
      "End-to-end product designer with strong UX research background. Designed products from 0 to 1.",
      "Passionate about solving complex problems with simple, elegant solutions. Led design at multiple startups.",
      "Expert in user research, prototyping, and design systems. Previously at top design agencies.",
    ],

    "Data Scientist": [
      "Data scientist with expertise in statistical modeling and ML. Drove data-driven decisions at scale.",
      "Passionate about extracting insights from complex datasets. PhD in Statistics from top university.",
      "Expert in A/B testing, predictive modeling, and analytics. Previously at data-driven companies.",
    ],

    "Full-stack Developer": [
      "Versatile engineer comfortable across the full stack. Built products from database to UI.",
      "Passionate about shipping fast and iterating. Led engineering at early-stage startups.",
      "Expert in modern web technologies and cloud infrastructure. Previously founding engineer at successful startups.",
    ],

    "DevOps Engineer": [
      "Infrastructure expert with deep Kubernetes and AWS knowledge. Built platforms serving millions.",
      "Passionate about automation and reliability. Reduced deployment times by 90% at previous companies.",
      "Expert in CI/CD, monitoring, and cloud architecture. Previously at infrastructure-heavy companies.",
    ],

    "Growth Marketing Lead": [
      "Growth marketer with proven track record of scaling products. Led growth at multiple startups.",
      "Passionate about data-driven growth experiments. Achieved 300% user growth in previous role.",
      "Expert in SEO, content marketing, and performance marketing. Previously at high-growth startups.",
    ],

    "Sales Lead": [
      "Enterprise sales leader with $10M+ in closed revenue. Built sales teams from scratch.",
      "Passionate about consultative selling and customer success. Previously at top B2B SaaS companies.",
      "Expert in enterprise deals and sales process optimization. Consistently exceeded quotas by 150%.",
    ],
  };

  const defaultBio = `${experienceYears.split(" ")[0]} years of experience building scalable products. Passionate about startups and innovation.`;
  const bio = (roleBios[role] || [defaultBio])[
    Math.floor(Math.random() * (roleBios[role]?.length || 1))
  ];

  // Generate email based on name
  const emailName = randomName.toLowerCase().replace(/\s+/g, ".");
  const emailDomains = ["gmail.com", "protonmail.com", "hey.com", "icloud.com"];
  const email = `${emailName}@${emailDomains[Math.floor(Math.random() * emailDomains.length)]}`;

  return {
    id: `talent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: randomName,
    role: role,
    skills: skills.slice(0, 3), // Top 3 skills for card display
    allSkills: skills, // All skills for profile modal
    match: matchScore,
    available: Math.random() > 0.3, // 70% chance of being available
    experience: experienceYears,
    location: locations[Math.floor(Math.random() * locations.length)],
    bio: bio,
    email: email,
    previousCompanies: companies[Math.floor(Math.random() * companies.length)],
    interestedIndustries:
      industries[Math.floor(Math.random() * industries.length)],
    availability: [
      "Immediately",
      "2 weeks notice",
      "1 month notice",
      "Open to discuss",
    ][Math.floor(Math.random() * 4)],
    remotePreference: ["Remote only", "Hybrid", "On-site", "Flexible"][
      Math.floor(Math.random() * 4)
    ],
    portfolioUrl:
      Math.random() > 0.5 ? "https://portfolio.example.com" : undefined,
    linkedinUrl: "https://linkedin.com/in/example",
    githubUrl: Math.random() > 0.5 ? "https://github.com/example" : undefined,
  };
};

/**
 * Generate intelligent team recommendations based on founder profile
 */
export function generateSmartTeamRecommendations(profile) {
  const recommendations = [];
  const {
    industryFocus,
    stage,
    teamSize,
    rolesNeeded,
    startupDescription,
    targetAudience,
  } = profile;

  // Get roles already filled/needed by founder
  const existingRoles = new Set(rolesNeeded || []);

  // 🆕 FILTER OUT ROLES ALREADY FILLED BY TEAM MEMBERS
  // Check actual team members who have joined (from invitations)
  const teamMembers = [];
  teamMembers.forEach((member) => {
    if (member.role) {
      existingRoles.add(member.role);
    }
  });

  // Parse startup description for technology keywords
  const description = (startupDescription || "").toLowerCase();
  const industry = (industryFocus || "").toLowerCase();

  // Check for ML/AI in BOTH industry and description
  const hasMachineLearning =
    industry.includes("ml") ||
    industry.includes("machine learning") ||
    industry.includes("ai") ||
    industry.includes("artificial intelligence") ||
    description.includes("ml") ||
    description.includes("machine learning") ||
    description.includes("ai ") ||
    description.includes("artificial intelligence");

  const hasBlockchain =
    industry.includes("blockchain") ||
    industry.includes("web3") ||
    industry.includes("crypto") ||
    description.includes("blockchain") ||
    description.includes("web3") ||
    description.includes("crypto");

  const hasMobile =
    industry.includes("mobile") ||
    description.includes("mobile") ||
    description.includes("ios") ||
    description.includes("android") ||
    description.includes("app");

  const hasEcommerce =
    industry.includes("ecommerce") ||
    industry.includes("e-commerce") ||
    description.includes("ecommerce") ||
    description.includes("e-commerce") ||
    description.includes("marketplace") ||
    description.includes("shopping");

  const hasHealthcare =
    industry.includes("health") ||
    industry.includes("medical") ||
    description.includes("health") ||
    description.includes("medical") ||
    description.includes("patient");

  const hasFinance =
    industry.includes("fin") ||
    industry.includes("payment") ||
    industry.includes("banking") ||
    description.includes("payment") ||
    description.includes("banking") ||
    description.includes("financial");

  const hasIoT =
    industry.includes("iot") ||
    industry.includes("hardware") ||
    description.includes("iot") ||
    description.includes("hardware") ||
    description.includes("embedded") ||
    description.includes("sensor");

  // Log for debugging
  console.log("Smart Matching Analysis:", {
    industry: industryFocus,
    description: startupDescription,
    hasMachineLearning,
    hasHealthcare,
    hasFinance,
    hasBlockchain,
    hasMobile,
    hasEcommerce,
    hasIoT,
  });

  // Determine target audience type
  const isB2B = targetAudience?.some(
    (a) =>
      a.toLowerCase().includes("b2b") ||
      a.toLowerCase().includes("enterprise") ||
      a.toLowerCase().includes("business"),
  );
  const isB2C = targetAudience?.some(
    (a) =>
      a.toLowerCase().includes("b2c") ||
      a.toLowerCase().includes("consumer") ||
      a.toLowerCase().includes("individual"),
  );

  // 1. Industry-specific recommendations
  let industryRoles = [];
  if (industryFocus) {
    // Find matching industry or use default
    const matchedIndustry = Object.keys(industryTechStacks).find(
      (key) =>
        key.toLowerCase().includes(industryFocus.toLowerCase()) ||
        industryFocus.toLowerCase().includes(key.toLowerCase()),
    );
    industryRoles = matchedIndustry ? industryTechStacks[matchedIndustry] : [];
  }

  // 2. Stage-specific recommendations
  let stagePriority = stagePriorities["MVP Development"]; // default
  if (stage) {
    const matchedStage = Object.keys(stagePriorities).find(
      (key) =>
        key.toLowerCase().includes(stage.toLowerCase()) ||
        stage.toLowerCase().includes(key.toLowerCase()),
    );
    if (matchedStage) {
      stagePriority = stagePriorities[matchedStage];
    }
  }

  // 3. Determine how many roles to recommend based on team size
  const recommendCount =
    teamSizeGuidance[teamSize || "Just me (Solo founder)"] || 3;

  // 4. Build recommendations with priority and intelligent reasoning
  const addRecommendation = (role, priority, reasoning) => {
    if (!existingRoles.has(role)) {
      recommendations.push({
        id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role,
        priority,
        reasoning,
        skills: roleSkills[role] || [],
      });
      existingRoles.add(role); // Prevent duplicates
    }
  };

  // 5. Add technology-specific roles first (highest priority for specialized needs)
  if (hasMachineLearning) {
    addRecommendation(
      "ML Engineer",
      "critical",
      `Builds AI/ML features and handles model deployment.`,
    );
    addRecommendation(
      "Data Scientist",
      "high",
      `Essential for data analysis and ML optimization. Works with ML Engineer.`,
    );
    addRecommendation(
      "Backend Developer",
      "critical",
      `Builds infrastructure for ML model serving and APIs.`,
    );
  }

  if (hasBlockchain) {
    addRecommendation(
      "Blockchain Developer",
      "critical",
      `Builds smart contracts and Web3 integration.`,
    );
    addRecommendation(
      "Security Engineer",
      "high",
      `Handles blockchain security and smart contract audits.`,
    );
  }

  if (hasMobile && !hasMachineLearning) {
    addRecommendation(
      "Mobile Developer",
      "critical",
      `Develops native iOS and Android apps.`,
    );
  }

  if (hasHealthcare) {
    addRecommendation(
      "Healthcare Specialist",
      "high",
      `Ensures clinical accuracy and regulatory compliance.`,
    );
    addRecommendation(
      "Compliance Officer",
      "high",
      `Handles HIPAA compliance and data privacy.`,
    );
  }

  if (hasFinance) {
    addRecommendation(
      "Compliance Officer",
      "critical",
      `Ensures KYC/AML compliance and security standards.`,
    );
    addRecommendation(
      "Security Engineer",
      "critical",
      `Protects transactions and prevents fraud.`,
    );
  }

  if (hasIoT) {
    addRecommendation(
      "Embedded Systems Engineer",
      "critical",
      `Develops firmware and embedded IoT software.`,
    );
    addRecommendation(
      "Hardware Engineer",
      "high",
      `Designs and prototypes IoT hardware.`,
    );
  }

  // 6. Add core technical roles based on stage (if not already added)
  stagePriority.core.forEach((role) => {
    const inIndustry = industryRoles.includes(role);
    let reasoning = `Essential for ${stage || "current"} stage`;

    // Add more context to reasoning
    if (role === "Product Designer") {
      reasoning = `Designs user flows and creates intuitive UX/UI.`;
    } else if (role === "Full-stack Developer") {
      reasoning = `Versatile developer handling frontend and backend.`;
    } else if (role === "Frontend Developer") {
      reasoning = `Builds responsive UI and ensures great user experience.`;
    } else if (role === "Backend Developer" && !hasMachineLearning) {
      reasoning = `Develops server-side logic, APIs, and databases.`;
    } else if (role === "Growth Marketing Lead") {
      reasoning = `Drives user acquisition through SEO and growth experiments.`;
    } else if (role === "QA Engineer") {
      reasoning = `Ensures product quality through automated testing.`;
    } else if (role === "Customer Success Lead") {
      reasoning = `Manages customer onboarding and retention.`;
    }

    addRecommendation(role, "critical", reasoning);
  });

  // 7. Add business roles based on target audience
  if (isB2B && !existingRoles.has("Sales Lead")) {
    addRecommendation(
      "Sales Lead",
      stage?.toLowerCase().includes("launch") ||
        stage?.toLowerCase().includes("growth")
        ? "critical"
        : "high",
      `B2B sales expertise for enterprise customer acquisition.`,
    );
  }

  if (isB2C && !existingRoles.has("Growth Marketing Lead")) {
    addRecommendation(
      "Growth Marketing Lead",
      stage?.toLowerCase().includes("launch") ||
        stage?.toLowerCase().includes("growth")
        ? "critical"
        : "medium",
      `Consumer products need strong growth marketing for acquisition.`,
    );
  }

  if (hasEcommerce) {
    addRecommendation(
      "Operations Manager",
      "high",
      `Manages inventory, logistics, and order fulfillment.`,
    );
  }

  // 8. Add industry-specific roles (high priority) if not already added
  industryRoles.slice(0, 4).forEach((role) => {
    if (!existingRoles.has(role)) {
      addRecommendation(
        role,
        "high",
        `Key role for ${industryFocus} with specialized domain knowledge.`,
      );
    }
  });

  // 9. Add supporting roles based on stage (medium priority)
  stagePriority.supporting.forEach((role) => {
    if (recommendations.length < recommendCount + 3) {
      let reasoning = `Important for ${stage || "current"} stage`;

      if (role === "DevOps Engineer") {
        reasoning = `Sets up CI/CD pipelines and manages infrastructure.`;
      } else if (role === "Technical Writer") {
        reasoning = `Creates documentation and API guides.`;
      }

      addRecommendation(role, "medium", reasoning);
    }
  });

  // 10. Add future planning roles (nice-to-have priority)
  stagePriority.future.slice(0, 2).forEach((role) => {
    if (recommendations.length < recommendCount + 5) {
      addRecommendation(
        role,
        "nice-to-have",
        `Plan ahead - this role becomes critical as you grow.`,
      );
    }
  });

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, "nice-to-have": 3 };
  recommendations.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
  );

  return recommendations;
}

/**
 * Get talent matches for specific roles
 */
export function getTalentMatchesForRoles(roles, count = 3) {
  // Return empty array - no demo data
  // In production, this would fetch real talent from database
  return [];
}

/**
 * Get stage-specific insights and recommendations
 */
export function getStageInsights(stage) {
  const insights = {
    "Idea/Concept": {
      focusAreas: ["Market Research", "Problem Validation", "MVP Planning"],
      keyMilestones: [
        "Problem-Solution Fit",
        "Target Audience Defined",
        "MVP Scope Set",
      ],
      recommendedActions: [
        "Talk to potential customers",
        "Build landing page",
        "Create product wireframes",
      ],
    },
    "MVP Development": {
      focusAreas: ["Product Development", "User Testing", "Early Feedback"],
      keyMilestones: [
        "MVP Feature Complete",
        "Beta Users Onboarded",
        "Core Workflows Working",
      ],
      recommendedActions: [
        "Focus on core features only",
        "Get early user feedback",
        "Iterate based on feedback",
      ],
    },
    "Beta/Testing": {
      focusAreas: ["User Feedback", "Bug Fixes", "Product Refinement"],
      keyMilestones: [
        "User Satisfaction >70%",
        "Critical Bugs Fixed",
        "Product-Market Fit Signals",
      ],
      recommendedActions: [
        "Collect user feedback systematically",
        "Fix critical issues",
        "Prepare go-to-market strategy",
      ],
    },
    Launch: {
      focusAreas: ["User Acquisition", "Marketing", "Customer Support"],
      keyMilestones: [
        "First 100 Users",
        "Marketing Channels Tested",
        "Support System Ready",
      ],
      recommendedActions: [
        "Launch on Product Hunt/HN",
        "Activate marketing channels",
        "Monitor metrics closely",
      ],
    },
    "Post-Launch/Growth": {
      focusAreas: ["Growth", "Retention", "Revenue"],
      keyMilestones: [
        "MRR Growth >20%",
        "Retention Rate >40%",
        "Paying Customers",
      ],
      recommendedActions: [
        "Optimize conversion funnel",
        "Focus on retention",
        "Scale successful channels",
      ],
    },
    Scaling: {
      focusAreas: ["Infrastructure", "Team Building", "Operations"],
      keyMilestones: [
        "Infrastructure Scaled",
        "Team Doubled",
        "Processes Documented",
      ],
      recommendedActions: [
        "Invest in DevOps",
        "Hire leadership",
        "Document processes",
      ],
    },
  };

  const defaultInsight = insights["MVP Development"];

  if (!stage) return defaultInsight;

  const matchedStage = Object.keys(insights).find(
    (key) =>
      key.toLowerCase().includes(stage.toLowerCase()) ||
      stage.toLowerCase().includes(key.toLowerCase()),
  );

  return matchedStage ? insights[matchedStage] : defaultInsight;
}
