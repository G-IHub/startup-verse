import React, { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Users,
  Search,
  UserPlus,
  Mail,
  MapPin,
  Briefcase,
  MessageSquare,
  Video,
  ExternalLink,
  Copy,
  Send,
  CheckCircle,
  Clock,
  Zap,
  Globe,
} from "lucide-react";
import { toast } from "sonner";

// Hardcoded Supabase credentials to avoid import issues
const projectId = "zuvrtclwxqycfskgtpbs";
const publicAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1dnJ0Y2x3eHF5Y2Zza2d0cGJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNzA4NTcsImV4cCI6MjA4Mzk0Njg1N30.4QY7N-tAXL9LNzK5_c9WGF1UPbezNaWABkV7n29bM1M";
export function TeamPanel({
  open,
  onClose,
  user,
  onNavigateToTalent,
  onPlaySound,
}) {
  const [activeTab, setActiveTab] = useState("directory");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showInvitationLink, setShowInvitationLink] = useState(false);

  // Invite form state
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "",
    department: "",
    workType: "remote",
    message: "",
  });
  const [generatedInvitation, setGeneratedInvitation] = useState(null);

  // Mock team members
  const [teamMembers] = useState([
    {
      id: "1",
      name: "Sarah Chen",
      email: "sarah@startup.com",
      role: "CTO",
      department: "Engineering",
      status: "active",
      joinDate: new Date("2024-01-15"),
      location: "San Francisco, CA",
      workType: "hybrid",
      skills: ["React", "Node.js", "Python", "AWS", "Leadership"],
      projects: ["MVP Development", "Infrastructure"],
      performance: 95,
    },
    {
      id: "2",
      name: "Mike Johnson",
      email: "mike@startup.com",
      role: "Lead Designer",
      department: "Design",
      status: "active",
      joinDate: new Date("2024-01-20"),
      location: "New York, NY",
      workType: "hybrid",
      skills: ["Figma", "User Research", "Prototyping", "Design Systems"],
      projects: ["UI/UX Design", "Brand Guidelines"],
      performance: 91,
    },
    {
      id: "3",
      name: "Alex Kim",
      email: "alex@startup.com",
      role: "Senior Backend Developer",
      department: "Engineering",
      status: "active",
      joinDate: new Date("2024-02-01"),
      location: "Austin, TX",
      workType: "remote",
      skills: ["Node.js", "PostgreSQL", "Docker", "Kubernetes"],
      projects: ["API Development", "Database Optimization"],
      performance: 88,
    },
    {
      id: "4",
      name: "Jamie Lee",
      email: "jamie@startup.com",
      role: "Product Manager",
      department: "Product",
      status: "active",
      joinDate: new Date("2024-02-10"),
      location: "Seattle, WA",
      workType: "remote",
      skills: ["Product Strategy", "User Stories", "Roadmapping", "Analytics"],
      projects: ["Product Roadmap", "User Research"],
      performance: 92,
    },
    {
      id: "5",
      name: "Chris Martinez",
      email: "chris@startup.com",
      role: "Marketing Lead",
      department: "Marketing",
      status: "active",
      joinDate: new Date("2024-03-01"),
      location: "Los Angeles, CA",
      workType: "hybrid",
      skills: ["Content Marketing", "SEO", "Social Media", "Analytics"],
      projects: ["Launch Campaign", "Brand Awareness"],
      performance: 87,
    },
  ]);
  const [invitations, setInvitations] = useState([
    {
      id: "1",
      email: "john@example.com",
      role: "Frontend Developer",
      department: "Engineering",
      status: "pending",
      sentAt: new Date("2025-12-02"),
      expiresAt: new Date("2025-12-16"),
      invitationLink: "https://startupverse.app/invite/abc123xyz",
    },
  ]);
  const handleSendInvitation = async () => {
    console.log(
      "🔍 [TeamPanel] handleSendInvitation called with form:",
      inviteForm,
    );
    if (!inviteForm.email || !inviteForm.role) {
      console.error("❌ [TeamPanel] Missing email or role:", {
        email: inviteForm.email,
        role: inviteForm.role,
      });
      toast.error("Please fill in email and role");
      return;
    }
    try {
      // Generate invitation data
      const invitationId = `inv-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const token = Math.random().toString(36).substring(2, 15);
      const invitationData = {
        id: invitationId,
        email: inviteForm.email,
        name: inviteForm.email.split("@")[0],
        // Extract name from email
        founderId: user.id,
        founderName: user.name || "Founder",
        startupName: user.profile?.startupName || "Startup",
        role: inviteForm.role,
        department: inviteForm.department || "General",
        message: inviteForm.message || `Join our team as ${inviteForm.role}!`,
        token: token,
        status: "pending",
        createdAt: new Date().toISOString(),
        expiresAt: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      };
      console.log("📧 [TeamPanel] Sending invitation:", invitationData);

      // Save invitation to backend
      const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-78157e08`;
      console.log(
        "📡 [TeamPanel] Calling API:",
        `${API_URL}/founders/invitations`,
      );
      const response = await fetch(`${API_URL}/founders/invitations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("startupverse_token") || ""}`,
        },
        body: JSON.stringify({
          invitation: invitationData,
          sendEmail: true, // This triggers email sending
        }),
      });
      console.log("📡 [TeamPanel] Response status:", response.status);
      const data = await response.json();
      console.log("📡 [TeamPanel] Response data:", data);
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to send invitation");
      }
      console.log("✅ [TeamPanel] Invitation sent successfully:", data);

      // Update local state for UI
      const newInvitation = {
        id: invitationId,
        email: inviteForm.email,
        role: inviteForm.role,
        department: inviteForm.department || "General",
        status: "pending",
        sentAt: new Date(),
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        invitationLink: `${window.location.origin}?invitation=${token}`,
      };
      setInvitations([newInvitation, ...invitations]);
      setGeneratedInvitation(newInvitation);
      setShowInviteDialog(false);
      setShowInvitationLink(true);

      // Reset form
      setInviteForm({
        email: "",
        role: "",
        department: "",
        workType: "remote",
        message: "",
      });
      toast.success(`📧 Invitation sent to ${inviteForm.email}!`);
      onPlaySound?.();
    } catch (error) {
      console.error("❌ [TeamPanel] Error sending invitation:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to send invitation",
      );
    }
  };
  const copyInvitationLink = (link) => {
    navigator.clipboard.writeText(link);
    toast.success("Invitation link copied to clipboard!");
    onPlaySound?.();
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "inactive":
        return "bg-gray-400";
      case "on-leave":
        return "bg-yellow-500";
      case "pending":
        return "bg-blue-500";
      default:
        return "bg-gray-400";
    }
  };
  const getWorkTypeIcon = (workType) => {
    switch (workType) {
      case "remote":
        return <Globe className="w-3 h-3" />;
      case "hybrid":
        return <Briefcase className="w-3 h-3" />;
      case "office":
        return <Users className="w-3 h-3" />;
      default:
        return null;
    }
  };

  // Filter team members
  const filteredMembers = teamMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.skills.some((skill) =>
        skill.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
  );
  const pendingInvitations = invitations.filter(
    (inv) => inv.status === "pending",
  );
  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              onClick={onClose}
              className="fixed inset-0 bg-black/20 z-[55]"
            />
            <motion.div
              initial={{
                x: "100%",
              }}
              animate={{
                x: 0,
              }}
              exit={{
                x: "100%",
              }}
              transition={{
                type: "spring",
                damping: 30,
                stiffness: 300,
              }}
              className="fixed right-0 top-0 h-full w-full md:w-[800px] bg-white shadow-2xl z-[60] flex flex-col"
            >
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5" />
                  <div>
                    <h2 className="font-semibold">Team Directory</h2>
                    <p className="text-xs text-blue-100">
                      {teamMembers.length}
                      {" team members"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex-1 flex flex-col"
              >
                <div className="border-b bg-slate-50 px-4">
                  <TabsList className="bg-transparent h-12">
                    <TabsTrigger value="directory" className="text-xs">
                      <Users className="w-3.5 h-3.5 mr-1.5" />
                      Team ({teamMembers.length})
                    </TabsTrigger>
                    <TabsTrigger value="invitations" className="text-xs">
                      <Mail className="w-3.5 h-3.5 mr-1.5" />
                      Invitations
                      {pendingInvitations.length > 0 && (
                        <Badge
                          variant="destructive"
                          className="ml-1.5 h-4 px-1 text-[9px]"
                        >
                          {pendingInvitations.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent
                  value="directory"
                  className="flex-1 overflow-hidden mt-0 p-4 space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name, role, skills..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9"
                      />
                    </div>
                    <Button
                      onClick={() => setShowInviteDialog(true)}
                      className="bg-blue-600 hover:bg-blue-700 h-9"
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Invite
                    </Button>
                  </div>
                  <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-purple-600" />
                          <div>
                            <p className="text-xs font-medium">
                              Looking for talent?
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Use Smart Team Matching to find the perfect fit
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={onNavigateToTalent}
                          className="bg-purple-600 hover:bg-purple-700 h-7 text-[10px]"
                        >
                          Find Talent
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  <ScrollArea className="flex-1">
                    <div className="space-y-2">
                      {filteredMembers.map((member) => (
                        <motion.div
                          key={member.id}
                          layout={true}
                          initial={{
                            opacity: 0,
                            y: 20,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                        >
                          <Card
                            className="hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => setSelectedMember(member)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-start gap-3">
                                <Avatar className="w-12 h-12">
                                  <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                                    {member.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <div>
                                      <h4 className="text-sm font-medium truncate">
                                        {member.name}
                                      </h4>
                                      <p className="text-xs text-muted-foreground">
                                        {member.role}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <div
                                        className={`w-2 h-2 rounded-full ${getStatusColor(member.status)}`}
                                      />
                                      <span className="text-[10px] text-muted-foreground capitalize">
                                        {member.status}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-2">
                                    <div className="flex items-center gap-1">
                                      <Briefcase className="w-3 h-3" />
                                      <span>{member.department}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      {getWorkTypeIcon(member.workType)}
                                      <span className="capitalize">
                                        {member.workType}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      <span>{member.location}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 flex-wrap">
                                    {member.skills
                                      .slice(0, 4)
                                      .map((skill, idx) => (
                                        <Badge
                                          key={idx}
                                          variant="outline"
                                          className="h-4 px-1.5 text-[9px]"
                                        >
                                          {skill}
                                        </Badge>
                                      ))}
                                    {member.skills.length > 4 && (
                                      <Badge
                                        variant="outline"
                                        className="h-4 px-1.5 text-[9px]"
                                      >
                                        +{member.skills.length - 4}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                  >
                                    <MessageSquare className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                  >
                                    <Video className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                      {filteredMembers.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                          <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                          <p className="text-sm">No team members found</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent
                  value="invitations"
                  className="flex-1 overflow-hidden mt-0 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium">
                        Pending Invitations
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {pendingInvitations.length}
                        {" waiting for response"}
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowInviteDialog(true)}
                      className="bg-blue-600 hover:bg-blue-700 h-9"
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      New Invitation
                    </Button>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="space-y-2">
                      {invitations.map((invitation) => (
                        <Card key={invitation.id}>
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                                  <span className="text-sm font-medium">
                                    {invitation.email}
                                  </span>
                                  <Badge
                                    variant={
                                      invitation.status === "pending"
                                        ? "default"
                                        : invitation.status === "accepted"
                                          ? "outline"
                                          : "destructive"
                                    }
                                    className="h-4 px-1.5 text-[9px]"
                                  >
                                    {invitation.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-2">
                                  <span>{invitation.role}</span>
                                  <span>•</span>
                                  <span>{invitation.department}</span>
                                  <span>•</span>
                                  <span>
                                    {"Expires "}
                                    {invitation.expiresAt.toLocaleDateString()}
                                  </span>
                                </div>
                                {invitation.invitationLink && (
                                  <div className="flex items-center gap-2">
                                    <Input
                                      value={invitation.invitationLink}
                                      readOnly={true}
                                      className="h-7 text-[10px] font-mono"
                                    />
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        copyInvitationLink(
                                          invitation.invitationLink,
                                        )
                                      }
                                      className="h-7 px-2"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {invitations.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                          <Mail className="w-12 h-12 mx-auto mb-3 opacity-20" />
                          <p className="text-sm">No invitations yet</p>
                          <p className="text-xs">
                            Send an invitation to grow your team
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join your team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Email Address *</Label>
              <Input
                type="email"
                placeholder="name@example.com"
                value={inviteForm.email}
                onChange={(e) =>
                  setInviteForm({
                    ...inviteForm,
                    email: e.target.value,
                  })
                }
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Role *</Label>
                <Input
                  placeholder="e.g. Developer"
                  value={inviteForm.role}
                  onChange={(e) =>
                    setInviteForm({
                      ...inviteForm,
                      role: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Department</Label>
                <Input
                  placeholder="e.g. Engineering"
                  value={inviteForm.department}
                  onChange={(e) =>
                    setInviteForm({
                      ...inviteForm,
                      department: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Work Type</Label>
              <Select
                value={inviteForm.workType}
                onValueChange={(v) =>
                  setInviteForm({
                    ...inviteForm,
                    workType: v,
                  })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Personal Message (Optional)</Label>
              <Textarea
                placeholder="Add a personal note to your invitation..."
                value={inviteForm.message}
                onChange={(e) =>
                  setInviteForm({
                    ...inviteForm,
                    message: e.target.value,
                  })
                }
                className="mt-1 h-20"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSendInvitation}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4 mr-1" />
                Send Invitation
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowInviteDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showInvitationLink} onOpenChange={setShowInvitationLink}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Invitation Sent!
            </DialogTitle>
            <DialogDescription>
              {"Share this link with "}
              {generatedInvitation?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-slate-50 p-3 rounded-lg border">
              <Label className="text-xs text-muted-foreground">
                Invitation Link
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  value={generatedInvitation?.invitationLink || ""}
                  readOnly={true}
                  className="font-mono text-xs"
                />
                <Button
                  size="sm"
                  onClick={() =>
                    copyInvitationLink(
                      generatedInvitation?.invitationLink || "",
                    )
                  }
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Copy className="w-3.5 h-3.5 mr-1" />
                  Copy
                </Button>
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex gap-2 text-xs">
                <Clock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">
                    Link expires in 14 days
                  </p>
                  <p className="text-blue-700 text-[10px] mt-0.5">
                    {"Expires on "}
                    {generatedInvitation?.expiresAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => setShowInvitationLink(false)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
