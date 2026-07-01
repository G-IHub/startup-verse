/** Build API/preview payload from Launch Startup form state. */
import { formatMoney } from "../../utils/formatMoney";

export function buildStartupPostOfferFromForm(formData) {
  if (!formData?.compensationPhilosophy) return undefined;
  return {
    compensationPhilosophy: formData.compensationPhilosophy,
    equityMin: formData.equityMin,
    equityMax: formData.equityMax,
    salaryApproach: formData.salaryApproach,
    salaryMin: formData.salaryMin,
    salaryMax: formData.salaryMax,
    currency: formData.currency || "",
    compensationCountry: formData.compensationCountry || "",
    benefits: formData.benefits || [],
    whyJoinUs: (formData.whyJoinUs || []).filter((r) => String(r).trim()),
    customPerks: formData.customPerks,
  };
}

export function buildStartupPostPayload({ formData, user, existingPost }) {
  const userId = String(user?._id ?? user?.id ?? "");
  const offer = buildStartupPostOfferFromForm(formData);

  return {
    id: existingPost?.id || "preview-draft",
    title: formData.title,
    tagline: String(formData.tagline || "").trim(),
    brandColor: String(formData.brandColor || "").trim(),
    logoUrl: String(formData.logoUrl || "").trim(),
    description: formData.description,
    founder: user?.name || "You",
    founderId: userId,
    founderAvatar: user?.profile?.avatar,
    industry: formData.industry,
    stage: formData.stage,
    lookingFor: String(formData.lookingFor || "")
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean),
    location: formData.location || "Remote",
    commitment: formData.commitment,
    postedDate: existingPost?.postedDate || new Date(),
    interested: existingPost?.interested ?? 0,
    tags: String(formData.tags || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    offer,
    website: String(formData.website || "").trim(),
    linkedinUrl: String(formData.linkedinUrl || "").trim(),
    twitterUrl: String(formData.twitterUrl || "").trim(),
    githubUrl: String(formData.githubUrl || "").trim(),
    contactEmail: String(formData.contactEmail || "").trim(),
    pitchDeckUrl: String(formData.pitchDeckUrl || "").trim(),
  };
}
