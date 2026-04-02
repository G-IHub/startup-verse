import React, { useState, useEffect } from "react";
import CalendarView from "./CalendarView";
import MeetingScheduler from "./MeetingScheduler";
import { getTasks } from "../../utils/executionEngine";
import * as meetingApi from "../../utils/api/meetingApi";
import * as teamMemberApi from "../../utils/api/teamMemberApi";
export default function CalendarWidget({
  user,
  compact = false,
  onNavigate,
  onScheduleClick,
}) {
  const [meetings, setMeetings] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [showScheduler, setShowScheduler] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadCalendarData();
  }, [user.id]);

  // Expose scheduler opener to parent
  useEffect(() => {
    if (onScheduleClick) {
      onScheduleClick(() => setShowScheduler(true));
    }
  }, [onScheduleClick]);
  const loadCalendarData = async () => {
    try {
      setLoading(true);

      // Determine startup ID
      const startupId = user.role === "founder" ? user.id : user.startupId;

      // Load tasks
      try {
        if (user.role === "founder") {
          const allTasks = getTasks(user.id);
          setTasks(allTasks);
        } else {
          const userTasks = await teamMemberApi.getTeamMemberTasks(user.id);
          setTasks(userTasks || []);
        }
      } catch (err) {
        console.error("Error loading tasks:", err);
        setTasks([]);
      }

      // Load meetings
      try {
        if (startupId) {
          const startupMeetings =
            await meetingApi.getStartupMeetings(startupId);
          setMeetings(startupMeetings || []);
        }
      } catch (err) {
        console.error("Error loading meetings:", err);
        setMeetings([]);
      }

      // Load team members
      try {
        if (startupId) {
          const team = await teamMemberApi.getStartupTeamMembers(startupId);
          // Filter out current user
          const filteredTeam = team.filter((m) => m.id !== user.id);
          setTeamMembers(filteredTeam || []);
        }
      } catch (err) {
        console.error("Error loading team members:", err);
        setTeamMembers([]);
      }
    } catch (error) {
      console.error("Error loading calendar data:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleMeetingScheduled = (meeting) => {
    setMeetings([...meetings, meeting]);
  };
  const handleEventClick = (event) => {
    // Handle event click - could open task details or meeting details
    console.log("Event clicked:", event);
    if (event.type === "task") {
      // Navigate to virtual office with task open
      onNavigate?.("startup-office");
    }
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[10px] text-muted-foreground">
            Loading calendar...
          </p>
        </div>
      </div>
    );
  }
  return (
    <>
      <CalendarView
        user={user}
        tasks={tasks}
        meetings={meetings}
        onScheduleMeeting={() => setShowScheduler(true)}
        onEventClick={handleEventClick}
        compact={compact}
      />
      <MeetingScheduler
        open={showScheduler}
        onClose={() => setShowScheduler(false)}
        user={user}
        teamMembers={teamMembers}
        onMeetingScheduled={handleMeetingScheduled}
      />
    </>
  );
}
