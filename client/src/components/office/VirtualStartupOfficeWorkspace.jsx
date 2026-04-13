import React, { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "../../config/apiBase.js";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { cn } from "../ui/utils";
import { motion, AnimatePresence } from "motion/react";
import { APP_URL } from "../../config"; // ✅ Simple config import
import { GoogleMeetCall } from "./GoogleMeetCall";
import { SimpleTeamMessaging } from "./SimpleTeamMessaging";
import GoogleAccountConnect from "../shared/GoogleAccountConnect";
import {
  isGoogleConnected,
  createInstantGoogleMeet,
} from "../../utils/googleMeet";
import CalendarWidget from "../calendar/CalendarWidget";
import AgendaPanel from "../calendar/AgendaPanel";
import * as teamMemberApi from "../../utils/api/teamMemberApi";
import * as activityApi from "../../utils/activityApi";
import * as meetingApi from "../../utils/api/meetingApi";
import * as agendaApi from "../../utils/api/agendaApi";
import { sendInvitation } from "../../utils/api/inboxApi";
import { getTasks, refreshTasksFromBackend } from "../../utils/executionEngine";
import { getUnreadCount } from "../../utils/messaging";
import { TaskManagementPanel } from "./TaskManagementPanel";
import { TeamHubPanel } from "./TeamHubPanel";
import MeetingScheduler from "../calendar/MeetingScheduler";
import InteractiveTour from "../tours/InteractiveTour";
import { virtualOfficeTourSteps } from "../tours/tourSteps";
import { useAudioManager } from "../../hooks/useAudioManager";
import { useOfficeSettings } from "../../hooks/useOfficeSettings";
import { LiveActivityFeed } from "../presence/LiveActivityFeed";
import { getStartupId } from "../../utils/startupId";
import { getAccessToken, STORAGE_KEYS } from "../../app/session";
import { unwrapData } from "../../utils/apiEnvelope";
import { TeamEnergyPulse } from "../presence/TeamEnergyPulse";
import { useNotifications } from "../../contexts/NotificationContext";
import * as presenceApi from "../../utils/presenceApi";
import {
  subscribeToActivities,
  subscribeToPresence,
  broadcastActivity,
  isRealtimeConnected,
} from "../../utils/realtimeSubscriptions";
import { PresenceBar } from "../presence/PresenceBar";
// 🔥 NEW: Real-time hooks for seamless updates without polling

import {
  Users,
  UserPlus,
  Video,
  Send,
  Circle,
  MessageCircle,
  DoorOpen,
  Zap,
  PartyPopper,
  Megaphone,
  CalendarCheck,
  Music,
  Sparkles,
  Hand,
  HelpCircle,
  Trophy,
  Target,
  Plus,
  Settings,
  Radio,
  Activity,
  Phone,
  CheckCircle2,
  Calendar,
  X,
  Edit2,
  Trash2,
  AtSign,
} from "lucide-react";

function mergeActivityFeed(prev, incoming) {
  const ids = new Set(prev.map((a) => a?.id).filter(Boolean));
  const next = [...prev];
  for (const raw of incoming) {
    const id = raw?.id;
    if (!id || ids.has(id)) continue;
    ids.add(id);
    next.unshift({
      ...raw,
      timestamp:
        raw.timestamp instanceof Date
          ? raw.timestamp
          : new Date(raw.timestamp || Date.now()),
      icon: typeof raw.icon === "string" ? raw.icon : "📋",
    });
  }
  return next.slice(0, 50);
}

// ActivityEvent type imported from LiveActivityFeed

export default function VirtualStartupOffice({
  user,
  onNavigate,
  taskToOpen,
  onTaskOpened,
  announcementToOpen,
  onAnnouncementOpened,
}) {
  // Presence features - Real backend data
  const [onlineUsers, setOnlineUsers] = useState([]);
  const presencePollIntervalRef = useRef(null);
  const presenceFallbackTimeoutRef = useRef(null);

  // Notifications
  const { addNotification, notifications } = useNotifications();
  const [myStatus, setMyStatus] = useState("available");
  const [myStatusMessage, setMyStatusMessage] = useState("");
  const [currentRoom, setCurrentRoom] = useState(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);
  const [showMeetingScheduler, setShowMeetingScheduler] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarView, setCalendarView] = useState("calendar");
  // Removed teamCalendarView - we only show Agenda now

  // Store reference to calendar widget's scheduler opener
  const calendarSchedulerOpener = useRef(null);

  // Agenda items state
  const [agendaItems, setAgendaItems] = useState([]);
  const [agendaLoading, setAgendaLoading] = useState(false);

  // Mobile navigation state
  const [mobileActiveTab, setMobileActiveTab] = useState("team");

  // Audio Manager
  const audio = useAudioManager();

  // Office Settings (controlled via platform settings now)
  const officeSettings = useOfficeSettings();

  // Initialize activity feed from localStorage
  const [activityFeed, setActivityFeed] = useState(() => {
    try {
      // Determine the startup ID for this user
      const currentStartupId =
        user.role === "founder"
          ? user.id
          : user.startupId || user.founderId || "";
      if (!currentStartupId) {
        return [];
      }

      // Use startup-specific storage key
      const storageKey = `office_activity_feed_${currentStartupId}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Filter out invalid entries (with React components) and convert timestamp strings back to Date objects
        return parsed
          .filter((event) => {
            // Only keep events that are valid objects with required fields
            // where icon is a string (not a React component object)
            // AND events that belong to this startup
            return (
              event &&
              event.id &&
              event.timestamp &&
              typeof event.icon === "string" &&
              (event.startupId === currentStartupId || !event.startupId)
            ); // Allow legacy events without startupId
          })
          .map((event) => ({
            ...event,
            timestamp: new Date(event.timestamp),
          }));
      }
    } catch (error) {
      console.error("Error loading activity feed:", error);
      // Clear corrupted data - but only for this startup
      const currentStartupId =
        user.role === "founder"
          ? user.id
          : user.startupId || user.founderId || "";
      if (currentStartupId) {
        localStorage.removeItem(`office_activity_feed_${currentStartupId}`);
      }
    }
    return [];
  });

  // Wall of Wins state
  const [wins, setWins] = useState([]);
  const [teamPlaylist, setTeamPlaylist] = useState("Lo-fi Beats for Focus");
  const [currentTime] = useState(new Date());

  // Invite form state
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "",
    department: "",
    workType: "remote",
    message: "",
  });

  // Check-in
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState("");
  const [teamCheckIns, setTeamCheckIns] = useState([]);

  // Announcements
  const [announcementText, setAnnouncementText] = useState("");
  const [latestAnnouncement, setLatestAnnouncement] = useState(null);

  // 🔥 NEW: Organization announcements from backend
  const [orgAnnouncements, setOrgAnnouncements] = useState([]);

  // Load announcements from localStorage with auto-refresh
  const loadAnnouncements = () => {
    const saved = localStorage.getItem("startupverse_announcements");
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((a) => ({
        ...a,
        timestamp: new Date(a.timestamp),
      }));
    }
    return [];
  };
  const [announcements, setAnnouncements] = useState(
    loadAnnouncements() || [
      {
        id: "1",
        message: "New feature release next week!",
        sender: "Team",
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        icon: <PartyPopper className="w-3.5 h-3.5" />,
      },
      {
        id: "2",
        message: "All-hands meeting Friday",
        sender: "Sarah",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        icon: <Users className="w-3.5 h-3.5" />,
      },
    ],
  );

  // Video Call & Messages Overlays
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [isVideoMinimized, setIsVideoMinimized] = useState(true); // Start minimized by default
  const [isMessagePanelOpen, setIsMessagePanelOpen] = useState(false);
  const [selectedMessageUserId, setSelectedMessageUserId] = useState(null);
  const [isTaskPanelOpen, setIsTaskPanelOpen] = useState(false);
  const [isTeamHubOpen, setIsTeamHubOpen] = useState(false);
  const [openTaskAddDialog, setOpenTaskAddDialog] = useState(false);
  const [activeCallParticipants, setActiveCallParticipants] = useState([]);
  const [activeCallType, setActiveCallType] = useState("direct");
  const [activeCallRoomName, setActiveCallRoomName] = useState();
  const [googleMeetLink, setGoogleMeetLink] = useState("");
  const [showGoogleConnectDialog, setShowGoogleConnectDialog] = useState(false);
  const [showOfficeTour, setShowOfficeTour] = useState(true);

  // Announcement detail modal
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [announcementComment, setAnnouncementComment] = useState("");
  const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false);
  const [editAnnouncementText, setEditAnnouncementText] = useState("");
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);

  // Task interface matching TaskManagementPanel

  // Tasks state - will be loaded from real data
  const [tasks, setTasks] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [founderId, setFounderId] = useState("");
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0); // Will be loaded from backend

  // 🔥 REALTIME: Get startup ID for subscriptions
  const currentStartupId =
    user.role === "founder" ? user.id : user.startupId || user.founderId || "";

  // Load real tasks from localStorage and backend
  const loadTasks = () => {
    try {
      // Get all users to find the founder
      const allUsers = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.teamMembers) || "[]",
      );

      // Determine the founder ID (we don't need the full founder object)
      let founderIdValue = "";
      if (user.role === "founder") {
        founderIdValue = user.id;
        setFounderId(user.id);
      } else if (user.role === "team-member" && user.startupId) {
        founderIdValue = user.startupId;
        setFounderId(user.startupId);
      } else if (user.role === "team" && user.founderId) {
        // Handle team member with founderId field
        founderIdValue = user.founderId;
        setFounderId(user.founderId);
      } else if (user.role === "team" && user.startupId) {
        // Fallback for team members with only startupId
        founderIdValue = user.startupId;
        setFounderId(user.startupId);
      }
      if (!founderIdValue) {
        console.log("No founder found for task loading");
        return;
      }

      // Load tasks using executionEngine (loads from localStorage + backend sync)
      const allTasks = getTasks(founderIdValue);

      // Filter tasks based on user role
      let filteredTasks = allTasks;
      if (user.role === "team-member" || user.role === "team") {
        // Team members see only their assigned tasks (both 'team-member' and 'team' roles)
        filteredTasks = allTasks.filter(
          (t) => t.assignedTo === user.id || t.assigneeId === user.id,
        );
      }
      setTasks(filteredTasks);
    } catch (error) {
      console.error("Error loading tasks:", error);
    }
  };

  // ✅ REALTIME: Announcements - removed polling, now uses real-time subscription below

  // Save announcements to localStorage when they change
  useEffect(() => {
    if (announcements.length > 0) {
      localStorage.setItem(
        "startupverse_announcements",
        JSON.stringify(announcements),
      );
    }
  }, [announcements]);

  // ✅ REALTIME: Wall of Wins - removed polling, now uses real-time subscription below

  // Load meetings from backend
  const loadMeetings = async () => {
    try {
      const startupId =
        user.role === "founder"
          ? user.id
          : user.startupId || user.founderId || "";
      if (startupId) {
        const fetchedMeetings = await meetingApi.getStartupMeetings(startupId);
        setMeetings(fetchedMeetings);
      }
    } catch (error) {
      console.error("Error loading meetings:", error);
    }
  };
  useEffect(() => {
    loadTasks();
    loadMeetings();

    // ✅ REALTIME: Removed task polling (was every 2s) - now using real-time subscription below

    // Listen for localStorage changes (when TaskManagementPanel updates tasks)
    const handleStorageChange = (e) => {
      if (e.key?.startsWith("startupverse_tasks_")) {
        loadTasks();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [user.id, user.role, user.startupId]);

  // Handle opening specific task from notification
  useEffect(() => {
    if (taskToOpen) {
      console.log("📋 Opening task from notification:", taskToOpen);
      setIsTaskPanelOpen(true);

      // 🔥 CRITICAL: Force refresh tasks from backend when notification opens a task
      if (founderId) {
        console.log("🔄 [TASK SYNC] Refreshing tasks due to notification...");
        refreshTasksFromBackend(founderId).then((freshTasks) => {
          console.log(
            `✅ [TASK SYNC] Refreshed ${freshTasks.length} tasks from backend`,
          );
          // Reload tasks after refresh
          loadTasks();
        });
      }

      // Call the callback to clear the taskToOpen
      if (onTaskOpened) {
        onTaskOpened();
      }
    }
  }, [taskToOpen, onTaskOpened, founderId]);

  // Handle opening specific announcement from notification
  useEffect(() => {
    if (announcementToOpen) {
      console.log(
        "📢 Opening announcement from notification:",
        announcementToOpen,
      );
      setIsTeamHubOpen(true);
      // Call the callback to clear the announcementToOpen
      if (onAnnouncementOpened) {
        onAnnouncementOpened();
      }
    }
  }, [announcementToOpen, onAnnouncementOpened]);

  // 🔥 CRITICAL: Listen for task-related notifications and refresh tasks
  useEffect(() => {
    if (!founderId || !notifications || notifications.length === 0) return;

    // Find most recent task notification
    const taskNotifications = notifications.filter(
      (n) =>
        n.type === "task-completed" ||
        n.type === "task-blocked" ||
        n.type === "task-assigned",
    );
    if (taskNotifications.length > 0) {
      const latestTaskNotif = taskNotifications[0];
      const lastCheckedTime = localStorage.getItem(
        `last_task_refresh_${founderId}`,
      );
      const notifTime = new Date(latestTaskNotif.timestamp).getTime();

      // Only refresh if this notification is newer than last check
      if (!lastCheckedTime || notifTime > parseInt(lastCheckedTime)) {
        console.log(
          "🔔 [TASK SYNC] New task notification detected, refreshing tasks...",
          latestTaskNotif,
        );
        refreshTasksFromBackend(founderId).then((freshTasks) => {
          console.log(
            `✅ [TASK SYNC] Tasks refreshed due to notification - ${freshTasks.length} tasks`,
          );
          loadTasks();
          localStorage.setItem(
            `last_task_refresh_${founderId}`,
            Date.now().toString(),
          );
        });
      }
    }
  }, [notifications, founderId]);

  // Get only pending/in-progress tasks for the Your Tasks card display
  const upcomingTasks = tasks
    .filter((t) => t.status === "pending" || t.status === "in-progress")
    .slice(0, 10) // Limit to 10 tasks
    .map((t) => ({
      id: t.id,
      title: t.title,
      time: t.createdAt
        ? `Created ${new Date(t.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}`
        : "No date",
      status: t.status,
      priority: t.blockerReason
        ? "blocked"
        : t.assignedTo
          ? "assigned"
          : "unassigned",
    }));

  // 🔥 NEW: Load organization announcements on mount
  useEffect(() => {
    if (user?.id && user?.role === "founder") {
      loadOrganizationAnnouncements();
    }
  }, [user?.id, user?.role]);
  const loadOrganizationAnnouncements = async () => {
    try {
      const token = getAccessToken();
      const response = await fetch(
        `${API_BASE_URL}/founder/${user.id}/announcements`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );
      if (response.ok) {
        const raw = unwrapData(await response.json());
        const list = Array.isArray(raw) ? raw : raw.announcements || [];
        console.log(
          "✅ [Virtual Office] Loaded organization announcements:",
          list.length,
        );
        setOrgAnnouncements(list);
      }
    } catch (error) {
      console.error("❌ Error loading organization announcements:", error);
      setOrgAnnouncements([]);
    }
  };

  // Load agenda items on mount
  useEffect(() => {
    if (founderId) {
      loadAgendaItems();
    }
  }, [founderId]);
  const loadAgendaItems = async () => {
    setAgendaLoading(true);
    try {
      const result = await agendaApi.getUpcomingAgenda(founderId, 30); // Next 30 days
      if (result.success && result.agenda) {
        setAgendaItems(result.agenda);
      }
    } catch (error) {
      console.error("Error loading agenda items:", error);
    } finally {
      setAgendaLoading(false);
    }
  };

  // Get all upcoming items (events, meetings, tasks with due dates) for calendar card
  const getUpcomingItems = () => {
    const items = [];

    // Add events from announcements
    getAnnouncementsByCategory("team-events").forEach((event) => {
      items.push({
        id: event.id,
        type: "event",
        title: event.message,
        date: new Date(event.timestamp),
        sender: event.sender,
      });
    });

    // Add meetings
    meetings.forEach((meeting) => {
      const meetingDateTime = new Date(`${meeting.date}T${meeting.startTime}`);
      items.push({
        id: meeting.id,
        type: "meeting",
        title: meeting.title,
        date: meetingDateTime,
        details: `${meeting.startTime} - ${meeting.endTime}`,
      });
    });

    // Add tasks with due dates
    tasks.forEach((task) => {
      if (
        task.dueDate &&
        (task.status === "pending" || task.status === "in-progress")
      ) {
        items.push({
          id: task.id,
          type: "task",
          title: task.title,
          date: new Date(task.dueDate),
          details: task.status,
        });
      }
    });

    // Sort by date (earliest first) and filter only future items
    const now = new Date();
    return items
      .filter((item) => item.date >= now)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  // ✅ REALTIME: Unread messages count - removed polling, using real-time hook below
  // Initial load only
  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const startupId = getStartupId(user);
        if (startupId) {
          const count = await getUnreadCount(user.id, startupId);
          setUnreadMessagesCount(count);
        }
      } catch (error) {
        console.error("Error loading unread messages count:", error);
      }
    };
    loadUnreadCount();
    // ✅ REALTIME: Removed polling (was every 3s) - real-time updates via subscription
  }, [user.id, user.role, user.startupId, user.founderId]);

  // Team data - loaded from real data sources
  const [teamMembers, setTeamMembers] = useState([]);

  // Load team members from localStorage and backend
  useEffect(() => {
    const loadTeamMembers = async () => {
      try {
        // 1. Load from localStorage FIRST for instant display
        const allUsers = JSON.parse(
          localStorage.getItem(STORAGE_KEYS.teamMembers) || "[]",
        );
        console.log("🔍 [VirtualOffice] Loading team members...");
        console.log("🔍 [VirtualOffice] Current user:", {
          id: user.id,
          name: user.name,
          role: user.role,
          companyId: user.companyId,
          startupId: user.startupId,
        });
        console.log(
          "🔍 [VirtualOffice] All users in localStorage:",
          allUsers.length,
        );
        console.log(
          "🔍 [VirtualOffice] All users:",
          allUsers.map((u) => ({
            id: u.id,
            name: u.name,
            role: u.role,
            companyId: u.companyId,
            startupId: u.startupId,
            founderId: u.founderId,
          })),
        );

        // Determine the startup ID to use for filtering
        const currentStartupId =
          user.role === "founder" ? user.id : user.startupId;

        // Filter team members:
        // - If user is founder: find all team members where startupId === founder.id OR founderId === founder.id
        // - If user is team member: find founder and other team members in same startup
        // 🔒 SECURITY FIX: Removed companyId matching to prevent cross-startup data leaks
        const localTeamMembers = allUsers.filter((u) => {
          if (u.id === user.id) return false; // Exclude current user

          if (user.role === "founder") {
            // Founder sees: team members with matching startupId OR founderId ONLY
            // 🔒 SECURITY: Removed companyId matching - it's not unique per startup
            const matchByStartupId = u.startupId === user.id;
            const matchByFounderId = u.founderId === user.id;
            const shouldInclude = matchByStartupId || matchByFounderId;
            console.log(`🔍 [VirtualOffice] Checking user ${u.name}:`, {
              matchByStartupId,
              matchByFounderId,
              shouldInclude,
              userStartupId: u.startupId,
              userFounderId: u.founderId,
              currentUserId: user.id,
            });
            return shouldInclude;
          } else {
            // Team member sees: founder + other team members in same startup ONLY
            // 🔒 SECURITY: Removed companyId matching - it's not unique per startup
            const founderIdToMatch = user.startupId || user.founderId;
            return (
              u.id === founderIdToMatch ||
              // Include the founder
              u.startupId === founderIdToMatch ||
              // Other team members with same startupId
              u.founderId === founderIdToMatch
            ); // Other team members with same founderId
          }
        });
        console.log(
          "✅ [VirtualOffice] Filtered team members:",
          localTeamMembers.length,
          localTeamMembers.map((m) => ({
            id: m.id,
            name: m.name,
            role: m.role,
          })),
        );

        // Generate desk positions based on index
        const deskPositions = [
          {
            x: 20,
            y: 30,
          },
          {
            x: 50,
            y: 30,
          },
          {
            x: 80,
            y: 30,
          },
          {
            x: 20,
            y: 50,
          },
          {
            x: 50,
            y: 50,
          },
          {
            x: 80,
            y: 50,
          },
          {
            x: 20,
            y: 70,
          },
          {
            x: 50,
            y: 70,
          },
          {
            x: 80,
            y: 70,
          },
        ];
        const deskItemsOptions = [
          ["plant", "photo", "lamp"],
          ["coffee", "plant", "headphones"],
          ["plant", "photo", "coffee", "lamp"],
          ["coffee"],
          ["plant", "photo"],
          ["coffee", "lamp", "plant"],
          ["plant", "coffee"],
          ["coffee", "photo", "lamp"],
        ];

        // Map users to TeamMember format with office-specific data
        const mappedTeamMembers = localTeamMembers.map((member, index) => ({
          id: member.id,
          name: member.name,
          role: member.title || member.role || "Team Member",
          avatar: member.avatar,
          status: "available",
          deskPosition: deskPositions[index % deskPositions.length],
          mood: "happy",
          deskItems: deskItemsOptions[index % deskItemsOptions.length],
        }));

        // 🔧 FIX: Only include current user in team grid if they're a founder
        // Team members should see their founder + other team members, not themselves
        let allMembers;
        if (user.role === "founder") {
          // Founders see themselves + their team
          const currentUserMember = {
            id: user.id,
            name: user.name,
            role: user.title || user.role || "Founder",
            avatar: user.avatar,
            status: myStatus,
            statusMessage:
              myStatus === "available"
                ? "Available to help!"
                : myStatusMessage || undefined,
            deskPosition: {
              x: 5,
              y: 5,
            },
            mood: "happy",
            deskItems: ["plant", "photo", "lamp", "coffee"],
          };
          allMembers = [currentUserMember, ...mappedTeamMembers];
        } else {
          // Team members see their founder + other team members (not themselves)
          allMembers = mappedTeamMembers;
        }
        setTeamMembers(allMembers);
        console.log(
          "✅ Team members loaded from localStorage:",
          allMembers.length,
        );

        // 2. Fetch from backend in BACKGROUND to get fresh data
        const startupIdForBackend =
          user.role === "founder" ? user.id : user.startupId || user.companyId;
        console.log(
          "🔍 [VirtualOffice] Fetching from backend with startupId:",
          startupIdForBackend,
        );
        if (startupIdForBackend) {
          try {
            const backendTeamMembers =
              await teamMemberApi.getStartupTeamMembers(startupIdForBackend);
            console.log(
              "🔍 [VirtualOffice] Backend returned team members:",
              backendTeamMembers,
            );
            console.log(
              "🔍 [VirtualOffice] Backend team members details:",
              backendTeamMembers?.map((m) => ({
                id: m.id,
                name: m.name || m.talentName,
                role: m.role || m.talentArea,
                title: m.title,
                startupId: m.startupId,
                founderId: m.founderId,
              })),
            );
            if (backendTeamMembers && backendTeamMembers.length > 0) {
              const backendMapped = backendTeamMembers
                .filter((m) => m.id !== user.id)
                .map((member, index) => ({
                  id: member.id,
                  name: member.name || member.talentName || "Unknown User",
                  role:
                    member.title ||
                    member.talentArea ||
                    member.role ||
                    "Team Member",
                  avatar: member.avatar,
                  status: member.status || "available",
                  statusMessage: member.statusMessage,
                  currentTask: member.currentTask,
                  deskPosition: deskPositions[index % deskPositions.length],
                  mood: member.mood || "happy",
                  deskItems: deskItemsOptions[index % deskItemsOptions.length],
                }));

              // 🔧 FIX: Only include current user if they're a founder
              let allMembersWithBackend;
              if (user.role === "founder") {
                // Founders see themselves + their team
                const currentUserMember = {
                  id: user.id,
                  name: user.name,
                  role: user.title || user.role || "Founder",
                  avatar: user.avatar,
                  status: myStatus,
                  statusMessage:
                    myStatus === "available"
                      ? "Available to help!"
                      : myStatusMessage || undefined,
                  deskPosition: {
                    x: 5,
                    y: 5,
                  },
                  mood: "happy",
                  deskItems: ["plant", "photo", "lamp", "coffee"],
                };
                allMembersWithBackend = [currentUserMember, ...backendMapped];
              } else {
                // Team members see their founder + other team members (not themselves)
                allMembersWithBackend = backendMapped;
              }
              setTeamMembers(allMembersWithBackend);
              console.log(
                "✅ Team members updated from backend:",
                allMembersWithBackend.length,
              );

              // 🔥 CRITICAL FIX: Update localStorage with fresh backend data
              // This ensures deleted users are removed from localStorage
              const existingUsers = JSON.parse(
                localStorage.getItem(STORAGE_KEYS.teamMembers) || "[]",
              );

              // Remove deleted team members from localStorage
              const backendMemberIds = new Set(
                backendTeamMembers.map((m) => m.id),
              );
              const updatedUsers = existingUsers.filter((u) => {
                // Keep current user
                if (u.id === user.id) return true;

                // Keep users from other startups
                const belongsToThisStartup =
                  user.role === "founder"
                    ? u.startupId === user.id || u.founderId === user.id
                    : u.id === user.startupId || u.startupId === user.startupId;
                if (!belongsToThisStartup) return true;

                // For this startup's members, only keep if they exist in backend
                return backendMemberIds.has(u.id);
              });
              localStorage.setItem(
                STORAGE_KEYS.teamMembers,
                JSON.stringify(updatedUsers),
              );
              console.log(
                "🧹 localStorage cleaned: removed deleted team members",
              );
            }
          } catch (error) {
            // Silently fail - localStorage data is already displayed
            if (process.env.NODE_ENV === "development") {
              console.debug(
                "Failed to load team members from backend (expected in demo mode):",
                error.message,
              );
            }
          }
        }
      } catch (error) {
        console.error("❌ Error loading team members:", error);
        // Show at least the current user if everything fails
        setTeamMembers([
          {
            id: user.id,
            name: user.name,
            role: user.title || user.role || "Founder",
            avatar: user.avatar,
            status: myStatus,
            deskPosition: {
              x: 5,
              y: 5,
            },
            mood: "happy",
            deskItems: ["plant", "photo", "lamp", "coffee"],
          },
        ]);
      }
    };
    loadTeamMembers();

    // Auto-debug on load
    debugStartupData();

    // ✅ REALTIME: Removed team member polling (was every 10s) - using real-time subscription below

    return () => {
      // Cleanup handled by real-time subscription
    };
  }, [
    user.id,
    user.companyId,
    user.name,
    user.role,
    user.title,
    user.avatar,
    myStatus,
    myStatusMessage,
  ]);

  // Debug function to check database state
  const debugStartupData = async () => {
    try {
      const startupIdForDebug =
        user.role === "founder" ? user.id : user.startupId || user.companyId;
      console.log(
        "🐛 [DEBUG] Checking database for startup:",
        startupIdForDebug,
      );
      const token = getAccessToken();
      const response = await fetch(
        `${API_BASE_URL}/debug/startups/${startupIdForDebug}`,
        {
          method: "GET",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json();
      console.log("🐛 [DEBUG] Database state:", unwrapData(data));
      // Removed debug toast notification for production
    } catch (error) {
      console.error("❌ [DEBUG] Error:", error);
      toast.error("Debug failed - check console");
    }
  };

  // ==========================================
  // PRESENCE MANAGEMENT - Real Backend Integration
  // ==========================================

  const deriveMoodFromStatus = (status) => {
    if (status === "focus-mode") return "focused";
    if (status === "on-break") return "relaxed";
    if (status === "away") return "away";
    if (status === "in-meeting") return "busy";
    return "ready";
  };

  const normalizePresenceUsers = (presenceRows) =>
    (Array.isArray(presenceRows) ? presenceRows : []).map((p) => {
      const member = teamMembers.find((tm) => String(tm.id) === String(p.userId || p.id));
      return {
        id: String(p.userId || p.id || ""),
        name: p.name || p.userName || member?.name || `User ${String(p.userId || p.id || "")}`,
        avatar: member?.avatar,
        status: p.status || (p.isOnline ? "available" : "away"),
        statusText: p.statusText || "",
        mood: p.mood || "",
        activity: p.activity?.type || p.activity || "working",
        role: p.role || member?.role || "team-member",
        cameraEnabled: Boolean(p.cameraEnabled),
        lastSeenAt:
          p.lastSeenAt instanceof Date
            ? p.lastSeenAt
            : new Date(p.lastSeenAt || Date.now()),
        isOnline: typeof p.isOnline === "boolean" ? p.isOnline : p.status !== "away",
      };
    });

  const mergePresenceUsers = (incomingRows) =>
    setOnlineUsers((prev) => {
      const currentById = new Map((prev || []).map((u) => [String(u.id), u]));
      for (const row of normalizePresenceUsers(incomingRows)) {
        currentById.set(String(row.id), {
          ...(currentById.get(String(row.id)) || {}),
          ...row,
        });
      }
      return Array.from(currentById.values());
    });

  // Send presence heartbeat and fetch active users
  useEffect(() => {
    const startupId = user.companyId || user.startupId || "default-startup";
    let stopped = false;

    // Function to get current status
    const getCurrentStatus = () => {
      let status = "available";
      let activity = "working";
      if (myStatus === "away") {
        status = "away";
        activity = "idle";
      } else if (isVideoCallActive) {
        status = "in-meeting";
        activity = "in-call";
      } else if (isMessagePanelOpen) {
        activity = "messaging";
      }
      return {
        userName: user.name || "",
        role: user.role || "",
        isOnline: status !== "away",
        status,
        statusText:
          myStatusMessage ||
          (status === "available"
            ? "Available"
            : status === "in-meeting"
              ? "In meeting"
              : status === "focus-mode"
                ? "In focus mode"
                : status === "on-break"
                  ? "On break"
                  : "Away"),
        mood: deriveMoodFromStatus(myStatus),
        activity,
        cameraEnabled: isVideoCallActive && !isVideoMinimized,
      };
    };

    // Start heartbeat
    const stopHeartbeat = presenceApi.startPresenceHeartbeat(
      user.id,
      startupId,
      getCurrentStatus,
    );

    const fetchActiveUsers = async () => {
      const result = await presenceApi.getActiveUsers(startupId);
      if (!stopped && result.success && result.presence) {
        setOnlineUsers(normalizePresenceUsers(result.presence));
      }
    };

    const stopPresenceSubscription = subscribeToPresence(
      startupId,
      user.id,
      user.name || "",
      (presenceRows) => {
        if (!stopped) {
          mergePresenceUsers(presenceRows);
        }
      },
    );

    const startPresenceFallbackPolling = () => {
      if (presencePollIntervalRef.current) return;
      const tick = async () => {
        await fetchActiveUsers();
      };
      void tick();
      presencePollIntervalRef.current = setInterval(() => {
        void tick();
      }, 30000);
    };

    const stopPresenceFallbackPolling = () => {
      if (presencePollIntervalRef.current) {
        clearInterval(presencePollIntervalRef.current);
        presencePollIntervalRef.current = null;
      }
      if (presenceFallbackTimeoutRef.current) {
        clearTimeout(presenceFallbackTimeoutRef.current);
        presenceFallbackTimeoutRef.current = null;
      }
    };

    const evaluateConnectionFallback = () => {
      if (isRealtimeConnected()) {
        stopPresenceFallbackPolling();
        return;
      }
      if (presenceFallbackTimeoutRef.current) return;
      presenceFallbackTimeoutRef.current = setTimeout(() => {
        presenceFallbackTimeoutRef.current = null;
        if (!isRealtimeConnected()) {
          startPresenceFallbackPolling();
        }
      }, 3000);
    };

    void fetchActiveUsers();
    evaluateConnectionFallback();
    const connectionProbe = setInterval(() => {
      evaluateConnectionFallback();
      if (isRealtimeConnected()) {
        void fetchActiveUsers();
      }
    }, 10000);

    // Cleanup on unmount
    return () => {
      stopped = true;
      stopHeartbeat();
      stopPresenceSubscription();
      clearInterval(connectionProbe);
      stopPresenceFallbackPolling();
    };
  }, [
    user.id,
    user.name,
    user.role,
    user.companyId,
    user.startupId,
    myStatus,
    isVideoCallActive,
    isVideoMinimized,
    isMessagePanelOpen,
    teamMembers,
    myStatusMessage,
  ]);
  const [meetingRooms] = useState([
    {
      id: "war-room",
      name: "War Room",
      icon: "🎯",
      type: "meeting",
      capacity: 10,
      occupants: ["1"],
      position: {
        x: 5,
        y: 5,
      },
      size: {
        width: 15,
        height: 15,
      },
    },
    {
      id: "focus-room",
      name: "Focus Room",
      icon: "🎧",
      type: "focus",
      capacity: 4,
      occupants: ["6"],
      position: {
        x: 25,
        y: 5,
      },
      size: {
        width: 12,
        height: 12,
      },
    },
    {
      id: "water-cooler",
      name: "Water Cooler",
      icon: "☕",
      type: "social",
      capacity: 8,
      occupants: ["5"],
      position: {
        x: 42,
        y: 5,
      },
      size: {
        width: 12,
        height: 12,
      },
    },
    {
      id: "break-room",
      name: "Break Room",
      icon: "🎮",
      type: "social",
      capacity: 10,
      occupants: [],
      position: {
        x: 58,
        y: 5,
      },
      size: {
        width: 15,
        height: 12,
      },
    },
  ]);
  const quickReactions = [
    {
      id: "1",
      emoji: "👋",
      label: "Wave",
      action: "wave",
    },
    {
      id: "2",
      emoji: "☕",
      label: "Coffee?",
      action: "coffee-invite",
    },
    {
      id: "3",
      emoji: "🙌",
      label: "High Five",
      action: "high-five",
    },
    {
      id: "4",
      emoji: "💡",
      label: "Idea!",
      action: "share-idea",
    },
    {
      id: "5",
      emoji: "🎉",
      label: "Celebrate",
      action: "celebrate",
    },
    {
      id: "6",
      emoji: "🤔",
      label: "Question",
      action: "question",
    },
  ];

  // Activity feed is driven by API + Socket.IO where configured
  // No mock data generation

  // Persist activity feed to localStorage (startup-specific)
  useEffect(() => {
    try {
      const currentStartupId =
        user.role === "founder"
          ? user.id
          : user.startupId || user.founderId || "";
      if (currentStartupId) {
        const storageKey = `office_activity_feed_${currentStartupId}`;
        // Filter out any invalid activities before saving
        const validActivities = activityFeed.filter(
          (a) => a && a.id && a.timestamp && typeof a.icon === "string",
        );
        localStorage.setItem(storageKey, JSON.stringify(validActivities));
      }
    } catch (error) {
      console.error("Error saving activity feed:", error);
    }
  }, [activityFeed, user.id, user.role, user.startupId, user.founderId]);

  // 🔄 FETCH ACTIVITIES FROM BACKEND - Sync all team activities
  useEffect(() => {
    const currentStartupId =
      user.role === "founder"
        ? user.id
        : user.startupId || user.founderId || "";
    if (!currentStartupId) {
      console.warn("⚠️ No startupId found, skipping activity sync");
      return;
    }
    let consecutiveErrors = 0;
    let isActive = true;
    const fetchActivities = async () => {
      if (!isActive) return;
      const result = await activityApi.getStartupActivities(currentStartupId, {
        page: 1,
        pageSize: 50,
      });
      if (result.success && result.activities && result.activities.length > 0) {
        consecutiveErrors = 0; // Reset error counter on success

        // Convert timestamp strings to Date objects and ensure icons are strings
        const backendActivities = result.activities.map((activity) => ({
          ...activity,
          timestamp: new Date(activity.timestamp),
          // Ensure icon is always a string (emoji), never an object
          icon: typeof activity.icon === "string" ? activity.icon : "📋",
        }));

        // Merge with local activities, removing duplicates by ID
        setActivityFeed((prev) => {
          const allActivities = [...backendActivities, ...prev];
          // Filter out any invalid activities before creating the map
          const validActivities = allActivities.filter(
            (a) => a && a.id && a.timestamp && typeof a.icon === "string",
          );
          const uniqueActivities = Array.from(
            new Map(validActivities.map((a) => [a.id, a])).values(),
          );
          // Sort by timestamp descending and limit to 50
          return uniqueActivities
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 50);
        });
      } else if (!result.success && result.error) {
        consecutiveErrors++;
        // Error handling is done in activityApi.ts - no need to log again here
      }
    };

    // Initial fetch (delayed to let UI load first)
    const initialTimeout = setTimeout(fetchActivities, 2000);

    // ✅ REALTIME: Removed activity polling (was every 60s) - using real-time subscription below

    return () => {
      isActive = false;
      clearTimeout(initialTimeout);
      // Real-time subscription cleanup handled separately
    };
  }, [user.id, user.role, user.startupId, user.founderId]);

  // 📡 SUBSCRIBE TO REALTIME ACTIVITY UPDATES
  useEffect(() => {
    const currentStartupId =
      user.role === "founder"
        ? user.id
        : user.startupId || user.founderId || "";
    if (!currentStartupId) {
      console.warn("⚠️ No startupId found, skipping realtime subscription");
      return;
    }
    console.log("📡 Setting up realtime activity subscription...");

    // Subscribe to realtime activities
    const unsubscribe = subscribeToActivities(currentStartupId, (activity) => {
      console.log("🔥 New activity received via realtime:", activity);

      // Skip if it's from the current user (we already added it optimistically)
      if (activity.userId === user.id) {
        console.log("⏭️ Skipping own activity (already added optimistically)");
        return;
      }

      // Add to activity feed if not already present
      setActivityFeed((prev) => {
        // Check if activity already exists
        if (prev.some((a) => a.id === activity.id)) {
          return prev;
        }

        // Add new activity at the top, ensuring icon is a string
        const newEvent = {
          ...activity,
          timestamp: new Date(activity.timestamp),
          icon: typeof activity.icon === "string" ? activity.icon : "📋",
        };
        return [newEvent, ...prev].slice(0, 50);
      });

      // Play notification sound if it's not from current user
      if (activity.userId !== user.id && audio) {
        audio.playSound("notification");
      }
    });

    // Cleanup on unmount
    return () => {
      console.log("🔌 Cleaning up realtime subscription");
      unsubscribe();
    };
  }, [user.id, user.role, user.startupId, user.founderId, audio]);

  // Polling fallback when the socket is offline (Phase 4 graceful degradation)
  useEffect(() => {
    const currentStartupId =
      user.role === "founder"
        ? user.id
        : user.startupId || user.founderId || "";
    if (!currentStartupId) return;

    const tick = async () => {
      if (isRealtimeConnected()) return;
      const res = await activityApi.getStartupActivities(currentStartupId);
      if (!res.success || !res.activities?.length) return;
      setActivityFeed((prev) => mergeActivityFeed(prev, res.activities));
    };

    const intervalId = setInterval(tick, 35000);
    void tick();
    return () => clearInterval(intervalId);
  }, [user.id, user.role, user.startupId, user.founderId]);

  const addActivity = async (type, message, icon) => {
    const currentStartupId =
      user.role === "founder"
        ? user.id
        : user.startupId || user.founderId || "";
    if (!currentStartupId) {
      console.warn("⚠️ No startupId found, skipping activity");
      return;
    }
    const newEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      userId: user.id,
      userName: user.name,
      message,
      timestamp: new Date(),
      icon,
      startupId: currentStartupId, // Add startup ID to filter activities
    };

    // Optimistically update UI
    setActivityFeed((prev) => [newEvent, ...prev].slice(0, 50));

    // Post to backend and broadcast to realtime
    try {
      const result = await activityApi.postActivity({
        userId: user.id,
        userName: user.name,
        startupId: currentStartupId,
        type,
        message,
        icon,
      });
      if (result.success) {
        // Broadcast to connected clients (Socket.IO when available)
        const broadcasted = await broadcastActivity(currentStartupId, {
          id: newEvent.id,
          userId: user.id,
          userName: user.name,
          startupId: currentStartupId,
          type,
          message,
          icon,
          timestamp: newEvent.timestamp.toISOString(),
        });

        // 🔧 FIX: Silent handling - only log success, not failures
        if (broadcasted) {
          console.log("✅ Activity posted and broadcasted");
        }
        // If broadcast fails, it's already logged at debug level - don't spam console
      }
    } catch (error) {
      console.error("Failed to post activity to backend:", error);
    }
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "available":
        return "bg-green-500";
      case "in-meeting":
        return "bg-red-500";
      case "focus-mode":
        return "bg-purple-500";
      case "on-break":
        return "bg-yellow-500";
      case "away":
        return "bg-gray-400";
    }
  };
  const getMoodEmoji = (mood) => {
    switch (mood) {
      case "happy":
        return "😊";
      case "focused":
        return "🎯";
      case "tired":
        return "😴";
      default:
        return "😐";
    }
  };
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };
  const updateMyStatus = async (newStatus, message) => {
    setMyStatus(newStatus);
    setMyStatusMessage(message || "");
    setShowStatusDialog(false);
    const startupId = user.companyId || user.startupId || "default-startup";
    await presenceApi.updateMyPresenceStatus(
      user.id,
      startupId,
      message || "",
      deriveMoodFromStatus(newStatus),
    );
    addActivity(
      "status-change",
      `switched to ${newStatus.replace("-", " ")}`,
      "🔄",
    );
    toast.success(`Status updated to: ${newStatus.replace("-", " ")}`);
  };
  const joinRoom = (roomId) => {
    const room = meetingRooms.find((r) => r.id === roomId);
    if (!room) return;
    setCurrentRoom(roomId);
    addActivity("room-join", `joined ${room.name}`, room.icon);
    toast.success(
      `Joined ${room.name}! ${room.occupants.length} ${room.occupants.length === 1 ? "person" : "people"} here`,
    );
    audio.playDoorSound("open");
    audio.playWhooshSound();
  };
  const leaveRoom = () => {
    if (!currentRoom) return;
    const room = meetingRooms.find((r) => r.id === currentRoom);
    setCurrentRoom(null);
    addActivity("departure", `left ${room?.name}`, "👋");
    toast(`Left ${room?.name}`);
    audio.playDoorSound("close");
  };
  const sendQuickReaction = (reaction, targetMember) => {
    if (targetMember) {
      addActivity(
        "chat",
        `${reaction.emoji} sent ${reaction.label.toLowerCase()} to ${targetMember.name}`,
        reaction.emoji,
      );
      toast.success(
        `${reaction.emoji} Sent ${reaction.label} to ${targetMember.name}!`,
      );
    } else {
      addActivity(
        "celebration",
        `${reaction.emoji} ${reaction.label.toLowerCase()} to everyone!`,
        reaction.emoji,
      );
      toast.success(`${reaction.emoji} ${reaction.label} sent to the team!`);
    }
    audio.playNotificationSound("info");
    audio.playClickSound();
  };
  const getTimeBasedGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12)
      return {
        greeting: "Good morning",
        icon: "🌅",
        message: "Ready to tackle the day?",
      };
    if (hour < 17)
      return {
        greeting: "Good afternoon",
        icon: "",
        message: "Keep up the great work!",
      };
    if (hour < 22)
      return {
        greeting: "Good evening",
        icon: "🌙",
        message: "Winding down for the day?",
      };
    return {
      greeting: "Late night",
      icon: "🌙",
      message: "Burning the midnight oil?",
    };
  };
  const greeting = getTimeBasedGreeting();

  // Handle sending invitation
  const handleSendInvitation = async () => {
    console.log(
      "🔍 [VirtualOffice] handleSendInvitation called with form:",
      inviteForm,
    );
    if (!inviteForm.email || !inviteForm.role) {
      console.error("❌ [VirtualOffice] Missing email or role:", {
        email: inviteForm.email,
        role: inviteForm.role,
      });
      toast.error("Please fill in required fields (email and role)");
      return;
    }
    try {
      // Generate invitation data
      const invitationId = `inv-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const token = Math.random().toString(36).substring(2, 15);
      const invitationData = {
        id: invitationId,
        email: inviteForm.email,
        name: inviteForm.email.split("@")[0],
        // Extract name from email
        founderId: founderId,
        founderName: user.name || "Founder",
        startupName: user.profile?.startupName || "Startup",
        startupId: user.startupId || user.id,
        role: inviteForm.role,
        department: inviteForm.department || "General",
        message: inviteForm.message || `Join our team as ${inviteForm.role}!`,
        token: token,
        status: "pending",
        createdAt: new Date().toISOString(),
        expiresAt: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        appUrl: APP_URL, // ✅ Use custom domain
      };
      const expectedInvitationLink = `${APP_URL}?invitation=${token}`;
      console.log("📧 [VirtualOffice] Sending invitation:", invitationData);
      console.log("🔗 [VirtualOffice] App URL for email link:", APP_URL);
      console.log(
        "🔗 [VirtualOffice] Expected invitation link:",
        expectedInvitationLink,
      );
      console.log(
        "✅ [VirtualOffice] EMAIL WILL CONTAIN THIS LINK:",
        expectedInvitationLink,
      );

      const data = await sendInvitation(invitationData);
      console.log("✅ [VirtualOffice] Invitation sent successfully:", data);
      toast.success(`📧 Invitation sent to ${inviteForm.email}!`);
      audio.playClickSound();

      // Reset form
      setInviteForm({
        email: "",
        role: "",
        department: "",
        workType: "remote",
        message: "",
      });
      setShowInviteDialog(false);
    } catch (error) {
      console.error("❌ [VirtualOffice] Error sending invitation:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to send invitation",
      );
    }
  };

  // NEW FUNCTIONS FOR ADDED FEATURES

  // Format time helper
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // Filter announcements by category
  const getAnnouncementsByCategory = (category) => {
    return announcements.filter((a) => a.category === category);
  };

  // Toggle reaction on announcement
  const toggleReaction = (announcementId, emoji) => {
    let shouldNotify = false;
    let announcementAuthorId;
    setAnnouncements((prev) =>
      prev.map((announcement) => {
        if (announcement.id === announcementId) {
          const reactions = announcement.reactions || [];
          const existingReaction = reactions.find((r) => r.emoji === emoji);
          announcementAuthorId = announcement.authorId;
          let updatedReactions;
          if (existingReaction) {
            // Check if user already reacted with this emoji
            if (existingReaction.users.includes(user.id)) {
              // Remove user's reaction
              updatedReactions = reactions
                .map((r) =>
                  r.emoji === emoji
                    ? {
                        ...r,
                        users: r.users.filter((id) => id !== user.id),
                      }
                    : r,
                )
                .filter((r) => r.users.length > 0); // Remove empty reactions
            } else {
              // Add user's reaction
              updatedReactions = reactions.map((r) =>
                r.emoji === emoji
                  ? {
                      ...r,
                      users: [...r.users, user.id],
                    }
                  : r,
              );
              shouldNotify = true;
            }
          } else {
            // Add new reaction
            updatedReactions = [
              ...reactions,
              {
                emoji,
                users: [user.id],
              },
            ];
            shouldNotify = true;
          }
          return {
            ...announcement,
            reactions: updatedReactions,
          };
        }
        return announcement;
      }),
    );

    // Send notification to announcement author
    if (
      shouldNotify &&
      announcementAuthorId &&
      announcementAuthorId !== user.id
    ) {
      addNotification({
        type: "announcement_reaction",
        title: "New reaction on your announcement",
        message: `${user.name} reacted with ${emoji} to your announcement`,
        metadata: {
          announcementId,
          reactedBy: user.name,
          reaction: emoji,
        },
      });

      // Add to live activity feed
      addActivity(
        "announcement-react",
        `reacted ${emoji} to an announcement`,
        emoji,
      );
    }
    audio.playClickSound();
  };

  // Add comment to announcement
  const addComment = (announcementId, text) => {
    if (!text.trim()) return;
    let announcementAuthorId;
    setAnnouncements((prev) =>
      prev.map((announcement) => {
        if (announcement.id === announcementId) {
          announcementAuthorId = announcement.authorId;
          const comments = announcement.comments || [];
          const newComment = {
            id: Date.now().toString(),
            userId: user.id,
            userName: user.name,
            text,
            timestamp: new Date(),
          };
          return {
            ...announcement,
            comments: [...comments, newComment],
          };
        }
        return announcement;
      }),
    );

    // Add to live activity feed
    addActivity("announcement-comment", "commented on an announcement", "💬");

    // Send notification to announcement author
    if (announcementAuthorId && announcementAuthorId !== user.id) {
      addNotification({
        type: "announcement_comment",
        title: "New comment on your announcement",
        message: `${user.name} commented: "${text.substring(0, 50)}${text.length > 50 ? "..." : ""}"`,
        metadata: {
          announcementId,
          commentedBy: user.name,
          commentText: text,
        },
      });
    }
    setAnnouncementComment("");
    toast.success("Comment added!");
    audio.playClickSound();
  };

  // Edit announcement
  const editAnnouncement = (announcementId, newMessage) => {
    if (!newMessage.trim()) return;
    setAnnouncements((prev) =>
      prev.map((announcement) => {
        if (
          announcement.id === announcementId &&
          announcement.authorId === user.id
        ) {
          return {
            ...announcement,
            message: newMessage,
            editedAt: new Date(),
          };
        }
        return announcement;
      }),
    );
    setIsEditingAnnouncement(false);
    setEditAnnouncementText("");
    toast.success("Announcement updated!");
    audio.playClickSound();
  };

  // Delete announcement
  const deleteAnnouncement = (announcementId) => {
    const announcement = announcements.find((a) => a.id === announcementId);
    if (!announcement || announcement.authorId !== user.id) {
      toast.error("You can only delete your own announcements");
      return;
    }
    setAnnouncements((prev) => prev.filter((a) => a.id !== announcementId));
    setSelectedAnnouncement(null);
    toast.success("Announcement deleted!");
    audio.playClickSound();
  };

  // Handle @mention input
  const handleCommentChange = (e) => {
    const value = e.target.value;
    setAnnouncementComment(value);

    // Check for @ mentions
    const lastAtIndex = value.lastIndexOf("@");
    if (lastAtIndex !== -1) {
      const query = value.substring(lastAtIndex + 1);
      const spaceAfterAt = query.indexOf(" ");
      if (spaceAfterAt === -1) {
        // Still typing the mention
        setMentionQuery(query);
        // Filter team members by query
        const teamMembers = onlineUsers.map((u) => u.name);
        const filtered = teamMembers.filter((name) =>
          name.toLowerCase().includes(query.toLowerCase()),
        );
        setMentionSuggestions(filtered);
        setShowMentionSuggestions(filtered.length > 0 && query.length > 0);
      } else {
        setShowMentionSuggestions(false);
      }
    } else {
      setShowMentionSuggestions(false);
    }
  };

  // Insert mention
  const insertMention = (name) => {
    const lastAtIndex = announcementComment.lastIndexOf("@");
    const beforeMention = announcementComment.substring(0, lastAtIndex);
    const newComment = `${beforeMention}@${name} `;
    setAnnouncementComment(newComment);
    setShowMentionSuggestions(false);
  };

  // Parse mentions in text
  const parseMentions = (text) => {
    const mentionRegex = /@(\w+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: text.substring(lastIndex, match.index),
        });
      }
      // Add mention
      parts.push({
        type: "mention",
        content: match[0],
      });
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: "text",
        content: text.substring(lastIndex),
      });
    }
    return parts;
  };

  // Send Announcement
  const sendAnnouncement = () => {
    if (!announcementText.trim()) return;
    const announcement = {
      message: announcementText,
      timestamp: new Date(),
    };

    // Add to announcements list for "Coming Up" card with the new structure
    const newAnnouncement = {
      id: Date.now().toString(),
      message: announcementText,
      sender: user.name,
      authorId: user.id,
      timestamp: new Date(),
      emoji: "📢",
      priority: "normal",
      category: "general",
      reactions: [],
      comments: [],
    };
    setAnnouncements((prev) => [newAnnouncement, ...prev]);
    setLatestAnnouncement(announcement);
    addActivity("announcement", announcementText, "📢");
    toast.success("📢 Announcement sent to everyone!");
    setAnnouncementText("");
    setShowAnnouncementDialog(false);
    audio.playNotificationSound("info");
    audio.playBellSound();

    // Auto-hide announcement after 30 seconds
    setTimeout(() => {
      setLatestAnnouncement(null);
    }, 30000);
  };

  // Submit Check-in
  const submitCheckIn = () => {
    if (!checkInMessage.trim()) {
      toast.error("Please enter what you're working on today");
      return;
    }
    const checkIn = {
      userId: user.id,
      userName: user.name,
      message: checkInMessage,
      timestamp: new Date(),
    };
    setTeamCheckIns((prev) => [checkIn, ...prev]);
    setHasCheckedInToday(true);
    localStorage.setItem(`office_checkin_${new Date().toDateString()}`, "true");
    addActivity("check-in", `checked in: "${checkInMessage}"`, "✅");
    toast.success("✅ Checked in! Have a great day!");
    setCheckInMessage("");
    setShowCheckInDialog(false);
    audio.playNotificationSound("success");
    audio.playWhooshSound();
  };

  // Start Video Call
  const startVideoCall = async (member, roomId) => {
    try {
      // Check if Google account is connected
      const connected = await isGoogleConnected(user.id);
      if (!connected) {
        toast.error("Please connect your Google account first", {
          description:
            "Enable instant Google Meet links in your Virtual Office",
          duration: 5000,
        });
        setShowGoogleConnectDialog(true);
        return;
      }
      let participants = [];
      let callType = "direct";
      let roomName;
      if (roomId) {
        // Room call
        const room = meetingRooms.find((r) => r.id === roomId);
        if (room) {
          callType = "room";
          roomName = room.name;
          // Add all occupants as participants
          participants = teamMembers
            .filter((m) => room.occupants.includes(m.id))
            .map((m) => ({
              id: m.id,
              name: m.name,
              avatar: m.avatar,
              isMuted: false,
              isVideoOff: false,
              isSpeaking: false,
            }));
        }
      } else if (member) {
        // Direct call
        participants = [
          {
            id: member.id,
            name: member.name,
            avatar: member.avatar,
            isMuted: false,
            isVideoOff: false,
            isSpeaking: false,
          },
        ];
      } else {
        // Team call - add all online team members
        callType = "room";
        roomName = "Team Call";
        participants = teamMembers
          .filter((m) => m.status === "online")
          .slice(0, 3) // Limit to 3 team members
          .map((m) => ({
            id: m.id,
            name: m.name,
            avatar: m.avatar,
            isMuted: false,
            isVideoOff: false,
            isSpeaking: false,
          }));
      }

      // Add current user
      participants.push({
        id: user.id,
        name: user.name,
        avatar: undefined,
        isMuted: false,
        isVideoOff: false,
        isSpeaking: true,
      });
      const targetName = member?.name || roomName || "team";

      // Create Google Meet link
      const loadingToast = toast.loading(
        `Creating meeting with ${targetName}...`,
      );
      const meetingResult = await createInstantGoogleMeet(
        user.id,
        `Virtual Office - ${targetName}`,
      );

      // Dismiss loading toast
      toast.dismiss(loadingToast);
      if (!meetingResult.success || !meetingResult.meetLink) {
        toast.error("Failed to create Google Meet link", {
          description: meetingResult.error || "Please try again",
        });
        return;
      }
      setGoogleMeetLink(meetingResult.meetLink);
      setActiveCallParticipants(participants);
      setActiveCallType(callType);
      setActiveCallRoomName(roomName);
      setIsVideoCallActive(true);
      // Video call starts minimized by default (don't change isVideoMinimized state)

      console.log("📹 Video call started:", {
        participantCount: participants.length,
        callType,
        roomName,
        meetLink: meetingResult.meetLink,
        isVideoCallActive: true,
      });
      addActivity("chat", `started video call with ${targetName}`, "📹");
      toast.success(`📹 Meeting created! Click to join ${targetName}`, {
        duration: 3000,
      });
      audio.playNotificationSound("info");
      audio.playWhooshSound();
    } catch (error) {
      console.error("Error starting video call:", error);
      toast.error("Failed to start video call", {
        description: "An unexpected error occurred",
      });
    }
  };

  // End Video Call
  const endVideoCall = () => {
    try {
      setIsVideoCallActive(false);
      setIsVideoMinimized(false);
      setActiveCallParticipants([]);
      setGoogleMeetLink("");
      addActivity("chat", "ended video call", "📴");
      toast("Call ended");
      audio.playNotificationSound("info");
    } catch (error) {
      console.error("Error ending video call:", error);
      // Still try to clean up state even if there's an error
      setIsVideoCallActive(false);
      setGoogleMeetLink("");
    }
  };

  // Toggle Message Panel
  const toggleMessagePanel = async () => {
    const willOpen = !isMessagePanelOpen;
    setIsMessagePanelOpen(willOpen);

    // Auto-close other panels when opening messages
    if (willOpen) {
      setIsTaskPanelOpen(false);
      setIsTeamHubOpen(false);
      addActivity("panel-open", "opened team chat", "💬");
    } else {
      // When closing, refresh unread count
      try {
        const startupId = getStartupId(user);
        if (startupId) {
          const count = await getUnreadCount(user.id, startupId);
          setUnreadMessagesCount(count);
        }
      } catch (error) {
        console.error("Error refreshing unread count:", error);
      }
    }
  };

  // Toggle Task Panel
  const toggleTaskPanel = () => {
    const willOpen = !isTaskPanelOpen;
    setIsTaskPanelOpen(willOpen);

    // Auto-close other panels when opening tasks
    if (willOpen) {
      setIsMessagePanelOpen(false);
      setIsTeamHubOpen(false);
      addActivity("panel-open", "opened task panel", "🎯");
      audio.playClickSound();
    }
  };
  const toggleTeamHub = () => {
    const willOpen = !isTeamHubOpen;
    setIsTeamHubOpen(willOpen);

    // Auto-close other panels when opening team hub
    if (willOpen) {
      setIsMessagePanelOpen(false);
      setIsTaskPanelOpen(false);
      addActivity("panel-open", "opened updates", "✨");
      audio.playClickSound();
    }
  };

  // Start call from message panel
  const startCallFromMessages = (userId, type) => {
    const member = teamMembers.find((m) => m.id === userId);
    if (member && type === "video") {
      setIsMessagePanelOpen(false);
      startVideoCall(member);
    }
  };

  // Start team call in current room
  const startTeamCall = () => {
    if (currentRoom) {
      startVideoCall(undefined, currentRoom);
    }
  };

  // Handle task completion toggle
  const toggleTaskCompletion = (taskId) => {
    setUpcomingTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id === taskId) {
          const newCompleted = !task.completed;
          if (newCompleted) {
            addActivity(
              "task-complete",
              `completed task: "${task.title}"`,
              "✅",
            );
            toast.success(`✅ Task completed: ${task.title}`);
            audio.playClickSound();
          }
          return {
            ...task,
            completed: newCompleted,
          };
        }
        return task;
      }),
    );
  };

  // Add new task
  const addNewTask = () => {
    setIsTaskPanelOpen(true);
    setOpenTaskAddDialog(true);
    audio.playClickSound();
  };

  // GAMIFICATION FUNCTIONS

  // Check-in Prompt Effect - REMOVED (replaced with interactive tour)
  // Users can still check in manually via ⌘⇧C keyboard shortcut
  // The check-in dialog won't auto-popup anymore to keep the workspace clean
  // useEffect(() => {
  //   const hasCheckedInLocalStorage = localStorage.getItem(`office_checkin_${new Date().toDateString()}`);
  //   if (!hasCheckedInLocalStorage && !hasCheckedInToday) {
  //     setTimeout(() => {
  //       if (!hasCheckedInToday) {
  //         setShowCheckInDialog(true);
  //       }
  //     }, 2000);
  //   }
  // }, [hasCheckedInToday]);

  // First-time Help Tooltip Effect
  useEffect(() => {
    const hasSeenHelp = localStorage.getItem(
      "startupverse_has_seen_keyboard_shortcuts",
    );
    if (!hasSeenHelp) {
      setTimeout(() => {
        setShowHelpTooltip(true);
        // Auto-hide after 8 seconds
        setTimeout(() => {
          setShowHelpTooltip(false);
          localStorage.setItem(
            "startupverse_has_seen_keyboard_shortcuts",
            "true",
          );
        }, 8000);
      }, 3000);
    }
  }, []);

  // Keyboard Shortcuts Effect
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Only trigger if not typing in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Cmd/Ctrl + M - Toggle Messages
      if ((e.metaKey || e.ctrlKey) && e.key === "m") {
        e.preventDefault();
        toggleMessagePanel();
      }

      // Cmd/Ctrl + T - Toggle Tasks
      if ((e.metaKey || e.ctrlKey) && e.key === "t") {
        e.preventDefault();
        toggleTaskPanel();
      }

      // Cmd/Ctrl + H - Toggle Updates (Polls & Announcements)
      if ((e.metaKey || e.ctrlKey) && e.key === "h") {
        e.preventDefault();
        toggleTeamHub();
      }

      // Cmd/Ctrl + C - Toggle Calendar
      if ((e.metaKey || e.ctrlKey) && e.key === "c") {
        e.preventDefault();
        setIsCalendarOpen(!isCalendarOpen);
      }

      // Cmd/Ctrl + K - Start Video Call
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (currentRoom) {
          startTeamCall();
        } else {
          startVideoCall();
        }
      }

      // Cmd/Ctrl + / - Show Status Dialog
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setShowStatusDialog(true);
        toast("Opening status dialog", {
          icon: "⚡",
        });
      }

      // Cmd/Ctrl + Shift + A - Open Updates (Announcements & Polls)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "A") {
        e.preventDefault();
        toggleTeamHub();
      }

      // Cmd/Ctrl + ? - Show Keyboard Shortcuts Help
      if ((e.metaKey || e.ctrlKey) && e.key === "?") {
        e.preventDefault();
        setShowKeyboardShortcuts(true);
        toast("Keyboard shortcuts reference", {
          icon: "⌨��",
        });
      }

      // Cmd/Ctrl + Shift + C - Open Check-in Dialog
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "C") {
        e.preventDefault();
        if (!hasCheckedInToday) {
          setShowCheckInDialog(true);
          toast("Opening daily check-in", {
            icon: "✅",
          });
        } else {
          toast("You've already checked in today! 🎉", {
            icon: "✨",
          });
        }
      }

      // M - Toggle Mute/Unmute
      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        audio.updateSettings({
          isMuted: !audio.settings.isMuted,
        });
        toast(audio.settings.isMuted ? "🔊 Audio unmuted" : "🔇 Audio muted");
        audio.playClickSound();
      }

      // Escape - Close any open overlay/panel
      if (e.key === "Escape") {
        if (isMessagePanelOpen) {
          setIsMessagePanelOpen(false);
        } else if (isTaskPanelOpen) {
          setIsTaskPanelOpen(false);
        } else if (isTeamHubOpen) {
          setIsTeamHubOpen(false);
        } else if (isCalendarOpen) {
          setIsCalendarOpen(false);
        } else if (showKeyboardShortcuts) {
          setShowKeyboardShortcuts(false);
        } else if (showStatusDialog) {
          setShowStatusDialog(false);
        } else if (showCheckInDialog && hasCheckedInToday) {
          setShowCheckInDialog(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    currentRoom,
    isMessagePanelOpen,
    isTaskPanelOpen,
    isTeamHubOpen,
    isCalendarOpen,
    showKeyboardShortcuts,
    showStatusDialog,
    showCheckInDialog,
    hasCheckedInToday,
  ]);

  // Render mobile tab content
  const renderMobileTabContent = () => {
    switch (mobileActiveTab) {
      case "team":
        return (
          <div className="space-y-3 pb-20">
            <Card>
              <CardHeader className="pb-3 pt-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    Team Members
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => setShowInviteDialog(true)}
                    className="h-8 text-xs px-3"
                  >
                    <UserPlus className="w-3.5 h-3.5 mr-1" />
                    Invite
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <div className="grid grid-cols-2 gap-3">
                  {teamMembers.map((member) => (
                    <motion.div
                      key={member.id}
                      initial={{
                        opacity: 0,
                        scale: 0.9,
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                      }}
                      whileHover={{
                        scale: 1.02,
                      }}
                      className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all border-2 border-transparent hover:border-primary/20 group"
                    >
                      <div className="flex flex-col items-center text-center space-y-2">
                        <div className="relative">
                          <Avatar className="w-14 h-14 ring-2 ring-transparent group-hover:ring-primary/30 transition-all">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-medium">
                              {(member.name || "Unknown")
                                .substring(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(member.status)}`}
                          />
                        </div>
                        <div className="w-full">
                          <p className="text-sm font-medium truncate">
                            {member.name || "Unknown User"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {member.role}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] h-5 w-full justify-center ${member.status === "available" ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300" : member.status === "in-meeting" ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300" : member.status === "focus-mode" ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300" : member.status === "on-break" ? "bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
                        >
                          {member.status === "available" && "✓ Available"}
                          {member.status === "in-meeting" && "📞 In Meeting"}
                          {member.status === "focus-mode" && "🎯 Focusing"}
                          {member.status === "on-break" && "☕ On Break"}
                          {member.status === "away" && "Away"}
                        </Badge>
                        {member.currentTask && (
                          <div className="w-full bg-blue-50 dark:bg-blue-950/20 rounded px-2 py-1">
                            <p className="text-[9px] text-blue-700 dark:text-blue-300 font-medium truncate">
                              {"🎯 "}
                              {member.currentTask}
                            </p>
                          </div>
                        )}
                        <div className="flex gap-1 w-full pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Tooltip>
                            <TooltipTrigger asChild={true}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 h-7 text-[10px]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedMessageUserId(member.id);
                                  setIsMessagePanelOpen(true);
                                  toast.success(
                                    `Opening chat with ${member.name}`,
                                  );
                                }}
                              >
                                <MessageCircle className="w-3 h-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-[10px]">
                                {"Message "}
                                {member.name}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild={true}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 h-7 text-[10px]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startCallToMember(member);
                                  toast.success(`Calling ${member.name}...`);
                                }}
                                disabled={
                                  member.status === "in-meeting" ||
                                  member.status === "away"
                                }
                              >
                                <Phone className="w-3 h-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-[10px]">
                                {member.status === "in-meeting" ||
                                member.status === "away"
                                  ? "Unavailable"
                                  : `Call ${member.name}`}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case "activity":
        return (
          <div className="space-y-3 pb-20">
            <Card>
              <CardHeader className="pb-3 pt-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Radio className="w-4 h-4 text-slate-600 dark:text-slate-400 animate-pulse" />
                    Live Activity
                  </CardTitle>
                  <Badge variant="secondary" className="text-[10px] h-5 px-2">
                    Real-time
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <div className="space-y-2">
                  {activityFeed.length === 0 ? (
                    <div className="text-center py-8">
                      <Radio className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                      <p className="text-xs text-muted-foreground">
                        No activity yet
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Team activity will appear here
                      </p>
                    </div>
                  ) : (
                    activityFeed.map((event, index) => (
                      <motion.div
                        key={event.id}
                        initial={{
                          opacity: 0,
                          x: -20,
                        }}
                        animate={{
                          opacity: 1,
                          x: 0,
                        }}
                        transition={{
                          delay: index * 0.05,
                        }}
                        className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          <div className="text-gray-500 flex-shrink-0 mt-0.5">
                            {typeof event.icon === "string" ? event.icon : "📋"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs">
                              <span className="font-medium">
                                {event.userName}
                              </span>{" "}
                              <span className="text-muted-foreground">
                                {event.message}
                              </span>
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {Math.round(
                                (Date.now() - event.timestamp.getTime()) /
                                  60000,
                              )}
                              m ago
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case "updates":
        return (
          <div className="space-y-3 pb-20">
            <Card className="flex flex-col overflow-hidden bg-white dark:bg-gray-950">
              <CardHeader className="pb-2 pt-2.5 px-3 flex-shrink-0 border-b">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CalendarCheck className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xs font-semibold">
                        Team Calendar
                      </CardTitle>
                      <p className="text-[9px] text-muted-foreground">
                        {new Date().toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      onClick={() => {
                        // On mobile, only show the meeting scheduler modal
                        setShowMeetingScheduler(true);
                      }}
                      className="h-7 text-[10px] px-2 bg-primary hover:bg-primary/90"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Schedule
                    </Button>
                    {getAnnouncementsByCategory("wall-of-wins").length > 0 && (
                      <button
                        onClick={() => {
                          setIsTeamHubOpen(true);
                          setSelectedTeamHubTab("wall-of-wins");
                          toast("Opening Wall of Wins", {
                            icon: "🏆",
                          });
                        }}
                        className="relative p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-black/20 transition-colors group"
                        title={`${getAnnouncementsByCategory("wall-of-wins").length} wins to celebrate!`}
                      >
                        <Trophy className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                          <span className="text-[8px] font-bold text-white">
                            {getAnnouncementsByCategory("wall-of-wins").length}
                          </span>
                        </div>
                      </button>
                    )}
                    {getAnnouncementsByCategory("general").length > 0 && (
                      <button
                        onClick={() => {
                          setIsTeamHubOpen(true);
                          setSelectedTeamHubTab("announcements");
                          toast("Opening Announcements", {
                            icon: "📢",
                          });
                        }}
                        className="relative p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-black/20 transition-colors group"
                        title={`${getAnnouncementsByCategory("general").length} new announcements`}
                      >
                        <Megaphone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                          <span className="text-[8px] font-bold text-white">
                            {getAnnouncementsByCategory("general").length}
                          </span>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-hidden">
                <ScrollArea className="h-full max-h-[500px]">
                  <div className="p-3 space-y-3">
                    <div className="flex flex-col">
                      <div className="grid grid-cols-7 gap-1">
                        {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                          <div
                            key={i}
                            className="text-center text-[9px] font-bold text-muted-foreground pb-1"
                          >
                            {day}
                          </div>
                        ))}
                        {(() => {
                          const today = new Date();
                          const currentMonth = today.getMonth();
                          const currentYear = today.getFullYear();
                          const firstDay = new Date(
                            currentYear,
                            currentMonth,
                            1,
                          ).getDay();
                          const daysInMonth = new Date(
                            currentYear,
                            currentMonth + 1,
                            0,
                          ).getDate();
                          const days = [];
                          for (let i = 0; i < firstDay; i++) {
                            days.push(
                              <div
                                key={`empty-${i}`}
                                className="aspect-square"
                              />,
                            );
                          }
                          for (let day = 1; day <= daysInMonth; day++) {
                            const date = new Date(
                              currentYear,
                              currentMonth,
                              day,
                            );
                            const isToday = day === today.getDate();
                            const dateStr = date.toISOString().split("T")[0];

                            // Show agenda items on calendar
                            const dayItems = agendaItems.filter((item) => {
                              const itemDate = (
                                item.date ||
                                item.dueDate ||
                                ""
                              ).split("T")[0];
                              return itemDate === dateStr;
                            });
                            const hasEvents = dayItems.length > 0;
                            days.push(
                              <button
                                key={day}
                                onClick={() => {
                                  if (hasEvents) {
                                    const itemsText =
                                      dayItems.length === 1
                                        ? "1 item"
                                        : `${dayItems.length} items`;
                                    toast(
                                      `${itemsText} scheduled on this day`,
                                      {
                                        icon: "📅",
                                      },
                                    );
                                  }
                                }}
                                className={cn(
                                  "aspect-square text-[10px] rounded-md flex items-center justify-center relative transition-all font-medium",
                                  isToday &&
                                    "bg-primary text-primary-foreground font-bold shadow-md ring-2 ring-primary/20",
                                  !isToday &&
                                    hasEvents &&
                                    "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50",
                                  !isToday &&
                                    !hasEvents &&
                                    "hover:bg-muted/50 text-foreground/70",
                                )}
                              >
                                {day}
                                {hasEvents && !isToday && (
                                  <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-purple-500" />
                                )}
                              </button>,
                            );
                          }
                          return days;
                        })()}
                      </div>
                    </div>
                    <div className="flex flex-col bg-blue-50 dark:bg-blue-950/20 rounded-lg p-2.5">
                      <div className="overflow-hidden -m-2.5 -mb-2.5">
                        {agendaLoading ? (
                          <div className="text-center py-6 text-muted-foreground">
                            <p className="text-[9px] font-medium">
                              Loading agenda...
                            </p>
                          </div>
                        ) : (
                          <AgendaPanel
                            user={user}
                            onItemClick={(item) => {
                              console.log(
                                "Mobile team calendar agenda item clicked:",
                                item,
                              );
                              if (item.type === "task") {
                                setIsTaskPanelOpen(true);
                                setActivePanel("tasks");
                              } else if (item.type === "meeting") {
                                toast(`Meeting: ${item.title}`, {
                                  icon: "📹",
                                });
                              }
                            }}
                            compact={true}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        );
      case "more":
        return (
          <div className="space-y-3 pb-20">
            <Card>
              <CardHeader className="pb-3 pt-3">
                <CardTitle className="text-sm">More Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    key="action-change-status"
                    variant="outline"
                    className="h-20 flex flex-col gap-2 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 border-indigo-200 dark:border-indigo-800"
                    onClick={() => setShowStatusDialog(true)}
                  >
                    <span className="text-xs font-medium">Change Status</span>
                  </Button>
                  <Button
                    key="action-invite-team"
                    variant="outline"
                    className="h-20 flex flex-col gap-2 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 border-pink-200 dark:border-pink-800"
                    onClick={() => setShowInviteDialog(true)}
                  >
                    <span className="text-xs font-medium">Invite Team</span>
                  </Button>
                  <Button
                    key="action-checkin"
                    variant="outline"
                    className="h-20 flex flex-col gap-2 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800"
                    onClick={() => setShowCheckInDialog(true)}
                  >
                    <span className="text-xs font-medium">Check-in</span>
                  </Button>
                  <Button
                    key="action-help"
                    variant="outline"
                    className="h-20 flex flex-col gap-2 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900 border-teal-200 dark:border-teal-800"
                    onClick={() => setShowKeyboardShortcuts(true)}
                  >
                    <HelpCircle className="w-5 h-5" />
                    <span className="text-xs font-medium">Help</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3 pt-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Office Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <Music className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Background Audio</p>
                      <p className="text-xs text-muted-foreground">
                        Ambient sounds
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={audio.isPlaying}
                    onCheckedChange={() =>
                      audio.isPlaying ? audio.stop() : audio.play()
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Live Activity</p>
                      <p className="text-xs text-muted-foreground">
                        Real-time updates
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={officeSettings.settings.showActivityFeed}
                    onCheckedChange={(checked) =>
                      officeSettings.updateSettings({
                        showActivityFeed: checked,
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3 pt-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Circle className={`w-3 h-3 ${getStatusColor(myStatus)}`} />
                  Your Status
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Current:
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {myStatus === "available" && "🟢 Available"}
                      {myStatus === "in-meeting" && "🔴 In Meeting"}
                      {myStatus === "focus-mode" && "🟡 Focus Mode"}
                      {myStatus === "on-break" && "☕ On Break"}
                      {myStatus === "away" && "⚫ Away"}
                    </Badge>
                  </div>
                  {myStatusMessage && (
                    <div className="p-2 bg-muted/50 rounded text-xs">
                      "{myStatusMessage}"
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };
  return (
    <>
      <div className="relative min-h-screen">
        {officeSettings.settings.showActivityFeed && (
          <div className="hidden lg:block">
            <LiveActivityFeed activities={activityFeed} showPopups={true} />
          </div>
        )}
        {officeSettings.settings.showActivityFeed && (
          <div className="lg:hidden">
            <LiveActivityFeed activities={activityFeed} showPopups={true} />
          </div>
        )}
        <div className="lg:hidden">
          <div className="p-3 space-y-3 min-h-screen bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30 dark:from-blue-950/30 dark:via-purple-950/20 dark:to-pink-950/30 pt-4 pb-2">
            <motion.div
              initial={{
                opacity: 0,
                y: -20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="relative overflow-hidden rounded-xl bg-[#3A5AFE] dark:bg-[#304FFE] p-4 text-white"
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h1 className="text-white m-0 text-base font-medium">
                      {greeting.greeting}
                      {", "}
                      {user.name}
                      {"! "}
                      {greeting.icon}
                    </h1>
                    <p className="text-white/90 text-xs mt-1">
                      {greeting.message}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowStatusDialog(true)}
                    className="h-8 text-xs bg-white/20 hover:bg-white/30 text-white border-white/30 px-3"
                  >
                    Status
                  </Button>
                </div>
                <Badge className="bg-white/20 text-white border-white/30 text-xs h-5 px-2">
                  <Users className="w-3 h-3 mr-1" />
                  {teamMembers.filter((m) => m.status !== "away").length}
                  {" online"}
                </Badge>
              </div>
            </motion.div>
            <motion.div
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.1,
              }}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 shadow-sm relative z-10"
            >
              <div className="grid grid-cols-4 gap-1.5">
                <Button
                  key="mobile-action-call"
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Team Call button clicked!");
                    toast.success("📹 Starting team call...");
                    startVideoCall();
                  }}
                  className="h-7 text-[10px] px-1 cursor-pointer touch-manipulation active:scale-95"
                >
                  <Video className="w-3 h-3" />
                  Call
                </Button>
                <Button
                  key="mobile-action-chat"
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Chat button clicked!");
                    toggleMessagePanel();
                  }}
                  className="h-7 text-[10px] px-1 cursor-pointer touch-manipulation active:scale-95 relative"
                >
                  <MessageCircle className="w-3 h-3" />
                  Chat
                  {unreadMessagesCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-medium rounded-full w-4 h-4 flex items-center justify-center">
                      {unreadMessagesCount}
                    </span>
                  )}
                </Button>
                <Button
                  key="mobile-action-tasks"
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleTaskPanel();
                  }}
                  className="h-7 text-[10px] px-1 cursor-pointer touch-manipulation active:scale-95 relative"
                >
                  <Target className="w-3 h-3" />
                  Tasks
                  {upcomingTasks.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-medium rounded-full w-4 h-4 flex items-center justify-center">
                      {upcomingTasks.length}
                    </span>
                  )}
                </Button>
                <Button
                  key="mobile-action-updates"
                  size="sm"
                  variant={isTeamHubOpen ? "default" : "outline"}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Updates button clicked!");
                    toggleTeamHub();
                  }}
                  className="h-7 text-[10px] px-1 cursor-pointer touch-manipulation active:scale-95"
                >
                  <Sparkles className="w-3 h-3" />
                  Updates
                </Button>
              </div>
            </motion.div>
            {renderMobileTabContent()}
          </div>
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-border shadow-lg z-50 pb-safe">
            <div className="grid grid-cols-4 h-16">
              <button
                key="mobile-nav-team"
                onClick={() => setMobileActiveTab("team")}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${mobileActiveTab === "team" ? "text-primary bg-primary/5" : "text-muted-foreground"}`}
              >
                <Users className="w-5 h-5" />
                <span className="text-[10px] font-medium">Home</span>
              </button>
              <button
                key="mobile-nav-activity"
                onClick={() => setMobileActiveTab("activity")}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${mobileActiveTab === "activity" ? "text-primary bg-primary/5" : "text-muted-foreground"}`}
              >
                <Radio className="w-5 h-5" />
                <span className="text-[10px] font-medium">Activity</span>
              </button>
              <button
                key="mobile-nav-updates"
                onClick={() => setMobileActiveTab("updates")}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${mobileActiveTab === "updates" ? "text-primary bg-primary/5" : "text-muted-foreground"}`}
              >
                <Calendar className="w-5 h-5" />
                <span className="text-[10px] font-medium">Calendar</span>
              </button>
              <button
                key="mobile-nav-more"
                onClick={() => setMobileActiveTab("more")}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${mobileActiveTab === "more" ? "text-primary bg-primary/5" : "text-muted-foreground"}`}
              >
                <Settings className="w-5 h-5" />
                <span className="text-[10px] font-medium">More</span>
              </button>
            </div>
          </div>
        </div>
        <div className="hidden lg:block p-1.5 space-y-2.5 min-h-screen bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30 dark:from-blue-950/30 dark:via-purple-950/20 dark:to-pink-950/30 pt-2">
          <motion.div
            initial={{
              opacity: 0,
              y: -20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="relative overflow-hidden rounded-lg bg-[#3A5AFE] dark:bg-[#304FFE] p-2 text-white mx-2.5"
          >
            <div className="relative z-10">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h1 className="text-white m-0 text-sm">
                      {greeting.greeting}
                      {", "}
                      {user.name}
                      {"! "}
                      {greeting.icon}
                    </h1>
                    <Badge className="bg-white/20 text-white border-white/30 text-[9px] h-3.5 px-1">
                      {teamMembers.filter((m) => m.status !== "away").length}
                      {" teammates online"}
                    </Badge>
                  </div>
                  <p className="text-white/90 text-[10px]">
                    {greeting.message}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowStatusDialog(true)}
                    className="h-5 text-[9px] bg-white/20 hover:bg-white/30 text-white border-white/30 px-1.5"
                  >
                    {myStatus.replace("-", " ")}
                  </Button>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIgZmlsbD0id2hpdGUiLz48L3N2Zz4=')]" />
            </div>
          </motion.div>
          <AnimatePresence>
            {currentRoom && (
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.95,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.95,
                }}
              >
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border border-blue-300 dark:border-blue-700">
                  <CardContent className="p-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <motion.div
                          className="text-base"
                          animate={{
                            rotate: [0, 10, -10, 0],
                          }}
                          transition={{
                            duration: 0.5,
                            repeat: Infinity,
                            repeatDelay: 3,
                          }}
                        >
                          {meetingRooms.find((r) => r.id === currentRoom)?.icon}
                        </motion.div>
                        <div>
                          <div className="flex items-center gap-1 mb-0.5">
                            <h3 className="text-blue-900 dark:text-blue-100 text-[10px]">
                              {"You're in: "}
                              {
                                meetingRooms.find((r) => r.id === currentRoom)
                                  ?.name
                              }
                            </h3>
                            <Badge
                              variant="secondary"
                              className="text-[8px] h-3 px-1"
                            >
                              <Activity className="w-1.5 h-1.5 mr-0.5 animate-pulse" />
                              {
                                meetingRooms.find((r) => r.id === currentRoom)
                                  ?.occupants.length
                              }
                              {" here"}
                            </Badge>
                          </div>
                          <p className="text-[9px] text-muted-foreground">
                            {meetingRooms.find((r) => r.id === currentRoom)
                              ?.type === "social"
                              ? "💬 Perfect for casual conversations"
                              : meetingRooms.find((r) => r.id === currentRoom)
                                    ?.type === "focus"
                                ? "🎧 Quiet space for deep work"
                                : "🎯 Great for team meetings"}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={startTeamCall}
                          className="h-5 text-[9px] px-1.5"
                        >
                          <Video className="w-2.5 h-2.5 mr-1" />
                          Start Call
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={leaveRoom}
                          className="h-5 text-[9px] px-1.5"
                        >
                          <DoorOpen className="w-2.5 h-2.5 mr-1" />
                          Leave
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {latestAnnouncement && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -20,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: -20,
                }}
              >
                <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950 dark:to-yellow-950 border border-orange-300 dark:border-orange-700">
                  <CardContent className="p-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-1">
                        <motion.div
                          animate={{
                            scale: [1, 1.2, 1],
                          }}
                          transition={{
                            duration: 0.5,
                            repeat: Infinity,
                            repeatDelay: 2,
                          }}
                          className="text-sm"
                        >
                          📢
                        </motion.div>
                        <div className="flex-1">
                          <p className="text-[10px] font-medium text-orange-900 dark:text-orange-100">
                            {latestAnnouncement.message}
                          </p>
                          <p className="text-[9px] text-orange-700 dark:text-orange-300">
                            Team Announcement • Just now
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-4 w-4 p-0"
                        onClick={() => setLatestAnnouncement(null)}
                      >
                        <X className="w-2 h-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div
            initial={{
              opacity: 0,
              y: -10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-1.5 elevation-1 mx-2.5"
          >
            <div className="flex items-center gap-1 flex-wrap justify-between">
              <div className="flex items-center gap-1 flex-wrap">
                <Tooltip>
                  <TooltipTrigger asChild={true}>
                    <Button
                      data-tour="video-call-button"
                      size="sm"
                      variant="secondary"
                      onClick={() => startVideoCall()}
                      className="h-5 text-[10px] px-2"
                    >
                      <Video className="w-3 h-3 mr-1" />
                      Team Call
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {"Start a team video call �� "}
                    <kbd className="px-1 py-0.5 bg-black/20 rounded">⌘K</kbd>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild={true}>
                    <Button
                      data-tour="messages-button"
                      size="sm"
                      variant="secondary"
                      onClick={toggleMessagePanel}
                      className="h-5 text-[10px] px-2 relative"
                    >
                      <MessageCircle className="w-3 h-3 mr-1" />
                      Chat
                      {unreadMessagesCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 text-[8px] px-1.5 py-0.5 h-4 min-w-[16px] bg-red-500 text-white rounded-full flex items-center justify-center font-medium">
                          {unreadMessagesCount}
                        </span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {"Open messages panel • "}
                    <kbd className="px-1 py-0.5 bg-black/20 rounded">⌘M</kbd>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild={true}>
                    <Button
                      data-tour="tasks-button"
                      size="sm"
                      variant="secondary"
                      onClick={toggleTaskPanel}
                      className="h-5 text-[10px] px-2 relative"
                    >
                      <Target className="w-3 h-3 mr-1" />
                      Tasks
                      {upcomingTasks.length > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 text-[8px] px-1.5 py-0.5 h-4 min-w-[16px] bg-red-500 text-white rounded-full flex items-center justify-center font-medium">
                          {upcomingTasks.length}
                        </span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {"Manage tasks & projects • "}
                    <kbd className="px-1 py-0.5 bg-black/20 rounded">⌘T</kbd>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild={true}>
                    <Button
                      size="sm"
                      variant={isCalendarOpen ? "default" : "secondary"}
                      onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                      className="h-5 text-[10px] px-2"
                    >
                      <Calendar className="w-3 h-3 mr-1" />
                      Calendar
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {"Schedule & Meetings • "}
                    <kbd className="px-1 py-0.5 bg-black/20 rounded">⌘C</kbd>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild={true}>
                    <Button
                      data-tour="team-hub-button"
                      size="sm"
                      variant={isTeamHubOpen ? "default" : "secondary"}
                      onClick={toggleTeamHub}
                      className="h-5 text-[10px] px-2"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      Updates
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {"Polls & Announcements • "}
                    <kbd className="px-1 py-0.5 bg-black/20 rounded">⌘H</kbd>
                  </TooltipContent>
                </Tooltip>
              </div>
              <button
                data-tour="office-settings"
                onClick={() => {
                  setShowKeyboardShortcuts(true);
                  setShowHelpTooltip(false);
                  localStorage.setItem(
                    "startupverse_has_seen_keyboard_shortcuts",
                    "true",
                  );
                }}
                className="hidden md:flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 rounded-md border border-indigo-200 dark:border-indigo-700 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900 dark:hover:to-purple-900 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all cursor-pointer relative group"
              >
                <HelpCircle className="w-2.5 h-2.5 text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300" />
                <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-medium">
                  Shortcuts
                </span>
                <kbd className="ml-0.5 px-1 py-0.5 bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 rounded text-[9px] font-mono text-indigo-600 dark:text-indigo-400">
                  ⌘?
                </kbd>
                {showHelpTooltip && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
                  </span>
                )}
              </button>
            </div>
          </motion.div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-2.5 px-2.5">
            <div className="lg:col-span-1 lg:row-start-1 space-y-1.5">
              <Card className="h-[300px] flex flex-col">
                <CardHeader className="pb-1.5 pt-1.5 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-1 text-[10px]">
                      <Radio className="w-2.5 h-2.5 text-purple-600 animate-pulse" />
                      Live Activity
                    </CardTitle>
                    <Badge variant="secondary" className="text-[8px] h-3 px-1">
                      Real-time
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-1.5 flex-1 overflow-hidden">
                  <ScrollArea className="h-full pr-1.5">
                    {activityFeed.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <Radio className="w-6 h-6 text-muted-foreground mb-1.5 opacity-50" />
                        <p className="text-[9px] text-muted-foreground">
                          No activity yet
                        </p>
                        <p className="text-[8px] text-muted-foreground mt-0.5">
                          Team activity will appear here
                        </p>
                      </div>
                    ) : (
                      <AnimatePresence mode="popLayout">
                        {activityFeed.map((event, index) => (
                          <motion.div
                            key={event.id}
                            initial={{
                              opacity: 0,
                              x: -20,
                              scale: 0.9,
                            }}
                            animate={{
                              opacity: 1,
                              x: 0,
                              scale: 1,
                            }}
                            exit={{
                              opacity: 0,
                              x: 20,
                              scale: 0.9,
                            }}
                            transition={{
                              delay: index * 0.05,
                            }}
                            className="mb-1 p-1 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-start gap-1">
                              <div className="text-gray-500 flex-shrink-0 mt-0.5 text-xs">
                                {typeof event.icon === "string"
                                  ? event.icon
                                  : "📋"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[9px]">
                                  <span className="font-medium">
                                    {event.userName}
                                  </span>{" "}
                                  <span className="text-muted-foreground">
                                    {event.message}
                                  </span>
                                </p>
                                <p className="text-[8px] text-muted-foreground mt-0.5">
                                  {Math.round(
                                    (Date.now() - event.timestamp.getTime()) /
                                      60000,
                                  )}
                                  m ago
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-2 lg:row-start-1 space-y-1.5">
              <Card className="h-[300px] flex flex-col">
                <CardHeader className="pb-1.5 pt-1.5 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-1 text-[10px]">
                      <Users className="w-2.5 h-2.5 text-gray-500" />
                      Team Grid View
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => setShowInviteDialog(true)}
                        className="h-5 text-[9px] px-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                      >
                        <UserPlus className="w-2 h-2 mr-0.5" />
                        Invite Team
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-1.5 flex-1 overflow-hidden">
                  <ScrollArea className="h-full pr-2">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {teamMembers.map((member) => (
                        <motion.div
                          key={member.id}
                          initial={{
                            opacity: 0,
                            scale: 0.9,
                          }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                          }}
                          whileHover={{
                            scale: 1.02,
                          }}
                          className="p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                          <div className="flex flex-col items-center text-center space-y-1.5">
                            <div className="relative">
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={member.avatar} />
                                <AvatarFallback>
                                  {(member.name || "Unknown")
                                    .substring(0, 2)
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div
                                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${getStatusColor(member.status)}`}
                              />
                            </div>
                            <div className="w-full">
                              <p className="text-[10px] font-medium truncate">
                                {member.name || "Unknown User"}
                              </p>
                              <p className="text-[9px] text-muted-foreground">
                                {member.role}
                              </p>
                            </div>
                            <Badge
                              variant="secondary"
                              className="text-[9px] h-4"
                            >
                              {member.status.replace("-", " ")}
                            </Badge>
                            {member.id !== user.id && (
                              <div className="flex gap-0.5 w-full">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 h-5 text-[9px] px-1"
                                  onClick={() => {
                                    toast.success(
                                      `👋 Waved at ${member.name}!`,
                                    );
                                  }}
                                >
                                  <Hand className="w-2.5 h-2.5 text-gray-500" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 h-5 text-[9px] px-1"
                                  onClick={() => {
                                    setSelectedMessageUserId(member.id);
                                    setIsMessagePanelOpen(true);
                                    toast.success(
                                      `Opening chat with ${member.name}`,
                                    );
                                  }}
                                >
                                  <MessageCircle className="w-2.5 h-2.5 text-gray-500" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-1 lg:row-start-1 space-y-2">
              <Card className="overflow-hidden">
                <CardHeader className="py-2 px-3 border-b">
                  <CardTitle className="text-xs font-semibold">
                    Live Presence
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2 px-3 space-y-2">
                  <PresenceBar users={onlineUsers} />
                  <div className="max-h-[160px] overflow-auto space-y-1">
                    {onlineUsers.map((member) => (
                      <div
                        key={`presence-${member.id}`}
                        className="rounded-md border p-2 text-[10px] space-y-0.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{member.name}</span>
                          <Badge variant="secondary" className="text-[9px] h-4">
                            {member.status.replace("-", " ")}
                          </Badge>
                        </div>
                        <div className="text-muted-foreground">
                          {member.role || "team-member"}
                        </div>
                        <div className="text-muted-foreground">
                          Last seen {formatTimeAgo(member.lastSeenAt)}
                        </div>
                        {member.statusText && (
                          <div className="italic text-muted-foreground">
                            "{member.statusText}"
                          </div>
                        )}
                        {member.mood && (
                          <div className="text-muted-foreground">
                            Mood: {getMoodEmoji(member.mood)} {member.mood}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <TeamEnergyPulse users={onlineUsers} />
            </div>
            <div className="lg:col-span-3 lg:row-start-2">
              <Card className="h-[280px] flex flex-col overflow-hidden bg-white dark:bg-gray-950">
                <CardHeader className="py-1 px-2.5 flex-shrink-0 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CalendarCheck className="w-3 h-3 text-primary" />
                      <CardTitle className="text-[10px] font-semibold">
                        Team Calendar
                      </CardTitle>
                      <span className="text-[8px] text-muted-foreground">
                        {new Date().toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsCalendarOpen(true)}
                        className="h-6 text-[9px] px-2 bg-primary/10 hover:bg-primary/20 text-primary"
                      >
                        <Plus className="w-2.5 h-2.5 mr-1" />
                        Schedule
                      </Button>
                      {getAnnouncementsByCategory("wall-of-wins").length >
                        0 && (
                        <button
                          onClick={() => {
                            setIsTeamHubOpen(true);
                            setSelectedTeamHubTab("wall-of-wins");
                            toast("Opening Wall of Wins", {
                              icon: "🏆",
                            });
                          }}
                          className="relative p-0.5 rounded hover:bg-white/50 dark:hover:bg-black/20 transition-colors group"
                          title={`${getAnnouncementsByCategory("wall-of-wins").length} wins to celebrate!`}
                        >
                          <Trophy className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
                          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-yellow-500 rounded-full flex items-center justify-center animate-pulse shadow-sm">
                            <span className="text-[6px] font-bold text-white">
                              {
                                getAnnouncementsByCategory("wall-of-wins")
                                  .length
                              }
                            </span>
                          </div>
                        </button>
                      )}
                      {getAnnouncementsByCategory("general").length > 0 && (
                        <button
                          onClick={() => {
                            setIsTeamHubOpen(true);
                            setSelectedTeamHubTab("announcements");
                            toast("Opening Announcements", {
                              icon: "📢",
                            });
                          }}
                          className="relative p-0.5 rounded hover:bg-white/50 dark:hover:bg-black/20 transition-colors group"
                          title={`${getAnnouncementsByCategory("general").length} new announcements`}
                        >
                          <Megaphone className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center animate-pulse shadow-sm">
                            <span className="text-[6px] font-bold text-white">
                              {getAnnouncementsByCategory("general").length}
                            </span>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-hidden">
                  <div className="p-2 h-full grid grid-cols-1 md:grid-cols-[180px_1px_1fr] gap-2">
                    <div className="flex flex-col h-full bg-muted/30 rounded-lg p-2">
                      <div className="grid grid-cols-7 auto-rows-fr gap-1 h-full">
                        {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                          <div
                            key={i}
                            className="text-center text-[9px] font-bold text-muted-foreground pb-1"
                          >
                            {day}
                          </div>
                        ))}
                        {(() => {
                          const today = new Date();
                          const currentMonth = today.getMonth();
                          const currentYear = today.getFullYear();
                          const firstDay = new Date(
                            currentYear,
                            currentMonth,
                            1,
                          ).getDay();
                          const daysInMonth = new Date(
                            currentYear,
                            currentMonth + 1,
                            0,
                          ).getDate();
                          const days = [];

                          // Add empty cells for days before month starts
                          for (let i = 0; i < firstDay; i++) {
                            days.push(<div key={`empty-${i}`} />);
                          }

                          // Show all days of the month (card is now scrollable)
                          for (let day = 1; day <= daysInMonth; day++) {
                            const date = new Date(
                              currentYear,
                              currentMonth,
                              day,
                            );
                            const isToday = day === today.getDate();
                            const dateStr = date.toISOString().split("T")[0];

                            // Show agenda items on calendar
                            const dayItems = agendaItems.filter((item) => {
                              const itemDate = (
                                item.date ||
                                item.dueDate ||
                                ""
                              ).split("T")[0];
                              return itemDate === dateStr;
                            });
                            const hasEvents = dayItems.length > 0;
                            days.push(
                              <button
                                key={day}
                                onClick={() => {
                                  if (hasEvents) {
                                    const itemsText =
                                      dayItems.length === 1
                                        ? "1 item"
                                        : `${dayItems.length} items`;
                                    toast(
                                      `${itemsText} scheduled on this day`,
                                      {
                                        icon: "📅",
                                      },
                                    );
                                  }
                                }}
                                className={cn(
                                  "w-full h-full text-[10px] rounded-md flex items-center justify-center relative transition-all font-medium",
                                  isToday &&
                                    "bg-primary text-primary-foreground font-bold shadow-md ring-2 ring-primary/20",
                                  !isToday &&
                                    hasEvents &&
                                    "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50",
                                  !isToday &&
                                    !hasEvents &&
                                    "hover:bg-muted/50 text-foreground/70",
                                )}
                              >
                                {day}
                                {hasEvents && !isToday && (
                                  <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-purple-500" />
                                )}
                              </button>,
                            );
                          }
                          return days;
                        })()}
                      </div>
                    </div>
                    <div className="hidden md:block bg-border" />
                    <div className="overflow-auto bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <div className="p-2.5 md:-m-0.5 min-h-full flex flex-col">
                        <div className="flex-1">
                          {agendaLoading ? (
                            <div className="text-center py-6 text-muted-foreground">
                              <p className="text-[9px] font-medium">
                                Loading agenda...
                              </p>
                            </div>
                          ) : (
                            <AgendaPanel
                              user={user}
                              onItemClick={(item) => {
                                console.log(
                                  "Team calendar agenda item clicked:",
                                  item,
                                );
                                if (item.type === "task") {
                                  setIsTaskPanelOpen(true);
                                  setActivePanel("tasks");
                                } else if (item.type === "meeting") {
                                  toast(`Meeting: ${item.title}`, {
                                    icon: "📹",
                                  });
                                }
                              }}
                              compact={true}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-1 lg:row-start-2">
              <Card className="h-[280px] flex flex-col">
                <CardHeader className="pb-1.5 pt-1.5 flex-shrink-0">
                  <CardTitle className="text-[10px] flex items-center gap-1">
                    <Target className="w-2.5 h-2.5 text-gray-500" />
                    Your Tasks
                    {upcomingTasks.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-auto text-[8px] px-1 py-0"
                      >
                        {upcomingTasks.length}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-1.5 flex-1 overflow-hidden">
                  <ScrollArea className="h-full pr-1.5">
                    <div className="space-y-1">
                      {upcomingTasks.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          <Target className="w-6 h-6 mx-auto mb-1.5 opacity-30" />
                          <p className="text-[9px]">No tasks yet</p>
                          <p className="text-[8px]">
                            Create your first task to get started
                          </p>
                        </div>
                      ) : (
                        upcomingTasks.map((task) => (
                          <motion.div
                            key={task.id}
                            className="p-1 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                            initial={{
                              opacity: 0,
                              y: 10,
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                            }}
                            whileHover={{
                              scale: 1.01,
                            }}
                            onClick={() => {
                              setIsTaskPanelOpen(true);
                              audio.playClickSound();
                            }}
                          >
                            <div className="flex items-start gap-1">
                              <div className="flex-1 min-w-0">
                                <p className="text-[9px] font-medium line-clamp-1">
                                  {task.title}
                                </p>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <p className="text-[8px] text-muted-foreground">
                                    {task.time}
                                  </p>
                                  {task.status === "in-progress" && (
                                    <Badge
                                      variant="outline"
                                      className="text-[7px] px-0.5 py-0 h-3"
                                    >
                                      In Progress
                                    </Badge>
                                  )}
                                  {task.priority === "blocked" && (
                                    <Badge
                                      variant="destructive"
                                      className="text-[7px] px-0.5 py-0 h-3"
                                    >
                                      Blocked
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {task.status === "in-progress" ? (
                                <Circle className="w-2.5 h-2.5 text-blue-500 flex-shrink-0 fill-blue-500/20" />
                              ) : (
                                <Circle className="w-2.5 h-2.5 text-gray-400 flex-shrink-0" />
                              )}
                            </div>
                          </motion.div>
                        ))
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-5 text-[9px] mt-0.5 px-1.5"
                        onClick={addNewTask}
                      >
                        <Plus className="w-2 h-2 mr-0.5" />
                        Add Task
                      </Button>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
          <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Your Status</DialogTitle>
                <DialogDescription>
                  Let your team know what you're up to
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-3">
                  <Label>Status</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      key="status-available"
                      variant={myStatus === "available" ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateMyStatus("available", myStatusMessage)}
                      className="justify-start"
                    >
                      <Circle className="w-2 h-2 mr-2 bg-green-500" />
                      Available
                    </Button>
                    <Button
                      key="status-in-meeting"
                      variant={
                        myStatus === "in-meeting" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => updateMyStatus("in-meeting", myStatusMessage)}
                      className="justify-start"
                    >
                      <Circle className="w-2 h-2 mr-2 bg-red-500" />
                      In Meeting
                    </Button>
                    <Button
                      key="status-focus-mode"
                      variant={
                        myStatus === "focus-mode" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => updateMyStatus("focus-mode", myStatusMessage)}
                      className="justify-start"
                    >
                      <Circle className="w-2 h-2 mr-2 bg-purple-500" />
                      Focus Mode
                    </Button>
                    <Button
                      key="status-on-break"
                      variant={myStatus === "on-break" ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateMyStatus("on-break", myStatusMessage)}
                      className="justify-start"
                    >
                      <Circle className="w-2 h-2 mr-2 bg-yellow-500" />
                      On Break
                    </Button>
                    <Button
                      key="status-away"
                      variant={myStatus === "away" ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateMyStatus("away", myStatusMessage)}
                      className="justify-start col-span-2"
                    >
                      <Circle className="w-2 h-2 mr-2 bg-gray-400" />
                      Away
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status-message">
                    Status Message (Optional)
                  </Label>
                  <Input
                    id="status-message"
                    placeholder="e.g., In deep work until 3pm, Back soon, Happy to help!"
                    value={myStatusMessage}
                    onChange={(e) => setMyStatusMessage(e.target.value)}
                  />
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-xs text-blue-900 dark:text-blue-100">
                    <strong>💡 Tip:</strong>
                    {
                      " Your status appears in the Team Grid and helps teammates know if you're available!"
                    }
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your team
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Email Address *</Label>
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    value={inviteForm.email}
                    onChange={(e) =>
                      setInviteForm({
                        ...inviteForm,
                        email: e.target.value,
                      })
                    }
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Role *</Label>
                    <Input
                      placeholder="e.g. Developer"
                      value={inviteForm.role}
                      onChange={(e) =>
                        setInviteForm({
                          ...inviteForm,
                          role: e.target.value,
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Department</Label>
                    <Input
                      placeholder="e.g. Engineering"
                      value={inviteForm.department}
                      onChange={(e) =>
                        setInviteForm({
                          ...inviteForm,
                          department: e.target.value,
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Work Type</Label>
                  <Select
                    value={inviteForm.workType}
                    onValueChange={(v) =>
                      setInviteForm({
                        ...inviteForm,
                        workType: v,
                      })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="office">Office</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Personal Message (Optional)</Label>
                  <Textarea
                    placeholder="Add a personal note to your invitation..."
                    value={inviteForm.message}
                    onChange={(e) =>
                      setInviteForm({
                        ...inviteForm,
                        message: e.target.value,
                      })
                    }
                    className="mt-1 h-20"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleSendInvitation}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4 mr-1" />
                    Send Invitation
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowInviteDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showCheckInDialog} onOpenChange={setShowCheckInDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Good morning! Check in for today</DialogTitle>
                <DialogDescription>
                  Let your team know what you're working on
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="checkin">
                    What are you working on today?
                  </Label>
                  <Textarea
                    id="checkin"
                    placeholder="e.g., Building the new authentication API, Designing landing page v2, Planning Q4 roadmap"
                    value={checkInMessage}
                    onChange={(e) => setCheckInMessage(e.target.value)}
                    rows={3}
                    className="mt-2"
                  />
                </div>
                {teamCheckIns.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">
                      Team Check-ins Today
                    </Label>
                    <ScrollArea className="h-32">
                      <div className="space-y-2">
                        {teamCheckIns.slice(0, 3).map((checkIn, idx) => (
                          <div
                            key={`checkin-${checkIn.userId}-${idx}`}
                            className="p-2 bg-muted/50 rounded-lg"
                          >
                            <p className="text-xs font-medium">
                              {checkIn.userName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {checkIn.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
                <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-xs text-blue-900 dark:text-blue-100">
                    <strong>💡 Tip:</strong>
                    {
                      " Daily check-ins help the team stay aligned and spot where help is needed!"
                    }
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowCheckInDialog(false)}
                  >
                    Skip
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={submitCheckIn}
                    disabled={!checkInMessage.trim()}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Check In
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog
            open={showKeyboardShortcuts}
            onOpenChange={setShowKeyboardShortcuts}
          >
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  Keyboard Shortcuts
                </DialogTitle>
                <DialogDescription>
                  Work faster with these keyboard shortcuts
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">
                      Communication
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                        <span className="text-sm">Toggle Messages</span>
                        <div className="flex items-center gap-1">
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono">
                            ⌘
                          </kbd>
                          <span className="text-xs">+</span>
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono">
                            M
                          </kbd>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                        <span className="text-sm">Toggle Tasks</span>
                        <div className="flex items-center gap-1">
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono">
                            ⌘
                          </kbd>
                          <span className="text-xs">+</span>
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono">
                            T
                          </kbd>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                        <span className="text-sm">Toggle Updates</span>
                        <div className="flex items-center gap-1">
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono">
                            ⌘
                          </kbd>
                          <span className="text-xs">+</span>
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono">
                            H
                          </kbd>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                        <span className="text-sm">Toggle Calendar</span>
                        <div className="flex items-center gap-1">
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono">
                            ⌘
                          </kbd>
                          <span className="text-xs">+</span>
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono">
                            C
                          </kbd>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                        <span className="text-sm">Toggle Team</span>
                        <div className="flex items-center gap-1">
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono">
                            ⌘
                          </kbd>
                          <span className="text-xs">+</span>
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono">
                            U
                          </kbd>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                        <span className="text-sm">Start Video Call</span>
                        <div className="flex items-center gap-1">
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono">
                            ⌘
                          </kbd>
                          <span className="text-xs">+</span>
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono">
                            K
                          </kbd>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                        <span className="text-sm">Update Status</span>
                        <div className="flex items-center gap-1">
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono">
                            ��
                          </kbd>
                          <span className="text-xs">+</span>
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono">
                            /
                          </kbd>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                        <span className="text-sm">Announce to Team</span>
                        <div className="flex items-center gap-1">
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono">
                            ⌘
                          </kbd>
                          <span className="text-xs">+</span>
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono">
                            ⇧
                          </kbd>
                          <span className="text-xs">+</span>
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono">
                            A
                          </kbd>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">
                      Productivity
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                        <span className="text-sm">Check In</span>
                        <div className="flex items-center gap-1">
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono">
                            ⌘
                          </kbd>
                          <span className="text-xs">+</span>
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono">
                            ⇧
                          </kbd>
                          <span className="text-xs">+</span>
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono">
                            C
                          </kbd>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                        <span className="text-sm">Toggle Audio</span>
                        <div className="flex items-center gap-1">
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono">
                            M
                          </kbd>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                        <span className="text-sm">Show Shortcuts</span>
                        <div className="flex items-center gap-1">
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono">
                            ⌘
                          </kbd>
                          <span className="text-xs">+</span>
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono">
                            ?
                          </kbd>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                        <span className="text-sm">Close Dialog/Panel</span>
                        <div className="flex items-center gap-1">
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono">
                            Esc
                          </kbd>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-900">
                    <strong>💡 Pro tip:</strong>
                    {" Use "}
                    <kbd className="px-1 py-0.5 bg-white border border-blue-300 rounded text-[10px] font-mono">
                      ⌘
                    </kbd>
                    {" on Mac or"}
                    <kbd className="px-1 py-0.5 bg-white border border-blue-300 rounded text-[10px] font-mono ml-1">
                      Ctrl
                    </kbd>
                    {" on Windows/Linux"}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {"Press "}
                    <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono mx-1">
                      Esc
                    </kbd>
                    {" to close dialogs"}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      localStorage.removeItem(
                        "tour_completed_virtual-office-tour",
                      );
                      setShowKeyboardShortcuts(false);
                      setShowOfficeTour(true);
                    }}
                  >
                    🎯 Replay Tour
                  </Button>
                </div>
                <Button onClick={() => setShowKeyboardShortcuts(false)}>
                  Got it!
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <MeetingScheduler
            open={showMeetingScheduler}
            onClose={() => setShowMeetingScheduler(false)}
            user={user}
            teamMembers={teamMembers}
          />
          <InteractiveTour
            steps={virtualOfficeTourSteps}
            tourKey="virtual-office-tour"
            run={showOfficeTour}
            onComplete={() => setShowOfficeTour(false)}
          />
          <div className="hidden lg:block fixed bottom-6 right-6 z-40">
            <motion.button
              initial={{
                scale: 0,
              }}
              animate={{
                scale: 1,
              }}
              whileHover={{
                scale: 1.1,
              }}
              whileTap={{
                scale: 0.95,
              }}
              onClick={() => {
                setShowKeyboardShortcuts(true);
                setShowHelpTooltip(false);
                localStorage.setItem(
                  "startupverse_has_seen_keyboard_shortcuts",
                  "true",
                );
              }}
              className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group relative"
              title="Keyboard Shortcuts (Ctrl+?)"
            >
              <HelpCircle className="w-6 h-6" />
              <span className="absolute inset-0 rounded-full bg-indigo-400 animate-ping opacity-20" />
              <span className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Keyboard Shortcuts
                <kbd className="ml-2 px-1.5 py-0.5 bg-slate-700 rounded text-[10px] font-mono">
                  ⌘?
                </kbd>
              </span>
            </motion.button>
            <AnimatePresence>
              {showHelpTooltip && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 10,
                    scale: 0.9,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    y: 10,
                    scale: 0.9,
                  }}
                  className="absolute bottom-full right-0 mb-4 w-64 pointer-events-none"
                >
                  <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-4 rounded-xl shadow-2xl relative">
                    <div className="absolute -bottom-2 right-6 w-4 h-4 bg-purple-600 transform rotate-45" />
                    <div className="relative z-10">
                      <div className="flex items-start gap-2 mb-2">
                        <Sparkles className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-sm mb-1">
                            ⚡ Power User Tip!
                          </p>
                          <p className="text-xs text-white/90">
                            {"Press "}
                            <kbd className="px-1.5 py-0.5 bg-white/20 rounded text-xs font-mono mx-0.5">
                              ⌘?
                            </kbd>
                            {" anytime to see all keyboard shortcuts"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-white/20">
                        <p className="text-[10px] text-white/70 flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          Navigate faster • Work smarter
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {isVideoCallActive && googleMeetLink && (
          <GoogleMeetCall
            meetLink={googleMeetLink}
            participants={activeCallParticipants}
            onEndCall={endVideoCall}
            onMinimize={() => setIsVideoMinimized(!isVideoMinimized)}
            isMinimized={isVideoMinimized}
            callType={activeCallType}
            currentUserName={user.name}
          />
        )}
      </AnimatePresence>
      <Dialog
        open={showGoogleConnectDialog}
        onOpenChange={setShowGoogleConnectDialog}
      >
        <DialogContent className="sm:max-w-[500px]">
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-bold mb-2">Connect Google Account</h2>
              <p className="text-sm text-muted-foreground">
                Enable instant Google Meet links for your Virtual Office
                meetings
              </p>
            </div>
            <GoogleAccountConnect
              userId={user.id}
              userType={user.role === "founder" ? "founder" : "team"}
            />
          </div>
        </DialogContent>
      </Dialog>
      <AnimatePresence>
        {isMessagePanelOpen && (
          <SimpleTeamMessaging
            onClose={() => {
              setIsMessagePanelOpen(false);
              setSelectedMessageUserId(null);
            }}
            onStartCall={startCallFromMessages}
            currentUserId={user.id}
            currentUserName={user.name}
            currentUserRole={user.role}
            startupId={getStartupId(user)}
            teamMembers={teamMembers.map((m) => ({
              id: m.id,
              name: m.name || m.talentName || "Unknown User",
              role:
                typeof m.role === "string"
                  ? m.role
                  : typeof m.talentArea === "string"
                    ? m.talentArea
                    : "Team Member",
              online: m.status === "available" || m.status === "busy",
            }))}
            initialSelectedUserId={selectedMessageUserId}
            onActivity={addActivity}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isTaskPanelOpen && (
          <TaskManagementPanel
            open={isTaskPanelOpen}
            onClose={() => {
              setIsTaskPanelOpen(false);
              setOpenTaskAddDialog(false);
              // Refresh tasks immediately when closing the panel
              loadTasks();
            }}
            user={user}
            onPlaySound={() => audio.playClickSound()}
            openAddDialog={openTaskAddDialog}
            initialTaskId={taskToOpen}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isTeamHubOpen && (
          <TeamHubPanel
            onClose={() => setIsTeamHubOpen(false)}
            currentUserId={user.id}
            currentUserName={user.name}
            onActivity={addActivity}
            organizationAnnouncements={orgAnnouncements}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isCalendarOpen && (
          <motion.div
            initial={{
              x: "100%",
            }}
            animate={{
              x: 0,
            }}
            exit={{
              x: "100%",
            }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 200,
            }}
            className="fixed right-0 top-0 bottom-0 w-full md:w-[800px] lg:w-[900px] bg-background border-l shadow-2xl z-[100] overflow-hidden"
          >
            <div className="flex flex-col h-full">
              <div className="flex flex-col border-b bg-gradient-to-r from-[#3A5AFE]/5 to-purple-500/5">
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3A5AFE] to-purple-600 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold">
                        Calendar & Schedule
                      </h2>
                      <p className="text-[10px] text-muted-foreground">
                        Manage meetings and tasks
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        if (calendarSchedulerOpener.current) {
                          calendarSchedulerOpener.current();
                        }
                      }}
                      className="h-7 text-[10px] px-3 bg-[#3A5AFE] hover:bg-[#304FFE]"
                    >
                      <Plus className="w-3 h-3 mr-1.5" />
                      Schedule Meeting
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsCalendarOpen(false)}
                      className="h-7 w-7 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                <CalendarWidget
                  user={user}
                  onNavigate={onNavigate}
                  onScheduleClick={(openScheduler) => {
                    calendarSchedulerOpener.current = openScheduler;
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Dialog
        open={!!selectedAnnouncement}
        onOpenChange={() => {
          setSelectedAnnouncement(null);
          setIsEditingAnnouncement(false);
          setEditAnnouncementText("");
        }}
      >
        <DialogContent className="max-w-lg max-h-[600px] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <span className="text-2xl">{selectedAnnouncement?.emoji}</span>
                <span>{selectedAnnouncement?.sender}'s Announcement</span>
              </DialogTitle>
              {selectedAnnouncement?.authorId === user.id && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setIsEditingAnnouncement(true);
                      setEditAnnouncementText(selectedAnnouncement.message);
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => {
                      if (
                        confirm(
                          "Are you sure you want to delete this announcement?",
                        )
                      ) {
                        deleteAnnouncement(selectedAnnouncement.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
            <DialogDescription>
              {selectedAnnouncement &&
                formatTimeAgo(selectedAnnouncement.timestamp)}
              {selectedAnnouncement?.editedAt && (
                <span className="ml-2 text-xs">
                  {"(edited "}
                  {formatTimeAgo(selectedAnnouncement.editedAt)})
                </span>
              )}
              {selectedAnnouncement?.category && (
                <Badge variant="outline" className="ml-2 text-xs">
                  {selectedAnnouncement.category === "wall-of-wins" &&
                    "Wall of Wins"}
                  {selectedAnnouncement.category === "team-events" &&
                    "Team Event"}
                  {selectedAnnouncement.category === "general" && "General"}
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              <div className="p-3 bg-muted/30 rounded-lg">
                {isEditingAnnouncement ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editAnnouncementText}
                      onChange={(e) => setEditAnnouncementText(e.target.value)}
                      className="min-h-[80px]"
                      placeholder="Edit your announcement..."
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsEditingAnnouncement(false);
                          setEditAnnouncementText("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          editAnnouncement(
                            selectedAnnouncement?.id,
                            editAnnouncementText,
                          )
                        }
                        disabled={!editAnnouncementText.trim()}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm">{selectedAnnouncement?.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Quick Reactions
                </Label>
                <div className="flex flex-wrap gap-2">
                  {["👍", "❤️", "🎉", "🔥", "✨", "👏"].map((emoji) => {
                    const reaction = selectedAnnouncement?.reactions?.find(
                      (r) => r.emoji === emoji,
                    );
                    const count = reaction?.users?.length || 0;
                    const hasReacted = reaction?.users?.includes(user.id);
                    return (
                      <Button
                        key={emoji}
                        variant={hasReacted ? "default" : "outline"}
                        size="sm"
                        className="h-8"
                        onClick={() =>
                          toggleReaction(selectedAnnouncement?.id, emoji)
                        }
                      >
                        <span className="text-base mr-1">{emoji}</span>
                        {count > 0 && <span className="text-xs">{count}</span>}
                      </Button>
                    );
                  })}
                </div>
              </div>
              {selectedAnnouncement?.reactions &&
                selectedAnnouncement.reactions.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      All Reactions
                    </Label>
                    <div className="space-y-1">
                      {selectedAnnouncement.reactions.map((reaction) => (
                        <div
                          key={reaction.emoji}
                          className="flex items-center gap-2 p-2 bg-muted/20 rounded"
                        >
                          <span className="text-lg">{reaction.emoji}</span>
                          <span className="text-sm text-muted-foreground">
                            {reaction.users.length}{" "}
                            {reaction.users.length === 1 ? "person" : "people"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground">
                  Comments ({selectedAnnouncement?.comments?.length || 0})
                </Label>
                {selectedAnnouncement?.comments &&
                  selectedAnnouncement.comments.length > 0 && (
                    <div className="space-y-2">
                      {selectedAnnouncement.comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="p-2 bg-muted/20 rounded-lg"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium">
                              {comment.userName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(new Date(comment.timestamp))}
                            </span>
                          </div>
                          <p className="text-sm">
                            {parseMentions(comment.text).map((part, idx) => (
                              <>
                                {part.type === "mention" ? (
                                  <span className="text-primary font-medium bg-primary/10 px-1 rounded">
                                    {part.content}
                                  </span>
                                ) : (
                                  <span>{part.content}</span>
                                )}
                              </>
                            ))}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                <div className="relative">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        placeholder="Add a comment... (use @ to mention)"
                        value={announcementComment}
                        onChange={handleCommentChange}
                        onKeyDown={(e) => {
                          if (
                            e.key === "Enter" &&
                            !e.shiftKey &&
                            !showMentionSuggestions
                          ) {
                            e.preventDefault();
                            addComment(
                              selectedAnnouncement?.id,
                              announcementComment,
                            );
                          }
                          if (e.key === "Escape") {
                            setShowMentionSuggestions(false);
                          }
                        }}
                        className="pr-8"
                      />
                      <AtSign className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      {showMentionSuggestions &&
                        mentionSuggestions.length > 0 && (
                          <div className="absolute bottom-full mb-1 left-0 right-0 bg-popover border rounded-md shadow-lg max-h-[150px] overflow-y-auto z-50">
                            {mentionSuggestions.map((name) => (
                              <button
                                key={name}
                                className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex items-center gap-2"
                                onClick={() => insertMention(name)}
                                type="button"
                              >
                                <Users className="w-3 h-3" />
                                {name}
                              </button>
                            ))}
                          </div>
                        )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() =>
                        addComment(
                          selectedAnnouncement?.id,
                          announcementComment,
                        )
                      }
                      disabled={!announcementComment.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
