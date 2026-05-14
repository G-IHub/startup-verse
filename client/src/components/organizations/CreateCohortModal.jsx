import React, { useEffect, useState } from "react";
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
import {
  createCohort,
  updateCohort,
} from "../../utils/organizationHelpersBackend";
import { toastError } from "../../utils/toastError";

const PRIMARY_BUTTON =
  "h-9 rounded-input bg-primary font-body text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(58,90,254,0.25)] hover:bg-primary-hover";
const OUTLINE_BUTTON =
  "h-9 rounded-input border border-surface-border bg-white font-body text-[13px] font-medium text-text-body hover:bg-primary-tint hover:text-primary";

/**
 * Renders an ISO date / date-time into the value expected by `<input type="date">`.
 * Returns "" for missing or invalid values so the input renders as empty.
 */
function toDateInputValue(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function CreateCohortModal({
  isOpen,
  onClose,
  organizationId,
  organizationName,
  userId,
  creatorEmail,
  creatorName,
  cohort,
  onSuccess,
  onUpdated,
}) {
  const isEditMode = Boolean(cohort && (cohort.id || cohort._id));
  const cohortId = isEditMode ? cohort.id || cohort._id : null;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Re-prime form fields whenever the modal opens or the edit target changes.
  useEffect(() => {
    if (!isOpen) return;
    if (isEditMode) {
      setName(cohort.name || "");
      setDescription(cohort.description || "");
      setStartDate(toDateInputValue(cohort.startDate));
      setEndDate(toDateInputValue(cohort.endDate));
    } else {
      setName("");
      setDescription("");
      setStartDate("");
      setEndDate("");
    }
  }, [isOpen, isEditMode, cohort]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        const updated = await updateCohort(cohortId, {
          name: name.trim(),
          description: description.trim(),
          startDate: startDate || null,
          endDate: endDate || null,
        });
        if (onUpdated) onUpdated(updated);
      } else {
        const created = await createCohort(
          name.trim(),
          organizationId,
          userId,
          (creatorEmail && creatorEmail.trim()) || "admin@example.com",
          (creatorName && creatorName.trim()) || "Admin",
          description.trim() || undefined,
          startDate || undefined,
          endDate || undefined,
        );
        if (onSuccess) onSuccess(created.id);
      }
      setName("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      onClose();
    } catch (error) {
      console.error(
        isEditMode ? "Failed to update cohort:" : "Failed to create cohort:",
        error,
      );
      toastError(
        error,
        isEditMode
          ? "Failed to update cohort. Please try again."
          : "Failed to create cohort. Please ensure the backend is deployed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading text-[18px] font-bold text-text-heading">
            <Users className="h-5 w-5 text-primary" />
            {isEditMode ? "Edit Cohort" : "Create Cohort"}
          </DialogTitle>
          <DialogDescription className="font-body text-[13px] text-text-body">
            {isEditMode
              ? `Update details for ${cohort?.name || "this cohort"}`
              : `Create a new cohort for ${organizationName}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-3 font-body">
          <div>
            <Label className="font-body text-[13px] font-medium text-text-heading">
              Cohort Name *
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., 2026 Spring Cohort"
              className="mt-1 font-body text-[13px]"
              required={true}
            />
          </div>

          <div>
            <Label className="font-body text-[13px] font-medium text-text-heading">
              Description
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this cohort..."
              className="mt-1 min-h-[60px] font-body text-[13px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="font-body text-[13px] font-medium text-text-heading">
                Start Date
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 font-body text-[13px]"
              />
            </div>
            <div>
              <Label className="font-body text-[13px] font-medium text-text-heading">
                End Date
              </Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 font-body text-[13px]"
              />
            </div>
          </div>

          <div className="flex gap-2 border-t border-surface-border pt-3">
            <Button
              type="button"
              onClick={onClose}
              className={`flex-1 ${OUTLINE_BUTTON}`}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className={`flex-1 ${PRIMARY_BUTTON}`}
              disabled={!name.trim() || isSubmitting}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {isEditMode ? "Save Changes" : "Create Cohort"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
