import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config/apiBase.js";
import { getAccessToken } from "../app/session";

async function isBackendOnline() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Background component that triggers notification cron jobs periodically.
 */
export default function NotificationCronTrigger() {
  const [backendAvailable, setBackendAvailable] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      return undefined;
    }

    let cancelled = false;

    const checkDeadlines = async () => {
      if (!backendAvailable) return;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        await fetch(`${API_BASE_URL}/cron/check-deadlines`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getAccessToken()}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
      } catch {
        // Silent fallback when backend is unavailable.
      }
    };

    const checkWeeklyReviews = async () => {
      if (!backendAvailable) return;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        await fetch(`${API_BASE_URL}/cron/check-weekly-reviews`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getAccessToken()}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
      } catch {
        // Silent fallback when backend is unavailable.
      }
    };

    const bootstrap = async () => {
      const online = await isBackendOnline();
      if (!cancelled) {
        setBackendAvailable(online);
      }
    };

    bootstrap().catch(() => {});

    const backendProbeInterval = setInterval(async () => {
      const online = await isBackendOnline();
      if (!cancelled) {
        setBackendAvailable(online);
      }
    }, 5 * 60 * 1000);

    const deadlineInterval = setInterval(checkDeadlines, 30 * 60 * 1000);
    const weeklyReviewInterval = setInterval(
      checkWeeklyReviews,
      24 * 60 * 60 * 1000,
    );

    return () => {
      cancelled = true;
      clearInterval(backendProbeInterval);
      clearInterval(deadlineInterval);
      clearInterval(weeklyReviewInterval);
    };
  }, [backendAvailable]);

  return null;
}
