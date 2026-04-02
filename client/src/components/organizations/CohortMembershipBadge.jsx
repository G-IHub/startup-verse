import React, { useState, useEffect } from "react";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { Users, Eye, X } from "lucide-react";
import { getStartupMemberships } from "../../utils/organizationHelpersSupabase";
export default function CohortMembershipBadge({ startupId }) {
  const [memberships, setMemberships] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  useEffect(() => {
    loadMemberships();
  }, [startupId]);
  const loadMemberships = async () => {
    const membershipData = await getStartupMemberships(startupId);
    setMemberships(membershipData);
  };
  if (memberships.length === 0) {
    return null;
  }

  // Show simple badge if only 1 cohort
  if (memberships.length === 1 && !showDetails) {
    const membership = memberships[0];

    // Data is already enriched from the backend
    if (!membership.cohort || !membership.organization) return null;
    return (
      <div onClick={() => setShowDetails(true)} className="cursor-pointer">
        <Badge
          variant="outline"
          className="text-[9px] px-2 py-1 bg-primary/5 border-primary/30 hover:bg-primary/10 transition-colors"
        >
          <Users className="w-3 h-3 mr-1" />
          {membership.cohort.name}
        </Badge>
      </div>
    );
  }

  // Show detailed card
  if (showDetails) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-2.5">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary" />
              <h4 className="text-[10px] font-semibold">You're Part Of:</h4>
            </div>
            <button
              onClick={() => setShowDetails(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-1.5">
            {memberships.map((membership) => {
              // Data is already enriched from the backend
              if (!membership.cohort || !membership.organization) return null;
              return (
                <div
                  key={membership.id}
                  className="p-1.5 bg-background rounded border"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-medium truncate">
                        {membership.cohort.name}
                      </p>
                      <p className="text-[8px] text-muted-foreground">
                        {membership.organization.name}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-[7px] px-1 py-0 flex-shrink-0"
                    >
                      {membership.organization.type.replace("-", " ")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-[8px] text-muted-foreground">
                    <Eye className="w-2.5 h-2.5" />
                    <span>Read-only access to progress</span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[8px] text-muted-foreground mt-2">
            These programs can see your execution progress to better support you
          </p>
        </CardContent>
      </Card>
    );
  }

  // Multiple cohorts, show count badge
  return (
    <div onClick={() => setShowDetails(true)} className="cursor-pointer">
      <Badge
        variant="outline"
        className="text-[9px] px-2 py-1 bg-primary/5 border-primary/30 hover:bg-primary/10 transition-colors"
      >
        <Users className="w-3 h-3 mr-1" />
        {memberships.length}
        {" cohort"}
        {memberships.length !== 1 ? "s" : ""}
      </Badge>
    </div>
  );
}
