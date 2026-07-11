import React from "react";
import { ChevronRight, Flame, Rocket, Target } from "lucide-react";
import { Card, CardContent } from "../../ui/card";
import BrandProgress from "../../organizations/_primitives/BrandProgress";
import { cn } from "../../ui/utils";

const panelClassName =
  "rounded-card border-0 bg-white shadow-soft transition-shadow duration-200 ease-in-out hover:shadow-[0_4px_24px_rgba(58,90,254,0.08)]";

/**
 * Compact metrics rail: streak, week progress, score slot, stage chip.
 */
export default function FounderMetricsRow({
  streak = 0,
  outcomeProgress = 0,
  hasPartialWeeks = false,
  stageName,
  stageId,
  stageProgress = 0,
  stageIcon: StageIcon,
  onOpenRoadmap,
  scoreSlot,
}) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Card className={panelClassName}>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-input bg-primary-tint text-primary">
            <Flame
              className={cn(
                "h-4 w-4",
                streak === 0 ? "text-text-muted/50" : "text-status-warning",
              )}
            />
          </div>
          <div className="min-w-0">
            <p className="font-body text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
              Streak
            </p>
            <div className="mt-1 flex items-end gap-1.5">
              <span className="font-heading text-[28px] font-extrabold leading-none text-text-heading">
                {streak}
              </span>
              <span className="pb-1 font-body text-[12px] text-text-muted">
                {streak === 1 ? "week" : "weeks"}
              </span>
            </div>
            <p className="mt-1.5 font-body text-[12px] text-text-muted">
              {streak === 0 ? "Complete a week to start" : "Keep the chain going"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className={panelClassName}>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-input bg-primary-tint text-primary">
            <Target className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-body text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
              This week
            </p>
            <div className="mt-1 flex items-end gap-1.5">
              <span className="font-heading text-[28px] font-extrabold leading-none text-text-heading">
                {outcomeProgress}%
              </span>
              {hasPartialWeeks ? (
                <span className="pb-1 font-body text-[11px] font-medium text-text-muted">
                  + partial
                </span>
              ) : null}
            </div>
            <div className="mt-2">
              <BrandProgress value={outcomeProgress} className="h-1.5" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="min-w-0">{scoreSlot}</div>

      <button
        type="button"
        onClick={onOpenRoadmap}
        className={cn(
          panelClassName,
          "flex w-full items-center gap-3 p-4 text-left",
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-input bg-primary-tint text-primary">
          {StageIcon ? (
            <StageIcon className="h-4 w-4" />
          ) : (
            <Rocket className="h-4 w-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-body text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
            Stage {stageId}/6
          </p>
          <p className="mt-1 truncate font-heading text-[16px] font-bold leading-tight text-text-heading">
            {stageName}
          </p>
          <div className="mt-2">
            <BrandProgress value={stageProgress} className="h-1.5" />
          </div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-primary" />
      </button>
    </section>
  );
}
