import React, { useEffect, useState } from "react";
import { Calendar, MapPin, Video } from "lucide-react";
import { Badge } from "../ui/badge";
import * as orgApi from "../../utils/api/organizationApi";
import {
  ProgramEmptyState,
  ProgramPanelShell,
  PROGRAM_ROW,
} from "./ProgramPanelShell";

function formatRange(start, end) {
  if (!start) return "";
  try {
    const s = new Date(start);
    const startLabel = s.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    if (!end) return startLabel;
    const e = new Date(end);
    return `${startLabel} – ${e.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  } catch {
    return String(start);
  }
}

export default function ProgramEventsPanel({ cohortIds = [], memberships = [] }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const nameByCohort = new Map(
          memberships.map((m) => [
            String(m.cohortId || m.cohort?.id || ""),
            {
              program: m.cohort?.name || "Program",
              org: m.organization?.name || "",
            },
          ]),
        );
        const batches = await Promise.all(
          cohortIds.map(async (cohortId) => {
            const events = await orgApi.getCohortEvents(cohortId);
            return (events || []).map((row) => ({
              ...row,
              id: row.id || row._id,
              cohortId,
              programName:
                nameByCohort.get(String(cohortId))?.program || "Program",
              orgName: nameByCohort.get(String(cohortId))?.org || "",
              startTime: row.startTime || row.startsAt,
              endTime: row.endTime || row.endsAt,
            }));
          }),
        );
        if (cancelled) return;
        const flat = batches.flat().sort((a, b) => {
          const da = a.startTime ? new Date(a.startTime).getTime() : 0;
          const db = b.startTime ? new Date(b.startTime).getTime() : 0;
          return da - db;
        });
        setItems(flat);
      } catch (err) {
        console.error("Failed to load program events:", err);
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cohortIds.join("|"), memberships]);

  return (
    <ProgramPanelShell
      icon={Calendar}
      title="Program events"
      description="Sessions and deadlines scheduled by the organization for your cohort."
    >
      {loading ? (
        <p className="font-body text-sm text-text-muted">Loading events…</p>
      ) : items.length === 0 ? (
        <ProgramEmptyState
          icon={Calendar}
          title="No program events"
          description="Upcoming workshops, demo days, and office hours will show here."
        />
      ) : (
        items.map((event) => (
          <div key={event.id} className={PROGRAM_ROW}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-heading text-sm font-bold text-text-heading">
                  {event.title || "Event"}
                </p>
                <p className="mt-0.5 font-body text-xs text-text-muted">
                  {event.programName}
                  {event.orgName ? ` · ${event.orgName}` : ""}
                </p>
              </div>
              {event.type ? (
                <Badge variant="secondary" className="capitalize">
                  {String(event.type).replace(/-/g, " ")}
                </Badge>
              ) : null}
            </div>
            <p className="mt-2 font-body text-sm text-text-body">
              {formatRange(event.startTime, event.endTime)}
            </p>
            <div className="mt-1 flex flex-wrap gap-3 font-body text-xs text-text-muted">
              {event.isVirtual || event.meetingUrl ? (
                <span className="inline-flex items-center gap-1">
                  <Video className="h-3.5 w-3.5" aria-hidden />
                  Virtual
                </span>
              ) : null}
              {event.location ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" aria-hidden />
                  {event.location}
                </span>
              ) : null}
            </div>
            {event.meetingUrl ? (
              <a
                href={event.meetingUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block font-body text-sm font-medium text-primary hover:underline"
              >
                Open meeting link
              </a>
            ) : null}
          </div>
        ))
      )}
    </ProgramPanelShell>
  );
}
