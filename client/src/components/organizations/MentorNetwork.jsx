/**
 * MENTOR NETWORK - Connect startups with mentors (Integration with MentorManager)
 */
import React, { useState, useEffect } from "react";
import MentorAssignmentManager from "./MentorAssignmentManager";
import { getCohort } from "../../utils/organizationHelpersBackend";
export default function MentorNetwork({
  cohortId,
  organizationId,
  userId,
  isAdmin,
}) {
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadCohorts();
  }, [organizationId]);
  const loadCohorts = async () => {
    try {
      setLoading(true);
      // Load current cohort info
      const cohort = await getCohort(cohortId);
      if (cohort) {
        setCohorts([
          {
            id: cohort.id,
            name: cohort.name,
          },
        ]);
      }
    } catch (error) {
      console.error("Error loading cohort:", error);
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-[10px] text-muted-foreground">
          Loading mentors...
        </div>
      </div>
    );
  }
  return (
    <MentorAssignmentManager
      cohortId={cohortId}
      organizationId={organizationId}
      cohorts={cohorts}
      isAdmin={isAdmin}
    />
  );
}
