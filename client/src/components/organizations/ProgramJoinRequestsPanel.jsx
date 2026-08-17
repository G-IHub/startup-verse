import React, { useCallback, useEffect, useState } from "react";
import { Inbox } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { SectionCard, EmptyStateBlock, StatusBadge } from "./_primitives";
import * as programApi from "../../utils/api/programApi";

export default function ProgramJoinRequestsPanel({ organizationId, cohortId }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    if (!organizationId || !cohortId) return;
    setLoading(true);
    try {
      const data = await programApi.listProgramJoinRequests(
        organizationId,
        cohortId,
        "pending",
      );
      setRequests(data.requests || []);
    } catch (err) {
      toast.error(err?.message || "Could not load join requests.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId, cohortId]);

  useEffect(() => {
    load();
  }, [load]);

  const review = async (requestId, status) => {
    setBusyId(requestId);
    try {
      await programApi.reviewProgramJoinRequest(
        organizationId,
        cohortId,
        requestId,
        status,
      );
      toast.success(status === "accepted" ? "Startup accepted" : "Request declined");
      await load();
    } catch (err) {
      toast.error(err?.message || "Could not review that request.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <SectionCard>
      <SectionCard.Header
        title="Join requests"
        description="Founders who asked to join this listed program"
      />
      <SectionCard.Body>
        {loading ? (
          <p className="font-body text-sm text-text-muted">Loading requests…</p>
        ) : requests.length === 0 ? (
          <EmptyStateBlock
            variant="compact"
            icon={Inbox}
            title="No pending requests"
            description="When a founder requests to join, they will show up here."
          />
        ) : (
          <ul className="space-y-3">
            {requests.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-input border border-surface-border bg-white px-3 py-3"
              >
                <div className="min-w-0">
                  <p className="font-heading text-sm font-semibold text-text-heading">
                    {row.startupName || "Startup"}
                  </p>
                  <p className="font-body text-xs text-text-muted">
                    {row.founderName || "Founder"}
                  </p>
                  {row.message ? (
                    <p className="mt-1 font-body text-sm text-text-body">
                      {row.message}
                    </p>
                  ) : null}
                  <div className="mt-2">
                    <StatusBadge status="pending" label="Pending" />
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === row.id}
                    onClick={() => review(row.id, "declined")}
                  >
                    Decline
                  </Button>
                  <Button
                    size="sm"
                    disabled={busyId === row.id}
                    onClick={() => review(row.id, "accepted")}
                  >
                    Accept
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard.Body>
    </SectionCard>
  );
}
