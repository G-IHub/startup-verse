/**
 * PROGRAM MILESTONES - Set weekly goals for entire cohort
 */
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Calendar, Target, Clock, AlertCircle, Sparkles } from "lucide-react";
import StructuredMilestoneCreator from "./StructuredMilestoneCreator";
export default function ProgramMilestones({
  cohortId,
  organizationId,
  userId,
  isAdmin,
}) {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  useEffect(() => {
    loadMilestones();
  }, [cohortId]);
  const loadMilestones = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/program-milestones/${cohortId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
          },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch milestones");
      const data = await response.json();
      setMilestones(data.milestones);
    } catch (error) {
      console.error("Error loading milestones:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleCreateStructuredMilestone = async (data) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/program-milestones/create`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cohortId,
            organizationId,
            title: data.title,
            description: data.description,
            dueDate: data.dueDate,
            week: data.week,
            category: data.category,
            createdBy: userId,
            // 🎯 NEW: Include structured milestones
            structuredMilestones: data.milestones,
          }),
        },
      );
      if (!response.ok) throw new Error("Failed to create milestone");
      setShowCreateForm(false);
      loadMilestones();
    } catch (error) {
      console.error("Error creating milestone:", error);
      alert("Failed to create milestone");
    }
  };
  const isPastDue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };
  const getDaysUntilDue = (dueDate) => {
    const days = Math.ceil(
      (new Date(dueDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24),
    );
    return days;
  };
  const sortedMilestones = [...milestones].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  );
  return (
    <div className="space-y-4">
      <StructuredMilestoneCreator
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSubmit={handleCreateStructuredMilestone}
        type="milestone"
      />
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-[11px] flex items-center gap-2">
                Program Milestones
                <Badge
                  variant="outline"
                  className="text-[7px] bg-primary/10 text-primary border-primary/20"
                >
                  <Sparkles className="w-2.5 h-2.5 mr-1" />
                  AI-Structured
                </Badge>
              </CardTitle>
              <CardDescription className="text-[9px]">
                Auto-converts to weekly outcomes with milestones & tasks for all
                founders
              </CardDescription>
            </div>
            {isAdmin && (
              <Button
                size="sm"
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="h-6 text-[9px] gap-1"
              >
                <Sparkles className="w-3 h-3" />
                {showCreateForm ? "Cancel" : "Create Milestone"}
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>
      {loading ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="animate-pulse text-[10px]">
              Loading milestones...
            </div>
          </CardContent>
        </Card>
      ) : sortedMilestones.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-[10px] text-muted-foreground">
              No program milestones yet
            </p>
            {isAdmin && (
              <p className="text-[9px] text-muted-foreground mt-1">
                Create milestones to guide your cohort
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sortedMilestones.map((milestone) => {
            const daysUntil = getDaysUntilDue(milestone.dueDate);
            const pastDue = isPastDue(milestone.dueDate);
            return (
              <Card key={milestone.id}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[10px] font-medium truncate">
                          {milestone.title}
                        </h3>
                        {milestone.week && (
                          <Badge variant="outline" className="text-[7px]">
                            {"Week "}
                            {milestone.week}
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={`text-[7px] ${milestone.category === "deliverable" ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20" : milestone.category === "checkpoint" ? "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20" : ""}`}
                        >
                          {milestone.category}
                        </Badge>
                      </div>
                      {milestone.description && (
                        <p className="text-[9px] text-muted-foreground mt-1">
                          {milestone.description}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[9px] text-muted-foreground">
                          {new Date(milestone.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                      {pastDue ? (
                        <Badge
                          variant="outline"
                          className="text-[7px] bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
                        >
                          <AlertCircle className="w-2.5 h-2.5 mr-1" />
                          Past Due
                        </Badge>
                      ) : daysUntil <= 3 ? (
                        <Badge
                          variant="outline"
                          className="text-[7px] bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20"
                        >
                          <Clock className="w-2.5 h-2.5 mr-1" />
                          {daysUntil}
                          {" days left"}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[7px]">
                          <Clock className="w-2.5 h-2.5 mr-1" />
                          {daysUntil}
                          {" days left"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
