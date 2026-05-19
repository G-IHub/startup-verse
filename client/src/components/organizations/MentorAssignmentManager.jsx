/**
 * MENTOR ASSIGNMENT MANAGER - Flexible Mentorship Management
 */
import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/apiBase.js";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Users,
  UserPlus,
  UserMinus,
  Search,
  Check,
  Rocket,
  Mail,
  UsersRound,
  Video,
  Copy,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent } from "../ui/dialog";
import { unwrapData } from "../../utils/apiEnvelope";
import {
  SectionCard,
  SectionHeader,
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
const OUTLINE_BUTTON =
  "h-9 rounded-input border border-surface-border bg-white font-body text-[13px] font-medium text-text-body hover:bg-primary-tint hover:text-primary";

export default function MentorAssignmentManager({
  cohortId,
  organizationId,
  cohorts,
  isAdmin,
}) {
  const [mentors, setMentors] = useState([]);
  const [founders, setFounders] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [showJoinMeetingDialog, setShowJoinMeetingDialog] = useState(false);
  const [meetingToJoin, setMeetingToJoin] = useState(null);

  useEffect(() => {
    loadData();
  }, [cohortId, organizationId]);

  const generateMentorRoomLink = (mentorId) => {
    const roomName = `Mentor-${mentorId}`;
    return `${window.location.origin}/join/${roomName}`;
  };

  const copyMeetingLink = (mentorId) => {
    const link = generateMentorRoomLink(mentorId);
    navigator.clipboard.writeText(link);
    toast.success("Meeting link copied to clipboard!");
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const mentorsRes = await fetch(
        `${API_BASE}/organizations/${organizationId}/mentors`,
        defaultOptions,
      );
      const mentorsInner = unwrapData(await mentorsRes.json());
      const mentorList = mentorsInner.mentors || [];
      setMentors(mentorList);

      const foundersRes = await fetch(
        `${API_BASE}/cohorts/${cohortId}/members`,
        defaultOptions,
      );
      const foundersRaw = unwrapData(await foundersRes.json());
      const memberRows = Array.isArray(foundersRaw)
        ? foundersRaw
        : foundersRaw.members || [];

      const transformedFounders = memberRows.map((member) => ({
        id: member.founderId,
        name: member.founderName || member.name,
        email: member.founderEmail || member.email,
        startupName: member.startupName || "Unknown Startup",
        startupStage: member.currentStage || "ideation",
      }));
      setFounders(transformedFounders);

      const assignmentsMap = {};
      for (const mentor of mentorList) {
        const mid = mentor.id || mentor._id;
        const assignRes = await fetch(
          `${API_BASE}/mentors/${mid}/assigned-founders`,
          defaultOptions,
        );
        const assignInner = unwrapData(await assignRes.json());
        const ids =
          assignInner.founderIds ||
          (assignInner.founders || []).map((f) => f.id);
        assignmentsMap[mid] = ids || [];
      }
      setAssignments(assignmentsMap);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignFounder = async (mentorId, founderId) => {
    try {
      setAssigning(true);
      const response = await fetch(
        `${API_BASE}/mentors/${mentorId}/assign-founder`,
        {
          ...defaultOptions,
          method: "POST",
          body: JSON.stringify({ founderId, cohortId }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Failed to assign founder",
        );
      }
      setAssignments((prev) => ({
        ...prev,
        [mentorId]: [...(prev[mentorId] || []), founderId],
      }));
      toast.success("Founder assigned successfully!");
    } catch (error) {
      console.error("Error assigning founder:", error);
      toast.error(`Failed to assign founder: ${error.message}`);
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassignFounder = async (mentorId, founderId) => {
    try {
      setAssigning(true);
      const response = await fetch(
        `${API_BASE}/mentors/${mentorId}/unassign-founder/${founderId}`,
        {
          ...defaultOptions,
          method: "DELETE",
        },
      );
      if (!response.ok) throw new Error("Failed to unassign founder");
      setAssignments((prev) => ({
        ...prev,
        [mentorId]: (prev[mentorId] || []).filter((id) => id !== founderId),
      }));
      toast.success("Founder unassigned successfully!");
    } catch (error) {
      console.error("Error unassigning founder:", error);
      toast.error("Failed to unassign founder");
    } finally {
      setAssigning(false);
    }
  };

  const isAssigned = (mentorId, founderId) =>
    assignments[mentorId]?.includes(founderId) || false;

  const filteredFounders = founders.filter((f) => {
    const q = searchQuery.toLowerCase();
    return (
      (f.name || "").toLowerCase().includes(q) ||
      (f.email || "").toLowerCase().includes(q) ||
      (f.startupName || "").toLowerCase().includes(q)
    );
  });

  const sortedMentors = [...mentors].sort((a, b) => {
    if (a.status === "active" && b.status !== "active") return -1;
    if (a.status !== "active" && b.status === "active") return 1;
    return 0;
  });
  const activeMentors = sortedMentors.filter((m) => m.status === "active");
  const invitedMentors = sortedMentors.filter((m) => m.status !== "active");

  const handleInviteMentor = async () => {
    try {
      setInviting(true);
      const response = await fetch(
        `${API_BASE}/organizations/${organizationId}/mentors`,
        {
          ...defaultOptions,
          method: "POST",
          body: JSON.stringify({ email: inviteEmail }),
        },
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(
          payload.message || payload.error || "Failed to invite mentor",
        );
      }
      const inner = unwrapData(payload);
      const serverMentor = inner.mentor || inner;
      if (serverMentor && (serverMentor.id || serverMentor._id)) {
        setMentors((prev) => {
          const id = String(serverMentor.id || serverMentor._id);
          const without = prev.filter((m) => String(m.id) !== id);
          return [...without, { ...serverMentor, id }];
        });
      }
      toast.success("Mentor invited successfully!");
      setShowInviteForm(false);
      setInviteEmail("");
    } catch (error) {
      console.error("Error inviting mentor:", error);
      toast.error(`Failed to invite mentor: ${error.message}`);
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return (
      <SectionCard>
        <SectionCard.Body className="p-8 text-center">
          <div className="animate-pulse font-body text-[13px] text-text-muted">
            Loading assignments...
          </div>
        </SectionCard.Body>
      </SectionCard>
    );
  }

  if (mentors.length === 0) {
    return (
      <SectionCard>
        <SectionCard.Body className="p-0">
          <EmptyStateBlock
            variant="centered"
            icon={Users}
            tone="info"
            title="No mentors available"
            description="Invite mentors first to start assigning founders"
            action={
              isAdmin ? (
                <Button
                  size="sm"
                  onClick={() => setShowInviteForm(true)}
                  className={PRIMARY_BUTTON}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Mentor
                </Button>
              ) : null
            }
          />
        </SectionCard.Body>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-4 font-body">
      <SectionHeader
        icon={Users}
        title="Mentor Assignment"
        description="Assign founders to mentors individually or organize into collaborative groups"
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard>
          <SectionCard.Header
            title="Select a Mentor"
            description="Choose a mentor to manage their group"
            action={
              isAdmin ? (
                <Button
                  size="sm"
                  onClick={() => setShowInviteForm(!showInviteForm)}
                  className={OUTLINE_BUTTON}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Invite Mentor
                </Button>
              ) : null
            }
          />
          <SectionCard.Body className="space-y-2">
            {showInviteForm && (
              <div className="space-y-2 rounded-input bg-surface-page p-3">
                <p className="font-heading text-[13px] font-semibold text-text-heading">
                  Invite New Mentor
                </p>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Mentor Email"
                  className="font-body text-[13px]"
                />
                <p className="font-body text-[12px] text-text-muted">
                  The mentor's display name will be pulled from their registered
                  StartupVerse account.
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleInviteMentor}
                    disabled={inviting || !inviteEmail.trim()}
                    className={`flex-1 ${PRIMARY_BUTTON}`}
                  >
                    {inviting ? "Inviting..." : "Send Invite"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setShowInviteForm(false);
                      setInviteEmail("");
                    }}
                    className={OUTLINE_BUTTON}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {activeMentors.length > 0 && (
              <>
                <div className="flex items-center gap-2 px-1 py-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#00c896]" />
                  <p className="font-body text-[12px] font-semibold uppercase tracking-wide text-text-muted">
                    Active ({activeMentors.length})
                  </p>
                </div>
                {activeMentors.map((mentor) => {
                  const selected = selectedMentor === mentor.id;
                  const displayName =
                    mentor.name || mentor.email || "Mentor";
                  const expertise = Array.isArray(mentor.expertise)
                    ? mentor.expertise.join(", ")
                    : mentor.expertise || "";
                  return (
                    <button
                      type="button"
                      key={mentor.id}
                      onClick={() => setSelectedMentor(mentor.id)}
                      className={cn(
                        "w-full rounded-card border bg-white p-3 text-left transition-all",
                        selected
                          ? "border-primary shadow-[0_0_0_3px_rgba(58,90,254,0.10)]"
                          : "border-surface-border hover:border-primary/40 hover:shadow-soft",
                      )}
                    >
                      <h3 className="truncate font-heading text-[14px] font-semibold text-text-heading">
                        {displayName}
                      </h3>
                      <p className="truncate font-body text-[12px] text-text-muted">
                        {mentor.email || ""}
                      </p>
                      {expertise && (
                        <p className="mt-1 font-body text-[12px] text-text-muted">
                          {expertise}
                        </p>
                      )}
                      <div className="mt-1.5 flex items-center gap-1">
                        <UsersRound className="h-3 w-3 text-primary" />
                        <span className="font-body text-[12px] font-medium text-primary">
                          {assignments[mentor.id]?.length || 0} founders in group
                        </span>
                      </div>
                    </button>
                  );
                })}
              </>
            )}

            {invitedMentors.length > 0 && (
              <>
                <div className="mt-3 flex items-center gap-2 px-1 py-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#ffb300]" />
                  <p className="font-body text-[12px] font-semibold uppercase tracking-wide text-text-muted">
                    Pending Invite ({invitedMentors.length})
                  </p>
                </div>
                {invitedMentors.map((mentor) => {
                  const selected = selectedMentor === mentor.id;
                  const displayName =
                    mentor.name || mentor.email || "Mentor";
                  const expertise = Array.isArray(mentor.expertise)
                    ? mentor.expertise.join(", ")
                    : mentor.expertise || "";
                  return (
                    <button
                      type="button"
                      key={mentor.id}
                      onClick={() => setSelectedMentor(mentor.id)}
                      className={cn(
                        "w-full rounded-card border border-dashed bg-white p-3 text-left transition-all",
                        selected
                          ? "border-primary opacity-100 shadow-[0_0_0_3px_rgba(58,90,254,0.10)]"
                          : "border-surface-border opacity-70 hover:border-primary/40 hover:opacity-100",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate font-heading text-[14px] font-semibold text-text-heading">
                              {displayName}
                            </h3>
                            <StatusBadge status="invited" />
                          </div>
                          <p className="truncate font-body text-[12px] text-text-muted">
                            {mentor.email || ""}
                          </p>
                          {expertise && (
                            <p className="mt-1 font-body text-[12px] text-text-muted">
                              {expertise}
                            </p>
                          )}
                        </div>
                        <StatusBadge
                          tone="info"
                          label={`${assignments[mentor.id]?.length || 0} assigned`}
                        />
                      </div>
                    </button>
                  );
                })}
              </>
            )}
          </SectionCard.Body>
        </SectionCard>

        <SectionCard>
          {selectedMentor ? (
            <SectionCard.Header
              title={
                <span className="inline-flex items-center gap-2">
                  <UsersRound className="h-4 w-4 text-primary" />
                  {(() => {
                    const m = mentors.find((x) => x.id === selectedMentor);
                    return `${m?.name || m?.email || "Mentor"}'s Group`;
                  })()}
                </span>
              }
              description="Manage group membership by adding or removing founders"
              action={
                <StatusBadge
                  tone="info"
                  label={`${assignments[selectedMentor]?.length || 0} members`}
                />
              }
            />
          ) : (
            <SectionCard.Header
              title="Select a mentor"
              description="Pick a mentor from the list to manage their group"
            />
          )}
          <SectionCard.Body className="max-h-[500px] space-y-2 overflow-y-auto">
            {selectedMentor && (
              <div className="relative mb-2">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search founders..."
                  className="pl-8 font-body text-[13px]"
                />
              </div>
            )}

            {!selectedMentor ? (
              <EmptyStateBlock
                variant="centered"
                icon={UsersRound}
                tone="info"
                title="No mentor selected"
                description="Select a mentor from the left to view and manage their mentorship group"
              />
            ) : filteredFounders.length === 0 ? (
              <EmptyStateBlock
                variant="compact"
                icon={Search}
                tone="info"
                title="No founders found"
                description="Try a different search term"
              />
            ) : (
              <>
                <div className="rounded-input border border-primary/20 bg-primary-tint p-3">
                  <div className="flex items-start gap-2">
                    <Video className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="mb-1 font-heading text-[13px] font-semibold text-primary">
                        Unique Meeting Room
                      </p>
                      <p className="mb-2 font-body text-[12px] text-text-body">
                        {assignments[selectedMentor]?.length === 1
                          ? "This is a 1-on-1 mentorship session link"
                          : `All ${assignments[selectedMentor]?.length || 0} founders join the same meeting room`}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="min-w-0 flex-1 rounded-input border border-primary/20 bg-white px-2 py-1.5">
                          <p className="truncate font-mono text-[12px] text-primary">
                            {generateMentorRoomLink(selectedMentor)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyMeetingLink(selectedMentor);
                          }}
                          className={OUTLINE_BUTTON}
                        >
                          <Copy className="mr-1 h-3.5 w-3.5" />
                          Copy
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMeetingToJoin({
                              mentorId: selectedMentor,
                              mentorName: (() => {
                                const m = mentors.find(
                                  (x) => x.id === selectedMentor,
                                );
                                return m?.name || m?.email || "Mentor";
                              })(),
                            });
                            setShowJoinMeetingDialog(true);
                          }}
                          className={PRIMARY_BUTTON}
                        >
                          <ExternalLink className="mr-1 h-3.5 w-3.5" />
                          Join
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {assignments[selectedMentor]?.length > 0 && (
                  <div className="border-b border-surface-border pb-2">
                    <p className="font-body text-[12px] font-semibold uppercase tracking-wide text-text-muted">
                      Current Group Members ({assignments[selectedMentor].length})
                    </p>
                  </div>
                )}

                {filteredFounders.map((founder) => {
                  const assigned = isAssigned(selectedMentor, founder.id);
                  return (
                    <div
                      key={founder.id}
                      className={cn(
                        "rounded-input border bg-white p-3 transition-all",
                        assigned
                          ? "border-primary bg-primary-tint/40"
                          : "border-surface-border hover:shadow-soft",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 flex-1 items-start gap-2">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#3a5afe_0%,#7c4dff_100%)] font-heading text-[13px] font-bold text-white">
                            {(founder.name || founder.email || "?")
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <h4 className="truncate font-heading text-[14px] font-semibold text-text-heading">
                                {founder.name || founder.email || "Founder"}
                              </h4>
                              {assigned && (
                                <StatusBadge
                                  tone="success"
                                  label="In Group"
                                  icon={Check}
                                />
                              )}
                            </div>
                            <p className="truncate font-body text-[12px] text-text-muted">
                              {founder.email}
                            </p>
                            {founder.startupName && (
                              <div className="mt-1 flex items-center gap-1">
                                <Rocket className="h-3 w-3 text-text-muted" />
                                <p className="truncate font-body text-[12px] text-text-muted">
                                  {founder.startupName}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() =>
                            assigned
                              ? handleUnassignFounder(
                                  selectedMentor,
                                  founder.id,
                                )
                              : handleAssignFounder(selectedMentor, founder.id)
                          }
                          disabled={assigning}
                          className={cn(
                            "shrink-0",
                            assigned
                              ? "h-9 rounded-input border border-surface-border bg-white font-body text-[13px] font-medium text-[#ff4f6b] hover:bg-[#fff1f2]"
                              : PRIMARY_BUTTON,
                          )}
                        >
                          {assigned ? (
                            <>
                              <UserMinus className="mr-1 h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Remove</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="mr-1 h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Add</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </SectionCard.Body>
        </SectionCard>
      </div>

      <Dialog
        open={showJoinMeetingDialog}
        onOpenChange={setShowJoinMeetingDialog}
      >
        <DialogContent className="sm:max-w-[500px] p-8">
          <div className="flex flex-col items-center space-y-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
              <Video className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h2 className="mb-2 font-heading text-[22px] font-bold text-text-heading">
                Mentorship Session
              </h2>
              <p className="font-body text-[14px] text-text-body">
                You're about to join this meeting
              </p>
            </div>
            <div className="w-full space-y-3">
              <div className="flex items-center gap-3 text-left">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#00c896]">
                  <Check className="h-3 w-3 text-white" />
                </div>
                <span className="font-body text-[14px] text-text-heading">
                  Camera and microphone ready
                </span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#00c896]">
                  <Check className="h-3 w-3 text-white" />
                </div>
                <span className="font-body text-[14px] text-text-heading">
                  Joining as:{" "}
                  <strong>{meetingToJoin?.mentorName || "Mentor"}</strong>
                </span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#00c896]">
                  <Check className="h-3 w-3 text-white" />
                </div>
                <span className="font-body text-[14px] text-text-heading">
                  High-quality video enabled
                </span>
              </div>
            </div>
            <Button
              onClick={() => {
                window.open(
                  generateMentorRoomLink(meetingToJoin?.mentorId || ""),
                  "_blank",
                );
                setShowJoinMeetingDialog(false);
              }}
              className="h-12 w-full gap-2 rounded-input bg-primary font-body text-[15px] font-semibold text-white shadow-[0_4px_16px_rgba(58,90,254,0.25)] hover:bg-primary-hover"
            >
              <Video className="h-5 w-5" />
              Join Meeting Now
            </Button>
            <p className="font-body text-[12px] text-text-muted">
              By joining, you agree to allow StartupVerse to use your camera and
              microphone
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
