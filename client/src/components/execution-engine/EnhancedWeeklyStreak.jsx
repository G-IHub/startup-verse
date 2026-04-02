import React, { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { motion, AnimatePresence } from "motion/react";
import {
  Flame,
  TrendingUp,
  Info,
  AlertTriangle,
  Clock,
  Trophy,
  Zap,
  Award,
  Target,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
export default function EnhancedWeeklyStreak({
  streak,
  hasPartialWeeks = false,
  currentStage,
  weekProgress,
  daysLeftInWeek = 7,
  onViewLeaderboard,
  isStreakAtRisk = false,
}) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [previousStreak, setPreviousStreak] = useState(streak);

  // Detect streak increase for celebration
  useEffect(() => {
    if (streak > previousStreak && streak > 0) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
    setPreviousStreak(streak);
  }, [streak, previousStreak]);
  const getStreakColor = () => {
    if (streak === 0) return "text-muted-foreground";
    if (hasPartialWeeks) return "text-yellow-600";
    if (streak >= 10) return "text-purple-600"; // Elite
    if (streak >= 5) return "text-red-600"; // Hot
    return "text-orange-600"; // Building
  };
  const getStreakBgColor = () => {
    if (streak === 0) return "bg-muted/30";
    if (hasPartialWeeks) return "bg-yellow-50 dark:bg-yellow-950/20";
    if (streak >= 10) return "bg-purple-50 dark:bg-purple-950/20"; // Elite
    if (streak >= 5) return "bg-red-50 dark:bg-red-950/20"; // Hot
    return "bg-orange-50 dark:bg-orange-950/20"; // Building
  };
  const getStreakIcon = () => {
    if (streak === 0)
      return <Target className="w-5 h-5 text-muted-foreground" />;
    if (streak >= 10) return <Trophy className="w-5 h-5 text-purple-600" />;
    if (streak >= 5) return <Award className="w-5 h-5 text-red-600" />;
    if (hasPartialWeeks) return <Flame className="w-5 h-5 text-yellow-600" />;
    return <Flame className="w-5 h-5 text-orange-600" />;
  };
  const getStreakMessage = () => {
    if (streak === 0) return "Start your first streak this week";
    if (streak === 1) return "Great start! Keep it going 🚀";
    if (streak === 2) return "Building momentum! 💪";
    if (streak === 3) return "3 weeks! You're on fire 🔥";
    if (streak === 4) return "4 weeks strong! Unstoppable ⚡";
    if (streak === 5) return "5 weeks! Elite execution 🏆";
    if (streak >= 10) return `${streak} weeks! LEGENDARY 👑`;
    return `${streak} weeks of excellence! 🔥`;
  };
  const getStreakTier = () => {
    if (streak === 0) return null;
    if (streak >= 12)
      return {
        name: "LEGENDARY",
        color: "text-purple-600",
        icon: Trophy,
      };
    if (streak >= 8)
      return {
        name: "ELITE",
        color: "text-red-600",
        icon: Award,
      };
    if (streak >= 4)
      return {
        name: "STRONG",
        color: "text-orange-600",
        icon: Zap,
      };
    if (streak >= 2)
      return {
        name: "BUILDING",
        color: "text-blue-600",
        icon: TrendingUp,
      };
    return {
      name: "STARTER",
      color: "text-green-600",
      icon: Flame,
    };
  };
  const tier = getStreakTier();

  // Calculate urgency level
  const isUrgent = weekProgress < 50 && daysLeftInWeek <= 3;
  const isCritical = weekProgress < 30 && daysLeftInWeek <= 2;
  return (
    <TooltipProvider>
      <Card
        className={`border-2 transition-all ${isCritical ? "border-red-500 shadow-lg shadow-red-500/20" : isUrgent ? "border-yellow-500 shadow-lg shadow-yellow-500/20" : streak >= 5 ? "border-primary shadow-lg shadow-primary/20" : "border-border"}`}
      >
        <div className="p-3 relative overflow-hidden">
          {streak >= 5 && (
            <motion.div
              className="absolute inset-0 opacity-10"
              style={{
                background: `linear-gradient(135deg, ${streak >= 10 ? "#9333ea" : streak >= 5 ? "#dc2626" : "#f97316"} 0%, transparent 100%)`,
              }}
              animate={{
                opacity: [0.1, 0.15, 0.1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
          <AnimatePresence>
            {showCelebration && (
              <motion.div
                className="absolute inset-0 pointer-events-none z-10"
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                exit={{
                  opacity: 0,
                }}
              >
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      background: ["#3A5AFE", "#2ECC71", "#F59E0B", "#EF4444"][
                        i % 4
                      ],
                      left: `${20 + i * 6}%`,
                      top: "50%",
                    }}
                    animate={{
                      y: [0, -100, 100],
                      x: [0, Math.random() * 50 - 25],
                      opacity: [1, 1, 0],
                      scale: [0, 1, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      delay: i * 0.1,
                      ease: "easeOut",
                    }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-center justify-between mb-2 relative z-10">
            <div className="flex items-center gap-2">
              <motion.div
                animate={
                  streak > 0
                    ? {
                        scale: [1, 1.2, 1],
                        rotate: [0, 5, -5, 0],
                      }
                    : {}
                }
                transition={{
                  duration: 2,
                  repeat: streak >= 3 ? Infinity : 0,
                  repeatDelay: 1,
                }}
              >
                {getStreakIcon()}
              </motion.div>
              <span className="font-semibold text-xs">
                Weekly Outcome Streak
              </span>
              {tier && (
                <Badge
                  className={`text-[9px] px-1.5 py-0 h-4 ${tier.color} border-current`}
                  variant="outline"
                >
                  {tier.name}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {onViewLeaderboard && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[10px]"
                  onClick={onViewLeaderboard}
                >
                  <Trophy className="w-3 h-3 mr-1" />
                  Leaderboard
                </Button>
              )}
              <Badge
                variant="outline"
                className="text-[10px] border-primary text-primary px-1.5 py-0"
              >
                {currentStage}
              </Badge>
            </div>
          </div>
          <div className="flex items-center justify-between mb-2 relative z-10">
            <div className="flex items-baseline gap-2">
              <motion.span
                className={`text-4xl font-bold ${getStreakColor()}`}
                key={streak}
                initial={{
                  scale: 1.5,
                  opacity: 0,
                }}
                animate={{
                  scale: 1,
                  opacity: 1,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
              >
                {streak}
                {hasPartialWeeks && <span className="text-yellow-600">*</span>}
              </motion.span>
              <span className="text-sm text-muted-foreground">
                week{streak !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="relative w-14 h-14">
              <svg className="w-14 h-14 -rotate-90">
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  className="stroke-muted fill-none"
                  strokeWidth="4"
                />
                <motion.circle
                  cx="28"
                  cy="28"
                  r="24"
                  className={`fill-none ${weekProgress >= 100 ? "stroke-green-500" : weekProgress >= 70 ? "stroke-primary" : weekProgress >= 30 ? "stroke-yellow-500" : "stroke-red-500"}`}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 24}`}
                  initial={{
                    strokeDashoffset: 2 * Math.PI * 24,
                  }}
                  animate={{
                    strokeDashoffset:
                      2 * Math.PI * 24 * (1 - weekProgress / 100),
                  }}
                  transition={{
                    duration: 1,
                    ease: "easeOut",
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold">
                  {Math.round(weekProgress)}%
                </span>
              </div>
            </div>
          </div>
          <p
            className={`text-xs font-medium mb-2 ${streak === 0 ? "text-muted-foreground" : "text-foreground"} relative z-10`}
          >
            {getStreakMessage()}
          </p>
          {isStreakAtRisk && streak > 0 && weekProgress < 100 && (
            <motion.div
              className={`rounded-lg p-2 mb-2 flex items-start gap-2 ${isCritical ? "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800" : "bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800"}`}
              initial={{
                opacity: 0,
                y: -10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.2,
              }}
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                }}
              >
                {isCritical ? (
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                )}
              </motion.div>
              <div className="flex-1">
                <p
                  className={`text-[10px] font-semibold ${isCritical ? "text-red-900 dark:text-red-100" : "text-yellow-900 dark:text-yellow-100"}`}
                >
                  {isCritical
                    ? `⚠️ URGENT: ${daysLeftInWeek} day${daysLeftInWeek !== 1 ? "s" : ""} to save your ${streak}-week streak!`
                    : `🔔 ${daysLeftInWeek} day${daysLeftInWeek !== 1 ? "s" : ""} left - ${100 - Math.round(weekProgress)}% to go`}
                </p>
                <p
                  className={`text-[9px] ${isCritical ? "text-red-700 dark:text-red-300" : "text-yellow-700 dark:text-yellow-300"}`}
                >
                  Complete this week's outcome to maintain your streak
                </p>
              </div>
            </motion.div>
          )}
          {streak > 0 && weekProgress >= 100 && (
            <motion.div
              className="rounded-lg p-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 flex items-center gap-2"
              initial={{
                opacity: 0,
                scale: 0.9,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
            >
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-semibold text-green-900 dark:text-green-100">
                  Week Complete! 🎉
                </p>
                <p className="text-[9px] text-green-700 dark:text-green-300">
                  {"Ready to lock in your "}
                  {streak + 1}-week streak
                </p>
              </div>
            </motion.div>
          )}
          {[3, 5, 10, 20, 50].includes(streak) && (
            <motion.div
              className="mt-2 p-2 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200 dark:border-purple-800"
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
            >
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{
                    rotate: 360,
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <Award className="w-5 h-5 text-purple-600" />
                </motion.div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-purple-900 dark:text-purple-100">
                    {"🏆 MILESTONE ACHIEVED: "}
                    {streak}
                    {" WEEKS!"}
                  </p>
                  <p className="text-[9px] text-purple-700 dark:text-purple-300">
                    {streak === 3 && "You're in the top 25% of founders!"}
                    {streak === 5 && "Elite execution - top 10% of all users!"}
                    {streak === 10 && "LEGENDARY status - top 3% globally!"}
                    {streak === 20 && "UNSTOPPABLE - top 1% worldwide!"}
                    {streak === 50 && "MYTHIC ACHIEVEMENT - Hall of Fame!"}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
          {hasPartialWeeks && (
            <p className="text-[10px] text-yellow-600 dark:text-yellow-500 mt-2 pt-2 border-t relative z-10">
              * Includes weeks with partial progress
            </p>
          )}
          {streak === 0 && (
            <Tooltip>
              <TooltipTrigger asChild={true}>
                <button className="absolute top-3 right-3 focus:outline-none z-10">
                  <Info className="w-3.5 h-3.5 text-blue-600 cursor-help" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="max-w-xs bg-gray-900 border-gray-700"
              >
                <p className="text-xs text-white">
                  <strong>Build Your Streak:</strong>
                  <br />
                  Complete weekly outcomes every week to grow your streak. The
                  longer your streak, the more momentum you build! 🎯
                  <br />
                  <br />
                  <strong>Streak Tiers:</strong>
                  <br />• 1-2 weeks: Starter
                  <br />• 3-4 weeks: Building
                  <br />• 5-7 weeks: Strong
                  <br />• 8-11 weeks: Elite
                  <br />• 12+ weeks: Legendary
                </p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </Card>
    </TooltipProvider>
  );
}
