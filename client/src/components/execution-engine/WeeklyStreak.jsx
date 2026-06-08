import React from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Flame, TrendingUp, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
export default function WeeklyStreak({
  streak,
  hasPartialWeeks = false,
  currentStage,
}) {
  const getStreakColor = () => {
    if (streak === 0) return "text-muted-foreground";
    if (hasPartialWeeks) return "text-yellow-600";
    return "text-orange-600";
  };
  const getStreakIcon = () => {
    if (streak === 0)
      return <TrendingUp className="w-5 h-5 text-muted-foreground" />;
    if (hasPartialWeeks) return <Flame className="w-5 h-5 text-yellow-600" />;
    return <Flame className="w-5 h-5 text-orange-600" />;
  };
  const getStreakMessage = () => {
    if (streak === 0) return "Set & complete your first weekly outcome";
    if (streak === 1) return "Great start! Keep going 🚀";
    if (streak < 4) return "Building momentum 💪";
    if (streak < 8) return "Strong execution! 🔥";
    if (streak < 12) return "Unstoppable streak! ⚡";
    return "Legendary execution! 🏆";
  };
  return (
    <Card className="border">
      <div className="p-3">
        <TooltipProvider>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {getStreakIcon()}
              <span className="font-semibold text-xs">
                Weekly Outcome Streak
              </span>
              {streak === 0 && (
                <Tooltip>
                  <TooltipTrigger asChild={true}>
                    <button className="focus:outline-none">
                      <Info className="w-3.5 h-3.5 text-blue-600 cursor-help" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="max-w-xs bg-popover text-popover-foreground border border-border"
                  >
                    <p className="text-xs text-white">
                      Complete weekly outcomes to build your streak. Each week
                      you achieve your outcome grows your momentum! 🎯
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <Badge
              variant="outline"
              className="text-[10px] border-primary text-primary px-1.5 py-0"
            >
              {currentStage}
            </Badge>
          </div>
          <div className="flex items-baseline gap-2 mb-1.5">
            <span className={`text-3xl font-bold ${getStreakColor()}`}>
              {streak}
              {hasPartialWeeks && <span className="text-yellow-600">*</span>}
            </span>
            <span className="text-sm text-muted-foreground">
              week{streak !== 1 ? "s" : ""}
            </span>
          </div>
          <p
            className={`text-xs font-medium ${streak === 0 ? "text-muted-foreground" : "text-foreground"}`}
          >
            {getStreakMessage()}
          </p>
          {hasPartialWeeks && (
            <p className="text-[10px] text-yellow-600 mt-2 pt-2 border-t">
              * Includes weeks with partial progress
            </p>
          )}
        </TooltipProvider>
      </div>
    </Card>
  );
}
