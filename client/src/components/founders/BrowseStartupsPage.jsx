import React, { useState, useEffect, useMemo } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { toast } from "sonner";
import * as founderApi from "../../utils/api/founderApi";
import { StartupAvatar } from "./StartupBrandingFields";
import EmptyStateBlock from "../organizations/_primitives/EmptyStateBlock";
import { authFieldClass } from "../auth/AuthPrimitives";
import {
  SETTINGS_CARD,
  settingsBtnOutline,
} from "../settings/SettingsPrimitives";
import { cn } from "../ui/utils";
import {
  Search,
  MapPin,
  Users,
  Briefcase,
  ExternalLink,
  Clock,
  Filter,
  ChevronDown,
  Heart,
  Building2,
  DollarSign,
} from "lucide-react";

const INDUSTRIES = [
  "All",
  "HealthTech",
  "EdTech",
  "FinTech",
  "E-Commerce",
  "CleanTech",
  "SaaS",
  "AI/ML",
  "Other",
];

const STAGES = [
  "All",
  "Idea Stage",
  "MVP Development",
  "Early Traction",
  "Growth",
];

const COMMITMENTS = ["All", "Full-time", "Part-time", "Contract", "Flexible"];

function getCompensationLabel(philosophy) {
  if (philosophy === "equity-focused") return "Equity-focused";
  if (philosophy === "balanced") return "Balanced package";
  if (philosophy === "cash-focused") return "Salary-focused";
  return "Compensation details available";
}

export function BrowseStartupsPage({ user, onNavigate, onViewStartup }) {
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("All");
  const [selectedStage, setSelectedStage] = useState("All");
  const [selectedCommitment, setSelectedCommitment] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState(new Set());

  useEffect(() => {
    fetchStartups();
  }, []);

  const fetchStartups = async () => {
    try {
      const response = await founderApi.getAllPosts();
      if (response.success) {
        setStartups(response.posts || []);
      } else {
        toast.error("Failed to load startups");
      }
    } catch (error) {
      console.error("Error fetching startups:", error);
      toast.error("Failed to load startups");
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (startupId) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(startupId)) {
        newFavorites.delete(startupId);
        toast.success("Removed from favorites");
      } else {
        newFavorites.add(startupId);
        toast.success("Added to favorites");
      }
      return newFavorites;
    });
  };

  const filteredStartups = startups.filter((startup) => {
    const matchesSearch =
      startup.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      startup.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      startup.founder?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      startup.lookingFor?.some((role) =>
        role.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesIndustry =
      selectedIndustry === "All" || startup.industry === selectedIndustry;
    const matchesStage =
      selectedStage === "All" || startup.stage === selectedStage;
    const matchesCommitment =
      selectedCommitment === "All" || startup.commitment === selectedCommitment;

    return matchesSearch && matchesIndustry && matchesStage && matchesCommitment;
  });

  const hasActiveFilters = useMemo(
    () =>
      Boolean(searchQuery.trim()) ||
      selectedIndustry !== "All" ||
      selectedStage !== "All" ||
      selectedCommitment !== "All",
    [searchQuery, selectedIndustry, selectedStage, selectedCommitment],
  );

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedIndustry("All");
    setSelectedStage("All");
    setSelectedCommitment("All");
  };

  const formatDate = (date) => {
    if (!date) return "Recently";
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return d.toLocaleDateString();
  };

  const startupMeta = (startup) => {
    const roles = Array.isArray(startup.lookingFor) ? startup.lookingFor.filter(Boolean) : [];
    const rolesLabel =
      roles.length === 0
        ? "Role requirements not specified"
        : roles.length <= 2
          ? roles.join(", ")
          : `${roles.slice(0, 2).join(", ")} +${roles.length - 2} more`;

    return {
      founderName: startup.founder || startup.founderName || "Founder",
      location: startup.location || "Remote / Flexible",
      commitment: startup.commitment || "Flexible",
      industry: startup.industry || "General",
      stage: startup.stage || "Not specified",
      rolesLabel,
      description:
        startup.description?.trim() ||
        "No public description yet. Open details to learn more about this opportunity.",
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-page flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-text-muted text-sm">Loading startups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-surface-page p-2 font-body md:p-3 lg:p-4">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className={cn("flex items-start gap-3 p-4", SETTINGS_CARD)}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-tint">
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-base font-bold text-text-heading">
              Browse startups
            </h1>
            <p className="mt-1 font-body text-sm text-text-muted max-w-2xl">
              Open roles from active founder posts. Review requirements and express
              interest from the detail page.
            </p>
          </div>
        </div>

        <div className={cn("space-y-4 p-4", SETTINGS_CARD)}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input
                placeholder="Search by name, description, founder, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(authFieldClass, "h-10 bg-surface-page pl-9")}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={cn("h-10 shrink-0", settingsBtnOutline)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              <ChevronDown
                className={cn(
                  "h-4 w-4 ml-2 transition-transform",
                  showFilters && "rotate-180",
                )}
              />
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 gap-4 border-t border-surface-border pt-4 sm:grid-cols-3">
              <div>
                <label className="mb-2 block font-body text-sm text-text-heading">
                  Industry
                </label>
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="h-10 w-full rounded-input border border-surface-border bg-surface-page px-3 font-body text-sm focus:border-primary focus:outline-none"
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block font-body text-sm text-text-heading">
                  Stage
                </label>
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="h-10 w-full rounded-input border border-surface-border bg-surface-page px-3 font-body text-sm focus:border-primary focus:outline-none"
                >
                  {STAGES.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block font-body text-sm text-text-heading">
                  Commitment
                </label>
                <select
                  value={selectedCommitment}
                  onChange={(e) => setSelectedCommitment(e.target.value)}
                  className="h-10 w-full rounded-input border border-surface-border bg-surface-page px-3 font-body text-sm focus:border-primary focus:outline-none"
                >
                  {COMMITMENTS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-body text-sm text-text-muted">
            Showing{" "}
            <span className="font-semibold text-text-heading tabular-nums">
              {filteredStartups.length}
            </span>{" "}
            {filteredStartups.length === 1 ? "result" : "results"}
          </p>
          {favorites.size > 0 && (
            <p className="text-sm font-medium text-primary">
              <Heart className="w-4 h-4 inline mr-1" />
              {favorites.size} favorites
            </p>
          )}
        </div>

        {filteredStartups.length === 0 ? (
          <div className={cn("overflow-hidden", SETTINGS_CARD)}>
            <EmptyStateBlock
              icon={Building2}
              tone="info"
              title="No startups match your search"
              description={
                hasActiveFilters
                  ? "Try clearing filters or broadening your search."
                  : "No founder posts are live yet. Check back soon."
              }
              className="min-h-[220px] rounded-none bg-transparent"
              action={
                hasActiveFilters ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearFilters}
                    className={settingsBtnOutline}
                  >
                    Clear filters
                  </Button>
                ) : null
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredStartups.map((startup) => {
              const meta = startupMeta(startup);
              return (
              <Card
                key={startup.id}
                className={cn(
                  "group flex h-full cursor-pointer flex-col transition-shadow hover:border-primary/30 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]",
                  SETTINGS_CARD,
                )}
                onClick={() => onViewStartup?.(startup)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <StartupAvatar
                        title={startup.title}
                        logoUrl={startup.logoUrl || startup.logo}
                        brandColor={startup.brandColor}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <CardTitle className="line-clamp-1 text-lg font-semibold text-text-heading">
                          {startup.title}
                        </CardTitle>
                        {startup.tagline ? (
                          <p className="line-clamp-1 text-xs font-medium text-primary">
                            {startup.tagline}
                          </p>
                        ) : null}
                        <p className="line-clamp-1 text-sm text-text-muted">by {meta.founderName}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(startup.id);
                      }}
                      className="rounded-full p-2 transition-colors hover:bg-surface-page"
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          favorites.has(startup.id)
                            ? "fill-red-500 text-red-500"
                            : "text-text-muted hover:text-red-400"
                        }`}
                      />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col pt-0">
                  <p className="mb-4 min-h-[4.5rem] text-sm leading-6 text-text-body line-clamp-3">
                    {meta.description}
                  </p>

                  <div className="mb-4 flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {meta.industry}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {meta.stage}
                    </Badge>
                  </div>

                  <div className="mb-4 space-y-2 border-t border-surface-border pt-4 text-sm">
                    <div className="flex items-center gap-2 text-text-muted">
                      <MapPin className="w-4 h-4" />
                      <span className="line-clamp-1">{meta.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-muted">
                      <Briefcase className="w-4 h-4" />
                      <span className="line-clamp-1">{meta.commitment}</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-muted">
                      <Users className="h-4 w-4 shrink-0" />
                      <span className="line-clamp-2">Looking for: {meta.rolesLabel}</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-muted">
                      <Clock className="h-4 w-4 shrink-0" />
                      <span>Posted {formatDate(startup.postedDate)}</span>
                    </div>
                  </div>

                  {startup.offer?.compensationPhilosophy && (
                    <div className="mb-4 rounded-input border border-surface-border bg-surface-page px-3 py-2">
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 shrink-0 text-text-muted" />
                        <span className="font-body font-medium text-text-heading">
                          {getCompensationLabel(startup.offer.compensationPhilosophy)}
                        </span>
                      </div>
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    className="mt-auto w-full rounded-input border border-surface-border bg-surface-page text-sm font-medium text-text-heading transition-colors hover:border-primary hover:bg-primary hover:text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewStartup?.(startup);
                    }}
                  >
                    View Details
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )})}
          </div>
        )}
      </div>
    </div>
  );
}

export default BrowseStartupsPage;
