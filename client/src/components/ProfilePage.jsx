import React, { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { toast } from "sonner";
import { getTalentProfileFormCompletionPercent } from "../utils/talentProfileCompletion";
import {
  TALENT_ACTIONS_MIN_COMPLETION,
  TALENT_BROWSE_MIN_COMPLETION,
} from "../constants/talentProfile";
import * as founderApi from "../utils/api/founderApi";
import * as talentApi from "../utils/api/talentApi";
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
  Award,
  Briefcase,
  Calendar,
  Code,
  Edit,
  ExternalLink,
  FileText,
  Github,
  Globe,
  GraduationCap,
  Linkedin,
  Mail,
  MapPin,
  Plus,
  Save,
  Target,
  Trash2,
  UserCircle,
  Users,
  X,
  Eye,
  Building,
} from "lucide-react";
import { cn } from "./ui/utils";
import { Checkbox } from "./ui/checkbox";
import {
  SETTINGS_CARD,
  settingsBtnPrimary,
  settingsBtnOutline,
  settingsBtnDangerOutline,
} from "./settings/SettingsPrimitives.jsx";
import ResumeImportPanel from "./talent/ResumeImportPanel";

const FIELD_LABEL =
  "font-body text-[11px] font-semibold uppercase tracking-wide text-text-muted";
const FIELD_VALUE = "font-body text-sm font-medium text-text-heading";
const FIELD_EMPTY = "font-body text-sm italic text-text-muted";
const INPUT_CLASS =
  "h-10 rounded-input border-[1.5px] border-surface-border bg-surface-card font-body text-sm text-text-heading placeholder:text-text-muted transition-all focus-visible:border-primary focus-visible:outline-none focus-visible:shadow-focus";
const TEXTAREA_CLASS =
  "min-h-24 resize-none rounded-input border-[1.5px] border-surface-border bg-surface-card font-body text-sm text-text-heading placeholder:text-text-muted transition-all focus-visible:border-primary focus-visible:outline-none focus-visible:shadow-focus";
const SELECT_TRIGGER_CLASS =
  "h-10 w-full rounded-input border-[1.5px] border-surface-border bg-surface-card font-body text-sm text-text-heading focus-visible:border-primary focus-visible:outline-none focus-visible:shadow-focus";
const SECTION_CLASS =
  "rounded-card border border-surface-border bg-surface-card shadow-soft";
const AUTOSAVE_DELAY_MS = 900;
const EMPTY_SELECT_VALUE = "__empty";
const MONTH_OPTIONS = [
  ["01", "Jan"],
  ["02", "Feb"],
  ["03", "Mar"],
  ["04", "Apr"],
  ["05", "May"],
  ["06", "Jun"],
  ["07", "Jul"],
  ["08", "Aug"],
  ["09", "Sep"],
  ["10", "Oct"],
  ["11", "Nov"],
  ["12", "Dec"],
];
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 70 }, (_, index) =>
  String(CURRENT_YEAR + 5 - index),
);

function ensureIds(items) {
  return Array.isArray(items)
    ? items.map((item, index) => ({
        id: item?.id || item?._id || `${Date.now()}-${index}`,
        ...item,
      }))
    : [];
}

function buildInitialProfile(user) {
  return {
    name: user.name || "",
    email: user.email || "",
    professionalTitle: user.professionalTitle || "",
    location: user.location || "",
    yearsOfExperience: user.yearsOfExperience || "",
    bio: user.bio || "",
    skills: Array.isArray(user.skills) ? user.skills : [],
    linkedin: user.linkedin || "",
    github: user.github || "",
    website: user.website || "",
    workExperience: ensureIds(user.workExperience),
    education: ensureIds(user.education),
    certifications: ensureIds(user.certifications),
    portfolioItems: ensureIds(user.portfolioItems),
    availabilityStatus: user.availabilityStatus || "",
    preferredCommitment: user.preferredCommitment || "",
    experience: user.experience || "",
    availability: user.availability || "",
    interests: Array.isArray(user.interests) ? user.interests : [],
    professionalGoals: user.professionalGoals || "",
    industryPreferences: Array.isArray(user.industryPreferences)
      ? user.industryPreferences
      : [],
    resumeUrl: user.resumeUrl || "",
    resumeKey: user.resumeKey || "",
    resumeFileName: user.resumeFileName || "",
    resumeParsedAt: user.resumeParsedAt || null,
    ...(user.role === "founder"
      ? getFounderEditableFields(user)
      : {
          startupName: user.startupName || "",
          startupStage: user.startupStage || "",
          industry: user.industry || "",
          teamSize: user.teamSize || 1,
        }),
  };
}

function initialsFor(name) {
  return String(name || "??").slice(0, 2).toUpperCase();
}

function displayValue(value, fallback = "Not specified") {
  if (Array.isArray(value)) return value.length ? value.join(", ") : fallback;
  return value || fallback;
}

function parseProfileMonth(value) {
  const raw = String(value || "").trim();
  if (!raw) return { month: "", year: "" };

  const isoMatch = raw.match(/^(\d{4})(?:-(\d{2}))?/);
  if (isoMatch) {
    return { year: isoMatch[1], month: isoMatch[2] || "" };
  }

  const yearMatch = raw.match(/\b(19|20)\d{2}\b/);
  const month = MONTH_OPTIONS.find(([, label]) =>
    raw.toLowerCase().includes(label.toLowerCase()),
  )?.[0];
  return { year: yearMatch?.[0] || raw, month: month || "" };
}

function formatProfileMonth(value, fallback = "Not specified") {
  const { month, year } = parseProfileMonth(value);
  if (!year) return fallback;
  const monthLabel = MONTH_OPTIONS.find(([id]) => id === month)?.[1];
  return [monthLabel, year].filter(Boolean).join(" ");
}

function buildProfileMonth(month, year) {
  if (!year) return "";
  return month ? `${year}-${month}` : year;
}

function FieldShell({ label, children, fullWidth, help }) {
  return (
    <div
      className={cn(
        "rounded-input border border-surface-border bg-surface-page px-4 py-3",
        fullWidth && "md:col-span-2",
      )}
    >
      <Label className={FIELD_LABEL}>{label}</Label>
      <div className="mt-2">{children}</div>
      {help ? <p className="mt-2 font-body text-xs text-text-muted">{help}</p> : null}
    </div>
  );
}

function ReadValue({ value, icon: Icon, emptyLabel = "Not specified", link }) {
  const isEmpty = !value || (Array.isArray(value) && value.length === 0);
  if (link && value) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 font-body text-sm font-semibold text-primary hover:underline"
      >
        {Icon ? <Icon className="h-4 w-4" /> : null}
        Open link
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    );
  }
  return (
    <p className={cn(isEmpty ? FIELD_EMPTY : FIELD_VALUE, "flex items-center gap-2")}>
      {Icon ? <Icon className="h-4 w-4 shrink-0 text-text-muted" /> : null}
      {displayValue(value, emptyLabel)}
    </p>
  );
}

function TextField({
  label,
  value,
  onChange,
  isEditing,
  placeholder,
  icon,
  fullWidth,
  textarea,
  help,
  type,
  link,
}) {
  return (
    <FieldShell label={label} fullWidth={fullWidth} help={help}>
      {isEditing ? (
        textarea ? (
          <Textarea
            className={TEXTAREA_CLASS}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={4}
          />
        ) : (
          <Input
            className={INPUT_CLASS}
            type={type || "text"}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
        )
      ) : (
        <ReadValue value={value} icon={icon} link={link} />
      )}
    </FieldShell>
  );
}

function SelectField({
  label,
  value,
  onChange,
  isEditing,
  options,
  placeholder = "Select option",
  fullWidth,
  help,
}) {
  return (
    <FieldShell label={label} fullWidth={fullWidth} help={help}>
      {isEditing ? (
        <Select value={value || ""} onValueChange={onChange}>
          <SelectTrigger className={SELECT_TRIGGER_CLASS}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <ReadValue value={value} />
      )}
    </FieldShell>
  );
}

function MonthYearField({
  label,
  value,
  onChange,
  disabled,
  allowMonth = true,
  help,
}) {
  const parsed = parseProfileMonth(value);
  const monthValue = parsed.month || EMPTY_SELECT_VALUE;
  const yearValue = parsed.year || EMPTY_SELECT_VALUE;

  return (
    <div
      className={cn(
        "rounded-input border border-surface-border bg-surface-card px-3 py-2.5 transition-all",
        disabled && "bg-surface-page opacity-70",
      )}
    >
      <Label className={FIELD_LABEL}>{label}</Label>
      <div
        className={cn(
          "mt-2 grid gap-2",
          allowMonth ? "grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]" : "grid-cols-1",
        )}
      >
        {allowMonth ? (
          <Select
            disabled={disabled}
            value={monthValue}
            onValueChange={(nextMonth) =>
              onChange(
                buildProfileMonth(
                  nextMonth === EMPTY_SELECT_VALUE ? "" : nextMonth,
                  parsed.year,
                ),
              )
            }
          >
            <SelectTrigger className={cn(SELECT_TRIGGER_CLASS, "h-9 bg-white text-xs")}>
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={EMPTY_SELECT_VALUE}>Month</SelectItem>
              {MONTH_OPTIONS.map(([id, labelText]) => (
                <SelectItem key={id} value={id}>
                  {labelText}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        <Select
          disabled={disabled}
          value={yearValue}
          onValueChange={(nextYear) =>
            onChange(
              buildProfileMonth(
                allowMonth ? parsed.month : "",
                nextYear === EMPTY_SELECT_VALUE ? "" : nextYear,
              ),
            )
          }
        >
          <SelectTrigger className={cn(SELECT_TRIGGER_CLASS, "h-9 bg-white text-xs")}>
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={EMPTY_SELECT_VALUE}>Year</SelectItem>
            {YEAR_OPTIONS.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {help ? <p className="mt-2 font-body text-xs text-text-muted">{help}</p> : null}
    </div>
  );
}

function SectionCard({ id, icon: Icon, title, description, actions, children }) {
  return (
    <section id={id} className={SECTION_CLASS}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-surface-border/70 px-4 py-4 md:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-tint text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 className="font-heading text-base font-extrabold text-text-heading">
              {title}
            </h2>
            {description ? (
              <p className="mt-0.5 font-body text-sm text-text-muted">{description}</p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className="space-y-4 px-4 py-4 md:px-5 md:py-5">{children}</div>
    </section>
  );
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="rounded-input border border-dashed border-surface-border bg-surface-page px-4 py-8 text-center">
      {Icon ? <Icon className="mx-auto mb-3 h-7 w-7 text-text-muted" /> : null}
      <p className="font-body text-sm text-text-muted">{text}</p>
    </div>
  );
}

function ArrayEditorCard({ title, onRemove, children }) {
  return (
    <div className="rounded-input border border-surface-border bg-surface-page p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-heading text-sm font-bold text-text-heading">{title}</h3>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-status-error hover:bg-status-error/8 hover:text-status-error"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      {children}
    </div>
  );
}

function TagInput({ value, onChange, placeholder }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const next = draft.trim();
    if (!next || value.includes(next)) return;
    onChange([...value, next]);
    setDraft("");
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {value.length ? (
          value.map((item) => (
            <Badge key={item} className="gap-1 rounded-full bg-primary-tint text-primary">
              {item}
              <button type="button" onClick={() => onChange(value.filter((x) => x !== item))}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        ) : (
          <p className={FIELD_EMPTY}>No items added yet</p>
        )}
      </div>
      <div className="flex gap-2">
        <Input
          className={INPUT_CLASS}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
        />
        <Button type="button" className={settingsBtnOutline} onClick={add}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>
    </div>
  );
}

const talentSections = [
  ["basics", UserCircle, "Basics"],
  ["skills", Code, "Skills"],
  ["links", Globe, "Links"],
  ["experience", Briefcase, "Experience"],
  ["education", GraduationCap, "Education"],
  ["credentials", Award, "Credentials"],
  ["portfolio", FileText, "Portfolio"],
  ["availability", Calendar, "Availability"],
  ["goals", Target, "Goals"],
];

const founderSections = [
  ["basics", UserCircle, "Basics"],
  ["startup", Building, "Startup"],
  ["links", Globe, "Links"],
];

const memberSections = [
  ["basics", UserCircle, "Basics"],
  ["links", Globe, "Links"],
];

export default function ProfilePage({ user, onUpdateUser, initialEditing = false }) {
  const [isEditing, setIsEditing] = useState(initialEditing);
  const [showPreview, setShowPreview] = useState(false);
  const [editedProfile, setEditedProfile] = useState(() => buildInitialProfile(user));
  const [autosaveStatus, setAutosaveStatus] = useState("idle");
  const autosaveSnapshotRef = useRef(JSON.stringify(buildInitialProfile(user)));
  const autosaveTimerRef = useRef(null);

  useEffect(() => {
    setIsEditing(initialEditing);
  }, [initialEditing]);

  useEffect(() => {
    const initialProfile = buildInitialProfile(user);
    setEditedProfile(initialProfile);
    autosaveSnapshotRef.current = JSON.stringify(initialProfile);
    setAutosaveStatus("idle");
  }, [user]);

  useEffect(() => {
    if (user?.role !== "talent" || !(user?._id || user?.id)) return;
    const userId = String(user._id ?? user.id);
    talentApi
      .getTalentProfile(userId)
      .then((response) => {
        if (response?.success && response?.data) {
          const profile = response.data;
          setEditedProfile((prev) => {
            const next = {
              ...prev,
              name: profile.fullName || profile.name || prev.name,
              professionalTitle: profile.professionalTitle || prev.professionalTitle,
              location: profile.location || prev.location,
              bio: profile.bio || prev.bio,
              professionalGoals: profile.professionalGoals || prev.professionalGoals,
              skills: profile.skills?.length ? profile.skills : prev.skills,
              yearsOfExperience: profile.yearsOfExperience || prev.yearsOfExperience,
              availability: profile.availability || prev.availability,
              availabilityStatus: profile.availabilityStatus || prev.availabilityStatus,
              preferredCommitment:
                profile.preferredCommitment || prev.preferredCommitment,
              linkedin: profile.linkedinUrl || profile.linkedin || prev.linkedin,
              github: profile.githubUrl || profile.github || prev.github,
              website:
                profile.websiteUrl ||
                profile.website ||
                profile.portfolioWebsite ||
                prev.website,
              workExperience: profile.workExperiences?.length
                ? ensureIds(profile.workExperiences)
                : profile.workExperience?.length
                  ? ensureIds(profile.workExperience)
                  : prev.workExperience,
              education: profile.educationList?.length
                ? ensureIds(profile.educationList)
                : profile.education?.length
                  ? ensureIds(profile.education)
                  : prev.education,
              certifications: profile.certifications?.length
                ? ensureIds(profile.certifications)
                : prev.certifications,
              portfolioItems: profile.portfolioItems?.length
                ? ensureIds(profile.portfolioItems)
                : prev.portfolioItems,
              industryPreferences: profile.industryPreferences?.length
                ? profile.industryPreferences
                : prev.industryPreferences,
              interests: profile.interests?.length ? profile.interests : prev.interests,
              resumeUrl: profile.resumeUrl || prev.resumeUrl,
              resumeKey: profile.resumeKey || prev.resumeKey,
              resumeFileName: profile.resumeFileName || prev.resumeFileName,
              resumeParsedAt: profile.resumeParsedAt || prev.resumeParsedAt,
            };
            autosaveSnapshotRef.current = JSON.stringify(next);
            return next;
          });
        }
      })
      .catch((err) => console.warn("Failed to load talent profile:", err));
  }, [user?._id, user?.id, user?.role]);

  const profileCompletion =
    user.role === "talent"
      ? getTalentProfileFormCompletionPercent(editedProfile)
      : 100;
  const completionLabel =
    profileCompletion >= 90
      ? "Profile looks strong"
      : profileCompletion >= TALENT_BROWSE_MIN_COMPLETION
        ? "Almost there"
        : profileCompletion >= 40
          ? "Good start"
          : "Needs more detail";
  const completionHint =
    profileCompletion < TALENT_BROWSE_MIN_COMPLETION
      ? `Reach ${TALENT_BROWSE_MIN_COMPLETION}% to appear in founder browse`
      : profileCompletion < TALENT_ACTIONS_MIN_COMPLETION
        ? `Reach ${TALENT_ACTIONS_MIN_COMPLETION}% to unlock applications`
        : completionLabel;
  const autosaveLabel =
    autosaveStatus === "saving"
      ? "Saving changes..."
      : autosaveStatus === "saved"
        ? "All changes saved"
        : autosaveStatus === "error"
          ? "Autosave failed"
          : "Autosaves while you edit";
  const sections =
    user.role === "talent"
      ? talentSections
      : user.role === "founder"
        ? founderSections
        : memberSections;
  const readOnly = !isEditing || showPreview;

  const setField = (field, value) => {
    setEditedProfile((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }

    if (
      user.role !== "talent" ||
      !isEditing ||
      showPreview ||
      !onUpdateUser ||
      !(user?._id || user?.id)
    ) {
      return undefined;
    }

    const serialized = JSON.stringify(editedProfile);
    if (serialized === autosaveSnapshotRef.current) {
      return undefined;
    }

    setAutosaveStatus("saving");
    autosaveTimerRef.current = setTimeout(async () => {
      const userId = String(user._id ?? user.id);
      try {
        await talentApi.saveTalentProfile(userId, editedProfile);
        autosaveSnapshotRef.current = JSON.stringify(editedProfile);
        onUpdateUser({ ...user, ...editedProfile });
        setAutosaveStatus("saved");
      } catch (err) {
        console.warn("Failed to autosave talent profile:", err);
        setAutosaveStatus("error");
      }
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  }, [editedProfile, isEditing, onUpdateUser, showPreview, user]);

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
      const userId = String(user._id ?? user.id);
      try {
        await talentApi.saveTalentProfile(userId, editedProfile);
        onUpdateUser({ ...user, ...editedProfile });
      } catch (err) {
        toast.error(err?.message || "Failed to save talent profile");
        return;
      }
    }

    setIsEditing(false);
    setShowPreview(false);
    toast.success("Profile updated successfully!");
  };

  const cancelEditing = () => {
    setEditedProfile(buildInitialProfile(user));
    setIsEditing(false);
    setShowPreview(false);
  };

  const addItem = (field, item) => {
    setField(field, [...editedProfile[field], { id: Date.now().toString(), ...item }]);
  };

  const updateItem = (field, id, key, value) => {
    setField(
      field,
      editedProfile[field].map((item) =>
        item.id === id ? { ...item, [key]: value } : item,
      ),
    );
  };

  const removeItem = (field, id) => {
    setField(field, editedProfile[field].filter((item) => item.id !== id));
  };

  const updateCertificationImage = (id, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateItem("certifications", id, "certificateImage", reader.result || "");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-full bg-surface-page p-2 font-body md:p-3 lg:p-4">
      <div className="mx-auto max-w-7xl space-y-4">
        <section className={cn(SECTION_CLASS, "overflow-hidden")}>
          <div className="flex flex-col gap-5 p-4 md:flex-row md:items-center md:justify-between md:p-5">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_8px_24px_rgba(58,90,254,0.25)]">
                <span className="font-heading text-lg font-extrabold">
                  {initialsFor(editedProfile.name)}
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate font-heading text-xl font-extrabold text-text-heading">
                    {editedProfile.name || "Unnamed profile"}
                  </h1>
                  <Badge className="rounded-full bg-primary-tint px-2.5 py-0.5 font-body text-[11px] font-semibold text-primary capitalize">
                    {user.role?.replace(/-/g, " ") || "Member"}
                  </Badge>
                </div>
                <p className="mt-1 font-body text-sm text-text-body">
                  {editedProfile.professionalTitle ||
                    editedProfile.startupName ||
                    "Add a title to make your profile easier to scan"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              {user.role === "talent" ? (
                <ResumeImportPanel
                  variant="button"
                  editedProfile={editedProfile}
                  onApply={(next) => {
                    setEditedProfile(next);
                    setIsEditing(true);
                    setShowPreview(false);
                  }}
                  buttonClassName="h-10"
                  buttonLabel="Upload CV"
                />
              ) : null}
              {isEditing ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className={settingsBtnOutline}
                    onClick={() => setShowPreview((value) => !value)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    {showPreview ? "Edit view" : "Preview"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className={settingsBtnOutline}
                    onClick={cancelEditing}
                  >
                    Cancel
                  </Button>
                  <Button type="button" className={settingsBtnPrimary} onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" />
                    Save changes
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  className={settingsBtnPrimary}
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit profile
                </Button>
              )}
            </div>
          </div>
          {user.role === "talent" ? (
            <div className="border-t border-surface-border/70 bg-surface-page/60 px-4 py-4 md:px-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <p className="font-heading text-sm font-bold text-text-heading">
                    Profile completion
                  </p>
                  <Badge className="rounded-full bg-primary-tint px-2.5 py-0.5 font-body text-[11px] font-semibold text-primary">
                    {completionLabel}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-body text-xs font-semibold",
                      autosaveStatus === "error"
                        ? "border-status-error/25 bg-status-error/8 text-status-error"
                        : "border-surface-border bg-surface-card text-text-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        autosaveStatus === "saving"
                          ? "animate-pulse bg-primary"
                          : autosaveStatus === "error"
                            ? "bg-status-error"
                            : "bg-status-success",
                      )}
                    />
                    {autosaveLabel}
                  </span>
                  <span className="font-body text-sm font-semibold tabular-nums text-primary">
                    {profileCompletion}%
                  </span>
                </div>
              </div>
              <Progress
                value={profileCompletion}
                className="mt-3 h-2 border-0 bg-surface-border/60"
              />
              <p className="mt-2 font-body text-xs text-text-muted">{completionHint}</p>
            </div>
          ) : null}
        </section>

        <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className={cn(SECTION_CLASS, "h-fit p-2 lg:sticky lg:top-4")}>
            <nav className="space-y-1" aria-label="Profile sections">
              {sections.map(([id, Icon, label]) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="flex items-center gap-2.5 rounded-input px-3 py-2.5 font-body text-sm font-semibold text-text-body transition-colors hover:bg-primary-tint hover:text-primary"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </a>
              ))}
            </nav>
          </aside>

          <div className="space-y-4">
            {user.role === "talent" ? (
              <>
                <SectionCard
                  id="basics"
                  icon={UserCircle}
                  title="Basics"
                  description="Core information founders use to understand your fit"
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    <TextField
                      label="Full name"
                      value={editedProfile.name}
                      onChange={(value) => setField("name", value)}
                      isEditing={!readOnly}
                      placeholder="Your full name"
                    />
                    <TextField
                      label="Professional title"
                      value={editedProfile.professionalTitle}
                      onChange={(value) => setField("professionalTitle", value)}
                      isEditing={!readOnly}
                      placeholder="e.g., Senior Full-Stack Developer"
                    />
                    <TextField
                      label="Location"
                      value={editedProfile.location}
                      onChange={(value) => setField("location", value)}
                      isEditing={!readOnly}
                      placeholder="e.g., Lagos, Nigeria"
                      icon={MapPin}
                    />
                    <TextField
                      label="Years of experience"
                      value={editedProfile.yearsOfExperience}
                      onChange={(value) => setField("yearsOfExperience", value)}
                      isEditing={!readOnly}
                      placeholder="e.g., 5"
                    />
                    <TextField
                      label="Professional bio"
                      value={editedProfile.bio}
                      onChange={(value) => setField("bio", value)}
                      isEditing={!readOnly}
                      placeholder="Summarize your background, strengths, and what you want to build."
                      textarea
                      fullWidth
                    />
                  </div>
                </SectionCard>

                <SectionCard
                  id="skills"
                  icon={Code}
                  title="Skills"
                  description="A focused set of skills helps founders search and compare talent"
                >
                  {!readOnly ? (
                    <TagInput
                      value={editedProfile.skills}
                      onChange={(value) => setField("skills", value)}
                      placeholder="Add a skill"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {editedProfile.skills.length ? (
                        editedProfile.skills.map((skill) => (
                          <Badge key={skill} className="rounded-full bg-primary-tint px-3 py-1 text-primary">
                            {skill}
                          </Badge>
                        ))
                      ) : (
                        <EmptyState icon={Code} text="No skills added yet" />
                      )}
                    </div>
                  )}
                </SectionCard>

                <SectionCard
                  id="links"
                  icon={Globe}
                  title="Professional links"
                  description="Links that validate your work and professional background"
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    <TextField
                      label="LinkedIn"
                      value={editedProfile.linkedin}
                      onChange={(value) => setField("linkedin", value)}
                      isEditing={!readOnly}
                      placeholder="https://linkedin.com/in/yourprofile"
                      icon={Linkedin}
                      link
                    />
                    <TextField
                      label="GitHub"
                      value={editedProfile.github}
                      onChange={(value) => setField("github", value)}
                      isEditing={!readOnly}
                      placeholder="https://github.com/yourusername"
                      icon={Github}
                      link
                    />
                    <TextField
                      label="Portfolio website"
                      value={editedProfile.website}
                      onChange={(value) => setField("website", value)}
                      isEditing={!readOnly}
                      placeholder="https://yourportfolio.com"
                      icon={Globe}
                      link
                      fullWidth
                    />
                  </div>
                </SectionCard>

                <SectionCard
                  id="experience"
                  icon={Briefcase}
                  title="Work experience"
                  description="Show the roles and outcomes behind your expertise"
                  actions={
                    !readOnly ? (
                      <Button
                        type="button"
                        className={settingsBtnOutline}
                        onClick={() =>
                          addItem("workExperience", {
                            company: "",
                            position: "",
                            startDate: "",
                            endDate: "",
                            current: false,
                            description: "",
                          })
                        }
                      >
                        <Plus className="h-4 w-4" />
                        Add experience
                      </Button>
                    ) : null
                  }
                >
                  {editedProfile.workExperience.length ? (
                    <div className="space-y-3">
                      {editedProfile.workExperience.map((exp, index) =>
                        !readOnly ? (
                          <ArrayEditorCard
                            key={exp.id}
                            title={`Experience ${index + 1}`}
                            onRemove={() => removeItem("workExperience", exp.id)}
                          >
                            <div className="grid gap-3 md:grid-cols-2">
                              {["company", "position"].map((field) => (
                                <Input
                                  key={field}
                                  className={INPUT_CLASS}
                                  placeholder={field === "company" ? "Company" : "Position"}
                                  value={exp[field] || ""}
                                  onChange={(e) =>
                                    updateItem("workExperience", exp.id, field, e.target.value)
                                  }
                                />
                              ))}
                              <MonthYearField
                                label="Start date"
                                value={exp.startDate || ""}
                                onChange={(value) =>
                                  updateItem("workExperience", exp.id, "startDate", value)
                                }
                                help="Month and year are enough for profile history."
                              />
                              <MonthYearField
                                label="End date"
                                value={exp.endDate || ""}
                                disabled={exp.current}
                                onChange={(value) =>
                                  updateItem("workExperience", exp.id, "endDate", value)
                                }
                                help={exp.current ? "Current role uses Present." : ""}
                              />
                              <label className="flex items-center gap-2 font-body text-sm text-text-body md:col-span-2">
                                <Checkbox
                                  checked={Boolean(exp.current)}
                                  onCheckedChange={(checked) =>
                                    updateItem("workExperience", exp.id, "current", Boolean(checked))
                                  }
                                />
                                Currently working here
                              </label>
                              <Textarea
                                className={cn(TEXTAREA_CLASS, "md:col-span-2")}
                                placeholder="Responsibilities, outcomes, and context"
                                value={exp.description || ""}
                                onChange={(e) =>
                                  updateItem("workExperience", exp.id, "description", e.target.value)
                                }
                              />
                            </div>
                          </ArrayEditorCard>
                        ) : (
                          <div key={exp.id} className="rounded-input border border-surface-border bg-surface-page p-4">
                            <h3 className="font-heading text-sm font-bold text-text-heading">
                              {exp.position || "Untitled role"}
                            </h3>
                            <p className="mt-1 font-body text-sm text-text-muted">
                              {exp.company || "Company not specified"}
                            </p>
                            <p className="mt-2 font-body text-xs text-text-muted">
                              {formatProfileMonth(exp.startDate, "Start")} -{" "}
                              {exp.current
                                ? "Present"
                                : formatProfileMonth(exp.endDate, "End")}
                            </p>
                            {exp.description ? (
                              <p className="mt-3 whitespace-pre-wrap font-body text-sm text-text-body">
                                {exp.description}
                              </p>
                            ) : null}
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <EmptyState icon={Briefcase} text="No work experience added yet" />
                  )}
                </SectionCard>

                <SectionCard
                  id="education"
                  icon={GraduationCap}
                  title="Education"
                  actions={
                    !readOnly ? (
                      <Button
                        type="button"
                        className={settingsBtnOutline}
                        onClick={() =>
                          addItem("education", {
                            institution: "",
                            degree: "",
                            field: "",
                            graduationYear: "",
                          })
                        }
                      >
                        <Plus className="h-4 w-4" />
                        Add education
                      </Button>
                    ) : null
                  }
                >
                  {editedProfile.education.length ? (
                    <div className="space-y-3">
                      {editedProfile.education.map((edu, index) =>
                        !readOnly ? (
                          <ArrayEditorCard
                            key={edu.id}
                            title={`Education ${index + 1}`}
                            onRemove={() => removeItem("education", edu.id)}
                          >
                            <div className="grid gap-3 md:grid-cols-2">
                              {["institution", "degree", "field"].map((field) => (
                                <Input
                                  key={field}
                                  className={INPUT_CLASS}
                                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                                  value={edu[field] || ""}
                                  onChange={(e) =>
                                    updateItem("education", edu.id, field, e.target.value)
                                  }
                                />
                              ))}
                              <MonthYearField
                                label="Graduation year"
                                value={edu.graduationYear || ""}
                                allowMonth={false}
                                onChange={(value) =>
                                  updateItem("education", edu.id, "graduationYear", value)
                                }
                              />
                            </div>
                          </ArrayEditorCard>
                        ) : (
                          <div key={edu.id} className="rounded-input border border-surface-border bg-surface-page p-4">
                            <h3 className="font-heading text-sm font-bold text-text-heading">
                              {[edu.degree, edu.field].filter(Boolean).join(" in ") || "Education"}
                            </h3>
                            <p className="mt-1 font-body text-sm text-text-muted">
                              {edu.institution || "Institution not specified"}
                            </p>
                            {edu.graduationYear ? (
                              <p className="mt-2 font-body text-xs text-text-muted">
                                Graduated {formatProfileMonth(edu.graduationYear)}
                              </p>
                            ) : null}
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <EmptyState icon={GraduationCap} text="No education added yet" />
                  )}
                </SectionCard>

                <SectionCard
                  id="credentials"
                  icon={Award}
                  title="Credentials"
                  description="Certificates and credentials that support your expertise"
                  actions={
                    !readOnly ? (
                      <Button
                        type="button"
                        className={settingsBtnOutline}
                        onClick={() =>
                          addItem("certifications", {
                            name: "",
                            issuer: "",
                            issueYear: "",
                            credentialId: "",
                            credentialUrl: "",
                            certificateImage: "",
                          })
                        }
                      >
                        <Plus className="h-4 w-4" />
                        Add credential
                      </Button>
                    ) : null
                  }
                >
                  {editedProfile.certifications.length ? (
                    <div className="space-y-3">
                      {editedProfile.certifications.map((cert, index) =>
                        !readOnly ? (
                          <ArrayEditorCard
                            key={cert.id}
                            title={`Credential ${index + 1}`}
                            onRemove={() => removeItem("certifications", cert.id)}
                          >
                            <div className="grid gap-3 md:grid-cols-2">
                              <Input
                                className={INPUT_CLASS}
                                placeholder="Certification name"
                                value={cert.name || ""}
                                onChange={(e) =>
                                  updateItem("certifications", cert.id, "name", e.target.value)
                                }
                              />
                              <Input
                                className={INPUT_CLASS}
                                placeholder="Issuing organization"
                                value={cert.issuer || ""}
                                onChange={(e) =>
                                  updateItem("certifications", cert.id, "issuer", e.target.value)
                                }
                              />
                              <MonthYearField
                                label="Issue year"
                                value={cert.issueYear || cert.year || ""}
                                allowMonth={false}
                                onChange={(value) =>
                                  updateItem("certifications", cert.id, "issueYear", value)
                                }
                              />
                              <Input
                                className={INPUT_CLASS}
                                placeholder="Credential ID"
                                value={cert.credentialId || ""}
                                onChange={(e) =>
                                  updateItem("certifications", cert.id, "credentialId", e.target.value)
                                }
                              />
                              <Input
                                className={cn(INPUT_CLASS, "md:col-span-2")}
                                placeholder="Credential URL"
                                value={cert.credentialUrl || ""}
                                onChange={(e) =>
                                  updateItem("certifications", cert.id, "credentialUrl", e.target.value)
                                }
                              />
                              <div className="space-y-2 md:col-span-2">
                                <Label className={FIELD_LABEL}>Certificate image</Label>
                                <Input
                                  className={INPUT_CLASS}
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) =>
                                    updateCertificationImage(cert.id, e.target.files?.[0])
                                  }
                                />
                              </div>
                            </div>
                          </ArrayEditorCard>
                        ) : (
                          <div key={cert.id} className="rounded-input border border-surface-border bg-surface-page p-4">
                            <h3 className="font-heading text-sm font-bold text-text-heading">
                              {cert.name || "Unnamed credential"}
                            </h3>
                            <p className="mt-1 font-body text-sm text-text-muted">
                              {[cert.issuer, cert.issueYear].filter(Boolean).join(" • ") ||
                                "Issuer not specified"}
                            </p>
                            {cert.credentialUrl ? (
                              <a
                                href={cert.credentialUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 inline-flex items-center gap-1 font-body text-sm font-semibold text-primary hover:underline"
                              >
                                View credential
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            ) : null}
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <EmptyState icon={Award} text="No credentials added yet" />
                  )}
                </SectionCard>

                <SectionCard
                  id="portfolio"
                  icon={FileText}
                  title="Portfolio"
                  description="Projects that demonstrate your taste and execution"
                  actions={
                    !readOnly ? (
                      <Button
                        type="button"
                        className={settingsBtnOutline}
                        onClick={() =>
                          addItem("portfolioItems", {
                            title: "",
                            description: "",
                            url: "",
                            type: "",
                          })
                        }
                      >
                        <Plus className="h-4 w-4" />
                        Add project
                      </Button>
                    ) : null
                  }
                >
                  {editedProfile.portfolioItems.length ? (
                    <div className="space-y-3">
                      {editedProfile.portfolioItems.map((item, index) =>
                        !readOnly ? (
                          <ArrayEditorCard
                            key={item.id}
                            title={`Project ${index + 1}`}
                            onRemove={() => removeItem("portfolioItems", item.id)}
                          >
                            <div className="grid gap-3">
                              <Input
                                className={INPUT_CLASS}
                                placeholder="Project title"
                                value={item.title || ""}
                                onChange={(e) =>
                                  updateItem("portfolioItems", item.id, "title", e.target.value)
                                }
                              />
                              <Input
                                className={INPUT_CLASS}
                                placeholder="Project type"
                                value={item.type || ""}
                                onChange={(e) =>
                                  updateItem("portfolioItems", item.id, "type", e.target.value)
                                }
                              />
                              <Textarea
                                className={TEXTAREA_CLASS}
                                placeholder="Description"
                                value={item.description || ""}
                                onChange={(e) =>
                                  updateItem("portfolioItems", item.id, "description", e.target.value)
                                }
                              />
                              <Input
                                className={INPUT_CLASS}
                                placeholder="Project URL"
                                value={item.url || ""}
                                onChange={(e) =>
                                  updateItem("portfolioItems", item.id, "url", e.target.value)
                                }
                              />
                            </div>
                          </ArrayEditorCard>
                        ) : (
                          <div key={item.id} className="rounded-input border border-surface-border bg-surface-page p-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-heading text-sm font-bold text-text-heading">
                                {item.title || "Untitled project"}
                              </h3>
                              {item.type ? (
                                <Badge className="rounded-full bg-primary-tint text-primary">
                                  {item.type}
                                </Badge>
                              ) : null}
                            </div>
                            {item.description ? (
                              <p className="mt-3 whitespace-pre-wrap font-body text-sm text-text-body">
                                {item.description}
                              </p>
                            ) : null}
                            {item.url ? (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 inline-flex items-center gap-1 font-body text-sm font-semibold text-primary hover:underline"
                              >
                                View project
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            ) : null}
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <EmptyState icon={FileText} text="No portfolio projects added yet" />
                  )}
                </SectionCard>

                <SectionCard
                  id="availability"
                  icon={Calendar}
                  title="Availability"
                  description="Set expectations for when and how you can work"
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    <SelectField
                      label="Experience level"
                      value={editedProfile.experience}
                      onChange={(value) => setField("experience", value)}
                      isEditing={!readOnly}
                      options={["0-1 years", "1-3 years", "3-5 years", "5-10 years", "10+ years"]}
                    />
                    <SelectField
                      label="When can you start?"
                      value={editedProfile.availability}
                      onChange={(value) => setField("availability", value)}
                      isEditing={!readOnly}
                      options={["Immediately", "In 1 week", "In 2 weeks", "In 1 month", "Flexible"]}
                    />
                    <SelectField
                      label="Current status"
                      value={editedProfile.availabilityStatus}
                      onChange={(value) => setField("availabilityStatus", value)}
                      isEditing={!readOnly}
                      options={[
                        "actively-looking",
                        "open-to-offers",
                        "casually-browsing",
                        "not-looking",
                      ]}
                    />
                    <SelectField
                      label="Preferred commitment"
                      value={editedProfile.preferredCommitment}
                      onChange={(value) => setField("preferredCommitment", value)}
                      isEditing={!readOnly}
                      options={["full-time", "part-time", "contract", "flexible"]}
                    />
                  </div>
                </SectionCard>

                <SectionCard
                  id="goals"
                  icon={Target}
                  title="Goals & preferences"
                  description="Help founders understand where you want to contribute"
                >
                  <div className="grid gap-3">
                    <TextField
                      label="Professional goals"
                      value={editedProfile.professionalGoals}
                      onChange={(value) => setField("professionalGoals", value)}
                      isEditing={!readOnly}
                      placeholder="What are you looking for next?"
                      textarea
                      fullWidth
                    />
                    <FieldShell label="Industry interests">
                      {!readOnly ? (
                        <TagInput
                          value={editedProfile.interests}
                          onChange={(value) => setField("interests", value)}
                          placeholder="Add an industry"
                        />
                      ) : (
                        <ReadValue value={editedProfile.interests} />
                      )}
                    </FieldShell>
                    <FieldShell label="Other industry preferences">
                      {!readOnly ? (
                        <TagInput
                          value={editedProfile.industryPreferences}
                          onChange={(value) => setField("industryPreferences", value)}
                          placeholder="Add a preference"
                        />
                      ) : (
                        <ReadValue value={editedProfile.industryPreferences} />
                      )}
                    </FieldShell>
                  </div>
                </SectionCard>
              </>
            ) : (
              <>
                <SectionCard
                  id="basics"
                  icon={UserCircle}
                  title="Personal information"
                  description="Your profile identity and founder bio"
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    <TextField
                      label="Full name"
                      value={editedProfile.name}
                      onChange={(value) => setField("name", value)}
                      isEditing={!readOnly}
                      placeholder="Your full name"
                    />
                    <TextField
                      label="Email"
                      value={editedProfile.email}
                      onChange={(value) => setField("email", value)}
                      isEditing={!readOnly}
                      placeholder="you@example.com"
                      icon={Mail}
                    />
                    <TextField
                      label="Bio"
                      value={editedProfile.bio}
                      onChange={(value) => setField("bio", value)}
                      isEditing={!readOnly}
                      placeholder="Tell people about your background and what you are building."
                      textarea
                      fullWidth
                    />
                  </div>
                </SectionCard>

                {user.role === "founder" ? (
                  <SectionCard
                    id="startup"
                    icon={Building}
                    title="Startup profile"
                    description="Company details, stage, audience, and hiring needs"
                  >
                    <div className="grid gap-3 md:grid-cols-2">
                      <TextField
                        label="Startup name"
                        value={editedProfile.startupName}
                        onChange={(value) => setField("startupName", value)}
                        isEditing={!readOnly}
                        placeholder="Your startup name"
                        fullWidth
                      />
                      <TextField
                        label="Startup description"
                        value={editedProfile.startupDescription}
                        onChange={(value) => setField("startupDescription", value)}
                        isEditing={!readOnly}
                        placeholder="What you do and the problem you solve"
                        textarea
                        fullWidth
                      />
                      <SelectField
                        label="Industry"
                        value={editedProfile.industryFocus}
                        onChange={(value) => setField("industryFocus", value)}
                        isEditing={!readOnly}
                        options={FOUNDER_INDUSTRY_OPTIONS}
                      />
                      <SelectField
                        label="Team size"
                        value={editedProfile.teamSize}
                        onChange={(value) => setField("teamSize", value)}
                        isEditing={!readOnly}
                        options={FOUNDER_TEAM_SIZE_OPTIONS}
                      />
                      <SelectField
                        label="Execution stage"
                        value={editedProfile.startupStage}
                        onChange={(value) => setField("startupStage", value)}
                        isEditing={!readOnly}
                        options={FOUNDER_STAGE_OPTIONS}
                      />
                      <SelectField
                        label="Validated idea"
                        value={editedProfile.hasValidatedIdea}
                        onChange={(value) => setField("hasValidatedIdea", value)}
                        isEditing={!readOnly}
                        options={FOUNDER_VALIDATED_IDEA_OPTIONS}
                      />
                      <SelectField
                        label="MVP or prototype"
                        value={editedProfile.hasMVP}
                        onChange={(value) => setField("hasMVP", value)}
                        isEditing={!readOnly}
                        options={FOUNDER_MVP_OPTIONS}
                      />
                      <SelectField
                        label="Customers or users"
                        value={editedProfile.hasCustomers}
                        onChange={(value) => setField("hasCustomers", value)}
                        isEditing={!readOnly}
                        options={FOUNDER_CUSTOMERS_OPTIONS}
                      />
                      <FieldShell label="Target audience" fullWidth>
                        {!readOnly ? (
                          <TagInput
                            value={editedProfile.targetAudience || []}
                            onChange={(value) => setField("targetAudience", value)}
                            placeholder="Add an audience"
                          />
                        ) : (
                          <ReadValue value={editedProfile.targetAudience} />
                        )}
                      </FieldShell>
                      <FieldShell label="Roles needed" fullWidth>
                        {!readOnly ? (
                          <div className="flex flex-wrap gap-2">
                            {FOUNDER_ROLES_NEEDED_OPTIONS.map((role) => {
                              const checked = editedProfile.rolesNeeded?.includes?.(role);
                              return (
                                <label
                                  key={role}
                                  className={cn(
                                    "flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 font-body text-xs font-semibold",
                                    checked
                                      ? "border-primary bg-primary-tint text-primary"
                                      : "border-surface-border bg-surface-card text-text-body",
                                  )}
                                >
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={() => {
                                      const current = editedProfile.rolesNeeded || [];
                                      setField(
                                        "rolesNeeded",
                                        current.includes(role)
                                          ? current.filter((item) => item !== role)
                                          : [...current, role],
                                      );
                                    }}
                                  />
                                  {role}
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <ReadValue value={editedProfile.rolesNeeded} />
                        )}
                      </FieldShell>
                    </div>
                  </SectionCard>
                ) : null}

                <SectionCard
                  id="links"
                  icon={Globe}
                  title="Contact & links"
                  description="Public URLs connected to your profile"
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    <TextField
                      label="Website"
                      value={editedProfile.website}
                      onChange={(value) => setField("website", value)}
                      isEditing={!readOnly}
                      placeholder="https://yourstartup.com"
                      icon={Globe}
                      link
                    />
                    <TextField
                      label="LinkedIn"
                      value={editedProfile.linkedin}
                      onChange={(value) => setField("linkedin", value)}
                      isEditing={!readOnly}
                      placeholder="https://linkedin.com/in/yourname"
                      icon={Linkedin}
                      link
                    />
                  </div>
                </SectionCard>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
