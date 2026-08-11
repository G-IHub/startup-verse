import React, { useEffect, useState } from "react";
import { GraduationCap, ArrowRight, X } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { getStartupMemberships } from "../../utils/organizationHelpersBackend";

function dismissKey(startupId) {
  return `cohort-badge-dismissed:${String(startupId || "")}`;
}

function MembershipSkeleton() {
  return (
    <div
      className="animate-pulse rounded-input border border-surface-border/70 bg-surface-page/80 px-3 py-2.5"
      aria-hidden
    >
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 shrink-0 rounded-lg bg-surface-border/50" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-3.5 w-40 rounded bg-surface-border/50" />
          <div className="h-3 w-56 rounded bg-surface-border/40" />
        </div>
      </div>
    </div>
  );
}

/**
 * Compact program membership strip for founder home.
 * Flat, readable, and linked into the Program workspace.
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

  if (loading) return <MembershipSkeleton />;
  if (dismissed || visible.length === 0) return null;

  const primary = visible[0];
  const extraCount = visible.length - 1;
  const orgType = String(primary.organization.type || "accelerator").replace(
    /-/g,
    " ",
  );

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
    <div className="flex items-start gap-3 rounded-input border border-surface-border bg-surface-page px-3 py-2.5 sm:items-center sm:px-3.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-tint text-primary">
        <GraduationCap className="h-4 w-4" aria-hidden />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="font-heading text-sm font-semibold text-text-heading">
            {primary.cohort.name}
          </p>
          <span className="hidden text-text-muted sm:inline" aria-hidden>
            ·
          </span>
          <p className="font-body text-xs text-text-muted sm:text-sm">
            {primary.organization.name}
          </p>
          <Badge
            variant="secondary"
            className="rounded-pill border-0 bg-primary-tint px-2 py-0 font-body text-[10px] font-semibold capitalize text-primary"
          >
            {orgType}
          </Badge>
          {extraCount > 0 ? (
            <span className="font-body text-[11px] font-medium text-text-muted">
              +{extraCount} more
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 font-body text-[11px] leading-snug text-text-muted sm:text-xs">
          Your program can see execution progress to support you.
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {typeof onNavigate === "function" ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={openProgram}
            className="h-8 gap-1 rounded-input px-2 font-body text-xs font-semibold text-primary hover:bg-primary-tint"
          >
            Program
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Button>
        ) : null}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss program notice"
          className="inline-flex h-8 w-8 items-center justify-center rounded-input text-text-muted transition-colors hover:bg-surface-card hover:text-text-heading"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
