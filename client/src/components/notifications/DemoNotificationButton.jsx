import React from "react";
import { Button } from "../ui/button";
import { Sparkles } from "lucide-react";
import { useNotifications } from "../../contexts/NotificationContext";
import {
  createTaskAssignedNotification,
  createTaskCompletedNotification,
  createTaskBlockedNotification,
  createDeadlineApproachingNotification,
  createWeeklyReviewReminderNotification,
  createStreakMilestoneNotification,
  createMilestoneCompletedNotification,
  createOutcomeAchievedNotification,
} from "../../utils/notificationHelpers";
import { toast } from "sonner";
export default function DemoNotificationButton() {
  const { addNotification } = useNotifications();
  const createDemoNotifications = () => {
    // Add a variety of demo notifications with actionUrls
    setTimeout(() => {
      addNotification({
        ...createTaskAssignedNotification(
          "Build landing page wireframe",
          "Sarah Chen",
          "Alex Morgan",
          "task-demo-1",
        ),
      });
    }, 100);
    setTimeout(() => {
      addNotification({
        ...createTaskCompletedNotification(
          "Complete user research interviews",
          "Alex Morgan",
          "task-demo-2",
        ),
      });
    }, 300);
    setTimeout(() => {
      addNotification({
        ...createDeadlineApproachingNotification(
          "Finalize MVP features list",
          2,
          "task-demo-3",
        ),
      });
    }, 500);
    setTimeout(() => {
      addNotification({
        ...createTaskBlockedNotification(
          "Deploy staging environment",
          "Marcus Rodriguez",
          "Waiting for AWS credentials",
          "task-demo-4",
        ),
      });
    }, 700);
    setTimeout(() => {
      addNotification({
        ...createMilestoneCompletedNotification(
          "Customer Discovery Complete",
          "Market Validation",
        ),
        actionUrl: "/milestones/milestone-demo-1",
      });
    }, 900);
    setTimeout(() => {
      addNotification({
        ...createWeeklyReviewReminderNotification("Ship MVP to 10 Beta Users"),
        actionUrl: "/weekly-review",
      });
    }, 1100);
    setTimeout(() => {
      const streakNotif = createStreakMilestoneNotification(4);
      if (streakNotif) {
        addNotification({
          ...streakNotif,
          actionUrl: "/dashboard",
        });
      }
    }, 1300);
    setTimeout(() => {
      addNotification({
        ...createOutcomeAchievedNotification(
          "Complete Product-Market Fit Research",
          5,
        ),
        actionUrl: "/outcomes/week-demo-1",
      });
    }, 1500);
    toast.success("🔔 Created 8 demo notifications with navigation links!");
  };
  return (
    <Button
      onClick={createDemoNotifications}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Sparkles className="w-4 h-4" />
      Demo Notifications
    </Button>
  );
}
