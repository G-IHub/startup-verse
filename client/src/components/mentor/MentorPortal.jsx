/**
 * MENTOR PORTAL - Simple interface for mentors to access founders and Virtual Office
 */
import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/apiBase.js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Users,
  Video,
  Mail,
  Rocket,
  LogOut,
  TrendingUp,
  Check,
  Settings as SettingsIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent } from "../ui/dialog";
import GoogleAccountConnect from "../shared/GoogleAccountConnect";
import {
  isGoogleConnected,
  createInstantGoogleMeet,
} from "../../utils/googleMeet";
import { unwrapData } from "../../utils/apiEnvelope";

const API_BASE = API_BASE_URL;

// Default fetch options for cookie-based auth

const defaultOptions = {
  credentials: "include",
  headers: { "Content-Type": "application/json" },
};

export default function MentorPortal({ mentor, onLogout }) {
  const [founders, setFounders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showJoinMeetingDialog, setShowJoinMeetingDialog] = useState(false);
  const [meetingRoomLink, setMeetingRoomLink] = useState("");
  const [googleConnected, setGoogleConnected] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [creatingMeeting, setCreatingMeeting] = useState(false);
  useEffect(() => {
    loadFounders();
    checkGoogleConnection();
  }, [mentor.id]);
  const loadFounders = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE}/mentors/${mentor.id}/assigned-founders`,
        {
          ...defaultOptions,
        },
      );
      if (!response.ok) throw new Error("Failed to fetch founders");
      const inner = unwrapData(await response.json());
      setFounders(inner.founders || []);
    } catch (error) {
      console.error("Error loading founders:", error);
      toast.error("Failed to load founders");
    } finally {
      setLoading(false);
    }
  };
  const checkGoogleConnection = async () => {
    try {
      const connected = await isGoogleConnected(mentor.id);
      setGoogleConnected(connected);
    } catch (error) {
      console.error("Error checking Google connection:", error);
      setGoogleConnected(false);
    }
  };
  const joinVirtualOffice = async (founderId, founderName) => {
    try {
      // Check if Google account is connected
      const connected = await isGoogleConnected(mentor.id);
      if (!connected) {
        toast.error("Please connect your Google account first", {
          description:
            "Click the Settings button in the header to connect Google Calendar",
          duration: 5000,
        });
        setShowSettings(true);
        return;
      }

      // Create instant Google Meet link
      setCreatingMeeting(true);
      const meetingResult = await createInstantGoogleMeet(
        mentor.id,
        `Mentorship Session - ${mentor.name} & ${founderName}`,
      );
      if (meetingResult.success && meetingResult.meetLink) {
        setMeetingRoomLink(meetingResult.meetLink);
        setShowJoinMeetingDialog(true);
      } else {
        toast.error("Failed to create meeting link", {
          description:
            meetingResult.error ||
            "Please try again or check your Google connection",
        });
      }
    } catch (error) {
      console.error("Error joining virtual office:", error);
      toast.error("Failed to start meeting", {
        description: "An unexpected error occurred",
      });
    } finally {
      setCreatingMeeting(false);
    }
  };
  const getStageColor = (stage) => {
    switch (stage) {
      case "ideation":
        return "bg-gray-500/10 text-gray-700 border-gray-500/20";
      case "validation":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      case "launch":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      case "growth":
        return "bg-purple-500/10 text-purple-700 border-purple-500/20";
      case "scale":
        return "bg-orange-500/10 text-orange-700 border-orange-500/20";
      case "expansion":
        return "bg-red-500/10 text-red-700 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    }
  };
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle className="text-base flex items-center gap-2">
                  {"👋 Welcome, "}
                  {mentor.name || mentor.email || "Mentor"}
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  {"Mentor Portal • "}
                  {(mentor.cohortIds || []).length}
                  {" Cohort"}
                  {(mentor.cohortIds || []).length !== 1 ? "s" : ""}
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={onLogout}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </CardHeader>
          {(() => {
            const expertiseLabel = Array.isArray(mentor.expertise)
              ? mentor.expertise.join(", ")
              : mentor.expertise || "";
            return expertiseLabel ? (
              <CardContent className="border-t pt-3">
                <p className="text-[10px] text-muted-foreground">
                  <strong>Expertise:</strong> {expertiseLabel}
                </p>
              </CardContent>
            ) : null;
          })()}
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">
                    Total Founders
                  </p>
                  <p className="text-lg font-bold">{founders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Rocket className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">
                    Active Cohorts
                  </p>
                  <p className="text-lg font-bold">
                    {(mentor.cohortIds || []).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Video className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">
                    Ready to Join
                  </p>
                  <p className="text-lg font-bold">Virtual Office</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              My Founders
            </CardTitle>
            <CardDescription className="text-xs">
              Startups you're mentoring across all cohorts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-pulse text-[10px]">
                  Loading founders...
                </div>
              </div>
            ) : founders.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground">
                  No founders assigned yet
                </p>
                <p className="text-[9px] text-muted-foreground mt-1">
                  You'll see founders here once they join your cohorts
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {founders.map((founder) => (
                  <Card
                    key={founder.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                          {founder.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[11px] font-semibold truncate">
                            {founder.name}
                          </h3>
                          <p className="text-[9px] text-muted-foreground truncate">
                            {founder.email}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2">
                          <Rocket className="w-3 h-3 text-muted-foreground" />
                          <p className="text-[10px] font-medium">
                            {founder.startupName}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[7px] ${getStageColor(founder.startupStage)}`}
                        >
                          <TrendingUp className="w-2 h-2 mr-1" />
                          {founder.startupStage}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            joinVirtualOffice(founder.id, founder.name)
                          }
                          className="flex-1 gap-1 h-7 text-[9px]"
                        >
                          <Video className="w-3 h-3" />
                          Join Office
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            toast.info("Messaging feature coming soon!")
                          }
                          className="h-7 w-7 p-0"
                        >
                          <Mail className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Dialog
        open={showJoinMeetingDialog}
        onOpenChange={setShowJoinMeetingDialog}
      >
        <DialogContent className="sm:max-w-[500px] p-8">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-[#3A5AFE]/10 dark:bg-[#3A5AFE]/20 flex items-center justify-center">
              <Video className="w-10 h-10 text-[#3A5AFE]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Mentorship Session
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                You're about to join this meeting
              </p>
            </div>
            <div className="w-full space-y-3">
              <div className="flex items-center gap-3 text-left">
                <div className="w-5 h-5 rounded-full bg-[#2ECC71] flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-gray-900 dark:text-white">
                  Camera and microphone ready
                </span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <div className="w-5 h-5 rounded-full bg-[#2ECC71] flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-gray-900 dark:text-white">
                  {"Joining as: "}
                  <strong>{mentor.name}</strong>
                </span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <div className="w-5 h-5 rounded-full bg-[#2ECC71] flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-gray-900 dark:text-white">
                  High-quality video enabled
                </span>
              </div>
            </div>
            <Button
              onClick={() => {
                window.open(meetingRoomLink, "_blank");
                setShowJoinMeetingDialog(false);
              }}
              className="w-full h-12 text-base bg-[#3A5AFE] hover:bg-[#3A5AFE]/90 gap-2"
            >
              <Video className="w-5 h-5" />
              Join Meeting Now
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              By joining, you agree to allow StartupVerse to use your camera and
              microphone
            </p>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={!googleConnected} onOpenChange={setGoogleConnected}>
        <DialogContent className="sm:max-w-[500px] p-8">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-[#3A5AFE]/10 dark:bg-[#3A5AFE]/20 flex items-center justify-center">
              <SettingsIcon className="w-10 h-10 text-[#3A5AFE]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Connect Google Account
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Connect your Google account to create instant Google Meet
                meetings
              </p>
            </div>
            <GoogleAccountConnect userId={mentor.id} userType="mentor" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              By connecting your Google account, you agree to allow StartupVerse
              to create and manage Google Meet meetings on your behalf
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
