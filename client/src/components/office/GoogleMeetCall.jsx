/**
 * GOOGLE MEET CALL COMPONENT
 * Opens Google Meet in an iframe or new window
 */
import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Video,
  X,
  Minimize2,
  Maximize2,
  ExternalLink,
  Clock,
} from "lucide-react";
import { motion } from "motion/react";
export function GoogleMeetCall({
  meetLink,
  participants = [],
  onEndCall,
  onMinimize,
  isMinimized = false,
  callType = "direct",
  currentUserName,
}) {
  const [callDuration, setCallDuration] = useState(0);

  // Call duration timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
  const getCallTypeLabel = () => {
    switch (callType) {
      case "team":
        return "Team Call";
      case "group":
        return "Group Call";
      case "mentor":
        return "Mentorship Session";
      default:
        return "1-on-1 Call";
    }
  };
  const openInNewWindow = () => {
    window.open(meetLink, "_blank", "noopener,noreferrer");
  };
  if (isMinimized) {
    return (
      <motion.div
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          y: 20,
        }}
        className="fixed bottom-6 right-6 z-50"
      >
        <div className="bg-background border-2 border-[#3A5AFE] rounded-xl shadow-2xl p-4 w-72">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <Badge variant="secondary" className="text-[9px]">
                {getCallTypeLabel()}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={onMinimize}
                className="h-7 w-7 p-0"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onEndCall}
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs font-mono text-muted-foreground">
              {formatDuration(callDuration)}
            </span>
          </div>
          <div className="text-[10px] text-muted-foreground mb-2">
            {participants.length}
            {" participant"}
            {participants.length !== 1 ? "s" : ""}
          </div>
          <Button
            onClick={openInNewWindow}
            className="w-full gap-2 h-8 text-[10px] bg-[#3A5AFE] hover:bg-[#3A5AFE]/90"
          >
            <ExternalLink className="w-3 h-3" />
            Open Google Meet
          </Button>
        </div>
      </motion.div>
    );
  }
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
      className="fixed inset-0 bg-black/95 z-50 flex flex-col"
    >
      <div className="bg-gradient-to-r from-[#3A5AFE] to-[#7C3AED] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <Badge
              variant="secondary"
              className="text-xs bg-white/20 text-white border-white/30"
            >
              {getCallTypeLabel()}
            </Badge>
          </div>
          <div className="h-4 w-px bg-white/30" />
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-mono">
              {formatDuration(callDuration)}
            </span>
          </div>
          <div className="h-4 w-px bg-white/30" />
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4" />
            <span className="text-sm">
              {participants.length}
              {" participant"}
              {participants.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={openInNewWindow}
            className="gap-2 text-white hover:bg-white/20 h-8"
          >
            <ExternalLink className="w-4 h-4" />
            Open in New Tab
          </Button>
          {onMinimize && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onMinimize}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="destructive"
            onClick={onEndCall}
            className="gap-2 h-8"
          >
            <X className="w-4 h-4" />
            End Call
          </Button>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-6xl bg-white rounded-xl shadow-2xl overflow-hidden">
          <div className="p-8 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-[#3A5AFE]/10 flex items-center justify-center mx-auto">
              <Video className="w-10 h-10 text-[#3A5AFE]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Google Meet Session Active
              </h2>
              <p className="text-gray-600">
                Click the button below to join or open the meeting
              </p>
            </div>
            {participants.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full"
                  >
                    {participant.avatar ? (
                      <img
                        src={participant.avatar}
                        alt={participant.name}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                        {participant.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm text-gray-900">
                      {participant.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-3 pt-4">
              <Button
                onClick={openInNewWindow}
                className="w-full max-w-md h-12 text-base bg-[#3A5AFE] hover:bg-[#3A5AFE]/90 gap-2"
              >
                <ExternalLink className="w-5 h-5" />
                Open Google Meet
              </Button>
              <p className="text-xs text-gray-500">
                {"Meeting Link: "}
                <a
                  href={meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#3A5AFE] hover:underline"
                >
                  {meetLink}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
