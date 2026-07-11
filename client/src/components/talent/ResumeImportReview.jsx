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
import { Badge } from "../ui/badge";
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
  {
    key: "identity",
    label: "Name, title, location, bio",
    hasArrayMode: false,
    help: "Updates your public profile basics and short introduction.",
  },
  {
    key: "skills",
    label: "Skills",
    hasArrayMode: true,
    help: "Adds the technical and professional skills found in your CV.",
  },
  {
    key: "work",
    label: "Work experience",
    hasArrayMode: true,
    help: "Adds role history with company, dates, and responsibilities.",
  },
  {
    key: "education",
    label: "Education",
    hasArrayMode: true,
    help: "Adds schools, degrees, fields of study, and dates.",
  },
  {
    key: "certifications",
    label: "Certifications",
    hasArrayMode: true,
    help: "Adds certificates, issuers, years, and credential links.",
  },
  {
    key: "projects",
    label: "Projects & portfolio",
    hasArrayMode: true,
    help: "Adds portfolio projects with descriptions and links.",
  },
  {
    key: "links",
    label: "LinkedIn, GitHub, website",
    hasArrayMode: false,
    help: "Updates the external links shown on your profile.",
  },
];

function compact(value) {
  return String(value || "").trim();
}

function joinParts(parts) {
  return parts.map(compact).filter(Boolean).join(" · ");
}

function PreviewShell({ children }) {
  return (
    <div className="rounded-input border border-surface-border bg-white/80 p-3">
      {children}
    </div>
  );
}

function EmptyPreview() {
  return (
    <p className="font-body text-xs text-text-muted">
      No readable details were found in this section.
    </p>
  );
}

function TextPreview({ label, value }) {
  if (!compact(value)) return null;
  return (
    <div className="grid gap-1 sm:grid-cols-[130px_1fr]">
      <dt className="font-body text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </dt>
      <dd className="font-body text-sm text-text-heading">{value}</dd>
    </div>
  );
}

function SectionPreview({ sectionKey, draft }) {
  if (!draft) return null;

  if (sectionKey === "identity") {
    return (
      <PreviewShell>
        <dl className="space-y-2">
          <TextPreview label="Name" value={draft.fullName} />
          <TextPreview label="Title" value={draft.professionalTitle} />
          <TextPreview label="Location" value={draft.location} />
          <TextPreview label="Experience" value={draft.yearsOfExperience} />
          <TextPreview label="Bio" value={draft.bio} />
        </dl>
      </PreviewShell>
    );
  }

  if (sectionKey === "skills") {
    const skills = Array.isArray(draft.skills) ? draft.skills.filter(Boolean) : [];
    return (
      <PreviewShell>
        {skills.length ? (
          <div className="flex flex-wrap gap-2">
            {skills.slice(0, 32).map((skill, index) => (
              <Badge
                key={`${skill}-${index}`}
                variant="secondary"
                className="rounded-full border border-surface-border bg-surface-page px-2.5 py-1 font-body text-xs font-medium text-text-heading"
              >
                {skill}
              </Badge>
            ))}
            {skills.length > 32 ? (
              <span className="font-body text-xs text-text-muted">
                +{skills.length - 32} more
              </span>
            ) : null}
          </div>
        ) : (
          <EmptyPreview />
        )}
      </PreviewShell>
    );
  }

  if (sectionKey === "work") {
    const rows = Array.isArray(draft.workExperiences)
      ? draft.workExperiences
      : [];
    return (
      <PreviewShell>
        {rows.length ? (
          <div className="space-y-3">
            {rows.slice(0, 3).map((row, index) => (
              <article key={index} className="space-y-1">
                <h4 className="font-body text-sm font-semibold text-text-heading">
                  {compact(row.position) || "Untitled role"}
                </h4>
                <p className="font-body text-xs text-text-muted">
                  {joinParts([
                    row.company,
                    joinParts([row.startDate, row.current ? "Present" : row.endDate]),
                  ]) || "Company and dates not specified"}
                </p>
                {compact(row.description) ? (
                  <p className="line-clamp-2 font-body text-xs leading-5 text-text-muted">
                    {row.description}
                  </p>
                ) : null}
              </article>
            ))}
            {rows.length > 3 ? (
              <p className="font-body text-xs text-text-muted">
                +{rows.length - 3} more role{rows.length - 3 === 1 ? "" : "s"}
              </p>
            ) : null}
          </div>
        ) : (
          <EmptyPreview />
        )}
      </PreviewShell>
    );
  }

  if (sectionKey === "education") {
    const rows = Array.isArray(draft.educationList) ? draft.educationList : [];
    return (
      <PreviewShell>
        {rows.length ? (
          <div className="space-y-3">
            {rows.slice(0, 3).map((row, index) => (
              <article key={index} className="space-y-1">
                <h4 className="font-body text-sm font-semibold text-text-heading">
                  {compact(row.institution) || "Institution not specified"}
                </h4>
                <p className="font-body text-xs text-text-muted">
                  {joinParts([
                    joinParts([row.degree, row.field]),
                    joinParts([row.startYear, row.current ? "Present" : row.endYear]),
                  ]) || "Degree and dates not specified"}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyPreview />
        )}
      </PreviewShell>
    );
  }

  if (sectionKey === "certifications") {
    const rows = Array.isArray(draft.certifications)
      ? draft.certifications
      : [];
    return (
      <PreviewShell>
        {rows.length ? (
          <div className="space-y-3">
            {rows.slice(0, 3).map((row, index) => (
              <article key={index} className="space-y-1">
                <h4 className="font-body text-sm font-semibold text-text-heading">
                  {compact(row.name) || "Certification not specified"}
                </h4>
                <p className="font-body text-xs text-text-muted">
                  {joinParts([row.issuer, row.year]) || "Issuer not specified"}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyPreview />
        )}
      </PreviewShell>
    );
  }

  if (sectionKey === "projects") {
    const rows = Array.isArray(draft.portfolioItems)
      ? draft.portfolioItems
      : [];
    return (
      <PreviewShell>
        {rows.length ? (
          <div className="space-y-3">
            {rows.slice(0, 3).map((row, index) => (
              <article key={index} className="space-y-1">
                <h4 className="font-body text-sm font-semibold text-text-heading">
                  {compact(row.title) || "Project not specified"}
                </h4>
                {compact(row.description) ? (
                  <p className="line-clamp-2 font-body text-xs leading-5 text-text-muted">
                    {row.description}
                  </p>
                ) : null}
                {compact(row.url) ? (
                  <p className="truncate font-body text-xs text-primary">
                    {row.url}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <EmptyPreview />
        )}
      </PreviewShell>
    );
  }

  if (sectionKey === "links") {
    return (
      <PreviewShell>
        <dl className="space-y-2">
          <TextPreview label="LinkedIn" value={draft.linkedinUrl} />
          <TextPreview label="GitHub" value={draft.githubUrl} />
          <TextPreview label="Website" value={draft.websiteUrl} />
        </dl>
      </PreviewShell>
    );
  }

  return null;
}

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
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto font-body">
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
          {SECTION_META.map(({ key, label, hasArrayMode, help }) => {
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
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <Label
                          htmlFor={`resume-section-${key}`}
                          className="cursor-pointer font-body text-sm font-semibold text-text-heading"
                        >
                          {label}
                          <span className="ml-1 font-normal text-text-muted">
                            ({count} {count === 1 ? "item" : "items"})
                          </span>
                        </Label>
                        <p className="mt-1 font-body text-xs leading-5 text-text-muted">
                          {help}
                        </p>
                      </div>
                      {hasArrayMode && sections[key] ? (
                        <Select
                          value={arrayModes[key] || "append"}
                          onValueChange={(value) =>
                            setArrayModes((prev) => ({ ...prev, [key]: value }))
                          }
                        >
                          <SelectTrigger className="h-9 w-full min-w-[180px] max-w-[220px] bg-white text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="append">Append to existing</SelectItem>
                            <SelectItem value="replace">Replace existing</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : null}
                    </div>
                    <SectionPreview sectionKey={key} draft={draft} />
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
