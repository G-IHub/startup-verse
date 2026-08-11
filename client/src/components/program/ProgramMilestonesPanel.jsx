import React, { useEffect, useState } from "react";
import { Flag } from "lucide-react";
import { Badge } from "../ui/badge";
import * as orgApi from "../../utils/api/organizationApi";
import {
  ProgramEmptyState,
  ProgramPanelShell,
  PROGRAM_ROW,
} from "./ProgramPanelShell";

function formatDate(value) {
  if (!value) return "No due date";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return String(value);
  }
}

export default function ProgramMilestonesPanel({
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
            m.cohort?.name || "Program",
          ]),
        );
        const batches = await Promise.all(
          cohortIds.map(async (cohortId) => {
            const milestones = await orgApi.getProgramMilestones(cohortId);
            return (milestones || []).map((row) => ({
              ...row,
              id: row.id || row._id,
              cohortId,
              programName: nameByCohort.get(String(cohortId)) || "Program",
            }));
          }),
        );
        if (cancelled) return;
        const flat = batches.flat().sort((a, b) => {
          const da = a.dueDate
            ? new Date(a.dueDate).getTime()
            : Number.MAX_SAFE_INTEGER;
          const db = b.dueDate
            ? new Date(b.dueDate).getTime()
            : Number.MAX_SAFE_INTEGER;
          return da - db;
        });
        setItems(flat);
      } catch (err) {
        console.error("Failed to load program milestones:", err);
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
      icon={Flag}
      title="Program milestones"
      description="Checklist items and deadlines set by the organization for your program."
    >
      {loading ? (
        <p className="font-body text-sm text-text-muted">Loading milestones…</p>
      ) : items.length === 0 ? (
        <ProgramEmptyState
          icon={Flag}
          title="No program milestones yet"
          description="When the organization publishes milestones for your program, they will appear here."
        />
      ) : (
        items.map((item) => (
          <div key={item.id} className={PROGRAM_ROW}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-heading text-sm font-bold text-text-heading">
                  {item.title || "Milestone"}
                </p>
                <p className="mt-0.5 font-body text-xs text-text-muted">
                  {item.programName}
                  {item.category ? ` · ${item.category}` : ""}
                </p>
              </div>
              <Badge variant="outline">{formatDate(item.dueDate)}</Badge>
            </div>
            {item.description ? (
              <p className="mt-2 font-body text-sm text-text-body">
                {item.description}
              </p>
            ) : null}
            {Array.isArray(item.structuredMilestones) &&
            item.structuredMilestones.length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 font-body text-sm text-text-muted">
                {item.structuredMilestones.slice(0, 6).map((step, idx) => (
                  <li key={step.id || step.title || idx}>
                    {step.title || step.label || `Step ${idx + 1}`}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))
      )}
    </ProgramPanelShell>
  );
}
