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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Building2, CheckCircle2 } from "lucide-react";
import { createOrganization } from "../../utils/organizationHelpersBackend";
import { loadCurrentUser } from "../../app/session";
import { toastError } from "../../utils/toastError";

const PRIMARY_BUTTON =
  "h-9 rounded-input bg-primary font-body text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(58,90,254,0.25)] hover:bg-primary-hover";
const OUTLINE_BUTTON =
  "h-9 rounded-input border border-surface-border bg-white font-body text-[13px] font-medium text-text-body hover:bg-primary-tint hover:text-primary";

const ORG_TYPES = [
  { value: "accelerator", label: "Accelerator" },
  { value: "competition", label: "Competition" },
  { value: "venture-studio", label: "Venture Studio" },
  { value: "university", label: "University Program" },
  { value: "ngo", label: "NGO / Non-Profit" },
  { value: "corporate", label: "Corporate Program" },
];

export default function CreateOrganizationModal({
  isOpen,
  onClose,
  userId,
  onSuccess,
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("accelerator");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      const sessionUser = loadCurrentUser();
      const org = await createOrganization(
        name.trim(),
        type,
        userId,
        sessionUser?.email || "admin@example.com",
        sessionUser?.name || "Admin",
        description.trim() || undefined,
        website.trim() || undefined,
      );
      if (onSuccess) onSuccess(org.id);
      setName("");
      setType("accelerator");
      setDescription("");
      setWebsite("");
      onClose();
    } catch (error) {
      console.error("Failed to create organization:", error);
      toastError(
        error,
        "Failed to create organization. Check that the API is running and you are signed in.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="max-w-md"
        onInteractOutside={(e) => {
          const t = e.target;
          const inSelect =
            t &&
            typeof t.closest === "function" &&
            (t.closest("[data-slot='select-content']") ||
              t.closest("[data-radix-select-content]") ||
              t.closest("[data-radix-popper-content-wrapper]"));
          if (inSelect) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading text-[18px] font-bold text-text-heading">
            <Building2 className="h-5 w-5 text-primary" />
            Create Organization
          </DialogTitle>
          <DialogDescription className="font-body text-[13px] text-text-body">
            Set up your accelerator, competition, or program to manage cohorts
            of startups
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-3 font-body">
          <div>
            <Label className="font-body text-[13px] font-medium text-text-heading">
              Organization Name *
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Hult Prize Boston Regional"
              className="mt-1 font-body text-[13px]"
              required={true}
            />
          </div>

          <div>
            <Label className="font-body text-[13px] font-medium text-text-heading">
              Type *
            </Label>
            <Select value={type} onValueChange={(v) => setType(v)}>
              <SelectTrigger className="mt-1 font-body text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORG_TYPES.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="font-body text-[13px]"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="font-body text-[13px] font-medium text-text-heading">
              Description
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of your program..."
              className="mt-1 min-h-[60px] font-body text-[13px]"
            />
          </div>

          <div>
            <Label className="font-body text-[13px] font-medium text-text-heading">
              Website
            </Label>
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://..."
              type="url"
              className="mt-1 font-body text-[13px]"
            />
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
              Create Organization
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
