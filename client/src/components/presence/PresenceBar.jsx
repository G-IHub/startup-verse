import { Video, VideoOff, Phone, MessageSquare, Pencil } from "lucide-react";
import { motion } from "motion/react";
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
export function PresenceBar({ users, onUserClick }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-white/80">Team:</span>
      {users.map((user) => {
        const color = USER_COLORS[user.id] || "#95A5A6";
        const statusColor = getStatusColor(user.status);
        return (
          <motion.div
            key={user.id}
            whileHover={{
              scale: 1.1,
            }}
            className="relative flex-shrink-0 cursor-pointer group"
            onClick={() => onUserClick?.(user.id)}
          >
            <div
              className="w-12 h-12 rounded-full overflow-hidden relative"
              style={{
                border: `2px solid ${statusColor}`,
                boxShadow: `0 0 0 4px ${statusColor}20`,
              }}
            >
              {user.cameraEnabled ? (
                <div
                  className="w-full h-full flex items-center justify-center text-white"
                  style={{
                    backgroundColor: color,
                  }}
                >
                  <Video className="w-5 h-5" />
                </div>
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-white"
                  style={{
                    backgroundColor: color,
                  }}
                >
                  <span className="text-sm">{getInitials(user.name)}</span>
                </div>
              )}
              {!user.cameraEnabled && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <VideoOff className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            <div
              className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900"
              style={{
                backgroundColor: statusColor,
              }}
            />
            {user.activity && user.activity !== "idle" && (
              <div className="absolute top-0 right-0 w-5 h-5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300">
                {getActivityIcon(user.activity)}
              </div>
            )}
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-800 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
              <div>{user.name}</div>
              <div className="text-gray-300 capitalize">{user.status}</div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
