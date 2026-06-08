/**
 * Task Week Badge - Small badge component showing which week a task belongs to
 */
import React from "react";
import { Badge } from "../ui/badge";
import { Calendar } from "lucide-react";
import { cn } from "../ui/utils";
export function TaskWeekBadge({
  weekNumber,
  weekId,
  variant = "default",
  className,
}) {
  // If no week info, don't render
  if (!weekNumber && !weekId) {
    return null;
  }

  // Extract week number from weekId if not provided
  const displayWeekNumber =
    weekNumber || (weekId ? extractWeekNumber(weekId) : null);
  if (variant === "minimal") {
    return (
      <span
        className={cn(
          "text-xs text-gray-500 font-mono",
          className,
        )}
      >
        W{displayWeekNumber}
      </span>
    );
  }
  if (variant === "compact") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "text-xs px-1.5 py-0 h-5 bg-blue-50 text-blue-700 border-blue-200",
          className,
        )}
      >
        W{displayWeekNumber}
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className={cn(
        "bg-blue-50 text-blue-700 border-blue-200",
        className,
      )}
    >
      <Calendar className="size-3 mr-1" />
      {"Week "}
      {displayWeekNumber}
    </Badge>
  );
}

// Helper function to extract week number from weekId
function extractWeekNumber(weekId) {
  // Assume weekId format is "week-{timestamp}" or similar
  // This is a placeholder - adjust based on actual weekId format
  const match = weekId.match(/week-(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }

  // Alternative: extract from timestamp if weekId is "week-{timestamp}"
  const timestampMatch = weekId.match(/^week-(\d{13})$/);
  if (timestampMatch) {
    const timestamp = parseInt(timestampMatch[1], 10);
    const date = new Date(timestamp);
    // Calculate week number from start of year
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const daysSinceStartOfYear = Math.floor(
      (date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000),
    );
    return Math.ceil((daysSinceStartOfYear + 1) / 7);
  }
  return null;
}
