import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { motion } from "motion/react";
import {
  Trophy,
  Medal,
  Flame,
  TrendingUp,
  Users,
  Target,
  Crown,
} from "lucide-react";
import { getExecutionData } from "../../utils/api/coreEngineApi";
import { getStartupTeamMembers } from "../../utils/api/teamMemberApi";
import {
  fetchClientPreferences,
  mergeClientPreferencesPatch,
} from "../../utils/api/clientPreferencesApi";

export function StreakLeaderboard({ currentUser, onClose }) {
  const [globalLeaders, setGlobalLeaders] = useState([]);
  const [teamLeaders, setTeamLeaders] = useState([]);
  const [personalBest, setPersonalBest] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);

  const calculateWeekProgress = (outcome) => {
    if (!outcome || !outcome.milestones) return 0;
    const totalTasks = outcome.milestones.reduce(
      (sum, m) => sum + (m.totalTasks || 0),
      0,
    );
    const completedTasks = outcome.milestones.reduce(
      (sum, m) => sum + (m.tasksCompleted || 0),
      0,
    );
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  useEffect(() => {
    let cancelled = false;
    const uid = String(currentUser?.id ?? currentUser?._id ?? "");

    const loadLeaderboardData = async () => {
      if (!uid) return;
      try {
        const exec = await getExecutionData(uid);
        if (cancelled) return;
        const streak = exec.streak || 0;
        setCurrentStreak(streak);

        let prefs = {};
        try {
          prefs = await fetchClientPreferences(uid);
        } catch {
          prefs = {};
        }
        const storedPb = Number(prefs.personal_best_streak || 0);
        const pb = Math.max(storedPb, streak);
        setPersonalBest(pb);
        if (pb > storedPb) {
          try {
            await mergeClientPreferencesPatch(uid, {
              personal_best_streak: pb,
            });
          } catch {
            /* ignore */
          }
        }

        const scopeId =
          currentUser.role === "founder"
            ? uid
            : currentUser.startupId || currentUser.founderId || "";

        let memberRows = [];
        if (scopeId) {
          try {
            const members = await getStartupTeamMembers(scopeId);
            const ids = [
              ...new Set([
                uid,
                ...members.map((m) => String(m.id || m.userId || "")),
              ]),
            ].filter(Boolean);

            const entries = await Promise.all(
              ids.map(async (id) => {
                try {
                  const ed = await getExecutionData(id);
                  const memberMeta = members.find((m) => String(m.id) === id);
                  const currentOutcome = ed.currentOutcome;
                  const weekProgress = currentOutcome
                    ? calculateWeekProgress(currentOutcome)
                    : 0;
                  return {
                    userId: id,
                    userName:
                      id === uid
                        ? currentUser.name || "You"
                        : memberMeta?.name || "Unknown",
                    streak: ed.streak || 0,
                    currentWeekProgress: weekProgress,
                    role: memberMeta?.role || "",
                    companyName: memberMeta?.companyName,
                    avatar: memberMeta?.avatar,
                  };
                } catch {
                  return null;
                }
              }),
            );
            memberRows = entries
              .filter(Boolean)
              .filter((e) => e.streak > 0)
              .sort((a, b) => {
                if (b.streak !== a.streak) return b.streak - a.streak;
                return b.currentWeekProgress - a.currentWeekProgress;
              });
          } catch {
            memberRows = [];
          }
        }

        setTeamLeaders(memberRows);
        setGlobalLeaders([]);
      } catch {
        if (!cancelled) {
          setCurrentStreak(0);
          setPersonalBest(0);
          setTeamLeaders([]);
          setGlobalLeaders([]);
        }
      }
    };

    loadLeaderboardData();
    return () => {
      cancelled = true;
    };
  }, [currentUser]);
  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-600" />;
    return null;
  };
  const getRankColor = (rank) => {
    if (rank === 1)
      return "bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/30 border-yellow-300 dark:border-yellow-700";
    if (rank === 2)
      return "bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/30 dark:to-gray-800/30 border-gray-300 dark:border-gray-700";
    if (rank === 3)
      return "bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30 border-orange-300 dark:border-orange-700";
    return "";
  };
  const getStreakTier = (streak) => {
    if (streak >= 12)
      return {
        name: "LEGENDARY",
        color: "text-purple-600",
        bgColor: "bg-purple-100 dark:bg-purple-900/30",
      };
    if (streak >= 8)
      return {
        name: "ELITE",
        color: "text-red-600",
        bgColor: "bg-red-100 dark:bg-red-900/30",
      };
    if (streak >= 4)
      return {
        name: "STRONG",
        color: "text-orange-600",
        bgColor: "bg-orange-100 dark:bg-orange-900/30",
      };
    if (streak >= 2)
      return {
        name: "BUILDING",
        color: "text-blue-600",
        bgColor: "bg-blue-100 dark:bg-blue-900/30",
      };
    return {
      name: "STARTER",
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    };
  };
  const renderLeaderboardEntry = (entry, rank, isCurrentUser) => {
    const tier = getStreakTier(entry.streak);
    const isTopThree = rank <= 3;
    return (
      <motion.div
        key={entry.userId}
        initial={{
          opacity: 0,
          x: -20,
        }}
        animate={{
          opacity: 1,
          x: 0,
        }}
        transition={{
          delay: rank * 0.05,
        }}
        className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${isCurrentUser ? "bg-primary/10 border-primary shadow-md" : isTopThree ? getRankColor(rank) : "hover:bg-muted/50 border-transparent"}`}
      >
        <div className="w-8 flex items-center justify-center flex-shrink-0">
          {getRankIcon(rank) || (
            <span className="text-sm font-bold text-muted-foreground">
              #{rank}
            </span>
          )}
        </div>
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarFallback
            className={
              isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"
            }
          >
            {entry.userName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p
              className={`text-sm font-semibold truncate ${isCurrentUser ? "text-primary" : ""}`}
            >
              {entry.userName}
              {isCurrentUser && <span className="text-xs ml-1">(You)</span>}
            </p>
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
              {entry.role === "founder"
                ? "Founder"
                : entry.role === "team-member"
                  ? "Team"
                  : "Talent"}
            </Badge>
          </div>
          {entry.companyName && (
            <p className="text-xs text-muted-foreground truncate">
              {entry.companyName}
            </p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Flame className={`w-4 h-4 ${tier.color}`} />
            <span className="text-lg font-bold">{entry.streak}</span>
          </div>
          <Badge
            className={`text-[9px] px-1.5 py-0 h-4 ${tier.bgColor} ${tier.color} border-current`}
            variant="outline"
          >
            {tier.name}
          </Badge>
        </div>
        <div className="w-16 flex-shrink-0">
          <div className="text-xs text-muted-foreground mb-1">This week</div>
          <div className="relative w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={`absolute inset-y-0 left-0 rounded-full ${entry.currentWeekProgress >= 100 ? "bg-green-500" : entry.currentWeekProgress >= 70 ? "bg-primary" : entry.currentWeekProgress >= 30 ? "bg-yellow-500" : "bg-red-500"}`}
              initial={{
                width: 0,
              }}
              animate={{
                width: `${typeof entry.currentWeekProgress === "number" && !isNaN(entry.currentWeekProgress) ? entry.currentWeekProgress : 0}%`,
              }}
              transition={{
                duration: 0.5,
                delay: rank * 0.05,
              }}
            />
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {typeof entry.currentWeekProgress === "number" &&
            !isNaN(entry.currentWeekProgress)
              ? entry.currentWeekProgress
              : 0}
            %
          </div>
        </div>
      </motion.div>
    );
  };
  return (
    <Card className="shadow-xl border-2">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Streak Leaderboard
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              See who's building the strongest execution momentum
            </CardDescription>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              ×
            </Button>
          )}
        </div>
        <div className="mt-3 p-3 rounded-lg bg-gradient-to-r from-primary/10 to-purple/10 border border-primary/20">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 mb-1">
                <Flame className="w-4 h-4 text-orange-600" />
                <span className="text-2xl font-bold text-foreground">
                  {currentStreak}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Current Streak
              </p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 mb-1">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="text-2xl font-bold text-foreground">
                  {personalBest}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">Personal Best</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-2xl font-bold text-foreground">
                  {globalLeaders.findIndex((e) => e.userId === currentUser.id) +
                    1 || "-"}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">Global Rank</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <Tabs defaultValue="global" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-3">
            <TabsTrigger value="global" className="text-xs">
              <Users className="w-3.5 h-3.5 mr-1.5" />
              Global ({globalLeaders.length})
            </TabsTrigger>
            <TabsTrigger value="team" className="text-xs">
              <Target className="w-3.5 h-3.5 mr-1.5" />
              Team ({teamLeaders.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="global" className="mt-0">
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
              {globalLeaders.length === 0 ? (
                <div className="p-8 text-center">
                  <Trophy className="w-12 h-12 mx-auto mb-2 text-muted-foreground opacity-20" />
                  <p className="text-sm text-muted-foreground">
                    No active streaks yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Complete your first week to appear here!
                  </p>
                </div>
              ) : (
                globalLeaders.map((entry, index) =>
                  renderLeaderboardEntry(
                    entry,
                    index + 1,
                    entry.userId === currentUser.id,
                  ),
                )
              )}
            </div>
          </TabsContent>
          <TabsContent value="team" className="mt-0">
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
              {teamLeaders.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-12 h-12 mx-auto mb-2 text-muted-foreground opacity-20" />
                  <p className="text-sm text-muted-foreground">
                    No team streaks yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {currentUser.role === "founder"
                      ? "Invite team members to compete together!"
                      : "Complete your first week to appear here!"}
                  </p>
                </div>
              ) : (
                teamLeaders.map((entry, index) =>
                  renderLeaderboardEntry(
                    entry,
                    index + 1,
                    entry.userId === currentUser.id,
                  ),
                )
              )}
            </div>
          </TabsContent>
        </Tabs>
        <div className="mt-4 pt-3 border-t">
          <p className="text-xs font-semibold mb-2">Streak Tiers:</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              {
                min: 1,
                name: "Starter",
                color: "text-green-600",
              },
              {
                min: 2,
                name: "Building",
                color: "text-blue-600",
              },
              {
                min: 4,
                name: "Strong",
                color: "text-orange-600",
              },
              {
                min: 8,
                name: "Elite",
                color: "text-red-600",
              },
              {
                min: 12,
                name: "Legendary",
                color: "text-purple-600",
              },
            ].map((tier, i) => (
              <div key={i} className="flex flex-col items-center">
                <Flame className={`w-3.5 h-3.5 ${tier.color} mb-0.5`} />
                <span className={`text-[9px] font-semibold ${tier.color}`}>
                  {tier.name}
                </span>
                <span className="text-[8px] text-muted-foreground">
                  {tier.min}+ weeks
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
