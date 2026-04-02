import { useState, useEffect } from "react";

// Mock team members - replace with real backend data later
const MOCK_USERS = [
  {
    id: "user-1",
    name: "Sarah Chen",
    status: "active",
    activity: "working",
    cameraEnabled: true,
    lastActive: new Date(),
  },
  {
    id: "user-2",
    name: "Marcus Johnson",
    status: "in-call",
    activity: "in-call",
    cameraEnabled: true,
    lastActive: new Date(),
  },
  {
    id: "user-3",
    name: "Elena Rodriguez",
    status: "active",
    activity: "messaging",
    cameraEnabled: false,
    lastActive: new Date(),
  },
  {
    id: "user-4",
    name: "David Kim",
    status: "active",
    activity: "working",
    cameraEnabled: true,
    lastActive: new Date(),
  },
  {
    id: "user-5",
    name: "Priya Patel",
    status: "away",
    activity: "idle",
    cameraEnabled: false,
    lastActive: new Date(Date.now() - 10 * 60 * 1000), // 10 mins ago
  },
  {
    id: "user-6",
    name: "Alex Turner",
    status: "active",
    activity: "working",
    cameraEnabled: true,
    lastActive: new Date(),
  },
];

export function usePresenceSimulation() {
  const [users, setUsers] = useState(MOCK_USERS);
  const [cursors, setCursors] = useState([]);

  useEffect(() => {
    // Simulate cursor movements for active users
    const interval = setInterval(() => {
      const activeUsers = users.filter((u) => u.status === "active");

      const newCursors = activeUsers.map((user) => {
        const existing = cursors.find((c) => c.userId === user.id);

        // Natural cursor movement simulation
        const baseX = existing?.x ?? Math.random() * window.innerWidth;
        const baseY = existing?.y ?? Math.random() * window.innerHeight;

        // Small random movement
        const deltaX = (Math.random() - 0.5) * 100;
        const deltaY = (Math.random() - 0.5) * 100;

        return {
          userId: user.id,
          x: Math.max(0, Math.min(window.innerWidth - 50, baseX + deltaX)),
          y: Math.max(0, Math.min(window.innerHeight - 50, baseY + deltaY)),
          lastUpdate: Date.now(),
        };
      });

      setCursors(newCursors);
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [users]);

  // Simulate status changes
  useEffect(() => {
    const statusInterval = setInterval(() => {
      setUsers((prev) =>
        prev.map((user) => {
          // Randomly change status occasionally
          if (Math.random() < 0.1) {
            const statuses = ["active", "away", "in-call"];
            const newStatus =
              statuses[Math.floor(Math.random() * statuses.length)];
            return {
              ...user,
              status: newStatus,
              activity: newStatus === "in-call" ? "in-call" : user.activity,
            };
          }
          return user;
        }),
      );
    }, 15000); // Check every 15 seconds

    return () => clearInterval(statusInterval);
  }, []);

  return { users, cursors };
}
