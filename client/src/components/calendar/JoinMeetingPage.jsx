/**
 * Join Meeting Page
 * Direct link page for joining meetings via /join/:roomName
 */

import React, { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Video, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { GoogleMeetCall } from "../office/GoogleMeetCall";
import { STORAGE_KEYS } from "../../app/session";

export default function JoinMeetingPage({ roomName }) {
  const [isLoading, setIsLoading] = useState(true);
  const [meeting, setMeeting] = useState(null);
  const [error, setError] = useState(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [userName, setUserName] = useState("");
  useEffect(() => {
    loadMeetingDetails();
    loadUserName();
  }, [roomName]);
  const loadMeetingDetails = async () => {
    try {
      // Try to find meeting by room name
      // Since we can't query by roomName directly, we'll accept any room
      setMeeting({
        roomName,
        title: "Team Meeting",
      });
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to load meeting:", error);
      setError("Failed to load meeting details");
      setIsLoading(false);
    }
  };
  const loadUserName = () => {
    const user = localStorage.getItem(STORAGE_KEYS.currentUser);
    if (user) {
      const userData = JSON.parse(user);
      setUserName(userData.name || "Guest");
    } else {
      setUserName("Guest");
    }
  };
  const handleJoinMeeting = () => {
    setHasJoined(true);
  };
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 max-w-md w-full text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-semibold mb-2">Loading meeting...</h2>
          <p className="text-sm text-muted-foreground">
            Please wait while we prepare your meeting room
          </p>
        </Card>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h2 className="text-xl font-semibold mb-2">Unable to join meeting</h2>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => (window.location.href = "/")}>
            Go to Dashboard
          </Button>
        </Card>
      </div>
    );
  }
  if (hasJoined) {
    return (
      <div className="h-screen w-screen">
        <GoogleMeetCall
          meetLink={`https://meet.google.com/${roomName}`}
          onEndCall={() => {
            setHasJoined(false);
            window.location.href = "/";
          }}
          currentUserName={userName}
        />
      </div>
    );
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="p-8 max-w-lg w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">
            {meeting?.title || "Team Meeting"}
          </h1>
          <p className="text-muted-foreground">
            You're about to join this meeting
          </p>
        </div>
        {meeting?.description && (
          <div className="bg-muted p-4 rounded-lg mb-6">
            <p className="text-sm">{meeting.description}</p>
          </div>
        )}
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3 text-sm">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span>Camera and microphone ready</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span>
              {"Joining as: "}
              <strong>{userName}</strong>
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span>High-quality video enabled</span>
          </div>
        </div>
        <Button onClick={handleJoinMeeting} className="w-full" size="lg">
          <Video className="w-5 h-5 mr-2" />
          Join Meeting Now
        </Button>
        <p className="text-xs text-center text-muted-foreground mt-4">
          By joining, you agree to allow StartupVerse to use your camera and
          microphone
        </p>
      </Card>
    </div>
  );
}
