/**
 * FOUNDER DELIVERABLES VIEW - View and submit deliverables
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
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import {
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
  Upload,
  ExternalLink,
} from "lucide-react";
import { getAccessToken } from "../../app/session";
import { unwrapData } from "../../utils/apiEnvelope";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export default function FounderDeliverablesView({ founderId, onBack }) {
  const [deliverables, setDeliverables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);
  const [submissionData, setSubmissionData] = useState({
    submissionUrl: "",
    notes: "",
  });
  useEffect(() => {
    loadDeliverables();
  }, [founderId]);
  const loadDeliverables = async () => {
    try {
      setLoading(true);
      const token = getAccessToken();
      const response = await fetch(`${API_BASE}/deliverables/founder/${founderId}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!response.ok) throw new Error("Failed to fetch deliverables");
      const raw = unwrapData(await response.json());
      const list = Array.isArray(raw) ? raw : raw.deliverables || [];
      setDeliverables(
        list.map((d) => ({ ...d, id: d.id || d._id })),
      );
    } catch (error) {
      console.error("Error loading deliverables:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async (deliverableId) => {
    try {
      const token = getAccessToken();
      const links = submissionData.submissionUrl
        ? [submissionData.submissionUrl]
        : [];
      const content = [submissionData.submissionUrl, submissionData.notes]
        .filter(Boolean)
        .join("\n");
      const response = await fetch(
        `${API_BASE}/deliverables/${deliverableId}/submit`,
        {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            founderId,
            content,
            links,
            attachments: [],
          }),
        },
      );
      if (!response.ok) throw new Error("Failed to submit deliverable");

      // Reset and reload
      setSubmissionData({
        submissionUrl: "",
        notes: "",
      });
      setSubmitting(null);
      loadDeliverables();
      alert("Deliverable submitted successfully!");
    } catch (error) {
      console.error("Error submitting deliverable:", error);
      alert("Failed to submit deliverable");
    }
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
      case "needs-revision":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
      case "reviewed":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
      case "submitted":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";
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
  const sortedDeliverables = [...deliverables].sort((a, b) => {
    // Unsubmitted first, then by due date
    if (!a.mySubmission && b.mySubmission) return -1;
    if (a.mySubmission && !b.mySubmission) return 1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="animate-pulse">Loading deliverables...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Deliverables
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Submit required work to your accelerator programs
            </p>
          </div>
        </div>
        {deliverables.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No deliverables yet
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                When your accelerator or organization assigns deliverables,
                they'll appear here for you to submit.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedDeliverables.map((deliverable) => {
              const daysUntil = getDaysUntilDue(deliverable.dueDate);
              const pastDue = isPastDue(deliverable.dueDate);
              const isSubmitting = submitting === deliverable.id;
              return (
                <Card key={deliverable.id}>
                  <CardHeader className="pb-2 pt-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-[10px] flex items-center gap-2">
                          {deliverable.title}
                          {deliverable.mySubmission ? (
                            <Badge
                              variant="outline"
                              className={`text-[7px] ${getStatusColor(deliverable.mySubmission.status)}`}
                            >
                              {deliverable.mySubmission.status ===
                                "approved" && (
                                <CheckCircle className="w-2.5 h-2.5 mr-0.5" />
                              )}
                              {deliverable.mySubmission.status}
                            </Badge>
                          ) : pastDue ? (
                            <Badge
                              variant="outline"
                              className="text-[7px] bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
                            >
                              <AlertCircle className="w-2.5 h-2.5 mr-0.5" />
                              Past Due
                            </Badge>
                          ) : daysUntil <= 3 ? (
                            <Badge
                              variant="outline"
                              className="text-[7px] bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20"
                            >
                              <Clock className="w-2.5 h-2.5 mr-0.5" />
                              {"Due in "}
                              {daysUntil}
                              {" days"}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[7px]">
                              {"Due in "}
                              {daysUntil}
                              {" days"}
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="text-[9px]">
                          {deliverable.cohortName}
                          {" • Due "}
                          {new Date(deliverable.dueDate).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {deliverable.description && (
                      <p className="text-[9px] text-muted-foreground">
                        {deliverable.description}
                      </p>
                    )}
                    {deliverable.requirements.length > 0 && (
                      <div>
                        <p className="text-[8px] text-muted-foreground font-medium mb-1">
                          Requirements:
                        </p>
                        <ul className="text-[8px] text-muted-foreground space-y-0.5">
                          {deliverable.requirements.map((req, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="text-primary">•</span>
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {deliverable.mySubmission ? (
                      <div className="p-2 bg-muted/30 rounded border">
                        <p className="text-[9px] font-medium mb-1">
                          Your Submission
                        </p>
                        <div className="space-y-1">
                          <a
                            href={deliverable.mySubmission.submissionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[9px] text-primary hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View Submission
                          </a>
                          {deliverable.mySubmission.notes && (
                            <p className="text-[8px] text-muted-foreground">
                              {deliverable.mySubmission.notes}
                            </p>
                          )}
                          <p className="text-[8px] text-muted-foreground">
                            {"Submitted "}
                            {new Date(
                              deliverable.mySubmission.submittedAt,
                            ).toLocaleDateString()}
                          </p>
                          {deliverable.mySubmission.feedback && (
                            <div className="mt-2 p-2 bg-muted/50 rounded">
                              <p className="text-[8px] text-muted-foreground mb-0.5">
                                Feedback:
                              </p>
                              <p className="text-[8px]">
                                {deliverable.mySubmission.feedback}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        {isSubmitting ? (
                          <div className="space-y-2 p-2 bg-muted/30 rounded">
                            <div>
                              <label className="text-[8px] text-muted-foreground">
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
                                placeholder="https://..."
                                required={true}
                                type="url"
                                className="h-6 text-[9px] mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-[8px] text-muted-foreground">
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
                                placeholder="Any notes about your submission..."
                                className="text-[9px] min-h-[50px] mt-1"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSubmit(deliverable.id)}
                                disabled={!submissionData.submissionUrl}
                                className="h-6 text-[8px]"
                              >
                                Submit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSubmitting(null);
                                  setSubmissionData({
                                    submissionUrl: "",
                                    notes: "",
                                  });
                                }}
                                className="h-6 text-[8px]"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSubmitting(deliverable.id)}
                            className="h-6 text-[9px] w-full"
                          >
                            <Upload className="w-3 h-3 mr-1" />
                            Submit Work
                          </Button>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
