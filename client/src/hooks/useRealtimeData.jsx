/**
 * Custom hooks for real-time data synchronization
 * Handles incremental updates, deduplication, and stable rendering
 */

import { useState, useEffect, useRef } from "react";
import {
  subscribeToTeamMembers,
  subscribeToTasks,
  subscribeToMessages,
  subscribeToActivities,
  subscribeToAnnouncements,
  subscribeToWins,
  subscribeToUnreadCount,
} from "../utils/realtimeSubscriptions";

/**
 * Hook for real-time team members
 * Returns stable array with incremental updates (no flicker)
 */
export function useRealtimeTeamMembers(startupId, initialMembers = []) {
  const [members, setMembers] = useState(initialMembers);
  const membersRef = useRef(new Map());

  // Initialize map from initial members
  useEffect(() => {
    const map = new Map();
    initialMembers.forEach((member) => {
      map.set(member.id, member);
    });
    membersRef.current = map;
    setMembers(initialMembers);
  }, []);

  useEffect(() => {
    if (!startupId) return;

    const unsubscribe = subscribeToTeamMembers(startupId, (update) => {
      console.log("🔄 [useRealtimeTeamMembers] Received update:", update);

      setMembers((currentMembers) => {
        const map = new Map(membersRef.current);

        if (update.action === "added" || update.action === "updated") {
          // Add or update member
          map.set(update.member.id, update.member);
        } else if (update.action === "removed") {
          // Remove member
          map.delete(update.member.id);
        }

        membersRef.current = map;
        return Array.from(map.values());
      });
    });

    return unsubscribe;
  }, [startupId]);

  return members;
}

/**
 * Hook for real-time tasks
 * Returns stable array with incremental updates
 */
export function useRealtimeTasks(startupId, initialTasks = []) {
  const [tasks, setTasks] = useState(initialTasks);
  const tasksRef = useRef(new Map());

  // Initialize map from initial tasks
  useEffect(() => {
    const map = new Map();
    initialTasks.forEach((task) => {
      map.set(task.id, task);
    });
    tasksRef.current = map;
    setTasks(initialTasks);
  }, []);

  useEffect(() => {
    if (!startupId) return;

    const unsubscribe = subscribeToTasks(startupId, (update) => {
      console.log("🔄 [useRealtimeTasks] Received update:", update);

      setTasks((currentTasks) => {
        const map = new Map(tasksRef.current);

        if (
          update.action === "created" ||
          update.action === "updated" ||
          update.action === "status_changed"
        ) {
          // Add or update task
          map.set(update.task.id, update.task);
        } else if (update.action === "deleted") {
          // Remove task
          map.delete(update.task.id);
        }

        tasksRef.current = map;
        return Array.from(map.values());
      });
    });

    return unsubscribe;
  }, [startupId]);

  return tasks;
}

/**
 * Hook for real-time activities
 * Prepends new activities to the list (most recent first)
 */
export function useRealtimeActivities(startupId, initialActivities = []) {
  const [activities, setActivities] = useState(initialActivities);

  useEffect(() => {
    setActivities(initialActivities);
  }, [JSON.stringify(initialActivities)]);

  useEffect(() => {
    if (!startupId) return;

    const unsubscribe = subscribeToActivities(startupId, (activity) => {
      console.log(
        "🔄 [useRealtimeActivities] Received new activity:",
        activity,
      );

      setActivities((currentActivities) => {
        // Check if activity already exists (prevent duplicates)
        const exists = currentActivities.some((a) => a.id === activity.id);
        if (exists) {
          return currentActivities;
        }

        // Prepend new activity
        return [activity, ...currentActivities].slice(0, 100); // Keep last 100 activities
      });
    });

    return unsubscribe;
  }, [startupId]);

  return activities;
}

/**
 * Hook for real-time announcements
 * Returns stable array with incremental updates
 */
export function useRealtimeAnnouncements(startupId, initialAnnouncements = []) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const announcementsRef = useRef(new Map());

  // Initialize map from initial announcements
  useEffect(() => {
    const map = new Map();
    initialAnnouncements.forEach((announcement) => {
      map.set(announcement.id, announcement);
    });
    announcementsRef.current = map;
    setAnnouncements(initialAnnouncements);
  }, []);

  useEffect(() => {
    if (!startupId) return;

    const unsubscribe = subscribeToAnnouncements(startupId, (update) => {
      console.log("🔄 [useRealtimeAnnouncements] Received update:", update);

      setAnnouncements((currentAnnouncements) => {
        const map = new Map(announcementsRef.current);

        if (
          update.action === "created" ||
          update.action === "updated" ||
          update.action === "reaction_added" ||
          update.action === "comment_added"
        ) {
          // Add or update announcement
          map.set(update.announcement.id, update.announcement);
        } else if (update.action === "deleted") {
          // Remove announcement
          map.delete(update.announcement.id);
        }

        announcementsRef.current = map;
        // Sort by timestamp (most recent first)
        return Array.from(map.values()).sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );
      });
    });

    return unsubscribe;
  }, [startupId]);

  return announcements;
}

/**
 * Hook for real-time Wall of Wins
 * Returns stable array with incremental updates
 */
export function useRealtimeWins(startupId, initialWins = []) {
  const [wins, setWins] = useState(initialWins);
  const winsRef = useRef(new Map());

  // Initialize map from initial wins
  useEffect(() => {
    const map = new Map();
    initialWins.forEach((win) => {
      map.set(win.id, win);
    });
    winsRef.current = map;
    setWins(initialWins);
  }, []);

  useEffect(() => {
    if (!startupId) return;

    const unsubscribe = subscribeToWins(startupId, (update) => {
      console.log("🔄 [useRealtimeWins] Received update:", update);

      setWins((currentWins) => {
        const map = new Map(winsRef.current);

        if (update.action === "created" || update.action === "updated") {
          // Add or update win
          map.set(update.win.id, update.win);
        } else if (update.action === "deleted") {
          // Remove win
          map.delete(update.win.id);
        }

        winsRef.current = map;
        // Sort by timestamp (most recent first)
        return Array.from(map.values()).sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );
      });
    });

    return unsubscribe;
  }, [startupId]);

  return wins;
}

/**
 * Hook for real-time unread message count
 * Returns a number that updates automatically
 */
export function useRealtimeUnreadCount(startupId, userId, initialCount = 0) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    if (!startupId || !userId) return;

    const unsubscribe = subscribeToUnreadCount(startupId, userId, (update) => {
      console.log("🔄 [useRealtimeUnreadCount] Received update:", update);
      setCount((prev) => {
        if (typeof update?.count === "number") return update.count;
        if (typeof update?.countDelta === "number")
          return Math.max(0, prev + update.countDelta);
        return prev;
      });
    });

    return unsubscribe;
  }, [startupId, userId]);

  return count;
}

/**
 * Hook for real-time messages in a conversation
 * Appends new messages to the list
 */
export function useRealtimeMessages(
  startupId,
  conversationId,
  initialMessages = [],
  currentUserId = "",
) {
  const [messages, setMessages] = useState(initialMessages);
  const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
    setMessages(initialMessages);
  }, [conversationId, JSON.stringify(initialMessages)]);

  useEffect(() => {
    if (!startupId) return;

    const pollContext =
      currentUserId && conversationId
        ? { userId: currentUserId, peerUserId: conversationId }
        : null;

    const unsubscribe = subscribeToMessages(
      startupId,
      (update) => {
      console.log("🔄 [useRealtimeMessages] Received update:", update);

      if (update.action === "new_message") {
        const peerMatch =
          !conversationId ||
          update.conversationId === conversationId ||
          update.fromUserId === conversationId ||
          update.toUserId === conversationId;
        if (update.message && peerMatch) {
          setMessages((currentMessages) => {
            // Check if message already exists (prevent duplicates)
            const exists = currentMessages.some(
              (m) => m.id === update.message.id,
            );
            if (exists) {
              return currentMessages;
            }
            // Append new message
            return [...currentMessages, update.message];
          });
        }
      } else if (update.action === "typing") {
        // Handle typing indicators
        if (update.userId && conversationId === update.conversationId) {
          setTypingUsers((current) => {
            if (!current.includes(update.userId)) {
              return [...current, update.userId];
            }
            return current;
          });

          // Remove typing indicator after 3 seconds
          setTimeout(() => {
            setTypingUsers((current) =>
              current.filter((id) => id !== update.userId),
            );
          }, 3000);
        }
      }
    },
      pollContext,
    );

    return unsubscribe;
  }, [startupId, conversationId, currentUserId]);

  return { messages, typingUsers };
}
