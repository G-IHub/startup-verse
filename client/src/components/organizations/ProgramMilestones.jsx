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
  Pencil,
  Trash2,
  MoreVertical,
} from "lucide-react";
import StructuredMilestoneCreator from "./StructuredMilestoneCreator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import {
  SectionHeader,
  SectionCard,
  ListRow,
  StatusBadge,
  EmptyStateBlock,
} from "./_primitives";
import { toastError } from "../../utils/toastError";
import { toast } from "sonner";

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
  // Non-null editingMilestone means the creator dialog opens in edit mode.
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [milestoneToDelete, setMilestoneToDelete] = useState(null);
  const [isDeletingMilestone, setIsDeletingMilestone] = useState(false);

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

  const handleSubmitStructuredMilestone = async (data) => {
    const isEdit = Boolean(editingMilestone);
    try {
      const payload = {
        organizationId,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
        week: data.week,
        category: data.category,
        createdBy: userId,
        structuredMilestones: data.milestones,
      };
      const url = isEdit
        ? `${API_BASE}/cohorts/${cohortId}/program-milestones/${editingMilestone.id}`
        : `${API_BASE}/cohorts/${cohortId}/program-milestones`;
      const response = await fetch(url, {
        ...defaultOptions,
        method: isEdit ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const err = new Error(
          body?.message ||
            (isEdit ? "Failed to update milestone" : "Failed to create milestone"),
        );
        err.status = response.status;
        throw err;
      }
      setShowCreateForm(false);
      setEditingMilestone(null);
      loadMilestones();
      toast.success(isEdit ? "Milestone updated" : "Milestone created");
    } catch (error) {
      console.error(
        isEdit ? "Error updating milestone:" : "Error creating milestone:",
        error,
      );
      toastError(
        error,
        isEdit ? "Failed to update milestone" : "Failed to create milestone",
      );
    }
  };

  const confirmDeleteMilestone = async () => {
    if (!milestoneToDelete) return;
    setIsDeletingMilestone(true);
    try {
      const response = await fetch(
        `${API_BASE}/cohorts/${cohortId}/program-milestones/${milestoneToDelete.id}`,
        { ...defaultOptions, method: "DELETE" },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const err = new Error(body?.message || "Failed to delete milestone");
        err.status = response.status;
        throw err;
      }
      setMilestoneToDelete(null);
      loadMilestones();
      toast.success("Milestone deleted");
    } catch (error) {
      console.error("Error deleting milestone:", error);
      toastError(error, "Failed to delete milestone");
    } finally {
      setIsDeletingMilestone(false);
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
        isOpen={showCreateForm || Boolean(editingMilestone)}
        onClose={() => {
          setShowCreateForm(false);
          setEditingMilestone(null);
        }}
        onSubmit={handleSubmitStructuredMilestone}
        type="milestone"
        milestone={editingMilestone}
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
                      <div className="flex items-center gap-2">
                        <StatusBadge
                          status={status}
                          icon={statusIcon}
                          label={statusLabel}
                        />
                        {isAdmin && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild={true}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-36"
                            >
                              <DropdownMenuItem
                                onClick={() => setEditingMilestone(milestone)}
                                className="font-body text-[13px]"
                              >
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  setMilestoneToDelete(milestone)
                                }
                                className="font-body text-[13px] text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    }
                  />
                );
              })}
            </div>
          </SectionCard.Body>
        </SectionCard>
      )}

      <AlertDialog
        open={!!milestoneToDelete}
        onOpenChange={(open) => !open && setMilestoneToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-base font-bold text-text-heading">
              Delete Milestone
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body text-[13px] text-text-body">
              {"Delete "}
              <strong>{milestoneToDelete?.title}</strong>? Founders will lose
              the structured tasks tied to it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="h-9 rounded-input font-body text-[13px] font-medium"
              disabled={isDeletingMilestone}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteMilestone}
              disabled={isDeletingMilestone}
              className="h-9 rounded-input bg-destructive font-body text-[13px] font-semibold text-white hover:bg-destructive/90"
            >
              {isDeletingMilestone ? "Deleting..." : "Delete Milestone"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
