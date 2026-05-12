/**
 * MENTOR MANAGER - Invite and manage mentors for cohorts
 */
import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/apiBase.js";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  UserPlus,
  Mail,
  Users,
  Trash2,
  CheckCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { unwrapData } from "../../utils/apiEnvelope";
import {
  SectionCard,
  CollapsibleFormCard,
  StatusBadge,
  EmptyStateBlock,
} from "./_primitives";
import { cn } from "../ui/utils";

const API_BASE = API_BASE_URL;

const defaultOptions = {
  credentials: "include",
  headers: { "Content-Type": "application/json" },
};

const PRIMARY_BUTTON =
  "h-9 rounded-input bg-primary font-body text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(58,90,254,0.25)] hover:bg-primary-hover";

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
        `${API_BASE}/organizations/${organizationId}/mentors`,
        defaultOptions,
      );
      if (!response.ok) throw new Error("Failed to fetch mentors");
      const inner = unwrapData(await response.json());
      setMentors(inner.mentors || []);
    } catch (error) {
      console.error("Error loading mentors:", error);
      toast.error("Failed to load mentors");
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMentor = async (e) => {
    e.preventDefault();
    if (!formData.email?.trim()) {
      toast.error("Email is required");
      return;
    }
    try {
      setInviting(true);
      const response = await fetch(
        `${API_BASE}/organizations/${organizationId}/mentors`,
        {
          ...defaultOptions,
          method: "POST",
          body: JSON.stringify({
            email: formData.email,
            expertise: formData.expertise,
          }),
        },
      );
      if (!response.ok) throw new Error("Failed to invite mentor");
      unwrapData(await response.json());
      toast.success(
        "Mentor linked to your organization. They must use a registered StartupVerse email.",
      );
      setFormData({
        name: "",
        email: "",
        cohortIds: [],
        expertise: "",
      });
      setShowInviteForm(false);
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
      const response = await fetch(`${API_BASE}/mentors/${mentorId}`, {
        ...defaultOptions,
        method: "DELETE",
      });
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
      <SectionCard>
        <SectionCard.Body className="p-0">
          <EmptyStateBlock
            variant="centered"
            icon={Users}
            tone="info"
            title="Admins only"
            description="Only organization admins can manage mentors"
          />
        </SectionCard.Body>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-4 font-body">
      <CollapsibleFormCard
        title="Mentors"
        description="Link mentors by the email on their StartupVerse account (they must already be registered)."
        triggerLabel="Invite Mentor"
        triggerIcon={UserPlus}
        isOpen={showInviteForm}
        onToggle={setShowInviteForm}
      >
        <form onSubmit={handleInviteMentor} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-2 block font-body text-[13px] font-medium text-text-heading">
                Display name (optional)
              </label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="For your notes only"
                className="font-body text-[13px]"
              />
            </div>
            <div>
              <label className="mb-2 block font-body text-[13px] font-medium text-text-heading">
                Email
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="mentor@example.com"
                required={true}
                className="font-body text-[13px]"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block font-body text-[13px] font-medium text-text-heading">
              Expertise (optional)
            </label>
            <Textarea
              value={formData.expertise}
              onChange={(e) =>
                setFormData({ ...formData, expertise: e.target.value })
              }
              placeholder="e.g., Product Strategy, Sales, Fundraising"
              className="min-h-[60px] font-body text-[13px]"
            />
          </div>

          <div>
            <label className="mb-2 block font-body text-[13px] font-medium text-text-heading">
              Assign to Cohorts (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {cohorts.map((cohort) => {
                const selected = formData.cohortIds.includes(cohort.id);
                return (
                  <button
                    type="button"
                    key={cohort.id}
                    onClick={() => toggleCohort(cohort.id)}
                    className={cn(
                      "inline-flex items-center rounded-full border-0 px-[10px] py-[2px] font-body text-[11px] font-semibold capitalize transition-colors",
                      selected
                        ? "bg-primary text-white"
                        : "bg-primary-tint text-primary hover:bg-primary/20",
                    )}
                  >
                    {cohort.name}
                  </button>
                );
              })}
              {cohorts.length === 0 && (
                <p className="font-body text-[12px] text-text-muted">
                  No cohorts available
                </p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            size="sm"
            className={PRIMARY_BUTTON}
            disabled={inviting}
          >
            <Mail className="mr-2 h-4 w-4" />
            {inviting ? "Sending Invite..." : "Send Invite"}
          </Button>
        </form>
      </CollapsibleFormCard>

      {loading ? (
        <SectionCard>
          <SectionCard.Body className="p-8 text-center">
            <div className="animate-pulse font-body text-[13px] text-text-muted">
              Loading mentors...
            </div>
          </SectionCard.Body>
        </SectionCard>
      ) : mentors.length === 0 ? (
        <SectionCard>
          <SectionCard.Body className="p-0">
            <EmptyStateBlock
              variant="centered"
              icon={Users}
              tone="info"
              title="No mentors invited yet"
              description="Invite mentors to provide guidance to your founders"
              action={
                <Button
                  size="sm"
                  onClick={() => setShowInviteForm(true)}
                  className={PRIMARY_BUTTON}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Mentor
                </Button>
              }
            />
          </SectionCard.Body>
        </SectionCard>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {mentors.map((mentor) => {
            const isActive = mentor.status === "active";
            return (
              <SectionCard key={mentor.id}>
                <SectionCard.Body>
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-heading text-[14px] font-bold text-text-heading">
                        {mentor.name}
                      </h3>
                      <p className="mt-0.5 flex items-center gap-1 truncate font-body text-[12px] text-text-muted">
                        <Mail className="h-3 w-3" />
                        {mentor.email}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleDeleteMentor(mentor.id)}
                      className="h-9 w-9 shrink-0 rounded-input p-0 text-[#ff4f6b] hover:bg-[#fff1f2]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {mentor.expertise && (
                    <p className="mb-2 font-body text-[13px] text-text-body">
                      {mentor.expertise}
                    </p>
                  )}

                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <StatusBadge
                      status={isActive ? "active" : "invited"}
                      icon={isActive ? CheckCircle : Clock}
                    />
                    <StatusBadge
                      tone="info"
                      label={`${mentor.cohortIds?.length || 0} Cohorts`}
                    />
                  </div>

                  {mentor.lastLoginAt && (
                    <p className="font-body text-[12px] text-text-muted">
                      Last login:{" "}
                      {new Date(mentor.lastLoginAt).toLocaleDateString()}
                    </p>
                  )}
                  <p className="mt-1 font-body text-[12px] text-text-muted">
                    Invited:{" "}
                    {new Date(mentor.invitedAt).toLocaleDateString()}
                  </p>
                </SectionCard.Body>
              </SectionCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
