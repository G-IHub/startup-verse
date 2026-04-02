import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Label } from "../ui/label";
import { Send, X, Mail, Briefcase, Building2, Calendar } from "lucide-react";
import { toast } from "sonner";
export function InvitationComposer({
  isOpen,
  onClose,
  talentId,
  talentName,
  talentRole,
  talentEmail,
  founderId,
  founderName,
  startupName,
  startupId,
}) {
  const [email, setEmail] = useState(talentEmail || "");
  const [role, setRole] = useState(talentRole || "");
  const [department, setDepartment] = useState("Engineering");
  const [message, setMessage] = useState("");
  const [equityPercentage, setEquityPercentage] = useState("");
  const [vestingYears, setVestingYears] = useState("4");
  const [cliffMonths, setCliffMonths] = useState("12");
  const [salary, setSalary] = useState("");
  const [benefits, setBenefits] = useState("");
  const [startDate, setStartDate] = useState("");
  const [isSending, setIsSending] = useState(false);
  const handleSend = () => {
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    if (!role.trim()) {
      toast.error("Please specify a role");
      return;
    }
    if (!message.trim()) {
      toast.error("Please write a personal message");
      return;
    }
    setIsSending(true);

    // Create invitation
    const token = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const newInvitation = {
      id: Date.now().toString(),
      token,
      email: email.trim(),
      role: role.trim(),
      department,
      startupId,
      startupName,
      founderId,
      founderName,
      status: "pending",
      createdAt: now,
      expiresAt,
      message: message.trim(),
      equityPercentage: equityPercentage.trim()
        ? parseFloat(equityPercentage)
        : undefined,
      vestingYears: vestingYears.trim() ? parseInt(vestingYears) : undefined,
      cliffMonths: cliffMonths.trim() ? parseInt(cliffMonths) : undefined,
      salary: salary.trim() || undefined,
      benefits: benefits.trim() || undefined,
      startDate: startDate.trim() || undefined,
    };

    // Save to localStorage
    const storedInvitations = localStorage.getItem("startupverse_invitations");
    const invitations = storedInvitations ? JSON.parse(storedInvitations) : [];
    invitations.push(newInvitation);
    localStorage.setItem(
      "startupverse_invitations",
      JSON.stringify(invitations),
    );

    // Generate invitation link
    const invitationLink = `${window.location.origin}?invite=${token}`;
    setTimeout(() => {
      setIsSending(false);

      // Copy link to clipboard
      navigator.clipboard
        .writeText(invitationLink)
        .then(() => {
          toast.success(
            <div className="space-y-1">
              <p className="font-semibold">
                {"Invitation sent to "}
                {talentName}!
              </p>
              <p className="text-xs text-muted-foreground">
                Invitation link copied to clipboard
              </p>
            </div>,
            {
              duration: 4000,
            },
          );
        })
        .catch(() => {
          toast.success(`Invitation sent to ${talentName}!`, {
            duration: 4000,
          });
        });

      // Log the link for demo purposes
      console.log("📧 Invitation Link:", invitationLink);
      console.log("📋 Share this link with the talent:", invitationLink);

      // Reset form
      setEmail(talentEmail || "");
      setRole(talentRole || "");
      setDepartment("Engineering");
      setMessage("");
      setEquityPercentage("");
      setVestingYears("4");
      setCliffMonths("12");
      setSalary("");
      setBenefits("");
      setStartDate("");
      onClose();
    }, 800);
  };
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSend();
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invite to Team</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
          <Avatar className="w-12 h-12">
            <AvatarFallback className="bg-primary/10 text-primary text-body-medium">
              {talentName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <h4 className="text-body-medium">{talentName}</h4>
            <p className="text-body-small text-muted-foreground">
              {talentRole}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-body-small">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">Inviting to:</span>
          <span className="font-medium">{startupName}</span>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="text-body-small font-medium flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="talent@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-body-medium border border-border"
            />
            <p className="text-caption-medium text-muted-foreground">
              We'll send the invitation link to this email
            </p>
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="role"
              className="text-body-small font-medium flex items-center gap-1.5"
            >
              <Briefcase className="w-3.5 h-3.5" />
              Role / Position
            </Label>
            <Input
              id="role"
              type="text"
              placeholder="e.g., Senior Backend Engineer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="text-body-medium border border-border"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="department" className="text-body-small font-medium">
              Department
            </Label>
            <select
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-border bg-background text-body-medium focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="Engineering">Engineering</option>
              <option value="Product">Product</option>
              <option value="Design">Design</option>
              <option value="Marketing">Marketing</option>
              <option value="Sales">Sales</option>
              <option value="Operations">Operations</option>
              <option value="Finance">Finance</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="message" className="text-body-small font-medium">
              Personal Message
            </Label>
            <Textarea
              id="message"
              placeholder="Tell them about the opportunity, your vision, and why you think they'd be perfect for the team..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              rows={6}
              className="resize-none text-body-medium border border-border"
            />
            <div className="flex items-center justify-between">
              <p className="text-caption-medium text-muted-foreground">
                Tip: Press Cmd/Ctrl + Enter to send
              </p>
              <p className="text-caption-medium text-muted-foreground">
                <Calendar className="w-3 h-3 inline mr-1" />
                Valid for 30 days
              </p>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="equityPercentage"
              className="text-body-small font-medium"
            >
              Equity Percentage
            </Label>
            <Input
              id="equityPercentage"
              type="text"
              placeholder="e.g., 1%"
              value={equityPercentage}
              onChange={(e) => setEquityPercentage(e.target.value)}
              className="text-body-medium border border-border"
            />
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="vestingYears"
              className="text-body-small font-medium"
            >
              Vesting Years
            </Label>
            <Input
              id="vestingYears"
              type="text"
              placeholder="e.g., 4"
              value={vestingYears}
              onChange={(e) => setVestingYears(e.target.value)}
              className="text-body-medium border border-border"
            />
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="cliffMonths"
              className="text-body-small font-medium"
            >
              Cliff Months
            </Label>
            <Input
              id="cliffMonths"
              type="text"
              placeholder="e.g., 12"
              value={cliffMonths}
              onChange={(e) => setCliffMonths(e.target.value)}
              className="text-body-medium border border-border"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="salary" className="text-body-small font-medium">
              Salary
            </Label>
            <Input
              id="salary"
              type="text"
              placeholder="e.g., $100,000"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              className="text-body-medium border border-border"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="benefits" className="text-body-small font-medium">
              Benefits
            </Label>
            <Input
              id="benefits"
              type="text"
              placeholder="e.g., Health Insurance, 401(k)"
              value={benefits}
              onChange={(e) => setBenefits(e.target.value)}
              className="text-body-medium border border-border"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="startDate" className="text-body-small font-medium">
              Start Date
            </Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-body-medium border border-border"
            />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isSending}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSend}
            disabled={
              !email.trim() || !role.trim() || !message.trim() || isSending
            }
          >
            <Send className="w-4 h-4 mr-2" />
            {isSending ? "Sending..." : "Send Invitation"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
