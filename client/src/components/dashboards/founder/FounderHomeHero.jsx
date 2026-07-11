import React from "react";
import { Eye, PlayCircle, Rocket, Users } from "lucide-react";
import GradientHero from "../../organizations/_primitives/GradientHero";

/**
 * State-aware welcome hero with a single primary CTA.
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
        variant: "white",
      },
    ];
  } else if (hasActiveOutcome) {
    subtitle = "Your week is in motion. Keep milestones moving and unblock the team.";
    actions = [
      {
        label: "View Tasks",
        onClick: onViewTasks,
        icon: Eye,
        variant: "white",
      },
      {
        label: "Browse Talent",
        onClick: onBrowseTalent,
        icon: Users,
        variant: "glass",
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
        variant: "white",
      },
      {
        label: "Browse Talent",
        onClick: onBrowseTalent,
        icon: Users,
        variant: "glass",
      },
    ];
  }

  return (
    <GradientHero
      icon={Rocket}
      eyebrow={eyebrow}
      title={`Welcome back, ${firstName}`}
      subtitle={subtitle}
      actions={actions}
    />
  );
}
