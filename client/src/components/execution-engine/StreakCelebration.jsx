import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import {
  Trophy,
  Flame,
  Award,
  Star,
  Zap,
  TrendingUp,
  Crown,
  Sparkles,
} from "lucide-react";
export function StreakCelebration({
  isOpen,
  newStreak,
  previousStreak,
  onClose,
  onViewLeaderboard,
  onShareAchievement,
}) {
  const [showConfetti, setShowConfetti] = useState(false);
  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      // Stop confetti after 3 seconds
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  const isMilestone = [3, 5, 10, 20, 50, 100].includes(newStreak);
  const isFirstStreak = newStreak === 1;
  const streakIncrement = newStreak - previousStreak;
  const getMilestoneMessage = () => {
    if (isFirstStreak)
      return {
        title: "🎉 First Week Complete!",
        subtitle: "Your execution journey begins",
        message:
          "You've taken the first step that 73% of founders never take: finishing what you start. This is the foundation of everything that comes next.",
        tier: "STARTER",
        color: "from-green-400 to-emerald-500",
      };
    if (newStreak === 3)
      return {
        title: "🔥 3-Week Streak!",
        subtitle: "You're in elite territory",
        message:
          "Only 25% of founders make it to 3 consecutive weeks. You've proven you can execute consistently. This is where momentum becomes unstoppable.",
        tier: "BUILDING",
        color: "from-blue-400 to-cyan-500",
      };
    if (newStreak === 5)
      return {
        title: "⚡ 5-Week Streak!",
        subtitle: "Top 10% worldwide",
        message:
          "Five consecutive weeks of execution puts you in the top 10% of all startup founders. At this pace, you're 3.2x more likely to reach product-market fit.",
        tier: "STRONG",
        color: "from-orange-400 to-red-500",
      };
    if (newStreak === 10)
      return {
        title: "👑 10-Week Streak!",
        subtitle: "LEGENDARY STATUS",
        message:
          "You've entered the top 3% globally. Ten weeks of unbroken execution is the hallmark of iconic founders. This level of consistency is how billion-dollar companies are built.",
        tier: "ELITE",
        color: "from-red-500 to-pink-600",
      };
    if (newStreak === 20)
      return {
        title: "🏆 20-Week Streak!",
        subtitle: "TOP 1% - UNSTOPPABLE",
        message:
          "Twenty consecutive weeks! You're in the top 1% of all founders worldwide. YC partners would call this \"relentless execution.\" You're not just building a product—you're building a legacy.",
        tier: "LEGENDARY",
        color: "from-purple-500 to-pink-600",
      };
    if (newStreak === 50)
      return {
        title: "⚡ 50-Week Streak!",
        subtitle: "MYTHIC ACHIEVEMENT",
        message:
          "Fifty weeks of unbroken execution! You've achieved what less than 0.1% of founders ever accomplish. This is Hall of Fame territory. You ARE the case study.",
        tier: "MYTHIC",
        color: "from-yellow-400 via-orange-500 to-red-600",
      };

    // Default for other streaks
    return {
      title: `🔥 ${newStreak}-Week Streak!`,
      subtitle: "Keep the momentum going",
      message: `${newStreak} consecutive weeks of execution. You're building something special.`,
      tier: newStreak >= 8 ? "ELITE" : "STRONG",
      color:
        newStreak >= 8
          ? "from-red-400 to-pink-500"
          : "from-orange-400 to-red-500",
    };
  };
  const celebration = getMilestoneMessage();
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="fixed inset-0 z-[100] sv-modal-backdrop"
            onClick={onClose}
          />
          {showConfetti && (
            <div className="fixed inset-0 pointer-events-none z-[101]">
              {[...Array(50)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 rounded-full"
                  style={{
                    background: [
                      "#3A5AFE",
                      "#2ECC71",
                      "#F59E0B",
                      "#EF4444",
                      "#8B5CF6",
                    ][i % 5],
                    left: `${Math.random() * 100}%`,
                    top: "-20px",
                  }}
                  animate={{
                    y: [0, window.innerHeight + 50],
                    x: [0, (Math.random() - 0.5) * 200],
                    rotate: [0, Math.random() * 360],
                    opacity: [1, 1, 0],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    delay: Math.random() * 0.5,
                    ease: "easeIn",
                  }}
                />
              ))}
            </div>
          )}
          <motion.div
            initial={{
              scale: 0.5,
              opacity: 0,
              y: 50,
            }}
            animate={{
              scale: 1,
              opacity: 1,
              y: 0,
            }}
            exit={{
              scale: 0.5,
              opacity: 0,
              y: 50,
            }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
            }}
            className="fixed inset-0 flex items-center justify-center z-[102] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="w-full max-w-lg overflow-hidden rounded-[16px] border-0 shadow-modal">
              <div
                className={`relative p-8 bg-gradient-to-br ${celebration.color} text-white overflow-hidden`}
              >
                <motion.div
                  className="absolute inset-0 opacity-20"
                  animate={{
                    backgroundPosition: ["0% 0%", "100% 100%"],
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                  style={{
                    backgroundImage:
                      "radial-gradient(circle, white 1px, transparent 1px)",
                    backgroundSize: "30px 30px",
                  }}
                />
                <motion.div
                  className="relative z-10 w-24 h-24 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  {newStreak >= 20 ? (
                    <Crown className="w-12 h-12 text-white" />
                  ) : newStreak >= 10 ? (
                    <Trophy className="w-12 h-12 text-white" />
                  ) : newStreak >= 5 ? (
                    <Award className="w-12 h-12 text-white" />
                  ) : newStreak >= 3 ? (
                    <Flame className="w-12 h-12 text-white" />
                  ) : (
                    <Star className="w-12 h-12 text-white" />
                  )}
                </motion.div>
                <motion.h2
                  className="relative z-10 text-3xl font-bold text-center mb-2"
                  initial={{
                    y: 20,
                    opacity: 0,
                  }}
                  animate={{
                    y: 0,
                    opacity: 1,
                  }}
                  transition={{
                    delay: 0.2,
                  }}
                >
                  {celebration.title}
                </motion.h2>
                <motion.p
                  className="relative z-10 text-center text-white/90 font-medium"
                  initial={{
                    y: 20,
                    opacity: 0,
                  }}
                  animate={{
                    y: 0,
                    opacity: 1,
                  }}
                  transition={{
                    delay: 0.3,
                  }}
                >
                  {celebration.subtitle}
                </motion.p>
                <motion.div
                  className="relative z-10 mt-3 flex justify-center"
                  initial={{
                    scale: 0,
                  }}
                  animate={{
                    scale: 1,
                  }}
                  transition={{
                    delay: 0.4,
                    type: "spring",
                    stiffness: 500,
                    damping: 20,
                  }}
                >
                  <div className="px-4 py-1.5 bg-white/30 backdrop-blur-md rounded-full border-2 border-white/50">
                    <span className="text-sm font-bold text-white tracking-wider">
                      {celebration.tier}
                      {" TIER"}
                    </span>
                  </div>
                </motion.div>
              </div>
              <div className="p-6 space-y-4">
                <motion.p
                  className="text-center text-muted-foreground leading-relaxed"
                  initial={{
                    y: 20,
                    opacity: 0,
                  }}
                  animate={{
                    y: 0,
                    opacity: 1,
                  }}
                  transition={{
                    delay: 0.5,
                  }}
                >
                  {celebration.message}
                </motion.p>
                <motion.div
                  className="grid grid-cols-3 gap-3 p-4 bg-muted/50 rounded-lg"
                  initial={{
                    y: 20,
                    opacity: 0,
                  }}
                  animate={{
                    y: 0,
                    opacity: 1,
                  }}
                  transition={{
                    delay: 0.6,
                  }}
                >
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Flame className="w-5 h-5 text-orange-500" />
                      <span className="text-2xl font-bold">{newStreak}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Current Streak
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      <span className="text-2xl font-bold">
                        +{streakIncrement}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">This Week</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Zap className="w-5 h-5 text-blue-500" />
                      <span className="text-2xl font-bold">
                        {newStreak * 7}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Days Total</p>
                  </div>
                </motion.div>
                {isMilestone && (
                  <motion.div
                    className="p-3 bg-primary/5 border-l-4 border-primary rounded"
                    initial={{
                      x: -20,
                      opacity: 0,
                    }}
                    animate={{
                      x: 0,
                      opacity: 1,
                    }}
                    transition={{
                      delay: 0.7,
                    }}
                  >
                    <p className="text-sm italic text-foreground">
                      {newStreak === 1 &&
                        '"The secret of getting ahead is getting started." - Mark Twain'}
                      {newStreak === 3 &&
                        '"Success is the sum of small efforts repeated day in and day out." - Robert Collier'}
                      {newStreak === 5 &&
                        '"Momentum is a powerful force. Use it." - Paul Graham, Y Combinator'}
                      {newStreak === 10 &&
                        '"The way to get started is to quit talking and begin doing." - Walt Disney'}
                      {newStreak === 20 &&
                        '"Relentless execution beats brilliant strategy." - Sam Altman, OpenAI'}
                      {newStreak >= 50 &&
                        '"You are not building a startup. You are building a movement." - Reid Hoffman'}
                    </p>
                  </motion.div>
                )}
                <motion.div
                  className="flex gap-2"
                  initial={{
                    y: 20,
                    opacity: 0,
                  }}
                  animate={{
                    y: 0,
                    opacity: 1,
                  }}
                  transition={{
                    delay: 0.8,
                  }}
                >
                  {onViewLeaderboard && (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        onViewLeaderboard();
                        onClose();
                      }}
                    >
                      <Trophy className="w-4 h-4 mr-2" />
                      View Leaderboard
                    </Button>
                  )}
                  <Button className="flex-1" onClick={onClose}>
                    Continue Building
                    <Sparkles className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
                {isMilestone && onShareAchievement && (
                  <motion.div
                    initial={{
                      opacity: 0,
                    }}
                    animate={{
                      opacity: 1,
                    }}
                    transition={{
                      delay: 0.9,
                    }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => {
                        onShareAchievement();
                        onClose();
                      }}
                    >
                      Share this achievement 🎉
                    </Button>
                  </motion.div>
                )}
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
