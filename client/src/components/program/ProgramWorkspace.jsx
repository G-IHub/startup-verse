import React, { useCallback, useEffect, useMemo, useState } from "react";
import { GraduationCap, Inbox } from "lucide-react";
import { Button } from "../ui/button";
import { normalizeProgramTab } from "../../app/dashboardPaths";
import { getFounderId, getStartupId } from "../../utils/startupId";
import { openNotificationHub } from "../../utils/inboxNormalize";
import * as orgApi from "../../utils/api/organizationApi";
import { getUpcomingAgenda } from "../../utils/api/agendaApi";
import ProgramOverviewPanel from "./ProgramOverviewPanel";
import ProgramMilestonesPanel from "./ProgramMilestonesPanel";
import ProgramEventsPanel from "./ProgramEventsPanel";
import ProgramCommunicationPanel from "./ProgramCommunicationPanel";
import ProgramMentorsPanel from "./ProgramMentorsPanel";
import ProgramDeliverablesPanel from "./ProgramDeliverablesPanel";

function JoinProgramEmpty({ onOpenInbox }) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-card border border-dashed border-surface-border bg-surface-card px-6 py-12 text-center shadow-soft">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-tint text-primary">
        <GraduationCap className="h-6 w-6" aria-hidden />
      </div>
      <h2 className="font-heading text-lg font-extrabold text-text-heading">
        You are not in a program yet
      </h2>
      <p className="mt-2 max-w-md font-body text-sm text-text-muted">
        When an organization invites your startup into a program, you will see
        membership, deliverables, milestones, events, and mentors here.
      </p>
      <Button type="button" className="mt-6" onClick={onOpenInbox}>
        <Inbox className="mr-2 h-4 w-4" aria-hidden />
        Check invitations
      </Button>
    </div>
  );
}

export default function ProgramWorkspace({
  user,
  activeTab = "overview",
  onNavigate,
}) {
  const tab = normalizeProgramTab(activeTab);
  const role = String(user?.role || "");
  const userId = String(user?._id ?? user?.id ?? "");
  const startupId = getStartupId(user);
  const founderId = getFounderId(user);

  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [upcoming, setUpcoming] = useState([]);

  const loadMemberships = useCallback(async () => {
    if (!userId) {
      setMemberships([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const isFounder = role === "founder";
      const result = isFounder
        ? await orgApi.getFounderMemberships(userId)
        : await orgApi.getStartupMemberships(startupId || founderId || userId);
      const list = Array.isArray(result?.memberships) ? result.memberships : [];
      setMemberships(list);
    } catch (err) {
      console.error("Failed to load program memberships:", err);
      setError("Could not load your program membership.");
      setMemberships([]);
    } finally {
      setLoading(false);
    }
  }, [userId, role, startupId, founderId]);

  useEffect(() => {
    loadMemberships();
  }, [loadMemberships]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!userId) return;
      const result = await getUpcomingAgenda(userId, 21);
      if (cancelled) return;
      const items = Array.isArray(result?.agenda) ? result.agenda : [];
      setUpcoming(items.slice(0, 5));
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, memberships.length]);

  const primary = memberships[0] || null;
  const cohortIds = useMemo(
    () =>
      [
        ...new Set(
          memberships
            .map((m) => String(m.cohortId || m.cohort?.id || ""))
            .filter(Boolean),
        ),
      ],
    [memberships],
  );

  const effectiveFounderId = String(primary?.founderId || founderId || userId);

  const openInbox = () => {
    openNotificationHub({ open: true });
    onNavigate?.("dashboard");
  };

  const hasMembership = memberships.length > 0;

  const renderActivePanel = () => {
    switch (tab) {
      case "deliverables":
        return <ProgramDeliverablesPanel founderId={effectiveFounderId} />;
      case "milestones":
        return (
          <ProgramMilestonesPanel
            cohortIds={cohortIds}
            memberships={memberships}
          />
        );
      case "events":
        return (
          <ProgramEventsPanel cohortIds={cohortIds} memberships={memberships} />
        );
      case "mentors":
        return (
          <ProgramMentorsPanel
            founderId={effectiveFounderId}
            onNavigate={onNavigate}
          />
        );
      case "communication":
        return (
          <ProgramCommunicationPanel
            cohortIds={cohortIds}
            memberships={memberships}
          />
        );
      case "overview":
      default:
        return (
          <ProgramOverviewPanel
            memberships={memberships}
            upcoming={upcoming}
          />
        );
    }
  };

  return (
    <div className="min-h-full bg-surface-page font-body">
      <div className="mx-auto w-full max-w-6xl space-y-5 py-5 md:py-6">
        {primary ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-pill border border-surface-border bg-surface-card px-2.5 py-0.5 font-body text-xs font-medium text-text-body shadow-soft">
              {primary.cohort?.name || "Program"}
            </span>
            {primary.organization?.name ? (
              <span className="inline-flex items-center rounded-pill bg-primary-tint px-2.5 py-0.5 font-body text-xs font-semibold text-primary">
                Assigned by {primary.organization.name}
              </span>
            ) : null}
            {memberships.length > 1
              ? memberships.slice(1).map((m) => (
                  <span
                    key={m.id || m.cohortId}
                    className="inline-flex items-center rounded-pill border border-surface-border bg-surface-card px-2.5 py-0.5 font-body text-xs font-medium text-text-muted shadow-soft"
                  >
                    {m.cohort?.name || "Program"}
                  </span>
                ))
              : null}
          </div>
        ) : null}

        {loading ? (
          <div className="flex min-h-[240px] items-center justify-center">
            <div className="space-y-2 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
              <p className="font-body text-sm text-text-muted">Loading program…</p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-card border border-status-error/30 bg-status-error/5 px-4 py-6 text-center shadow-soft">
            <p className="font-body text-sm text-status-error">{error}</p>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={loadMemberships}
            >
              Retry
            </Button>
          </div>
        ) : !hasMembership ? (
          <JoinProgramEmpty onOpenInbox={openInbox} />
        ) : (
          renderActivePanel()
        )}
      </div>
    </div>
  );
}
