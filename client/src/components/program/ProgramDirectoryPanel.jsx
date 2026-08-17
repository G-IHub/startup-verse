import React, { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  ProgramEmptyState,
  ProgramPanelShell,
  PROGRAM_ROW,
} from "./ProgramPanelShell";
import * as programApi from "../../utils/api/programApi";

export default function ProgramDirectoryPanel({ enabled }) {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const data = await programApi.listListedPrograms(1);
      setPrograms(data.programs || []);
    } catch (err) {
      toast.error(err?.message || "Could not load programs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [enabled]);

  if (!enabled) return null;

  const requestJoin = async (id) => {
    try {
      await programApi.requestProgramJoin(id, "");
      toast.success("Request sent");
      load();
    } catch (err) {
      toast.error(err?.message || "Could not request to join.");
    }
  };

  return (
    <ProgramPanelShell
      icon={GraduationCap}
      title="Browse programs"
      description="Listed programs you can request to join."
    >
      {loading ? (
        <p className="font-body text-sm text-text-muted">Loading programs…</p>
      ) : programs.length === 0 ? (
        <ProgramEmptyState
          icon={GraduationCap}
          title="No listed programs"
          description="When an organization lists a program, it will appear here."
        />
      ) : (
        programs.map((row) => (
          <div key={row.id} className={PROGRAM_ROW}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-heading text-sm font-bold text-text-heading">
                  {row.name}
                </p>
                <p className="font-body text-xs text-text-muted">
                  {row.organizationName}
                </p>
              </div>
              {row.member ? (
                <Badge>Member</Badge>
              ) : row.pending ? (
                <Badge variant="secondary">Pending</Badge>
              ) : (
                <Button size="sm" onClick={() => requestJoin(row.id)}>
                  Request to join
                </Button>
              )}
            </div>
            {row.description ? (
              <p className="mt-2 font-body text-sm text-text-body">
                {row.description}
              </p>
            ) : null}
          </div>
        ))
      )}
    </ProgramPanelShell>
  );
}
