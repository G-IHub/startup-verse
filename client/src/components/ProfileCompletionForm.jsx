import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { ArrowLeft, ChevronDown, Rocket, Building, Users } from "lucide-react";
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
import { persistedTalentToFormInitialData } from "../utils/talentProfileCompletion";
import {
  AuthFormCard,
  AuthField,
  AuthSplitLayout,
  authBtnOutline,
  authBtnPrimary,
  authFieldClass,
  getOnboardingRoleContent,
} from "./auth/AuthPrimitives";
import { SettingsGroup } from "./settings/SettingsPrimitives";
import { cn } from "./ui/utils";

const dropdownTriggerClass = cn(
  authFieldClass,
  "flex w-full items-center justify-between px-3 text-left disabled:opacity-50",
);
const dropdownMenuClass =
  "fixed z-[10000] overflow-y-auto overflow-x-hidden rounded-input border border-surface-border bg-surface-card font-body text-text-body shadow-soft";
const dropdownItemClass =
  "flex w-full px-3 py-2.5 text-left text-xs leading-snug whitespace-normal break-words transition-colors hover:bg-surface-page";
const industryOptions = FOUNDER_INDUSTRY_OPTIONS;
const audienceOptions = FOUNDER_TARGET_AUDIENCE_OPTIONS;
const rolesOptions = FOUNDER_ROLES_NEEDED_OPTIONS;
const teamSizeOptions = FOUNDER_TEAM_SIZE_OPTIONS;
const startupStagesOptions = ORG_ADMIN_PROGRAM_STAGE_OPTIONS;

/** Panel width from trigger + longest option; opaque surface scrolls as one block */
function computeMenuPanelBox(buttonRect, optionStrings, gap = 4, pad = 12) {
  const r = buttonRect;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const maxPanelWidth = Math.max(260, vw - pad * 2);
  const triggerW = Math.max(r.width, 160);
  let longest = 0;
  for (let i = 0; i < optionStrings.length; i++) {
    const len = String(optionStrings[i]).length;
    if (len > longest) longest = len;
  }
  const estFromText = Math.min(longest * 7 + 56, maxPanelWidth);
  const menuWidth = Math.min(Math.max(triggerW, estFromText), maxPanelWidth);
  let left = r.left;
  if (left + menuWidth > vw - pad) {
    left = Math.max(pad, vw - pad - menuWidth);
  }
  if (left < pad) left = pad;
  const availBelow = vh - r.bottom - gap - pad;
  const maxHeight = Math.min(360, Math.max(160, availBelow));
  return {
    top: r.bottom + gap,
    left,
    width: menuWidth,
    maxHeight,
  };
}

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
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const [menuBox, setMenuBox] = useState(null);

  const layoutMenu = useCallback(() => {
    if (!isOpen || !buttonRef.current) {
      setMenuBox(null);
      return;
    }
    const r = buttonRef.current.getBoundingClientRect();
    setMenuBox(computeMenuPanelBox(r, options));
  }, [isOpen, options]);

  useLayoutEffect(() => {
    if (!isOpen) setMenuBox(null);
    else layoutMenu();
  }, [isOpen, layoutMenu]);

  useEffect(() => {
    if (!isOpen) return undefined;
    layoutMenu();
    window.addEventListener("resize", layoutMenu);
    window.addEventListener("scroll", layoutMenu, true);
    return () => {
      window.removeEventListener("resize", layoutMenu);
      window.removeEventListener("scroll", layoutMenu, true);
    };
  }, [isOpen, layoutMenu]);

  useEffect(() => {
    function handleClickOutside(event) {
      const t = event.target;
      if (
        dropdownRef.current?.contains(t) ||
        menuRef.current?.contains(t)
      ) {
        return;
      }
      setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayValue = value || placeholder;
  const isPlaceholder = !value;

  const menuPortal =
    isOpen &&
    menuBox &&
    createPortal(
      <div
        ref={menuRef}
        className={dropdownMenuClass}
        style={{
          top: menuBox.top,
          left: menuBox.left,
          width: menuBox.width,
          maxHeight: menuBox.maxHeight,
        }}
      >
        {options.map((option) => (
          <button
            type="button"
            key={option}
            onClick={() => {
              onChange(option);
              setIsOpen(false);
            }}
            className={cn(
              dropdownItemClass,
              value === option ? "bg-surface-page font-medium" : "",
            )}
          >
            {option}
          </button>
        ))}
      </div>,
      document.body,
    );

  const fieldId = `select-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <AuthField
      id={fieldId}
      label={`${label}${required ? " *" : ""}`}
    >
      <div ref={dropdownRef} className="relative">
        <button
          ref={buttonRef}
          type="button"
          id={fieldId}
          onClick={() => {
            if (disabled) return;
            setIsOpen(!isOpen);
          }}
          disabled={disabled}
          className={dropdownTriggerClass}
        >
          <span
            className={cn(
              "truncate text-sm",
              isPlaceholder ? "text-text-muted" : "text-text-body",
            )}
          >
            {displayValue}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-text-muted transition-transform",
              isOpen ? "rotate-180" : "",
            )}
          />
        </button>
      </div>
      {menuPortal}
    </AuthField>
  );
}

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
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const [menuBox, setMenuBox] = useState(null);

  const layoutMenu = useCallback(() => {
    if (!isOpen || !buttonRef.current) {
      setMenuBox(null);
      return;
    }
    const r = buttonRef.current.getBoundingClientRect();
    setMenuBox(computeMenuPanelBox(r, options));
  }, [isOpen, options]);

  useLayoutEffect(() => {
    if (!isOpen) setMenuBox(null);
    else layoutMenu();
  }, [isOpen, layoutMenu]);

  useEffect(() => {
    if (!isOpen) return undefined;
    layoutMenu();
    window.addEventListener("resize", layoutMenu);
    window.addEventListener("scroll", layoutMenu, true);
    return () => {
      window.removeEventListener("resize", layoutMenu);
      window.removeEventListener("scroll", layoutMenu, true);
    };
  }, [isOpen, layoutMenu]);

  useEffect(() => {
    function handleClickOutside(event) {
      const t = event.target;
      if (
        dropdownRef.current?.contains(t) ||
        menuRef.current?.contains(t)
      ) {
        return;
      }
      setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayValue =
    selected.length > 0
      ? `${selected.length} item${selected.length !== 1 ? "s" : ""} selected`
      : placeholder;
  const isPlaceholder = selected.length === 0;

  const menuPortal =
    isOpen &&
    menuBox &&
    createPortal(
      <div
        ref={menuRef}
        className={dropdownMenuClass}
        style={{
          top: menuBox.top,
          left: menuBox.left,
          width: menuBox.width,
          maxHeight: menuBox.maxHeight,
        }}
      >
        {options.map((option) => (
          <label
            key={option}
            className={cn(
              dropdownItemClass,
              "cursor-pointer items-start gap-2",
            )}
          >
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => onChange(option)}
              className="mt-0.5 h-4 w-4 shrink-0"
            />
            <span className="min-w-0 flex-1 whitespace-normal break-words">
              {option}
            </span>
          </label>
        ))}
      </div>,
      document.body,
    );

  const fieldId = `multi-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <AuthField id={fieldId} label={label}>
      <div ref={dropdownRef} className="relative">
        <button
          ref={buttonRef}
          type="button"
          id={fieldId}
          onClick={() => {
            if (disabled) return;
            setIsOpen(!isOpen);
          }}
          disabled={disabled}
          className={dropdownTriggerClass}
        >
          <span
            className={cn(
              "truncate text-sm",
              isPlaceholder ? "text-text-muted" : "text-text-body",
            )}
          >
            {displayValue}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-text-muted transition-transform",
              isOpen ? "rotate-180" : "",
            )}
          />
        </button>
      </div>
      {selected.length > 0 ? (
        <p className="text-xs text-text-muted">
          {selected.length}
          {" item"}
          {selected.length !== 1 ? "s" : ""}
          {" selected"}
        </p>
      ) : null}
      {menuPortal}
    </AuthField>
  );
}
export default function ProfileCompletionForm({
  user,
  role,
  onBack,
  onComplete,
  onUpdateUser,
  variant = "inline",
  showBack = true,
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
  const isPage = variant === "page";
  const shouldShowBack = showBack && typeof onBack === "function";
  const onboardingContent = getOnboardingRoleContent(role);
  const RoleIcon = onboardingContent.icon;

  const formContent = (
    <div
      className={
        isPage
          ? "w-full"
          : "w-full animate-in fade-in slide-in-from-right duration-300"
      }
    >
      {shouldShowBack ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className={`mb-4 h-8 px-3 text-xs ${authBtnOutline}`}
          disabled={loading}
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Back
        </Button>
      ) : null}
      <AuthFormCard
        icon={RoleIcon}
        title="Complete Your Profile"
        description={onboardingContent.description}
        className={isPage ? "max-w-none" : undefined}
      >
          {role === "talent" ? (
            <TalentProfileForm
              loading={loading}
              ref={talentFormRef}
              initialData={persistedTalentToFormInitialData(user)}
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
            <form onSubmit={handleSubmit} className="space-y-5">
              <SettingsGroup
                title={
                  role === "founder"
                    ? "Startup Information"
                    : "Organization Information"
                }
                icon={role === "founder" ? Rocket : Building}
              >
                <AuthField
                  id="startupName"
                  label={
                    role === "founder" ? "Startup Name *" : "Organization Name *"
                  }
                >
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
                    className={authFieldClass}
                  />
                </AuthField>
                <AuthField
                  id="startupDescription"
                  label={
                    role === "founder"
                      ? "Startup Description *"
                      : "Organization Description *"
                  }
                >
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
                    className={cn(authFieldClass, "min-h-[100px] py-2")}
                  />
                </AuthField>
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
                      <AuthField id="otherIndustry" label="Please specify your industry *">
                        <Input
                          id="otherIndustry"
                          type="text"
                          placeholder="Enter your industry"
                          value={otherIndustry}
                          onChange={(e) => setOtherIndustry(e.target.value)}
                          required={true}
                          disabled={loading}
                          className={authFieldClass}
                        />
                      </AuthField>
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
              </SettingsGroup>
              {role === "founder" && (
                <SettingsGroup title="Team & Background" icon={Users}>
                      <MultiSelectDropdown
                        label="Roles Needed"
                        options={rolesOptions}
                        selected={rolesNeeded}
                        onChange={handleRolesNeededChange}
                        placeholder="Select roles you're looking to fill..."
                        disabled={loading}
                      />
                      {rolesNeeded.includes("Others") && (
                        <AuthField id="otherRole" label="Please specify the role">
                          <Input
                            id="otherRole"
                            type="text"
                            placeholder="Enter the role you need"
                            value={otherRole}
                            onChange={(e) => setOtherRole(e.target.value)}
                            disabled={loading}
                            className={authFieldClass}
                          />
                        </AuthField>
                      )}
                      <AuthField id="bio" label="Your Bio & Experience">
                        <Textarea
                          id="bio"
                          placeholder="Tell us about your background, expertise, and what drives you..."
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          disabled={loading}
                          rows={4}
                          className={cn(authFieldClass, "min-h-[100px] py-2")}
                        />
                      </AuthField>
                </SettingsGroup>
              )}
              {role === "organization-admin" && (
                <SettingsGroup title="Organization Details" icon={Building}>
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
                        <AuthField
                          id="otherOrgType"
                          label="Please specify the organization type"
                        >
                          <Input
                            id="otherOrgType"
                            type="text"
                            placeholder="Enter the organization type"
                            value={otherOrgType}
                            onChange={(e) => setOtherOrgType(e.target.value)}
                            disabled={loading}
                            className={authFieldClass}
                          />
                        </AuthField>
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
                </SettingsGroup>
              )}
              <div className="border-t border-surface-border/60 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className={cn("w-full", authBtnPrimary)}
                >
                  {loading ? "Saving..." : "Complete Profile"}
                </Button>
              </div>
            </form>
          )}
      </AuthFormCard>
    </div>
  );

  if (isPage) {
    return (
      <AuthSplitLayout
        marketingBreakpoint="lg"
        formClassName="items-start overflow-y-auto py-8 md:py-10"
      >
        <div className="w-full max-w-lg">{formContent}</div>
      </AuthSplitLayout>
    );
  }

  return formContent;
}
