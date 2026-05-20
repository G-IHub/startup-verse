import React, { useState, useEffect } from "react";
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
import { Send, Search, ArrowLeft } from "lucide-react";
import {
  createInvitation,
  searchUserByEmail,
} from "../../utils/organizationHelpersBackend";
import {
  buildDefaultInviteMessage,
  parseApiError,
} from "../../utils/inviteStartupHelpers";
import { toast } from "sonner";
import { toastError } from "../../utils/toastError";
import AvailableStartupsPanel from "./AvailableStartupsPanel";

const PRIMARY_BUTTON =
  "h-9 rounded-input bg-primary font-body text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(58,90,254,0.25)] hover:bg-primary-hover";
const OUTLINE_BUTTON =
  "h-9 rounded-input border border-surface-border bg-white font-body text-[13px] font-medium text-text-body hover:bg-primary-tint hover:text-primary";

export default function InviteStartupModal({
  isOpen,
  onClose,
  cohortId,
  cohortName,
  organizationId,
  organizationName,
  userId,
  onSuccess,
  initialMode = "browse",
}) {
  const [mode, setMode] = useState(initialMode);
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedFounder, setSelectedFounder] = useState(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [inviteError, setInviteError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  const resetForm = () => {
    setSearchEmail("");
    setSelectedFounder(null);
    setMessage("");
    setInviteError("");
    setMode(initialMode);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSearch = async () => {
    setIsSearching(true);
    setSelectedFounder(null);
    setInviteError("");
    try {
      const user = await searchUserByEmail(searchEmail);
      if (user && user.role === "founder") {
        setSelectedFounder(user);
        setMessage(
          buildDefaultInviteMessage(
            user.startupName || user.companyName,
            cohortName,
          ),
        );
        return;
      }
      toast.error(
        `No founder found with email "${searchEmail}". Ask them to sign up at StartupVerse first and select "Founder" as their role.`,
      );
    } catch (error) {
      console.error("Error searching for founder:", error);
      toastError(error, "Error searching for founder. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendInvitation = async () => {
    if (!selectedFounder) return;
    setIsSubmitting(true);
    try {
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
      if (onSuccess) onSuccess();
      handleClose();
    } catch (error) {
      console.error("Failed to send invitation:", error);
      const parsed = parseApiError(error);
      if (parsed.status === 409) {
        setInviteError(
          parsed.message ||
            "A pending invitation already exists for this founder.",
        );
        toastError(
          { status: parsed.status, message: parsed.message },
          "A pending invitation already exists for this founder.",
        );
      } else {
        toastError(
          { status: parsed.status, message: parsed.message },
          "Failed to send invitation. Please ensure the backend is deployed.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading text-[18px] font-bold text-text-heading">
            <Send className="h-5 w-5 text-primary" />
            Invite Startup to {cohortName}
          </DialogTitle>
          <DialogDescription className="font-body text-[13px] text-text-body">
            {mode === "browse"
              ? "Choose a startup to invite, or search by email."
              : "Search for a founder by email and send them an invitation."}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 font-body">
          {mode === "browse" ? (
            <AvailableStartupsPanel
              variant="modal"
              cohortId={cohortId}
              cohortName={cohortName}
              organizationId={organizationId}
              userId={userId}
              onInviteSuccess={() => {
                if (onSuccess) onSuccess();
                handleClose();
              }}
              onInviteByEmail={() => setMode("email")}
            />
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setMode("browse");
                  setSelectedFounder(null);
                  setSearchEmail("");
                  setInviteError("");
                }}
                className="inline-flex items-center gap-1.5 font-body text-[13px] font-medium text-primary hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to startup list
              </button>

              {!selectedFounder && (
                <div>
                  <Label className="font-body text-[13px] font-medium text-text-heading">
                    Founder Email *
                  </Label>
                  <div className="mt-1 flex gap-2">
                    <Input
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      placeholder="founder@startup.com"
                      type="email"
                      className="flex-1 font-body text-[13px]"
                      onKeyDown={(e) =>
                        e.key === "Enter" && !isSearching && handleSearch()
                      }
                      disabled={isSearching}
                    />
                    <Button
                      onClick={handleSearch}
                      className={OUTLINE_BUTTON}
                      disabled={isSearching || !searchEmail.trim()}
                    >
                      {isSearching ? "..." : <Search className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="mt-1 font-body text-[12px] text-text-muted">
                    {isSearching
                      ? "Searching..."
                      : "Enter the founder's email address to search"}
                  </p>
                </div>
              )}

              {selectedFounder && (
                <>
                  <div className="rounded-input border border-primary/20 bg-primary-tint p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-heading text-[14px] font-semibold text-text-heading">
                          {selectedFounder.startupName ||
                            selectedFounder.companyName ||
                            "Unnamed Startup"}
                        </p>
                        <p className="font-body text-[12px] text-text-body">
                          {selectedFounder.name}
                        </p>
                        <p className="font-body text-[12px] text-text-muted">
                          {selectedFounder.email}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedFounder(null);
                          setSearchEmail("");
                          setInviteError("");
                        }}
                        className="h-7 rounded-input bg-white px-3 font-body text-[12px] font-medium text-primary hover:bg-white/70"
                      >
                        Change
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="font-body text-[13px] font-medium text-text-heading">
                      Personal Message (Optional)
                    </Label>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Add a personal message to your invitation..."
                      className="mt-1 min-h-[70px] font-body text-[13px]"
                    />
                  </div>

                  <div className="rounded-input border border-primary/20 bg-primary-tint p-3">
                    <p className="font-body text-[13px] font-semibold text-primary">
                      What the founder will see:
                    </p>
                    <ul className="mt-1 space-y-0.5 font-body text-[12px] text-text-body">
                      <li>Invitation to join {cohortName}</li>
                      <li>Read-only access to execution progress</li>
                      <li>Option to accept or decline</li>
                      <li>Can leave the cohort at any time</li>
                    </ul>
                  </div>
                </>
              )}

              {inviteError && (
                <div className="rounded-input border border-error/20 bg-error/5 px-3 py-2 font-body text-[12px] text-error">
                  {inviteError}
                </div>
              )}

              <div className="flex gap-2 border-t border-surface-border pt-3">
                <Button
                  type="button"
                  onClick={handleClose}
                  className={`flex-1 ${OUTLINE_BUTTON}`}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                {selectedFounder && (
                  <Button
                    onClick={handleSendInvitation}
                    className={`flex-1 ${PRIMARY_BUTTON}`}
                    disabled={isSubmitting}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send Invitation
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
