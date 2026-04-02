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
import { Avatar, AvatarFallback } from "../ui/avatar";
import { usePagination } from "../../hooks/usePagination";
import { PaginationControls } from "../shared/PaginationControls";
import * as talentApi from "../../utils/api/talentApi";
import {
  Users,
  MapPin,
  Briefcase,
  Star,
  Search,
  AlertCircle,
  Sparkles,
  MessageSquare,
} from "lucide-react";
export function PaginatedTalentList({
  founderId,
  rolesNeeded = [],
  onTalentClick,
  onContactTalent,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [skillFilter, setSkillFilter] = useState("all");

  // ✅ Use pagination hook for talent profiles
  const {
    data: talentProfiles,
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
      // Fetch all talent profiles
      const response = await talentApi.getAllTalent({
        page,
        pageSize,
      });
      return response;
    },
    initialPageSize: 12,
  });

  // Calculate match score for each talent profile
  const talentWithScores = talentProfiles.map((talent) => {
    let score = 0;

    // Skills match with roles needed (60 points)
    if (rolesNeeded.length > 0 && talent.talentSkills) {
      const neededSkills = rolesNeeded.join(" ").toLowerCase();
      const talentSkills = (talent.talentSkills || []).join(" ").toLowerCase();
      const matchingWords = neededSkills
        .split(" ")
        .filter((word) => word.length > 2 && talentSkills.includes(word));
      score += Math.min(60, matchingWords.length * 15);
    }

    // Experience level (20 points)
    if (talent.yearsOfExperience) {
      const years = parseInt(talent.yearsOfExperience);
      if (years >= 3) score += 20;
      else if (years >= 1) score += 10;
    }

    // Availability (20 points)
    if (talent.availability === "full-time") {
      score += 20;
    } else if (talent.availability === "part-time") {
      score += 10;
    }
    return {
      ...talent,
      matchScore: Math.min(100, score),
    };
  });

  // Filter talent profiles client-side
  const filteredTalent = talentWithScores.filter((talent) => {
    const matchesSearch =
      talent.talentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      talent.professionalTitle
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (talent.talentSkills || []).some((skill) =>
        skill.toLowerCase().includes(searchQuery.toLowerCase()),
      ) ||
      talent.bio?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSkill =
      skillFilter === "all" ||
      talent.talentArea === skillFilter ||
      (talent.talentSkills || []).includes(skillFilter);
    return matchesSearch && matchesSkill;
  });

  // Sort by match score (highest first)
  const sortedTalent = [...filteredTalent].sort(
    (a, b) => b.matchScore - a.matchScore,
  );
  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertCircle className="w-12 h-12 mx-auto mb-2" />
            <p>
              {"Error loading talent: "}
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
                Smart Team Matching
              </CardTitle>
              <CardDescription className="text-xs">
                {totalItems}
                {" talent profile"}
                {totalItems !== 1 ? "s" : ""}
                {" • Sorted by compatibility"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={skillFilter} onValueChange={setSkillFilter}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="All Skills" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Skills</SelectItem>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Product">Product</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by name, title, or skills..."
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
            Loading talent profiles...
          </p>
        </div>
      ) : sortedTalent.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-20" />
            <p className="text-sm font-medium text-muted-foreground">
              No talent profiles found
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {searchQuery || skillFilter !== "all"
                ? "Try adjusting your filters"
                : "Check back later for new talent"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedTalent.map((talent) => (
            <Card
              key={talent.id}
              className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50"
              onClick={() => onTalentClick?.(talent)}
            >
              <CardHeader className="pb-2 pt-3 px-3">
                <div className="flex items-start gap-3">
                  <Avatar className="w-12 h-12 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {talent.talentName
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm truncate">
                      {talent.talentName || "Unknown"}
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5 truncate">
                      {talent.professionalTitle ||
                        talent.talentArea ||
                        "Talent"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-3 px-3 space-y-2">
                {talent.matchScore > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Star
                      className={`w-3.5 h-3.5 ${talent.matchScore >= 70 ? "fill-yellow-400 text-yellow-400" : "text-yellow-400"}`}
                    />
                    <Badge
                      variant={
                        talent.matchScore >= 70 ? "default" : "secondary"
                      }
                      className="text-xs"
                    >
                      {talent.matchScore}% Match
                    </Badge>
                  </div>
                )}
                {talent.bio && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {talent.bio}
                  </p>
                )}
                {talent.talentSkills && talent.talentSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {talent.talentSkills.slice(0, 3).map((skill, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 h-5"
                      >
                        {skill}
                      </Badge>
                    ))}
                    {talent.talentSkills.length > 3 && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 h-5"
                      >
                        +{talent.talentSkills.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
                <div className="space-y-1 text-xs">
                  {talent.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">
                        {talent.location}
                      </span>
                    </div>
                  )}
                  {talent.yearsOfExperience && (
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">
                        {talent.yearsOfExperience}
                        {" years experience"}
                      </span>
                    </div>
                  )}
                  {talent.availability && (
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant={
                          talent.availability === "full-time"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {talent.availability}
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="pt-2 flex gap-1.5">
                  <Button
                    size="sm"
                    className="flex-1 h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTalentClick?.(talent);
                    }}
                  >
                    View Profile
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onContactTalent?.(talent);
                    }}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
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
