import React from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Plus, X } from "lucide-react";

/** Matches editable task rows — use in Recommended template previews. */
export function TaskPillPreview({ index, text, compact = false }) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-full border border-primary/22 bg-primary/[0.05] py-0.5 pl-1 pr-2 shadow-sm dark:border-primary/30 dark:bg-primary/[0.08]"
      role="presentation"
    >
      <div
        className={
          compact
            ? "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[9px] font-semibold tabular-nums text-primary"
            : "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold tabular-nums text-primary"
        }
        aria-hidden
      >
        {index}
      </div>
      <span
        className={
          compact
            ? "min-w-0 flex-1 text-[9px] leading-snug text-text-body"
            : "min-w-0 flex-1 text-xs leading-snug text-text-body"
        }
      >
        {text}
      </span>
    </div>
  );
}

/**
 * One rounded row per task so lines never merge in a shared textarea.
 */
export default function MilestoneTaskFieldList({
  tasks,
  onChange,
  label = "Tasks",
  hint = "Each task has its own row. Every milestone needs at least one task with a title before you can save.",
  labelClassName = "",
  rowClassName = "",
  badgeClassName = "",
  inputClassName = "",
  removeButtonClassName = "",
  addTaskButtonClassName = "",
}) {
  const list =
    Array.isArray(tasks) && tasks.length > 0 ? tasks : [""];

  const setAt = (idx, value) => {
    const next = [...list];
    next[idx] = value;
    onChange(next);
  };

  const removeAt = (idx) => {
    if (list.length <= 1) {
      onChange([""]);
      return;
    }
    onChange(list.filter((_, i) => i !== idx));
  };

  const addRow = () => {
    onChange([...list, ""]);
  };

  return (
    <div className="space-y-2">
      <div>
        <Label className={labelClassName || "text-xs text-text-muted"}>
          {label}
        </Label>
        {hint ? (
          <p className="mt-0.5 text-[11px] leading-relaxed text-text-muted">
            {hint}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        {list.map((task, idx) => (
          <div
            key={idx}
            className={
              rowClassName ||
              "flex items-center gap-2 rounded-full border border-primary/22 bg-primary/[0.05] py-1 pl-1.5 pr-1 shadow-sm dark:border-primary/30 dark:bg-primary/[0.08]"
            }
          >
            <div
              className={
                badgeClassName ||
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold tabular-nums text-primary"
              }
              aria-hidden
            >
              {idx + 1}
            </div>
            <Input
              value={task}
              onChange={(e) => setAt(idx, e.target.value)}
              placeholder="Task description"
              className={
                inputClassName ||
                "h-9 flex-1 border-0 bg-transparent px-2 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-transparent"
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={
                removeButtonClassName ||
                "h-8 w-8 shrink-0 rounded-full p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              }
              onClick={() => removeAt(idx)}
              aria-label={`Remove task ${idx + 1}`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={
          addTaskButtonClassName ||
          "h-8 rounded-full border-primary/25 text-xs text-primary hover:bg-primary/[0.06]"
        }
        onClick={addRow}
      >
        <Plus className="mr-1 h-3.5 w-3.5" />
        Add task
      </Button>
    </div>
  );
}
