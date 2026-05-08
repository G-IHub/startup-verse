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
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { cn } from "./ui/utils";
import { ChevronDown } from "lucide-react";
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
import { persistedTalentToFormInitialData } from "../utils/talentProfileCompletion";

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

const industryOptions = FOUNDER_INDUSTRY_OPTIONS;
const audienceOptions = FOUNDER_TARGET_AUDIENCE_OPTIONS;
const rolesOptions = FOUNDER_ROLES_NEEDED_OPTIONS;
const teamSizeOptions = FOUNDER_TEAM_SIZE_OPTIONS;

// Single-select dropdown — menu rendered in a portal so it is not clipped or
// composited incorrectly inside the modal scroll region (fixes overlapping text).
function SingleSelectDropdown({
  label,
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  /** When set (e.g. modal shell), menus portal here so they stack above in-modal scroll layers */
  portalContainer = null,
  onboardingSurface = false,
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

  const portalMountTarget =
    portalContainer ??
    (typeof document !== "undefined" ? document.body : null);

  const menuPortal =
    isOpen &&
    menuBox &&
    portalMountTarget &&
    createPortal(
      <div
        ref={menuRef}
        className={cn(
          "fixed z-[10000] overflow-y-auto overflow-x-hidden text-popover-foreground",
          onboardingSurface
            ? "rounded-[10px] border border-surface-border shadow-soft"
            : "rounded-md border border-border",
        )}
        style={{
          top: menuBox.top,
          left: menuBox.left,
          width: menuBox.width,
          maxHeight: menuBox.maxHeight,
          backgroundColor: "var(--popover)",
          boxShadow: onboardingSurface ? undefined : "var(--elevation-3)",
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
              "flex w-full px-3 py-2.5 text-left text-xs leading-snug whitespace-normal break-words hover:bg-muted",
              onboardingSurface
                ? "transition-colors duration-200 ease-in-out"
                : "transition-colors",
              value === option ? "bg-muted" : "",
            )}
          >
            {option}
          </button>
        ))}
      </div>,
      portalMountTarget,
    );

  return (
    <div className="space-y-2">
      <Label
        className={
          onboardingSurface
            ? "font-body font-medium text-[13px] text-text-heading"
            : undefined
        }
      >
        {label}
        {required &&
          (onboardingSurface ? (
            <>
              {" "}
              <span className="text-status-error">*</span>
            </>
          ) : (
            <>
              {" "}
              *
            </>
          ))}
      </Label>
      <div ref={dropdownRef} className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => {
            if (disabled) return;
            setIsOpen(!isOpen);
          }}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between px-3 text-left outline-none disabled:opacity-50",
            onboardingSurface
              ? "rounded-[10px] border-[1.5px] border-surface-border bg-white font-body text-sm transition-all duration-200 ease-in-out focus-visible:border-primary focus-visible:shadow-focus focus-visible:ring-0"
              : "rounded-md border border-border/70 bg-background text-foreground",
          )}
        >
          <span
            className={cn(
              "truncate",
              onboardingSurface
                ? isPlaceholder
                  ? "text-sm text-text-muted"
                  : "text-sm text-text-heading"
                : isPlaceholder
                  ? "text-xs text-muted-foreground"
                  : "text-xs",
            )}
          >
            {displayValue}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 transition-transform duration-200 ease-in-out",
              onboardingSurface && "text-text-body",
              isOpen && "rotate-180",
            )}
          />
        </button>
      </div>
      {menuPortal}
    </div>
  );
}

function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
  placeholder,
  disabled = false,
  portalContainer = null,
  onboardingSurface = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const [menuBox, setMenuBox] = useState(null);

  const labelEndsWithStar =
    onboardingSurface && /\*\s*$/.test(label.trimEnd());
  const labelDisplay = labelEndsWithStar
    ? label.replace(/\s*\*\s*$/, "").trimEnd()
    : label;

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

  const portalMountTarget =
    portalContainer ??
    (typeof document !== "undefined" ? document.body : null);

  const menuPortal =
    isOpen &&
    menuBox &&
    portalMountTarget &&
    createPortal(
      <div
        ref={menuRef}
        className={cn(
          "fixed z-[10000] overflow-y-auto overflow-x-hidden text-popover-foreground",
          onboardingSurface
            ? "rounded-[10px] border border-surface-border shadow-soft"
            : "rounded-md border border-border",
        )}
        style={{
          top: menuBox.top,
          left: menuBox.left,
          width: menuBox.width,
          maxHeight: menuBox.maxHeight,
          backgroundColor: "var(--popover)",
          boxShadow: onboardingSurface ? undefined : "var(--elevation-3)",
        }}
      >
        {options.map((option) => (
          <label
            key={option}
            className={cn(
              "flex cursor-pointer items-start gap-2 px-3 py-2.5 text-xs leading-snug hover:bg-muted",
              onboardingSurface && "transition-colors duration-200 ease-in-out",
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
      portalMountTarget,
    );

  return (
    <div className="space-y-2">
      <Label
        className={
          onboardingSurface
            ? "font-body font-medium text-[13px] text-text-heading"
            : undefined
        }
      >
        {labelDisplay}
        {labelEndsWithStar && (
          <>
            {" "}
            <span className="text-status-error">*</span>
          </>
        )}
      </Label>
      <div ref={dropdownRef} className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => {
            if (disabled) return;
            setIsOpen(!isOpen);
          }}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between px-3 text-left outline-none disabled:opacity-50",
            onboardingSurface
              ? "rounded-[10px] border-[1.5px] border-surface-border bg-white font-body text-sm transition-all duration-200 ease-in-out focus-visible:border-primary focus-visible:shadow-focus focus-visible:ring-0"
              : "rounded-md border border-border/70 bg-background text-foreground",
          )}
        >
          <span
            className={cn(
              "truncate",
              onboardingSurface
                ? selected.length > 0
                  ? "text-sm text-text-heading"
                  : "text-sm text-text-muted"
                : selected.length > 0
                  ? "text-sm"
                  : "text-xs text-muted-foreground",
            )}
          >
            {selected.length > 0
              ? `${selected.length} selected: ${selected.slice(0, 2).join(", ")}${selected.length > 2 ? "..." : ""}`
              : placeholder}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 transition-transform duration-200 ease-in-out",
              onboardingSurface && "text-text-body",
              isOpen && "rotate-180",
            )}
          />
        </button>
      </div>
      {selected.length > 0 && (
        <p
          className={
            onboardingSurface
              ? "font-body text-xs text-text-muted"
              : "text-xs text-muted-foreground"
          }
        >
          {selected.length}
          {" item"}
          {selected.length !== 1 ? "s" : ""}
          {" selected"}
        </p>
      )}
      {menuPortal}
    </div>
  );
}
export default function ProfileCompletionModal({
  role,
  onComplete,
  onClose,
  user,
  onUpdateUser,
  /** `"page"` = dedicated full-screen onboarding route; `"overlay"` = centered modal shell */
  variant = "overlay",
}) {
  const [loading, setLoading] = useState(false);

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
  const [dropdownPortalHost, setDropdownPortalHost] = useState(null);

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
  const isPage = variant === "page";
  const pageShellBackgroundStyle = isPage
    ? {
        background:
          "radial-gradient(ellipse at 60% 10%, rgba(58,90,254,0.07) 0%, transparent 60%), radial-gradient(ellipse at 10% 80%, rgba(124,77,255,0.05) 0%, transparent 50%), #f4f5ff",
      }
    : undefined;

  const onboardingControlClass = isPage
    ? "rounded-[10px] border-[1.5px] border-surface-border bg-white font-body text-sm text-text-heading placeholder:text-text-muted placeholder:text-sm transition-all duration-200 ease-in-out outline-none focus-visible:ring-0 focus-visible:border-primary focus-visible:shadow-focus"
    : undefined;

  const onboardingLabelClass = "font-body font-medium text-[13px] text-text-heading";

  return (
    <div
      ref={(el) => {
        setDropdownPortalHost((prev) => (prev === el ? prev : el));
      }}
      style={pageShellBackgroundStyle}
      className={
        isPage
          ? "min-h-screen"
          : "fixed inset-0 z-50 flex items-start justify-center p-4 sm:pt-8"
      }
    >
      {!isPage ? <div className="absolute inset-0 sv-modal-backdrop" /> : null}
      <div
        className={
          isPage
            ? "mx-auto w-full max-w-2xl px-4 py-8 pb-16 sm:py-12"
            : "relative flex w-full max-w-xl flex-col"
        }
      >
        <div
          className={
            isPage
              ? "flex flex-col overflow-visible rounded-[20px] border-0 bg-white shadow-[0_4px_32px_rgba(58,90,254,0.10)]"
              : "sv-modal-panel relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-[16px] border-0 shadow-modal"
          }
        >
          <div
            className={cn(
              "flex shrink-0 items-start justify-between border-b bg-white p-4 sm:p-5",
              isPage
                ? "rounded-t-[20px] border-surface-border"
                : "border-[#e2e4f0]",
            )}
          >
            <div className="flex-1">
              <h2
                className={
                  isPage
                    ? "font-heading mb-0.5 text-2xl font-extrabold text-text-heading"
                    : "font-heading mb-0.5 text-lg font-bold text-[#0d0d0d]"
                }
              >
                Complete Your Profile
              </h2>
              <p
                className={
                  isPage
                    ? "font-body text-sm font-normal text-text-body"
                    : "text-xs text-muted-foreground"
                }
              >
                {role === "founder"
                  ? "Tell us about your startup to get personalized guidance"
                  : "Complete your profile to get matched with great startups"}
              </p>
            </div>
          </div>
          <div
            className={
              isPage
                ? "overflow-visible"
                : "flex-1 min-h-0 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]"
            }
          >
        {role === "talent" ? (
          <div className="px-6 pb-8 pt-4 sm:pb-10">
            <TalentProfileForm
              loading={loading}
              initialData={persistedTalentToFormInitialData(user)}
              onSkip={handleSkipForNow}
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
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-6 p-6 pb-10 sm:pb-12"
          >
            <div className="space-y-4">
              <div>
                <h3
                  className={
                    isPage
                      ? "mb-4 border-l-[3px] border-primary pl-[10px] font-heading text-base font-bold text-text-heading"
                      : "mb-4"
                  }
                >
                  Startup Information
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="startupName"
                      className={isPage ? onboardingLabelClass : undefined}
                    >
                      Startup Name
                      {isPage ? (
                        <>
                          {" "}
                          <span className="text-status-error">*</span>
                        </>
                      ) : (
                        " *"
                      )}
                    </Label>
                    <Input
                      id="startupName"
                      type="text"
                      placeholder="e.g., TechVenture AI"
                      value={startupName}
                      onChange={(e) => setStartupName(e.target.value)}
                      required={true}
                      disabled={loading}
                      className={
                        isPage
                          ? onboardingControlClass
                          : "border-border/70"
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="startupDescription"
                      className={isPage ? onboardingLabelClass : undefined}
                    >
                      Startup Description
                      {isPage ? (
                        <>
                          {" "}
                          <span className="text-status-error">*</span>
                        </>
                      ) : (
                        " *"
                      )}
                    </Label>
                    <Textarea
                      id="startupDescription"
                      placeholder="Describe what your startup does and the problem it solves..."
                      value={startupDescription}
                      onChange={(e) => setStartupDescription(e.target.value)}
                      required={true}
                      disabled={loading}
                      rows={4}
                      className={
                        isPage
                          ? onboardingControlClass
                          : "border-border/70"
                      }
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
                    portalContainer={dropdownPortalHost}
                    onboardingSurface={isPage}
                  />
                  {industryFocus === "Others" && (
                    <div className="space-y-2">
                      <Label
                        htmlFor="otherIndustry"
                        className={isPage ? onboardingLabelClass : undefined}
                      >
                        Please specify your industry
                        {isPage ? (
                          <>
                            {" "}
                            <span className="text-status-error">*</span>
                          </>
                        ) : null}
                      </Label>
                      <Input
                        id="otherIndustry"
                        type="text"
                        placeholder="Enter your industry"
                        value={otherIndustry}
                        onChange={(e) => setOtherIndustry(e.target.value)}
                        required={true}
                        disabled={loading}
                        className={
                          isPage
                            ? onboardingControlClass
                            : "border-border/70"
                        }
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
                    portalContainer={dropdownPortalHost}
                    onboardingSurface={isPage}
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
                    portalContainer={dropdownPortalHost}
                    onboardingSurface={isPage}
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
                    portalContainer={dropdownPortalHost}
                    onboardingSurface={isPage}
                  />
                  <MultiSelectDropdown
                    label="Target Audience *"
                    options={audienceOptions}
                    selected={targetAudience}
                    onChange={handleTargetAudienceChange}
                    placeholder="Select target audience..."
                    disabled={loading}
                    portalContainer={dropdownPortalHost}
                    onboardingSurface={isPage}
                  />
                  <SingleSelectDropdown
                    label="Team Size"
                    options={teamSizeOptions}
                    value={teamSize}
                    onChange={setTeamSize}
                    placeholder="Select team size..."
                    disabled={loading}
                    required={true}
                    portalContainer={dropdownPortalHost}
                    onboardingSurface={isPage}
                  />
                </div>
              </div>
              <div
                className={
                  isPage ? "border-t border-surface-border pt-6" : undefined
                }
              >
                <h3
                  className={
                    isPage
                      ? "mb-4 border-l-[3px] border-primary pl-[10px] font-heading text-base font-bold text-text-heading"
                      : "mb-4"
                  }
                >
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
                    portalContainer={dropdownPortalHost}
                    onboardingSurface={isPage}
                  />
                  {rolesNeeded.includes("Others") && (
                    <div className="space-y-2">
                      <Label
                        htmlFor="otherRole"
                        className={isPage ? onboardingLabelClass : undefined}
                      >
                        Please specify the role
                      </Label>
                      <Input
                        id="otherRole"
                        type="text"
                        placeholder="Enter the role you need"
                        value={otherRole}
                        onChange={(e) => setOtherRole(e.target.value)}
                        disabled={loading}
                        className={
                          isPage
                            ? onboardingControlClass
                            : "border-border/70"
                        }
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label
                      htmlFor="bio"
                      className={isPage ? onboardingLabelClass : undefined}
                    >
                      Your Bio & Experience
                    </Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about your background, expertise, and what drives you..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      disabled={loading}
                      rows={4}
                      className={
                        isPage
                          ? onboardingControlClass
                          : "border-border/70"
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
            <div
              className={cn(
                "flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end",
                isPage
                  ? "border-t border-surface-border"
                  : "border-t border-border/70",
              )}
            >
              <Button
                type="submit"
                disabled={loading}
                className={
                  isPage
                    ? "w-full !rounded-[10px] border-0 !bg-gradient-to-br !from-primary !to-accent px-8 font-body text-[15px] font-semibold !text-white shadow-[0_4px_20px_rgba(58,90,254,0.25)] transition-opacity duration-200 ease-in-out hover:!bg-gradient-to-br hover:!from-primary hover:!to-accent hover:!opacity-[0.92] focus-visible:ring-2 focus-visible:ring-primary/35 sm:w-auto"
                    : "w-full px-8 sm:w-auto"
                }
              >
                {loading ? "Saving..." : "Complete Profile"}
              </Button>
            </div>
          </form>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}
