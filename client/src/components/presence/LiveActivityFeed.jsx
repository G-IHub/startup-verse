import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
const USER_COLORS = [
  "#3A5AFE",
  // Primary Blue
  "#2ECC71",
  // Secondary Green
  "#9C27B0",
  // Purple
  "#FF9800",
  // Orange
  "#E91E63",
  // Pink
  "#00BCD4", // Cyan
];
export function LiveActivityFeed({ activities, showPopups = true }) {
  const [popupNotifications, setPopupNotifications] = useState([]);
  const [lastActivityId, setLastActivityId] = useState(""); // Track the most recent activity ID
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize on mount - don't show pop-ups for existing activities
  useEffect(() => {
    if (!isInitialized) {
      const firstActivityId = activities[0]?.id || "";
      console.log(
        "🎬 [LiveActivityFeed] Initializing with",
        activities.length,
        "activities, first ID:",
        firstActivityId,
      );
      setLastActivityId(firstActivityId);
      setIsInitialized(true);
    }
  }, [isInitialized, activities]);
  useEffect(() => {
    if (!showPopups || !isInitialized) {
      console.log(
        "🔇 [LiveActivityFeed] Skipping - showPopups:",
        showPopups,
        "isInitialized:",
        isInitialized,
      );
      return;
    }

    // Privacy filter - exclude private activity types from pop-ups
    const PRIVATE_ACTIVITY_TYPES = ["panel-open", "chat"]; // Don't show panel opens or direct messages

    const currentFirstId = activities[0]?.id || "";
    console.log(
      "📊 [LiveActivityFeed] Current first ID:",
      currentFirstId,
      "Previous:",
      lastActivityId,
    );

    // Check if the first activity ID changed (new activity was added)
    if (currentFirstId && currentFirstId !== lastActivityId) {
      console.log("🆕 [LiveActivityFeed] New activity detected!");

      // Collect all new activities (from start until we hit the last known ID)
      const newActivities = [];
      for (const activity of activities) {
        if (activity.id === lastActivityId) break;
        newActivities.push(activity);
      }
      console.log(
        "🔍 [LiveActivityFeed] New activities:",
        newActivities.length,
      );

      // Filter out private activities and show popup for each public activity
      const publicActivities = newActivities.filter(
        (activity) => !PRIVATE_ACTIVITY_TYPES.includes(activity.type),
      );
      console.log(
        "✅ [LiveActivityFeed]",
        publicActivities.length,
        "public activities to show",
      );
      publicActivities.forEach((activity, index) => {
        console.log("🎉 [LiveActivityFeed] Showing popup:", activity.message);
        setTimeout(() => {
          addPopupNotification(activity);
        }, index * 300); // Stagger animations
      });
      setLastActivityId(currentFirstId);
    }
  }, [activities, showPopups, isInitialized, lastActivityId]);
  const addPopupNotification = (activity) => {
    setPopupNotifications((prev) => [activity, ...prev].slice(0, 3)); // Keep last 3

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setPopupNotifications((prev) => prev.filter((n) => n.id !== activity.id));
    }, 5000);
  };
  if (!showPopups) return null;
  return (
    <div className="fixed bottom-4 left-4 z-[60] space-y-2 max-w-xs pointer-events-none">
      <AnimatePresence mode="popLayout">
        {popupNotifications.map((notification, index) => {
          // Generate consistent color based on user name
          const colorIndex =
            notification.userName
              .split("")
              .reduce((acc, char) => acc + char.charCodeAt(0), 0) %
            USER_COLORS.length;
          const userColor = USER_COLORS[colorIndex];
          return (
            <motion.div
              key={notification.id}
              initial={{
                opacity: 0,
                x: -100,
                scale: 0.8,
              }}
              animate={{
                opacity: 1,
                x: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                x: -100,
                scale: 0.8,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              className="bg-white rounded-lg shadow-xl border border-gray-200 p-3 flex items-center gap-3 backdrop-blur-sm pointer-events-auto"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0"
                style={{
                  backgroundColor: userColor,
                }}
              >
                {typeof notification.icon === "string"
                  ? notification.icon
                  : "📋"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 truncate">
                  <span className="font-medium">{notification.userName}</span>{" "}
                  <span className="text-gray-600">
                    {notification.message}
                  </span>
                </p>
                <p className="text-xs text-gray-500">
                  {getTimeAgo(notification.timestamp)}
                </p>
              </div>
              <motion.div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: userColor,
                }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [1, 0.5, 1],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                }}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
function getTimeAgo(timestamp) {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp || Date.now());
  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return "Just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
