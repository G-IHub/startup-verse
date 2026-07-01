import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { settingsBtnOutline } from "../settings/SettingsPrimitives";
import {
  countDraftItems,
  DEFAULT_ARRAY_MODES,
  DEFAULT_RESUME_SECTIONS,
  mergeResumeDraft,
} from "../../utils/mergeResumeDraft";

const SECTION_META = [
  { key: "identity", label: "Name, title, location, bio", hasArrayMode: false },
  { key: "skills", label: "Skills", hasArrayMode: true },
  { key: "work", label: "Work experience", hasArrayMode: true },
  { key: "education", label: "Education", hasArrayMode: true },
  { key: "certifications", label: "Certifications", hasArrayMode: true },
  { key: "projects", label: "Projects & portfolio", hasArrayMode: true },
  { key: "links", label: "LinkedIn, GitHub, website", hasArrayMode: false },
];

export default function ResumeImportReview({
  open,
  onOpenChange,
  draft,
  resumeMeta,
  editedProfile,
  onApply,
}) {
  const counts = useMemo(() => countDraftItems(draft), [draft]);
  const [sections, setSections] = useState({ ...DEFAULT_RESUME_SECTIONS });
  const [arrayModes, setArrayModes] = useState({ ...DEFAULT_ARRAY_MODES });

  const toggleSection = (key, checked) => {
    setSections((prev) => ({ ...prev, [key]: checked }));
  };

  const handleApply = () => {
    const merged = mergeResumeDraft(editedProfile, draft, {
      sections,
      arrayModes,
      resumeMeta,
    });
    onApply(merged);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto font-body">
        <DialogHeader>
          <DialogTitle className="font-heading text-base text-text-heading">
            Review imported details
          </DialogTitle>
          <DialogDescription className="font-body text-sm text-text-muted">
            Select which sections to add to your profile. Nothing is saved until
            you click Save on the profile page.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {SECTION_META.map(({ key, label, hasArrayMode }) => {
            const count = counts[key] || 0;
            if (count === 0) return null;
            return (
              <div
                key={key}
                className="rounded-input border border-surface-border bg-surface-page p-3"
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={`resume-section-${key}`}
                    checked={Boolean(sections[key])}
                    onCheckedChange={(checked) =>
                      toggleSection(key, checked === true)
                    }
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Label
                      htmlFor={`resume-section-${key}`}
                      className="cursor-pointer font-body text-sm font-medium text-text-heading"
                    >
                      {label}
                      <span className="ml-1 font-normal text-text-muted">
                        ({count} {count === 1 ? "item" : "items"})
                      </span>
                    </Label>
                    {hasArrayMode && sections[key] ? (
                      <Select
                        value={arrayModes[key] || "append"}
                        onValueChange={(value) =>
                          setArrayModes((prev) => ({ ...prev, [key]: value }))
                        }
                      >
                        <SelectTrigger className="h-9 w-full max-w-[220px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="append">Append to existing</SelectItem>
                          <SelectItem value="replace">Replace existing</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            className={settingsBtnOutline}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleApply}>
            Apply to profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
