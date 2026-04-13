/**
 * DELIVERABLES MANAGER - Create, track, and review startup deliverables
 */
import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/apiBase.js";
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
  Plus,
  FileText,
  Calendar,
  Clock,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Users,
} from "lucide-react";
import { getAccessToken } from "../../app/session";
import { unwrapData } from "../../utils/apiEnvelope";

const API_BASE = API_BASE_URL;

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
      const token = getAccessToken();
      const response = await fetch(`${API_BASE}/cohorts/${cohortId}/deliverables`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!response.ok) throw new Error("Failed to fetch deliverables");
      const list = asDeliverableList(unwrapData(await response.json()));
      const normalized = list.map((d) => ({
        ...d,
        id: d.id || d._id,
      }));
      setDeliverables(normalized);

      // Auto-select first deliverable
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
      const token = getAccessToken();
      const response = await fetch(
        `${API_BASE}/deliverables/${deliverableId}/submissions`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch submissions");
      const raw = unwrapData(await response.json());
      setSubmissions(Array.isArray(raw) ? raw : raw.submissions || []);
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
      const token = getAccessToken();
      const response = await fetch(`${API_BASE}/cohorts/${cohortId}/deliverables`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId,
          title: formData.title,
          description: formData.description,
          dueDate: formData.dueDate,
          requirements,
          createdBy: userId,
        }),
      });
      if (!response.ok) throw new Error("Failed to create deliverable");

      // Reset form and reload
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
      const token = getAccessToken();
      const response = await fetch(
        `${API_BASE}/deliverables/submissions/${submissionId}/review`,
        {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: reviewData.status,
            feedback: reviewData.feedback,
            reviewedBy: userId,
          }),
        },
      );
      if (!response.ok) throw new Error("Failed to review submission");

      // Reset and reload
      setReviewingSubmission(null);
      setReviewData({
        status: "approved",
        feedback: "",
      });
      if (selectedDeliverable) {
        const sid = selectedDeliverable.id || selectedDeliverable._id;
        if (sid) loadSubmissions(sid);
      }
    } catch (error) {
      console.error("Error reviewing submission:", error);
      alert("Failed to review submission");
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
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-[11px]">Deliverables</CardTitle>
              <CardDescription className="text-[9px]">
                Track startup submissions and provide feedback
              </CardDescription>
            </div>
            {isAdmin && (
              <Button
                size="sm"
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="h-6 text-[9px]"
              >
                <Plus className="w-3 h-3 mr-1" />
                {showCreateForm ? "Cancel" : "New Deliverable"}
              </Button>
            )}
          </div>
        </CardHeader>
        {showCreateForm && (
          <CardContent className="border-t">
            <form onSubmit={handleCreateDeliverable} className="space-y-3 pt-3">
              <div>
                <label className="text-[9px] text-muted-foreground">
                  Title
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      title: e.target.value,
                    })
                  }
                  placeholder="e.g., Pitch Deck v1.0"
                  required={true}
                  className="h-7 text-[10px]"
                />
              </div>
              <div>
                <label className="text-[9px] text-muted-foreground">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  placeholder="What should startups deliver?"
                  className="text-[10px] min-h-[60px]"
                />
              </div>
              <div>
                <label className="text-[9px] text-muted-foreground">
                  Due Date
                </label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dueDate: e.target.value,
                    })
                  }
                  required={true}
                  className="h-7 text-[10px]"
                />
              </div>
              <div>
                <label className="text-[9px] text-muted-foreground">
                  Requirements (one per line)
                </label>
                <Textarea
                  value={formData.requirements}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      requirements: e.target.value,
                    })
                  }
                  placeholder="10-15 slides\nInclude financial projections\nProblem, solution, market size"
                  className="text-[10px] min-h-[80px]"
                />
              </div>
              <Button type="submit" size="sm" className="h-6 text-[9px]">
                Create Deliverable
              </Button>
            </form>
          </CardContent>
        )}
      </Card>
      {loading ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="animate-pulse text-[10px]">
              Loading deliverables...
            </div>
          </CardContent>
        </Card>
      ) : deliverables.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-[10px] text-muted-foreground">
              No deliverables yet
            </p>
            {isAdmin && (
              <p className="text-[9px] text-muted-foreground mt-1">
                Create deliverables to collect work from startups
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            {deliverables.map((deliverable) => {
              const daysUntil = getDaysUntilDue(deliverable.dueDate);
              const pastDue = isPastDue(deliverable.dueDate);
              return (
                <Card
                  key={deliverable.id || deliverable._id}
                  className={`cursor-pointer transition-all ${String(selectedDeliverable?.id || selectedDeliverable?._id) === String(deliverable.id || deliverable._id) ? "ring-2 ring-primary" : "hover:shadow-md"}`}
                  onClick={() => setSelectedDeliverable(deliverable)}
                >
                  <CardContent className="p-3">
                    <h3 className="text-[10px] font-medium mb-1 truncate">
                      {deliverable.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {new Date(deliverable.dueDate).toLocaleDateString()}
                    </div>
                    {pastDue ? (
                      <Badge
                        variant="outline"
                        className="text-[7px] mt-1.5 bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
                      >
                        <AlertCircle className="w-2.5 h-2.5 mr-1" />
                        Past Due
                      </Badge>
                    ) : daysUntil <= 3 ? (
                      <Badge
                        variant="outline"
                        className="text-[7px] mt-1.5 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20"
                      >
                        <Clock className="w-2.5 h-2.5 mr-1" />
                        {daysUntil}
                        {" days left"}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[7px] mt-1.5">
                        {daysUntil}
                        {" days left"}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="md:col-span-2">
            {selectedDeliverable && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-[10px]">
                    {selectedDeliverable.title}
                  </CardTitle>
                  <CardDescription className="text-[9px]">
                    {selectedDeliverable.description}
                  </CardDescription>
                  {(selectedDeliverable.requirements || []).length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-[8px] text-muted-foreground font-medium">
                        Requirements:
                      </p>
                      <ul className="text-[8px] text-muted-foreground space-y-0.5">
                        {(selectedDeliverable.requirements || []).map((req, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span className="text-primary">•</span>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[9px] font-medium flex items-center gap-1.5">
                        <Users className="w-3 h-3" />
                        Submissions ({submissions.length})
                      </h4>
                    </div>
                    {submissions.length === 0 ? (
                      <div className="p-6 text-center bg-muted/30 rounded-lg">
                        <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-[9px] text-muted-foreground">
                          No submissions yet
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {submissions.map((submission) => (
                          <Card key={submission.id}>
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1 min-w-0">
                                  <h5 className="text-[9px] font-medium truncate">
                                    {submission.founder?.startupName ||
                                      "Unknown Startup"}
                                  </h5>
                                  <p className="text-[8px] text-muted-foreground truncate">
                                    {submission.founder?.name}
                                  </p>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={`text-[7px] ${getStatusColor(submission.status)}`}
                                >
                                  {submission.status}
                                </Badge>
                              </div>
                              {submission.notes && (
                                <p className="text-[8px] text-muted-foreground mb-2">
                                  {submission.notes}
                                </p>
                              )}
                              <div className="flex items-center gap-2">
                                <a
                                  href={submission.submissionUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-[8px] text-primary hover:underline"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  View Submission
                                </a>
                                <span className="text-[8px] text-muted-foreground">
                                  •
                                </span>
                                <span className="text-[8px] text-muted-foreground">
                                  {new Date(
                                    submission.submittedAt,
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              {submission.feedback && (
                                <div className="mt-2 p-2 bg-muted/50 rounded border">
                                  <p className="text-[8px] text-muted-foreground mb-0.5">
                                    Feedback:
                                  </p>
                                  <p className="text-[8px]">
                                    {submission.feedback}
                                  </p>
                                </div>
                              )}
                              {isAdmin && submission.status === "submitted" && (
                                <div className="mt-2">
                                  {reviewingSubmission?.id === submission.id ? (
                                    <div className="space-y-2 p-2 bg-muted/30 rounded">
                                      <div>
                                        <label className="text-[8px] text-muted-foreground">
                                          Status
                                        </label>
                                        <select
                                          value={reviewData.status}
                                          onChange={(e) =>
                                            setReviewData({
                                              ...reviewData,
                                              status: e.target.value,
                                            })
                                          }
                                          className="w-full h-6 text-[9px] rounded-md border border-input bg-background px-2 mt-1"
                                        >
                                          <option value="approved">
                                            Approved
                                          </option>
                                          <option value="needs-revision">
                                            Needs Revision
                                          </option>
                                          <option value="reviewed">
                                            Reviewed
                                          </option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="text-[8px] text-muted-foreground">
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
                                          className="text-[9px] min-h-[50px] mt-1"
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
                                          className="h-6 text-[8px]"
                                        >
                                          Submit Review
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setReviewingSubmission(null);
                                            setReviewData({
                                              status: "approved",
                                              feedback: "",
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
                                      onClick={() =>
                                        setReviewingSubmission(submission)
                                      }
                                      className="h-6 text-[8px] w-full"
                                    >
                                      <MessageSquare className="w-3 h-3 mr-1" />
                                      Review
                                    </Button>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
