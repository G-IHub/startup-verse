import React from "react";
import { Image as ImageIcon, Link2, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { resolveMediaUrl } from "../../utils/resolveMediaUrl";

const PANEL =
  "rounded-card border border-surface-border bg-surface-card shadow-soft";

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatLinkLabel(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Open link";
  }
}

export default function ExtraWorkTodayPanel({
  logs = [],
  onLog,
  onEdit,
  onDelete,
  onOpen,
}) {
  return (
    <div className={PANEL}>
      <div className="space-y-3 px-4 py-4 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-heading text-[16px] font-bold text-text-heading">
              Extra work today
            </h3>
            <p className="mt-1 font-body text-[13px] text-text-body">
              Work that was not on the founder&apos;s task list.
            </p>
          </div>
          {logs.length > 0 ? (
            <Button
              size="sm"
              className="rounded-input bg-primary px-3 text-[13px] font-semibold text-white shadow-soft hover:bg-primary-hover"
              onClick={onLog}
            >
              <Plus className="mr-1 h-4 w-4" />
              Log another
            </Button>
          ) : null}
        </div>

        {logs.length === 0 ? (
          <div className="flex min-h-[180px] flex-col items-center justify-center rounded-input bg-surface-page px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-tint text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="mt-3 font-heading text-[15px] font-bold text-text-heading">
              Nothing extra yet
            </p>
            <p className="mt-1 max-w-sm font-body text-[13px] text-text-muted">
              Finished something that was not assigned? Log it so your founder can see it.
            </p>
            <Button
              className="mt-4 h-10 rounded-input bg-primary px-4 font-body text-[14px] font-semibold text-white shadow-soft hover:bg-primary-hover"
              onClick={onLog}
            >
              Log extra work
            </Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {logs.map((log) => {
              const thumb = log.image?.url ? resolveMediaUrl(log.image.url) : "";
              return (
                <li
                  key={log.id}
                  className="rounded-input border border-surface-border/80 bg-surface-page p-3"
                >
                  <div className="flex gap-3">
                    {thumb ? (
                      <button
                        type="button"
                        onClick={() => onOpen?.(log)}
                        className="h-14 w-14 shrink-0 overflow-hidden rounded-input"
                      >
                        <img src={thumb} alt="" className="h-full w-full object-cover" />
                      </button>
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-input bg-primary-tint text-primary">
                        <ImageIcon className="h-4 w-4 opacity-40" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => onOpen?.(log)}
                        className="block w-full text-left"
                      >
                        <p className="font-heading text-[14px] font-semibold text-text-heading">
                          {log.title}
                        </p>
                        <p className="mt-0.5 line-clamp-2 font-body text-[12px] text-text-muted">
                          {log.description}
                        </p>
                      </button>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span className="font-body text-[11px] text-text-muted">
                          {formatTime(log.createdAt)}
                        </span>
                        {log.linkUrl ? (
                          <a
                            href={log.linkUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-pill bg-primary-tint px-2 py-0.5 font-body text-[11px] font-semibold text-primary"
                          >
                            <Link2 className="h-3 w-3" />
                            {formatLinkLabel(log.linkUrl)}
                          </a>
                        ) : null}
                      </div>
                    </div>
                    {log.editable ? (
                      <div className="flex shrink-0 flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-text-muted hover:text-primary"
                          onClick={() => onEdit?.(log)}
                          aria-label="Edit extra work"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-text-muted hover:text-status-error"
                          onClick={() => onDelete?.(log)}
                          aria-label="Delete extra work"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
