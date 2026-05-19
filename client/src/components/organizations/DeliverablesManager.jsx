/**
 * DELIVERABLES MANAGER - Create, track, and review startup deliverables
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE_URL } from "../../config/apiBase.js";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/select";
import {
  Plus,
  FileText,
  Calendar,
  Clock,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Users,
  CheckCircle2,
  Inbox,
  Archive,
  Pencil,
  Trash2,
  MoreVertical,
  Search,
} from "lucide-react";
import { unwrapData } from "../../utils/apiEnvelope";
import { useOrgListQuery } from "../../hooks/useOrgListQuery";
import { useOrgRealtime } from "../../hooks/useOrgRealtime";
import {
  getCohortDeliverablesPage,
  getDeliverableSubmissionsPage,
} from "../../utils/api/organizationApi";
import PaginationControls from "../shared/PaginationControls";
import { toastError } from "../../utils/toastError";
import { toast } from "sonner";
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
import { Checkbox } from "../ui/checkbox";
import {
  SectionCard,
  SectionHeader,
  StatusBadge,
  EmptyStateBlock,
  CollapsibleFormCard,
} from "./_primitives";
import { cn } from "../ui/utils";

const API_BASE = API_BASE_URL;

const defaultOptions = {
  credentials: "include",
  headers: { "Content-Type": "application/json" },
};

const REVIEW_STATUS_OPTIONS = [
  { value: "approved", label: "Approved" },
  { value: "revision_requested", label: "Needs revision" },
  { value: "rejected", label: "Rejected" },
  { value: "reviewed", label: "Reviewed" },
];

const SUBMISSION_STATUS_ICON = {
  approved: CheckCircle2,
  rejected: AlertCircle,
  revision_requested: AlertCircle,
  "needs-revision": AlertCircle,
  reviewed: CheckCircle2,
  submitted: Inbox,
};

const PRIMARY_BUTTON =
  "h-9 rounded-input bg-primary font-body text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(58,90,254,0.25)] hover:bg-primary-hover";
const OUTLINE_BUTTON =
  "h-9 rounded-input border border-surface-border bg-white font-body text-[13px] font-medium text-text-body hover:bg-primary-tint hover:text-primary";

export default function DeliverablesManager({
  cohortId,
  organizationId,
  userId,
  isAdmin,
}) {
  const [selectedDeliverable, setSelectedDeliverable] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [reviewingSubmission, setReviewingSubmission] = useState(null);
  const [includeArchived, setIncludeArchived] = useState(false);
  // Non-null editingDeliverableId switches the create form into edit mode (PUT).
  const [editingDeliverableId, setEditingDeliverableId] = useState(null);
  const [deliverableToArchive, setDeliverableToArchive] = useState(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [deliverableToDelete, setDeliverableToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const emptyForm = {
    title: "",
    description: "",
    dueDate: "",
    requirements: "",
  };
  const [formData, setFormData] = useState(emptyForm);
  const [reviewData, setReviewData] = useState({
    status: "approved",
    feedback: "",
  });

  const {
    items: deliverableRows,
    total,
    limit,
    loading,
    q,
    setSearch,
    currentPage,
    totalPages,
    hasNext,
    hasPrev,
    goToPage,
    nextPage,
    prevPage,
    refresh: refreshDeliverables,
  } = useOrgListQuery({
    fetchFn: useCallback(
      (params) =>
        getCohortDeliverablesPage(cohortId, {
          ...params,
          includeArchived: includeArchived ? "1" : undefined,
        }),
      [cohortId, includeArchived],
    ),
    initialLimit: 25,
  });

  const deliverables = deliverableRows.map((d) => ({
    ...d,
    id: d.id || d._id,
  }));

  const selectedDeliverableId =
    selectedDeliverable?.id || selectedDeliverable?._id || null;

  const selectedDeliverableIdRef = useRef(selectedDeliverableId);
  selectedDeliverableIdRef.current = selectedDeliverableId;

  useOrgRealtime(organizationId, cohortId, {
    onDeliverable: (payload) => {
      refreshDeliverables().catch(() => {});
      const dId = payload?.deliverableId || payload?.id;
      if (
        dId &&
        selectedDeliverableIdRef.current &&
        String(dId) === String(selectedDeliverableIdRef.current)
      ) {
        refreshSubmissions().catch(() => {});
      }
    },
  });

  useEffect(() => {
    if (!deliverables.length) {
      setSelectedDeliverable(null);
      return;
    }
    const selectedId = String(selectedDeliverableId || "");
    const stillVisible = deliverables.find((d) => String(d.id) === selectedId);
    if (!stillVisible) {
      setSelectedDeliverable(deliverables[0]);
    }
  }, [deliverables, selectedDeliverableId]);

  const {
    items: submissionRows,
    total: submissionsTotal,
    limit: submissionsLimit,
    loading: submissionsLoading,
    refresh: refreshSubmissions,
  } = useOrgListQuery({
    fetchFn: useCallback(
      (params) => getDeliverableSubmissionsPage(selectedDeliverableId, params),
      [selectedDeliverableId],
    ),
    initialLimit: 25,
    autoFetch: Boolean(selectedDeliverableId),
  });

  const submissions = submissionRows.map((s) => ({
    ...s,
    id: s._id || s.id,
    feedback: s.feedback || s.review?.feedback || "",
  }));

  const handleSubmitDeliverable = async (e) => {
    e.preventDefault();
    const isEdit = Boolean(editingDeliverableId);
    try {
      const requirements = formData.requirements
        .split("\n")
        .filter((r) => r.trim())
        .map((r) => r.trim());
      const payload = {
        organizationId,
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate,
        requirements,
        createdBy: userId,
      };
      const url = isEdit
        ? `${API_BASE}/cohorts/${cohortId}/deliverables/${editingDeliverableId}`
        : `${API_BASE}/cohorts/${cohortId}/deliverables`;
      const response = await fetch(url, {
        ...defaultOptions,
        method: isEdit ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const err = new Error(
          body?.message ||
            (isEdit ? "Failed to update deliverable" : "Failed to create deliverable"),
        );
        err.status = response.status;
        throw err;
      }
      setFormData(emptyForm);
      setEditingDeliverableId(null);
      setShowCreateForm(false);
      await refreshDeliverables();
      toast.success(isEdit ? "Deliverable updated" : "Deliverable created");
    } catch (error) {
      console.error(
        isEdit ? "Error updating deliverable:" : "Error creating deliverable:",
        error,
      );
      toastError(
        error,
        isEdit ? "Failed to update deliverable" : "Failed to create deliverable",
      );
    }
  };

  const startEditDeliverable = (deliverable) => {
    setEditingDeliverableId(deliverable.id || deliverable._id);
    setFormData({
      title: deliverable.title || "",
      description: deliverable.description || "",
      dueDate: deliverable.dueDate
        ? new Date(deliverable.dueDate).toISOString().slice(0, 10)
        : "",
      requirements: Array.isArray(deliverable.requirements)
        ? deliverable.requirements.join("\n")
        : "",
    });
    setShowCreateForm(true);
  };

  const cancelEdit = () => {
    setEditingDeliverableId(null);
    setFormData(emptyForm);
    setShowCreateForm(false);
  };

  const confirmArchiveDeliverable = async () => {
    if (!deliverableToArchive) return;
    setIsArchiving(true);
    try {
      const id = deliverableToArchive.id || deliverableToArchive._id;
      const response = await fetch(
        `${API_BASE}/cohorts/${cohortId}/deliverables/${id}/archive`,
        { ...defaultOptions, method: "PATCH" },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const err = new Error(body?.message || "Failed to archive deliverable");
        err.status = response.status;
        throw err;
      }
      setDeliverableToArchive(null);
      await refreshDeliverables();
      toast.success("Deliverable archived");
    } catch (error) {
      console.error("Error archiving deliverable:", error);
      toastError(error, "Failed to archive deliverable");
    } finally {
      setIsArchiving(false);
    }
  };

  const confirmDeleteDeliverable = async () => {
    if (!deliverableToDelete) return;
    setIsDeleting(true);
    try {
      const id = deliverableToDelete.id || deliverableToDelete._id;
      const response = await fetch(
        `${API_BASE}/cohorts/${cohortId}/deliverables/${id}`,
        { ...defaultOptions, method: "DELETE" },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        // 409 from server says "archive instead" - surface it as a toast.
        const err = new Error(body?.message || "Failed to delete deliverable");
        err.status = response.status;
        throw err;
      }
      setDeliverableToDelete(null);
      await refreshDeliverables();
      toast.success("Deliverable deleted");
    } catch (error) {
      console.error("Error deleting deliverable:", error);
      toastError(error, "Failed to delete deliverable");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReviewSubmission = async (submissionId) => {
    try {
      const response = await fetch(
        `${API_BASE}/deliverables/submissions/${submissionId}/review`,
        {
          ...defaultOptions,
          method: "POST",
          body: JSON.stringify({
            status: reviewData.status,
            feedback: reviewData.feedback,
            reviewedBy: userId,
          }),
        },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const err = new Error(body?.message || "Failed to review submission");
        err.status = response.status;
        throw err;
      }
      setReviewingSubmission(null);
      setReviewData({ status: "approved", feedback: "" });
      if (selectedDeliverableId) {
        await refreshSubmissions();
      }
    } catch (error) {
      console.error("Error reviewing submission:", error);
      toastError(error, "Failed to review submission");
    }
  };

  const isPastDue = (dueDate) => new Date(dueDate) < new Date();
  const getDaysUntilDue = (dueDate) =>
    Math.ceil(
      (new Date(dueDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24),
    );

  return (
    <div className="space-y-4 font-body">
      <SectionHeader
        icon={FileText}
        title="Deliverables"
        description="Track startup submissions and provide feedback"
      />

      {isAdmin && (
        <CollapsibleFormCard
          title={editingDeliverableId ? "Edit Deliverable" : "Create Deliverable"}
          description={
            editingDeliverableId
              ? "Update deliverable details"
              : "Add a new deliverable for the cohort"
          }
          triggerLabel={editingDeliverableId ? "Edit Deliverable" : "New Deliverable"}
          isOpen={showCreateForm}
          onToggle={(open) => {
            if (!open && editingDeliverableId) cancelEdit();
            else setShowCreateForm(open);
          }}
        >
          <form onSubmit={handleSubmitDeliverable} className="space-y-3">
            <div>
              <label className="mb-2 block font-body text-[13px] font-medium text-text-heading">
                Title
              </label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g., Pitch Deck v1.0"
                required={true}
                className="font-body text-[13px]"
              />
            </div>
            <div>
              <label className="mb-2 block font-body text-[13px] font-medium text-text-heading">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="What should startups deliver?"
                className="min-h-[60px] font-body text-[13px]"
              />
            </div>
            <div>
              <label className="mb-2 block font-body text-[13px] font-medium text-text-heading">
                Due Date
              </label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                required={true}
                className="font-body text-[13px]"
              />
            </div>
            <div>
              <label className="mb-2 block font-body text-[13px] font-medium text-text-heading">
                Requirements (one per line)
              </label>
              <Textarea
                value={formData.requirements}
                onChange={(e) =>
                  setFormData({ ...formData, requirements: e.target.value })
                }
                placeholder={"10-15 slides\nInclude financial projections\nProblem, solution, market size"}
                className="min-h-[80px] font-body text-[13px]"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" className={PRIMARY_BUTTON}>
                <Plus className="mr-2 h-4 w-4" />
                {editingDeliverableId ? "Save Changes" : "Create Deliverable"}
              </Button>
              {editingDeliverableId && (
                <Button
                  type="button"
                  size="sm"
                  onClick={cancelEdit}
                  className={OUTLINE_BUTTON}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CollapsibleFormCard>
      )}

      {isAdmin && (
        <div className="flex items-center gap-2">
          <Checkbox
            id="includeArchived"
            checked={includeArchived}
            onCheckedChange={(checked) => setIncludeArchived(Boolean(checked))}
          />
          <label
            htmlFor="includeArchived"
            className="font-body text-[13px] text-text-body"
          >
            Show archived
          </label>
        </div>
      )}

      <SectionCard>
        <SectionCard.Body className="p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
            <Input
              value={q}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search deliverables…"
              className="pl-8 font-body text-[13px]"
            />
          </div>
        </SectionCard.Body>
      </SectionCard>

      {loading ? (
        <SectionCard>
          <SectionCard.Body className="p-8 text-center">
            <div className="font-body text-[13px] text-text-muted animate-pulse">
              Loading deliverables...
            </div>
          </SectionCard.Body>
        </SectionCard>
      ) : total === 0 ? (
        <SectionCard>
          <SectionCard.Body className="p-0">
            <EmptyStateBlock
              variant="centered"
              icon={FileText}
              tone="info"
              title={q ? "No matching deliverables" : "No deliverables yet"}
              description={
                isAdmin
                  ? "Create deliverables to collect work from startups"
                  : "Your organization hasn't published any deliverables yet"
              }
              action={
                isAdmin ? (
                  <Button
                    size="sm"
                    onClick={() => setShowCreateForm(true)}
                    className={PRIMARY_BUTTON}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Deliverable
                  </Button>
                ) : null
              }
            />
          </SectionCard.Body>
        </SectionCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            {deliverables.map((deliverable) => {
              const daysUntil = getDaysUntilDue(deliverable.dueDate);
              const pastDue = isPastDue(deliverable.dueDate);
              const isSelected =
                String(
                  selectedDeliverable?.id || selectedDeliverable?._id,
                ) === String(deliverable.id || deliverable._id);
              return (
                <div
                  key={deliverable.id || deliverable._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedDeliverable(deliverable)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedDeliverable(deliverable);
                    }
                  }}
                  className={cn(
                    "relative w-full cursor-pointer rounded-card border bg-white p-3 text-left transition-all",
                    isSelected
                      ? "border-primary shadow-[0_0_0_3px_rgba(58,90,254,0.10)]"
                      : "border-surface-border hover:border-primary/40 hover:shadow-soft",
                    deliverable.archived && "opacity-60",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="mb-1 truncate font-heading text-[14px] font-semibold text-text-heading">
                      {deliverable.title}
                    </h3>
                    {isAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild={true}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 shrink-0 p-0"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-44"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditDeliverable(deliverable);
                            }}
                            className="font-body text-[13px]"
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {!deliverable.archived && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeliverableToArchive(deliverable);
                              }}
                              className="font-body text-[13px]"
                            >
                              <Archive className="w-4 h-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeliverableToDelete(deliverable);
                            }}
                            className="font-body text-[13px] text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 font-body text-[12px] text-text-muted">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(deliverable.dueDate).toLocaleDateString()}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    {pastDue ? (
                      <StatusBadge
                        tone="danger"
                        label="Past Due"
                        icon={AlertCircle}
                      />
                    ) : daysUntil <= 3 ? (
                      <StatusBadge
                        tone="warning"
                        label={`${daysUntil} day${daysUntil === 1 ? "" : "s"} left`}
                        icon={Clock}
                      />
                    ) : (
                      <StatusBadge
                        tone="info"
                        label={`${daysUntil} day${daysUntil === 1 ? "" : "s"} left`}
                        icon={Clock}
                      />
                    )}
                    {deliverable.archived && (
                      <StatusBadge
                        tone="info"
                        label="Archived"
                        icon={Archive}
                      />
                    )}
                  </div>
                </div>
              );
            })}
            {!loading && total > limit && (
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                hasNext={hasNext}
                hasPrev={hasPrev}
                onNext={nextPage}
                onPrev={prevPage}
                onGoToPage={goToPage}
                totalItems={total}
                pageSize={limit}
              />
            )}
          </div>

          <div className="md:col-span-2">
            {selectedDeliverable && (
              <SectionCard key={selectedDeliverable.id}>
                <SectionCard.Header
                  title={selectedDeliverable.title}
                  description={selectedDeliverable.description}
                />
                <SectionCard.Body>
                  {(selectedDeliverable.requirements || []).length > 0 && (
                    <div className="rounded-input bg-surface-page p-3">
                      <p className="mb-2 font-body text-[12px] font-semibold text-text-muted">
                        Requirements
                      </p>
                      <ul className="space-y-1">
                        {(selectedDeliverable.requirements || []).map(
                          (req, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 font-body text-[13px] text-text-body"
                            >
                              <span className="mt-0.5 text-primary">•</span>
                              <span>{req}</span>
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}

                  <div className="mt-3">
                    <h4 className="mb-2 flex items-center gap-1.5 font-heading text-[14px] font-bold text-text-heading">
                      <Users className="h-4 w-4 text-primary" />
                      Submissions ({submissionsTotal})
                    </h4>

                    {submissionsLoading ? (
                      <div className="py-4 text-center font-body text-[13px] text-text-muted animate-pulse">
                        Loading submissions…
                      </div>
                    ) : submissions.length === 0 ? (
                      <EmptyStateBlock
                        variant="compact"
                        icon={Inbox}
                        tone="info"
                        title="No submissions yet"
                        description="Founders haven't submitted work for this deliverable"
                      />
                    ) : (
                      <div className="space-y-2">
                        {submissions.map((submission) => {
                          const statusIcon =
                            SUBMISSION_STATUS_ICON[submission.status];
                          const isReviewing =
                            reviewingSubmission?.id === submission.id;
                          return (
                            <div
                              key={submission.id}
                              className="rounded-input bg-surface-page p-3"
                            >
                              <div className="mb-2 flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <h5 className="truncate font-heading text-[14px] font-semibold text-text-heading">
                                    {submission.founder?.startupName ||
                                      "Unknown Startup"}
                                  </h5>
                                  <p className="truncate font-body text-[12px] text-text-muted">
                                    {submission.founder?.name}
                                  </p>
                                </div>
                                <StatusBadge
                                  status={submission.status}
                                  icon={statusIcon}
                                />
                              </div>

                              {submission.notes && (
                                <p className="mb-2 font-body text-[13px] text-text-body">
                                  {submission.notes}
                                </p>
                              )}

                              <div className="flex items-center gap-2">
                                <a
                                  href={submission.submissionUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 font-body text-[12px] font-medium text-primary hover:underline"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  View Submission
                                </a>
                                <span className="font-body text-[12px] text-text-muted">
                                  •
                                </span>
                                <span className="font-body text-[12px] text-text-muted">
                                  {new Date(
                                    submission.submittedAt,
                                  ).toLocaleDateString()}
                                </span>
                              </div>

                              {submission.feedback && (
                                <div className="mt-2 rounded-input border border-surface-border bg-white p-2">
                                  <p className="mb-0.5 font-body text-[12px] font-semibold text-text-muted">
                                    Feedback
                                  </p>
                                  <p className="font-body text-[13px] text-text-body">
                                    {submission.feedback}
                                  </p>
                                </div>
                              )}

                              {isAdmin && submission.status === "submitted" && (
                                <div className="mt-2">
                                  {isReviewing ? (
                                    <div className="space-y-2 rounded-input bg-white p-3">
                                      <div>
                                        <label className="mb-1 block font-body text-[12px] font-semibold text-text-muted">
                                          Status
                                        </label>
                                        <Select
                                          value={reviewData.status}
                                          onValueChange={(value) =>
                                            setReviewData({
                                              ...reviewData,
                                              status: value,
                                            })
                                          }
                                        >
                                          <SelectTrigger className="font-body text-[13px]">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {REVIEW_STATUS_OPTIONS.map(
                                              (option) => (
                                                <SelectItem
                                                  key={option.value}
                                                  value={option.value}
                                                  className="font-body text-[13px]"
                                                >
                                                  {option.label}
                                                </SelectItem>
                                              ),
                                            )}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <label className="mb-1 block font-body text-[12px] font-semibold text-text-muted">
                                          Feedback
                                        </label>
                                        <Textarea
                                          value={reviewData.feedback}
                                          onChange={(e) =>
                                            setReviewData({
                                              ...reviewData,
                                              feedback: e.target.value,
                                            })
                                          }
                                          placeholder="Provide feedback..."
                                          className="min-h-[50px] font-body text-[13px]"
                                        />
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          onClick={() =>
                                            handleReviewSubmission(
                                              submission.id,
                                            )
                                          }
                                          className={PRIMARY_BUTTON}
                                        >
                                          Submit Review
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            setReviewingSubmission(null);
                                            setReviewData({
                                              status: "approved",
                                              feedback: "",
                                            });
                                          }}
                                          className={OUTLINE_BUTTON}
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        setReviewingSubmission(submission)
                                      }
                                      className={`w-full ${OUTLINE_BUTTON}`}
                                    >
                                      <MessageSquare className="mr-2 h-4 w-4" />
                                      Review
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </SectionCard.Body>
              </SectionCard>
            )}
          </div>
        </div>
      )}

      <AlertDialog
        open={!!deliverableToArchive}
        onOpenChange={(open) => !open && setDeliverableToArchive(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-base font-bold text-text-heading">
              Archive Deliverable
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body text-[13px] text-text-body">
              {"Archive "}
              <strong>{deliverableToArchive?.title}</strong>? Founders will no
              longer see it in their default list but submissions stay
              accessible to admins.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="h-9 rounded-input font-body text-[13px] font-medium"
              disabled={isArchiving}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmArchiveDeliverable}
              disabled={isArchiving}
              className="h-9 rounded-input bg-primary font-body text-[13px] font-semibold text-white hover:bg-primary-hover"
            >
              {isArchiving ? "Archiving..." : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deliverableToDelete}
        onOpenChange={(open) => !open && setDeliverableToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-base font-bold text-text-heading">
              Delete Deliverable
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body text-[13px] text-text-body">
              {"Delete "}
              <strong>{deliverableToDelete?.title}</strong>? If founders have
              already submitted, the server will block the delete and ask you
              to archive instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="h-9 rounded-input font-body text-[13px] font-medium"
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteDeliverable}
              disabled={isDeleting}
              className="h-9 rounded-input bg-destructive font-body text-[13px] font-semibold text-white hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
