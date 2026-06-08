import React, { useState } from "react";
import { Download, FileText, Image as ImageIcon, Video, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../ui/utils";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { resolveMediaUrl, resolveAttachmentDeliveryUrl } from "../../utils/resolveMediaUrl";
import { formatFileSize } from "../../utils/messaging";
import { inferAttachmentKind } from "../../utils/messageAttachmentUtils";
import {
  downloadAttachmentWithAuth,
  isProxiedAttachmentUrl,
} from "../../utils/downloadAttachment";
import { bubbleCaptionClass } from "./chatStyles";

function embeddedFileCardClass(isMe, embedded) {
  if (embedded) {
    return cn(
      "block w-full rounded-lg px-2.5 py-2 text-left transition-colors",
      isMe
        ? "bg-white/10 hover:bg-white/15"
        : "bg-surface-page hover:bg-primary-tint/40",
    );
  }
  return cn(
    "block w-full rounded-xl border px-3 py-2 text-left transition-shadow hover:shadow-md",
    isMe ? "border-primary/20 bg-primary-tint" : "border-surface-border bg-surface-page",
  );
}

function embeddedMediaFrameClass(isMe, embedded) {
  if (!embedded) {
    return cn(
      "overflow-hidden rounded-xl border",
      isMe ? "border-primary/20" : "border-surface-border",
    );
  }
  return cn(
    "overflow-hidden rounded-lg",
    isMe ? "ring-1 ring-white/20" : "ring-1 ring-surface-border",
  );
}

function FileCard({ attachment, isMe, embedded, className, hrefOverride }) {
  const [downloading, setDownloading] = useState(false);
  const href =
    hrefOverride ||
    resolveAttachmentDeliveryUrl(attachment.url, {
      fileName: attachment.fileName,
      fileType: attachment.fileType,
      disposition: "attachment",
    });
  const useAuthDownload = isProxiedAttachmentUrl(href);
  const kind = inferAttachmentKind(attachment.fileType, attachment.fileName);
  const Icon =
    kind === "image" ? ImageIcon : kind === "video" ? Video : FileText;

  const handleDownload = async (e) => {
    if (!useAuthDownload) return;
    e.preventDefault();
    setDownloading(true);
    try {
      await downloadAttachmentWithAuth(href, attachment.fileName || "download");
    } catch (err) {
      toast.error(err?.message || "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const classNames = cn(embeddedFileCardClass(isMe, embedded), className);

  const inner = (
    <div className="flex items-center gap-2.5">
      <div
        className={cn(
          "shrink-0 rounded-lg p-2",
          isMe ? "bg-white/15" : "bg-primary-tint",
        )}
      >
        <Icon className={cn("h-4 w-4", isMe ? "text-white" : "text-primary")} />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-xs font-medium",
            isMe ? "text-white" : "text-text-heading",
          )}
        >
          {attachment.fileName}
        </p>
        {attachment.fileSize > 0 && (
          <p className={cn("text-[10px]", isMe ? "text-white/70" : "text-text-muted")}>
            {formatFileSize(attachment.fileSize)}
          </p>
        )}
      </div>
      {downloading ? (
        <Loader2
          className={cn("h-4 w-4 shrink-0 animate-spin", isMe ? "text-white/70" : "text-text-muted")}
        />
      ) : (
        <Download
          className={cn("h-4 w-4 shrink-0", isMe ? "text-white/70" : "text-text-muted")}
        />
      )}
    </div>
  );

  if (useAuthDownload) {
    return (
      <button type="button" onClick={handleDownload} disabled={downloading} className={classNames}>
        {inner}
      </button>
    );
  }

  return (
    <a
      href={href}
      download={attachment.fileName}
      target="_blank"
      rel="noopener noreferrer"
      className={classNames}
    >
      {inner}
    </a>
  );
}

function ImageAttachment({ attachment, isMe, embedded, onOpenLightbox }) {
  const src = resolveMediaUrl(attachment.url);
  return (
    <button
      type="button"
      onClick={() => onOpenLightbox?.(src, attachment.fileName)}
      className={cn(
        "block w-full max-w-full text-left",
        embeddedMediaFrameClass(isMe, embedded),
      )}
    >
      <ImageWithFallback
        src={src}
        alt={attachment.fileName || "Image attachment"}
        className="max-h-48 w-full object-contain sm:max-h-64"
      />
    </button>
  );
}

function VideoAttachment({ attachment, isMe, embedded }) {
  const src = resolveMediaUrl(attachment.url);
  return (
    <div className={embeddedMediaFrameClass(isMe, embedded)}>
      <video
        src={src}
        controls
        playsInline
        preload="metadata"
        className="max-h-64 max-w-full bg-black"
      >
        <track kind="captions" />
      </video>
      {attachment.fileName && (
        <p
          className={cn(
            "truncate px-2 py-1 text-[10px]",
            isMe ? "text-white/70" : "text-text-muted",
          )}
        >
          {attachment.fileName}
        </p>
      )}
    </div>
  );
}

function Lightbox({ src, alt, onClose }) {
  if (!src) return null;
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <button
        type="button"
        className="absolute right-4 top-4 rounded-full bg-white/10 px-3 py-1 text-sm text-white"
        onClick={onClose}
      >
        Close
      </button>
      <img
        src={src}
        alt={alt || "Attachment preview"}
        className="max-h-[90vh] max-w-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export function MessageAttachmentBubble({
  attachments = [],
  isMe = false,
  caption = "",
  className,
  uploading = false,
  embedded = false,
}) {
  const [lightbox, setLightbox] = useState(null);
  const list = Array.isArray(attachments) ? attachments.filter((a) => a?.url) : [];

  if (uploading) {
    return (
      <div
        className={cn(
          "rounded-lg px-3 py-2 text-xs",
          isMe ? "text-white/90" : "text-text-muted",
          className,
        )}
      >
        Uploading…
      </div>
    );
  }

  if (list.length === 0 && !caption) return null;

  return (
    <>
      <div className={cn("space-y-1.5", className)}>
        {list.map((att, idx) => {
          const key = `${att.url}-${idx}`;
          const kind = inferAttachmentKind(att.fileType, att.fileName);
          if (kind === "image") {
            return (
              <ImageAttachment
                key={key}
                embedded={embedded}
                attachment={att}
                isMe={isMe}
                onOpenLightbox={(src, alt) => setLightbox({ src, alt })}
              />
            );
          }
          if (kind === "video") {
            return (
              <VideoAttachment
                key={key}
                embedded={embedded}
                attachment={att}
                isMe={isMe}
              />
            );
          }
          return (
            <FileCard key={key} embedded={embedded} attachment={att} isMe={isMe} />
          );
        })}
        {caption ? <p className={bubbleCaptionClass(isMe)}>{caption}</p> : null}
      </div>
      {lightbox ? (
        <Lightbox
          src={lightbox.src}
          alt={lightbox.alt}
          onClose={() => setLightbox(null)}
        />
      ) : null}
    </>
  );
}

export default MessageAttachmentBubble;
