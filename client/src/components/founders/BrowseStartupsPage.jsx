import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { toast } from "sonner";
import * as founderApi from "../../utils/api/founderApi";
import {
  ArrowLeft,
  Search,
  Building2,
  MapPin,
  Users,
  Briefcase,
  ExternalLink,
  Clock,
  Rocket,
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
    <div className="min-h-screen bg-surface-page">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => onNavigate?.("dashboard")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Rocket className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-text-heading">Browse Startups</h1>
                <p className="text-text-muted mt-1">
                  Discover exciting opportunities and find your next startup adventure
                </p>
              </div>
            </div>
            {user?.role === "founder" && (
              <Button
                onClick={() => onNavigate?.("post-startup")}
                className="bg-primary hover:bg-primary-hover"
              >
                <Building2 className="w-4 h-4 mr-2" />
                Post Your Startup
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <Input
                placeholder="Search startups by name, description, founder, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 bg-surface-card border-surface-border focus:border-primary"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="h-12 px-4"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              <ChevronDown
                className={`w-4 h-4 ml-2 transition-transform ${showFilters ? "rotate-180" : ""}`}
              />
            </Button>
          </div>

          {showFilters && (
            <Card className="surface-card border-surface-border">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-text-heading mb-2 block">
                      Industry
                    </label>
                    <select
                      value={selectedIndustry}
                      onChange={(e) => setSelectedIndustry(e.target.value)}
                      className="w-full h-10 rounded-md border border-surface-border bg-surface-page px-3 text-sm focus:border-primary focus:outline-none"
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
                      className="w-full h-10 rounded-md border border-surface-border bg-surface-page px-3 text-sm focus:border-primary focus:outline-none"
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
                      className="w-full h-10 rounded-md border border-surface-border bg-surface-page px-3 text-sm focus:border-primary focus:outline-none"
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
        <div className="mb-4 flex items-center justify-between">
          <p className="text-text-muted">
            Showing <span className="font-semibold text-text-heading">{filteredStartups.length}</span> startups
          </p>
          {favorites.size > 0 && (
            <p className="text-sm text-primary">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStartups.map((startup) => (
              <Card
                key={startup.id}
                className="surface-card border-surface-border hover:border-primary/50 hover:shadow-lg transition-all group cursor-pointer"
                onClick={() => onViewStartup?.(startup)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                        {startup.title?.charAt(0).toUpperCase() || "S"}
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-text-heading line-clamp-1">
                          {startup.title}
                        </CardTitle>
                        <p className="text-sm text-text-muted">by {startup.founder}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(startup.id);
                      }}
                      className="p-2 hover:bg-surface-page rounded-full transition-colors"
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
                <CardContent className="pt-0">
                  <p className="text-text-body text-sm line-clamp-3 mb-4">
                    {startup.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary" className="text-xs">
                      {startup.industry}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {startup.stage}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2 text-text-muted">
                      <MapPin className="w-4 h-4" />
                      <span>{startup.location || "Remote"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-muted">
                      <Briefcase className="w-4 h-4" />
                      <span>{startup.commitment}</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-muted">
                      <Users className="w-4 h-4" />
                      <span>Looking for: {startup.lookingFor?.slice(0, 2).join(", ")}
                        {startup.lookingFor?.length > 2 && "..."}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-text-muted">
                      <Clock className="w-4 h-4" />
                      <span>Posted {formatDate(startup.postedDate)}</span>
                    </div>
                  </div>

                  {startup.offer && (
                    <div className="bg-primary/5 rounded-lg p-3 mb-4">
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
                    className="w-full group-hover:bg-primary group-hover:text-white transition-colors"
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BrowseStartupsPage;
