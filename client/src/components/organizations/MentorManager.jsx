/**
 * MENTOR MANAGER - Invite and manage mentors for cohorts
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
  UserPlus,
  Mail,
  Users,
  Trash2,
  CheckCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
export default function MentorManager({ organizationId, cohorts, isAdmin }) {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    cohortIds: [],
    expertise: "",
  });
  const [inviting, setInviting] = useState(false);
  useEffect(() => {
    loadMentors();
  }, [organizationId]);
  const loadMentors = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/mentors/organization/${organizationId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
          },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch mentors");
      const data = await response.json();
      setMentors(data.mentors);
    } catch (error) {
      console.error("Error loading mentors:", error);
      toast.error("Failed to load mentors");
    } finally {
      setLoading(false);
    }
  };
  const handleInviteMentor = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error("Name and email are required");
      return;
    }
    try {
      setInviting(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/mentors/invite`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            organizationId,
            ...formData,
          }),
        },
      );
      if (!response.ok) throw new Error("Failed to invite mentor");
      const { mentor, magicLink } = await response.json();
      toast.success(
        "Mentor invited successfully! Magic link sent to their email.",
      );

      // Reset form
      setFormData({
        name: "",
        email: "",
        cohortIds: [],
        expertise: "",
      });
      setShowInviteForm(false);

      // Reload mentors
      loadMentors();
    } catch (error) {
      console.error("Error inviting mentor:", error);
      toast.error("Failed to invite mentor");
    } finally {
      setInviting(false);
    }
  };
  const handleDeleteMentor = async (mentorId) => {
    if (!confirm("Are you sure you want to remove this mentor?")) return;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/mentors/${mentorId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
          },
        },
      );
      if (!response.ok) throw new Error("Failed to delete mentor");
      toast.success("Mentor removed successfully");
      loadMentors();
    } catch (error) {
      console.error("Error deleting mentor:", error);
      toast.error("Failed to remove mentor");
    }
  };
  const toggleCohort = (cohortId) => {
    setFormData((prev) => ({
      ...prev,
      cohortIds: prev.cohortIds.includes(cohortId)
        ? prev.cohortIds.filter((id) => id !== cohortId)
        : [...prev.cohortIds, cohortId],
    }));
  };
  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-[10px] text-muted-foreground">
            Only organization admins can manage mentors
          </p>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4" />
                Mentors
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Invite mentors to guide your cohort founders
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setShowInviteForm(!showInviteForm)}
              className="gap-2"
              variant={showInviteForm ? "outline" : "default"}
            >
              {showInviteForm ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {showInviteForm ? "Cancel" : "Invite Mentor"}
            </Button>
          </div>
        </CardHeader>
        {showInviteForm && (
          <CardContent className="border-t">
            <form onSubmit={handleInviteMentor} className="space-y-3 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] text-muted-foreground">
                    Mentor Name
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        name: e.target.value,
                      })
                    }
                    placeholder="e.g., Jane Smith"
                    required={true}
                    className="h-7 text-[10px]"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-muted-foreground">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        email: e.target.value,
                      })
                    }
                    placeholder="mentor@example.com"
                    required={true}
                    className="h-7 text-[10px]"
                  />
                </div>
              </div>
              <div>
                <label className="text-[9px] text-muted-foreground">
                  Expertise (Optional)
                </label>
                <Textarea
                  value={formData.expertise}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expertise: e.target.value,
                    })
                  }
                  placeholder="e.g., Product Strategy, Sales, Fundraising"
                  className="text-[10px] min-h-[50px]"
                />
              </div>
              <div>
                <label className="text-[9px] text-muted-foreground mb-2 block">
                  Assign to Cohorts (Optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {cohorts.map((cohort) => (
                    <Badge
                      key={cohort.id}
                      variant={
                        formData.cohortIds.includes(cohort.id)
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer text-[8px]"
                      onClick={() => toggleCohort(cohort.id)}
                    >
                      {cohort.name}
                    </Badge>
                  ))}
                  {cohorts.length === 0 && (
                    <p className="text-[9px] text-muted-foreground">
                      No cohorts available
                    </p>
                  )}
                </div>
              </div>
              <Button
                type="submit"
                size="sm"
                className="h-6 text-[9px]"
                disabled={inviting}
              >
                {inviting ? "Sending Invite..." : "Send Invite"}
              </Button>
            </form>
          </CardContent>
        )}
      </Card>
      {loading ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="animate-pulse text-[10px]">Loading mentors...</div>
          </CardContent>
        </Card>
      ) : mentors.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-[10px] text-muted-foreground">
              No mentors invited yet
            </p>
            <p className="text-[9px] text-muted-foreground mt-1">
              Invite mentors to provide guidance to your founders
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {mentors.map((mentor) => (
            <Card key={mentor.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-[11px] font-semibold">{mentor.name}</h3>
                    <p className="text-[9px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3" />
                      {mentor.email}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteMentor(mentor.id)}
                    className="h-6 w-6 p-0"
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
                {mentor.expertise && (
                  <p className="text-[9px] text-muted-foreground mb-2">
                    {mentor.expertise}
                  </p>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    variant={mentor.status === "active" ? "default" : "outline"}
                    className="text-[7px]"
                  >
                    {mentor.status === "active" ? (
                      <>
                        <CheckCircle className="w-2 h-2 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <Clock className="w-2 h-2 mr-1" />
                        Invited
                      </>
                    )}
                  </Badge>
                  <Badge variant="outline" className="text-[7px]">
                    {mentor.cohortIds?.length || 0}
                    {" Cohorts"}
                  </Badge>
                </div>
                {mentor.lastLoginAt && (
                  <p className="text-[8px] text-muted-foreground">
                    {"Last login: "}
                    {new Date(mentor.lastLoginAt).toLocaleDateString()}
                  </p>
                )}
                <p className="text-[8px] text-muted-foreground mt-1">
                  {"Invited: "}
                  {new Date(mentor.invitedAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
