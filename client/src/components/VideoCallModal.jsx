import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Phone,
  Settings,
  Users,
  MessageSquare,
  Grid3x3,
  Maximize2,
} from "lucide-react";
import { Card } from "./ui/card";
export function VideoCallModal({
  isOpen,
  onClose,
  callType,
  participant,
  participants = [],
}) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [viewMode, setViewMode] = useState("speaker");
  const [callDuration, setCallDuration] = useState(0);
  const [showChat, setShowChat] = useState(false);
  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCallDuration(0);
    }
  }, [isOpen]);
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
  const handleEndCall = () => {
    setIsMuted(false);
    setIsVideoOff(false);
    setIsScreenSharing(false);
    setShowChat(false);
    onClose();
  };
  const allParticipants =
    callType === "one-on-one" ? [participant || "Unknown User"] : participants;
  return (
    <Dialog open={isOpen} onOpenChange={handleEndCall}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>
            {callType === "one-on-one"
              ? `Call with ${participant}`
              : "Team Meeting"}
          </DialogTitle>
          <DialogDescription>Video call in progress</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col h-full bg-zinc-900 text-white">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm">{formatDuration(callDuration)}</span>
            </div>
            <span className="text-white">
              {callType === "one-on-one"
                ? `Call with ${participant}`
                : "Team Meeting"}
            </span>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setViewMode(viewMode === "grid" ? "speaker" : "grid")
                }
                className="text-white hover:bg-zinc-800"
              >
                {viewMode === "grid" ? (
                  <Maximize2 className="w-4 h-4" />
                ) : (
                  <Grid3x3 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="flex-1 relative bg-black overflow-hidden">
            {viewMode === "speaker" ? (
              <>
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                  <div className="text-center">
                    <div className="w-32 h-32 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-4xl">
                        {isVideoOff ? <VideoOff className="w-16 h-16" /> : "👤"}
                      </span>
                    </div>
                    <h3 className="text-xl mb-1">You</h3>
                    <p className="text-sm text-zinc-400">
                      {isVideoOff ? "Camera is off" : "Camera is on"}
                    </p>
                  </div>
                </div>
                {allParticipants.length > 0 && (
                  <div className="absolute top-4 right-4 space-y-2">
                    {allParticipants.map((p, idx) => (
                      <Card
                        key={idx}
                        className="w-40 h-28 bg-zinc-800 border-zinc-700 overflow-hidden"
                      >
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                          <div className="text-center">
                            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-1">
                              <span className="text-lg">
                                {p.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <p className="text-xs truncate px-2">{p}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4 h-full">
                <Card className="bg-zinc-800 border-zinc-700 overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-2xl">👤</span>
                      </div>
                      <p className="text-sm">You</p>
                    </div>
                  </div>
                </Card>
                {allParticipants.map((p, idx) => (
                  <Card
                    key={idx}
                    className="bg-zinc-800 border-zinc-700 overflow-hidden"
                  >
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                      <div className="text-center">
                        <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-2">
                          <span className="text-2xl">
                            {p.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm truncate px-2">{p}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            {isScreenSharing && (
              <div className="absolute top-4 left-4 bg-primary px-4 py-2 rounded-lg flex items-center space-x-2">
                <Monitor className="w-4 h-4" />
                <span className="text-sm">You are sharing your screen</span>
              </div>
            )}
          </div>
          <div className="px-6 py-4 bg-zinc-900 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-zinc-800"
                >
                  <Settings className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-zinc-800"
                  onClick={() => setShowChat(!showChat)}
                >
                  <MessageSquare className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant={isMuted ? "destructive" : "secondary"}
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </Button>
                <Button
                  variant={isVideoOff ? "destructive" : "secondary"}
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={() => setIsVideoOff(!isVideoOff)}
                >
                  {isVideoOff ? (
                    <VideoOff className="w-5 h-5" />
                  ) : (
                    <Video className="w-5 h-5" />
                  )}
                </Button>
                <Button
                  variant={isScreenSharing ? "default" : "secondary"}
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={() => setIsScreenSharing(!isScreenSharing)}
                >
                  {isScreenSharing ? (
                    <MonitorOff className="w-5 h-5" />
                  ) : (
                    <Monitor className="w-5 h-5" />
                  )}
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-12 w-12 rounded-full bg-red-600 hover:bg-red-700"
                  onClick={handleEndCall}
                >
                  <Phone className="w-5 h-5 rotate-[135deg]" />
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-zinc-800"
                >
                  <Users className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center mt-2 space-x-8 text-xs text-zinc-400">
              <span>{isMuted ? "Unmute" : "Mute"}</span>
              <span>{isVideoOff ? "Start Video" : "Stop Video"}</span>
              <span>{isScreenSharing ? "Stop Share" : "Share Screen"}</span>
              <span>End Call</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
