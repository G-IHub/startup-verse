import React, { useMemo, useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Textarea } from "../ui/textarea";
import { Progress } from "../ui/progress";
import OfferDisplay from "../OfferDisplay";
import { toast } from "sonner";
import { getTalentProfileCompletionPercent } from "../../utils/talentProfileCompletion";
import {
  TALENT_ACTIONS_MIN_COMPLETION,
  TALENT_BROWSE_MIN_COMPLETION,
} from "../../constants/talentProfile.js";
import { useTalentHomeData } from "../../domains/talent/hooks/useTalentHomeData";
import { getFirstName } from "../../utils/nameHelpers";
import {
  Star,
  Heart,
  MapPin,
  Users,
  AlertCircle,
  Clock,
  TrendingUp,
  Target,
  Send,
  LayoutGrid,
  List,
  X,
  Search,
  ArrowRight,
  DollarSign,
  Bookmark,
  Eye,
  CheckCircle2,
  Briefcase,
  Building2,
  UserCircle,
  ListChecks,
} from "lucide-react";
import EmptyStateBlock from "../organizations/_primitives/EmptyStateBlock";
import { authBtnPrimary } from "../auth/AuthPrimitives";
import { SETTINGS_CARD } from "../settings/SettingsPrimitives";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

const FILTER_GROUPS = [
  { key: "stage", label: "Stage" },
  { key: "funding", label: "Funding" },
  { key: "commitment", label: "Commitment Type" },
  { key: "equity", label: "Equity Range" },
  { key: "location", label: "Location" },
  { key: "teamSize", label: "Team Size" },
];

const FILTER_DEFAULTS = {
  stage: [],
  funding: [],
  commitment: [],
  equity: [],
  location: [],
  teamSize: [],
};

function toNumber(value) {
  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function toRelativePosted(postedDate, fallbackPosted) {
  if (fallbackPosted) return fallbackPosted;
  if (!postedDate) return "Just now";
  const ageInDays = Math.floor(
    (Date.now() - new Date(postedDate).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (ageInDays <= 0) return "Today";
  if (ageInDays === 1) return "1 day ago";
  return `${ageInDays} days ago`;
}

function getAvatarTone(companyName) {
  const toneClasses = [
    "bg-slate-100 text-slate-700",
    "bg-indigo-100 text-indigo-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-cyan-100 text-cyan-700",
  ];
  const hash = companyName
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return toneClasses[Math.abs(hash) % toneClasses.length];
}

function getInitials(name) {
  return (name || "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function truncateDescription(text) {
  if (!text) return "";
  return text.length > 60 ? `${text.slice(0, 57)}...` : text;
}

function getEquityRange(startup) {
  const equityMin = toNumber(startup?.offer?.equityMin);
  const equityMax = toNumber(startup?.offer?.equityMax);
  if (equityMin == null || equityMax == null) return null;
  return {
    min: equityMin,
    max: equityMax,
    label: `${equityMin}-${equityMax}%`,
    midpoint: (equityMin + equityMax) / 2,
  };
}

function getEquityBucket(equityRange) {
  if (!equityRange) return "Not specified";
  if (equityRange.max <= 2) return "0-2%";
  if (equityRange.max <= 5) return "2-5%";
  if (equityRange.max <= 10) return "5-10%";
  return "10%+";
}

function getTeamSizeBucket(teamSize) {
  if (!teamSize) return "Unknown";
  if (teamSize <= 5) return "1-5";
  if (teamSize <= 10) return "6-10";
  if (teamSize <= 20) return "11-20";
  return "21+";
}

function getMatchStyle(score) {
  if (score >= 80) {
    return "bg-green-100 text-green-700 border border-green-200";
  }
  if (score >= 60) {
    return "bg-amber-100 text-amber-700 border border-amber-200";
  }
  return "bg-red-100 text-red-700 border border-red-200";
}

export default function TalentDashboard({
  user,
  onUpdateUser,
  onNavigate,
  entryMode = "overview",
}) {
  const talentCompletion = getTalentProfileCompletionPercent(user);
  const visibleToFoundersInBrowse =
    talentCompletion >= TALENT_BROWSE_MIN_COMPLETION;
  const canUsePrimaryTalentActions =
    talentCompletion >= TALENT_ACTIONS_MIN_COMPLETION;
  const [selectedStartup, setSelectedStartup] = useState(null);
  const [interestMessage, setInterestMessage] = useState("");
  const [profileBannerDismissed, setProfileBannerDismissed] = useState(false);
  const [sortBy, setSortBy] = useState("bestMatch");
  const [layoutMode, setLayoutMode] = useState("list");
  const [filters, setFilters] = useState(FILTER_DEFAULTS);

  const {
    loading: isLoading,
    error,
    savingIds: savingItems,
    submittingInterest: isSubmittingApplication,
    viewModel,
    toggleSaved,
    sendInterest,
  } = useTalentHomeData({ user });
  const matchedOpportunities = viewModel.opportunities || [];

  const hasExpressedInterest = (startup) => {
    const startupId = String(startup?.startupId || startup?.id || "");
    return viewModel.sentInterestStartupIds.includes(startupId);
  };

  const handleCompleteProfileClick = () => {
    onNavigate?.("settings", { editProfile: true });
  };

  const handleExpressInterest = async () => {
    if (!selectedStartup) return;
    if (!canUsePrimaryTalentActions) {
      toast.info("Complete your profile first", {
        description: `Reach at least ${TALENT_ACTIONS_MIN_COMPLETION}% profile depth to send interest.`,
      });
      handleCompleteProfileClick();
      return;
    }
    if (!interestMessage.trim()) {
      toast.error("Please write a message to express your interest");
      return;
    }
    if (hasExpressedInterest(selectedStartup)) {
      toast.info("You have already expressed interest in this startup");
      return;
    }

    const result = await sendInterest({
      opportunity: selectedStartup,
      message: interestMessage,
    });

    if (!result.success) {
      toast.error(result.error || "Failed to send interest. Please try again.");
      return;
    }

    toast.success("Interest sent. Continue in Inbox > Sent.");
    setInterestMessage("");
    setSelectedStartup(null);
  };

  const isSaved = (itemId, startupId) => {
    const id = String(itemId || "");
    const startup = String(startupId || "");
    return viewModel.savedIdSet.has(id) || viewModel.savedIdSet.has(startup);
  };

  const handleToggleSave = async (startup, e) => {
    e?.stopPropagation();
    const result = await toggleSaved(startup);
    if (!result.success) {
      toast.error(result.error || "Failed to update. Please try again.");
      return;
    }
    toast.success(result.saved ? "Saved for later!" : "Removed from saved");
  };

  const displayedMatches = matchedOpportunities;
  const startupRows = useMemo(
    () =>
      displayedMatches.map((startup, index) => {
        const equityRange = getEquityRange(startup);
        const matchScore = Number(startup.match ?? startup.matchScore ?? 0);
        const teamSize = Number(startup.teamSize || 0);
        const normalizedTags = Array.isArray(startup.tags) ? startup.tags : [];
        const normalizedLookingFor = Array.isArray(startup.lookingFor)
          ? startup.lookingFor
          : [];
        const normalizedStartup = {
          ...startup,
          tags: normalizedTags,
          lookingFor: normalizedLookingFor,
          posted: toRelativePosted(startup.postedDate, startup.posted),
        };
        return {
          id:
            startup.id?.toString() || `${startup.title || "startup"}-${index}`,
          startupId:
            startup.startupId?.toString() ||
            startup.id?.toString() ||
            `${startup.title || "startup"}-${index}`,
          startup: normalizedStartup,
          title: startup.title || "Untitled startup",
          founder: startup.founder || "Founder",
          shortDescription: truncateDescription(startup.description || ""),
          stage: startup.stage || "Unknown stage",
          funding: startup.funding || "Not disclosed",
          commitment: startup.commitment || "Flexible",
          location: startup.location || "Remote",
          teamSize,
          teamSizeBucket: getTeamSizeBucket(teamSize),
          equityRange,
          equityBucket: getEquityBucket(equityRange),
          matchScore: Number.isFinite(matchScore) ? matchScore : 0,
          avatarTone: getAvatarTone(startup.title || "Startup"),
          postedDateValue: startup.postedDate
            ? new Date(startup.postedDate).getTime()
            : 0,
        };
      }),
    [displayedMatches],
  );
  const filterOptions = useMemo(() => {
    const unique = (values) =>
      [...new Set(values.filter(Boolean))].sort((a, b) =>
        String(a).localeCompare(String(b)),
      );
    return {
      stage: unique(startupRows.map((row) => row.stage)),
      funding: unique(startupRows.map((row) => row.funding)),
      commitment: unique(startupRows.map((row) => row.commitment)),
      equity: unique(startupRows.map((row) => row.equityBucket)),
      location: unique(startupRows.map((row) => row.location)),
      teamSize: unique(startupRows.map((row) => row.teamSizeBucket)),
    };
  }, [startupRows]);
  const toggleFilter = (groupKey, optionValue) => {
    setFilters((prev) => {
      const existing = prev[groupKey] || [];
      const nextValues = existing.includes(optionValue)
        ? existing.filter((value) => value !== optionValue)
        : [...existing, optionValue];
      return { ...prev, [groupKey]: nextValues };
    });
  };
  const clearFilters = () => setFilters(FILTER_DEFAULTS);
  const activeFilterCount = Object.values(filters).reduce(
    (total, group) => total + group.length,
    0,
  );
  const filteredRows = useMemo(
    () =>
      startupRows.filter((row) => {
        if (filters.stage.length > 0 && !filters.stage.includes(row.stage)) {
          return false;
        }
        if (
          filters.funding.length > 0 &&
          !filters.funding.includes(row.funding)
        ) {
          return false;
        }
        if (
          filters.commitment.length > 0 &&
          !filters.commitment.includes(row.commitment)
        ) {
          return false;
        }
        if (
          filters.equity.length > 0 &&
          !filters.equity.includes(row.equityBucket)
        ) {
          return false;
        }
        if (
          filters.location.length > 0 &&
          !filters.location.includes(row.location)
        ) {
          return false;
        }
        if (
          filters.teamSize.length > 0 &&
          !filters.teamSize.includes(row.teamSizeBucket)
        ) {
          return false;
        }
        return true;
      }),
    [startupRows, filters],
  );
  const sortedRows = useMemo(() => {
    const rows = [...filteredRows];
    rows.sort((left, right) => {
      if (sortBy === "newest")
        return right.postedDateValue - left.postedDateValue;
      if (sortBy === "equity") {
        return (
          (right.equityRange?.midpoint || -1) -
          (left.equityRange?.midpoint || -1)
        );
      }
      if (sortBy === "teamSize") return right.teamSize - left.teamSize;
      return right.matchScore - left.matchScore;
    });
    return rows;
  }, [filteredRows, sortBy]);
  const showProfileBanner =
    !profileBannerDismissed && talentCompletion < TALENT_ACTIONS_MIN_COMPLETION;
  const hasRows = sortedRows.length > 0;
  const summaryCards = [
    {
      id: "opportunities",
      label: "Opportunities",
      value: viewModel.summary.opportunityCount,
      hint: "Available now",
    },
    {
      id: "saved",
      label: "Saved",
      value: viewModel.summary.savedCount,
      hint: "Watchlist",
    },
    {
      id: "interests",
      label: "Sent interests",
      value: viewModel.summary.sentInterestCount,
      hint: `${viewModel.summary.pendingInterestCount} pending`,
    },
    {
      id: "invitations",
      label: "Inbox invites",
      value: viewModel.summary.invitationCount,
      hint: `${viewModel.summary.pendingInvitationCount} pending`,
    },
  ];

  const topMatches = sortedRows.slice(0, 6);

  const today = new Date();
  const dateLabel = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  if (entryMode !== "opportunities") {
    return (
      <div className="min-h-full bg-surface-page">
        <div className="max-w-7xl mx-auto py-4 space-y-4">
          {/* Welcome Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-heading text-2xl font-extrabold text-text-heading">
                {"Welcome back, "}
                {getFirstName(user?.name) || "New User"}
              </h1>
              <p className="font-body text-sm text-text-muted mt-0.5">
                {dateLabel}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {viewModel.summary.sentInterestCount > 0 && (
                <div
                  className={`flex items-center gap-2 px-3 py-2 ${SETTINGS_CARD}`}
                >
                  <Send className="h-4 w-4 text-primary" />
                  <div className="flex items-center gap-1.5">
                    <span className="font-heading text-base font-bold text-text-heading tabular-nums">
                      {viewModel.summary.sentInterestCount}
                    </span>
                    <p className="font-body text-[11px] font-medium text-text-muted leading-none">
                      Interests sent
                    </p>
                  </div>
                </div>
              )}
              <div
                className={`flex items-center gap-2 px-3 py-2 ${SETTINGS_CARD}`}
              >
                <Bookmark className="h-4 w-4 text-text-muted" />
                <div className="flex items-center gap-1.5">
                  <span className="font-heading text-base font-bold text-text-heading tabular-nums">
                    {viewModel.summary.savedCount}
                  </span>
                  <p className="font-body text-[11px] font-medium text-text-muted leading-none">
                    Saved
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Browse action card */}
          <div
            className={`flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${SETTINGS_CARD}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-tint">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-heading text-base font-bold text-text-heading">
                  Browse startups
                </h2>
                <p className="font-body text-sm text-text-muted mt-1 max-w-xl">
                  Explore open roles and teams that fit your skills.
                </p>
              </div>
            </div>
            <Button
              onClick={() => onNavigate?.("team-matching")}
              className={`shrink-0 gap-2 ${authBtnPrimary}`}
              size="sm"
            >
              <Search className="h-4 w-4" />
              Browse startups
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Recommended section */}
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <ListChecks className="h-4 w-4 text-primary" />
              <h2 className="font-heading text-base font-bold text-text-heading">
                Recommended for you
              </h2>
            </div>
            <p className="font-body text-sm text-text-muted mb-5">
              Based on your title and skills
            </p>

            {isLoading && topMatches.length === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className={`rounded-card p-5 space-y-4 animate-pulse ${SETTINGS_CARD}`}
                  >
                    <div className="flex gap-3">
                      <div className="h-10 w-10 bg-muted rounded-lg shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                    <div className="h-14 bg-muted rounded" />
                    <div className="h-8 bg-muted rounded" />
                    <div className="grid grid-cols-2 gap-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-3 bg-muted rounded" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isLoading && topMatches.length === 0 && (
              <div className={`overflow-hidden ${SETTINGS_CARD}`}>
                <EmptyStateBlock
                  icon={Building2}
                  tone="info"
                  title="No recommendations yet"
                  description="Add more to your profile in Settings to improve matching."
                  className="min-h-[220px] rounded-none bg-transparent"
                  action={
                    <div className="flex w-full max-w-md flex-col items-center gap-4">
                      {!visibleToFoundersInBrowse && (
                        <div className="w-full rounded-input border border-surface-border bg-surface-page px-4 py-3 text-left">
                          <div className="flex gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-tint">
                              <Eye className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-heading text-xs font-semibold text-text-heading">
                                Visible to founders at {TALENT_BROWSE_MIN_COMPLETION}%
                              </p>
                              <p className="font-body text-[11px] text-text-muted mt-1 leading-relaxed">
                                Complete your profile to appear in Browse Talent
                                when founders search for teammates.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-input border-surface-border font-body font-semibold"
                        onClick={handleCompleteProfileClick}
                      >
                        Open profile
                      </Button>
                    </div>
                  }
                />
              </div>
            )}

            {topMatches.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topMatches.map((row) => (
                  <div
                    key={row.id}
                    className={`rounded-card cursor-pointer p-5 flex flex-col gap-3 transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] ${SETTINGS_CARD}`}
                    onClick={() => setSelectedStartup(row.startup)}
                  >
                    {/* Card Header: avatar + title + match badge */}
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 rounded-lg flex-shrink-0">
                        <AvatarFallback
                          className={`rounded-lg text-[13px] font-bold ${row.avatarTone}`}
                        >
                          {getInitials(row.title)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold leading-tight">
                          {row.title}
                        </p>
                        <p className="text-[12px] text-muted-foreground mt-0.5">
                          by {row.founder}
                        </p>
                      </div>
                      <div
                        className={`shrink-0 text-center rounded-lg px-2.5 py-1.5 min-w-[52px] ${getMatchStyle(row.matchScore)}`}
                      >
                        <p className="text-[14px] font-bold leading-none">
                          {row.matchScore}%
                        </p>
                        <p className="text-[10px] leading-none mt-0.5 opacity-80">
                          Match
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-3">
                      {row.startup?.description || row.shortDescription}
                    </p>

                    {/* Role chips */}
                    {row.startup?.lookingFor?.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <div className="flex items-center gap-1 flex-wrap">
                          {row.startup.lookingFor.slice(0, 4).map((role, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-foreground"
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Industry tag */}
                    {(row.startup?.industry || row.startup?.industryFocus) && (
                      <p className="text-[11px] text-muted-foreground -mt-1">
                        {row.startup.industry || row.startup.industryFocus}
                      </p>
                    )}

                    {/* Meta Grid: 2 cols, icon + label left, value right */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[12px]">
                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
                          <TrendingUp className="h-3 w-3 shrink-0" />
                          <span>Stage</span>
                        </div>
                        <p className="font-medium text-foreground">
                          {row.stage}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
                          <DollarSign className="h-3 w-3 shrink-0" />
                          <span>Funding</span>
                        </div>
                        <p className="font-medium text-foreground">
                          {row.funding}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
                          <Users className="h-3 w-3 shrink-0" />
                          <span>Team Size</span>
                        </div>
                        <p className="font-medium text-foreground">
                          {row.teamSize > 0 ? `${row.teamSize} members` : "—"}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span>Location</span>
                        </div>
                        <p className="font-medium text-foreground">
                          {row.location}
                        </p>
                      </div>
                    </div>

                    {/* Footer: Equity + Commitment */}
                    <div className="grid grid-cols-2 gap-4 pt-3 mt-auto border-t border-surface-border">
                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
                          <DollarSign className="h-3 w-3 text-green-600 shrink-0" />
                          <span className="text-[11px]">Equity Offer</span>
                        </div>
                        <p className="text-[13px] font-semibold text-green-600">
                          {row.equityRange ? row.equityRange.label : "N/A"}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
                          <Clock className="h-3 w-3 text-blue-500 shrink-0" />
                          <span className="text-[11px]">Commitment</span>
                        </div>
                        <p className="text-[13px] font-semibold text-blue-600">
                          {row.commitment}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {topMatches.length > 0 && sortedRows.length > 6 && (
              <div className="mt-5 text-center">
                <Button
                  variant="outline"
                  onClick={() => onNavigate?.("team-matching")}
                  className="gap-2"
                >
                  View all {sortedRows.length} matches
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Profile strength floating chip */}
        {talentCompletion < 100 && (
          <button
            type="button"
            className={`fixed bottom-6 right-6 z-50 flex max-w-[min(300px,calc(100vw-2rem))] cursor-pointer flex-col gap-2.5 px-4 py-3.5 text-left transition-shadow hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] ${SETTINGS_CARD}`}
            onClick={handleCompleteProfileClick}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-tint">
                <UserCircle className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="font-heading text-[12px] font-semibold leading-tight text-text-heading">
                    Profile strength
                  </p>
                  <ArrowRight className="h-3 w-3 shrink-0 text-text-muted" />
                </div>
                <div className="flex items-center gap-1.5">
                  <Progress
                    value={talentCompletion}
                    className="h-1.5 flex-1 rounded-pill border-0 bg-surface-border"
                  />
                  <span className="shrink-0 font-body text-[11px] font-bold tabular-nums text-text-heading">
                    {talentCompletion}%
                  </span>
                </div>
              </div>
            </div>
            {!visibleToFoundersInBrowse ? (
              <div className="rounded-input border border-surface-border bg-surface-page px-3 py-2.5">
                <div className="flex gap-2">
                  <Eye className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="font-heading text-[11px] font-semibold text-text-heading">
                      Visible to founders at {TALENT_BROWSE_MIN_COMPLETION}%
                    </p>
                    <p className="mt-0.5 font-body text-[10px] leading-relaxed text-text-muted">
                      Until then, your profile stays out of Browse Talent.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="flex items-center gap-1.5 px-0.5 font-body text-[10px] font-medium text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                You appear in founder Browse Talent
              </p>
            )}
          </button>
        )}

        {/* Detail Dialog (shared with browse view) */}
        <Dialog
          open={selectedStartup !== null}
          onOpenChange={() => {
            setSelectedStartup(null);
            setInterestMessage("");
          }}
        >
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
            {selectedStartup && (
              <>
                <DialogHeader>
                  <div className="flex items-start gap-4 pr-8">
                    <Avatar className="w-16 h-16 flex-shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-lg">
                        {selectedStartup.title
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <DialogTitle className="text-2xl mb-2 pr-0">
                        {selectedStartup.title}
                      </DialogTitle>
                      <DialogDescription className="text-base">
                        {"by "}
                        {selectedStartup.founder}
                        {" • "}
                        {selectedStartup.posted}
                      </DialogDescription>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1.5 rounded-full">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-lg font-semibold text-primary">
                            {selectedStartup.match}%
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Match
                          </span>
                        </div>
                        <Badge variant="outline">
                          {selectedStartup.industry}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </DialogHeader>
                <div className="space-y-6 mt-6">
                  <div className="pb-4 border-b">
                    <p className="text-muted-foreground leading-relaxed">
                      {selectedStartup.description}
                    </p>
                  </div>
                  <div>
                    <div className="flex flex-wrap gap-2">
                      {(selectedStartup.tags || []).map((tag, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-2 min-w-0">
                      <TrendingUp className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-muted-foreground">Stage</p>
                        <p className="font-medium break-words">
                          {selectedStartup.stage}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 min-w-0">
                      <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-muted-foreground">
                          Location
                        </p>
                        <p className="font-medium break-words">
                          {selectedStartup.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 min-w-0">
                      <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-muted-foreground">
                          Commitment
                        </p>
                        <p className="font-medium break-words">
                          {selectedStartup.commitment}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 min-w-0">
                      <Users className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-muted-foreground">
                          Interested
                        </p>
                        <p className="font-medium">
                          {selectedStartup.interested}
                          {" people"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Looking for:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(selectedStartup.lookingFor || []).map((role, idx) => (
                        <Badge key={idx} className="text-sm py-1.5 px-3">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {selectedStartup.offer && (
                    <div className="w-full overflow-hidden">
                      <OfferDisplay offer={selectedStartup.offer} />
                    </div>
                  )}
                  {!hasExpressedInterest(selectedStartup) && (
                    <div className="pt-4 border-t space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-2">
                          Why are you interested?
                        </p>
                        <Textarea
                          placeholder={`Tell ${selectedStartup.founder} about your background, what excites you about this idea, and what value you can bring to the team...`}
                          rows={5}
                          value={interestMessage}
                          onChange={(e) => setInterestMessage(e.target.value)}
                          className="resize-none"
                        />
                      </div>
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={handleExpressInterest}
                        disabled={
                          !interestMessage.trim() || isSubmittingApplication
                        }
                      >
                        <Send className="w-5 h-5 mr-2" />
                        {isSubmittingApplication
                          ? "Sending..."
                          : "Send Interest"}
                      </Button>
                    </div>
                  )}
                  {hasExpressedInterest(selectedStartup) && (
                    <div className="pt-4 border-t">
                      <Button className="w-full" size="lg" disabled={true}>
                        <Target className="w-5 h-5 mr-2" />
                        Interest Expressed
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3">
      {showProfileBanner && (
        <div className={`px-4 py-3 ${SETTINGS_CARD}`}>
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
            <div className="flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-heading text-[13px] font-semibold text-text-heading">
                    Complete your profile
                  </p>
                  <p className="font-body text-[12px] text-text-muted mt-0.5">
                    Reach {TALENT_ACTIONS_MIN_COMPLETION}% profile strength to
                    unlock browsing and applications.
                  </p>
                  {!visibleToFoundersInBrowse ? (
                    <p className="mt-2 font-body text-[11px] leading-snug text-text-body border-l-2 border-primary/40 pl-2">
                      Founders only see profiles at{" "}
                      <span className="font-semibold tabular-nums">
                        {TALENT_BROWSE_MIN_COMPLETION}%+
                      </span>{" "}
                      in Browse Talent—finish yours in Settings → Profile.
                    </p>
                  ) : (
                    <p className="mt-2 text-[11px] leading-snug text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      Your profile is listed for founders in Browse Talent.
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setProfileBannerDismissed(true)}
                  className="rounded p-1 text-text-muted hover:bg-surface-page"
                  aria-label="Dismiss profile completion banner"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="min-w-[160px] flex-1">
                  <Progress value={talentCompletion} className="h-1.5" />
                </div>
                <span className="font-body text-[12px] font-semibold text-text-heading tabular-nums">
                  {talentCompletion}%
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 rounded-input border-surface-border px-3 text-[12px] font-body"
                  onClick={handleCompleteProfileClick}
                >
                  Continue profile
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <article
            key={card.id}
            className="rounded-md border border-border bg-background px-3 py-2"
          >
            <p className="text-[12px] uppercase tracking-[0.04em] text-muted-foreground">
              {card.label}
            </p>
            <p className="text-[20px] font-semibold text-foreground">
              {card.value}
            </p>
            <p className="text-[12px] text-muted-foreground">{card.hint}</p>
          </article>
        ))}
      </div>
      {viewModel.fallbackUsed && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
          Some sections are using cached fallback data while backend sync
          recovers.
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="h-fit rounded-md border border-border bg-background p-4">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-[13px] font-medium uppercase tracking-[0.05em] text-muted-foreground">
              Filters
            </h2>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-[12px] text-muted-foreground underline-offset-2 hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="space-y-5">
            {FILTER_GROUPS.map((group) => {
              const groupOptions = filterOptions[group.key] || [];
              return (
                <details key={group.key} open>
                  <summary className="cursor-pointer list-none text-[13px] font-medium uppercase tracking-[0.04em] text-foreground">
                    {group.label}
                  </summary>
                  <div className="mt-3 space-y-2">
                    {groupOptions.length === 0 && (
                      <p className="text-[12px] text-muted-foreground">
                        No options
                      </p>
                    )}
                    {groupOptions.map((option) => {
                      const optionId = `${group.key}-${String(option)
                        .replace(/\s+/g, "-")
                        .toLowerCase()}`;
                      const isChecked = filters[group.key]?.includes(option);
                      return (
                        <div key={optionId} className="flex items-center gap-2">
                          <input
                            id={optionId}
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleFilter(group.key, option)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <label
                            htmlFor={optionId}
                            className="cursor-pointer text-[12px] text-muted-foreground"
                          >
                            {option}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </div>
        </aside>
        <section className="rounded-md border border-border bg-background">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
            <p className="text-[13px] font-medium uppercase tracking-[0.05em] text-muted-foreground">
              {sortedRows.length} results
            </p>
            <div className="flex items-center gap-2">
              {isLoading && (
                <span className="text-[11px] uppercase tracking-[0.04em] text-muted-foreground">
                  Refreshing...
                </span>
              )}
              <label
                htmlFor="match-sort"
                className="text-[12px] text-muted-foreground"
              >
                Sort
              </label>
              <select
                id="match-sort"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="h-8 rounded-[4px] border border-input bg-background px-2 text-[12px]"
              >
                <option value="bestMatch">Best Match</option>
                <option value="newest">Newest</option>
                <option value="equity">Equity %</option>
                <option value="teamSize">Team Size</option>
              </select>
              <div
                role="group"
                aria-label="Layout toggle"
                className="ml-1 flex items-center gap-1 rounded-[4px] border border-border p-1"
              >
                <button
                  type="button"
                  onClick={() => setLayoutMode("list")}
                  className={`rounded p-1 ${layoutMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                  aria-label="Show list layout"
                  aria-pressed={layoutMode === "list"}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode("grid")}
                  className={`rounded p-1 ${layoutMode === "grid" ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                  aria-label="Show grid layout"
                  aria-pressed={layoutMode === "grid"}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          {isLoading && !hasRows && (
            <div className="px-4 py-8 text-[13px] text-muted-foreground">
              Loading startup matches...
            </div>
          )}
          {!!error && !hasRows && (
            <div className="px-4 py-8 text-[13px] text-red-600">{error}</div>
          )}
          {!isLoading && !error && !hasRows && (
            <div className="space-y-3 px-4 py-8">
              <p className="text-[13px] text-muted-foreground">
                No startups match your selected filters.
              </p>
              <Button
                type="button"
                variant="outline"
                className="h-7 rounded-[4px] border-[#D1D5DB] px-3 text-[12px] hover:border-indigo-500"
                onClick={clearFilters}
              >
                Reset filters
              </Button>
            </div>
          )}
          {hasRows && layoutMode === "list" && (
            <ul className="divide-y divide-border">
              {sortedRows.map((row) => (
                <li key={row.id} className="px-4 py-3">
                  <div className="flex items-start gap-3 lg:items-center">
                    <Avatar className="h-8 w-8 rounded-[6px]">
                      <AvatarFallback
                        className={`rounded-[6px] font-mono text-[12px] ${row.avatarTone}`}
                      >
                        {getInitials(row.title)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[14px] font-medium">
                          {row.title}
                        </p>
                        <span
                          aria-label={`${row.matchScore}% match score`}
                          className={`inline-flex h-[22px] items-center rounded-[4px] px-2 text-[11px] font-semibold uppercase tracking-[0.03em] ${getMatchStyle(row.matchScore)}`}
                        >
                          {row.matchScore}%
                        </span>
                      </div>
                      <p className="truncate text-[12px] text-muted-foreground">
                        {row.founder}
                      </p>
                      <p className="truncate text-[12px] text-muted-foreground">
                        {row.shortDescription}
                      </p>
                    </div>
                    <div className="hidden items-center gap-1.5 lg:flex">
                      <span className="inline-flex h-5 items-center rounded-[3px] bg-[#F3F4F6] px-2 text-[11px] uppercase tracking-[0.05em] text-[#374151]">
                        {row.stage}
                      </span>
                      <span className="inline-flex h-5 items-center rounded-[3px] bg-[#F3F4F6] px-2 text-[11px] uppercase tracking-[0.05em] text-[#374151]">
                        {row.funding}
                      </span>
                      <span className="inline-flex h-5 items-center rounded-[3px] border border-border px-2 text-[11px] uppercase tracking-[0.05em] text-muted-foreground">
                        EQ {row.equityRange?.label || "N/A"}
                      </span>
                      <span className="inline-flex h-5 items-center rounded-[3px] border border-border px-2 text-[11px] uppercase tracking-[0.05em] text-muted-foreground">
                        {row.commitment}
                      </span>
                    </div>
                    <div className="ml-auto flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(event) =>
                          handleToggleSave(row.startup, event)
                        }
                        disabled={savingItems.has(String(row.id))}
                        aria-label={`Save ${row.title}`}
                        aria-pressed={isSaved(row.id, row.startupId)}
                      >
                        <Heart
                          className={`h-4 w-4 transition-colors ${
                            isSaved(row.id, row.startupId)
                              ? "fill-red-500 text-red-500"
                              : "text-muted-foreground hover:fill-red-500 hover:text-red-500"
                          }`}
                        />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-7 rounded-[4px] border-[#D1D5DB] px-3 text-[12px] hover:border-[#6366F1]"
                        onClick={() => setSelectedStartup(row.startup)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5 lg:hidden">
                    <span className="inline-flex h-5 items-center rounded-[3px] bg-[#F3F4F6] px-2 text-[11px] uppercase tracking-[0.05em] text-[#374151]">
                      {row.stage}
                    </span>
                    <span className="inline-flex h-5 items-center rounded-[3px] bg-[#F3F4F6] px-2 text-[11px] uppercase tracking-[0.05em] text-[#374151]">
                      {row.funding}
                    </span>
                    <span className="inline-flex h-5 items-center rounded-[3px] border border-border px-2 text-[11px] uppercase tracking-[0.05em] text-muted-foreground">
                      EQ {row.equityRange?.label || "N/A"}
                    </span>
                    <span className="inline-flex h-5 items-center rounded-[3px] border border-border px-2 text-[11px] uppercase tracking-[0.05em] text-muted-foreground">
                      {row.commitment}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {hasRows && layoutMode === "grid" && (
            <div className="grid grid-cols-1 gap-0 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0">
              {sortedRows.map((row) => (
                <div key={row.id} className="space-y-3 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 rounded-[6px]">
                      <AvatarFallback
                        className={`rounded-[6px] font-mono text-[12px] ${row.avatarTone}`}
                      >
                        {getInitials(row.title)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[14px] font-medium">
                          {row.title}
                        </p>
                        <span
                          aria-label={`${row.matchScore}% match score`}
                          className={`inline-flex h-[22px] items-center rounded-[4px] px-2 text-[11px] font-semibold uppercase tracking-[0.03em] ${getMatchStyle(row.matchScore)}`}
                        >
                          {row.matchScore}%
                        </span>
                      </div>
                      <p className="truncate text-[12px] text-muted-foreground">
                        {row.founder}
                      </p>
                    </div>
                  </div>
                  <p className="truncate text-[12px] text-muted-foreground">
                    {row.shortDescription}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="inline-flex h-5 items-center rounded-[3px] bg-[#F3F4F6] px-2 text-[11px] uppercase tracking-[0.05em] text-[#374151]">
                      {row.stage}
                    </span>
                    <span className="inline-flex h-5 items-center rounded-[3px] bg-[#F3F4F6] px-2 text-[11px] uppercase tracking-[0.05em] text-[#374151]">
                      {row.funding}
                    </span>
                    <span className="inline-flex h-5 items-center rounded-[3px] border border-border px-2 text-[11px] uppercase tracking-[0.05em] text-muted-foreground">
                      EQ {row.equityRange?.label || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(event) => handleToggleSave(row.startup, event)}
                      disabled={savingItems.has(String(row.id))}
                      aria-label={`Save ${row.title}`}
                      aria-pressed={isSaved(row.id, row.startupId)}
                    >
                      <Heart
                        className={`h-4 w-4 transition-colors ${
                          isSaved(row.id, row.startupId)
                            ? "fill-red-500 text-red-500"
                            : "text-muted-foreground hover:fill-red-500 hover:text-red-500"
                        }`}
                      />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-7 rounded-[4px] border-[#D1D5DB] px-3 text-[12px] hover:border-[#6366F1]"
                      onClick={() => setSelectedStartup(row.startup)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      <Dialog
        open={selectedStartup !== null}
        onOpenChange={() => {
          setSelectedStartup(null);
          setInterestMessage("");
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
          {selectedStartup && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-4 pr-8">
                  <Avatar className="w-16 h-16 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {selectedStartup.title
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-2xl mb-2 pr-0">
                      {selectedStartup.title}
                    </DialogTitle>
                    <DialogDescription className="text-base">
                      {"by "}
                      {selectedStartup.founder}
                      {" • "}
                      {selectedStartup.posted}
                    </DialogDescription>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1.5 rounded-full">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-lg font-semibold text-primary">
                          {selectedStartup.match}%
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Match
                        </span>
                      </div>
                      <Badge variant="outline">
                        {selectedStartup.industry}
                      </Badge>
                    </div>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-6 mt-6">
                <div className="pb-4 border-b">
                  <p className="text-muted-foreground leading-relaxed">
                    {selectedStartup.description}
                  </p>
                </div>
                <div>
                  <div className="flex flex-wrap gap-2">
                    {(selectedStartup.tags || []).map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-2 min-w-0">
                    <TrendingUp className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-muted-foreground">Stage</p>
                      <p className="font-medium break-words">
                        {selectedStartup.stage}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 min-w-0">
                    <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium break-words">
                        {selectedStartup.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 min-w-0">
                    <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-muted-foreground">
                        Commitment
                      </p>
                      <p className="font-medium break-words">
                        {selectedStartup.commitment}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 min-w-0">
                    <Users className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-muted-foreground">
                        Interested
                      </p>
                      <p className="font-medium">
                        {selectedStartup.interested}
                        {" people"}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Looking for:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(selectedStartup.lookingFor || []).map((role, idx) => (
                      <Badge key={idx} className="text-sm py-1.5 px-3">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
                {selectedStartup.offer && (
                  <div className="w-full overflow-hidden">
                    <OfferDisplay offer={selectedStartup.offer} />
                  </div>
                )}
                {!hasExpressedInterest(selectedStartup) && (
                  <div className="pt-4 border-t space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-2">
                        Why are you interested?
                      </p>
                      <Textarea
                        placeholder={`Tell ${selectedStartup.founder} about your background, what excites you about this idea, and what value you can bring to the team...`}
                        rows={5}
                        value={interestMessage}
                        onChange={(e) => setInterestMessage(e.target.value)}
                        className="resize-none"
                      />
                    </div>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleExpressInterest}
                      disabled={
                        !interestMessage.trim() || isSubmittingApplication
                      }
                    >
                      <Send className="w-5 h-5 mr-2" />
                      {isSubmittingApplication ? "Sending..." : "Send Interest"}
                    </Button>
                  </div>
                )}
                {hasExpressedInterest(selectedStartup) && (
                  <div className="pt-4 border-t">
                    <Button className="w-full" size="lg" disabled={true}>
                      <Target className="w-5 h-5 mr-2" />
                      Interest Expressed
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
