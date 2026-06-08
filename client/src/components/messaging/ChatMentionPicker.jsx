import React from "react";
import { Flag, ListChecks, Loader2 } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "../ui/command";
import { cn } from "../ui/utils";
import {
  createMentionFromMilestone,
  createMentionFromTask,
} from "../../utils/chatMentions";
import {
  MentionIconBox,
  MentionMetaRow,
  MentionMetaText,
  MentionPriorityBadge,
  MentionStatusBadge,
  mentionPickerRowClass,
  mentionPickerShellClass,
} from "./mentionUi";

function PickerRow({ icon, title, meta, value, isHighlighted, onSelect }) {
  return (
    <CommandItem
      value={value}
      onSelect={onSelect}
      className={mentionPickerRowClass(isHighlighted)}
    >
      <MentionIconBox icon={icon} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-body text-sm font-medium leading-snug text-text-heading">
          {title}
        </p>
        {meta ? <div className="mt-1.5">{meta}</div> : null}
      </div>
    </CommandItem>
  );
}

export function ChatMentionPicker({
  open = false,
  query = "",
  mentionables = { milestones: [], tasks: [] },
  loading = false,
  error = "",
  highlightIndex = 0,
  onSelect,
  className,
}) {
  const milestones = mentionables.milestones || [];
  const tasks = mentionables.tasks || [];

  if (!open) return null;

  const hasResults = milestones.length > 0 || tasks.length > 0;
  const showLoading = loading && !hasResults;
  let runningIndex = 0;

  return (
    <div className={cn(mentionPickerShellClass(), className)}>
      <div className="border-b border-surface-border/70 px-3 py-2.5">
        <p className="font-body text-xs font-medium text-text-heading">
          Tag a milestone or task
        </p>
        <p className="mt-0.5 font-body text-[11px] text-text-muted">
          {showLoading
            ? "Loading available tasks and milestones..."
            : error
              ? error
              : query
                ? `Searching for "${query}"`
                : "Type to filter - use Up/Down to navigate - Enter to select"}
        </p>
      </div>

      <Command shouldFilter={false} className="bg-transparent">
        <CommandList className="max-h-72 py-1.5">
          {showLoading ? (
            <div className="flex items-center gap-2 px-4 py-8 font-body text-sm text-text-muted">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Loading tasks and milestones...</span>
            </div>
          ) : !hasResults ? (
            <CommandEmpty className="px-4 py-8 text-sm text-text-muted">
              {error || "No milestones or tasks match your search."}
            </CommandEmpty>
          ) : null}

          {milestones.length > 0 ? (
            <CommandGroup
              heading="Milestones"
              className="px-1 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-text-muted"
            >
              {milestones.map((milestone) => {
                const itemIndex = runningIndex++;
                return (
                  <PickerRow
                    key={`milestone-${milestone.id}`}
                    value={`milestone-${milestone.id}`}
                    icon={Flag}
                    title={milestone.title}
                    isHighlighted={itemIndex === highlightIndex}
                    onSelect={() => onSelect?.(createMentionFromMilestone(milestone))}
                    meta={
                      <MentionMetaRow
                        items={[
                          <MentionStatusBadge key="status" value={milestone.status} compact />,
                          <MentionMetaText key="count" muted>
                            {milestone.totalTasks} task{milestone.totalTasks === 1 ? "" : "s"}
                            {milestone.tasksCompleted > 0
                              ? ` - ${milestone.tasksCompleted} done`
                              : ""}
                          </MentionMetaText>,
                        ]}
                      />
                    }
                  />
                );
              })}
            </CommandGroup>
          ) : null}

          {tasks.length > 0 ? (
            <CommandGroup
              heading="Tasks"
              className="px-1 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-text-muted"
            >
              {tasks.map((task) => {
                const itemIndex = runningIndex++;
                return (
                  <PickerRow
                    key={`task-${task.id}`}
                    value={`task-${task.id}`}
                    icon={ListChecks}
                    title={task.title}
                    isHighlighted={itemIndex === highlightIndex}
                    onSelect={() => onSelect?.(createMentionFromTask(task))}
                    meta={
                      <MentionMetaRow
                        items={[
                          <MentionStatusBadge key="status" value={task.status} compact />,
                          <MentionPriorityBadge key="priority" value={task.priority} compact />,
                          <MentionMetaText key="assignee" muted>
                            {task.assignedToName || "Unassigned"}
                          </MentionMetaText>,
                          task.milestoneName ? (
                            <MentionMetaText key="milestone" muted>
                              {task.milestoneName}
                            </MentionMetaText>
                          ) : null,
                        ]}
                      />
                    }
                  />
                );
              })}
            </CommandGroup>
          ) : null}
        </CommandList>
      </Command>
    </div>
  );
}

export default ChatMentionPicker;
