import React, { useEffect, useState } from "react";
import { GraduationCap, X } from "lucide-react";
import { getStartupMemberships } from "../../utils/organizationHelpersBackend";

function dismissKey(startupId) {
  return `cohort-badge-dismissed:${String(startupId || "")}`;
}

/**
 * Quiet program membership line for founder home.
 */
export default function CohortMembershipBadge({ startupId, onNavigate }) {
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(Boolean(startupId));
  const [dismissed, setDismissed] = useState(() => {
    if (!startupId || typeof window === "undefined") return false;
    try {
      return sessionStorage.getItem(dismissKey(startupId)) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    let cancelled = false;

    async function loadMemberships() {
      if (!startupId) {
        setMemberships([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const membershipData = await getStartupMemberships(startupId);
        if (!cancelled) {
          setMemberships(Array.isArray(membershipData) ? membershipData : []);
        }
      } catch {
        if (!cancelled) setMemberships([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMemberships();
    return () => {
      cancelled = true;
    };
  }, [startupId]);

  const visible = memberships.filter((m) => m?.cohort && m?.organization);

  if (loading) {
    return (
      <div
        className="h-8 animate-pulse rounded-input bg-surface-page"
        aria-hidden
      />
    );
  }
  if (dismissed || visible.length === 0) return null;

  const primary = visible[0];
  const extraCount = visible.length - 1;

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(dismissKey(startupId), "1");
    } catch {
      /* ignore */
    }
  };

  const openProgram = () => {
    onNavigate?.("program", { programTab: "overview" });
  };

  return (
    <div className="flex items-center gap-2 border-t border-surface-border pt-3">
      <GraduationCap
        className="h-3.5 w-3.5 shrink-0 text-primary"
        aria-hidden
      />
      <p className="min-w-0 flex-1 truncate font-body text-[12px] text-text-muted">
        <span className="font-semibold text-text-heading">
          {primary.cohort.name}
        </span>
        <span className="text-text-muted"> · {primary.organization.name}</span>
        {extraCount > 0 ? (
          <span className="text-text-muted"> · +{extraCount} more</span>
        ) : null}
      </p>
      {typeof onNavigate === "function" ? (
        <button
          type="button"
          onClick={openProgram}
          className="shrink-0 font-body text-[12px] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Program
        </button>
      ) : null}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss program notice"
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-input text-text-muted transition-colors hover:bg-surface-page hover:text-text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}
