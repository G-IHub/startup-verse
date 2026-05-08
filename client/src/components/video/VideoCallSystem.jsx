import React, { useState, useEffect, useMemo } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
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
import { toast } from "sonner";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Monitor,
  MonitorOff,
  Users,
  MessageSquare,
  Settings,
  MoreHorizontal,
  Clock,
  Calendar,
  FileText,
  Star,
} from "lucide-react";
export default function VideoCallSystem({ user, callType = "mentor-session" }) {
  const [currentCall, setCurrentCall] = useState(null);
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasVideo, setHasVideo] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isJoinMeetingDialogOpen, setIsJoinMeetingDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [meetingCode, setMeetingCode] = useState("");
  const [scheduleFormData, setScheduleFormData] = useState({
    title: "",
    type: "team-meeting",
    date: "",
    time: "",
    duration: "60",
    participants: "",
    agenda: "",
  });

  const demoScheduledCalls = useMemo(() => {
    if (!user?.id) return [];
    return [
      {
        id: "1",
        title: "Weekly Strategy Review",
        type: "mentor-session",
        scheduledTime: new Date(Date.now() + 30 * 60 * 1000),
        duration: 60,
        participants: [
          {
            id: "1",
            name: "Dr. Sarah Johnson",
            role: "Mentor",
            isHost: true,
            isMuted: false,
            hasVideo: true,
            isPresenting: false,
          },
          {
            id: user.id,
            name: user.name,
            role: user.role,
            isHost: false,
            isMuted: false,
            hasVideo: true,
            isPresenting: false,
          },
        ],
        status: "upcoming",
        agenda: [
          "Review last week's progress",
          "Discuss fundraising strategy",
          "Plan next milestones",
          "Q&A session",
        ],
      },
      {
        id: "2",
        title: "Team Standup",
        type: "team-meeting",
        scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        duration: 30,
        participants: [
          {
            id: user.id,
            name: user.name,
            role: user.role,
            isHost: true,
            isMuted: false,
            hasVideo: true,
            isPresenting: false,
          },
          {
            id: "3",
            name: "Alex Rodriguez",
            role: "Developer",
            isHost: false,
            isMuted: false,
            hasVideo: true,
            isPresenting: false,
          },
          {
            id: "4",
            name: "Lisa Zhang",
            role: "Designer",
            isHost: false,
            isMuted: false,
            hasVideo: true,
            isPresenting: false,
          },
        ],
        status: "upcoming",
      },
      {
        id: "3",
        title: "Investor Pitch Presentation",
        type: "investor-pitch",
        scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        duration: 45,
        participants: [
          {
            id: user.id,
            name: user.name,
            role: user.role,
            isHost: true,
            isMuted: false,
            hasVideo: true,
            isPresenting: false,
          },
          {
            id: "5",
            name: "TechVentures VC",
            role: "Investor",
            isHost: false,
            isMuted: true,
            hasVideo: true,
            isPresenting: false,
          },
        ],
        status: "upcoming",
      },
    ];
  }, [user?.id, user?.name, user?.role]);

  const [userScheduledCalls, setUserScheduledCalls] = useState([]);
  const scheduledCalls = [...demoScheduledCalls, ...userScheduledCalls];
  useEffect(() => {
    let interval;
    if (isInCall) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isInCall]);
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };
  const startCall = (call) => {
    setCurrentCall(call);
    setIsInCall(true);
    setCallDuration(0);
  };
  const endCall = () => {
    setCurrentCall(null);
    setIsInCall(false);
    setCallDuration(0);
    setIsMuted(false);
    setHasVideo(true);
    setIsScreenSharing(false);
    setChatOpen(false);
  };
  const startQuickTeamMeeting = () => {
    // Start an instant team meeting
    const quickCall = {
      id: Date.now().toString(),
      title: "Quick Team Meeting",
      type: "team-meeting",
      scheduledTime: new Date(),
      duration: 30,
      participants: [
        {
          id: user.id,
          name: user.name,
          role: user.role,
          isHost: true,
          isMuted: false,
          hasVideo: true,
          isPresenting: false,
        },
      ],
      status: "in-progress",
    };
    startCall(quickCall);
  };
  const joinMeetingByCode = () => {
    if (!meetingCode.trim()) {
      toast.error("Please enter a meeting code");
      return;
    }

    // Create a call session from the meeting code
    const joinedCall = {
      id: meetingCode,
      title: "Joined Meeting",
      type: "team-meeting",
      scheduledTime: new Date(),
      duration: 60,
      participants: [
        {
          id: user.id,
          name: user.name,
          role: user.role,
          isHost: false,
          isMuted: false,
          hasVideo: true,
          isPresenting: false,
        },
      ],
      status: "in-progress",
    };
    toast.success(`🎥 Joining meeting ${meetingCode}...`);
    startCall(joinedCall);
    setIsJoinMeetingDialogOpen(false);
    setMeetingCode("");
  };
  const scheduleNewCall = () => {
    if (
      !scheduleFormData.title ||
      !scheduleFormData.date ||
      !scheduleFormData.time
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Combine date and time
    const scheduledDateTime = new Date(
      `${scheduleFormData.date}T${scheduleFormData.time}`,
    );
    const newCall = {
      id: Date.now().toString(),
      title: scheduleFormData.title,
      type: scheduleFormData.type,
      scheduledTime: scheduledDateTime,
      duration: parseInt(scheduleFormData.duration),
      participants: [
        {
          id: user.id,
          name: user.name,
          role: user.role,
          isHost: true,
          isMuted: false,
          hasVideo: true,
          isPresenting: false,
        },
      ],
      status: "upcoming",
      agenda: scheduleFormData.agenda
        ? scheduleFormData.agenda.split("\n").filter((item) => item.trim())
        : undefined,
    };

    setUserScheduledCalls((prev) => [...prev, newCall]);
    toast.success(
      `📅 Call scheduled for ${scheduledDateTime.toLocaleString()}! Calendar invite will be sent to participants.`,
    );
    setIsScheduleDialogOpen(false);
    setScheduleFormData({
      title: "",
      type: "team-meeting",
      date: "",
      time: "",
      duration: "60",
      participants: "",
      agenda: "",
    });
  };
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  const toggleVideo = () => {
    setHasVideo(!hasVideo);
  };
  const toggleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
  };
  if (isInCall && currentCall) {
    return (
      <div className="h-full bg-gray-900 flex flex-col">
        <div className="bg-black/20 p-3 flex items-center justify-between text-white">
          <div className="flex items-center space-x-3">
            <h2>{currentCall.title}</h2>
            <Badge variant="secondary">
              <Clock className="w-3 h-3 mr-1" />
              {formatDuration(callDuration)}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <Users className="w-4 h-4 mr-1" />
              {currentCall.participants.length}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={() => setChatOpen(!chatOpen)}
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 p-3">
          <div
            className={`grid gap-3 h-full ${currentCall.participants.length === 2 ? "grid-cols-2" : currentCall.participants.length <= 4 ? "grid-cols-2 grid-rows-2" : "grid-cols-3 grid-rows-2"}`}
          >
            {currentCall.participants.map((participant) => (
              <div
                key={participant.id}
                className="relative bg-gray-800 rounded-lg overflow-hidden"
              >
                {participant.hasVideo ? (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={participant.avatar} />
                      <AvatarFallback>
                        {participant.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <div className="text-center text-white">
                      <VideoOff className="w-10 h-10 mx-auto mb-2" />
                      <p>Camera off</p>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 text-white">
                  <div className="flex items-center space-x-1">
                    <span>{participant.name}</span>
                    {participant.isHost && (
                      <Star className="w-3 h-3 text-yellow-400" />
                    )}
                  </div>
                  <p className="text-xs opacity-70">{participant.role}</p>
                </div>
                {participant.isMuted && (
                  <div className="absolute top-3 right-3">
                    <div className="bg-red-500 rounded-full p-1">
                      <MicOff className="w-3 h-3 text-white" />
                    </div>
                  </div>
                )}
                {!participant.isMuted && (
                  <div className="absolute inset-0 border-2 border-green-400 rounded-lg animate-pulse" />
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-black/40 p-4">
          <div className="flex items-center justify-center space-x-3">
            <Button
              variant={isMuted ? "destructive" : "secondary"}
              size="lg"
              className="rounded-full w-11 h-11"
              onClick={toggleMute}
            >
              {isMuted ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant={hasVideo ? "secondary" : "destructive"}
              size="lg"
              className="rounded-full w-11 h-11"
              onClick={toggleVideo}
            >
              {hasVideo ? (
                <Video className="w-4 h-4" />
              ) : (
                <VideoOff className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant={isScreenSharing ? "default" : "secondary"}
              size="lg"
              className="rounded-full w-11 h-11"
              onClick={toggleScreenShare}
            >
              {isScreenSharing ? (
                <MonitorOff className="w-4 h-4" />
              ) : (
                <Monitor className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="destructive"
              size="lg"
              className="rounded-full w-12 h-12"
              onClick={endCall}
            >
              <PhoneOff className="w-5 h-5" />
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="rounded-full w-11 h-11"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="p-3 md:p-4 space-y-3 md:space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-4 h-4" />
            Video Calls & Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
            <Button
              className="h-12 md:h-14 flex-col"
              onClick={startQuickTeamMeeting}
            >
              <Users className="w-5 h-5 mb-1" />
              <span>Start Team Meeting</span>
            </Button>
            <Button
              variant="outline"
              className="h-12 md:h-14 flex-col"
              onClick={() => setIsJoinMeetingDialogOpen(true)}
            >
              <Video className="w-5 h-5 mb-1" />
              <span>Join Meeting</span>
            </Button>
            <Button
              variant="outline"
              className="h-12 md:h-14 flex-col"
              onClick={() => setIsScheduleDialogOpen(true)}
            >
              <Calendar className="w-5 h-5 mb-1" />
              <span>Schedule Call</span>
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Calls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {scheduledCalls.map((call) => (
              <div
                key={call.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4>{call.title}</h4>
                    <Badge
                      variant={
                        call.type === "mentor-session"
                          ? "default"
                          : call.type === "team-meeting"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {call.type.replace("-", " ")}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{call.scheduledTime.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span>
                        {call.participants.length}
                        {" participants"}
                      </span>
                    </div>
                  </div>
                  {call.agenda && (
                    <div className="mt-1">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        Agenda:
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        {call.agenda.slice(0, 2).map((item, index) => (
                          <li key={index}>
                            {"• "}
                            {item}
                          </li>
                        ))}
                        {call.agenda.length > 2 && (
                          <li>
                            • +{call.agenda.length - 2}
                            {" more items"}
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    onClick={() => startCall(call)}
                    disabled={
                      call.scheduledTime > new Date(Date.now() + 10 * 60 * 1000)
                    }
                  >
                    <Video className="w-4 h-4 mr-1" />
                    Join
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Recent Calls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>SJ</AvatarFallback>
                </Avatar>
                <div>
                  <p>Mentor Session with Dr. Sarah Johnson</p>
                  <p className="text-xs text-muted-foreground">
                    Yesterday • 45 min
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">Completed</Badge>
                <Button variant="ghost" size="sm">
                  <FileText className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p>Team Standup</p>
                  <p className="text-xs text-muted-foreground">
                    2 days ago • 30 min
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">Completed</Badge>
                <Button variant="ghost" size="sm">
                  <FileText className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Dialog
        open={isJoinMeetingDialogOpen}
        onOpenChange={setIsJoinMeetingDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Meeting</DialogTitle>
            <DialogDescription>
              Enter the meeting code to join an existing video call
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="meetingCode">Meeting Code</Label>
              <Input
                id="meetingCode"
                placeholder="Enter meeting code (e.g., ABC-DEF-GHI)"
                value={meetingCode}
                onChange={(e) => setMeetingCode(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && joinMeetingByCode()}
              />
              <p className="text-xs text-muted-foreground">
                Get the meeting code from your team or calendar invite
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsJoinMeetingDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={joinMeetingByCode}
                disabled={!meetingCode.trim()}
              >
                <Video className="w-4 h-4 mr-2" />
                Join Meeting
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={isScheduleDialogOpen}
        onOpenChange={setIsScheduleDialogOpen}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule a Call</DialogTitle>
            <DialogDescription>
              Set up a future video call with your team, mentor, or investors
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="callTitle">Call Title *</Label>
              <Input
                id="callTitle"
                placeholder="e.g., Weekly Team Sync"
                value={scheduleFormData.title}
                onChange={(e) =>
                  setScheduleFormData({
                    ...scheduleFormData,
                    title: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="callType">Call Type</Label>
              <Select
                value={scheduleFormData.type}
                onValueChange={(value) =>
                  setScheduleFormData({
                    ...scheduleFormData,
                    type: value,
                  })
                }
              >
                <SelectTrigger id="callType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team-meeting">Team Meeting</SelectItem>
                  <SelectItem value="mentor-session">Mentor Session</SelectItem>
                  <SelectItem value="investor-pitch">Investor Pitch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="callDate">Date *</Label>
                <Input
                  id="callDate"
                  type="date"
                  value={scheduleFormData.date}
                  onChange={(e) =>
                    setScheduleFormData({
                      ...scheduleFormData,
                      date: e.target.value,
                    })
                  }
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="callTime">Time *</Label>
                <Input
                  id="callTime"
                  type="time"
                  value={scheduleFormData.time}
                  onChange={(e) =>
                    setScheduleFormData({
                      ...scheduleFormData,
                      time: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Select
                value={scheduleFormData.duration}
                onValueChange={(value) =>
                  setScheduleFormData({
                    ...scheduleFormData,
                    duration: value,
                  })
                }
              >
                <SelectTrigger id="duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="participants">Participants (optional)</Label>
              <Input
                id="participants"
                placeholder="Enter names or email addresses, separated by commas"
                value={scheduleFormData.participants}
                onChange={(e) =>
                  setScheduleFormData({
                    ...scheduleFormData,
                    participants: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agenda">Agenda (optional)</Label>
              <Textarea
                id="agenda"
                placeholder="Enter agenda items, one per line"
                rows={4}
                value={scheduleFormData.agenda}
                onChange={(e) =>
                  setScheduleFormData({
                    ...scheduleFormData,
                    agenda: e.target.value,
                  })
                }
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsScheduleDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={scheduleNewCall}
                disabled={
                  !scheduleFormData.title ||
                  !scheduleFormData.date ||
                  !scheduleFormData.time
                }
              >
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Call
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
