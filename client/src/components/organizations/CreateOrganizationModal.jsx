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
      // Get current user data from localStorage for email and name
      const currentUserData = localStorage.getItem("startupverse_current_user");
      const currentUser = currentUserData ? JSON.parse(currentUserData) : null;
      const org = await createOrganization(
        name.trim(),
        type,
        userId,
        currentUser?.email || "admin@example.com",
        currentUser?.name || "Admin",
        description.trim() || undefined,
        website.trim() || undefined,
      );
      if (onSuccess) {
        onSuccess(org.id);
      }

      // Reset form
      setName("");
      setType("accelerator");
      setDescription("");
      setWebsite("");
      onClose();
    } catch (error) {
      console.error("Failed to create organization:", error);
      alert(
        "Failed to create organization. Please ensure the backend is deployed.",
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
            <Building2 className="w-4 h-4 text-primary" />
            Create Organization
          </DialogTitle>
          <DialogDescription className="text-[10px]">
            Set up your accelerator, competition, or program to manage cohorts
            of startups
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div>
            <Label className="text-[10px]">Organization Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Hult Prize Boston Regional"
              className="mt-1 h-7 text-[10px]"
              required={true}
            />
          </div>
          <div>
            <Label className="text-[10px]">Type *</Label>
            <Select value={type} onValueChange={(v) => setType(v)}>
              <SelectTrigger className="mt-1 h-7 text-[10px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="accelerator" className="text-[10px]">
                  Accelerator
                </SelectItem>
                <SelectItem value="competition" className="text-[10px]">
                  Competition
                </SelectItem>
                <SelectItem value="venture-studio" className="text-[10px]">
                  Venture Studio
                </SelectItem>
                <SelectItem value="university" className="text-[10px]">
                  University Program
                </SelectItem>
                <SelectItem value="ngo" className="text-[10px]">
                  NGO / Non-Profit
                </SelectItem>
                <SelectItem value="corporate" className="text-[10px]">
                  Corporate Program
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px]">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of your program..."
              className="mt-1 min-h-[60px] text-[10px]"
            />
          </div>
          <div>
            <Label className="text-[10px]">Website</Label>
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://..."
              type="url"
              className="mt-1 h-7 text-[10px]"
            />
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
              Create Organization
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
