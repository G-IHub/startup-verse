import React, { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Badge } from "../ui/badge";
import * as orgApi from "../../utils/api/organizationApi";
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
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(value);
  }
}

export default function ProgramCommunicationPanel({
  cohortIds = [],
  memberships = [],
}) {
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
            const announcements = await orgApi.getCohortAnnouncements(cohortId);
            return (announcements || []).map((row) => ({
              ...row,
              id: row.id || row._id,
              cohortId,
              programName:
                nameByCohort.get(String(cohortId))?.program || "Program",
              orgName: nameByCohort.get(String(cohortId))?.org || "",
            }));
          }),
        );
        if (cancelled) return;
        const flat = batches.flat().sort((a, b) => {
          const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return db - da;
        });
        setItems(flat);
      } catch (err) {
        console.error("Failed to load program announcements:", err);
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
      icon={Bell}
      title="Program communication"
      description="Announcements from the organization to your program."
    >
      {loading ? (
        <p className="font-body text-sm text-text-muted">Loading announcements…</p>
      ) : items.length === 0 ? (
        <ProgramEmptyState
          icon={Bell}
          title="No announcements yet"
          description="Organization updates for your program will appear here."
        />
      ) : (
        items.map((item) => (
          <div key={item.id} className={PROGRAM_ROW}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-heading text-sm font-bold text-text-heading">
                  {item.title || "Announcement"}
                </p>
                <p className="mt-0.5 font-body text-xs text-text-muted">
                  {item.programName}
                  {item.orgName ? ` · ${item.orgName}` : ""}
                  {item.createdAt ? ` · ${formatWhen(item.createdAt)}` : ""}
                </p>
              </div>
              {item.priority ? (
                <Badge variant="secondary" className="capitalize">
                  {item.priority}
                </Badge>
              ) : null}
            </div>
            {item.body || item.content || item.message ? (
              <p className="mt-2 whitespace-pre-wrap font-body text-sm text-text-body">
                {item.body || item.content || item.message}
              </p>
            ) : null}
          </div>
        ))
      )}
    </ProgramPanelShell>
  );
}
