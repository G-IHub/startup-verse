import React, { useState } from "react";
import { motion } from "motion/react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Maximize2,
  Minimize2,
  ScreenShare,
  MoreVertical,
  X,
} from "lucide-react";
export default function FloatingVideoCall({
  participants,
  isOpen,
  onClose,
  currentUserId,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [myVideoOn, setMyVideoOn] = useState(true);
  const [myAudioOn, setMyAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Simulate call duration timer
  React.useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };
  if (!isOpen) return null;

  // Minimized state - just a small badge
  if (isMinimized) {
    return (
      <motion.div
        initial={{
          scale: 0,
          opacity: 0,
        }}
        animate={{
          scale: 1,
          opacity: 1,
        }}
        exit={{
          scale: 0,
          opacity: 0,
        }}
        className="fixed bottom-4 right-4 z-50"
      >
        <Button
          onClick={() => setIsMinimized(false)}
          className="h-14 px-4 bg-primary text-white shadow-xl hover:shadow-2xl rounded-full"
        >
          <Video className="w-5 h-5 mr-2" />
          <div className="text-left">
            <div className="text-xs font-medium">Call in progress</div>
            <div className="text-xs opacity-80">
              {participants.length}
              {" people • "}
              {formatDuration(callDuration)}
            </div>
          </div>
        </Button>
      </motion.div>
    );
  }

  // Expanded state - larger overlay
  if (isExpanded) {
    return (
      <motion.div
        initial={{
          scale: 0.9,
          opacity: 0,
        }}
        animate={{
          scale: 1,
          opacity: 1,
        }}
        exit={{
          scale: 0.9,
          opacity: 0,
        }}
        className="fixed inset-4 z-50 flex items-center justify-center"
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsExpanded(false)}
        />
        <Card className="relative w-full max-w-6xl h-[80vh] border-2 border-primary shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className="bg-red-500/90 text-white">
                  <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                  LIVE
                </Badge>
                <span className="text-white text-sm font-medium">
                  {participants.length}{" "}
                  {participants.length === 1 ? "participant" : "participants"}
                </span>
                <span className="text-white/70 text-sm">
                  {formatDuration(callDuration)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsExpanded(false)}
                  className="text-white hover:bg-white/20"
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onClose}
                  className="text-white hover:bg-white/20"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="w-full h-full bg-card border border-border p-4">
            <div
              className={`grid gap-3 h-full ${participants.length === 1 ? "grid-cols-1" : participants.length === 2 ? "grid-cols-2" : participants.length <= 4 ? "grid-cols-2" : participants.length <= 6 ? "grid-cols-3" : "grid-cols-4"}`}
            >
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className={`relative bg-slate-800 rounded-lg overflow-hidden ${participant.isSpeaking ? "ring-2 ring-green-500" : ""}`}
                >
                  {participant.isVideoOn ? (
                    <div className="w-full h-full bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
                      <span className="text-white/50 text-sm">Video feed</span>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Avatar className="w-24 h-24">
                        <AvatarImage src={participant.avatar} />
                        <AvatarFallback className="text-2xl">
                          {participant.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                      <span className="text-white text-sm font-medium">
                        {participant.name}
                      </span>
                      {participant.id === currentUserId && (
                        <Badge
                          variant="secondary"
                          className="text-xs h-4 px-1.5"
                        >
                          You
                        </Badge>
                      )}
                    </div>
                    {!participant.isAudioOn && (
                      <div className="bg-red-500/90 p-1.5 rounded-lg">
                        <MicOff className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6">
            <div className="flex items-center justify-center gap-3">
              <Button
                size="lg"
                variant={myAudioOn ? "secondary" : "destructive"}
                onClick={() => setMyAudioOn(!myAudioOn)}
                className="rounded-full w-14 h-14"
              >
                {myAudioOn ? (
                  <Mic className="w-5 h-5" />
                ) : (
                  <MicOff className="w-5 h-5" />
                )}
              </Button>
              <Button
                size="lg"
                variant={myVideoOn ? "secondary" : "destructive"}
                onClick={() => setMyVideoOn(!myVideoOn)}
                className="rounded-full w-14 h-14"
              >
                {myVideoOn ? (
                  <Video className="w-5 h-5" />
                ) : (
                  <VideoOff className="w-5 h-5" />
                )}
              </Button>
              <Button
                size="lg"
                variant={isScreenSharing ? "default" : "secondary"}
                onClick={() => setIsScreenSharing(!isScreenSharing)}
                className="rounded-full w-14 h-14"
              >
                <ScreenShare className="w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="rounded-full w-14 h-14"
              >
                <MoreVertical className="w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="destructive"
                onClick={onClose}
                className="rounded-full w-14 h-14"
              >
                <PhoneOff className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  // Default state - compact floating window
  return (
    <motion.div
      initial={{
        scale: 0,
        opacity: 0,
        y: 20,
      }}
      animate={{
        scale: 1,
        opacity: 1,
        y: 0,
      }}
      exit={{
        scale: 0,
        opacity: 0,
        y: 20,
      }}
      drag={true}
      dragMomentum={false}
      dragElastic={0.1}
      className="fixed bottom-4 right-4 z-50 cursor-move"
    >
      <Card className="w-80 border-2 border-primary shadow-2xl overflow-hidden">
        <div className="bg-primary p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className="bg-red-500 text-white text-xs">
                <div className="w-1.5 h-1.5 bg-white rounded-full mr-1 animate-pulse" />
                LIVE
              </Badge>
              <span className="text-white text-sm font-medium">
                {formatDuration(callDuration)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsMinimized(true)}
                className="h-7 w-7 p-0 text-white hover:bg-white/20"
              >
                <Minimize2 className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsExpanded(true)}
                className="h-7 w-7 p-0 text-white hover:bg-white/20"
              >
                <Maximize2 className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="h-7 w-7 p-0 text-white hover:bg-white/20"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
        <CardContent className="p-3 space-y-3">
          <div className="space-y-2">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${participant.isSpeaking ? "bg-green-50 border border-green-300" : "bg-slate-50"}`}
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={participant.avatar} />
                  <AvatarFallback className="text-xs">
                    {participant.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {participant.name}
                    {participant.id === currentUserId && (
                      <span className="text-xs text-muted-foreground ml-1">
                        (You)
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {participant.isVideoOn ? (
                    <Video className="w-3 h-3 text-green-600" />
                  ) : (
                    <VideoOff className="w-3 h-3 text-gray-400" />
                  )}
                  {participant.isAudioOn ? (
                    <Mic className="w-3 h-3 text-green-600" />
                  ) : (
                    <MicOff className="w-3 h-3 text-red-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 pt-2 border-t">
            <Button
              size="sm"
              variant={myAudioOn ? "secondary" : "destructive"}
              onClick={() => setMyAudioOn(!myAudioOn)}
              className="flex-1"
            >
              {myAudioOn ? (
                <Mic className="w-3 h-3" />
              ) : (
                <MicOff className="w-3 h-3" />
              )}
            </Button>
            <Button
              size="sm"
              variant={myVideoOn ? "secondary" : "destructive"}
              onClick={() => setMyVideoOn(!myVideoOn)}
              className="flex-1"
            >
              {myVideoOn ? (
                <Video className="w-3 h-3" />
              ) : (
                <VideoOff className="w-3 h-3" />
              )}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={onClose}
              className="flex-1"
            >
              <PhoneOff className="w-3 h-3 mr-1" />
              End
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
