import React, { useEffect, useRef, useState } from "react";
import { FileText, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { settingsBtnOutline } from "../settings/SettingsPrimitives";
import { cn } from "../ui/utils";
import * as talentApi from "../../utils/api/talentApi";
import ResumeImportReview from "./ResumeImportReview";

const ACCEPT = ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MAX_BYTES = 5 * 1024 * 1024;

function formatParsedDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default function ResumeImportPanel({
  editedProfile,
  onApply,
}) {
  const inputRef = useRef(null);
  const [configured, setConfigured] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  const [resumeMeta, setResumeMeta] = useState(null);

  useEffect(() => {
    talentApi
      .getResumeParseStatus()
      .then((data) => setConfigured(Boolean(data?.configured)))
      .catch(() => setConfigured(false));
  }, []);

  const resumeFileName =
    editedProfile?.resumeFileName || editedProfile?.resumeUrl ? "CV on file" : "";
  const resumeParsedAt = editedProfile?.resumeParsedAt;

  const handleFile = async (file) => {
    if (!file) return;

    if (file.size > MAX_BYTES) {
      toast.error("Resume must be 5MB or smaller.");
      return;
    }

    const name = file.name.toLowerCase();
    if (!name.endsWith(".pdf") && !name.endsWith(".docx")) {
      toast.error("Upload a PDF or DOCX file.");
      return;
    }

    setParsing(true);
    try {
      const result = await talentApi.parseResumeFromFile(file);
      setDraft(result.draft);
      setResumeMeta({
        url: result.resume?.url,
        key: result.resume?.key,
        fileName: result.resume?.fileName || file.name,
        mimeType: result.resume?.mimeType,
        parsedAt: result.parsedAt,
      });
      setReviewOpen(true);
    } catch (err) {
      if (err?.status === 503) {
        setConfigured(false);
        toast.error("Resume import is not available right now.");
      } else {
        toast.error(err?.message || "Failed to parse resume.");
      }
    } finally {
      setParsing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleApply = (merged) => {
    onApply(merged);
    toast.success("Imported — review your profile and click Save.");
  };

  return (
    <>
      <Card className="rounded-card border border-surface-border bg-surface-card shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 font-heading text-base font-semibold text-text-heading">
            <FileText className="h-5 w-5 text-primary" />
            Import from CV
          </CardTitle>
          <CardDescription className="font-body text-sm text-text-muted">
            Upload your resume to extract skills, experience, and education.
            Review extracted details before saving your profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {configured === false ? (
            <p className="rounded-input border border-surface-border bg-surface-page px-3 py-2 font-body text-sm text-text-muted">
              CV import is not configured on this server. Add your details
              manually below, or contact your administrator.
            </p>
          ) : (
            <div
              className={cn(
                "rounded-input border border-dashed border-surface-border bg-surface-page px-4 py-6 text-center",
                parsing && "opacity-70",
              )}
            >
              <Upload className="mx-auto mb-2 h-8 w-8 text-text-muted" />
              <p className="mb-3 font-body text-sm text-text-muted">
                PDF or DOCX, max 5MB
              </p>
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                className="hidden"
                disabled={parsing || configured !== true}
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <Button
                type="button"
                variant="outline"
                className={settingsBtnOutline}
                disabled={parsing || configured !== true}
                onClick={() => inputRef.current?.click()}
              >
                {parsing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reading CV…
                  </>
                ) : (
                  "Choose file"
                )}
              </Button>
            </div>
          )}

          {resumeFileName || resumeParsedAt ? (
            <p className="font-body text-xs text-text-muted">
              Last CV
              {editedProfile?.resumeFileName
                ? `: ${editedProfile.resumeFileName}`
                : ""}
              {resumeParsedAt
                ? ` · parsed ${formatParsedDate(resumeParsedAt)}`
                : ""}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <ResumeImportReview
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        draft={draft}
        resumeMeta={resumeMeta}
        editedProfile={editedProfile}
        onApply={handleApply}
      />
    </>
  );
}
