import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Flag, ListChecks } from "lucide-react";
import { cn } from "../ui/utils";
import { buildOfficePath } from "../../app/deepLinks";
import {
  MentionIconBox,
  MentionMetaRow,
  MentionMetaText,
  MentionPriorityBadge,
  MentionStatusBadge,
  MentionTypeLabel,
  mentionCardClass,
} from "./mentionUi";

function MentionCard({ icon, typeLabel, title, meta, context, onClick, isMe }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(mentionCardClass(isMe), "flex items-center gap-3")}
    >
      <MentionIconBox icon={icon} tone={isMe ? "primary" : "primary"} />
      <div className="min-w-0 flex-1">
        <MentionTypeLabel>{typeLabel}</MentionTypeLabel>
        <h3 className="mt-1 truncate font-body text-sm font-semibold leading-snug text-slate-950">
          {title}
        </h3>
        {meta ? <div className="mt-2.5">{meta}</div> : null}
        {context ? (
          <div className="mt-1.5 truncate font-body text-[11px] text-slate-500">
            {context}
          </div>
        ) : null}
      </div>
      <ChevronRight
        className={cn(
          "h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5",
          isMe ? "text-text-muted/60" : "text-text-muted/50",
        )}
        aria-hidden="true"
      />
    </button>
  );
}

export function MessageMentionCards({ message, isMe = false }) {
  const navigate = useNavigate();
  const mentions = Array.isArray(message?.metadata?.mentions)
    ? message.metadata.mentions
    : [];
  if (mentions.length === 0) return null;

  const openOffice = (path) => {
    navigate(path);
  };

  return (
    <div className="w-full space-y-2">
      {mentions.map((mention) => {
        const snapshot = mention?.snapshot && typeof mention.snapshot === "object"
          ? mention.snapshot
          : {};
        const title = String(snapshot.title || mention.label || "Mention");
        const key = `${mention.type}-${mention.id}`;

        if (mention.type === "milestone") {
          return (
            <MentionCard
              key={key}
              icon={Flag}
              typeLabel="Milestone"
              title={title}
              isMe={isMe}
              onClick={() => openOffice(buildOfficePath({ tab: "tasks" }))}
              meta={
                <MentionMetaRow
                  items={[
                    <MentionStatusBadge key="status" value={snapshot.status} compact />,
                    <MentionMetaText key="count" muted>
                      {Number(snapshot.totalTasks || 0)} task
                      {Number(snapshot.totalTasks || 0) === 1 ? "" : "s"}
                    </MentionMetaText>,
                  ]}
                />
              }
            />
          );
        }

        if (mention.type === "task") {
          return (
            <MentionCard
              key={key}
              icon={ListChecks}
              typeLabel="Task"
              title={title}
              isMe={isMe}
              onClick={() =>
                openOffice(buildOfficePath({ tab: "tasks", taskId: mention.id }))
              }
              meta={
                <MentionMetaRow
                  items={[
                    <MentionStatusBadge key="status" value={snapshot.status} compact />,
                    <MentionPriorityBadge key="priority" value={snapshot.priority} compact />,
                    <MentionMetaText key="assignee" muted>
                      {snapshot.assignedToName || "Unassigned"}
                    </MentionMetaText>,
                  ]}
                />
              }
              context={snapshot.milestoneName ? `In ${snapshot.milestoneName}` : ""}
            />
          );
        }

        return null;
      })}
    </div>
  );
}

export default MessageMentionCards;
