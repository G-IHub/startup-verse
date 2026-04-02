// Hook to automatically trigger notifications for task events
import { useNotifications } from "../contexts/NotificationContext";
import {
  createTaskAssignedNotification,
  createTaskCompletedNotification,
  createTaskBlockedNotification,
} from "../utils/notificationHelpers";

export function useTaskNotifications() {
  const { addNotification } = useNotifications();

  const notifyTaskAssigned = (task, assignedBy) => {
    if (!task.assignedToName) return;

    addNotification(
      createTaskAssignedNotification(
        task.title,
        assignedBy,
        task.assignedToName,
      ),
    );
  };

  const notifyTaskCompleted = (task, completedBy) => {
    addNotification(
      createTaskCompletedNotification(
        task.title,
        completedBy || task.assignedToName || "Someone",
      ),
    );
  };

  const notifyTaskBlocked = (task, blockedBy, reason) => {
    addNotification(
      createTaskBlockedNotification(
        task.title,
        blockedBy,
        reason || task.blockerNote,
      ),
    );
  };

  return {
    notifyTaskAssigned,
    notifyTaskCompleted,
    notifyTaskBlocked,
  };
}
