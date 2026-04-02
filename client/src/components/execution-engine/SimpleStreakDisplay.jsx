import React from "react";
import { motion } from "motion/react";
import { Flame, TrendingUp } from "lucide-react";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
export default function SimpleStreakDisplay({
  streak,
  hasPartialWeeks,
  weekProgress,
  daysLeftInWeek,
}) {
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (weekProgress / 100) * circumference;

  // Generate unique ID for gradient using useMemo for stability
  const gradientId = React.useMemo(
    () => `streak-gradient-${Math.random().toString(36).substr(2, 9)}`,
    [],
  );

  // Determine streak color
  const getStreakColor = () => {
    if (streak === 0) return "text-muted-foreground";
    if (streak < 4) return "text-orange-500";
    if (streak < 8) return "text-orange-600";
    return "text-red-500";
  };
  const getProgressColor = () => {
    if (weekProgress < 30) return "#ef4444"; // red
    if (weekProgress < 70) return "#f59e0b"; // amber
    return "#22c55e"; // green
  };

  // Get gradient colors based on progress
  const getProgressGradient = () => {
    if (weekProgress < 30) {
      return {
        start: "#ef4444",
        end: "#f97316",
      }; // red to orange
    }
    if (weekProgress < 70) {
      return {
        start: "#f59e0b",
        end: "#fbbf24",
      }; // amber to yellow
    }
    return {
      start: "#22c55e",
      end: "#047857",
    }; // green to emerald
  };
  const gradient = getProgressGradient();
  return (
    <div className="flex-1 flex flex-col gap-2 py-2">
      <h3 className="text-[8px] md:text-[9px] font-medium text-muted-foreground uppercase tracking-wide">
        WEEKLY OUTCOME STREAK
      </h3>
      <div className="grid grid-cols-2 gap-2">
        <Card className="border shadow-none">
          <CardContent className="p-1 flex items-center justify-center min-h-[80px] md:min-h-[90px] h-full">
            <div className="flex flex-col space-y-0.5 items-center justify-center text-center w-full">
              <div className="flex items-center gap-1 md:gap-1.5">
                <motion.div
                  initial={{
                    scale: 0.8,
                    opacity: 0,
                  }}
                  animate={{
                    scale: 1,
                    opacity: 1,
                  }}
                  transition={{
                    delay: 0.3,
                    duration: 0.4,
                  }}
                >
                  <Flame
                    className={`w-5 h-5 md:w-6 md:h-6 ${getStreakColor()}`}
                  />
                </motion.div>
                <motion.div
                  className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent leading-none"
                  initial={{
                    scale: 0.5,
                    opacity: 0,
                  }}
                  animate={{
                    scale: 1,
                    opacity: 1,
                  }}
                  transition={{
                    delay: 0.4,
                    duration: 0.4,
                  }}
                >
                  {streak}
                </motion.div>
                <span className="text-xs md:text-sm text-muted-foreground font-medium leading-none">
                  {streak === 1 ? "week" : "weeks"}
                </span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="w-2 h-2 md:w-2.5 md:h-2.5 text-muted-foreground" />
                <span className="text-[8px] md:text-[9px] font-medium">
                  {weekProgress}% this week
                </span>
              </div>
              <p className="text-[7px] md:text-[8px] text-muted-foreground text-center leading-tight">
                {streak === 0
                  ? "Set & complete your first weekly outcome"
                  : daysLeftInWeek <= 2 && weekProgress < 50
                    ? `${daysLeftInWeek} days left - push to finish strong!`
                    : weekProgress >= 80
                      ? "🔥 Excellent progress this week!"
                      : "Keep the momentum going!"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-none">
          <CardContent className="p-1.5 md:p-2 flex items-center justify-center min-h-[80px] md:min-h-[90px]">
            <div className="relative flex flex-col items-center justify-center gap-1">
              <div className="relative flex items-center justify-center">
                <svg
                  width="60"
                  height="60"
                  viewBox="0 0 60 60"
                  className="transform -rotate-90 md:hidden"
                >
                  <defs>
                    <linearGradient
                      id={`${gradientId}-mobile`}
                      x1="100%"
                      y1="100%"
                      x2="0%"
                      y2="0%"
                    >
                      <stop
                        offset="0%"
                        style={{
                          stopColor: "#ef4444",
                          stopOpacity: 1,
                        }}
                      />
                      <stop
                        offset="33%"
                        style={{
                          stopColor: "#f97316",
                          stopOpacity: 1,
                        }}
                      />
                      <stop
                        offset="66%"
                        style={{
                          stopColor: "#fbbf24",
                          stopOpacity: 1,
                        }}
                      />
                      <stop
                        offset="100%"
                        style={{
                          stopColor: "#047857",
                          stopOpacity: 1,
                        }}
                      />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="30"
                    cy="30"
                    r="25"
                    stroke="#e5e7eb"
                    strokeWidth="5"
                    fill="none"
                    opacity="0.3"
                  />
                  <motion.circle
                    cx="30"
                    cy="30"
                    r="25"
                    stroke={`url(#${gradientId}-mobile)`}
                    strokeWidth="5"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 25}
                    initial={{
                      strokeDashoffset: 2 * Math.PI * 25,
                    }}
                    animate={{
                      strokeDashoffset:
                        2 * Math.PI * 25 -
                        (weekProgress / 100) * 2 * Math.PI * 25,
                    }}
                    transition={{
                      duration: 1,
                      ease: "easeOut",
                    }}
                  />
                </svg>
                <svg
                  width="80"
                  height="80"
                  viewBox="0 0 80 80"
                  className="transform -rotate-90 hidden md:block"
                >
                  <defs>
                    <linearGradient
                      id={`${gradientId}-desktop`}
                      x1="100%"
                      y1="100%"
                      x2="0%"
                      y2="0%"
                    >
                      <stop
                        offset="0%"
                        style={{
                          stopColor: "#ef4444",
                          stopOpacity: 1,
                        }}
                      />
                      <stop
                        offset="33%"
                        style={{
                          stopColor: "#f97316",
                          stopOpacity: 1,
                        }}
                      />
                      <stop
                        offset="66%"
                        style={{
                          stopColor: "#fbbf24",
                          stopOpacity: 1,
                        }}
                      />
                      <stop
                        offset="100%"
                        style={{
                          stopColor: "#047857",
                          stopOpacity: 1,
                        }}
                      />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    stroke="#e5e7eb"
                    strokeWidth="6"
                    fill="none"
                    opacity="0.3"
                  />
                  <motion.circle
                    cx="40"
                    cy="40"
                    r="35"
                    stroke={`url(#${gradientId}-desktop)`}
                    strokeWidth="6"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 35}
                    initial={{
                      strokeDashoffset: 2 * Math.PI * 35,
                    }}
                    animate={{
                      strokeDashoffset:
                        2 * Math.PI * 35 -
                        (weekProgress / 100) * 2 * Math.PI * 35,
                    }}
                    transition={{
                      duration: 1,
                      ease: "easeOut",
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    className="text-sm md:text-base font-bold text-foreground"
                    initial={{
                      scale: 0.5,
                      opacity: 0,
                    }}
                    animate={{
                      scale: 1,
                      opacity: 1,
                    }}
                    transition={{
                      delay: 0.5,
                      duration: 0.4,
                    }}
                  >
                    {weekProgress}%
                  </motion.div>
                </div>
              </div>
              {hasPartialWeeks && (
                <Badge
                  variant="secondary"
                  className="text-[7px] md:text-[8px] px-1 py-0 mt-1"
                >
                  + partial progress
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
