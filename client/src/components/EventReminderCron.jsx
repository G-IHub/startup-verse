/**
 * Event reminder cron
 * Periodically checks for upcoming events and sends reminder notifications.
 */

import { useEffect, useRef } from "react";
import { checkAndSendEventReminders } from "../utils/eventNotifications";

export default function EventReminderCron() {
  const intervalRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("startupverse_token");
    if (!token) {
      return undefined;
    }

    checkAndSendEventReminders().catch(() => {});

    intervalRef.current = setInterval(() => {
      checkAndSendEventReminders().catch(() => {});
    }, 15 * 60 * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return null;
}
