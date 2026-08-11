import React from "react";
import { Building2, CalendarClock, GraduationCap } from "lucide-react";
import { Badge } from "../ui/badge";
import {
  ProgramEmptyState,
  ProgramPanelShell,
  PROGRAM_ROW,
} from "./ProgramPanelShell";

function formatWhen(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(value);
  }
}

export default function ProgramOverviewPanel({
  memberships = [],
  upcoming = [],
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <ProgramPanelShell
        icon={GraduationCap}
        title="Your programs"
        description="Organizations that assigned your startup to a program."
      >
        {memberships.length === 0 ? (
          <ProgramEmptyState
            icon={GraduationCap}
            title="No programs yet"
            description="Accepted invitations will show your program membership here."
          />
        ) : (
          memberships.map((m) => (
            <div key={m.id || m.cohortId} className={PROGRAM_ROW}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-heading text-sm font-bold text-text-heading">
                    {m.cohort?.name || "Program"}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 font-body text-xs text-text-muted">
                    <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {m.organization?.name || "Organization"}
                  </p>
                </div>
                <Badge variant="secondary" className="capitalize">
                  {m.status || "active"}
                </Badge>
              </div>
              {m.cohort?.description ? (
                <p className="mt-2 line-clamp-2 font-body text-sm text-text-body">
                  {m.cohort.description}
                </p>
              ) : null}
              <p className="mt-2 font-body text-xs text-text-muted">
                Joined {formatWhen(m.joinedAt)}
              </p>
            </div>
          ))
        )}
      </ProgramPanelShell>

      <ProgramPanelShell
        icon={CalendarClock}
        title="Coming up"
        description="Next program deadlines and events."
      >
        {upcoming.length === 0 ? (
          <ProgramEmptyState
            icon={CalendarClock}
            title="Nothing upcoming"
            description="No program items in the next few weeks."
          />
        ) : (
          upcoming.map((item) => (
            <div
              key={item.id || `${item.kind}-${item.at || item.title}`}
              className={PROGRAM_ROW}
            >
              <div className="flex items-start gap-2">
                <CalendarClock
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary"
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="truncate font-heading text-sm font-semibold text-text-heading">
                    {item.title || item.name || "Program item"}
                  </p>
                  <p className="font-body text-xs text-text-muted">
                    {formatWhen(item.at || item.startTime || item.dueDate)}
                    {item.kind || item.agendaType
                      ? ` · ${item.kind || item.agendaType}`
                      : ""}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </ProgramPanelShell>
    </div>
  );
}
