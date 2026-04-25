import React, { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { ChevronDown, ChevronUp } from "lucide-react";
import TalentProfileForm from "./TalentProfileForm";
import {
  determineInitialStage,
  getStageName,
} from "../utils/algorithmicStageDetection";
import {
  applyServerJourneySnapshot,
  configureJourneyUser,
} from "../utils/journeyProgress";
import { syncJourneyProgressToServer } from "../utils/founderJourneyApi.js";
import { toast } from "sonner";
import * as founderApi from "../utils/api/founderApi";
import {
  FOUNDER_INDUSTRY_OPTIONS,
  FOUNDER_TARGET_AUDIENCE_OPTIONS,
  FOUNDER_ROLES_NEEDED_OPTIONS,
  FOUNDER_TEAM_SIZE_OPTIONS,
  resolveIndustryForPersistence,
  validateFounderStartupFields,
} from "../domains/founder/founderProfileConfig";

const industryOptions = FOUNDER_INDUSTRY_OPTIONS;
const audienceOptions = FOUNDER_TARGET_AUDIENCE_OPTIONS;
const rolesOptions = FOUNDER_ROLES_NEEDED_OPTIONS;
const teamSizeOptions = FOUNDER_TEAM_SIZE_OPTIONS;

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

  // Founder form fields
  const [startupName, setStartupName] = useState("");
  const [startupDescription, setStartupDescription] = useState("");
  const [industryFocus, setIndustryFocus] = useState("");
  const [otherIndustry, setOtherIndustry] = useState("");
  const [targetAudience, setTargetAudience] = useState([]);
  const [rolesNeeded, setRolesNeeded] = useState([]);
  const [otherRole, setOtherRole] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [bio, setBio] = useState("");

  // 🎯 Algorithmic Stage Determination - Factual Questions
  const [hasValidatedIdea, setHasValidatedIdea] = useState("");
  const [hasMVP, setHasMVP] = useState("");
  const [hasCustomers, setHasCustomers] = useState("");

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

  const handleSkipForNow = () => {
    if (role === "founder") {
      toast.error("Complete all required fields to continue.");
      return;
    }
    setLoading(true);
    const mockData = getMockProfileData();
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
      const validation = validateFounderStartupFields({
        startupName,
        startupDescription,
        industryFocus,
        otherIndustry,
        teamSize,
        targetAudience,
        hasValidatedIdea,
        hasMVP,
        hasCustomers,
      });
      if (!validation.ok) {
        toast.error(validation.errors[0]);
        setLoading(false);
        return;
      }

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

      let currentTeamSizeValue = "1";
      if (teamSize.includes("2-5")) currentTeamSizeValue = "2-3";
      else if (teamSize.includes("6-10")) currentTeamSizeValue = "6-10";
      else if (teamSize.includes("11-20") || teamSize.includes("21-50"))
        currentTeamSizeValue = "10+";
      else if (teamSize.includes("51-100") || teamSize.includes("100+"))
        currentTeamSizeValue = "10+";

      const algorithmicStageId = determineInitialStage({
        hasValidatedIdea: hasValidatedIdeaValue,
        hasMVP: hasMVPValue,
        hasCustomers: hasCustomersValue,
        currentTeamSize: currentTeamSizeValue,
        monthlyRevenue: "none",
      });

      const founderId = String(user._id ?? user.id);
      const resolvedIndustry = resolveIndustryForPersistence(
        industryFocus,
        otherIndustry,
      );
      const stageLabel = getStageName(algorithmicStageId);

      const startup = await founderApi.upsertFounderStartup({
        founderId,
        name: startupName.trim(),
        description: startupDescription,
        industry: resolvedIndustry,
        stage: stageLabel,
      });
      const startupIdForUser = String(startup._id || startup.id);

      await founderApi.saveFounderProfile({
        userId: String(user._id ?? user.id),
        startupId: startupIdForUser,
        bio: bio || "",
        background: "",
        links: {},
      });

      const journeyForServer = {
        currentStage: algorithmicStageId,
        completedStages: [],
        stageData: {
          [algorithmicStageId]: {
            startedAt: new Date().toISOString(),
            completionPercentage: 0,
            milestonesCompleted: [],
          },
        },
      };
      configureJourneyUser(founderId);
      applyServerJourneySnapshot(journeyForServer);
      try {
        await syncJourneyProgressToServer(founderId);
      } catch (err) {
        console.warn(
          "[ProfileCompletionModal] Initial journey sync failed",
          err,
        );
      }

      const rolesResolved = rolesNeeded.includes("Others")
        ? [...rolesNeeded.filter((r) => r !== "Others"), otherRole].filter(
            Boolean,
          )
        : rolesNeeded;

      const profileData = {
        startupName,
        startupDescription,
        industryFocus:
          industryFocus === "Others" ? otherIndustry : industryFocus,
        industry: resolvedIndustry,
        startupStage: stageLabel,
        targetAudience,
        rolesNeeded: rolesResolved,
        teamSize,
        bio,
        hasValidatedIdea,
        hasMVP,
        hasCustomers,
        ...(industryFocus === "Others"
          ? { otherIndustry: otherIndustry.trim() }
          : {}),
        onboardingComplete: true,
      };

      if (user && onUpdateUser) {
        const updatedUser = {
          ...user,
          startupName,
          startupDescription,
          industry: resolvedIndustry,
          startupStage: stageLabel,
          teamSize,
          bio,
          targetAudience,
          rolesNeeded: rolesResolved,
          hasValidatedIdea,
          hasMVP,
          hasCustomers,
          startupId: startupIdForUser,
          profile: {
            ...user.profile,
            ...profileData,
          },
          onboardingComplete: true,
        };
        onUpdateUser(updatedUser);
      }

      toast.success("🎉 Profile setup complete! Welcome to StartupVerse!", {
        description: `Based on your startup's current state, you're in: ${getStageName(algorithmicStageId)}`,
      });
      onComplete(profileData);
      setLoading(false);
    } catch (error) {
      console.error("❌ [ProfileCompletion] Error submitting form:", error);
      toast.error(error?.message || "Failed to complete profile setup");
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
                    label="Startup type (industry)"
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
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border/70">
              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8"
              >
                {loading ? "Saving..." : "Complete Profile"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
