import { motion } from "motion/react";
import { Users, Video, Phone, Zap, TrendingUp } from "lucide-react";
export function PresenceInsights({ users }) {
  const activeUsers = users.filter((u) => u.status === "active").length;
  const inCallUsers = users.filter((u) => u.activity === "in-call").length;
  const cameraOnUsers = users.filter(
    (u) => u.cameraEnabled && u.status === "active",
  ).length;
  const workingUsers = users.filter((u) => u.activity === "working").length;
  const insights = [
    {
      label: "Active",
      value: activeUsers,
      icon: <Users className="w-3 h-3" />,
      color: "#2ECC71",
    },
    {
      label: "Working",
      value: workingUsers,
      icon: <Zap className="w-3 h-3" />,
      color: "#3A5AFE",
    },
    {
      label: "In Calls",
      value: inCallUsers,
      icon: <Phone className="w-3 h-3" />,
      color: "#9B59B6",
    },
    {
      label: "Video On",
      value: cameraOnUsers,
      icon: <Video className="w-3 h-3" />,
      color: "#FF6B6B",
    },
  ];
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="fixed bottom-4 right-4 z-30 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 max-w-xs"
    >
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <h3 className="text-sm text-gray-900 dark:text-white m-0">
          Team Pulse
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {insights.map((insight, index) => (
          <motion.div
            key={insight.label}
            initial={{
              opacity: 0,
              scale: 0.8,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{
              delay: index * 0.1,
            }}
            className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2"
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-6 h-6 rounded flex items-center justify-center"
                style={{
                  backgroundColor: `${insight.color}20`,
                  color: insight.color,
                }}
              >
                {insight.icon}
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-300">
                {insight.label}
              </span>
            </div>
            <motion.div
              className="text-2xl text-gray-900 dark:text-white"
              key={insight.value}
              initial={{
                scale: 1.3,
                color: insight.color,
              }}
              animate={{
                scale: 1,
                color: "inherit",
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
              }}
            >
              {insight.value}
            </motion.div>
          </motion.div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-600 dark:text-gray-300">
            Team Energy
          </span>
          <span className="text-xs font-medium text-gray-900 dark:text-white">
            {users.length > 0
              ? Math.round((activeUsers / users.length) * 100)
              : 0}
            %
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
            initial={{
              width: 0,
            }}
            animate={{
              width: `${users.length > 0 ? (activeUsers / users.length) * 100 : 0}%`,
            }}
            transition={{
              duration: 1,
              ease: "easeOut",
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}
