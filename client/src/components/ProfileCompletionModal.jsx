import React, { useState, useRef, useEffect } from "react";
import { API_BASE_URL } from "../config/apiBase.js";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Upload, ChevronDown, ChevronUp } from "lucide-react";
import TalentProfileForm from "./TalentProfileForm";
import {
  determineInitialStage,
  getStageName,
} from "../utils/algorithmicStageDetection";
import { setCurrentStage } from "../utils/journeyProgress";
import { toast } from "sonner";
import { getAccessToken } from "../app/session";

// Single-select dropdown component with scroll indicators
function SingleSelectDropdown({
  label,
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const listRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const handleScroll = () => {
    if (listRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = listRef.current;
      setShowScrollTop(scrollTop > 0);
      setShowScrollBottom(scrollTop + clientHeight < scrollHeight - 5);
    }
  };
  useEffect(() => {
    if (isOpen && listRef.current) {
      const { scrollHeight, clientHeight } = listRef.current;
      setShowScrollBottom(scrollHeight > clientHeight);
    }
  }, [isOpen]);
  const scrollUp = () => {
    if (listRef.current) {
      listRef.current.scrollBy({
        top: -100,
        behavior: "smooth",
      });
    }
  };
  const scrollDown = () => {
    if (listRef.current) {
      listRef.current.scrollBy({
        top: 100,
        behavior: "smooth",
      });
    }
  };
  const displayValue = value || placeholder;
  const isPlaceholder = !value;
  return (
    <div className="space-y-2">
      <Label>
        {label} {required && "*"}
      </Label>
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="w-full h-10 px-3 rounded-md border border-border/70 bg-background text-foreground flex items-center justify-between text-left disabled:opacity-50"
        >
          <span
            className={`truncate ${isPlaceholder ? "text-xs text-muted-foreground" : "text-xs"}`}
          >
            {displayValue}
          </span>
          <ChevronDown
            className={`w-4 h-4 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-border/70 rounded-md shadow-lg overflow-hidden">
            {showScrollTop && (
              <button
                type="button"
                onClick={scrollUp}
                className="w-full py-1.5 bg-muted/50 hover:bg-muted flex items-center justify-center border-b border-border/70"
              >
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
            <div
              ref={listRef}
              onScroll={handleScroll}
              className="max-h-48 overflow-y-auto"
            >
              {options.map((option) => (
                <button
                  type="button"
                  key={option}
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs hover:bg-muted transition-colors ${value === option ? "bg-muted/50" : ""}`}
                >
                  {option}
                </button>
              ))}
            </div>
            {showScrollBottom && (
              <button
                type="button"
                onClick={scrollDown}
                className="w-full py-1.5 bg-muted/50 hover:bg-muted flex items-center justify-center border-t border-border/70"
              >
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Multi-select dropdown component
function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
  placeholder,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const listRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const handleScroll = () => {
    if (listRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = listRef.current;
      setShowScrollTop(scrollTop > 0);
      setShowScrollBottom(scrollTop + clientHeight < scrollHeight - 5);
    }
  };
  useEffect(() => {
    if (isOpen && listRef.current) {
      const { scrollHeight, clientHeight } = listRef.current;
      setShowScrollBottom(scrollHeight > clientHeight);
    }
  }, [isOpen]);
  const scrollUp = () => {
    if (listRef.current) {
      listRef.current.scrollBy({
        top: -100,
        behavior: "smooth",
      });
    }
  };
  const scrollDown = () => {
    if (listRef.current) {
      listRef.current.scrollBy({
        top: 100,
        behavior: "smooth",
      });
    }
  };
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="w-full h-10 px-3 rounded-md border border-border/70 bg-background text-foreground flex items-center justify-between text-left disabled:opacity-50"
        >
          <span
            className={`truncate ${selected.length > 0 ? "text-sm" : "text-xs text-muted-foreground"}`}
          >
            {selected.length > 0
              ? `${selected.length} selected: ${selected.slice(0, 2).join(", ")}${selected.length > 2 ? "..." : ""}`
              : placeholder}
          </span>
          <ChevronDown
            className={`w-4 h-4 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-border/70 rounded-md shadow-lg overflow-hidden">
            {showScrollTop && (
              <button
                type="button"
                onClick={scrollUp}
                className="w-full py-1.5 bg-muted/50 hover:bg-muted flex items-center justify-center border-b border-border/70"
              >
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
            <div
              ref={listRef}
              onScroll={handleScroll}
              className="max-h-48 overflow-y-auto"
            >
              {options.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-muted cursor-pointer text-xs"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(option)}
                    onChange={() => onChange(option)}
                    className="w-4 h-4"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            {showScrollBottom && (
              <button
                type="button"
                onClick={scrollDown}
                className="w-full py-1.5 bg-muted/50 hover:bg-muted flex items-center justify-center border-t border-border/70"
              >
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        )}
      </div>
      {selected.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {selected.length}
          {" item"}
          {selected.length !== 1 ? "s" : ""}
          {" selected"}
        </p>
      )}
    </div>
  );
}
export default function ProfileCompletionModal({
  role,
  onComplete,
  onClose,
  user,
  onUpdateUser,
}) {
  const [loading, setLoading] = useState(false);
  const talentFormRef = useRef(null);
  const [talentProfileData, setTalentProfileData] = useState(null);

  // Avatar upload state
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  // Founder form fields
  const [startupName, setStartupName] = useState("");
  const [startupDescription, setStartupDescription] = useState("");
  const [industryFocus, setIndustryFocus] = useState("");
  const [otherIndustry, setOtherIndustry] = useState("");
  const [stage, setStage] = useState("");
  const [targetAudience, setTargetAudience] = useState([]);
  const [rolesNeeded, setRolesNeeded] = useState([]);
  const [otherRole, setOtherRole] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [bio, setBio] = useState("");

  // 🎯 Algorithmic Stage Determination - Factual Questions
  const [hasValidatedIdea, setHasValidatedIdea] = useState("");
  const [hasMVP, setHasMVP] = useState("");
  const [hasCustomers, setHasCustomers] = useState("");
  const [currentTeamSize, setCurrentTeamSize] = useState("");
  const [monthlyRevenue, setMonthlyRevenue] = useState("");

  // Talent form fields
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("");
  const [interests, setInterests] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [talentBio, setTalentBio] = useState("");

  // Enhanced Talent Profile Fields

  const [workExperiences, setWorkExperiences] = useState([]);
  const [educationList, setEducationList] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [availabilityStatus, setAvailabilityStatus] = useState("");
  const [preferredRoles, setPreferredRoles] = useState([]);
  const [preferredIndustries, setPreferredIndustries] = useState([]);

  // Industry focus options
  const industryOptions = [
    "HealthTech",
    "FinTech",
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

  // Target audience options
  const audienceOptions = [
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

  // Roles needed options
  const rolesOptions = [
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

  // Team size options
  const teamSizeOptions = [
    "Just me (Solo founder)",
    "2-5 people",
    "6-10 people",
    "11-20 people",
    "21-50 people",
    "51-100 people",
    "100+ people",
  ];
  const handleTargetAudienceChange = (audience) => {
    setTargetAudience((prev) =>
      prev.includes(audience)
        ? prev.filter((a) => a !== audience)
        : [...prev, audience],
    );
  };
  const handleRolesNeededChange = (role) => {
    setRolesNeeded((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };
  const getMockProfileData = () => {
    // Mock/sample data for development
    return role === "founder"
      ? {
          startupName: "TechFlow AI",
          startupDescription:
            "Building next-generation AI-powered workflow automation tools for modern teams.",
          industryFocus: "AI/Machine Learning",
          stage: "MVP Development",
          targetAudience: ["B2B", "Enterprise", "SMB"],
          rolesNeeded: [
            "Full-stack Developer",
            "UI/UX Designer",
            "Product Manager",
          ],
          teamSize: "2-5 people",
          bio: "Experienced founder with 10+ years in tech. Previously led product teams at major SaaS companies. Passionate about building solutions that empower teams to work smarter.",
          onboardingComplete: true,
        }
      : {
          skills: "React, Node.js, TypeScript, UI/UX Design, Product Strategy",
          experience:
            "Senior Full-stack Developer with 8 years of experience building scalable web applications. Previously worked at startups in FinTech and EdTech sectors.",
          interests:
            "Interested in AI/ML, SaaS, and EdTech startups. Looking for senior engineering or technical lead roles.",
          portfolio: "github.com/developer | linkedin.com/in/developer",
          bio: "Passionate about building products that make a difference. Love working with ambitious teams solving real problems.",
          onboardingComplete: true,
        };
  };

  // Handle avatar file selection
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      setAvatarFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload avatar to server
  const uploadAvatar = async () => {
    if (!avatarFile || !user?.id) return null;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", avatarFile);
      formData.append("userId", user.id);
      const response = await fetch(
        `${API_BASE_URL}/users/upload-avatar`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getAccessToken()}`,
          },
          body: formData,
        },
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to upload avatar");
      }
      console.log("✅ [Avatar] Upload successful:", result.avatarUrl);
      toast.success("Profile picture uploaded successfully!");
      return result.avatarUrl;
    } catch (error) {
      console.error("❌ [Avatar] Upload failed:", error);
      toast.error("Failed to upload profile picture");
      return null;
    } finally {
      setUploadingAvatar(false);
    }
  };
  const handleSkipForNow = () => {
    setLoading(true);
    const mockData = getMockProfileData();

    // Mark Stage 0 as completed
    const journeyProgress = JSON.parse(
      localStorage.getItem("founder_journey_progress") || "{}",
    );
    journeyProgress.profileSetup = {
      status: "completed",
      completedAt: new Date().toISOString(),
    };
    localStorage.setItem(
      "founder_journey_progress",
      JSON.stringify(journeyProgress),
    );
    setTimeout(() => {
      if (user && onUpdateUser) {
        const updatedUser = {
          ...user,
          profile: {
            ...user.profile,
            ...mockData,
          },
          onboardingComplete: true,
        };
        onUpdateUser(updatedUser);
      }
      onComplete(mockData);
      setLoading(false);
    }, 500);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 🖼️ Upload avatar first if selected
      let avatarUrl = null;
      if (avatarFile) {
        console.log("🖼️ [ProfileCompletion] Uploading avatar...");
        avatarUrl = await uploadAvatar();
        if (!avatarUrl) {
          toast.error(
            "Failed to upload avatar, but continuing with profile setup",
          );
        }
      }

      // 🎯 ALGORITHMIC STAGE DETERMINATION (Founders only)
      let algorithmicStageId = 1; // Default to Stage 1
      if (role === "founder") {
        // Convert form answers to algorithm format
        const hasValidatedIdeaValue = hasValidatedIdea.includes("Yes")
          ? "yes"
          : "no";
        const hasMVPValue = hasMVP.includes("Yes")
          ? "yes"
          : hasMVP.includes("In progress")
            ? "in-progress"
            : "no";
        const hasCustomersValue = hasCustomers.includes("Paying")
          ? "yes-paying"
          : hasCustomers.includes("Active users")
            ? "yes-users"
            : "no";

        // Convert team size to algorithm format
        let currentTeamSizeValue = "1";
        if (teamSize.includes("2-5")) currentTeamSizeValue = "2-3";
        else if (teamSize.includes("6-10")) currentTeamSizeValue = "6-10";
        else if (teamSize.includes("11-20") || teamSize.includes("21-50"))
          currentTeamSizeValue = "10+";
        else if (teamSize.includes("51-100") || teamSize.includes("100+"))
          currentTeamSizeValue = "10+";
        console.log("🎯 [Onboarding] Stage determination inputs:", {
          hasValidatedIdea: hasValidatedIdeaValue,
          hasMVP: hasMVPValue,
          hasCustomers: hasCustomersValue,
          currentTeamSize: currentTeamSizeValue,
          monthlyRevenue: "none",
        });
        algorithmicStageId = determineInitialStage({
          hasValidatedIdea: hasValidatedIdeaValue,
          hasMVP: hasMVPValue,
          hasCustomers: hasCustomersValue,
          currentTeamSize: currentTeamSizeValue,
          monthlyRevenue: "none", // ProfileCompletionModal doesn't ask for revenue yet
        });
        console.log(
          `🎯 [Onboarding] Determined initial stage: ${algorithmicStageId} - ${getStageName(algorithmicStageId)}`,
        );

        // Set the algorithmically-determined stage
        setCurrentStage(algorithmicStageId);

        // Mark Stage 0 as completed AND set the algorithmically-determined stage
        const journeyProgress = {
          currentStage: algorithmicStageId,
          completedStages: [],
          stageData: {
            [algorithmicStageId]: {
              startedAt: new Date().toISOString(),
              completionPercentage: 0,
              milestonesCompleted: [],
            },
          },
          profileSetup: {
            status: "completed",
            completedAt: new Date().toISOString(),
          },
        };
        localStorage.setItem(
          "journey_progress",
          JSON.stringify(journeyProgress),
        );
        console.log(
          `✅ [ProfileCompletionModal] Set initial stage to ${algorithmicStageId} based on onboarding answers`,
        );
      }
      const profileData =
        role === "founder"
          ? {
              startupName,
              startupDescription,
              industryFocus:
                industryFocus === "Others" ? otherIndustry : industryFocus,
              targetAudience,
              rolesNeeded: rolesNeeded.includes("Others")
                ? [
                    ...rolesNeeded.filter((r) => r !== "Others"),
                    otherRole,
                  ].filter(Boolean)
                : rolesNeeded,
              teamSize,
              bio,
              avatar: avatarUrl,
              // Include avatar URL
              // Store factual answers for future stage progression
              hasValidatedIdea,
              hasMVP,
              hasCustomers,
              onboardingComplete: true,
            }
          : {
              skills,
              experience,
              interests,
              portfolio,
              bio: talentBio,
              avatar: avatarUrl,
              // Include avatar URL
              onboardingComplete: true,
            };

      // Simulate API call
      setTimeout(() => {
        if (user && onUpdateUser) {
          const updatedUser = {
            ...user,
            avatar: avatarUrl || user.avatar,
            // Add avatar to top level
            profile: {
              ...user.profile,
              ...profileData,
            },
            onboardingComplete: true,
          };
          onUpdateUser(updatedUser);
        }

        // Show stage notification for founders
        if (role === "founder") {
          toast.success("🎉 Profile setup complete! Welcome to StartupVerse!", {
            description: `Based on your startup's current state, you're in: ${getStageName(algorithmicStageId)}`,
          });
        }
        onComplete(profileData);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("❌ [ProfileCompletion] Error submitting form:", error);
      toast.error("Failed to complete profile setup");
      setLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/70" />
      <div className="relative bg-background border border-border rounded-xl shadow-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-background border-b border-border p-4 flex items-start justify-between z-10">
          <div className="flex-1">
            <h2 className="text-lg font-bold mb-0.5">Complete Your Profile</h2>
            <p className="text-xs text-muted-foreground">
              {role === "founder"
                ? "Tell us about your startup to get personalized guidance"
                : "Complete your profile to get matched with great startups"}
            </p>
          </div>
        </div>
        {role === "talent" ? (
          <div className="p-6 space-y-6">
            <TalentProfileForm
              loading={loading}
              ref={talentFormRef}
              initialData={{
                name: user?.name,
                email: user?.email,
              }}
              onSubmit={(data) => {
                console.log(
                  "📝 [ProfileCompletion] TalentProfileForm submitted with data:",
                  data,
                );
                if (onUpdateUser && user) {
                  // ✅ FIXED: Flatten the profile data to user-level properties for proper completion calculation
                  const updatedUser = {
                    ...user,
                    // Basic info
                    name: data.fullName || user.name,
                    // Top-level properties for profile completion calculation
                    professionalTitle: data.professionalTitle,
                    location: data.location,
                    bio: data.bio,
                    skills: data.skills || [],
                    linkedin: data.linkedinUrl,
                    github: data.githubUrl,
                    website: data.portfolioWebsite,
                    workExperience: data.workExperiences || [],
                    education: data.educationList || [],
                    certifications: data.certifications || [],
                    portfolioItems: data.portfolioItems || [],
                    availabilityStatus: data.availabilityStatus,
                    preferredCommitment: data.preferredCommitment,
                    yearsOfExperience: data.yearsOfExperience,
                    professionalGoals: data.professionalGoals,
                    industryPreferences: data.industryPreferences || [],
                    // ✅ NEW: Add fields for TeamMatching display
                    experience: data.experience,
                    // For "Experience:" display
                    availability: data.availability,
                    // For "Available:" display
                    interests: data.interests || [],
                    // For "Interested in:" display
                    // Also save to profile for backward compatibility
                    profile: {
                      ...user.profile,
                      ...data,
                    },
                    onboardingComplete: true,
                  };
                  console.log(
                    "🔄 [ProfileCompletion] Calling onUpdateUser with flattened data:",
                    {
                      userId: updatedUser.id,
                      onboardingComplete: updatedUser.onboardingComplete,
                      hasProfile: !!updatedUser.profile,
                      hasProfessionalTitle: !!updatedUser.professionalTitle,
                      hasSkills: updatedUser.skills?.length > 0,
                      hasWorkExperience: updatedUser.workExperience?.length > 0,
                    },
                  );
                  onUpdateUser(updatedUser);
                }
                console.log("✅ [ProfileCompletion] Calling onComplete...");
                onComplete(data);
                console.log(
                  "🚪 [ProfileCompletion] Calling onClose to go to dashboard...",
                );
                onClose();
              }}
            />
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border/70">
              <Button
                type="button"
                variant="outline"
                onClick={handleSkipForNow}
                disabled={loading}
                className="w-full sm:w-auto px-8"
              >
                Skip for now
              </Button>
              <Button
                type="button"
                onClick={() => {
                  console.log(
                    "🔘 [ProfileCompletion] Complete Profile button clicked for talent",
                  );
                  console.log(
                    "📋 [ProfileCompletion] Form ref:",
                    talentFormRef.current,
                  );
                  if (talentFormRef.current) {
                    console.log(
                      "✅ [ProfileCompletion] Requesting form submit...",
                    );
                    talentFormRef.current.requestSubmit();
                  } else {
                    console.error("❌ [ProfileCompletion] Form ref is null!");
                  }
                }}
                disabled={loading}
                className="w-full sm:w-auto px-8"
              >
                {loading ? "Saving..." : "Complete Profile"}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="mb-4">Startup Information</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="startupName">Startup Name *</Label>
                    <Input
                      id="startupName"
                      type="text"
                      placeholder="e.g., TechVenture AI"
                      value={startupName}
                      onChange={(e) => setStartupName(e.target.value)}
                      required={true}
                      disabled={loading}
                      className="border-border/70"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startupDescription">
                      Startup Description *
                    </Label>
                    <Textarea
                      id="startupDescription"
                      placeholder="Describe what your startup does and the problem it solves..."
                      value={startupDescription}
                      onChange={(e) => setStartupDescription(e.target.value)}
                      required={true}
                      disabled={loading}
                      rows={4}
                      className="border-border/70"
                    />
                  </div>
                  <SingleSelectDropdown
                    label="Industry Focus"
                    options={industryOptions}
                    value={industryFocus}
                    onChange={setIndustryFocus}
                    placeholder="Select industry..."
                    disabled={loading}
                    required={true}
                  />
                  {industryFocus === "Others" && (
                    <div className="space-y-2">
                      <Label htmlFor="otherIndustry">
                        Please specify your industry
                      </Label>
                      <Input
                        id="otherIndustry"
                        type="text"
                        placeholder="Enter your industry"
                        value={otherIndustry}
                        onChange={(e) => setOtherIndustry(e.target.value)}
                        required={true}
                        disabled={loading}
                        className="border-border/70"
                      />
                    </div>
                  )}
                  <SingleSelectDropdown
                    label="Do you have a validated problem/idea?"
                    options={[
                      "Yes - Validated with potential customers",
                      "No - Still exploring ideas",
                    ]}
                    value={hasValidatedIdea}
                    onChange={setHasValidatedIdea}
                    placeholder="Select..."
                    disabled={loading}
                    required={true}
                  />
                  <SingleSelectDropdown
                    label="Do you have an MVP or prototype?"
                    options={[
                      "Yes - Working MVP/prototype",
                      "In progress - Currently building",
                      "No - Haven't started building yet",
                    ]}
                    value={hasMVP}
                    onChange={setHasMVP}
                    placeholder="Select..."
                    disabled={loading}
                    required={true}
                  />
                  <SingleSelectDropdown
                    label="Do you have any customers or users?"
                    options={[
                      "Yes - Paying customers",
                      "Yes - Active users (not paying yet)",
                      "No - No customers/users yet",
                    ]}
                    value={hasCustomers}
                    onChange={setHasCustomers}
                    placeholder="Select..."
                    disabled={loading}
                    required={true}
                  />
                  <MultiSelectDropdown
                    label="Target Audience *"
                    options={audienceOptions}
                    selected={targetAudience}
                    onChange={handleTargetAudienceChange}
                    placeholder="Select target audience..."
                    disabled={loading}
                  />
                  <SingleSelectDropdown
                    label="Team Size"
                    options={teamSizeOptions}
                    value={teamSize}
                    onChange={setTeamSize}
                    placeholder="Select team size..."
                    disabled={loading}
                    required={true}
                  />
                </div>
              </div>
              <div>
                <h3 className="mb-4">Team & Background</h3>
                <div className="space-y-4">
                  <MultiSelectDropdown
                    label="Roles Needed"
                    options={rolesOptions}
                    selected={rolesNeeded}
                    onChange={handleRolesNeededChange}
                    placeholder="Select roles you're looking to fill..."
                    disabled={loading}
                  />
                  {rolesNeeded.includes("Others") && (
                    <div className="space-y-2">
                      <Label htmlFor="otherRole">Please specify the role</Label>
                      <Input
                        id="otherRole"
                        type="text"
                        placeholder="Enter the role you need"
                        value={otherRole}
                        onChange={(e) => setOtherRole(e.target.value)}
                        disabled={loading}
                        className="border-border/70"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="bio">Your Bio & Experience</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about your background, expertise, and what drives you..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      disabled={loading}
                      rows={4}
                      className="border-border/70"
                    />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="mb-4">Profile Photo</h3>
                <div className="border-2 border-dashed border-border/70 rounded-lg p-6 text-center">
                  {avatarPreview ? (
                    <div className="space-y-3">
                      <div className="relative inline-block">
                        <img
                          src={avatarPreview}
                          alt="Avatar preview"
                          className="w-24 h-24 rounded-full object-cover mx-auto border-2 border-border"
                        />
                        {uploadingAvatar && (
                          <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {avatarFile?.name}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAvatarFile(null);
                          setAvatarPreview("");
                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                          }
                        }}
                        disabled={loading || uploadingAvatar}
                      >
                        Change Photo
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Upload your profile photo
                      </p>
                      <p className="text-xs text-muted-foreground mb-3">
                        Max size: 5MB • PNG, JPG, GIF
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                        disabled={loading}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                      >
                        Choose File
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border/70">
              <Button
                type="button"
                variant="outline"
                onClick={handleSkipForNow}
                disabled={loading}
                className="w-full sm:w-auto px-8"
              >
                Skip for now
              </Button>
              <Button
                type="submit"
                disabled={loading || uploadingAvatar}
                className="w-full sm:w-auto px-8"
              >
                {uploadingAvatar
                  ? "Uploading Photo..."
                  : loading
                    ? "Saving..."
                    : "Complete Profile"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
