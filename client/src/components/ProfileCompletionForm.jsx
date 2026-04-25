import React, { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
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
  ORG_ADMIN_PROGRAM_STAGE_OPTIONS,
  resolveIndustryForPersistence,
  validateFounderStartupFields,
} from "../domains/founder/founderProfileConfig";

const industryOptions = FOUNDER_INDUSTRY_OPTIONS;
const audienceOptions = FOUNDER_TARGET_AUDIENCE_OPTIONS;
const rolesOptions = FOUNDER_ROLES_NEEDED_OPTIONS;
const teamSizeOptions = FOUNDER_TEAM_SIZE_OPTIONS;
const startupStagesOptions = ORG_ADMIN_PROGRAM_STAGE_OPTIONS;

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
  const displayValue =
    selected.length > 0
      ? `${selected.length} item${selected.length !== 1 ? "s" : ""} selected`
      : placeholder;
  const isPlaceholder = selected.length === 0;
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
export default function ProfileCompletionForm({
  user,
  role,
  onBack,
  onComplete,
  onUpdateUser,
}) {
  const [loading, setLoading] = useState(false);
  const talentFormRef = useRef(null);
  const isMountedRef = useRef(true);

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

  // Algorithmic Stage Determination - Factual Questions
  const [hasValidatedIdea, setHasValidatedIdea] = useState("");
  const [hasMVP, setHasMVP] = useState("");
  const [hasCustomers, setHasCustomers] = useState("");

  // Organization-admin specific fields
  const [organizationType, setOrganizationType] = useState("");
  const [otherOrgType, setOtherOrgType] = useState("");
  const [expectedCohorts, setExpectedCohorts] = useState("");
  const [expectedStartups, setExpectedStartups] = useState("");
  const [programDuration, setProgramDuration] = useState("");
  const [supportedStages, setSupportedStages] = useState([]);
  const [supportedIndustries, setSupportedIndustries] = useState([]);

  // Organization type options
  const organizationTypeOptions = [
    "Accelerator",
    "Incubator",
    "Startup Competition",
    "University Program",
    "Corporate Innovation Lab",
    "Government/Public Sector Program",
    "VC Fund with Programs",
    "Angel Network",
    "Nonprofit Startup Support",
    "Coworking Space with Programs",
    "Others",
  ];

  // Expected cohorts options
  const expectedCohortsOptions = [
    "1-2 cohorts per year",
    "3-4 cohorts per year",
    "5+ cohorts per year",
    "Rolling admissions (ongoing)",
    "One-time program",
  ];

  // Expected startups options
  const expectedStartupsOptions = [
    "1-10 startups",
    "11-25 startups",
    "26-50 startups",
    "51-100 startups",
    "100+ startups",
  ];

  // Program duration options
  const programDurationOptions = [
    "1-3 months",
    "4-6 months",
    "7-12 months",
    "12+ months",
    "Ongoing/No fixed duration",
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
  const handleSupportedStagesChange = (stage) => {
    setSupportedStages((prev) =>
      prev.includes(stage) ? prev.filter((s) => s !== stage) : [...prev, stage],
    );
  };
  const handleSupportedIndustriesChange = (industry) => {
    setSupportedIndustries((prev) =>
      prev.includes(industry)
        ? prev.filter((i) => i !== industry)
        : [...prev, industry],
    );
  };

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
    }
    if (!isMountedRef.current) return;

    // For talent, trigger the TalentProfileForm's submit
    if (role === "talent" && talentFormRef.current) {
      talentFormRef.current.triggerSubmit();
      return;
    }

    // For founder and organization-admin, handle here
    if (!isMountedRef.current) return;
    setLoading(true);
    try {
      const avatarUrl = null;

      let algorithmicStageId = 1;
      let startupIdForUser = user?.startupId;

      if (role === "founder") {
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
          if (isMountedRef.current) setLoading(false);
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

        algorithmicStageId = determineInitialStage({
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
        startupIdForUser = String(startup._id || startup.id);

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
            "[ProfileCompletionForm] Initial journey sync failed",
            err,
          );
        }
      }

      const resolvedFounderIndustry =
        role === "founder"
          ? resolveIndustryForPersistence(industryFocus, otherIndustry)
          : "";

      const profileData = {
        role,
        ...(role === "founder"
          ? {
              startupName,
              startupDescription,
              industryFocus:
                industryFocus === "Others" ? otherIndustry : industryFocus,
              industry: resolvedFounderIndustry,
              startupStage: getStageName(algorithmicStageId),
              targetAudience,
              rolesNeeded: rolesNeeded.includes("Others")
                ? [...rolesNeeded.filter((r) => r !== "Others"), otherRole]
                : rolesNeeded,
              teamSize,
              bio,
              hasValidatedIdea,
              hasMVP,
              hasCustomers,
              ...(industryFocus === "Others"
                ? { otherIndustry: otherIndustry.trim() }
                : {}),
            }
          : {
              organizationName: startupName,
              organizationDescription: startupDescription,
              organizationType:
                organizationType === "Others" ? otherOrgType : organizationType,
              expectedCohorts,
              expectedStartups,
              programDuration,
              supportedStages,
              supportedIndustries,
              teamSize,
            }),
        avatarUrl,
        onboardingComplete: true,
      };

      if (!isMountedRef.current) return;

      if (user && onUpdateUser) {
        const updatedUser = {
          ...user,
          ...(role === "founder"
            ? {
                startupName,
                startupDescription,
                industry: resolvedFounderIndustry,
                startupStage: getStageName(algorithmicStageId),
                teamSize,
                bio,
                targetAudience: profileData.targetAudience,
                rolesNeeded: profileData.rolesNeeded,
                hasValidatedIdea,
                hasMVP,
                hasCustomers,
                startupId: startupIdForUser,
              }
            : {}),
          profile: {
            ...user.profile,
            ...profileData,
          },
          onboardingComplete: true,
        };
        onUpdateUser(updatedUser);
      }

      if (role === "founder" && isMountedRef.current) {
        toast.success("🎉 Profile setup complete! Welcome to StartupVerse!", {
          description: `Based on your startup's current state, you're in: ${getStageName(algorithmicStageId)}`,
        });
        const urlParams = new URLSearchParams(window.location.search);
        const challengeCohort = urlParams.get("challenge");
        if (challengeCohort === "cohort1" && user) {
          toast.success(
            "🏆 You're in! Welcome to the 12-Week Execution Challenge",
            {
              description:
                "Your execution journey starts now. Complete your first weekly outcome!",
            },
          );
        }
      } else if (role === "organization-admin" && isMountedRef.current) {
        toast.success(
          "🎉 Organization setup complete! Welcome to StartupVerse!",
          {
            description:
              "You can now create cohorts and invite startups to your program",
          },
        );
      }

      if (isMountedRef.current) {
        onComplete(profileData);
        setLoading(false);
      }
    } catch (error) {
      if (!isMountedRef.current) return;
      console.error("❌ [ProfileCompletion] Error submitting form:", error);
      toast.error(
        error?.message || "Failed to complete profile setup",
      );
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };
  return (
    <div className="w-full animate-in fade-in slide-in-from-right duration-300">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="mb-4 h-8 px-3 text-xs"
        disabled={loading}
      >
        <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
        Back
      </Button>
      <Card className="w-full shadow-none border-none bg-transparent">
        <CardHeader className="border-b border-border p-4">
          <CardTitle className="text-lg">Complete Your Profile</CardTitle>
          <CardDescription className="text-xs">
            {role === "founder"
              ? "Tell us about your startup to get personalized guidance"
              : role === "talent"
                ? "Complete your profile to get matched with great startups"
                : "Set up your organization profile"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {role === "talent" ? (
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
                  const updatedUser = {
                    ...user,
                    name: data.fullName || user.name,
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
                    experience: data.experience,
                    availability: data.availability,
                    interests: data.interests || [],
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
                  "✅ [ProfileCompletion] Talent profile submission complete",
                );
              }}
            />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="mb-4 text-sm font-semibold">
                    {role === "founder"
                      ? "Startup Information"
                      : "Organization Information"}
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="startupName">
                        {role === "founder"
                          ? "Startup Name"
                          : "Organization Name"}
                        {" *"}
                      </Label>
                      <Input
                        id="startupName"
                        type="text"
                        placeholder={
                          role === "founder"
                            ? "e.g., TechVenture AI"
                            : "e.g., StartupAccelerator Inc."
                        }
                        value={startupName}
                        onChange={(e) => setStartupName(e.target.value)}
                        required={true}
                        disabled={loading}
                        className="border-border/70"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="startupDescription">
                        {role === "founder"
                          ? "Startup Description"
                          : "Organization Description"}
                        {" *"}
                      </Label>
                      <Textarea
                        id="startupDescription"
                        placeholder={
                          role === "founder"
                            ? "Describe what your startup does and the problem it solves..."
                            : "Describe your organization and what programs you offer..."
                        }
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
                    {role === "founder" && (
                      <>
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
                      </>
                    )}
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
                {role === "founder" && (
                  <div>
                    <h3 className="mb-4 text-sm font-semibold">
                      Team & Background
                    </h3>
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
                          <Label htmlFor="otherRole">
                            Please specify the role
                          </Label>
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
                )}
                {role === "organization-admin" && (
                  <div>
                    <h3 className="mb-4 text-sm font-semibold">
                      Organization Details
                    </h3>
                    <div className="space-y-4">
                      <SingleSelectDropdown
                        label="Organization Type"
                        options={organizationTypeOptions}
                        value={organizationType}
                        onChange={setOrganizationType}
                        placeholder="Select organization type..."
                        disabled={loading}
                        required={true}
                      />
                      {organizationType === "Others" && (
                        <div className="space-y-2">
                          <Label htmlFor="otherOrgType">
                            Please specify the organization type
                          </Label>
                          <Input
                            id="otherOrgType"
                            type="text"
                            placeholder="Enter the organization type"
                            value={otherOrgType}
                            onChange={(e) => setOtherOrgType(e.target.value)}
                            disabled={loading}
                            className="border-border/70"
                          />
                        </div>
                      )}
                      <SingleSelectDropdown
                        label="Expected Cohorts"
                        options={expectedCohortsOptions}
                        value={expectedCohorts}
                        onChange={setExpectedCohorts}
                        placeholder="Select expected cohorts..."
                        disabled={loading}
                        required={true}
                      />
                      <SingleSelectDropdown
                        label="Expected Startups"
                        options={expectedStartupsOptions}
                        value={expectedStartups}
                        onChange={setExpectedStartups}
                        placeholder="Select expected startups..."
                        disabled={loading}
                        required={true}
                      />
                      <SingleSelectDropdown
                        label="Program Duration"
                        options={programDurationOptions}
                        value={programDuration}
                        onChange={setProgramDuration}
                        placeholder="Select program duration..."
                        disabled={loading}
                        required={true}
                      />
                      <MultiSelectDropdown
                        label="Supported Stages"
                        options={startupStagesOptions}
                        selected={supportedStages}
                        onChange={handleSupportedStagesChange}
                        placeholder="Select supported stages..."
                        disabled={loading}
                      />
                      <MultiSelectDropdown
                        label="Supported Industries"
                        options={industryOptions}
                        selected={supportedIndustries}
                        onChange={handleSupportedIndustriesChange}
                        placeholder="Select supported industries..."
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border/70">
                <Button type="submit" disabled={loading} className="px-8">
                  {loading ? "Saving..." : "Complete Profile"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
