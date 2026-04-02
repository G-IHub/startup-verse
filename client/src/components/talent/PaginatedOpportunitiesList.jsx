import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { usePagination } from "../../hooks/usePagination";
import { PaginationControls } from "../shared/PaginationControls";
import * as founderApi from "../../utils/api/founderApi";
import {
  Briefcase,
  MapPin,
  Users,
  Star,
  Heart,
  Search,
  Building,
  AlertCircle,
  Sparkles,
} from "lucide-react";
export function PaginatedOpportunitiesList({
  userId,
  userProfile,
  onOpportunityClick,
  onSaveOpportunity,
  savedOpportunityIds = new Set(),
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");

  // ✅ Use pagination hook for opportunities
  const {
    data: opportunities,
    loading,
    error,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    hasNext,
    hasPrev,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
    refresh,
  } = usePagination({
    fetchFn: async (page, pageSize) => {
      // Fetch all startup posts (opportunities)
      const response = await founderApi.getAllPosts({
        page,
        pageSize,
      });
      return response;
    },
    initialPageSize: 12,
  });

  // Calculate match score for opportunities if user profile exists
  const opportunitiesWithScores = opportunities.map((opp) => {
    if (!userProfile)
      return {
        ...opp,
        matchScore: 0,
      };
    let score = 0;
    const profile = userProfile;

    // Industry match (30 points)
    if (opp.industryFocus && profile.talentArea === opp.industryFocus) {
      score += 30;
    }

    // Skills match (40 points)
    if (opp.rolesNeeded && profile.talentSkills) {
      const oppSkills =
        typeof opp.rolesNeeded === "string"
          ? opp.rolesNeeded.toLowerCase()
          : (opp.rolesNeeded || []).join(" ").toLowerCase();
      const talentSkills = (profile.talentSkills || []).join(" ").toLowerCase();
      const matchingWords = oppSkills
        .split(" ")
        .filter((word) => word.length > 3 && talentSkills.includes(word));
      score += Math.min(40, matchingWords.length * 10);
    }

    // Stage match (20 points)
    if (opp.stage && profile.preferredStage === opp.stage) {
      score += 20;
    }

    // Location match (10 points)
    if (opp.location && profile.location === opp.location) {
      score += 10;
    }
    return {
      ...opp,
      matchScore: Math.min(100, score),
    };
  });

  // Filter opportunities client-side
  const filteredOpportunities = opportunitiesWithScores.filter((opp) => {
    const matchesSearch =
      opp.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.startupDescription
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      opp.rolesNeeded?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIndustry =
      industryFilter === "all" || opp.industryFocus === industryFilter;
    return matchesSearch && matchesIndustry;
  });

  // Sort by match score (highest first)
  const sortedOpportunities = [...filteredOpportunities].sort(
    (a, b) => b.matchScore - a.matchScore,
  );
  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertCircle className="w-12 h-12 mx-auto mb-2" />
            <p>
              {"Error loading opportunities: "}
              {error}
            </p>
            <Button onClick={refresh} className="mt-4" size="sm">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Smart Matched Opportunities
              </CardTitle>
              <CardDescription className="text-xs">
                {totalItems}
                {" opportunit"}
                {totalItems !== 1 ? "ies" : "y"}
                {" • Sorted by match score"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={industryFilter} onValueChange={setIndustryFilter}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="All Industries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  <SelectItem value="SaaS">SaaS</SelectItem>
                  <SelectItem value="E-commerce">E-commerce</SelectItem>
                  <SelectItem value="FinTech">FinTech</SelectItem>
                  <SelectItem value="HealthTech">HealthTech</SelectItem>
                  <SelectItem value="EdTech">EdTech</SelectItem>
                  <SelectItem value="AI/ML">AI/ML</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by company, role, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-xs"
            />
          </div>
        </CardContent>
      </Card>
      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Loading opportunities...
          </p>
        </div>
      ) : sortedOpportunities.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Briefcase className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-20" />
            <p className="text-sm font-medium text-muted-foreground">
              No opportunities found
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {searchQuery || industryFilter !== "all"
                ? "Try adjusting your filters"
                : "Check back later for new opportunities"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedOpportunities.map((opp) => (
            <Card
              key={opp.id}
              className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50"
              onClick={() => onOpportunityClick?.(opp)}
            >
              <CardHeader className="pb-2 pt-3 px-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm truncate">
                      {opp.companyName}
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5 truncate">
                      {opp.industryFocus}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSaveOpportunity?.(opp.id);
                    }}
                  >
                    <Heart
                      className={`w-4 h-4 ${savedOpportunityIds.has(opp.id) ? "fill-red-500 text-red-500" : "text-muted-foreground"}`}
                    />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pb-3 px-3 space-y-2">
                {opp.matchScore > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Star
                      className={`w-3.5 h-3.5 ${opp.matchScore >= 70 ? "fill-yellow-400 text-yellow-400" : "text-yellow-400"}`}
                    />
                    <Badge
                      variant={opp.matchScore >= 70 ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {opp.matchScore}% Match
                    </Badge>
                  </div>
                )}
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {opp.startupDescription || "No description provided"}
                </p>
                <div className="space-y-1.5 text-xs">
                  {opp.rolesNeeded && (
                    <div className="flex items-start gap-1.5">
                      <Users className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground line-clamp-1">
                        {opp.rolesNeeded}
                      </span>
                    </div>
                  )}
                  {opp.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">
                        {opp.location}
                      </span>
                    </div>
                  )}
                  {opp.stage && (
                    <div className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">{opp.stage}</span>
                    </div>
                  )}
                </div>
                <div className="pt-2">
                  <Button
                    size="sm"
                    className="w-full h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpportunityClick?.(opp);
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {!loading && totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
          onNextPage={nextPage}
          onPrevPage={prevPage}
          hasNext={hasNext}
          hasPrev={hasPrev}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  );
}
