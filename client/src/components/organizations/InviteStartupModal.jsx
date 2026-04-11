import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Send, Search } from "lucide-react";
import {
  createInvitation,
  searchUserByEmail,
} from "../../utils/organizationHelpersBackend";
export default function InviteStartupModal({
  isOpen,
  onClose,
  cohortId,
  cohortName,
  organizationId,
  organizationName,
  userId,
  onSuccess,
}) {
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedFounder, setSelectedFounder] = useState(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const handleSearch = async () => {
    setIsSearching(true);
    setSelectedFounder(null);
    try {
      // Search backend for founders by email
      const user = await searchUserByEmail(searchEmail);
      if (user && user.role === "founder") {
        setSelectedFounder(user);
        setMessage(
          `We'd like to invite ${user.startupName || "your startup"} to join ${cohortName}. This will give us read-only access to your execution progress to better support your journey.`,
        );
        return;
      }

      // Not found in directory / API
      alert(
        `No founder found with email "${searchEmail}".\n\nThe founder must have a StartupVerse account first.\n\n✅ Ask them to sign up at StartupVerse\n✅ They should select "Founder" as their role\n✅ After they complete signup, you can search for them here`,
      );
    } catch (error) {
      console.error("Error searching for founder:", error);
      alert("Error searching for founder. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };
  const handleSendInvitation = async () => {
    if (!selectedFounder) return;
    setIsSubmitting(true);
    try {
      console.log("📧 Sending invitation to:", {
        founderId: selectedFounder.id,
        founderEmail: selectedFounder.email,
        founderName: selectedFounder.name,
        startup: selectedFounder.startupName || selectedFounder.companyName,
        cohortId,
        organizationId,
      });
      await createInvitation(
        cohortId,
        organizationId,
        selectedFounder.id,
        selectedFounder.email,
        selectedFounder.name,
        selectedFounder.startupName ||
          selectedFounder.companyName ||
          "Unnamed Startup",
        userId,
        message.trim() || undefined,
      );
      console.log("✅ Invitation sent successfully!");
      console.log(
        "💡 Founder should refresh their dashboard to see the invitation",
      );
      if (onSuccess) {
        onSuccess();
      }

      // Reset form
      setSearchEmail("");
      setSelectedFounder(null);
      setMessage("");
      onClose();
    } catch (error) {
      console.error("❌ Failed to send invitation:", error);
      alert(
        "Failed to send invitation. Please ensure the backend is deployed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[10px] flex items-center gap-2">
            <Send className="w-4 h-4 text-primary" />
            {"Invite Startup to "}
            {cohortName}
          </DialogTitle>
          <DialogDescription className="text-[10px]">
            Search for a founder by email and send them an invitation
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          {!selectedFounder && (
            <div>
              <Label className="text-[10px]">Founder Email *</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="founder@startup.com"
                  type="email"
                  className="flex-1 h-7 text-[10px]"
                  onKeyDown={(e) =>
                    e.key === "Enter" && !isSearching && handleSearch()
                  }
                  disabled={isSearching}
                />
                <Button
                  onClick={handleSearch}
                  variant="outline"
                  className="h-7 text-[10px]"
                  disabled={isSearching || !searchEmail.trim()}
                >
                  {isSearching ? "..." : <Search className="w-3 h-3" />}
                </Button>
              </div>
              <p className="text-[9px] text-muted-foreground mt-1">
                {isSearching
                  ? "Searching..."
                  : "Enter the founder's email address to search"}
              </p>
            </div>
          )}
          {selectedFounder && (
            <>
              <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-[10px]">
                      {selectedFounder.startupName ||
                        selectedFounder.companyName ||
                        "Unnamed Startup"}
                    </p>
                    <p className="text-[9px] text-muted-foreground">
                      {selectedFounder.name}
                    </p>
                    <p className="text-[9px] text-muted-foreground">
                      {selectedFounder.email}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFounder(null);
                      setSearchEmail("");
                    }}
                    className="h-6 text-[9px]"
                  >
                    Change
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-[10px]">
                  Personal Message (Optional)
                </Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a personal message to your invitation..."
                  className="mt-1 min-h-[70px] text-[10px]"
                />
              </div>
              <div className="p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
                <p className="text-[10px] text-blue-900 dark:text-blue-100">
                  <strong>What the founder will see:</strong>
                </p>
                <ul className="mt-1 space-y-0.5 text-[9px] text-blue-700 dark:text-blue-300">
                  <li>
                    {"✓ Invitation to join "}
                    {cohortName}
                  </li>
                  <li>✓ Read-only access to execution progress</li>
                  <li>✓ Option to accept or decline</li>
                  <li>✓ Can leave the cohort at any time</li>
                </ul>
              </div>
            </>
          )}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-7 text-[10px]"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            {selectedFounder && (
              <Button
                onClick={handleSendInvitation}
                className="flex-1 h-7 text-[10px]"
                disabled={isSubmitting}
              >
                <Send className="w-3 h-3 mr-1.5" />
                Send Invitation
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
