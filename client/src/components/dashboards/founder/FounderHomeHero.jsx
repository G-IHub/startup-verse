import React from "react";
import { Eye, PlayCircle, Rocket, Users } from "lucide-react";
import { cn } from "../../ui/utils";

/**
 * Compact content greeting — not an AppLayout-scale page title.
 * State-aware primary CTA for the weekly execution loop.
 */
export default function FounderHomeHero({
  firstName,
  startupName,
  founderNeedsLaunch,
  founderLaunchLoading,
  hasActiveOutcome,
  onLaunch,
  onSetOutcome,
  onViewTasks,
  onBrowseTalent,
}) {
  const eyebrow = startupName
    ? `Building ${startupName}`
    : "Founder command center";

  let subtitle =
    "Run your weekly execution loop — launch, set outcomes, and build your team.";
  let actions = [];

  if (founderLaunchLoading) {
    subtitle = "Checking your startup profile…";
  } else if (founderNeedsLaunch) {
    subtitle =
      "Publish your startup post to unlock weekly goals and team matching.";
    actions = [
      {
        label: "Launch Startup",
        onClick: onLaunch,
        icon: Rocket,
        primary: true,
      },
    ];
  } else if (hasActiveOutcome) {
    subtitle =
      "Your week is in motion. Keep milestones moving and unblock the team.";
    actions = [
      {
        label: "View Tasks",
        onClick: onViewTasks,
        icon: Eye,
        primary: true,
      },
      {
        label: "Browse Talent",
        onClick: onBrowseTalent,
        icon: Users,
        primary: false,
      },
    ];
  } else {
    subtitle =
      "Set a clear weekly outcome to drive progress — then execute with your team.";
    actions = [
      {
        label: "Set This Week's Goal",
        onClick: onSetOutcome,
        icon: PlayCircle,
        primary: true,
      },
      {
        label: "Browse Talent",
        onClick: onBrowseTalent,
        icon: Users,
        primary: false,
      },
    ];
  }

  return (
    <section className="rounded-card border border-surface-border bg-surface-card px-4 py-4 shadow-soft md:px-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-input bg-primary-tint text-primary">
            <Rocket className="h-5 w-5" />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="font-body text-[12px] font-medium uppercase tracking-[0.06em] text-text-muted">
              {eyebrow}
            </p>
            <p className="font-heading text-[16px] font-semibold leading-tight text-text-heading md:text-[17px]">
              Welcome back, {firstName}
            </p>
            <p className="max-w-2xl font-body text-[13px] text-text-body">
              {subtitle}
            </p>
          </div>
        </div>
        {actions.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {actions.map((action) => {
              const ActionIcon = action.icon;
              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.onClick}
                  className={cn(
                    "inline-flex h-9 items-center gap-2 rounded-input px-3 font-body text-[13px] font-semibold transition-colors duration-200 ease-in-out",
                    action.primary
                      ? "bg-primary text-white hover:bg-primary-hover"
                      : "border border-surface-border bg-white text-primary hover:bg-primary-tint",
                  )}
                >
                  {ActionIcon ? <ActionIcon className="h-4 w-4" /> : null}
                  {action.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
