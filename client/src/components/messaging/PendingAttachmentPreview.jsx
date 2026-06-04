import React, { useEffect, useMemo, useState } from "react";
import { FileText, X } from "lucide-react";
import { cn } from "../ui/utils";
import { formatFileSize } from "../../utils/messaging";
import { inferAttachmentKind } from "../../utils/messageAttachmentUtils";

function useObjectUrl(file) {
  const [objectUrl, setObjectUrl] = useState("");

  useEffect(() => {
    if (!file) {
      setObjectUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return objectUrl;
}

export function PendingAttachmentPreview({
  file,
  uploading = false,
  uploadProgress = 0,
  onRemove,
}) {
  const previewUrl = useObjectUrl(file);

  const isImage = useMemo(() => {
    if (!file) return false;
    return inferAttachmentKind(file.type, file.name) === "image";
  }, [file]);

  if (!file) return null;

  return (
    <div className="mb-2 overflow-hidden rounded-xl bg-surface-page">
      <div className="flex items-start gap-2 p-2">
        <div className="min-w-0 flex-1">
          {isImage && previewUrl ? (
            <>
              <img
                src={previewUrl}
                alt={file.name}
                className="max-h-40 w-full rounded-lg object-contain bg-white"
              />
              <div className="mt-1.5 flex items-center justify-between gap-2 px-0.5">
                <p className="truncate font-body text-[10px] text-text-muted">{file.name}</p>
                <p className="shrink-0 font-body text-[10px] text-text-muted">
                  {formatFileSize(file.size)}
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 rounded-lg bg-white px-3 py-3">
              <div className="rounded-lg bg-primary-tint p-2">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-body text-xs font-medium text-text-heading">
                  {file.name}
                </p>
                <p className="font-body text-[10px] text-text-muted">
                  {formatFileSize(file.size)}
                </p>
              </div>
            </div>
          )}
        </div>
        {!uploading && (
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 rounded-full p-1 text-text-muted transition-colors hover:bg-primary-tint hover:text-text-heading"
            aria-label="Remove attachment"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {uploading && (
        <div className="border-t border-surface-border px-3 py-2">
          <div className="mb-1 flex items-center justify-between font-body text-[10px] text-text-muted">
            <span>Uploading…</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-border">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${Math.min(100, uploadProgress)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default PendingAttachmentPreview;
