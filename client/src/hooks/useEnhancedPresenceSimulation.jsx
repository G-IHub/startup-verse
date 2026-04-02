import { useState, useEffect } from "react";

// Mock team members - replace with real backend data later
const MOCK_USERS = [
  {
    id: "user-1",
    name: "Sarah Chen",
    role: "Founder & CEO",
    status: "active",
    activity: "working",
    cameraEnabled: true,
    lastActive: new Date(),
  },
  {
    id: "user-2",
    name: "Marcus Johnson",
    role: "Backend Dev",
    status: "in-call",
    activity: "in-call",
    cameraEnabled: true,
    lastActive: new Date(),
  },
  {
    id: "user-3",
    name: "Elena Rodriguez",
    role: "Designer",
    status: "active",
    activity: "messaging",
    cameraEnabled: false,
    lastActive: new Date(),
  },
  {
    id: "user-4",
    name: "David Kim",
    role: "Frontend Dev",
    status: "active",
    activity: "working",
    cameraEnabled: true,
    lastActive: new Date(),
  },
  {
    id: "user-5",
    name: "Priya Patel",
    role: "Product Manager",
    status: "away",
    activity: "idle",
    cameraEnabled: false,
    lastActive: new Date(Date.now() - 10 * 60 * 1000), // 10 mins ago
  },
  {
    id: "user-6",
    name: "Alex Turner",
    role: "Marketing Lead",
    status: "active",
    activity: "working",
    cameraEnabled: true,
    lastActive: new Date(),
  },
];

export function useEnhancedPresenceSimulation() {
  const [users, setUsers] = useState(MOCK_USERS);
  const [cursors, setCursors] = useState([]);

  // Simulate realistic cursor movements
  useEffect(() => {
    const interval = setInterval(() => {
      const activeUsers = users.filter(
        (u) => u.status === "active" || u.status === "in-call",
      );

      const newCursors = activeUsers.map((user) => {
        const existing = cursors.find((c) => c.userId === user.id);

        // Use document dimensions instead of viewport for scrollable content
        const maxWidth = Math.max(
          document.documentElement.scrollWidth,
          document.body.scrollWidth,
          window.innerWidth,
        );
        const maxHeight = Math.max(
          document.documentElement.scrollHeight,
          document.body.scrollHeight,
          window.innerHeight,
        );

        // More natural movement patterns based on activity
        let targetX, targetY;

        if (user.activity === "messaging") {
          // Stay in bottom right area (message panel region)
          targetX = maxWidth * 0.75 + (Math.random() - 0.5) * 200;
          targetY = maxHeight * 0.5 + (Math.random() - 0.5) * 200;
        } else if (user.activity === "working") {
          // Move around center/upper areas (working on content)
          targetX = maxWidth * 0.4 + (Math.random() - 0.5) * 400;
          targetY = maxHeight * 0.35 + (Math.random() - 0.5) * 300;
        } else {
          // Random movement across entire document
          targetX = Math.random() * maxWidth;
          targetY = Math.random() * maxHeight;
        }

        // Smooth interpolation
        const baseX = existing?.x ?? targetX;
        const baseY = existing?.y ?? targetY;
        const smoothing = 0.3;

        return {
          userId: user.id,
          x: Math.max(
            0,
            Math.min(maxWidth - 50, baseX + (targetX - baseX) * smoothing),
          ),
          y: Math.max(
            0,
            Math.min(maxHeight - 50, baseY + (targetY - baseY) * smoothing),
          ),
          lastUpdate: Date.now(),
          isTyping: user.activity === "messaging" && Math.random() < 0.6, // 60% chance typing if messaging
        };
      });

      setCursors(newCursors);
    }, 1000); // Update every second for smoother movement

    return () => clearInterval(interval);
  }, [users]);

  // Simulate status and activity changes
  useEffect(() => {
    const statusInterval = setInterval(() => {
      setUsers((prev) =>
        prev.map((user) => {
          const rand = Math.random();

          // 15% chance to change activity
          if (rand < 0.15) {
            const activities = ["working", "messaging", "idle"];
            const newActivity =
              activities[Math.floor(Math.random() * activities.length)];

            return {
              ...user,
              activity: newActivity,
              lastActive: new Date(),
            };
          }

          // 5% chance to change status
          if (rand < 0.05) {
            const statuses = ["active", "away", "in-call"];
            const newStatus =
              statuses[Math.floor(Math.random() * statuses.length)];

            return {
              ...user,
              status: newStatus,
              activity: newStatus === "in-call" ? "in-call" : user.activity,
              lastActive: new Date(),
            };
          }

          // 10% chance to toggle camera
          if (rand < 0.1 && user.status === "active") {
            return {
              ...user,
              cameraEnabled: !user.cameraEnabled,
            };
          }

          return user;
        }),
      );
    }, 8000); // Check every 8 seconds

    return () => clearInterval(statusInterval);
  }, []);

  // Simulate user joining/leaving occasionally
  useEffect(() => {
    const joinLeaveInterval = setInterval(() => {
      setUsers((prev) => {
        const rand = Math.random();

        // 20% chance someone goes away
        if (rand < 0.2) {
          const activeUsers = prev.filter((u) => u.status !== "away");
          if (activeUsers.length > 0) {
            const randomUser =
              activeUsers[Math.floor(Math.random() * activeUsers.length)];
            return prev.map((u) =>
              u.id === randomUser.id
                ? { ...u, status: "away", activity: "idle" }
                : u,
            );
          }
        }

        // 20% chance someone comes back
        if (rand > 0.8) {
          const awayUsers = prev.filter((u) => u.status === "away");
          if (awayUsers.length > 0) {
            const randomUser =
              awayUsers[Math.floor(Math.random() * awayUsers.length)];
            return prev.map((u) =>
              u.id === randomUser.id
                ? {
                    ...u,
                    status: "active",
                    activity: "working",
                    lastActive: new Date(),
                  }
                : u,
            );
          }
        }

        return prev;
      });
    }, 20000); // Every 20 seconds

    return () => clearInterval(joinLeaveInterval);
  }, []);

  return { users, cursors };
}
