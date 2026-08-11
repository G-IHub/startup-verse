import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  CheckSquare,
  Clock,
  ExternalLink,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "../../config/apiBase.js";
import { unwrapData } from "../../utils/apiEnvelope";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  ProgramEmptyState,
  ProgramPanelShell,
  PROGRAM_ROW,
} from "./ProgramPanelShell";

const API_BASE = API_BASE_URL;

const defaultOptions = {
  credentials: "include",
  headers: { "Content-Type": "application/json" },
};

function statusBadgeClass(status) {
  switch (status) {
    case "approved":
      return "border-status-success/30 bg-status-success/10 text-status-success";
    case "revision_requested":
    case "needs-revision":
      return "border-status-warning/30 bg-status-warning/10 text-status-warning";
    case "rejected":
      return "border-status-error/30 bg-status-error/10 text-status-error";
    case "reviewed":
    case "submitted":
      return "border-primary/25 bg-primary-tint text-primary";
    default:
      return "border-surface-border bg-surface-page text-text-muted";
  }
}

function formatDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return String(value);
  }
}

function getSubmissionUrl(submission) {
  if (!submission) return "";
  if (submission.submissionUrl) return String(submission.submissionUrl);
  if (Array.isArray(submission.links) && submission.links[0]) {
    return String(submission.links[0]);
  }
  return "";
}

export default function ProgramDeliverablesPanel({ founderId }) {
  const [deliverables, setDeliverables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);
  const [submissionData, setSubmissionData] = useState({
    submissionUrl: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const loadDeliverables = async () => {
    if (!founderId) {
      setDeliverables([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE}/deliverables/founder/${founderId}`,
        defaultOptions,
      );
      if (!response.ok) throw new Error("Failed to fetch deliverables");
      const raw = unwrapData(await response.json());
      const list = Array.isArray(raw) ? raw : raw.deliverables || [];
      setDeliverables(list.map((d) => ({ ...d, id: d.id || d._id })));
    } catch (error) {
      console.error("Error loading deliverables:", error);
      toast.error("Could not load deliverables.");
      setDeliverables([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeliverables();
  }, [founderId]);

  const handleSubmit = async (deliverableId) => {
    try {
      setSaving(true);
      const links = submissionData.submissionUrl
        ? [submissionData.submissionUrl]
        : [];
      const content = [submissionData.submissionUrl, submissionData.notes]
        .filter(Boolean)
        .join("\n");
      const response = await fetch(
        `${API_BASE}/deliverables/${deliverableId}/submit`,
        {
          ...defaultOptions,
          method: "POST",
          body: JSON.stringify({
            founderId,
            content,
            links,
            attachments: [],
          }),
        },
      );
      if (!response.ok) throw new Error("Failed to submit deliverable");
      setSubmissionData({ submissionUrl: "", notes: "" });
      setSubmitting(null);
      toast.success("Deliverable submitted.");
      await loadDeliverables();
    } catch (error) {
      console.error("Error submitting deliverable:", error);
      toast.error("Failed to submit deliverable.");
    } finally {
      setSaving(false);
    }
  };

  const isPastDue = (dueDate) =>
    dueDate ? new Date(dueDate).getTime() < Date.now() : false;

  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return null;
    return Math.ceil(
      (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
  };

  const sortedDeliverables = [...deliverables].sort((a, b) => {
    if (!a.mySubmission && b.mySubmission) return -1;
    if (a.mySubmission && !b.mySubmission) return 1;
    const da = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
    const db = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
    return da - db;
  });

  return (
    <ProgramPanelShell
      icon={CheckSquare}
      title="Deliverables"
      description="Submit required work assigned by your organization program."
    >
      {loading ? (
        <p className="font-body text-sm text-text-muted">Loading deliverables…</p>
      ) : sortedDeliverables.length === 0 ? (
        <ProgramEmptyState
          icon={CheckSquare}
          title="No deliverables yet"
          description="When your organization assigns deliverables, they will appear here for you to submit."
        />
      ) : (
        sortedDeliverables.map((deliverable) => {
          const daysUntil = getDaysUntilDue(deliverable.dueDate);
          const pastDue = isPastDue(deliverable.dueDate);
          const isEditing = submitting === deliverable.id;
          const submissionUrl = getSubmissionUrl(deliverable.mySubmission);

          return (
            <div key={deliverable.id} className={PROGRAM_ROW}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-heading text-sm font-bold text-text-heading">
                    {deliverable.title || "Deliverable"}
                  </p>
                  <p className="mt-0.5 font-body text-xs text-text-muted">
                    {deliverable.cohortName || "Program"}
                    {deliverable.dueDate
                      ? ` · Due ${formatDate(deliverable.dueDate)}`
                      : ""}
                  </p>
                </div>
                {deliverable.mySubmission ? (
                  <Badge
                    variant="outline"
                    className={`capitalize ${statusBadgeClass(deliverable.mySubmission.status)}`}
                  >
                    {deliverable.mySubmission.status === "approved" ? (
                      <CheckCircle className="mr-1 h-3 w-3" aria-hidden />
                    ) : null}
                    {String(deliverable.mySubmission.status || "submitted").replace(
                      /_/g,
                      " ",
                    )}
                  </Badge>
                ) : pastDue ? (
                  <Badge
                    variant="outline"
                    className="border-status-error/30 bg-status-error/10 text-status-error"
                  >
                    <AlertCircle className="mr-1 h-3 w-3" aria-hidden />
                    Past due
                  </Badge>
                ) : daysUntil != null && daysUntil <= 3 ? (
                  <Badge
                    variant="outline"
                    className="border-status-warning/30 bg-status-warning/10 text-status-warning"
                  >
                    <Clock className="mr-1 h-3 w-3" aria-hidden />
                    Due in {daysUntil} day{daysUntil === 1 ? "" : "s"}
                  </Badge>
                ) : daysUntil != null ? (
                  <Badge variant="outline">
                    Due in {daysUntil} day{daysUntil === 1 ? "" : "s"}
                  </Badge>
                ) : null}
              </div>

              {deliverable.description ? (
                <p className="mt-2 font-body text-sm text-text-body">
                  {deliverable.description}
                </p>
              ) : null}

              {Array.isArray(deliverable.requirements) &&
              deliverable.requirements.length > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 font-body text-sm text-text-muted">
                  {deliverable.requirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              ) : null}

              {deliverable.mySubmission ? (
                <div className="mt-3 rounded-input border border-surface-border bg-surface-card px-3 py-3">
                  <p className="font-heading text-xs font-semibold text-text-heading">
                    Your submission
                  </p>
                  {submissionUrl ? (
                    <a
                      href={submissionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 font-body text-sm font-medium text-primary hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      View submission
                    </a>
                  ) : null}
                  {deliverable.mySubmission.notes ||
                  deliverable.mySubmission.content ? (
                    <p className="mt-1 font-body text-sm text-text-muted">
                      {deliverable.mySubmission.notes ||
                        deliverable.mySubmission.content}
                    </p>
                  ) : null}
                  {deliverable.mySubmission.submittedAt ? (
                    <p className="mt-1 font-body text-xs text-text-muted">
                      Submitted {formatDate(deliverable.mySubmission.submittedAt)}
                    </p>
                  ) : null}
                  {deliverable.mySubmission.feedback ? (
                    <div className="mt-2 rounded-input bg-primary-tint/50 px-3 py-2">
                      <p className="font-body text-xs font-semibold text-text-heading">
                        Feedback
                      </p>
                      <p className="mt-0.5 font-body text-sm text-text-body">
                        {deliverable.mySubmission.feedback}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : isEditing ? (
                <div className="mt-3 space-y-3 rounded-input border border-surface-border bg-surface-card px-3 py-3">
                  <div>
                    <label className="font-body text-xs font-medium text-text-muted">
                      Submission URL
                    </label>
                    <Input
                      value={submissionData.submissionUrl}
                      onChange={(e) =>
                        setSubmissionData({
                          ...submissionData,
                          submissionUrl: e.target.value,
                        })
                      }
                      placeholder="https://…"
                      type="url"
                      className="mt-1 rounded-input"
                    />
                  </div>
                  <div>
                    <label className="font-body text-xs font-medium text-text-muted">
                      Notes (optional)
                    </label>
                    <Textarea
                      value={submissionData.notes}
                      onChange={(e) =>
                        setSubmissionData({
                          ...submissionData,
                          notes: e.target.value,
                        })
                      }
                      placeholder="Any notes about your submission…"
                      className="mt-1 min-h-[80px] rounded-input"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSubmit(deliverable.id)}
                      disabled={!submissionData.submissionUrl || saving}
                    >
                      {saving ? "Submitting…" : "Submit"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSubmitting(null);
                        setSubmissionData({ submissionUrl: "", notes: "" });
                      }}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setSubmitting(deliverable.id)}
                >
                  <Upload className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  Submit work
                </Button>
              )}
            </div>
          );
        })
      )}
    </ProgramPanelShell>
  );
}
