import React, { useState } from "react";
import { motion } from "motion/react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Separator } from "../ui/separator";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Maximize2,
  Minimize2,
  Users,
  Settings,
  ScreenShare,
  ScreenShareOff,
  Grid3x3,
  X,
  Monitor,
  Volume2,
  Camera,
  Crown,
} from "lucide-react";
export function VideoCallOverlay({
  participants,
  onEndCall,
  onMinimize,
  isMinimized = false,
  callType = "direct",
  roomName,
}) {
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [position, setPosition] = useState({
    x: 0,
    y: 0,
  });
  const [screenStream, setScreenStream] = useState(null);
  const screenVideoRef = React.useRef(null);

  // Debug log
  React.useEffect(() => {
    console.log("🎥 VideoCallOverlay mounted/updated:", {
      participantCount: participants.length,
      isMinimized,
      callType,
      roomName,
      screenWidth: window.innerWidth,
    });
  }, [participants, isMinimized, callType, roomName]);

  // New state for panels and dialogs
  const [showParticipantsPanel, setShowParticipantsPanel] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [selectedMicrophone, setSelectedMicrophone] = useState("default");
  const [selectedCamera, setSelectedCamera] = useState("default");
  const [selectedSpeaker, setSelectedSpeaker] = useState("default");

  // Real webcam and microphone streams
  const [localStream, setLocalStream] = useState(null);
  const localVideoRef = React.useRef(null);
  const [isRequestingMedia, setIsRequestingMedia] = useState(false);
  const [mediaPermissionDenied, setMediaPermissionDenied] = useState(false);
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Request media access (called on user action, not automatic)
  const requestMediaAccess = async () => {
    if (isRequestingMedia || localStream) return;
    setIsRequestingMedia(true);
    setMediaPermissionDenied(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);

      // Mute audio track initially based on isMuted state
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
      toast.success("📹 Camera and microphone connected", {
        description: "Your media devices are ready",
      });
    } catch (error) {
      // Don't log expected permission errors to console
      setMediaPermissionDenied(true);
      if (error.name === "NotAllowedError") {
        toast.error("Camera/microphone access denied", {
          description: "Please allow camera and microphone access to continue",
        });
      } else if (error.name === "NotFoundError") {
        toast.error("No camera or microphone found", {
          description: "Please connect a camera and microphone",
        });
      } else if (error.name === "NotReadableError") {
        toast.error("Camera already in use", {
          description: "Close other apps using your camera and try again",
        });
      } else {
        // Only log unexpected errors
        console.error("Unexpected media access error:", error);
        toast.error("Failed to access media devices", {
          description: error.message || "Please check your device settings",
        });
      }
    } finally {
      setIsRequestingMedia(false);
    }
  };

  // Update local video element when stream changes
  React.useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Handle video toggle
  React.useEffect(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = isVideoOn;
      });
    }
  }, [isVideoOn, localStream]);

  // Handle mute toggle
  React.useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted, localStream]);

  // Cleanup streams on unmount
  React.useEffect(() => {
    return () => {
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
      }
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [screenStream, localStream]);

  // Update video element when screen stream changes
  React.useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      // Start screen sharing
      try {
        // Check if getDisplayMedia is available
        if (
          !navigator.mediaDevices ||
          !navigator.mediaDevices.getDisplayMedia
        ) {
          toast.error("Screen sharing not supported", {
            description: "Your browser doesn't support screen sharing",
          });
          return;
        }
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: "monitor", // or 'window', 'browser'
          },
          audio: false,
        });
        setScreenStream(stream);
        setIsScreenSharing(true);
        toast.success("🖥️ Screen sharing started", {
          description: "Your screen is now visible to all participants",
        });

        // Handle when user stops sharing via browser UI
        stream.getVideoTracks()[0].addEventListener("ended", () => {
          setIsScreenSharing(false);
          setScreenStream(null);
          toast("Screen sharing stopped", {
            icon: "🖥️",
          });
        });
      } catch (error) {
        // Handle specific permission errors
        if (error.name === "NotAllowedError") {
          // Permissions policy blocks screen sharing (iframe/restricted environment)
          // This is expected in development/iframe environments - no need to log
          toast.error("Screen sharing blocked by permissions", {
            description:
              "Demo mode enabled - screen sharing works in production",
          });

          // Enable demo mode instead
          setIsScreenSharing(true);
          toast.success("🖥️ Screen sharing demo mode", {
            description:
              "Simulating screen share (real capture works in production)",
          });
        } else if (error.name === "NotFoundError") {
          toast.error("No screen source selected", {
            description: "Please select a screen, window, or tab to share",
          });
        } else if (error.name === "AbortError") {
          // User cancelled the screen share dialog - this is expected
          toast("Screen sharing cancelled", {
            icon: "🖥️",
          });
        } else {
          // Only log unexpected errors
          console.error("Screen share error:", error);
          toast.error("Failed to start screen sharing", {
            description: error.message || "Please try again",
          });
        }
      }
    } else {
      // Stop screen sharing
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
        setScreenStream(null);
      }
      setIsScreenSharing(false);
      toast("Screen sharing stopped", {
        icon: "🖥️",
      });
    }
  };

  // Check if anyone is sharing screen
  const screenSharingParticipant = participants.find((p) => p.isScreenSharing);
  const isAnyoneSharing = !!screenSharingParticipant || isScreenSharing;

  // Minimized view - just a small indicator
  if (isMinimized) {
    return (
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.8,
        }}
        animate={{
          opacity: 1,
          scale: 1,
        }}
        exit={{
          opacity: 0,
          scale: 0.8,
        }}
        className="fixed bottom-4 right-4 z-[70]"
      >
        <Card
          className="bg-gradient-to-br from-blue-500 to-purple-500 border-2 border-white shadow-2xl cursor-pointer hover:scale-105 transition-transform"
          onClick={onMinimize}
        >
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-white">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                }}
              >
                <Video className="w-5 h-5" />
              </motion.div>
              <div>
                <p className="text-sm font-medium">Call in progress</p>
                <p className="text-xs opacity-90">
                  {participants.length}
                  {" participant"}
                  {participants.length > 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Expanded view - large overlay
  if (isExpanded) {
    return (
      <motion.div
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        exit={{
          opacity: 0,
        }}
        className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm"
      >
        <div className="absolute inset-4 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border-2 border-slate-700 overflow-hidden flex flex-col">
          <div className="p-4 bg-slate-800/50 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <div>
                <h3 className="text-white font-medium">
                  {callType === "room" && roomName ? roomName : "Video Call"}
                </h3>
                <p className="text-sm text-slate-400">
                  {participants.length}
                  {" participant"}
                  {participants.length > 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/10"
                onClick={() => setShowParticipantsPanel(true)}
              >
                <Users className="w-4 h-4 mr-1.5" />
                Participants
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/10"
                onClick={() =>
                  setViewMode(viewMode === "grid" ? "speaker" : "grid")
                }
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/10"
                onClick={toggleExpand}
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-auto">
            {isAnyoneSharing && (
              <div className="mb-3 p-3 bg-blue-500/20 border border-blue-500 rounded-lg flex items-center gap-2">
                <Monitor className="w-5 h-5 text-blue-400" />
                <span className="text-white">
                  {isScreenSharing
                    ? "You are"
                    : `${screenSharingParticipant?.name} is`}
                  {" sharing screen"}
                </span>
              </div>
            )}
            {isAnyoneSharing ? (
              <div className="h-full flex gap-3">
                <div className="flex-1 bg-slate-700 rounded-lg overflow-hidden flex flex-col items-center justify-center relative">
                  {isScreenSharing && screenStream ? (
                    <video
                      ref={screenVideoRef}
                      autoPlay={true}
                      playsInline={true}
                      muted={true}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 to-purple-900/30" />
                      <div className="relative z-10 flex flex-col items-center gap-4">
                        <Monitor className="w-24 h-24 text-blue-400" />
                        <div className="text-center">
                          <p className="text-white text-lg font-medium">
                            {screenSharingParticipant?.name}'s Screen
                          </p>
                          <p className="text-slate-400 text-sm">
                            Screen sharing in progress
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                  <div className="absolute bottom-4 left-4 z-20">
                    <Badge className="bg-blue-500 text-white border-0 flex items-center gap-1.5">
                      <ScreenShare className="w-3 h-3" />
                      {isScreenSharing ? "You" : screenSharingParticipant?.name}
                    </Badge>
                  </div>
                </div>
                <div className="w-64 flex flex-col gap-2">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="relative bg-slate-700 rounded-lg overflow-hidden flex items-center justify-center h-36"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 to-purple-900/50" />
                      {participant.isVideoOff && (
                        <Avatar className="w-16 h-16 relative z-10">
                          <AvatarImage src={participant.avatar} />
                          <AvatarFallback>
                            {participant.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      {participant.isSpeaking && (
                        <motion.div
                          className="absolute inset-0 border-2 border-green-400 rounded-lg"
                          animate={{
                            opacity: [0.5, 1, 0.5],
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                          }}
                        />
                      )}
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                        <Badge className="bg-black/60 text-white border-0 text-xs truncate max-w-[70%]">
                          {participant.name}
                        </Badge>
                        <div className="flex gap-1">
                          {participant.isMuted && (
                            <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                              <MicOff className="w-2 h-2 text-white" />
                            </div>
                          )}
                          {participant.isScreenSharing && (
                            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                              <Monitor className="w-2 h-2 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div
                className={`h-full grid gap-3 ${participants.length === 1 ? "grid-cols-1" : participants.length === 2 ? "grid-cols-2" : participants.length <= 4 ? "grid-cols-2 grid-rows-2" : "grid-cols-3"}`}
              >
                {participants.map((participant) => (
                  <motion.div
                    key={participant.id}
                    initial={{
                      opacity: 0,
                      scale: 0.9,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                    }}
                    className="relative bg-slate-700 rounded-lg overflow-hidden flex items-center justify-center"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 to-purple-900/50" />
                    {participant.isVideoOff && (
                      <Avatar className="w-24 h-24 relative z-10">
                        <AvatarImage src={participant.avatar} />
                        <AvatarFallback className="text-2xl">
                          {participant.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    {participant.isSpeaking && (
                      <motion.div
                        className="absolute inset-0 border-4 border-green-400 rounded-lg"
                        animate={{
                          opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                        }}
                      />
                    )}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <Badge className="bg-black/60 text-white border-0">
                        {participant.name}
                      </Badge>
                      <div className="flex gap-1">
                        {participant.isMuted && (
                          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                            <MicOff className="w-3 h-3 text-white" />
                          </div>
                        )}
                        {participant.isVideoOff && (
                          <div className="w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center">
                            <VideoOff className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          <div className="p-4 bg-slate-800/50 border-t border-slate-700">
            <div className="flex items-center justify-center gap-3">
              <Button
                size="lg"
                variant={isMuted ? "destructive" : "secondary"}
                className="rounded-full w-14 h-14 p-0"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </Button>
              <Button
                size="lg"
                variant={isVideoOn ? "secondary" : "destructive"}
                className="rounded-full w-14 h-14 p-0"
                onClick={() => setIsVideoOn(!isVideoOn)}
              >
                {isVideoOn ? (
                  <Video className="w-5 h-5" />
                ) : (
                  <VideoOff className="w-5 h-5" />
                )}
              </Button>
              <Button
                size="lg"
                variant={isScreenSharing ? "default" : "secondary"}
                className="rounded-full w-14 h-14 p-0"
                onClick={toggleScreenShare}
              >
                {isScreenSharing ? (
                  <ScreenShareOff className="w-5 h-5" />
                ) : (
                  <ScreenShare className="w-5 h-5" />
                )}
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="rounded-full w-14 h-14 p-0"
                onClick={() => setShowSettingsDialog(true)}
              >
                <Settings className="w-5 h-5" />
              </Button>
              <div className="w-px h-10 bg-slate-700 mx-2" />
              <Button
                size="lg"
                variant="destructive"
                className="rounded-full w-14 h-14 p-0"
                onClick={onEndCall}
              >
                <PhoneOff className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Normal view - bottom-right floating window
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const containerClasses =
    "fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 z-[100] md:w-96";
  return (
    <>
      {isMobile ? (
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
            scale: 0.9,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            y: 20,
            scale: 0.9,
          }}
          className={containerClasses}
        >
          <Card className="bg-card border-2 border-border shadow-2xl overflow-hidden">
            <div className="p-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between cursor-move">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <p className="text-sm text-white font-medium">
                  {callType === "room" && roomName
                    ? roomName
                    : participants[0]?.name || "Video Call"}
                </p>
                <Badge variant="secondary" className="text-xs h-4">
                  {participants.length}
                </Badge>
              </div>
              <div
                className="flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-white hover:bg-white/10"
                  onClick={toggleExpand}
                >
                  <Maximize2 className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-white hover:bg-white/10"
                  onClick={onMinimize}
                >
                  <Minimize2 className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-red-400 hover:bg-red-500/20"
                  onClick={onEndCall}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div className="relative h-64 bg-gradient-to-br from-blue-900/50 to-purple-900/50">
              {isAnyoneSharing && (
                <div className="absolute top-2 left-2 right-2 z-10">
                  <Badge className="bg-blue-500 text-white border-0 flex items-center gap-1.5 w-full justify-center">
                    <Monitor className="w-3 h-3" />
                    {isScreenSharing
                      ? "You are sharing screen"
                      : `${screenSharingParticipant?.name} is sharing`}
                  </Badge>
                </div>
              )}
              <div className="absolute inset-0 grid grid-cols-2 gap-2 p-2">
                <div className="relative bg-slate-800 rounded-lg overflow-hidden">
                  {isVideoOn && localStream ? (
                    <video
                      ref={localVideoRef}
                      autoPlay={true}
                      playsInline={true}
                      muted={true}
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                      <Avatar className="w-16 h-16">
                        <AvatarFallback>YOU</AvatarFallback>
                      </Avatar>
                      {!localStream && (
                        <Button
                          size="sm"
                          variant="default"
                          className="text-xs"
                          onClick={requestMediaAccess}
                          disabled={isRequestingMedia}
                        >
                          <Camera className="w-3 h-3 mr-1" />
                          {isRequestingMedia
                            ? "Requesting..."
                            : "Enable Camera"}
                        </Button>
                      )}
                    </div>
                  )}
                  <div className="absolute bottom-1 left-1 right-1">
                    <Badge className="bg-black/60 text-white border-0 text-xs w-full justify-center">
                      You
                    </Badge>
                  </div>
                  <div className="absolute top-1 right-1 flex gap-0.5">
                    {isMuted && (
                      <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <MicOff className="w-2 h-2 text-white" />
                      </div>
                    )}
                    {!isVideoOn && (
                      <div className="w-4 h-4 bg-slate-600 rounded-full flex items-center justify-center">
                        <VideoOff className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </div>
                </div>
                {participants.slice(0, 3).map((participant) => (
                  <div
                    key={participant.id}
                    className="relative bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center"
                  >
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={participant.avatar} />
                      <AvatarFallback>
                        {participant.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {participant.isSpeaking && (
                      <motion.div
                        className="absolute inset-0 border-2 border-green-400 rounded-lg"
                        animate={{
                          opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                        }}
                      />
                    )}
                    <div className="absolute bottom-1 left-1 right-1">
                      <Badge className="bg-black/60 text-white border-0 text-xs w-full justify-center truncate">
                        {participant.name.split(" ")[0]}
                      </Badge>
                    </div>
                    <div className="absolute top-1 right-1 flex gap-0.5">
                      {participant.isMuted && (
                        <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <MicOff className="w-2 h-2 text-white" />
                        </div>
                      )}
                      {participant.isScreenSharing && (
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <Monitor className="w-2 h-2 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-3 bg-slate-800 flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant={isMuted ? "destructive" : "secondary"}
                className="rounded-full h-10 w-10 p-0"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant={isVideoOn ? "secondary" : "destructive"}
                className="rounded-full h-10 w-10 p-0"
                onClick={() => setIsVideoOn(!isVideoOn)}
              >
                {isVideoOn ? (
                  <Video className="w-4 h-4" />
                ) : (
                  <VideoOff className="w-4 h-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant={isScreenSharing ? "default" : "secondary"}
                className="rounded-full h-10 w-10 p-0"
                onClick={toggleScreenShare}
              >
                {isScreenSharing ? (
                  <ScreenShareOff className="w-4 h-4" />
                ) : (
                  <ScreenShare className="w-4 h-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="rounded-full h-10 w-10 p-0"
                onClick={onEndCall}
              >
                <PhoneOff className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          drag={window.innerWidth >= 768}
          dragMomentum={false}
          dragElastic={0}
          dragConstraints={{
            left: -window.innerWidth + 400,
            right: 0,
            top: -window.innerHeight + 200,
            bottom: 0,
          }}
          initial={{
            opacity: 0,
            y: 20,
            scale: 0.9,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            y: 20,
            scale: 0.9,
          }}
          className={containerClasses}
        >
          <Card className="bg-card border-2 border-border shadow-2xl overflow-hidden">
            <div className="p-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between cursor-move">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <p className="text-sm text-white font-medium">
                  {callType === "room" && roomName
                    ? roomName
                    : participants[0]?.name || "Video Call"}
                </p>
                <Badge variant="secondary" className="text-xs h-4">
                  {participants.length}
                </Badge>
              </div>
              <div
                className="flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-white hover:bg-white/10"
                  onClick={toggleExpand}
                >
                  <Maximize2 className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-white hover:bg-white/10"
                  onClick={onMinimize}
                >
                  <Minimize2 className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-red-400 hover:bg-red-500/20"
                  onClick={onEndCall}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div className="relative h-64 bg-gradient-to-br from-blue-900/50 to-purple-900/50">
              {isAnyoneSharing && (
                <div className="absolute top-2 left-2 right-2 z-10">
                  <Badge className="bg-blue-500 text-white border-0 flex items-center gap-1.5 w-full justify-center">
                    <Monitor className="w-3 h-3" />
                    {isScreenSharing
                      ? "You are sharing screen"
                      : `${screenSharingParticipant?.name} is sharing`}
                  </Badge>
                </div>
              )}
              <div className="absolute inset-0 grid grid-cols-2 gap-2 p-2">
                <div className="relative bg-slate-800 rounded-lg overflow-hidden">
                  {isVideoOn && localStream ? (
                    <video
                      ref={localVideoRef}
                      autoPlay={true}
                      playsInline={true}
                      muted={true}
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                      <Avatar className="w-16 h-16">
                        <AvatarFallback>YOU</AvatarFallback>
                      </Avatar>
                      {!localStream && (
                        <Button
                          size="sm"
                          variant="default"
                          className="text-xs"
                          onClick={requestMediaAccess}
                          disabled={isRequestingMedia}
                        >
                          <Camera className="w-3 h-3 mr-1" />
                          {isRequestingMedia
                            ? "Requesting..."
                            : "Enable Camera"}
                        </Button>
                      )}
                    </div>
                  )}
                  <div className="absolute bottom-1 left-1 right-1">
                    <Badge className="bg-black/60 text-white border-0 text-xs w-full justify-center">
                      You
                    </Badge>
                  </div>
                  <div className="absolute top-1 right-1 flex gap-0.5">
                    {isMuted && (
                      <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <MicOff className="w-2 h-2 text-white" />
                      </div>
                    )}
                    {!isVideoOn && (
                      <div className="w-4 h-4 bg-slate-600 rounded-full flex items-center justify-center">
                        <VideoOff className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </div>
                </div>
                {participants.slice(0, 3).map((participant) => (
                  <div
                    key={participant.id}
                    className="relative bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center"
                  >
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={participant.avatar} />
                      <AvatarFallback>
                        {participant.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {participant.isSpeaking && (
                      <motion.div
                        className="absolute inset-0 border-2 border-green-400 rounded-lg"
                        animate={{
                          opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                        }}
                      />
                    )}
                    <div className="absolute bottom-1 left-1 right-1">
                      <Badge className="bg-black/60 text-white border-0 text-xs w-full justify-center truncate">
                        {participant.name.split(" ")[0]}
                      </Badge>
                    </div>
                    <div className="absolute top-1 right-1 flex gap-0.5">
                      {participant.isMuted && (
                        <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <MicOff className="w-2 h-2 text-white" />
                        </div>
                      )}
                      {participant.isScreenSharing && (
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <Monitor className="w-2 h-2 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-3 bg-slate-800 flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant={isMuted ? "destructive" : "secondary"}
                className="rounded-full h-10 w-10 p-0"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant={isVideoOn ? "secondary" : "destructive"}
                className="rounded-full h-10 w-10 p-0"
                onClick={() => setIsVideoOn(!isVideoOn)}
              >
                {isVideoOn ? (
                  <Video className="w-4 h-4" />
                ) : (
                  <VideoOff className="w-4 h-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant={isScreenSharing ? "default" : "secondary"}
                className="rounded-full h-10 w-10 p-0"
                onClick={toggleScreenShare}
              >
                {isScreenSharing ? (
                  <ScreenShareOff className="w-4 h-4" />
                ) : (
                  <ScreenShare className="w-4 h-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="rounded-full h-10 w-10 p-0"
                onClick={onEndCall}
              >
                <PhoneOff className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
      <Dialog
        open={showParticipantsPanel}
        onOpenChange={setShowParticipantsPanel}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Participants ({participants.length})
            </DialogTitle>
            <DialogDescription>People in this call</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-96">
            <div className="space-y-2">
              {participants.map((participant, index) => (
                <div
                  key={participant.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <Avatar>
                    <AvatarImage src={participant.avatar} />
                    <AvatarFallback>
                      {participant.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{participant.name}</p>
                      {index === 0 && (
                        <Crown className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      {participant.isMuted && (
                        <MicOff className="w-3 h-3 text-red-500" />
                      )}
                      {participant.isVideoOff && (
                        <VideoOff className="w-3 h-3 text-slate-500" />
                      )}
                      {participant.isScreenSharing && (
                        <Monitor className="w-3 h-3 text-blue-500" />
                      )}
                      {participant.isSpeaking && (
                        <span className="text-green-500">Speaking...</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Call Settings
            </DialogTitle>
            <DialogDescription>
              Adjust your audio and video settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="microphone" className="flex items-center gap-2">
                <Mic className="w-4 h-4" />
                Microphone
              </Label>
              <Select
                value={selectedMicrophone}
                onValueChange={setSelectedMicrophone}
              >
                <SelectTrigger id="microphone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default Microphone</SelectItem>
                  <SelectItem value="built-in">Built-in Microphone</SelectItem>
                  <SelectItem value="external">External Microphone</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="camera" className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Camera
              </Label>
              <Select value={selectedCamera} onValueChange={setSelectedCamera}>
                <SelectTrigger id="camera">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default Camera</SelectItem>
                  <SelectItem value="built-in">Built-in Camera</SelectItem>
                  <SelectItem value="external">External Camera</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="speaker" className="flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                Speaker
              </Label>
              <Select
                value={selectedSpeaker}
                onValueChange={setSelectedSpeaker}
              >
                <SelectTrigger id="speaker">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default Speaker</SelectItem>
                  <SelectItem value="built-in">Built-in Speaker</SelectItem>
                  <SelectItem value="external">External Speaker</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowSettingsDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  toast.success("Settings saved");
                  setShowSettingsDialog(false);
                }}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
