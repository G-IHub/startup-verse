import React, { useState, useEffect, useMemo } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import { Separator } from "../ui/separator";
import { toast } from "sonner";
import * as founderApi from "../../utils/api/founderApi";
import { uploadFile } from "../../utils/api/uploadApi";
import StartupDetailPage from "./StartupDetailPage";
import { StartupBrandingFields } from "./StartupBrandingFields";
import { CompensationCountrySelect } from "./CompensationCountrySelect";
import { buildStartupPostPayload } from "../../domains/founder/buildStartupPostPayload";
import { resolveCompensationCountryFromOffer } from "../../config/compensationCountries";
import { getSalaryFieldLabel } from "../../utils/formatMoney";
import {
  buildStartupPostFormDefaults,
  hasStartupPostOnboardingDefaults,
  mergePostFormDefaults,
} from "../../domains/founder/founderPostDefaults";
import {
  ArrowLeft,
  Rocket,
  Eye,
  Coins,
  Building2,
  Globe,
  Linkedin,
  Github,
  Mail,
  FileText,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

const BENEFITS_LIST = [
  "Remote-first",
  "Flexible hours",
  "Health insurance",
  "Learning budget",
  "Latest tech & tools",
  "Unlimited PTO",
];

const INDUSTRIES = [
  { value: "", label: "Select industry" },
  { value: "HealthTech", label: "HealthTech" },
  { value: "EdTech", label: "EdTech" },
  { value: "FinTech", label: "FinTech" },
  { value: "E-Commerce", label: "E-Commerce" },
  { value: "CleanTech", label: "CleanTech" },
  { value: "SaaS", label: "SaaS" },
  { value: "AI/ML", label: "AI/ML" },
  { value: "Other", label: "Other" },
];

const STAGES = [
  { value: "", label: "Select stage" },
  { value: "Idea Stage", label: "Idea Stage" },
  { value: "MVP Development", label: "MVP Development" },
  { value: "Early Traction", label: "Early Traction" },
  { value: "Growth", label: "Growth" },
];

const COMMITMENTS = [
  { value: "", label: "Select commitment" },
  { value: "Full-time", label: "Full-time" },
  { value: "Part-time", label: "Part-time" },
  { value: "Contract", label: "Contract" },
  { value: "Flexible", label: "Flexible" },
];

const COMPENSATION_PHILOSOPHIES = [
  { value: "", label: "Select approach" },
  { value: "equity-focused", label: "Equity-Focused (High equity, lower cash)" },
  { value: "balanced", label: "Balanced (Mix of equity and cash)" },
  { value: "cash-focused", label: "Cash-Focused (Competitive salary, lower equity)" },
];

const SALARY_APPROACHES = [
  { value: "", label: "Select approach" },
  { value: "deferred", label: "Deferred (No salary now, equity only)" },
  { value: "startup-friendly", label: "Startup-Friendly (Below market rate)" },
  { value: "competitive", label: "Competitive (Market rate)" },
];

export function PostStartupPage({ user, onNavigate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [existingPost, setExistingPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [prefilledFromOnboarding, setPrefilledFromOnboarding] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    tagline: "",
    brandColor: "",
    logoUrl: "",
    description: "",
    industry: "",
    stage: "",
    lookingFor: "",
    location: "",
    commitment: "",
    tags: "",
    website: "",
    linkedinUrl: "",
    twitterUrl: "",
    githubUrl: "",
    contactEmail: "",
    pitchDeckUrl: "",
    compensationPhilosophy: "",
    equityMin: "",
    equityMax: "",
    salaryApproach: "",
    salaryMin: "",
    salaryMax: "",
    compensationCountry: "",
    currency: "",
    benefits: [],
    whyJoinUs: ["", "", ""],
    customPerks: "",
  });

  useEffect(() => {
    checkExistingPost();
  }, []);

  const checkExistingPost = async () => {
    const userId = String(user?._id ?? user?.id ?? "");
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const [posts, startup] = await Promise.all([
        founderApi.getFounderPosts(userId),
        founderApi.getFounderStartupSafe(userId),
      ]);

      const postList = Array.isArray(posts) ? posts : [];
      const userPost = postList[0] || null;

      if (userPost) {
        setExistingPost(userPost);
        setIsEditing(true);
        populateForm(userPost);
      } else {
        const defaults = buildStartupPostFormDefaults({ user, startup });
        setFormData((prev) => mergePostFormDefaults(prev, defaults));
        setPrefilledFromOnboarding(hasStartupPostOnboardingDefaults(defaults));
      }
    } catch (error) {
      console.warn("Could not check existing posts:", error);
    }
    setLoading(false);
  };

  const populateForm = (post) => {
    const { compensationCountry, currency } = resolveCompensationCountryFromOffer(post.offer);
    setFormData({
      title: post.title || "",
      tagline: post.tagline || "",
      brandColor: post.brandColor || "",
      logoUrl: post.logoUrl || post.logo || "",
      description: post.description || "",
      industry: post.industry || "",
      stage: post.stage || "",
      lookingFor: Array.isArray(post.lookingFor) ? post.lookingFor.join(", ") : post.lookingFor || "",
      location: post.location || "",
      commitment: post.commitment || "",
      tags: Array.isArray(post.tags) ? post.tags.join(", ") : post.tags || "",
      website: post.website || "",
      linkedinUrl: post.linkedinUrl || "",
      twitterUrl: post.twitterUrl || "",
      githubUrl: post.githubUrl || "",
      contactEmail: post.contactEmail || "",
      pitchDeckUrl: post.pitchDeckUrl || "",
      compensationPhilosophy: post.offer?.compensationPhilosophy || "",
      equityMin: post.offer?.equityMin || "",
      equityMax: post.offer?.equityMax || "",
      salaryApproach: post.offer?.salaryApproach || "",
      salaryMin: post.offer?.salaryMin || "",
      salaryMax: post.offer?.salaryMax || "",
      compensationCountry,
      currency,
      benefits: post.offer?.benefits || [],
      whyJoinUs: post.offer?.whyJoinUs?.length ? post.offer.whyJoinUs : ["", "", ""],
      customPerks: post.offer?.customPerks || "",
    });
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCompensationCountryChange = ({ compensationCountry, currency }) => {
    setFormData((prev) => ({
      ...prev,
      compensationCountry,
      currency,
    }));
  };

  const handleLogoUpload = async (file) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo must be less than 5MB");
      return;
    }
    setUploadingLogo(true);
    try {
      const uploaded = await uploadFile(file, "general");
      if (!uploaded?.url) {
        throw new Error("Upload did not return a URL");
      }
      handleInputChange("logoUrl", uploaded.url);
      toast.success("Logo uploaded");
    } catch (error) {
      console.error("Logo upload failed:", error);
      toast.error(error?.message || "Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleBenefitToggle = (benefit, checked) => {
    setFormData((prev) => ({
      ...prev,
      benefits: checked
        ? [...prev.benefits, benefit]
        : prev.benefits.filter((b) => b !== benefit),
    }));
  };

  const handleWhyJoinUsChange = (index, value) => {
    setFormData((prev) => {
      const newReasons = [...prev.whyJoinUs];
      newReasons[index] = value;
      return { ...prev, whyJoinUs: newReasons };
    });
  };

  const validateForm = () => {
    const missing = [];
    if (!formData.title?.trim()) missing.push("Startup name");
    if (!formData.description?.trim()) missing.push("Description");
    if (!formData.industry) missing.push("Industry");
    if (!formData.stage) missing.push("Stage");
    if (!formData.lookingFor?.trim()) missing.push("Looking For (roles)");
    if (!formData.commitment) missing.push("Commitment");

    if (missing.length > 0) {
      toast.error(`Please fill in: ${missing.join(", ")}`);
      return false;
    }

    if (formData.description.trim().length < 50) {
      toast.error("Description must be at least 50 characters");
      return false;
    }

    return true;
  };

  const handlePreview = () => {
    if (validateForm()) {
      setShowPreview(true);
    }
  };

  const previewStartup = useMemo(
    () => buildStartupPostPayload({ formData, user, existingPost }),
    [formData, user, existingPost],
  );

  const handleSubmit = async () => {
    const userId = String(user?._id ?? user?.id ?? "");
    if (!userId) {
      toast.error("Session error. Please log in again.");
      return;
    }

    const postData = {
      ...buildStartupPostPayload({ formData, user, existingPost }),
      id: existingPost?.id || Date.now().toString(),
    };

    try {
      await founderApi.saveStartupPost(userId, postData);
      toast.success(isEditing ? "Startup post updated successfully!" : "Startup posted successfully!");
      onNavigate?.("dashboard");
    } catch (error) {
      console.error("Failed to save post:", error);
      toast.error(error?.message || "Failed to save post. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-page flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-text-muted text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (showPreview) {
    return (
      <div className="relative min-h-screen bg-surface-page">
        <StartupDetailPage
          user={user}
          startup={previewStartup}
          previewMode
          onPreviewBack={() => setShowPreview(false)}
          onNavigate={(page) => {
            if (page === "browse-startups") setShowPreview(false);
          }}
        />
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4 pt-2">
          <div className="pointer-events-auto flex w-full max-w-xl gap-3 rounded-2xl border border-surface-border bg-surface-card/95 p-3 shadow-lg backdrop-blur-md">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-11 bg-background/80"
              onClick={() => setShowPreview(false)}
            >
              Edit
            </Button>
            <Button
              type="button"
              className="flex-1 h-11 bg-primary hover:bg-primary-hover"
              onClick={handleSubmit}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {isEditing ? "Update Post" : "Publish Post"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-page">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => onNavigate?.("dashboard")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Rocket className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-text-heading">
                {isEditing ? "Edit Your Startup Post" : "Post Your Startup Idea"}
              </h1>
              <p className="text-text-muted mt-1">
                {isEditing
                  ? "Update your startup post to keep talent informed"
                  : prefilledFromOnboarding
                    ? "We've filled in details from your onboarding — add your logo and branding, then publish."
                    : "Share your startup vision, brand identity, and attract talented co-founders"}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden border-surface-border bg-surface-card shadow-soft">
              <CardHeader className="border-b border-surface-border/80 bg-gradient-to-r from-primary/[0.06] via-transparent to-transparent px-6 py-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="font-heading text-lg font-bold text-text-heading">
                      Branding
                    </CardTitle>
                    <p className="mt-1 font-body text-sm text-text-muted">
                      How talent will recognize your startup across listings and detail pages.
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 md:p-8">
                <StartupBrandingFields
                  title={formData.title}
                  tagline={formData.tagline}
                  brandColor={formData.brandColor}
                  logoUrl={formData.logoUrl}
                  onChange={handleInputChange}
                  onLogoUpload={handleLogoUpload}
                  uploadingLogo={uploadingLogo}
                />
              </CardContent>
            </Card>

            <Card className="surface-card border-surface-border">
              <CardHeader className="border-b border-surface-border">
                <CardTitle className="text-lg font-semibold text-text-heading flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div>
                  <Label htmlFor="description" className="text-text-heading">
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your startup idea, the problem you solve, your traction so far, and why someone should join you..."
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    className="mt-2 min-h-40 bg-surface-page border-surface-border focus:border-primary resize-none"
                  />
                  <p className="text-xs text-text-muted mt-2">
                    {formData.description.length}/5000 characters (minimum 50)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="industry" className="text-text-heading">
                      Industry <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="industry"
                      value={formData.industry}
                      onChange={(e) => handleInputChange("industry", e.target.value)}
                      className="mt-2 w-full h-10 rounded-md border border-surface-border bg-surface-page px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {INDUSTRIES.map((ind) => (
                        <option key={ind.value} value={ind.value}>
                          {ind.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="stage" className="text-text-heading">
                      Stage <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="stage"
                      value={formData.stage}
                      onChange={(e) => handleInputChange("stage", e.target.value)}
                      className="mt-2 w-full h-10 rounded-md border border-surface-border bg-surface-page px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {STAGES.map((stage) => (
                        <option key={stage.value} value={stage.value}>
                          {stage.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="lookingFor" className="text-text-heading">
                    Looking For <span className="text-red-500">*</span>
                    <span className="font-normal text-text-muted ml-1">(comma-separated roles)</span>
                  </Label>
                  <Input
                    id="lookingFor"
                    placeholder="e.g., Full-Stack Developer, UX Designer, Growth Marketer"
                    value={formData.lookingFor}
                    onChange={(e) => handleInputChange("lookingFor", e.target.value)}
                    className="mt-2 bg-surface-page border-surface-border focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location" className="text-text-heading">
                      Location <span className="text-text-muted font-normal text-xs">(optional)</span>
                    </Label>
                    <Input
                      id="location"
                      placeholder="e.g., Remote, San Francisco"
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      className="mt-2 bg-surface-page border-surface-border focus:border-primary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="commitment" className="text-text-heading">
                      Commitment <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="commitment"
                      value={formData.commitment}
                      onChange={(e) => handleInputChange("commitment", e.target.value)}
                      className="mt-2 w-full h-10 rounded-md border border-surface-border bg-surface-page px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {COMMITMENTS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="tags" className="text-text-heading">
                    Tags <span className="text-text-muted font-normal text-xs">(comma-separated, optional)</span>
                  </Label>
                  <Input
                    id="tags"
                    placeholder="e.g., React, Machine Learning, Healthcare"
                    value={formData.tags}
                    onChange={(e) => handleInputChange("tags", e.target.value)}
                    className="mt-2 bg-surface-page border-surface-border focus:border-primary"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card className="surface-card border-surface-border">
              <CardHeader className="border-b border-surface-border">
                <CardTitle className="text-lg font-semibold text-text-heading flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Additional Information
                  <span className="text-text-muted font-normal text-sm">(optional)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div>
                  <Label htmlFor="website" className="text-text-heading flex items-center gap-2">
                    <Globe className="w-4 h-4 text-text-muted" />
                    Website
                  </Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://yourstartup.com"
                    value={formData.website}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                    className="mt-2 bg-surface-page border-surface-border focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="linkedinUrl" className="text-text-heading flex items-center gap-2">
                      <Linkedin className="w-4 h-4 text-text-muted" />
                      LinkedIn
                    </Label>
                    <Input
                      id="linkedinUrl"
                      type="url"
                      placeholder="https://linkedin.com/company/..."
                      value={formData.linkedinUrl}
                      onChange={(e) => handleInputChange("linkedinUrl", e.target.value)}
                      className="mt-2 bg-surface-page border-surface-border focus:border-primary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="githubUrl" className="text-text-heading flex items-center gap-2">
                      <Github className="w-4 h-4 text-text-muted" />
                      GitHub
                    </Label>
                    <Input
                      id="githubUrl"
                      type="url"
                      placeholder="https://github.com/..."
                      value={formData.githubUrl}
                      onChange={(e) => handleInputChange("githubUrl", e.target.value)}
                      className="mt-2 bg-surface-page border-surface-border focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="twitterUrl" className="text-text-heading">
                      Twitter/X
                    </Label>
                    <Input
                      id="twitterUrl"
                      type="url"
                      placeholder="https://twitter.com/..."
                      value={formData.twitterUrl}
                      onChange={(e) => handleInputChange("twitterUrl", e.target.value)}
                      className="mt-2 bg-surface-page border-surface-border focus:border-primary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactEmail" className="text-text-heading flex items-center gap-2">
                      <Mail className="w-4 h-4 text-text-muted" />
                      Contact Email
                    </Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="founder@startup.com"
                      value={formData.contactEmail}
                      onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                      className="mt-2 bg-surface-page border-surface-border focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="pitchDeckUrl" className="text-text-heading flex items-center gap-2">
                    <FileText className="w-4 h-4 text-text-muted" />
                    Pitch Deck URL
                  </Label>
                  <Input
                    id="pitchDeckUrl"
                    type="url"
                    placeholder="https://docsend.com/... or Google Drive link"
                    value={formData.pitchDeckUrl}
                    onChange={(e) => handleInputChange("pitchDeckUrl", e.target.value)}
                    className="mt-2 bg-surface-page border-surface-border focus:border-primary"
                  />
                  <p className="text-xs text-text-muted mt-1">Share your pitch deck to give talents deeper insights</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Compensation Offer */}
            <Card className="surface-card border-surface-border">
              <CardHeader className="border-b border-surface-border">
                <CardTitle className="text-lg font-semibold text-text-heading flex items-center gap-2">
                  <Coins className="w-5 h-5 text-primary" />
                  Compensation
                  <span className="text-text-muted font-normal text-sm">(optional)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div>
                  <Label htmlFor="compensationPhilosophy" className="text-text-heading">
                    Compensation Philosophy
                  </Label>
                  <select
                    id="compensationPhilosophy"
                    value={formData.compensationPhilosophy}
                    onChange={(e) => handleInputChange("compensationPhilosophy", e.target.value)}
                    className="mt-2 w-full h-10 rounded-md border border-surface-border bg-surface-page px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {COMPENSATION_PHILOSOPHIES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.compensationPhilosophy && (
                  <>
                    <Separator className="border-surface-border" />

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="equityMin" className="text-text-heading text-sm">
                          Equity Min %
                        </Label>
                        <Input
                          id="equityMin"
                          type="number"
                          step="0.1"
                          placeholder="0.5"
                          value={formData.equityMin}
                          onChange={(e) => handleInputChange("equityMin", e.target.value)}
                          className="mt-2 bg-surface-page border-surface-border focus:border-primary"
                        />
                      </div>
                      <div>
                        <Label htmlFor="equityMax" className="text-text-heading text-sm">
                          Equity Max %
                        </Label>
                        <Input
                          id="equityMax"
                          type="number"
                          step="0.1"
                          placeholder="2.0"
                          value={formData.equityMax}
                          onChange={(e) => handleInputChange("equityMax", e.target.value)}
                          className="mt-2 bg-surface-page border-surface-border focus:border-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="salaryApproach" className="text-text-heading">
                        Salary Approach
                      </Label>
                      <select
                        id="salaryApproach"
                        value={formData.salaryApproach}
                        onChange={(e) => handleInputChange("salaryApproach", e.target.value)}
                        className="mt-2 w-full h-10 rounded-md border border-surface-border bg-surface-page px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {SALARY_APPROACHES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {formData.salaryApproach !== "deferred" && (
                      <>
                        <CompensationCountrySelect
                          value={formData.compensationCountry}
                          currency={formData.currency}
                          onChange={handleCompensationCountryChange}
                        />

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="salaryMin" className="text-text-heading text-sm">
                              {getSalaryFieldLabel("Salary Min", formData.currency)}
                            </Label>
                            <Input
                              id="salaryMin"
                              type="number"
                              placeholder="80000"
                              value={formData.salaryMin}
                              onChange={(e) => handleInputChange("salaryMin", e.target.value)}
                              className="mt-2 bg-surface-page border-surface-border focus:border-primary"
                            />
                          </div>
                          <div>
                            <Label htmlFor="salaryMax" className="text-text-heading text-sm">
                              {getSalaryFieldLabel("Salary Max", formData.currency)}
                            </Label>
                            <Input
                              id="salaryMax"
                              type="number"
                              placeholder="120000"
                              value={formData.salaryMax}
                              onChange={(e) => handleInputChange("salaryMax", e.target.value)}
                              className="mt-2 bg-surface-page border-surface-border focus:border-primary"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <Separator className="border-surface-border" />

                    <div>
                      <Label className="text-text-heading">Benefits & Perks</Label>
                      <div className="grid grid-cols-1 gap-2 mt-3">
                        {BENEFITS_LIST.map((benefit) => (
                          <div key={benefit} className="flex items-center space-x-3">
                            <Checkbox
                              id={benefit}
                              checked={formData.benefits.includes(benefit)}
                              onCheckedChange={(checked) => handleBenefitToggle(benefit, checked)}
                              className="border-surface-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                            <Label htmlFor={benefit} className="text-sm text-text-body cursor-pointer">
                              {benefit}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-text-heading">Why Join Us</Label>
                      <p className="text-xs text-text-muted mb-2">3 compelling reasons</p>
                      <div className="space-y-2">
                        {[0, 1, 2].map((index) => (
                          <Input
                            key={index}
                            placeholder={`Reason ${index + 1}`}
                            value={formData.whyJoinUs[index]}
                            onChange={(e) => handleWhyJoinUsChange(index, e.target.value)}
                            className="bg-surface-page border-surface-border focus:border-primary"
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="customPerks" className="text-text-heading">
                        Additional Perks
                      </Label>
                      <Textarea
                        id="customPerks"
                        placeholder="Any other perks or benefits..."
                        value={formData.customPerks}
                        onChange={(e) => handleInputChange("customPerks", e.target.value)}
                        className="mt-2 min-h-20 bg-surface-page border-surface-border focus:border-primary resize-none"
                        rows={2}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="surface-card border-surface-border bg-linear-to-br from-primary/5 to-transparent">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-text-heading text-sm">Tips for a Great Post</h4>
                    <ul className="mt-2 space-y-1.5 text-xs text-text-body">
                      <li>• Add a clear logo and tagline so talent recognizes you</li>
                      <li>• Be specific about the problem you&apos;re solving</li>
                      <li>• Mention your traction or validation so far</li>
                      <li>• Clearly define the roles you need</li>
                      <li>• Be transparent about compensation</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex gap-3 pt-6 border-t border-surface-border mt-8">
          <Button variant="outline" onClick={() => onNavigate?.("dashboard")} className="px-8">
            Cancel
          </Button>
          <Button onClick={handlePreview} className="px-8 bg-primary hover:bg-primary-hover">
            <Eye className="w-4 h-4 mr-2" />
            Preview Post
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PostStartupPage;
