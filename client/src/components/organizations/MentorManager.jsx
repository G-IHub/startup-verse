/**
 * MENTOR MANAGER - Invite and manage mentors for cohorts
 */
import React, { useState, useCallback } from "react";
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
  Pencil,
  X as XIcon,
  Save as SaveIcon,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { unwrapData } from "../../utils/apiEnvelope";
import {
  updateMentor,
  getOrganizationMentorsPage,
} from "../../utils/api/organizationApi";
import { useOrgListQuery } from "../../hooks/useOrgListQuery";
import PaginationControls from "../shared/PaginationControls";
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
  const [statusFilter, setStatusFilter] = useState("");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    cohortIds: [],
    expertise: "",
  });
  const [inviting, setInviting] = useState(false);
  // Step 2.10: inline edit for expertise + status on each mentor row.
  const [editingMentorId, setEditingMentorId] = useState(null);
  const [editForm, setEditForm] = useState({ expertise: "", status: "active" });
  const [savingMentorEdit, setSavingMentorEdit] = useState(false);

  const {
    items: mentors,
    total,
    limit,
    loading,
    q: searchQuery,
    setSearch,
    currentPage,
    totalPages,
    hasNext,
    hasPrev,
    goToPage,
    nextPage,
    prevPage,
    refresh,
  } = useOrgListQuery({
    fetchFn: useCallback(
      (params) =>
        getOrganizationMentorsPage(organizationId, {
          ...params,
          status: statusFilter || undefined,
        }),
      [organizationId, statusFilter],
    ),
    initialLimit: 25,
  });

  const beginEditMentor = (mentor) => {
    setEditingMentorId(mentor.id);
    setEditForm({
      expertise: Array.isArray(mentor.expertise)
        ? mentor.expertise.join(", ")
        : String(mentor.expertise || ""),
      status: mentor.status === "revoked" ? "revoked" : "active",
    });
  };

  const cancelEditMentor = () => {
    setEditingMentorId(null);
    setEditForm({ expertise: "", status: "active" });
  };

  const saveEditMentor = async (mentorId) => {
    try {
      setSavingMentorEdit(true);
      await updateMentor(mentorId, {
        expertise: editForm.expertise,
        status: editForm.status,
      });
      toast.success("Mentor updated.");
      cancelEditMentor();
      refresh();
    } catch (error) {
      console.error("Error updating mentor:", error);
      toast.error(error?.message || "Failed to update mentor");
    } finally {
      setSavingMentorEdit(false);
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
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        // Step 2.10: branch on stable server error codes so admins see why
        // an invite failed, not a generic "Failed to invite mentor" toast.
        if (response.status === 404 && payload?.code === "NOT_A_REGISTERED_USER") {
          toast.error(
            "That email isn't on StartupVerse yet. Ask them to sign up first, then try again.",
          );
          return;
        }
        if (response.status === 409 && payload?.code === "MENTOR_ALREADY_LINKED") {
          toast.warning("That user is already a mentor for this organisation.");
          return;
        }
        toast.error(payload?.message || "Failed to invite mentor");
        return;
      }
      unwrapData(payload);
      toast.success(
        "Mentor invited. We've emailed them a magic link to access the mentor portal.",
      );
      setFormData({
        email: "",
        cohortIds: [],
        expertise: "",
      });
      setShowInviteForm(false);
      refresh();
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
      refresh();
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
            <p className="mt-1 font-body text-[12px] text-text-muted">
              The mentor's display name will be pulled from their registered
              StartupVerse account.
            </p>
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

      <SectionCard>
        <SectionCard.Body className="p-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search mentors by name or email..."
                className="pl-8 font-body text-[13px]"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {["", "active", "pending", "revoked"].map((s) => (
                <button
                  key={s || "all"}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "inline-flex items-center rounded-full border-0 px-[10px] py-[2px] font-body text-[11px] font-semibold capitalize transition-colors",
                    statusFilter === s
                      ? "bg-primary text-white"
                      : "bg-primary-tint text-primary hover:bg-primary/20",
                  )}
                >
                  {s || "all"}
                </button>
              ))}
            </div>
          </div>
        </SectionCard.Body>
      </SectionCard>

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
            const status = mentor.status || "active";
            const isActive = status === "active";
            const displayName = mentor.name || mentor.email || "Mentor";
            const initials = displayName
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((s) => s[0]?.toUpperCase() || "")
              .join("") || "M";
            const expertise = Array.isArray(mentor.expertise)
              ? mentor.expertise.join(", ")
              : mentor.expertise || "";
            const cohortCount = mentor.cohortIds?.length ?? 0;
            const invitedAt = mentor.invitedAt || mentor.createdAt || null;
            return (
              <SectionCard key={mentor.id}>
                <SectionCard.Body>
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {mentor.avatarUrl ? (
                        <img
                          src={mentor.avatarUrl}
                          alt={displayName}
                          className="h-10 w-10 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-tint font-body text-[13px] font-semibold text-primary">
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-heading text-[14px] font-bold text-text-heading">
                          {displayName}
                        </h3>
                        <p className="mt-0.5 flex items-center gap-1 truncate font-body text-[12px] text-text-muted">
                          <Mail className="h-3 w-3" />
                          {mentor.email || "No email on file"}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {editingMentorId === mentor.id ? null : (
                        <Button
                          size="sm"
                          onClick={() => beginEditMentor(mentor)}
                          className="h-9 w-9 rounded-input p-0 text-text-muted hover:bg-primary-tint hover:text-primary"
                          aria-label="Edit mentor"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleDeleteMentor(mentor.id)}
                        className="h-9 w-9 rounded-input p-0 text-[#ff4f6b] hover:bg-[#fff1f2]"
                        aria-label="Remove mentor"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {editingMentorId === mentor.id ? (
                    <div className="mb-3 space-y-2 rounded-input border border-surface-border bg-surface-page p-3">
                      <div>
                        <label className="mb-1 block font-body text-[12px] font-semibold uppercase tracking-wide text-text-muted">
                          Expertise
                        </label>
                        <Textarea
                          value={editForm.expertise}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              expertise: e.target.value,
                            }))
                          }
                          placeholder="e.g., Product Strategy, Sales, Fundraising"
                          className="min-h-[50px] font-body text-[13px]"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block font-body text-[12px] font-semibold uppercase tracking-wide text-text-muted">
                          Status
                        </label>
                        <select
                          value={editForm.status}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              status: e.target.value,
                            }))
                          }
                          className="h-9 w-full rounded-input border border-surface-border bg-white px-2 font-body text-[13px]"
                        >
                          <option value="active">Active</option>
                          <option value="revoked">Revoked</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          type="button"
                          onClick={() => saveEditMentor(mentor.id)}
                          disabled={savingMentorEdit}
                          className={PRIMARY_BUTTON}
                        >
                          <SaveIcon className="mr-2 h-3.5 w-3.5" />
                          {savingMentorEdit ? "Saving…" : "Save"}
                        </Button>
                        <Button
                          size="sm"
                          type="button"
                          onClick={cancelEditMentor}
                          disabled={savingMentorEdit}
                          className="h-9 rounded-input bg-transparent font-body text-[13px] font-semibold text-text-muted hover:bg-surface-page"
                        >
                          <XIcon className="mr-2 h-3.5 w-3.5" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {expertise && (
                        <p className="mb-2 font-body text-[13px] text-text-body">
                          {expertise}
                        </p>
                      )}

                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <StatusBadge
                          status={isActive ? "active" : "invited"}
                          icon={isActive ? CheckCircle : Clock}
                        />
                        <StatusBadge
                          tone="info"
                          label={`${cohortCount} Cohorts`}
                        />
                      </div>
                    </>
                  )}

                  {mentor.lastLoginAt && (
                    <p className="font-body text-[12px] text-text-muted">
                      Last login:{" "}
                      {new Date(mentor.lastLoginAt).toLocaleDateString()}
                    </p>
                  )}
                  {invitedAt && (
                    <p className="mt-1 font-body text-[12px] text-text-muted">
                      Invited: {new Date(invitedAt).toLocaleDateString()}
                    </p>
                  )}
                </SectionCard.Body>
              </SectionCard>
            );
          })}
        </div>
      )}

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
  );
}
