import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { toast } from "sonner";
import * as founderApi from "../../utils/api/founderApi";
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
  Sparkles,
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
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 rounded-card border border-surface-border bg-surface-card p-4 shadow-soft">
          <p className="text-sm font-semibold text-text-heading">Find startup opportunities</p>
          <p className="mt-1 text-sm text-text-muted">
            Discover active startup posts, review role requirements, and open details to apply.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <Input
                placeholder="Search startups by name, description, founder, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 rounded-input border-surface-border bg-surface-card pl-10 text-sm"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="h-12 rounded-input px-4"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              <ChevronDown
                className={`w-4 h-4 ml-2 transition-transform ${showFilters ? "rotate-180" : ""}`}
              />
            </Button>
          </div>

          {showFilters && (
            <Card className="rounded-card border-surface-border bg-surface-card shadow-soft">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-text-heading mb-2 block">
                      Industry
                    </label>
                    <select
                      value={selectedIndustry}
                      onChange={(e) => setSelectedIndustry(e.target.value)}
                      className="h-10 w-full rounded-input border border-surface-border bg-surface-page px-3 text-sm focus:border-primary focus:outline-none"
                    >
                      {INDUSTRIES.map((ind) => (
                        <option key={ind} value={ind}>
                          {ind}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text-heading mb-2 block">
                      Stage
                    </label>
                    <select
                      value={selectedStage}
                      onChange={(e) => setSelectedStage(e.target.value)}
                      className="h-10 w-full rounded-input border border-surface-border bg-surface-page px-3 text-sm focus:border-primary focus:outline-none"
                    >
                      {STAGES.map((stage) => (
                        <option key={stage} value={stage}>
                          {stage}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text-heading mb-2 block">
                      Commitment
                    </label>
                    <select
                      value={selectedCommitment}
                      onChange={(e) => setSelectedCommitment(e.target.value)}
                      className="h-10 w-full rounded-input border border-surface-border bg-surface-page px-3 text-sm focus:border-primary focus:outline-none"
                    >
                      {COMMITMENTS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-text-muted">
            Showing <span className="font-semibold text-text-heading">{filteredStartups.length}</span> startups
          </p>
          {favorites.size > 0 && (
            <p className="text-sm font-medium text-primary">
              <Heart className="w-4 h-4 inline mr-1" />
              {favorites.size} favorites
            </p>
          )}
        </div>

        {/* Startup Grid */}
        {filteredStartups.length === 0 ? (
          <Card className="surface-card border-surface-border">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-surface-page flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-text-muted" />
              </div>
              <h3 className="text-lg font-semibold text-text-heading mb-2">No startups found</h3>
              <p className="text-text-muted max-w-md mx-auto">
                Try adjusting your search filters or check back later for new opportunities.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedIndustry("All");
                  setSelectedStage("All");
                  setSelectedCommitment("All");
                }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredStartups.map((startup) => {
              const meta = startupMeta(startup);
              return (
              <Card
                key={startup.id}
                className="group flex h-full cursor-pointer flex-col rounded-card border border-surface-border bg-surface-card shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-md"
                onClick={() => onViewStartup?.(startup)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-base font-bold text-primary">
                        {startup.title?.charAt(0).toUpperCase() || "S"}
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="line-clamp-1 text-lg font-semibold text-text-heading">
                          {startup.title}
                        </CardTitle>
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

                  {startup.offer && (
                    <div className="mb-4 rounded-lg bg-primary/5 p-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-text-heading font-medium">
                          {startup.offer.compensationPhilosophy === "equity-focused"
                            ? "High Equity Opportunity"
                            : startup.offer.compensationPhilosophy === "balanced"
                            ? "Equity + Salary"
                            : "Competitive Salary"}
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
