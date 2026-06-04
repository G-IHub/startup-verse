import React from "react";
import { Forward, Trash2, X } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";

export function ChatSelectionToolbar({
  selectedCount = 0,
  onCancel,
  onDelete,
  onForward,
  deleting = false,
  className,
}) {
  return (
    <div
      className={cn(
        "flex h-12 shrink-0 items-center justify-between gap-2 border-b border-surface-border bg-white px-3 shadow-soft",
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 gap-1 px-2 font-body text-sm text-text-body"
        onClick={onCancel}
        disabled={deleting}
      >
        <X className="h-4 w-4" />
        Cancel
      </Button>
      <span className="font-body text-sm font-medium text-text-heading">
        {selectedCount} selected
      </span>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-primary"
          onClick={onForward}
          disabled={selectedCount === 0 || deleting}
          aria-label="Forward selected"
        >
          <Forward className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-destructive"
          onClick={onDelete}
          disabled={selectedCount === 0 || deleting}
          aria-label="Delete selected"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default ChatSelectionToolbar;
