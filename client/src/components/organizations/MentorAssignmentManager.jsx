/**
 * MENTOR ASSIGNMENT MANAGER - Flexible Mentorship Management
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
import { Badge } from "../ui/badge";
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
  const [inviteName, setInviteName] = useState("");
  const [inviting, setInviting] = useState(false);
  const [mentorshipTypes, setMentorshipTypes] = useState({});
  const [showJoinMeetingDialog, setShowJoinMeetingDialog] = useState(false);
  const [meetingToJoin, setMeetingToJoin] = useState(null);
  useEffect(() => {
    loadData();
  }, [cohortId, organizationId]);

  // Generate unique meeting room for each mentor
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

      // Load mentors for organization
      const mentorsRes = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/mentors/organization/${organizationId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
          },
        },
      );
      const mentorsData = await mentorsRes.json();
      setMentors(mentorsData.mentors || []);

      // Load founders in cohort - FIXED URL
      const foundersRes = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/cohorts/${cohortId}/members`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
          },
        },
      );
      const foundersData = await foundersRes.json();

      // Transform members data to founders format
      const transformedFounders = (foundersData.members || []).map(
        (member) => ({
          id: member.founderId,
          name: member.founderName || member.name,
          email: member.founderEmail || member.email,
          startupName: member.startupName || "Unknown Startup",
          startupStage: member.currentStage || "ideation",
        }),
      );
      setFounders(transformedFounders);

      // Load assignments for each mentor
      const assignmentsMap = {};
      for (const mentor of mentorsData.mentors || []) {
        const assignRes = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/mentors/${mentor.id}/assigned-founders`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
            },
          },
        );
        const assignData = await assignRes.json();
        assignmentsMap[mentor.id] = (assignData.founders || []).map(
          (f) => f.id,
        );
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
      console.log(
        `📌 [Frontend] Assigning founder ${founderId} to mentor ${mentorId}`,
      );
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/mentors/${mentorId}/assign-founder`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            founderId,
          }),
        },
      );
      const data = await response.json();
      console.log("📋 [Frontend] Assignment response:", data);
      if (!response.ok) {
        throw new Error(data.error || "Failed to assign founder");
      }

      // Update local state
      setAssignments((prev) => ({
        ...prev,
        [mentorId]: [...(prev[mentorId] || []), founderId],
      }));
      console.log("✅ [Frontend] Assignment successful, state updated");
      toast.success("Founder assigned successfully!");
    } catch (error) {
      console.error("❌ [Frontend] Error assigning founder:", error);
      toast.error(`Failed to assign founder: ${error.message}`);
    } finally {
      setAssigning(false);
    }
  };
  const handleUnassignFounder = async (mentorId, founderId) => {
    try {
      setAssigning(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/mentors/${mentorId}/unassign-founder/${founderId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
          },
        },
      );
      if (!response.ok) throw new Error("Failed to unassign founder");

      // Update local state
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
  const isAssigned = (mentorId, founderId) => {
    return assignments[mentorId]?.includes(founderId) || false;
  };
  const filteredFounders = founders.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.startupName?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Sort mentors: active first, then invited
  const sortedMentors = [...mentors].sort((a, b) => {
    if (a.status === "active" && b.status !== "active") return -1;
    if (a.status !== "active" && b.status === "active") return 1;
    return 0;
  });

  // Group mentors by status
  const activeMentors = sortedMentors.filter((m) => m.status === "active");
  const invitedMentors = sortedMentors.filter((m) => m.status !== "active");
  const handleInviteMentor = async () => {
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
            email: inviteEmail,
            name: inviteName,
            organizationId: organizationId,
          }),
        },
      );
      const data = await response.json();
      console.log("📋 [Frontend] Invite response:", data);
      if (!response.ok) {
        throw new Error(data.error || "Failed to invite mentor");
      }

      // Update local state
      setMentors((prev) => [
        ...prev,
        {
          id: data.id,
          name: inviteName,
          email: inviteEmail,
          expertise: "",
          status: "pending",
        },
      ]);
      console.log("✅ [Frontend] Invite successful, state updated");
      toast.success("Mentor invited successfully!");
    } catch (error) {
      console.error("❌ [Frontend] Error inviting mentor:", error);
      toast.error(`Failed to invite mentor: ${error.message}`);
    } finally {
      setInviting(false);
      setShowInviteForm(false);
    }
  };
  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-pulse text-[10px]">
            Loading assignments...
          </div>
        </CardContent>
      </Card>
    );
  }
  if (mentors.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-[10px] text-muted-foreground">
            No mentors available. Invite mentors first.
          </p>
          {isAdmin && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowInviteForm(true)}
              className="mt-2"
            >
              Invite Mentor
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="w-4 h-4" />
            Mentor Assignment
          </CardTitle>
          <CardDescription className="text-xs">
            Assign founders to mentors individually or organize into
            collaborative groups
          </CardDescription>
        </CardHeader>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs">Select a Mentor</CardTitle>
              {isAdmin && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowInviteForm(!showInviteForm)}
                  className="h-7 text-[9px] gap-1"
                >
                  <Mail className="w-3 h-3" />
                  Invite Mentor
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {showInviteForm && (
              <div className="p-3 rounded-lg border bg-muted/50 space-y-2 mb-2">
                <p className="text-[9px] font-medium">Invite New Mentor</p>
                <Input
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Mentor Name"
                  className="h-7 text-[10px]"
                />
                <Input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Mentor Email"
                  className="h-7 text-[10px]"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleInviteMentor}
                    disabled={inviting || !inviteName || !inviteEmail}
                    className="h-7 text-[9px] flex-1"
                  >
                    {inviting ? "Inviting..." : "Send Invite"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowInviteForm(false);
                      setInviteName("");
                      setInviteEmail("");
                    }}
                    className="h-7 text-[9px]"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            {activeMentors.length > 0 && (
              <>
                <div className="flex items-center gap-2 px-1 py-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Active ({activeMentors.length})
                  </p>
                </div>
                {activeMentors.map((mentor) => (
                  <div
                    key={mentor.id}
                    onClick={() => setSelectedMentor(mentor.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedMentor === mentor.id ? "bg-primary/5 border-primary" : "hover:bg-muted border-border"}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[11px] font-semibold truncate">
                          {mentor.name}
                        </h3>
                        <p className="text-[9px] text-muted-foreground truncate">
                          {mentor.email}
                        </p>
                        {mentor.expertise && (
                          <p className="text-[8px] text-muted-foreground mt-1">
                            {mentor.expertise}
                          </p>
                        )}
                        <div className="flex items-center gap-1 mt-1.5">
                          <UsersRound className="w-2.5 h-2.5 text-primary" />
                          <span className="text-[8px] font-medium text-primary">
                            {assignments[mentor.id]?.length || 0}
                            {" founders in group"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
            {invitedMentors.length > 0 && (
              <>
                <div className="flex items-center gap-2 px-1 py-1 mt-3">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Pending Invite ({invitedMentors.length})
                  </p>
                </div>
                {invitedMentors.map((mentor) => (
                  <div
                    key={mentor.id}
                    onClick={() => setSelectedMentor(mentor.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all opacity-60 ${selectedMentor === mentor.id ? "bg-primary/5 border-primary opacity-100" : "hover:bg-muted border-dashed border-border hover:opacity-80"}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[11px] font-semibold truncate">
                            {mentor.name}
                          </h3>
                          <Badge
                            variant="secondary"
                            className="text-[7px] bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          >
                            Invited
                          </Badge>
                        </div>
                        <p className="text-[9px] text-muted-foreground truncate">
                          {mentor.email}
                        </p>
                        {mentor.expertise && (
                          <p className="text-[8px] text-muted-foreground mt-1">
                            {mentor.expertise}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-[7px] ml-2">
                        {assignments[mentor.id]?.length || 0}
                        {" assigned"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            {selectedMentor ? (
              <>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs flex items-center gap-2">
                    <UsersRound className="w-3.5 h-3.5 text-primary" />
                    {mentors.find((m) => m.id === selectedMentor)?.name}'s Group
                  </CardTitle>
                  <Badge variant="secondary" className="text-[8px]">
                    {assignments[selectedMentor]?.length || 0}
                    {" members"}
                  </Badge>
                </div>
                <CardDescription className="text-[9px] mt-1">
                  Manage group membership by adding or removing founders
                </CardDescription>
                <div className="relative mt-2">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search founders..."
                    className="pl-7 h-7 text-[10px]"
                  />
                </div>
              </>
            ) : (
              <CardTitle className="text-xs">
                Select a mentor to manage their group
              </CardTitle>
            )}
          </CardHeader>
          <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
            {!selectedMentor ? (
              <div className="text-center py-8">
                <UsersRound className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground">
                  Select a mentor from the left to view and manage their
                  mentorship group
                </p>
              </div>
            ) : filteredFounders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[10px] text-muted-foreground">
                  No founders found
                </p>
              </div>
            ) : (
              <>
                <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 mb-3">
                  <div className="flex items-start gap-2">
                    <Video className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-semibold text-blue-900 dark:text-blue-100 mb-1">
                        Unique Meeting Room
                      </p>
                      <p className="text-[8px] text-blue-700 dark:text-blue-300 mb-2">
                        {assignments[selectedMentor]?.length === 1
                          ? "This is a 1-on-1 mentorship session link"
                          : `All ${assignments[selectedMentor]?.length || 0} founders join the same meeting room`}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0 bg-white dark:bg-gray-900 rounded px-2 py-1.5 border border-blue-200 dark:border-blue-700">
                          <p className="text-[9px] font-mono text-blue-900 dark:text-blue-100 truncate">
                            {generateMentorRoomLink(selectedMentor)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyMeetingLink(selectedMentor);
                          }}
                          className="h-7 text-[9px] gap-1 bg-white dark:bg-gray-900 hover:bg-blue-50 dark:hover:bg-blue-950/50 border-blue-200 dark:border-blue-700"
                        >
                          <Copy className="w-3 h-3" />
                          Copy
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMeetingToJoin({
                              mentorId: selectedMentor,
                              mentorName:
                                mentors.find((m) => m.id === selectedMentor)
                                  ?.name || "Mentor",
                            });
                            setShowJoinMeetingDialog(true);
                          }}
                          className="h-7 text-[9px] gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Join
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                {assignments[selectedMentor]?.length > 0 && (
                  <div className="mb-3 pb-3 border-b">
                    <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Current Group Members (
                      {assignments[selectedMentor].length})
                    </p>
                  </div>
                )}
                {filteredFounders.map((founder) => {
                  const assigned = isAssigned(selectedMentor, founder.id);
                  return (
                    <div
                      key={founder.id}
                      className={`p-3 rounded-lg border hover:shadow-sm transition-all ${assigned ? "bg-primary/5 border-primary" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                            {founder.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-[10px] font-semibold truncate">
                                {founder.name}
                              </h4>
                              {assigned && (
                                <Badge
                                  variant="outline"
                                  className="text-[7px] bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                                >
                                  In Group
                                </Badge>
                              )}
                            </div>
                            <p className="text-[9px] text-muted-foreground truncate">
                              {founder.email}
                            </p>
                            {founder.startupName && (
                              <div className="flex items-center gap-1 mt-1">
                                <Rocket className="w-2 h-2 text-muted-foreground" />
                                <p className="text-[8px] text-muted-foreground truncate">
                                  {founder.startupName}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={assigned ? "outline" : "default"}
                          onClick={() =>
                            assigned
                              ? handleUnassignFounder(
                                  selectedMentor,
                                  founder.id,
                                )
                              : handleAssignFounder(selectedMentor, founder.id)
                          }
                          disabled={assigning}
                          className={`h-7 text-[9px] gap-1 flex-shrink-0 ${assigned ? "text-destructive hover:bg-destructive hover:text-white" : ""}`}
                        >
                          {assigned ? (
                            <>
                              <UserMinus className="w-3 h-3" />
                              <span className="hidden sm:inline">Remove</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3 h-3" />
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
          </CardContent>
        </Card>
      </div>
      <Dialog
        open={showJoinMeetingDialog}
        onOpenChange={setShowJoinMeetingDialog}
      >
        <DialogContent className="sm:max-w-[500px] p-8">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-[#3A5AFE]/10 dark:bg-[#3A5AFE]/20 flex items-center justify-center">
              <Video className="w-10 h-10 text-[#3A5AFE]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Mentorship Session
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                You're about to join this meeting
              </p>
            </div>
            <div className="w-full space-y-3">
              <div className="flex items-center gap-3 text-left">
                <div className="w-5 h-5 rounded-full bg-[#2ECC71] flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-gray-900 dark:text-white">
                  Camera and microphone ready
                </span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <div className="w-5 h-5 rounded-full bg-[#2ECC71] flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-gray-900 dark:text-white">
                  {"Joining as: "}
                  <strong>{meetingToJoin?.mentorName || "Mentor"}</strong>
                </span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <div className="w-5 h-5 rounded-full bg-[#2ECC71] flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-gray-900 dark:text-white">
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
              className="w-full h-12 text-base bg-[#3A5AFE] hover:bg-[#3A5AFE]/90 gap-2"
            >
              <Video className="w-5 h-5" />
              Join Meeting Now
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              By joining, you agree to allow StartupVerse to use your camera and
              microphone
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
