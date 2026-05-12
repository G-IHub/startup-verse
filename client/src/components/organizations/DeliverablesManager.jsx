/**
 * DELIVERABLES MANAGER - Create, track, and review startup deliverables
 */
import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { unwrapData } from "../../utils/apiEnvelope";
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

function asDeliverableList(inner) {
  if (Array.isArray(inner)) return inner;
  return inner?.deliverables || [];
}

export default function DeliverablesManager({
  cohortId,
  organizationId,
  userId,
  isAdmin,
}) {
  const [deliverables, setDeliverables] = useState([]);
  const [selectedDeliverable, setSelectedDeliverable] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [reviewingSubmission, setReviewingSubmission] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    requirements: "",
  });
  const [reviewData, setReviewData] = useState({
    status: "approved",
    feedback: "",
  });

  useEffect(() => {
    loadDeliverables();
  }, [cohortId]);

  useEffect(() => {
    if (selectedDeliverable) {
      const sid = selectedDeliverable.id || selectedDeliverable._id;
      if (sid) loadSubmissions(sid);
    }
  }, [selectedDeliverable]);

  const loadDeliverables = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE}/cohorts/${cohortId}/deliverables`,
        { ...defaultOptions },
      );
      if (!response.ok) throw new Error("Failed to fetch deliverables");
      const list = asDeliverableList(unwrapData(await response.json()));
      const normalized = list.map((d) => ({
        ...d,
        id: d.id || d._id,
      }));
      setDeliverables(normalized);
      if (normalized.length > 0 && !selectedDeliverable) {
        setSelectedDeliverable(normalized[0]);
      }
    } catch (error) {
      console.error("Error loading deliverables:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async (deliverableId) => {
    try {
      const response = await fetch(
        `${API_BASE}/deliverables/${deliverableId}/submissions`,
        defaultOptions,
      );
      if (!response.ok) throw new Error("Failed to fetch submissions");
      const raw = unwrapData(await response.json());
      const list = Array.isArray(raw) ? raw : raw.submissions || [];
      setSubmissions(
        list.map((s) => ({
          ...s,
          id: s._id || s.id,
          feedback: s.feedback || s.review?.feedback || "",
        })),
      );
    } catch (error) {
      console.error("Error loading submissions:", error);
    }
  };

  const handleCreateDeliverable = async (e) => {
    e.preventDefault();
    try {
      const requirements = formData.requirements
        .split("\n")
        .filter((r) => r.trim())
        .map((r) => r.trim());
      const response = await fetch(
        `${API_BASE}/cohorts/${cohortId}/deliverables`,
        {
          ...defaultOptions,
          method: "POST",
          body: JSON.stringify({
            organizationId,
            title: formData.title,
            description: formData.description,
            dueDate: formData.dueDate,
            requirements,
            createdBy: userId,
          }),
        },
      );
      if (!response.ok) throw new Error("Failed to create deliverable");
      setFormData({
        title: "",
        description: "",
        dueDate: "",
        requirements: "",
      });
      setShowCreateForm(false);
      loadDeliverables();
    } catch (error) {
      console.error("Error creating deliverable:", error);
      alert("Failed to create deliverable");
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
      if (!response.ok) throw new Error("Failed to review submission");
      setReviewingSubmission(null);
      setReviewData({ status: "approved", feedback: "" });
      if (selectedDeliverable) {
        const sid = selectedDeliverable.id || selectedDeliverable._id;
        if (sid) loadSubmissions(sid);
      }
    } catch (error) {
      console.error("Error reviewing submission:", error);
      alert("Failed to review submission");
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
          title="Create Deliverable"
          description="Add a new deliverable for the cohort"
          triggerLabel="New Deliverable"
          isOpen={showCreateForm}
          onToggle={setShowCreateForm}
        >
          <form onSubmit={handleCreateDeliverable} className="space-y-3">
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
            <Button type="submit" size="sm" className={PRIMARY_BUTTON}>
              <Plus className="mr-2 h-4 w-4" />
              Create Deliverable
            </Button>
          </form>
        </CollapsibleFormCard>
      )}

      {loading ? (
        <SectionCard>
          <SectionCard.Body className="p-8 text-center">
            <div className="font-body text-[13px] text-text-muted animate-pulse">
              Loading deliverables...
            </div>
          </SectionCard.Body>
        </SectionCard>
      ) : deliverables.length === 0 ? (
        <SectionCard>
          <SectionCard.Body className="p-0">
            <EmptyStateBlock
              variant="centered"
              icon={FileText}
              tone="info"
              title="No deliverables yet"
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
                <button
                  type="button"
                  key={deliverable.id || deliverable._id}
                  onClick={() => setSelectedDeliverable(deliverable)}
                  className={cn(
                    "w-full rounded-card border bg-white p-3 text-left transition-all",
                    isSelected
                      ? "border-primary shadow-[0_0_0_3px_rgba(58,90,254,0.10)]"
                      : "border-surface-border hover:border-primary/40 hover:shadow-soft",
                  )}
                >
                  <h3 className="mb-1 truncate font-heading text-[14px] font-semibold text-text-heading">
                    {deliverable.title}
                  </h3>
                  <div className="flex items-center gap-1.5 font-body text-[12px] text-text-muted">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(deliverable.dueDate).toLocaleDateString()}
                  </div>
                  <div className="mt-2">
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
                  </div>
                </button>
              );
            })}
          </div>

          <div className="md:col-span-2">
            {selectedDeliverable && (
              <SectionCard>
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
                      Submissions ({submissions.length})
                    </h4>

                    {submissions.length === 0 ? (
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
    </div>
  );
}
