import React, { useState, useEffect } from "react";
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
import {
  ArrowLeft,
  Rocket,
  Eye,
  DollarSign,
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

  const [formData, setFormData] = useState({
    title: "",
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
      const response = await founderApi.getAllPosts();
      if (response.success && response.posts) {
        const userPost = response.posts.find((post) => post.founderId === userId);
        if (userPost) {
          setExistingPost(userPost);
          setIsEditing(true);
          populateForm(userPost);
        }
      }
    } catch (error) {
      console.warn("Could not check existing posts:", error);
    }
    setLoading(false);
  };

  const populateForm = (post) => {
    setFormData({
      title: post.title || "",
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
      benefits: post.offer?.benefits || [],
      whyJoinUs: post.offer?.whyJoinUs?.length ? post.offer.whyJoinUs : ["", "", ""],
      customPerks: post.offer?.customPerks || "",
    });
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
    if (!formData.title?.trim()) missing.push("Startup Title");
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

  const handleSubmit = async () => {
    const userId = String(user?._id ?? user?.id ?? "");
    if (!userId) {
      toast.error("Session error. Please log in again.");
      return;
    }

    const offer = formData.compensationPhilosophy
      ? {
          compensationPhilosophy: formData.compensationPhilosophy,
          equityMin: formData.equityMin,
          equityMax: formData.equityMax,
          salaryApproach: formData.salaryApproach,
          salaryMin: formData.salaryMin,
          salaryMax: formData.salaryMax,
          benefits: formData.benefits,
          whyJoinUs: formData.whyJoinUs.filter((r) => r.trim()),
          customPerks: formData.customPerks,
        }
      : undefined;

    const postData = {
      id: existingPost?.id || Date.now().toString(),
      title: formData.title,
      description: formData.description,
      founder: user.name,
      founderId: userId,
      founderAvatar: user.profile?.avatar,
      industry: formData.industry,
      stage: formData.stage,
      lookingFor: formData.lookingFor.split(",").map((r) => r.trim()).filter(Boolean),
      location: formData.location || "Remote",
      commitment: formData.commitment,
      postedDate: existingPost?.postedDate || new Date(),
      interested: existingPost?.interested || 0,
      tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
      offer,
      website: formData.website,
      linkedinUrl: formData.linkedinUrl,
      twitterUrl: formData.twitterUrl,
      githubUrl: formData.githubUrl,
      contactEmail: formData.contactEmail,
      pitchDeckUrl: formData.pitchDeckUrl,
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
      <div className="min-h-screen bg-surface-page">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Button variant="ghost" onClick={() => setShowPreview(false)} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Edit
          </Button>

          <Card className="surface-card border-surface-border">
            <CardHeader className="border-b border-surface-border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Rocket className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-text-heading">{formData.title}</CardTitle>
                  <p className="text-text-muted text-sm mt-1">
                    Posted by {user.name} • {formData.industry} • {formData.stage}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-text-heading mb-2">Description</h3>
                <p className="text-text-body whitespace-pre-wrap">{formData.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-page rounded-lg p-4">
                  <p className="text-sm text-text-muted mb-1">Location</p>
                  <p className="font-medium text-text-heading">{formData.location || "Remote"}</p>
                </div>
                <div className="bg-surface-page rounded-lg p-4">
                  <p className="text-sm text-text-muted mb-1">Commitment</p>
                  <p className="font-medium text-text-heading">{formData.commitment}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-text-heading mb-2">Looking For</h3>
                <div className="flex flex-wrap gap-2">
                  {formData.lookingFor.split(",").map((role, i) => (
                    <Badge key={i} variant="secondary" className="text-sm py-1 px-3">
                      {role.trim()}
                    </Badge>
                  ))}
                </div>
              </div>

              {formData.tags && (
                <div>
                  <h3 className="font-semibold text-text-heading mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.split(",").map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-sm">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {formData.offer && (
                <div className="bg-primary/5 rounded-xl p-5 border border-primary/20">
                  <h3 className="font-semibold text-text-heading mb-3 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    Compensation Offer
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-text-body">
                      <span className="font-medium">Philosophy:</span>{" "}
                      {COMPENSATION_PHILOSOPHIES.find((p) => p.value === formData.offer.compensationPhilosophy)?.label}
                    </p>
                    {formData.offer.equityMin && formData.offer.equityMax && (
                      <p className="text-text-body">
                        <span className="font-medium">Equity:</span> {formData.offer.equityMin}% - {formData.offer.equityMax}%
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-surface-border">
                <Button variant="outline" onClick={() => setShowPreview(false)} className="flex-1">
                  Edit
                </Button>
                <Button onClick={handleSubmit} className="flex-1 bg-primary hover:bg-primary-hover">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {isEditing ? "Update Post" : "Publish Post"}
                </Button>
              </div>
            </CardContent>
          </Card>
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
                  : "Share your startup vision and attract talented co-founders and early team members"}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="surface-card border-surface-border">
              <CardHeader className="border-b border-surface-border">
                <CardTitle className="text-lg font-semibold text-text-heading flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div>
                  <Label htmlFor="title" className="text-text-heading">
                    Startup Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., AI-Powered Healthcare Platform"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className="mt-2 bg-surface-page border-surface-border focus:border-primary"
                  />
                </div>

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
                  <DollarSign className="w-5 h-5 text-primary" />
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
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="salaryMin" className="text-text-heading text-sm">
                            Salary Min ($)
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
                            Salary Max ($)
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
                      <li>• Be specific about the problem you&apos;re solving</li>
                      <li>• Mention your traction or validation so far</li>
                      <li>• Clearly define the roles you need</li>
                      <li>• Be transparent about compensation</li>
                      <li>• Share your vision and why it matters</li>
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
