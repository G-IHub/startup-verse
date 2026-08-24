import React, { useEffect, useMemo, useRef, useState } from "react";
import { Clock3, ExternalLink, ImagePlus, Link2, Loader2, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { resolveMediaUrl } from "../../utils/resolveMediaUrl";
import { formatWorkLogTime } from "../dashboards/founder/workLogPresentation";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

const fieldClass =
  "rounded-input border-[1.5px] border-surface-border bg-surface-card font-body text-[13px] text-text-heading placeholder:text-text-muted focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/10";

function formatLinkLabel(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function ExtraWorkLogDialog({
  open,
  mode = "create",
  initialLog = null,
  saving = false,
  onOpenChange,
  onSubmit,
}) {
  const isView = mode === "view";
  const fileInputRef = useRef(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [existingImage, setExistingImage] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [imageError, setImageError] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(initialLog?.title || "");
    setDescription(initialLog?.description || "");
    setLinkUrl(initialLog?.linkUrl || "");
    setImageFile(null);
    setExistingImage(initialLog?.image || null);
    setRemoveImage(false);
    setImageError("");
    setDragOver(false);
  }, [open, initialLog]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview("");
      return undefined;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const previewSrc = imagePreview || (!removeImage && existingImage?.url
    ? resolveMediaUrl(existingImage.url)
    : "");

  const canSave = useMemo(() => {
    return title.trim().length >= 2 && description.trim().length >= 2 && !saving;
  }, [title, description, saving]);

  const acceptFile = (file) => {
    if (!file) return;
    if (!ALLOWED_TYPES.has(file.type)) {
      setImageError("Use a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setImageError("Image must be 5MB or smaller.");
      return;
    }
    setImageError("");
    setImageFile(file);
    setRemoveImage(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (isView || !canSave) return;
    onSubmit?.({
      title: title.trim(),
      description: description.trim(),
      linkUrl: linkUrl.trim(),
      imageFile,
      removeImage,
      existingImage: removeImage ? null : existingImage,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-card border border-surface-border bg-surface-card shadow-modal sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-bold text-text-heading">
            {isView
              ? initialLog?.title || "Extra work"
              : mode === "edit"
                ? "Edit extra work"
                : "Log extra work"}
          </DialogTitle>
          <DialogDescription className="font-body text-sm text-text-body">
            {isView
              ? initialLog?.authorName
                ? `${initialLog.authorName} logged this extra work at ${formatWorkLogTime(initialLog.createdAt)}.`
                : "Work that was not on the assigned task list."
              : "Capture something you finished that was not assigned as a task."}
          </DialogDescription>
        </DialogHeader>

        {isView ? (
          <div className="space-y-4">
            <div className="rounded-input bg-surface-page p-3">
              <p className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                Description
              </p>
              <p className="mt-1.5 whitespace-pre-wrap font-body text-[14px] leading-relaxed text-text-body">
                {initialLog?.description || "No description added."}
              </p>
            </div>
            {previewSrc ? (
              <figure className="space-y-2">
                <figcaption className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                  Photo
                </figcaption>
                <a href={previewSrc} target="_blank" rel="noreferrer">
                  <img
                    src={previewSrc}
                    alt={`Extra work submitted by ${initialLog?.authorName || "team member"}`}
                    className="max-h-80 w-full rounded-input object-contain"
                  />
                </a>
              </figure>
            ) : (
              <p className="font-body text-[12px] text-text-muted">No photo added.</p>
            )}
            {initialLog?.linkUrl ? (
              <div className="rounded-input border border-surface-border p-3">
                <p className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                  Work link
                </p>
                <a
                  href={initialLog.linkUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1.5 inline-flex max-w-full items-center gap-1.5 font-body text-[13px] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Link2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{formatLinkLabel(initialLog.linkUrl)}</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                </a>
              </div>
            ) : (
              <p className="font-body text-[12px] text-text-muted">No link added.</p>
            )}
            <div className="flex items-center gap-1.5 border-t border-surface-border pt-3 font-body text-[12px] text-text-muted">
              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Logged </span>
              <time dateTime={initialLog?.createdAt}>
                {formatWorkLogTime(initialLog?.createdAt)}
              </time>
            </div>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="font-body text-[13px] font-medium text-text-heading">
                Title
              </label>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="What did you get done?"
                maxLength={200}
                className={fieldClass}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-body text-[13px] font-medium text-text-heading">
                Description
              </label>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="A short note on what you did and why it mattered."
                rows={4}
                maxLength={5000}
                className={`min-h-[112px] ${fieldClass}`}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="font-body text-[13px] font-medium text-text-heading">
                  Photo <span className="font-normal text-text-muted">(optional)</span>
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragOver(false);
                    acceptFile(event.dataTransfer.files?.[0]);
                  }}
                  className={`relative flex min-h-[112px] w-full flex-col items-center justify-center overflow-hidden rounded-input border-[1.5px] border-dashed px-3 py-4 text-center transition-colors ${
                    dragOver
                      ? "border-primary bg-primary-tint"
                      : "border-surface-border bg-surface-page hover:border-primary"
                  }`}
                >
                  {previewSrc ? (
                    <>
                      <img
                        src={previewSrc}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <span className="relative rounded-pill bg-surface-card/90 px-2 py-1 font-body text-[11px] font-semibold text-text-heading">
                        Change photo
                      </span>
                    </>
                  ) : (
                    <>
                      <ImagePlus className="h-5 w-5 text-text-muted" />
                      <span className="mt-2 font-body text-[12px] text-text-muted">
                        Drop or click to add
                      </span>
                    </>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => acceptFile(event.target.files?.[0])}
                />
                {previewSrc ? (
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setRemoveImage(true);
                    }}
                    className="inline-flex items-center gap-1 font-body text-[12px] font-semibold text-text-muted hover:text-status-error"
                  >
                    <X className="h-3.5 w-3.5" />
                    Remove photo
                  </button>
                ) : null}
                {imageError ? (
                  <p className="font-body text-[12px] text-status-error">{imageError}</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label className="font-body text-[13px] font-medium text-text-heading">
                  Link <span className="font-normal text-text-muted">(optional)</span>
                </label>
                <Input
                  value={linkUrl}
                  onChange={(event) => setLinkUrl(event.target.value)}
                  placeholder="https://"
                  className={fieldClass}
                />
                <p className="font-body text-[12px] text-text-muted">
                  A doc, PR, or anything that shows the work.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded-input"
                onClick={() => onOpenChange?.(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!canSave}
                className="h-10 rounded-input bg-primary font-body text-[14px] font-semibold text-white shadow-soft hover:bg-primary-hover"
              >
                {saving ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : null}
                {mode === "edit" ? "Save changes" : "Save log"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
