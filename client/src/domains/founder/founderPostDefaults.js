import { getFounderEditableFields } from "./founderProfileConfig";

/** Post form industry values used in PostStartupPage / TeamMatching */
export const POST_INDUSTRY_VALUES = new Set([
  "HealthTech",
  "EdTech",
  "FinTech",
  "E-Commerce",
  "CleanTech",
  "SaaS",
  "AI/ML",
  "Other",
]);

/** Post form stage values */
export const POST_STAGE_VALUES = new Set([
  "Idea Stage",
  "MVP Development",
  "Early Traction",
  "Growth",
]);

const INDUSTRY_TO_POST = {
  FinTech: "FinTech",
  HealthTech: "HealthTech",
  EdTech: "EdTech",
  "E-commerce": "E-Commerce",
  "E-Commerce": "E-Commerce",
  SaaS: "SaaS",
  "AI/Machine Learning": "AI/ML",
  "AI/ML": "AI/ML",
  CleanTech: "CleanTech",
  FoodTech: "Other",
  PropTech: "Other",
  AgriTech: "Other",
  BioTech: "Other",
  HRTech: "Other",
  MarTech: "Other",
  CyberSecurity: "Other",
  Gaming: "Other",
  "Social Media": "Other",
  IoT: "Other",
  "Logistics/Supply Chain": "Other",
  "Travel/Hospitality": "Other",
  "Entertainment/Media": "Other",
  "Fashion/Beauty": "Other",
  "Sports/Fitness": "Other",
  "Blockchain/Web3": "Other",
};

const STAGE_TO_POST = {
  "Idea Validation": "Idea Stage",
  "MVP Development": "MVP Development",
  "Early Traction": "Early Traction",
  "Team Building": "Early Traction",
  Growth: "Growth",
  Scale: "Growth",
  "Idea Stage": "Idea Stage",
};

export function mapFounderIndustryToPostIndustry(industry) {
  const raw = String(industry || "").trim();
  if (!raw) return "";
  if (POST_INDUSTRY_VALUES.has(raw)) return raw;
  if (INDUSTRY_TO_POST[raw]) return INDUSTRY_TO_POST[raw];
  return "Other";
}

export function mapFounderStageToPostStage(stage) {
  const raw = String(stage || "").trim();
  if (!raw) return "";
  if (POST_STAGE_VALUES.has(raw)) return raw;
  if (STAGE_TO_POST[raw]) return STAGE_TO_POST[raw];
  return "";
}

function resolveRolesNeeded(user, fields) {
  const roles = fields.rolesNeeded || user?.rolesNeeded || user?.profile?.rolesNeeded;
  if (Array.isArray(roles) && roles.length > 0) {
    return roles.filter(Boolean).join(", ");
  }
  const lookingFor = user?.profile?.lookingFor;
  if (Array.isArray(lookingFor) && lookingFor.length > 0) {
    return lookingFor.filter(Boolean).join(", ");
  }
  if (typeof lookingFor === "string" && lookingFor.trim()) {
    return lookingFor.trim();
  }
  return "";
}

/**
 * Build default startup post form fields from onboarding + Startup record.
 */
export function buildStartupPostFormDefaults({ user, startup }) {
  if (!user) {
    return {
      title: "",
      description: "",
      industry: "",
      stage: "",
      lookingFor: "",
      location: "",
      contactEmail: "",
    };
  }

  const fields = getFounderEditableFields(user);
  const profile = user.profile && typeof user.profile === "object" ? user.profile : {};

  const title =
    String(startup?.name || "").trim() ||
    String(user.startupName || fields.startupName || profile.startupName || "").trim();

  const description =
    String(startup?.description || "").trim() ||
    String(
      user.startupDescription ||
        fields.startupDescription ||
        profile.startupDescription ||
        "",
    ).trim();

  const rawIndustry =
    String(startup?.industry || "").trim() ||
    String(user.industry || fields.industry || profile.industry || "").trim();

  const rawStage =
    String(startup?.stage || "").trim() ||
    String(
      user.startupStage || fields.startupStage || profile.startupStage || "",
    ).trim();

  const startupData =
    startup?.data && typeof startup.data === "object" ? startup.data : {};

  return {
    title,
    description,
    industry: mapFounderIndustryToPostIndustry(rawIndustry),
    stage: mapFounderStageToPostStage(rawStage),
    lookingFor: resolveRolesNeeded(user, fields),
    location: "Remote",
    contactEmail: String(user.email || "").trim(),
    logoUrl: String(startup?.logo || "").trim(),
    tagline: String(startupData.tagline || profile.tagline || "").trim(),
    brandColor: String(startupData.brandColor || "").trim(),
    website: String(startup?.website || profile.website || "").trim(),
  };
}

/**
 * Fill only empty string fields in an existing post form object.
 */
export function mergePostFormDefaults(existingForm, defaults) {
  const merged = { ...existingForm };
  if (!defaults || typeof defaults !== "object") return merged;

  for (const [key, value] of Object.entries(defaults)) {
    if (value == null || value === "") continue;
    const current = merged[key];
    if (typeof current === "string" && current.trim() === "") {
      merged[key] = value;
    }
  }

  return merged;
}

export function hasStartupPostOnboardingDefaults(defaults) {
  if (!defaults) return false;
  return Boolean(
    defaults.title ||
      defaults.description ||
      defaults.industry ||
      defaults.stage ||
      defaults.lookingFor,
  );
}
