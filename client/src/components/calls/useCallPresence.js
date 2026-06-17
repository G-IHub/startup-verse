import React, { useEffect } from "react";
import { ConnectionState } from "livekit-client";
import * as presenceApi from "../../utils/presenceApi";

const IN_CALL_ACTIVITY = { type: "in-call", message: "In a team call" };
const WORKING_ACTIVITY = { type: "working", message: "" };
const PRESENCE_REFRESH_MS = 20_000;

export function useCallPresence({
  userId,
  userName,
  role,
  startupId,
  isInCall,
  connectionState,
}) {
  useEffect(() => {
    const normalizedUserId = String(userId || "");
    const normalizedStartupId = String(startupId || "");
    if (!isInCall || !normalizedUserId || !normalizedStartupId) return undefined;

    const base = {
      userId: normalizedUserId,
      startupId: normalizedStartupId,
      userName: String(userName || "Team member"),
      role: String(role || "team-member"),
      isOnline: true,
    };

    const assertInCall = () => {
      void presenceApi.updatePresence({
        ...base,
        status: "in-meeting",
        activity: IN_CALL_ACTIVITY,
      });
    };

    assertInCall();
    const interval = setInterval(assertInCall, PRESENCE_REFRESH_MS);

    return () => {
      clearInterval(interval);
      void presenceApi.updatePresence({
        ...base,
        status: "available",
        activity: WORKING_ACTIVITY,
      });
    };
  }, [isInCall, userId, startupId, userName, role]);

  useEffect(() => {
    if (!isInCall || connectionState !== ConnectionState.Connected) return;
    const normalizedUserId = String(userId || "");
    const normalizedStartupId = String(startupId || "");
    if (!normalizedUserId || !normalizedStartupId) return;

    void presenceApi.updatePresence({
      userId: normalizedUserId,
      startupId: normalizedStartupId,
      userName: String(userName || "Team member"),
      role: String(role || "team-member"),
      isOnline: true,
      status: "in-meeting",
      activity: IN_CALL_ACTIVITY,
    });
  }, [connectionState, isInCall, userId, startupId, userName, role]);
}
