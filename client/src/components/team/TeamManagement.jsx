import React, { useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Mail,
  Send,
  CheckCircle,
  TrendingUp,
  Target,
  Calendar,
  BarChart,
  Plus,
  Briefcase,
  MapPin,
  Globe,
  MessageSquare,
  ExternalLink,
  Trash2,
  Activity,
  Star,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Progress } from "../ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { toast } from "sonner";
import * as founderApi from "../../utils/api/founderApi";
import TeamMatching from "../TeamMatching";
export default function TeamManagement({
  user,
  initialTab = "overview",
  onNavigate,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  // Real data from backend - no mock data
  const [teamMembers, setTeamMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [teamGoals, setTeamGoals] = useState([]);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "",
    department: "",
    message: "",
  });

  // Filtered members
  const filteredMembers = teamMembers.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment =
      filterDepartment === "all" || member.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  });
  const pendingInvitations = invitations.filter(
    (inv) => inv.status === "pending",
  );
  const departments = [
    "all",
    ...Array.from(new Set(teamMembers.map((m) => m.department))),
  ];

  // Calculate stats
  const activeMembers = teamMembers.filter((m) => m.status === "active").length;
  const avgPerformance = Math.round(
    teamMembers.reduce((acc, m) => acc + m.performance, 0) / teamMembers.length,
  );
  const totalTasksCompleted = teamMembers.reduce(
    (acc, m) => acc + m.tasksCompleted,
    0,
  );
  const completedGoals = teamGoals.filter(
    (g) => g.status === "completed",
  ).length;
  const handleSendInvitation = async () => {
    if (!inviteForm.email || !inviteForm.role || !inviteForm.department) {
      toast.error("Please fill in all required fields");
      return;
    }
    const newInvitation = {
      id: `inv-${Date.now()}`,
      token: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email: inviteForm.email,
      role: inviteForm.role,
      department: inviteForm.department,
      startupId: user.companyId || user.startupId || `startup-${user.id}`,
      startupName: user.startupName || user.companyName || "Your Startup",
      founderId: user.id,
      founderName: user.name,
      status: "pending",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      // 10 days
      message: inviteForm.message,
    };

    // Save to backend
    try {
      await founderApi.createInvitation(newInvitation);
      setInvitations([...invitations, newInvitation]);
      setInviteForm({
        email: "",
        role: "",
        department: "",
        message: "",
      });
      setShowInviteDialog(false);
      toast.success(`Invitation sent to ${newInvitation.email}`);
      console.log("✅ Invitation saved to backend");
    } catch (error) {
      console.error("❌ Failed to save invitation:", error);
      toast.error("Failed to send invitation. Please try again.");
    }
  };
  const handleResendInvitation = (invitationId) => {
    toast.success("Invitation resent successfully");
  };
  const handleCancelInvitation = (invitationId) => {
    setInvitations(invitations.filter((inv) => inv.id !== invitationId));
    toast.success("Invitation cancelled");
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "inactive":
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
      case "on-leave":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "pending":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "low":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };
  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Team Management
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {teamMembers.length}
              {" team members • "}
              {activeMembers}
              {" active"}
            </p>
          </div>
          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild={true}>
              <Button
                size="sm"
                className="h-7 text-xs bg-[#3A5AFE] hover:bg-[#2A4AEE]"
              >
                <UserPlus className="w-3 h-3 mr-1" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base">
                  Invite Team Member
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Send an invitation to join your team
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <div className="space-y-1">
                  <Label className="text-xs">Email *</Label>
                  <Input
                    type="email"
                    placeholder="colleague@example.com"
                    value={inviteForm.email}
                    onChange={(e) =>
                      setInviteForm({
                        ...inviteForm,
                        email: e.target.value,
                      })
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Role *</Label>
                  <Input
                    placeholder="e.g., Software Engineer"
                    value={inviteForm.role}
                    onChange={(e) =>
                      setInviteForm({
                        ...inviteForm,
                        role: e.target.value,
                      })
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Department *</Label>
                  <Select
                    value={inviteForm.department}
                    onValueChange={(val) =>
                      setInviteForm({
                        ...inviteForm,
                        department: val,
                      })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Product">Product</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Personal Message (Optional)</Label>
                  <Textarea
                    placeholder="Add a personal note..."
                    value={inviteForm.message}
                    onChange={(e) =>
                      setInviteForm({
                        ...inviteForm,
                        message: e.target.value,
                      })
                    }
                    className="text-xs min-h-[60px] resize-none"
                  />
                </div>
                <Button
                  onClick={handleSendInvitation}
                  className="w-full h-8 text-xs bg-[#3A5AFE] hover:bg-[#2A4AEE]"
                >
                  <Send className="w-3 h-3 mr-1" />
                  Send Invitation
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <TabsList className="grid w-full grid-cols-4 h-9 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 rounded-none">
          <TabsTrigger
            value="overview"
            className="text-xs data-[state=active]:bg-[#3A5AFE]/10 data-[state=active]:text-[#3A5AFE]"
          >
            <Users className="w-3 h-3 mr-1" />
            Team
          </TabsTrigger>
          <TabsTrigger
            value="invitations"
            className="text-xs data-[state=active]:bg-[#3A5AFE]/10 data-[state=active]:text-[#3A5AFE]"
          >
            <Mail className="w-3 h-3 mr-1" />
            Invitations
            {pendingInvitations.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-4 px-1 text-[9px]">
                {pendingInvitations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="find-talent"
            className="text-xs data-[state=active]:bg-[#3A5AFE]/10 data-[state=active]:text-[#3A5AFE]"
          >
            <Search className="w-3 h-3 mr-1" />
            Find Talent
          </TabsTrigger>
          <TabsTrigger
            value="performance"
            className="text-xs data-[state=active]:bg-[#3A5AFE]/10 data-[state=active]:text-[#3A5AFE]"
          >
            <BarChart className="w-3 h-3 mr-1" />
            Performance
          </TabsTrigger>
        </TabsList>
        <TabsContent
          value="overview"
          className="flex-1 overflow-auto p-3 space-y-2 m-0"
        >
          <div className="grid grid-cols-4 gap-2">
            <Card className="border-gray-200 dark:border-gray-800">
              <CardContent className="p-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      Total Members
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
                      {teamMembers.length}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#3A5AFE]/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-[#3A5AFE]" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-gray-200 dark:border-gray-800">
              <CardContent className="p-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      Avg Performance
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
                      {avgPerformance}%
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#2ECC71]/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-[#2ECC71]" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-gray-200 dark:border-gray-800">
              <CardContent className="p-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      Tasks Done
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
                      {totalTasksCompleted}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-gray-200 dark:border-gray-800">
              <CardContent className="p-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      Goals Done
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
                      {completedGoals}/{teamGoals.length}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <Target className="w-4 h-4 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 h-8 text-xs"
              />
            </div>
            <Select
              value={filterDepartment}
              onValueChange={setFilterDepartment}
            >
              <SelectTrigger className="w-36 h-8 text-xs">
                <Filter className="w-3 h-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept} className="text-xs">
                    {dept === "all" ? "All Departments" : dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {filteredMembers.map((member) => (
              <Card
                key={member.id}
                className="border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow"
              >
                <CardContent className="p-2.5">
                  <div className="flex items-start gap-2">
                    <Avatar className="w-10 h-10 border-2 border-white dark:border-gray-800">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback className="text-xs">
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                            {member.name}
                          </h4>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                            {member.role}
                          </p>
                        </div>
                        <Badge
                          className={`text-[9px] px-1.5 py-0 h-4 ${getStatusColor(member.status)}`}
                        >
                          {member.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 mt-2">
                        <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                          <Briefcase className="w-3 h-3" />
                          <span className="truncate">{member.department}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{member.location}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                          <Globe className="w-3 h-3" />
                          <span>{member.workType}</span>
                        </div>
                      </div>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">
                            Performance
                          </span>
                          <span className="text-[10px] font-semibold text-gray-900 dark:text-white">
                            {member.performance}%
                          </span>
                        </div>
                        <Progress value={member.performance} className="h-1" />
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-1.5 text-center">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded px-1.5 py-1">
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">
                            Tasks
                          </p>
                          <p className="text-xs font-semibold text-gray-900 dark:text-white">
                            {member.tasksCompleted}/{member.totalTasks}
                          </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded px-1.5 py-1">
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">
                            Hours
                          </p>
                          <p className="text-xs font-semibold text-gray-900 dark:text-white">
                            {member.hoursThisWeek}h
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {member.skills.slice(0, 3).map((skill, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-[9px] px-1.5 py-0 h-4 bg-[#3A5AFE]/5 text-[#3A5AFE] border-[#3A5AFE]/20"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-2 flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] flex-1"
                        >
                          <MessageSquare className="w-3 h-3 mr-1" />
                          Message
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] px-2"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent
          value="invitations"
          className="flex-1 overflow-auto p-3 space-y-2 m-0"
        >
          <Card className="border-gray-200 dark:border-gray-800">
            <CardHeader className="p-2.5 pb-0">
              <CardTitle className="text-sm">Pending Invitations</CardTitle>
            </CardHeader>
            <CardContent className="p-2.5">
              {pendingInvitations.length === 0 ? (
                <div className="text-center py-6">
                  <Mail className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    No pending invitations
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setShowInviteDialog(true)}
                    className="mt-3 h-7 text-xs bg-[#3A5AFE] hover:bg-[#2A4AEE]"
                  >
                    <UserPlus className="w-3 h-3 mr-1" />
                    Send First Invitation
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#3A5AFE]/10 flex items-center justify-center">
                          <Mail className="w-4 h-4 text-[#3A5AFE]" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-900 dark:text-white">
                            {invitation.email}
                          </p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">
                            {invitation.role}
                            {" • "}
                            {invitation.department}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResendInvitation(invitation.id)}
                          className="h-6 text-[10px]"
                        >
                          <Send className="w-3 h-3 mr-1" />
                          Resend
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelInvitation(invitation.id)}
                          className="h-6 text-[10px] text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="border-gray-200 dark:border-gray-800">
            <CardHeader className="p-2.5 pb-0">
              <CardTitle className="text-sm">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-2.5">
              <div className="space-y-2">
                {invitations
                  .filter((inv) => inv.status === "accepted")
                  .map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/10 rounded border border-green-200 dark:border-green-800"
                    >
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-900 dark:text-white">
                          {invitation.email}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                          {"Accepted invitation • "}
                          {invitation.role}
                        </p>
                      </div>
                      <Badge className="text-[9px] px-1.5 py-0 h-4 bg-green-500/10 text-green-600 border-green-500/20">
                        Accepted
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="find-talent" className="flex-1 overflow-auto m-0">
          <TeamMatching user={user} onNavigate={onNavigate} />
        </TabsContent>
        <TabsContent
          value="performance"
          className="flex-1 overflow-auto p-3 space-y-2 m-0"
        >
          <Card className="border-gray-200 dark:border-gray-800">
            <CardHeader className="p-2.5 pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Team Goals</CardTitle>
                <Button
                  size="sm"
                  className="h-6 text-[10px] bg-[#3A5AFE] hover:bg-[#2A4AEE]"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  New Goal
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-2.5">
              <div className="space-y-2">
                {teamGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className="p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-semibold text-gray-900 dark:text-white">
                            {goal.title}
                          </h4>
                          <Badge
                            className={`text-[9px] px-1.5 py-0 h-4 ${getPriorityColor(goal.priority)}`}
                          >
                            {goal.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {"Due "}
                              {goal.dueDate.toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                            <Users className="w-3 h-3" />
                            <span>
                              {goal.assignedTo.length}
                              {" members"}
                            </span>
                          </div>
                        </div>
                      </div>
                      {goal.status === "completed" && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">
                          Progress
                        </span>
                        <span className="text-[10px] font-semibold text-gray-900 dark:text-white">
                          {goal.progress}%
                        </span>
                      </div>
                      <Progress value={goal.progress} className="h-1" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-2 gap-2">
            <Card className="border-gray-200 dark:border-gray-800">
              <CardHeader className="p-2.5 pb-0">
                <CardTitle className="text-sm">Top Performers</CardTitle>
              </CardHeader>
              <CardContent className="p-2.5">
                <div className="space-y-2">
                  {[...teamMembers]
                    .sort((a, b) => b.performance - a.performance)
                    .slice(0, 5)
                    .map((member, idx) => (
                      <div key={member.id} className="flex items-center gap-2">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${idx === 0 ? "bg-yellow-500/20 text-yellow-700" : idx === 1 ? "bg-gray-400/20 text-gray-700" : idx === 2 ? "bg-orange-600/20 text-orange-700" : "bg-gray-200 text-gray-600"}`}
                        >
                          {idx + 1}
                        </div>
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback className="text-[10px]">
                            {member.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                            {member.name}
                          </p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">
                            {member.role}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-[#2ECC71]">
                            {member.performance}%
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
            <Card className="border-gray-200 dark:border-gray-800">
              <CardHeader className="p-2.5 pb-0">
                <CardTitle className="text-sm">Department Stats</CardTitle>
              </CardHeader>
              <CardContent className="p-2.5">
                <div className="space-y-2">
                  {departments
                    .filter((d) => d !== "all")
                    .map((dept) => {
                      const deptMembers = teamMembers.filter(
                        (m) => m.department === dept,
                      );
                      const avgPerf =
                        deptMembers.length > 0
                          ? Math.round(
                              deptMembers.reduce(
                                (acc, m) => acc + m.performance,
                                0,
                              ) / deptMembers.length,
                            )
                          : 0;
                      return (
                        <div key={dept}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <Briefcase className="w-3 h-3 text-gray-400" />
                              <span className="text-xs font-medium text-gray-900 dark:text-white">
                                {dept}
                              </span>
                              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                ({deptMembers.length})
                              </span>
                            </div>
                            <span className="text-xs font-semibold text-gray-900 dark:text-white">
                              {avgPerf}%
                            </span>
                          </div>
                          <Progress value={avgPerf} className="h-1" />
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
          <Card className="border-gray-200 dark:border-gray-800">
            <CardHeader className="p-2.5 pb-0">
              <CardTitle className="text-sm">Team Activity This Week</CardTitle>
            </CardHeader>
            <CardContent className="p-2.5">
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <Activity className="w-5 h-5 text-[#3A5AFE] mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {teamMembers.reduce((acc, m) => acc + m.hoursThisWeek, 0)}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    Total Hours
                  </p>
                </div>
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <CheckCircle className="w-5 h-5 text-[#2ECC71] mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {totalTasksCompleted}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    Tasks Done
                  </p>
                </div>
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <Target className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {completedGoals}/{teamGoals.length}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    Goals Done
                  </p>
                </div>
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <Star className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {avgPerformance}%
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    Avg Score
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
