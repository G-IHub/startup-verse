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
import * as teamMemberApi from "../../utils/api/teamMemberApi";
import {
  Users,
  Mail,
  MessageSquare,
  Search,
  AlertCircle,
  CheckCircle2,
  Clock,
  UserPlus,
} from "lucide-react";
export function PaginatedTeamMemberList({
  founderId,
  onMemberClick,
  onMessageMember,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // ✅ Use pagination hook for team members
  const {
    data: teamMembers,
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
      // Fetch all team members for this startup
      const response = await teamMemberApi.getStartupTeamMembers(founderId, {
        page,
        pageSize,
      });
      return response;
    },
    initialPageSize: 12,
  });

  // Filter team members client-side
  const filteredMembers = teamMembers.filter((member) => {
    const matchesSearch =
      member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.skills || []).some((skill) =>
        skill.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    const matchesRole =
      roleFilter === "all" ||
      member.role === roleFilter ||
      member.talentArea === roleFilter;
    return matchesSearch && matchesRole;
  });
  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertCircle className="w-12 h-12 mx-auto mb-2" />
            <p>
              {"Error loading team members: "}
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
                <Users className="w-5 h-5 text-primary" />
                Team Members
              </CardTitle>
              <CardDescription className="text-xs">
                {totalItems}
                {" team member"}
                {totalItems !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
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
            Loading team members...
          </p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <UserPlus className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-20" />
            <p className="text-sm font-medium text-muted-foreground">
              No team members found
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {searchQuery || roleFilter !== "all"
                ? "Try adjusting your filters"
                : "Invite your first team member to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredMembers.map((member) => (
            <Card
              key={member.id}
              className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50"
              onClick={() => onMemberClick?.(member)}
            >
              <CardHeader className="pb-2 pt-3 px-3">
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar className="w-12 h-12 flex-shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {member.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${member.status === "online" ? "bg-green-500" : member.status === "away" ? "bg-yellow-500" : "bg-gray-400"}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm truncate">
                      {member.name || "Unknown"}
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5 truncate">
                      {member.title ||
                        member.talentArea ||
                        member.professionalTitle ||
                        "Team Member"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-3 px-3 space-y-2">
                {member.email && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>
                )}
                {member.skills && member.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {member.skills.slice(0, 3).map((skill, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 h-5"
                      >
                        {skill}
                      </Badge>
                    ))}
                    {member.skills.length > 3 && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 h-5"
                      >
                        +{member.skills.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                    <span>{member.tasksCompleted || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>{member.tasksInProgress || 0}</span>
                  </div>
                  {member.status && (
                    <Badge
                      variant={
                        member.status === "online" ? "default" : "secondary"
                      }
                      className="text-[10px] px-1.5 py-0 h-5"
                    >
                      {member.status}
                    </Badge>
                  )}
                </div>
                <div className="pt-2 flex gap-1.5">
                  <Button
                    size="sm"
                    className="flex-1 h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMemberClick?.(member);
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
                      onMessageMember?.(member);
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
