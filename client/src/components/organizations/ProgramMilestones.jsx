/**
 * PROGRAM MILESTONES - Set weekly goals for entire cohort
 */
import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/apiBase.js";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Calendar,
  Target,
  Clock,
  AlertCircle,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import StructuredMilestoneCreator from "./StructuredMilestoneCreator";
import {
  SectionHeader,
  SectionCard,
  ListRow,
  StatusBadge,
  EmptyStateBlock,
} from "./_primitives";

const API_BASE = API_BASE_URL;

const defaultOptions = {
  credentials: "include",
  headers: { "Content-Type": "application/json" },
};

const CATEGORY_TONE = {
  deliverable: "bg-[#e8ebff] text-[#3a5afe]",
  checkpoint: "bg-[#f3e8ff] text-[#7c4dff]",
};

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
        `${API_BASE}/cohorts/${cohortId}/program-milestones`,
        { ...defaultOptions },
      );
      if (!response.ok) throw new Error("Failed to fetch milestones");
      const payload = await response.json();
      const inner = payload?.data ?? payload;
      setMilestones(inner.milestones || []);
    } catch (error) {
      console.error("Error loading milestones:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStructuredMilestone = async (data) => {
    try {
      const response = await fetch(
        `${API_BASE}/cohorts/${cohortId}/program-milestones`,
        {
          ...defaultOptions,
          method: "POST",
          body: JSON.stringify({
            organizationId,
            title: data.title,
            description: data.description,
            dueDate: data.dueDate,
            week: data.week,
            category: data.category,
            createdBy: userId,
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

  const isPastDue = (dueDate) => new Date(dueDate) < new Date();
  const getDaysUntilDue = (dueDate) =>
    Math.ceil(
      (new Date(dueDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24),
    );

  const sortedMilestones = [...milestones].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  );

  const primaryAction = isAdmin
    ? {
        label: showCreateForm ? "Cancel" : "Create Milestone",
        icon: Sparkles,
        onClick: () => setShowCreateForm(!showCreateForm),
      }
    : null;

  return (
    <div className="space-y-4 font-body">
      <StructuredMilestoneCreator
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSubmit={handleCreateStructuredMilestone}
        type="milestone"
      />

      <SectionHeader
        icon={Target}
        title="Program Milestones"
        description="Auto-converts to weekly outcomes with milestones & tasks for all founders"
        action={
          primaryAction ? (
            <Button
              size="sm"
              onClick={primaryAction.onClick}
              className={
                showCreateForm
                  ? "h-9 rounded-input border border-surface-border bg-white font-body text-[13px] font-medium text-text-body hover:bg-primary-tint hover:text-primary"
                  : "h-9 rounded-input bg-primary font-body text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(58,90,254,0.25)] hover:bg-primary-hover"
              }
            >
              <primaryAction.icon className="mr-2 h-4 w-4" />
              {primaryAction.label}
            </Button>
          ) : null
        }
      />

      {loading ? (
        <SectionCard>
          <SectionCard.Body className="p-8 text-center">
            <div className="font-body text-[13px] text-text-muted animate-pulse">
              Loading milestones...
            </div>
          </SectionCard.Body>
        </SectionCard>
      ) : sortedMilestones.length === 0 ? (
        <SectionCard>
          <SectionCard.Body className="p-0">
            <EmptyStateBlock
              variant="centered"
              icon={Target}
              tone="info"
              title="No milestones yet"
              description={
                isAdmin
                  ? "Create your first program milestone to track cohort progress"
                  : "Your organization hasn't published any milestones yet"
              }
              action={
                isAdmin ? (
                  <Button
                    size="sm"
                    onClick={() => setShowCreateForm(true)}
                    className="h-9 rounded-input bg-primary font-body text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(58,90,254,0.25)] hover:bg-primary-hover"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Create Milestone
                  </Button>
                ) : null
              }
            />
          </SectionCard.Body>
        </SectionCard>
      ) : (
        <SectionCard>
          <SectionCard.Body className="p-3">
            <div className="space-y-2">
              {sortedMilestones.map((milestone) => {
                const daysUntil = getDaysUntilDue(milestone.dueDate);
                const pastDue = isPastDue(milestone.dueDate);
                const status = pastDue
                  ? "stalled"
                  : daysUntil <= 3
                    ? "warning"
                    : "active";
                const statusIcon = pastDue
                  ? AlertCircle
                  : daysUntil <= 3
                    ? Clock
                    : CheckCircle2;
                const statusLabel = pastDue
                  ? "Past Due"
                  : `${daysUntil} day${daysUntil === 1 ? "" : "s"} left`;
                const categoryTone =
                  CATEGORY_TONE[milestone.category] ||
                  "bg-surface-page text-text-muted";
                return (
                  <ListRow
                    key={milestone.id}
                    leading={
                      <div className="flex h-10 w-10 items-center justify-center rounded-input bg-primary-tint text-primary">
                        <Target className="h-4 w-4" />
                      </div>
                    }
                    title={
                      <span className="inline-flex items-center gap-2">
                        <span>{milestone.title}</span>
                        <Badge
                          variant="outline"
                          className="rounded-full border-0 bg-primary-tint px-[10px] py-[2px] font-body text-[11px] font-semibold text-primary"
                        >
                          <Sparkles className="mr-1 h-3 w-3" />
                          AI-Structured
                        </Badge>
                      </span>
                    }
                    description={milestone.description}
                    meta={
                      <>
                        {milestone.week && (
                          <span className="inline-flex items-center gap-1 font-body text-[12px] text-text-muted">
                            Week {milestone.week}
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center rounded-full border-0 px-[10px] py-[2px] font-body text-[11px] font-semibold capitalize ${categoryTone}`}
                        >
                          {milestone.category}
                        </span>
                        <span className="inline-flex items-center gap-1 font-body text-[12px] text-text-muted">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(milestone.dueDate).toLocaleDateString()}
                        </span>
                      </>
                    }
                    trailing={
                      <StatusBadge
                        status={status}
                        icon={statusIcon}
                        label={statusLabel}
                      />
                    }
                  />
                );
              })}
            </div>
          </SectionCard.Body>
        </SectionCard>
      )}
    </div>
  );
}
