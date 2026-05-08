import React, { useMemo, useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Textarea } from "../ui/textarea";
import { Progress } from "../ui/progress";
import ProfileCompletionModal from "../ProfileCompletionModal";
import OfferDisplay from "../OfferDisplay";
import { toast } from "sonner";
import { getTalentProfileCompletionPercent } from "../../utils/talentProfileCompletion";
import { TALENT_ACTIONS_MIN_COMPLETION } from "../../constants/talentProfile.js";
import { useTalentHomeData } from "../../domains/talent/hooks/useTalentHomeData";
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
} from "lucide-react";
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
}) {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const talentCompletion = getTalentProfileCompletionPercent(user);
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
    refresh,
  } = useTalentHomeData({ user });
  const matchedOpportunities = viewModel.opportunities || [];


  const hasExpressedInterest = (startup) => {
    const startupId = String(startup?.startupId || startup?.id || "");
    return viewModel.sentInterestStartupIds.includes(startupId);
  };

  const handleProfileComplete = async () => {
    await refresh();
    setShowProfileModal(false);
  };

  const handleExpressInterest = async () => {
    if (!selectedStartup) return;
    if (!canUsePrimaryTalentActions) {
      toast.info("Complete your profile first", {
        description: `Reach at least ${TALENT_ACTIONS_MIN_COMPLETION}% profile depth to send interest.`,
      });
      setShowProfileModal(true);
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
          id: startup.id?.toString() || `${startup.title || "startup"}-${index}`,
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
        if (filters.equity.length > 0 && !filters.equity.includes(row.equityBucket)) {
          return false;
        }
        if (filters.location.length > 0 && !filters.location.includes(row.location)) {
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
      if (sortBy === "newest") return right.postedDateValue - left.postedDateValue;
      if (sortBy === "equity") {
        return (
          (right.equityRange?.midpoint || -1) - (left.equityRange?.midpoint || -1)
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
  return (
    <div className="space-y-3 p-3">
      {showProfileModal && (
        <ProfileCompletionModal
          role={user.role}
          user={user}
          onUpdateUser={onUpdateUser}
          onComplete={handleProfileComplete}
          onClose={() => setShowProfileModal(false)}
        />
      )}
      {showProfileBanner && (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-700" />
            <div className="flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] font-medium uppercase tracking-[0.04em] text-blue-900">
                    Complete your profile
                  </p>
                  <p className="text-[12px] text-blue-800">
                    Reach {TALENT_ACTIONS_MIN_COMPLETION}% profile strength to
                    unlock browsing and applications.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setProfileBannerDismissed(true)}
                  className="rounded p-1 text-blue-700 hover:bg-blue-100"
                  aria-label="Dismiss profile completion banner"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="min-w-[160px] flex-1">
                  <Progress value={talentCompletion} className="h-1.5" />
                </div>
                <span className="text-[12px] font-semibold text-blue-900">
                  {talentCompletion}%
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 rounded-[4px] border-blue-300 px-3 text-[12px] hover:border-indigo-500"
                  onClick={() => setShowProfileModal(true)}
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
            <p className="text-[20px] font-semibold text-foreground">{card.value}</p>
            <p className="text-[12px] text-muted-foreground">{card.hint}</p>
          </article>
        ))}
      </div>
      {viewModel.fallbackUsed && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
          Some sections are using cached fallback data while backend sync recovers.
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
                        <p className="truncate text-[14px] font-medium">{row.title}</p>
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
                        <p className="truncate text-[14px] font-medium">{row.title}</p>
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
                      <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-950/20 px-3 py-1.5 rounded-full">
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
