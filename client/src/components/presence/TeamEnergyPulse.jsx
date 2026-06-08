import { motion } from "motion/react";
import { Users, Video, Phone, Zap, TrendingUp, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
export function TeamEnergyPulse({ users }) {
  const activeUsers = users.filter((u) => u.status === "available").length;
  const inCallUsers = users.filter((u) => u.activity === "in-call").length;
  const cameraOnUsers = users.filter(
    (u) => u.cameraEnabled && u.status === "available",
  ).length;
  const workingUsers = users.filter((u) => u.activity === "working").length;
  const awayUsers = users.filter((u) => u.status === "away").length;

  // 🔧 FIX: Prevent NaN by checking users.length > 0
  const energyPercentage =
    users.length > 0 ? Math.round((activeUsers / users.length) * 100) : 0;

  // Determine energy level
  let energyLevel = "Low";
  let energyEmoji = "😴";
  let energyColor = "text-gray-500";
  let energyMessage = "Team is winding down";
  if (energyPercentage >= 80) {
    energyLevel = "Peak";
    energyEmoji = "🚀";
    energyColor = "text-green-600";
    energyMessage = "Everyone's crushing it!";
  } else if (energyPercentage >= 60) {
    energyLevel = "High";
    energyEmoji = "🔥";
    energyColor = "text-orange-600";
    energyMessage = "Great team momentum!";
  } else if (energyPercentage >= 40) {
    energyLevel = "Moderate";
    energyEmoji = "⚡";
    energyColor = "text-yellow-600";
    energyMessage = "Steady progress";
  }
  const metrics = [
    {
      label: "Active",
      value: activeUsers,
      icon: <Users className="w-3 h-3" />,
      color: "#64748b",
      bgColor: "bg-slate-100",
      textColor: "text-slate-700",
    },
    {
      label: "Working",
      value: workingUsers,
      icon: <Zap className="w-3 h-3" />,
      color: "#64748b",
      bgColor: "bg-slate-100",
      textColor: "text-slate-700",
    },
    {
      label: "In Calls",
      value: inCallUsers,
      icon: <Phone className="w-3 h-3" />,
      color: "#64748b",
      bgColor: "bg-slate-100",
      textColor: "text-slate-700",
    },
    {
      label: "Video On",
      value: cameraOnUsers,
      icon: <Video className="w-3 h-3" />,
      color: "#64748b",
      bgColor: "bg-slate-100",
      textColor: "text-slate-700",
    },
  ];
  return (
    <Card className="h-[300px] flex flex-col">
      <CardHeader className="pb-1.5 pt-1.5 flex-shrink-0">
        <CardTitle className="text-xs flex items-center gap-1.5">
          <Activity className="w-3 h-3 text-slate-600" />
          Team Energy & Pulse
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5 p-2 flex-1">
        <div className="text-center pb-1.5">
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
            className="text-xl mb-0.5"
          >
            {energyEmoji}
          </motion.div>
          <p className={`text-sm font-bold ${energyColor}`}>{energyLevel}</p>
          <p className="text-[9px] text-muted-foreground">{energyMessage}</p>
        </div>
        <Separator />
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-slate-600" />
            <span className="text-[10px] text-muted-foreground">
              Live Stats
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {metrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{
                  opacity: 0,
                  scale: 0.8,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                transition={{
                  delay: index * 0.05,
                }}
                className={`${metric.bgColor} rounded-md p-1.5 flex flex-col items-center justify-center gap-0.5`}
              >
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${metric.textColor}`}
                >
                  {metric.icon}
                </div>
                <div className="text-center">
                  <div className={`text-xs font-bold ${metric.textColor}`}>
                    {metric.value}
                  </div>
                  <div className="text-[8px] text-muted-foreground truncate">
                    {metric.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        <Separator />
        <div className="space-y-0.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-gray-600" />
              <span className="text-[10px] text-muted-foreground">
                Energy Level
              </span>
            </div>
            <span className={`text-[10px] font-semibold ${energyColor}`}>
              {energyPercentage}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background:
                  energyPercentage >= 80
                    ? "linear-gradient(to right, #2ECC71, #27AE60)"
                    : energyPercentage >= 60
                      ? "linear-gradient(to right, #F39C12, #E67E22)"
                      : energyPercentage >= 40
                        ? "linear-gradient(to right, #F1C40F, #F39C12)"
                        : "linear-gradient(to right, #95A5A6, #7F8C8D)",
              }}
              initial={{
                width: 0,
              }}
              animate={{
                width: `${energyPercentage}%`,
              }}
              transition={{
                duration: 1,
                ease: "easeOut",
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[9px] text-muted-foreground">
            <span>
              {activeUsers}
              {" online"}
            </span>
            <span>
              {awayUsers}
              {" away"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
