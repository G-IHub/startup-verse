import { Video, VideoOff, Phone, MessageSquare, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
const USER_COLORS = {
  "user-1": "#FF6B6B",
  "user-2": "#4ECDC4",
  "user-3": "#FFE66D",
  "user-4": "#95E1D3",
  "user-5": "#C7B3E5",
  "user-6": "#FF9A76",
};
function getStatusColor(status) {
  switch (status) {
    case "active":
      return "#2ECC71";
    case "away":
      return "#F39C12";
    case "in-call":
      return "#3A5AFE";
    default:
      return "#95A5A6";
  }
}
function getActivityIcon(activity) {
  switch (activity) {
    case "in-call":
      return <Phone className="w-3 h-3" />;
    case "messaging":
      return <MessageSquare className="w-3 h-3" />;
    case "working":
      return <Pencil className="w-3 h-3" />;
    default:
      return null;
  }
}
function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
export function EnhancedPresenceBar({ users, onUserClick, currentUserId }) {
  const [hoveredUserId, setHoveredUserId] = useState(null);
  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-md">
      <div className="flex items-center justify-between gap-3 px-4 py-2 overflow-x-auto">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-gray-600 dark:text-gray-300">
            {users.filter((u) => u.status === "active").length}
            {" online"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {users.map((user, index) => {
            const color = USER_COLORS[user.id] || "#95A5A6";
            const statusColor = getStatusColor(user.status);
            const isHovered = hoveredUserId === user.id;
            return (
              <motion.div
                key={user.id}
                initial={{
                  opacity: 0,
                  scale: 0.8,
                  x: -20,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: 0,
                }}
                transition={{
                  delay: index * 0.05,
                }}
                whileHover={{
                  scale: 1.1,
                  y: -2,
                }}
                className="relative flex-shrink-0 cursor-pointer group"
                onClick={() => onUserClick?.(user.id)}
                onMouseEnter={() => setHoveredUserId(user.id)}
                onMouseLeave={() => setHoveredUserId(null)}
              >
                <div
                  className="w-10 h-10 rounded-full overflow-hidden relative transition-all duration-300"
                  style={{
                    border: `2px solid ${statusColor}`,
                    boxShadow: `0 0 0 ${isHovered ? "4px" : "2px"} ${statusColor}20, 
                             0 ${isHovered ? "4px" : "2px"} ${isHovered ? "8px" : "4px"} rgba(0,0,0,0.1)`,
                  }}
                >
                  {user.cameraEnabled ? (
                    <motion.div
                      className="w-full h-full flex items-center justify-center text-white relative overflow-hidden"
                      style={{
                        backgroundColor: color,
                      }}
                      animate={{
                        scale: user.activity === "in-call" ? [1, 1.05, 1] : 1,
                      }}
                      transition={{
                        repeat: user.activity === "in-call" ? Infinity : 0,
                        duration: 2,
                      }}
                    >
                      <div className="absolute inset-0 opacity-20">
                        <div className="w-full h-full bg-gradient-to-br from-white/30 to-transparent" />
                      </div>
                      <Video className="w-4 h-4 relative z-10" />
                      {user.activity === "in-call" && (
                        <motion.div
                          className="absolute inset-0 border-2 border-white rounded-full"
                          animate={{
                            opacity: [0.3, 0.8, 0.3],
                            scale: [1, 1.1, 1],
                          }}
                          transition={{
                            repeat: Infinity,
                            duration: 1.5,
                          }}
                        />
                      )}
                    </motion.div>
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-white"
                      style={{
                        backgroundColor: color,
                      }}
                    >
                      <span>{getInitials(user.name)}</span>
                    </div>
                  )}
                  {!user.cameraEnabled && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                      <VideoOff className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <motion.div
                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center"
                  style={{
                    backgroundColor: statusColor,
                  }}
                  animate={{
                    scale: user.status === "active" ? [1, 1.2, 1] : 1,
                  }}
                  transition={{
                    repeat: user.status === "active" ? Infinity : 0,
                    duration: 2,
                  }}
                />
                {user.activity && user.activity !== "idle" && (
                  <motion.div
                    className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 shadow-sm"
                    initial={{
                      scale: 0,
                    }}
                    animate={{
                      scale: 1,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 25,
                    }}
                  >
                    {getActivityIcon(user.activity)}
                  </motion.div>
                )}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: 10,
                        scale: 0.9,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                      }}
                      exit={{
                        opacity: 0,
                        y: 10,
                        scale: 0.9,
                      }}
                      transition={{
                        duration: 0.2,
                      }}
                      className="absolute top-full mt-3 left-0 bg-gray-900 dark:bg-gray-800 text-white px-4 py-3 rounded-xl text-xs whitespace-nowrap pointer-events-none shadow-xl z-50 min-w-[160px]"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: statusColor,
                          }}
                        />
                        <span className="font-medium">{user.name}</span>
                      </div>
                      <div className="text-gray-300 text-[10px] space-y-1">
                        <div className="capitalize flex items-center gap-1.5">
                          {getActivityIcon(user.activity)}
                          {user.activity || "idle"}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {user.cameraEnabled ? (
                            <>
                              <Video className="w-3 h-3" />
                              <span>Camera on</span>
                            </>
                          ) : (
                            <>
                              <VideoOff className="w-3 h-3" />
                              <span>Camera off</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-700">
                        <span className="text-blue-400 text-[10px]">
                          Click to message
                        </span>
                      </div>
                      <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 dark:bg-gray-800 rotate-45" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
          <motion.div
            whileHover={{
              scale: 1.05,
            }}
            className="flex-shrink-0 w-10 h-10 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <span className="text-gray-400 dark:text-gray-500 text-base">
              +
            </span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
