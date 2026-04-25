/**
 * Single source of truth for founder onboarding + profile fields (options + validation).
 */

export const FOUNDER_INDUSTRY_OPTIONS = [
  "FinTech",
  "HealthTech",
  "EdTech",
  "E-commerce",
  "SaaS",
  "AI/Machine Learning",
  "Blockchain/Web3",
  "CleanTech",
  "FoodTech",
  "PropTech",
  "AgriTech",
  "BioTech",
  "HRTech",
  "MarTech",
  "CyberSecurity",
  "Gaming",
  "Social Media",
  "IoT",
  "Logistics/Supply Chain",
  "Travel/Hospitality",
  "Entertainment/Media",
  "Fashion/Beauty",
  "Sports/Fitness",
  "Others",
];

export const FOUNDER_TARGET_AUDIENCE_OPTIONS = [
  "B2C",
  "B2B",
  "Enterprise",
  "Consumers",
  "SMB",
  "Students",
  "Professionals",
  "Developers",
  "Creatives",
  "Healthcare Providers",
  "Educators",
  "Others",
];

export const FOUNDER_ROLES_NEEDED_OPTIONS = [
  "CTO",
  "CMO",
  "CPO",
  "CFO",
  "COO",
  "Head of Sales",
  "Head of Marketing",
  "Head of Product",
  "Head of Engineering",
  "Head of Design",
  "Full-stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "Mobile Developer",
  "DevOps Engineer",
  "Data Scientist",
  "Data Engineer",
  "ML Engineer",
  "UI/UX Designer",
  "Product Designer",
  "Graphic Designer",
  "Product Manager",
  "Project Manager",
  "Business Analyst",
  "Sales Manager",
  "Marketing Manager",
  "Content Creator",
  "Social Media Manager",
  "Growth Hacker",
  "Customer Success Manager",
  "HR Manager",
  "Legal Advisor",
  "Financial Analyst",
  "QA Engineer",
  "Others",
];

export const FOUNDER_TEAM_SIZE_OPTIONS = [
  "Just me (Solo founder)",
  "2-5 people",
  "6-10 people",
  "11-20 people",
  "21-50 people",
  "51-100 people",
  "100+ people",
];

/** Matches `getStageName` labels in algorithmicStageDetection.js */
export const FOUNDER_STAGE_OPTIONS = [
  "Idea Validation",
  "MVP Development",
  "Early Traction",
  "Team Building",
  "Growth",
  "Scale",
];

export const FOUNDER_VALIDATED_IDEA_OPTIONS = [
  "Yes - Validated with potential customers",
  "No - Still exploring ideas",
];

export const FOUNDER_MVP_OPTIONS = [
  "Yes - Working MVP/prototype",
  "In progress - Currently building",
  "No - Haven't started building yet",
];

export const FOUNDER_CUSTOMERS_OPTIONS = [
  "Yes - Paying customers",
  "Yes - Active users (not paying yet)",
  "No - No customers/users yet",
];

export function resolveIndustryForPersistence(industryFocus, otherIndustry) {
  if (industryFocus === "Others") {
    return String(otherIndustry || "").trim();
  }
  return String(industryFocus || "").trim();
}

/**
 * Normalize founder-related fields from user + profile for forms.
 */
export function getFounderEditableFields(user) {
  const p = user?.profile && typeof user.profile === "object" ? user.profile : {};
  const audience = Array.isArray(p.targetAudience)
    ? p.targetAudience
    : Array.isArray(user.targetAudience)
      ? user.targetAudience
      : [];
  const roles = Array.isArray(p.rolesNeeded)
    ? p.rolesNeeded
    : Array.isArray(user.rolesNeeded)
      ? user.rolesNeeded
      : [];
  const rawIndustry =
    user?.industry || p.industry || p.industryFocus || user?.industryFocus || "";
  let industryFocus = rawIndustry;
  let otherIndustry = p.otherIndustry || user?.otherIndustry || "";
  if (
    industryFocus &&
    !FOUNDER_INDUSTRY_OPTIONS.includes(industryFocus)
  ) {
    otherIndustry = industryFocus;
    industryFocus = "Others";
  }
  const resolvedIndustry =
    industryFocus === "Others" ? otherIndustry : industryFocus;
  return {
    startupName: user?.startupName || p.startupName || "",
    startupDescription: p.startupDescription || user?.startupDescription || "",
    industry: resolvedIndustry || rawIndustry,
    industryFocus: industryFocus || "",
    otherIndustry,
    targetAudience: audience,
    rolesNeeded: roles,
    otherRole: p.otherRole || user?.otherRole || "",
    teamSize:
      typeof user?.teamSize === "string" && user.teamSize
        ? user.teamSize
        : p.teamSize || FOUNDER_TEAM_SIZE_OPTIONS[0],
    bio: user?.bio || p.bio || "",
    hasValidatedIdea: p.hasValidatedIdea || user?.hasValidatedIdea || "",
    hasMVP: p.hasMVP || user?.hasMVP || "",
    hasCustomers: p.hasCustomers || user?.hasCustomers || "",
    startupStage:
      user?.startupStage || p.startupStage || FOUNDER_STAGE_OPTIONS[0],
  };
}

/** Organization-admin "supported stages" (not founder execution stages). */
export const ORG_ADMIN_PROGRAM_STAGE_OPTIONS = [
  "Ideation",
  "Validation",
  "Building MVP",
  "Market Testing",
  "Growth",
  "Scaling",
  "All Stages",
];

export function validateFounderStartupFields({
  startupName,
  startupDescription,
  industryFocus,
  otherIndustry,
  teamSize,
  targetAudience,
  hasValidatedIdea,
  hasMVP,
  hasCustomers,
}) {
  const errors = [];
  if (!String(startupName || "").trim()) errors.push("Startup name is required.");
  if (!String(startupDescription || "").trim()) {
    errors.push("Startup description is required.");
  }
  const ind = resolveIndustryForPersistence(industryFocus, otherIndustry);
  if (!industryFocus) errors.push("Startup type (industry) is required.");
  if (industryFocus === "Others" && !ind) {
    errors.push("Please specify your industry.");
  }
  if (!teamSize) errors.push("Team size is required.");
  if (!Array.isArray(targetAudience) || targetAudience.length === 0) {
    errors.push("Select at least one target audience.");
  }
  if (!hasValidatedIdea) errors.push("Please answer the validated idea question.");
  if (!hasMVP) errors.push("Please answer the MVP question.");
  if (!hasCustomers) errors.push("Please answer the customers question.");
  return { ok: errors.length === 0, errors };
}
