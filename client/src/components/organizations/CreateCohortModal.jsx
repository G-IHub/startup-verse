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
import { Users, CheckCircle2 } from "lucide-react";
import { createCohort } from "../../utils/organizationHelpersSupabase";
export default function CreateCohortModal({
  isOpen,
  onClose,
  organizationId,
  organizationName,
  userId,
  onSuccess,
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      // Get current user data from localStorage for email and name
      const currentUserData = localStorage.getItem("startupverse_current_user");
      const currentUser = currentUserData ? JSON.parse(currentUserData) : null;
      const cohort = await createCohort(
        name.trim(),
        organizationId,
        userId,
        currentUser?.email || "admin@example.com",
        currentUser?.name || "Admin",
        description.trim() || undefined,
        startDate || undefined,
        endDate || undefined,
      );
      if (onSuccess) {
        onSuccess(cohort.id);
      }

      // Reset form
      setName("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      onClose();
    } catch (error) {
      console.error("Failed to create cohort:", error);
      alert("Failed to create cohort. Please ensure the backend is deployed.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[10px] flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Create Cohort
          </DialogTitle>
          <DialogDescription className="text-[10px]">
            {"Create a new cohort for "}
            {organizationName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div>
            <Label className="text-[10px]">Cohort Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., 2026 Spring Cohort"
              className="mt-1 h-7 text-[10px]"
              required={true}
            />
          </div>
          <div>
            <Label className="text-[10px]">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this cohort..."
              className="mt-1 min-h-[60px] text-[10px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px]">Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 h-7 text-[10px]"
              />
            </div>
            <div>
              <Label className="text-[10px]">End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 h-7 text-[10px]"
              />
            </div>
          </div>
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
            <Button
              type="submit"
              className="flex-1 h-7 text-[10px]"
              disabled={!name.trim() || isSubmitting}
            >
              <CheckCircle2 className="w-3 h-3 mr-1.5" />
              Create Cohort
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
