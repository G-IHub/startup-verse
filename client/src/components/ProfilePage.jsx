import React, { useState } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { toast } from "sonner";
import { getTalentProfileCompletionPercent } from "../utils/talentProfileCompletion";
import * as founderApi from "../utils/api/founderApi";
import {
  FOUNDER_INDUSTRY_OPTIONS,
  FOUNDER_TARGET_AUDIENCE_OPTIONS,
  FOUNDER_ROLES_NEEDED_OPTIONS,
  FOUNDER_TEAM_SIZE_OPTIONS,
  FOUNDER_STAGE_OPTIONS,
  FOUNDER_VALIDATED_IDEA_OPTIONS,
  FOUNDER_MVP_OPTIONS,
  FOUNDER_CUSTOMERS_OPTIONS,
  getFounderEditableFields,
  resolveIndustryForPersistence,
  validateFounderStartupFields,
} from "../domains/founder/founderProfileConfig";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  UserCircle,
  Briefcase,
  MapPin,
  Mail,
  Globe,
  Linkedin,
  Github,
  Code,
  Award,
  FileText,
  Plus,
  X,
  Edit,
  Save,
  Building,
  Users,
  Target,
  Eye,
  CheckCircle,
  GraduationCap,
  Calendar,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { cn } from "./ui/utils";
import { Checkbox } from "./ui/checkbox";

const SP_LABEL =
  "font-body text-[13px] font-medium uppercase tracking-[0.06em] text-text-muted";
const SP_SUBLABEL =
  "font-body text-[13px] font-medium normal-case tracking-normal text-text-body";
const SP_INPUT =
  "rounded-input border-[1.5px] border-surface-border bg-surface-card font-body text-sm text-text-heading placeholder:text-text-muted transition-all duration-200 ease-in-out focus-visible:border-primary focus-visible:outline-none focus-visible:shadow-focus";
const SP_TEXTAREA =
  "min-h-16 resize-none rounded-input border-[1.5px] border-surface-border bg-surface-card font-body text-sm text-text-heading placeholder:text-text-muted transition-all duration-200 ease-in-out focus-visible:border-primary focus-visible:outline-none focus-visible:shadow-focus";
const SP_SELECT_TRIGGER =
  "w-full rounded-input border-[1.5px] border-surface-border bg-surface-card font-body text-sm text-text-heading transition-all duration-200 ease-in-out focus-visible:border-primary focus-visible:outline-none focus-visible:shadow-focus [&_svg]:text-text-body";
const SP_VALUE = "font-body text-sm font-normal text-text-heading";
const SP_EMPTY = "font-body text-sm italic text-text-muted";
const SP_CARD = "border-0 bg-surface-card shadow-soft rounded-card";
const SP_CARD_TITLE =
  "flex items-center gap-2 font-heading text-base font-semibold text-text-heading [&_svg]:text-primary";
const SP_PRIMARY_BTN =
  "rounded-input bg-primary font-body font-semibold text-white shadow-[0_4px_16px_rgba(58,90,254,0.20)] transition-colors duration-200 ease-in-out hover:bg-primary-hover [&_svg]:text-white";
const SP_CANCEL_BTN =
  "rounded-input border border-surface-border bg-surface-card font-body font-semibold text-text-body transition-colors duration-200 ease-in-out hover:border-status-error hover:text-status-error";
const SP_PREVIEW_BTN =
  "rounded-input border border-surface-border bg-surface-card font-body font-semibold text-text-body shadow-none transition-colors duration-200 ease-in-out hover:border-primary hover:text-primary [&_svg]:text-text-body hover:[&_svg]:text-primary";
const SP_CHECK_WRAP =
  "flex flex-wrap gap-2 rounded-input border-0 bg-surface-page p-3";
const SP_CHECK_BOX =
  "border-[1.5px] border-surface-border bg-surface-card data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-white";
const SP_CHECK_LABEL_BASE =
  "flex cursor-pointer items-center gap-2 font-body text-sm text-text-heading";
const SP_CHECK_LABEL_ON = "font-medium text-primary";

export default function ProfilePage({ user, onUpdateUser, initialEditing = false }) {
  const [isEditing, setIsEditing] = useState(initialEditing);
  const [showPreview, setShowPreview] = useState(false);

  // Initialize all fields from user
  const [editedProfile, setEditedProfile] = useState({
    name: user.name,
    email: user.email,
    professionalTitle: user.professionalTitle || "",
    location: user.location || "",
    yearsOfExperience: user.yearsOfExperience || "",
    bio: user.bio || "",
    skills: user.skills || [],
    linkedin: user.linkedin || "",
    github: user.github || "",
    website: user.website || "",
    workExperience: user.workExperience || [],
    education: user.education || [],
    certifications: user.certifications || [],
    portfolioItems: user.portfolioItems || [],
    availabilityStatus: user.availabilityStatus || "",
    preferredCommitment: user.preferredCommitment || "",
    // ✅ NEW: Add missing fields from TalentProfileForm
    experience: user.experience || "",
    availability: user.availability || "",
    interests: user.interests || [],
    professionalGoals: user.professionalGoals || "",
    industryPreferences: user.industryPreferences || [],
    // Founder fields (aligned with onboarding via getFounderEditableFields)
    ...(user.role === "founder"
      ? getFounderEditableFields(user)
      : {
          startupName: user.startupName || "",
          startupStage: user.startupStage || "",
          industry: user.industry || "",
          teamSize: user.teamSize || 1,
        }),
  });
  const [newSkill, setNewSkill] = useState("");

  const calculateProfileCompletion = () => {
    if (user.role !== "talent") return 100;
    return getTalentProfileCompletionPercent(user);
  };
  const profileCompletion = calculateProfileCompletion();
  const getCompletionMessage = (percentage) => {
    if (percentage === 100) return "Your profile is complete! 🎉";
    if (percentage >= 80)
      return "Almost there! Complete your profile to stand out.";
    if (percentage >= 50)
      return "Good progress! Add more details to attract founders.";
    return "Start building your profile to get discovered by startups.";
  };
  const handleSave = async () => {
    if (!onUpdateUser) return;

    if (user.role === "founder") {
      const v = validateFounderStartupFields({
        startupName: editedProfile.startupName,
        startupDescription: editedProfile.startupDescription,
        industryFocus: editedProfile.industryFocus,
        otherIndustry: editedProfile.otherIndustry,
        teamSize: editedProfile.teamSize,
        targetAudience: editedProfile.targetAudience,
        hasValidatedIdea: editedProfile.hasValidatedIdea,
        hasMVP: editedProfile.hasMVP,
        hasCustomers: editedProfile.hasCustomers,
      });
      if (!v.ok) {
        toast.error(v.errors[0]);
        return;
      }
      const founderId = String(user._id ?? user.id);
      const resolvedIndustry = resolveIndustryForPersistence(
        editedProfile.industryFocus,
        editedProfile.otherIndustry,
      );
      try {
        const startup = await founderApi.upsertFounderStartup({
          founderId,
          name: String(editedProfile.startupName).trim(),
          description: editedProfile.startupDescription || "",
          industry: resolvedIndustry,
          stage: editedProfile.startupStage || "",
        });
        const startupId = String(startup._id || startup.id);
        await founderApi.saveFounderProfile({
          userId: String(user._id ?? user.id),
          startupId,
          bio: editedProfile.bio || "",
          background: "",
          links: {},
        });
        const rolesResolved = editedProfile.rolesNeeded?.includes?.("Others")
          ? [
              ...editedProfile.rolesNeeded.filter((r) => r !== "Others"),
              editedProfile.otherRole,
            ].filter(Boolean)
          : editedProfile.rolesNeeded || [];

        onUpdateUser({
          ...user,
          ...editedProfile,
          industry: resolvedIndustry,
          rolesNeeded: rolesResolved,
          startupId,
          profile: {
            ...user.profile,
            startupName: editedProfile.startupName,
            startupDescription: editedProfile.startupDescription,
            industryFocus:
              editedProfile.industryFocus === "Others"
                ? editedProfile.otherIndustry
                : editedProfile.industryFocus,
            industry: resolvedIndustry,
            startupStage: editedProfile.startupStage,
            targetAudience: editedProfile.targetAudience,
            rolesNeeded: rolesResolved,
            teamSize: editedProfile.teamSize,
            bio: editedProfile.bio,
            hasValidatedIdea: editedProfile.hasValidatedIdea,
            hasMVP: editedProfile.hasMVP,
            hasCustomers: editedProfile.hasCustomers,
            ...(editedProfile.industryFocus === "Others"
              ? { otherIndustry: editedProfile.otherIndustry }
              : {}),
          },
        });
      } catch (err) {
        toast.error(err?.message || "Failed to save startup profile");
        return;
      }
    } else {
      onUpdateUser({
        ...user,
        ...editedProfile,
      });
    }

    setIsEditing(false);
    toast.success("Profile updated successfully!");
  };
  const handleAddSkill = () => {
    if (newSkill.trim() && !editedProfile.skills.includes(newSkill.trim())) {
      setEditedProfile({
        ...editedProfile,
        skills: [...editedProfile.skills, newSkill.trim()],
      });
      setNewSkill("");
    }
  };
  const handleRemoveSkill = (skill) => {
    setEditedProfile({
      ...editedProfile,
      skills: editedProfile.skills.filter((s) => s !== skill),
    });
  };

  // Work Experience handlers
  const addWorkExperience = () => {
    setEditedProfile({
      ...editedProfile,
      workExperience: [
        ...editedProfile.workExperience,
        {
          id: Date.now().toString(),
          company: "",
          position: "",
          startDate: "",
          endDate: "",
          current: false,
          description: "",
        },
      ],
    });
  };
  const updateWorkExperience = (id, field, value) => {
    setEditedProfile({
      ...editedProfile,
      workExperience: editedProfile.workExperience.map((exp) =>
        exp.id === id
          ? {
              ...exp,
              [field]: value,
            }
          : exp,
      ),
    });
  };
  const removeWorkExperience = (id) => {
    setEditedProfile({
      ...editedProfile,
      workExperience: editedProfile.workExperience.filter(
        (exp) => exp.id !== id,
      ),
    });
  };

  // Education handlers
  const addEducation = () => {
    setEditedProfile({
      ...editedProfile,
      education: [
        ...editedProfile.education,
        {
          id: Date.now().toString(),
          institution: "",
          degree: "",
          field: "",
          graduationYear: "",
        },
      ],
    });
  };
  const updateEducation = (id, field, value) => {
    setEditedProfile({
      ...editedProfile,
      education: editedProfile.education.map((edu) =>
        edu.id === id
          ? {
              ...edu,
              [field]: value,
            }
          : edu,
      ),
    });
  };
  const removeEducation = (id) => {
    setEditedProfile({
      ...editedProfile,
      education: editedProfile.education.filter((edu) => edu.id !== id),
    });
  };

  // Certification handlers
  const addCertification = () => {
    setEditedProfile({
      ...editedProfile,
      certifications: [
        ...editedProfile.certifications,
        {
          id: Date.now().toString(),
          name: "",
          issuer: "",
          issueYear: "",
          credentialId: "",
          credentialUrl: "",
          certificateImage: "",
        },
      ],
    });
  };
  const updateCertificationImage = (id, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateCertification(id, "certificateImage", reader.result || "");
    };
    reader.readAsDataURL(file);
  };
  const updateCertification = (id, field, value) => {
    setEditedProfile({
      ...editedProfile,
      certifications: editedProfile.certifications.map((cert) =>
        cert.id === id
          ? {
              ...cert,
              [field]: value,
            }
          : cert,
      ),
    });
  };
  const removeCertification = (id) => {
    setEditedProfile({
      ...editedProfile,
      certifications: editedProfile.certifications.filter(
        (cert) => cert.id !== id,
      ),
    });
  };

  // Portfolio handlers
  const addPortfolioItem = () => {
    setEditedProfile({
      ...editedProfile,
      portfolioItems: [
        ...editedProfile.portfolioItems,
        {
          id: Date.now().toString(),
          title: "",
          description: "",
          url: "",
          type: "",
        },
      ],
    });
  };
  const updatePortfolioItem = (id, field, value) => {
    setEditedProfile({
      ...editedProfile,
      portfolioItems: editedProfile.portfolioItems.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    });
  };
  const removePortfolioItem = (id) => {
    setEditedProfile({
      ...editedProfile,
      portfolioItems: editedProfile.portfolioItems.filter(
        (item) => item.id !== id,
      ),
    });
  };

  // Render Talent Profile
  if (user.role === "talent") {
    return (
      <div className="min-h-full space-y-3 bg-transparent p-2 font-body md:space-y-4 md:p-3 lg:p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="mb-2 font-heading text-3xl font-bold text-text-heading">
              Professional Profile
            </h1>
            <p className="font-body text-text-body">
              This is what founders see when browsing talent
            </p>
          </div>
          <div className="flex gap-2">
            {!isEditing && (
              <Button
                variant="outline"
                className={SP_PREVIEW_BTN}
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="mr-2 h-4 w-4" />
                {showPreview ? "Edit View" : "Preview"}
              </Button>
            )}
            {!isEditing ? (
              <Button className={SP_PRIMARY_BTN} onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  className={SP_CANCEL_BTN}
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button className={SP_PRIMARY_BTN} onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </>
            )}
          </div>
        </div>
        {!showPreview && profileCompletion < 100 && (
          <Card className={cn(SP_CARD, "ring-1 ring-primary/25")}>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle
                    className={`w-5 h-5 ${profileCompletion === 100 ? "text-green-600" : "text-muted-foreground"}`}
                  />
                  <h3 className="font-semibold">Profile Completion</h3>
                </div>
                <span
                  className={`text-sm font-semibold ${profileCompletion >= 80 ? "text-green-600" : profileCompletion >= 50 ? "text-yellow-600" : "text-red-600"}`}
                >
                  {profileCompletion}%
                </span>
              </div>
              <Progress value={profileCompletion} className="h-3" />
              <p className="font-body text-sm text-text-muted">
                {getCompletionMessage(profileCompletion)}
              </p>
            </CardContent>
          </Card>
        )}
        <Card className={SP_CARD}>
          <CardHeader>
            <CardTitle className={SP_CARD_TITLE}>
              <UserCircle className="w-5 h-5" />
              Professional Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={SP_LABEL} htmlFor="name">Full Name *</Label>
                {isEditing ? (
                  <Input className={cn(SP_INPUT)}
                    id="name"
                    value={editedProfile.name}
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        name: e.target.value,
                      })
                    }
                  />
                ) : (
                  <p className={SP_VALUE}>{user.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className={SP_LABEL} htmlFor="professionalTitle">Professional Title *</Label>
                {isEditing ? (
                  <Input className={cn(SP_INPUT)}
                    id="professionalTitle"
                    value={editedProfile.professionalTitle}
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        professionalTitle: e.target.value,
                      })
                    }
                    placeholder="e.g., Senior Full-Stack Developer"
                  />
                ) : (
                  <p className={SP_VALUE}>
                    {user.professionalTitle || "Not specified"}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className={SP_LABEL} htmlFor="location">Location *</Label>
                {isEditing ? (
                  <Input className={cn(SP_INPUT)}
                    id="location"
                    value={editedProfile.location}
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        location: e.target.value,
                      })
                    }
                    placeholder="e.g., San Francisco, CA"
                  />
                ) : (
                  <p className={cn(SP_VALUE, "flex items-center gap-2")}>
                    <MapPin className="h-4 w-4 shrink-0 text-text-muted" />
                    {user.location || "Not specified"}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className={SP_LABEL} htmlFor="yearsOfExperience">Years of Experience *</Label>
                {isEditing ? (
                  <Input className={cn(SP_INPUT)}
                    id="yearsOfExperience"
                    value={editedProfile.yearsOfExperience}
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        yearsOfExperience: e.target.value,
                      })
                    }
                    placeholder="e.g., 5"
                  />
                ) : (
                  <p className={SP_VALUE}>
                    {user.yearsOfExperience || "Not specified"}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label className={SP_LABEL} htmlFor="bio">Professional Bio *</Label>
              {isEditing ? (
                <Textarea className={cn(SP_TEXTAREA)}
                  id="bio"
                  value={editedProfile.bio}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      bio: e.target.value,
                    })
                  }
                  placeholder="Tell founders about your professional background, expertise, and what drives you..."
                  rows={5}
                />
              ) : (
                <p
                  className={cn(
                    SP_VALUE,
                    "whitespace-pre-wrap",
                    !user.bio && SP_EMPTY,
                  )}
                >
                  {user.bio || "No bio added yet"}
                </p>
              )}
              {isEditing && (
                <p className="text-xs text-muted-foreground">
                  A compelling bio helps founders understand your value
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className={SP_CARD}>
          <CardHeader>
            <CardTitle className={SP_CARD_TITLE}>
              <Code className="w-5 h-5" />
              Skills & Expertise *
            </CardTitle>
            <CardDescription className="font-body text-text-body">
              Add your key skills so founders can find you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {editedProfile.skills.map((skill) => (
                <Badge
                  key={skill}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {skill}
                  {isEditing && (
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </Badge>
              ))}
              {editedProfile.skills.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No skills added yet
                </p>
              )}
            </div>
            {isEditing && (
              <div className="flex gap-2">
                <Input className={cn(SP_INPUT)}
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  placeholder="e.g., React, Node.js, TypeScript"
                />
                <Button onClick={handleAddSkill} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className={SP_CARD}>
          <CardHeader>
            <CardTitle className={SP_CARD_TITLE}>
              <Globe className="w-5 h-5" />
              Professional Links
            </CardTitle>
            <CardDescription className="font-body text-text-body">
              These links help validate your professional background
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={SP_LABEL} htmlFor="linkedin">LinkedIn *</Label>
                {isEditing ? (
                  <Input className={cn(SP_INPUT)}
                    id="linkedin"
                    value={editedProfile.linkedin}
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        linkedin: e.target.value,
                      })
                    }
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                ) : (
                  <p className={cn(SP_VALUE, "flex items-center gap-2")}>
                    <Linkedin className="h-4 w-4 shrink-0 text-text-muted" />
                    {user.linkedin ? (
                      <a
                        href={user.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        View Profile
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      "Not specified"
                    )}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className={SP_LABEL} htmlFor="github">GitHub</Label>
                {isEditing ? (
                  <Input className={cn(SP_INPUT)}
                    id="github"
                    value={editedProfile.github}
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        github: e.target.value,
                      })
                    }
                    placeholder="https://github.com/yourusername"
                  />
                ) : (
                  <p className={cn(SP_VALUE, "flex items-center gap-2")}>
                    <Github className="h-4 w-4 shrink-0 text-text-muted" />
                    {user.github ? (
                      <a
                        href={user.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        View Profile
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      "Not specified"
                    )}
                  </p>
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className={SP_LABEL} htmlFor="website">Portfolio Website</Label>
                {isEditing ? (
                  <Input className={cn(SP_INPUT)}
                    id="website"
                    value={editedProfile.website}
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        website: e.target.value,
                      })
                    }
                    placeholder="https://yourportfolio.com"
                  />
                ) : (
                  <p className={cn(SP_VALUE, "flex items-center gap-2")}>
                    <Globe className="h-4 w-4 shrink-0 text-text-muted" />
                    {user.website ? (
                      <a
                        href={user.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        Visit Website
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      "Not specified"
                    )}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={SP_CARD}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className={SP_CARD_TITLE}>
                  <Briefcase className="w-5 h-5" />
                  Work Experience *
                </CardTitle>
                <CardDescription className="font-body text-text-body">
                  Add your professional work history to validate your experience
                </CardDescription>
              </div>
              {isEditing && (
                <Button onClick={addWorkExperience} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Experience
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {editedProfile.workExperience.length === 0 ? (
              <div className="rounded-input bg-surface-page py-8 text-center">
                <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-2">
                  No work experience added yet
                </p>
                {isEditing && (
                  <p className="text-xs text-muted-foreground">
                    Click "Add Experience" to showcase your professional
                    background
                  </p>
                )}
              </div>
            ) : (
              editedProfile.workExperience.map((exp, index) => (
                <div key={exp.id} className="space-y-3 rounded-input border-0 bg-surface-page p-4">
                  {isEditing ? (
                    <>
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold">
                          {"Experience "}
                          {index + 1}
                        </h4>
                        <Button
                          onClick={() => removeWorkExperience(exp.id)}
                          size="sm"
                          variant="ghost"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        <Input className={cn(SP_INPUT)}
                          placeholder="Company"
                          value={exp.company}
                          onChange={(e) =>
                            updateWorkExperience(
                              exp.id,
                              "company",
                              e.target.value,
                            )
                          }
                        />
                        <Input className={cn(SP_INPUT)}
                          placeholder="Position"
                          value={exp.position}
                          onChange={(e) =>
                            updateWorkExperience(
                              exp.id,
                              "position",
                              e.target.value,
                            )
                          }
                        />
                        <Input className={cn(SP_INPUT)}
                          placeholder="Start Date"
                          value={exp.startDate}
                          onChange={(e) =>
                            updateWorkExperience(
                              exp.id,
                              "startDate",
                              e.target.value,
                            )
                          }
                        />
                        <Input className={cn(SP_INPUT)}
                          placeholder="End Date"
                          value={exp.endDate}
                          onChange={(e) =>
                            updateWorkExperience(
                              exp.id,
                              "endDate",
                              e.target.value,
                            )
                          }
                          disabled={exp.current}
                        />
                        <div className="md:col-span-2 flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`current-${exp.id}`}
                            checked={exp.current}
                            onChange={(e) =>
                              updateWorkExperience(
                                exp.id,
                                "current",
                                e.target.checked,
                              )
                            }
                            className="w-4 h-4"
                          />
                          <Label
                            className={cn(SP_LABEL, "normal-case tracking-normal")}
                            htmlFor={`current-${exp.id}`}
                          >
                            Currently working here
                          </Label>
                        </div>
                        <div className="md:col-span-2">
                          <Textarea className={cn(SP_TEXTAREA)}
                            placeholder="Description"
                            value={exp.description}
                            onChange={(e) =>
                              updateWorkExperience(
                                exp.id,
                                "description",
                                e.target.value,
                              )
                            }
                            rows={3}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <h4 className="font-semibold">{exp.position}</h4>
                        <p className="text-sm text-muted-foreground">
                          {exp.company}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {exp.startDate}
                          {" - "}
                          {exp.current ? "Present" : exp.endDate}
                        </span>
                      </div>
                      {exp.description && (
                        <p className="text-sm whitespace-pre-wrap">
                          {exp.description}
                        </p>
                      )}
                    </>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card className={SP_CARD}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className={SP_CARD_TITLE}>
                  <GraduationCap className="w-5 h-5" />
                  Education
                </CardTitle>
              </div>
              {isEditing && (
                <Button onClick={addEducation} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Education
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {editedProfile.education.length === 0 ? (
              <div className="rounded-input bg-surface-page py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No education added yet
                </p>
              </div>
            ) : (
              editedProfile.education.map((edu, index) => (
                <div key={edu.id} className="space-y-3 rounded-input border-0 bg-surface-page p-4">
                  {isEditing ? (
                    <>
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold">
                          {"Education "}
                          {index + 1}
                        </h4>
                        <Button
                          onClick={() => removeEducation(edu.id)}
                          size="sm"
                          variant="ghost"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        <Input className={cn(SP_INPUT)}
                          placeholder="Institution"
                          value={edu.institution}
                          onChange={(e) =>
                            updateEducation(
                              edu.id,
                              "institution",
                              e.target.value,
                            )
                          }
                        />
                        <Input className={cn(SP_INPUT)}
                          placeholder="Degree"
                          value={edu.degree}
                          onChange={(e) =>
                            updateEducation(edu.id, "degree", e.target.value)
                          }
                        />
                        <Input className={cn(SP_INPUT)}
                          placeholder="Field of Study"
                          value={edu.field}
                          onChange={(e) =>
                            updateEducation(edu.id, "field", e.target.value)
                          }
                        />
                        <Input className={cn(SP_INPUT)}
                          placeholder="Graduation Year"
                          value={edu.graduationYear}
                          onChange={(e) =>
                            updateEducation(
                              edu.id,
                              "graduationYear",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <h4 className="font-semibold">
                          {edu.degree}
                          {" in "}
                          {edu.field}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {edu.institution}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {"Graduated: "}
                        {edu.graduationYear}
                      </p>
                    </>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card className={SP_CARD}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className={SP_CARD_TITLE}>
                  <Award className="w-5 h-5" />
                  Certifications & Credentials
                </CardTitle>
                <CardDescription className="font-body text-text-body">
                  Professional certifications help validate your expertise
                </CardDescription>
              </div>
              {isEditing && (
                <Button onClick={addCertification} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Certification
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {editedProfile.certifications.length === 0 ? (
              <div className="rounded-input bg-surface-page py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No certifications added yet
                </p>
              </div>
            ) : (
              editedProfile.certifications.map((cert, index) => (
                <div key={cert.id} className="space-y-3 rounded-input border-0 bg-surface-page p-4">
                  {isEditing ? (
                    <>
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold">
                          {"Certification "}
                          {index + 1}
                        </h4>
                        <Button
                          onClick={() => removeCertification(cert.id)}
                          size="sm"
                          variant="ghost"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        <Input className={cn(SP_INPUT)}
                          placeholder="Certification Name"
                          value={cert.name}
                          onChange={(e) =>
                            updateCertification(cert.id, "name", e.target.value)
                          }
                        />
                        <Input className={cn(SP_INPUT)}
                          placeholder="Issuing Organization"
                          value={cert.issuer}
                          onChange={(e) =>
                            updateCertification(
                              cert.id,
                              "issuer",
                              e.target.value,
                            )
                          }
                        />
                        <Input className={cn(SP_INPUT)}
                          placeholder="Issue Year"
                          value={cert.issueYear}
                          onChange={(e) =>
                            updateCertification(
                              cert.id,
                              "issueYear",
                              e.target.value,
                            )
                          }
                        />
                        <Input className={cn(SP_INPUT)}
                          placeholder="Credential ID (Optional)"
                          value={cert.credentialId || ""}
                          onChange={(e) =>
                            updateCertification(
                              cert.id,
                              "credentialId",
                              e.target.value,
                            )
                          }
                        />
                        <div className="md:col-span-2">
                          <Input className={cn(SP_INPUT)}
                            placeholder="Credential URL (Optional)"
                            value={cert.credentialUrl || ""}
                            onChange={(e) =>
                              updateCertification(
                                cert.id,
                                "credentialUrl",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <Label className={SP_LABEL}>Certificate Image</Label>
                          <Input className={cn(SP_INPUT)}
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              updateCertificationImage(
                                cert.id,
                                e.target.files?.[0],
                              )
                            }
                          />
                          {cert.certificateImage && (
                            <div className="flex items-center gap-3">
                              <img
                                src={cert.certificateImage}
                                alt={cert.name || "Certificate"}
                                className="h-20 w-28 rounded-md border object-cover"
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateCertification(
                                    cert.id,
                                    "certificateImage",
                                    "",
                                  )
                                }
                              >
                                Remove Image
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <h4 className="font-semibold">{cert.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {cert.issuer}
                          {" • "}
                          {cert.issueYear}
                        </p>
                      </div>
                      {cert.credentialUrl && (
                        <a
                          href={cert.credentialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          View Credential
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card className={SP_CARD}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className={SP_CARD_TITLE}>
                  <FileText className="w-5 h-5" />
                  Portfolio & Projects
                </CardTitle>
                <CardDescription className="font-body text-text-body">
                  Showcase your best work to stand out to founders
                </CardDescription>
              </div>
              {isEditing && (
                <Button onClick={addPortfolioItem} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Project
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {editedProfile.portfolioItems.length === 0 ? (
              <div className="rounded-input bg-surface-page py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No portfolio items added yet
                </p>
              </div>
            ) : (
              editedProfile.portfolioItems.map((item, index) => (
                <div key={item.id} className="space-y-3 rounded-input border-0 bg-surface-page p-4">
                  {isEditing ? (
                    <>
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold">
                          {"Project "}
                          {index + 1}
                        </h4>
                        <Button
                          onClick={() => removePortfolioItem(item.id)}
                          size="sm"
                          variant="ghost"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <Input className={cn(SP_INPUT)}
                          placeholder="Project Title"
                          value={item.title}
                          onChange={(e) =>
                            updatePortfolioItem(
                              item.id,
                              "title",
                              e.target.value,
                            )
                          }
                        />
                        <Input className={cn(SP_INPUT)}
                          placeholder="Project Type (e.g., Web App, Mobile App)"
                          value={item.type}
                          onChange={(e) =>
                            updatePortfolioItem(item.id, "type", e.target.value)
                          }
                        />
                        <Textarea className={cn(SP_TEXTAREA)}
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) =>
                            updatePortfolioItem(
                              item.id,
                              "description",
                              e.target.value,
                            )
                          }
                          rows={3}
                        />
                        <Input className={cn(SP_INPUT)}
                          placeholder="Project URL"
                          value={item.url}
                          onChange={(e) =>
                            updatePortfolioItem(item.id, "url", e.target.value)
                          }
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <h4 className="font-semibold">{item.title}</h4>
                        <Badge variant="secondary" className="mt-1">
                          {item.type}
                        </Badge>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">
                        {item.description}
                      </p>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          View Project
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card className={SP_CARD}>
          <CardHeader>
            <CardTitle className={SP_CARD_TITLE}>
              <Calendar className="w-5 h-5" />
              Availability & Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={SP_LABEL} htmlFor="experience">
                  Years of Experience (For Display) *
                </Label>
                {isEditing ? (
                  <select
                    id="experience"
                    value={editedProfile.experience}
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        experience: e.target.value,
                      })
                    }
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Select experience level...</option>
                    <option value="0-1 years">0-1 years</option>
                    <option value="1-3 years">1-3 years</option>
                    <option value="3-5 years">3-5 years</option>
                    <option value="5-10 years">5-10 years</option>
                    <option value="10+ years">10+ years</option>
                  </select>
                ) : (
                  <p className={SP_VALUE}>
                    {user.experience || "Not specified"}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Displayed on your profile card
                </p>
              </div>
              <div className="space-y-2">
                <Label className={SP_LABEL} htmlFor="availability">When Can You Start? *</Label>
                {isEditing ? (
                  <select
                    id="availability"
                    value={editedProfile.availability}
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        availability: e.target.value,
                      })
                    }
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Select availability...</option>
                    <option value="Immediately">Immediately</option>
                    <option value="In 1 week">In 1 week</option>
                    <option value="In 2 weeks">In 2 weeks</option>
                    <option value="In 1 month">In 1 month</option>
                    <option value="Flexible">Flexible</option>
                  </select>
                ) : (
                  <p className={SP_VALUE}>
                    {user.availability || "Not specified"}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Displayed on your profile card
                </p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={SP_LABEL} htmlFor="availabilityStatus">Current Status *</Label>
                {isEditing ? (
                  <select
                    id="availabilityStatus"
                    value={editedProfile.availabilityStatus}
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        availabilityStatus: e.target.value,
                      })
                    }
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Select status...</option>
                    <option value="actively-looking">Actively Looking</option>
                    <option value="open-to-offers">Open to Offers</option>
                    <option value="casually-browsing">Casually Browsing</option>
                    <option value="not-looking">
                      Not Looking (Just Networking)
                    </option>
                  </select>
                ) : (
                  <p className={SP_VALUE}>
                    {user.availabilityStatus || "Not specified"}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className={SP_LABEL} htmlFor="preferredCommitment">
                  Preferred Commitment *
                </Label>
                {isEditing ? (
                  <select
                    id="preferredCommitment"
                    value={editedProfile.preferredCommitment}
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        preferredCommitment: e.target.value,
                      })
                    }
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Select commitment...</option>
                    <option value="full-time">Full-Time</option>
                    <option value="part-time">Part-Time</option>
                    <option value="contract">Contract/Freelance</option>
                    <option value="flexible">Flexible</option>
                  </select>
                ) : (
                  <p className={SP_VALUE}>
                    {user.preferredCommitment || "Not specified"}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={SP_CARD}>
          <CardHeader>
            <CardTitle className={SP_CARD_TITLE}>
              <Target className="w-5 h-5" />
              Career Goals & Industry Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className={SP_LABEL} htmlFor="professionalGoals">Professional Goals</Label>
              {isEditing ? (
                <Textarea className={cn(SP_TEXTAREA)}
                  id="professionalGoals"
                  value={editedProfile.professionalGoals}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      professionalGoals: e.target.value,
                    })
                  }
                  placeholder="Describe your career goals, aspirations, and what you're looking for in your next role..."
                  rows={3}
                />
              ) : (
                <p
                  className={cn(
                    SP_VALUE,
                    "whitespace-pre-wrap",
                    !user.professionalGoals && SP_EMPTY,
                  )}
                >
                  {user.professionalGoals || "Not specified"}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className={SP_LABEL} htmlFor="interests">
                Industry Interests (Displayed on Profile Card) *
              </Label>
              {isEditing ? (
                <>
                  <Input className={cn(SP_INPUT)}
                    id="interests"
                    value={
                      Array.isArray(editedProfile.interests)
                        ? editedProfile.interests.join(", ")
                        : ""
                    }
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        interests: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="e.g., FinTech, HealthTech, AI/ML, SaaS"
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate industries with commas. These will be shown on your
                    profile card.
                  </p>
                </>
              ) : (
                <p className={SP_VALUE}>
                  {Array.isArray(user.interests) && user.interests.length > 0
                    ? user.interests.join(", ")
                    : "Not specified"}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className={SP_LABEL} htmlFor="industryPreferences">
                Other Industry Preferences (Optional)
              </Label>
              {isEditing ? (
                <>
                  <Input className={cn(SP_INPUT)}
                    id="industryPreferences"
                    value={
                      Array.isArray(editedProfile.industryPreferences)
                        ? editedProfile.industryPreferences.join(", ")
                        : ""
                    }
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        industryPreferences: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="e.g., Technology, Healthcare, Finance"
                  />
                  <p className="text-xs text-muted-foreground">
                    Additional industries you're interested in beyond your
                    primary interests.
                  </p>
                </>
              ) : (
                <p className={SP_VALUE}>
                  {Array.isArray(user.industryPreferences) &&
                  user.industryPreferences.length > 0
                    ? user.industryPreferences.join(", ")
                    : "Not specified"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render Founder/Team Member Profile
  return (
    <div className="min-h-full space-y-3 bg-transparent p-2 font-body md:space-y-4 md:p-3 lg:p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2 font-heading text-3xl font-bold text-text-heading">
            Founder Profile
          </h1>
          <p className="font-body text-text-body">
            Manage your personal and startup information
          </p>
        </div>
        {!isEditing ? (
          <Button className={SP_PRIMARY_BTN} onClick={() => setIsEditing(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className={SP_CANCEL_BTN}
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            <Button className={SP_PRIMARY_BTN} onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        )}
      </div>
      <Card className={SP_CARD}>
        <CardHeader>
          <CardTitle className={SP_CARD_TITLE}>
            <UserCircle className="w-5 h-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className={SP_LABEL} htmlFor="name">Full Name</Label>
              {isEditing ? (
                <Input className={cn(SP_INPUT)}
                  id="name"
                  value={editedProfile.name}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      name: e.target.value,
                    })
                  }
                />
              ) : (
                <p className={SP_VALUE}>{user.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className={SP_LABEL} htmlFor="email">Email</Label>
              {isEditing ? (
                <Input className={cn(SP_INPUT)}
                  id="email"
                  type="email"
                  value={editedProfile.email}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      email: e.target.value,
                    })
                  }
                />
              ) : (
                <p className={cn(SP_VALUE, "flex items-center gap-2")}>
                  <Mail className="h-4 w-4 shrink-0 text-text-muted" />
                  {user.email}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label className={SP_LABEL} htmlFor="bio">Bio</Label>
            {isEditing ? (
              <Textarea className={cn(SP_TEXTAREA)}
                id="bio"
                value={editedProfile.bio}
                onChange={(e) =>
                  setEditedProfile({
                    ...editedProfile,
                    bio: e.target.value,
                  })
                }
                placeholder="Tell us about yourself as a founder..."
                rows={4}
              />
            ) : (
              <p
                className={cn(
                  SP_VALUE,
                  "whitespace-pre-wrap",
                  !user.bio && SP_EMPTY,
                )}
              >
                {user.bio || "No bio added yet"}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      {user.role === "founder" && (
        <Card className={SP_CARD}>
          <CardHeader>
            <CardTitle className={SP_CARD_TITLE}>
              <Building className="w-5 h-5" />
              Startup Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label className={SP_LABEL} htmlFor="startupName">Startup name</Label>
                {isEditing ? (
                  <Input className={cn(SP_INPUT)}
                    id="startupName"
                    value={editedProfile.startupName}
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        startupName: e.target.value,
                      })
                    }
                    placeholder="Your startup name"
                  />
                ) : (
                  <p className={SP_VALUE}>
                    {user.startupName ||
                      user.profile?.startupName ||
                      "Not specified"}
                  </p>
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className={SP_LABEL} htmlFor="startupDescription">Startup description</Label>
                {isEditing ? (
                  <Textarea className={cn(SP_TEXTAREA)}
                    id="startupDescription"
                    value={editedProfile.startupDescription || ""}
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        startupDescription: e.target.value,
                      })
                    }
                    rows={4}
                    placeholder="What you do and the problem you solve"
                  />
                ) : (
                  <p className={cn(SP_VALUE, "whitespace-pre-wrap")}>
                    {user.profile?.startupDescription ||
                      user.startupDescription ||
                      "Not specified"}
                  </p>
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className={SP_LABEL}>Startup type (industry)</Label>
                {isEditing ? (
                  <>
                    <Select
                      value={editedProfile.industryFocus || ""}
                      onValueChange={(v) =>
                        setEditedProfile({
                          ...editedProfile,
                          industryFocus: v,
                        })
                      }
                    >
                      <SelectTrigger className={cn(SP_SELECT_TRIGGER)}>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {FOUNDER_INDUSTRY_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {editedProfile.industryFocus === "Others" && (
                      <Input
                        className={cn(SP_INPUT, "mt-2")}
                        value={editedProfile.otherIndustry || ""}
                        onChange={(e) =>
                          setEditedProfile({
                            ...editedProfile,
                            otherIndustry: e.target.value,
                          })
                        }
                        placeholder="Specify your industry"
                      />
                    )}
                  </>
                ) : (
                  <p className={SP_VALUE}>
                    {user.industry ||
                      user.profile?.industry ||
                      user.profile?.industryFocus ||
                      "Not specified"}
                  </p>
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className={SP_LABEL}>Target audience</Label>
                {isEditing ? (
                  <div className={SP_CHECK_WRAP}>
                    {FOUNDER_TARGET_AUDIENCE_OPTIONS.map((opt) => {
                      const checked =
                        editedProfile.targetAudience?.includes?.(opt);
                      return (
                        <label
                          key={opt}
                          className={cn(
                            SP_CHECK_LABEL_BASE,
                            checked && SP_CHECK_LABEL_ON,
                          )}
                        >
                          <Checkbox
                            className={SP_CHECK_BOX}
                            checked={checked}
                            onCheckedChange={() => {
                              const cur = editedProfile.targetAudience || [];
                              setEditedProfile({
                                ...editedProfile,
                                targetAudience: cur.includes(opt)
                                  ? cur.filter((x) => x !== opt)
                                  : [...cur, opt],
                              });
                            }}
                          />
                          {opt}
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className={SP_VALUE}>
                    {Array.isArray(user.profile?.targetAudience)
                      ? user.profile.targetAudience.join(", ")
                      : Array.isArray(user.targetAudience)
                        ? user.targetAudience.join(", ")
                        : "Not specified"}
                  </p>
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className={SP_LABEL}>Roles needed</Label>
                {isEditing ? (
                  <div className={cn(SP_CHECK_WRAP, "max-h-48 overflow-y-auto")}>
                    {FOUNDER_ROLES_NEEDED_OPTIONS.map((opt) => {
                      const checked = editedProfile.rolesNeeded?.includes?.(opt);
                      return (
                        <label
                          key={opt}
                          className={cn(
                            SP_CHECK_LABEL_BASE,
                            "text-xs",
                            checked && SP_CHECK_LABEL_ON,
                          )}
                        >
                          <Checkbox
                            className={SP_CHECK_BOX}
                            checked={checked}
                            onCheckedChange={() => {
                              const cur = editedProfile.rolesNeeded || [];
                              setEditedProfile({
                                ...editedProfile,
                                rolesNeeded: cur.includes(opt)
                                  ? cur.filter((x) => x !== opt)
                                  : [...cur, opt],
                              });
                            }}
                          />
                          {opt}
                        </label>
                      );
                    })}
                    {editedProfile.rolesNeeded?.includes?.("Others") && (
                      <Input
                        className={cn(SP_INPUT, "mt-2 w-full")}
                        placeholder="Specify role"
                        value={editedProfile.otherRole || ""}
                        onChange={(e) =>
                          setEditedProfile({
                            ...editedProfile,
                            otherRole: e.target.value,
                          })
                        }
                      />
                    )}
                  </div>
                ) : (
                  <p className={SP_VALUE}>
                    {Array.isArray(user.profile?.rolesNeeded)
                      ? user.profile.rolesNeeded.join(", ")
                      : Array.isArray(user.rolesNeeded)
                        ? user.rolesNeeded.join(", ")
                        : "Not specified"}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className={SP_LABEL}>Team size</Label>
                {isEditing ? (
                  <Select
                    value={editedProfile.teamSize || ""}
                    onValueChange={(v) =>
                      setEditedProfile({ ...editedProfile, teamSize: v })
                    }
                  >
                    <SelectTrigger className={cn(SP_SELECT_TRIGGER)}>
                      <SelectValue placeholder="Team size" />
                    </SelectTrigger>
                    <SelectContent>
                      {FOUNDER_TEAM_SIZE_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p
                    className={cn(
                      SP_VALUE,
                      "flex items-center gap-2",
                      !(user.profile?.teamSize || user.teamSize) && SP_EMPTY,
                    )}
                  >
                    <Users className="h-4 w-4 shrink-0 text-text-muted" />
                    {user.profile?.teamSize || user.teamSize || "Not specified"}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className={SP_LABEL}>Execution stage</Label>
                {isEditing ? (
                  <Select
                    value={editedProfile.startupStage || ""}
                    onValueChange={(v) =>
                      setEditedProfile({ ...editedProfile, startupStage: v })
                    }
                  >
                    <SelectTrigger className={cn(SP_SELECT_TRIGGER)}>
                      <SelectValue placeholder="Stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {FOUNDER_STAGE_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p
                    className={cn(
                      SP_VALUE,
                      "flex items-center gap-2",
                      !(user.startupStage || user.profile?.startupStage) &&
                        SP_EMPTY,
                    )}
                  >
                    <Target className="h-4 w-4 shrink-0 text-text-muted" />
                    {user.startupStage ||
                      user.profile?.startupStage ||
                      "Not specified"}
                  </p>
                )}
              </div>
            </div>
            <div
              className={cn(
                "grid gap-4 border-t border-surface-border pt-4 md:grid-cols-1",
              )}
            >
              <p className="font-body text-sm font-semibold text-text-heading">
                Where you are today
              </p>
              <div className="space-y-2">
                <Label className={SP_SUBLABEL}>Validated problem / idea</Label>
                {isEditing ? (
                  <Select
                    value={editedProfile.hasValidatedIdea || ""}
                    onValueChange={(v) =>
                      setEditedProfile({
                        ...editedProfile,
                        hasValidatedIdea: v,
                      })
                    }
                  >
                    <SelectTrigger className={cn(SP_SELECT_TRIGGER)}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {FOUNDER_VALIDATED_IDEA_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className={SP_VALUE}>
                    {user.profile?.hasValidatedIdea ||
                      user.hasValidatedIdea ||
                      "Not specified"}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className={SP_SUBLABEL}>MVP or prototype</Label>
                {isEditing ? (
                  <Select
                    value={editedProfile.hasMVP || ""}
                    onValueChange={(v) =>
                      setEditedProfile({ ...editedProfile, hasMVP: v })
                    }
                  >
                    <SelectTrigger className={cn(SP_SELECT_TRIGGER)}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {FOUNDER_MVP_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className={SP_VALUE}>
                    {user.profile?.hasMVP || user.hasMVP || "Not specified"}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className={SP_SUBLABEL}>Customers or users</Label>
                {isEditing ? (
                  <Select
                    value={editedProfile.hasCustomers || ""}
                    onValueChange={(v) =>
                      setEditedProfile({
                        ...editedProfile,
                        hasCustomers: v,
                      })
                    }
                  >
                    <SelectTrigger className={cn(SP_SELECT_TRIGGER)}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {FOUNDER_CUSTOMERS_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className={SP_VALUE}>
                    {user.profile?.hasCustomers ||
                      user.hasCustomers ||
                      "Not specified"}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <Card className={SP_CARD}>
        <CardHeader>
          <CardTitle className={SP_CARD_TITLE}>
            <Globe className="w-5 h-5" />
            Contact & Links
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className={SP_LABEL} htmlFor="website">Website</Label>
              {isEditing ? (
                <Input className={cn(SP_INPUT)}
                  id="website"
                  value={editedProfile.website}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      website: e.target.value,
                    })
                  }
                  placeholder="https://yourstartup.com"
                />
              ) : (
                <p
                  className={cn(
                    SP_VALUE,
                    "flex items-center gap-2",
                    !user.website && SP_EMPTY,
                  )}
                >
                  <Globe className="h-4 w-4 shrink-0 text-text-muted" />
                  {user.website || "Not specified"}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className={SP_LABEL} htmlFor="linkedin">LinkedIn</Label>
              {isEditing ? (
                <Input className={cn(SP_INPUT)}
                  id="linkedin"
                  value={editedProfile.linkedin}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      linkedin: e.target.value,
                    })
                  }
                  placeholder="https://linkedin.com/in/yourname"
                />
              ) : (
                <p
                  className={cn(
                    SP_VALUE,
                    "flex items-center gap-2",
                    !user.linkedin && SP_EMPTY,
                  )}
                >
                  <Linkedin className="h-4 w-4 shrink-0 text-text-muted" />
                  {user.linkedin || "Not specified"}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
