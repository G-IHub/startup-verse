import { useEffect } from "react";
import * as presenceApi from "../../utils/presenceApi";

const PRESENCE_HEARTBEAT_MS = 20_000;

export function useCallPresence({
  userId,
  userName,
  role,
  startupId,
  roomName,
  callType = "video",
  isInCall,
}) {
  useEffect(() => {
    const normalizedUserId = String(userId || "");
    const normalizedStartupId = String(startupId || "");
    const normalizedRoomName = String(roomName || "");
    if (!isInCall || !normalizedUserId || !normalizedStartupId || !normalizedRoomName) {
      return undefined;
    }

    const base = {
      userId: normalizedUserId,
      startupId: normalizedStartupId,
      userName: String(userName || "Team member"),
      role: String(role || "team-member"),
      isOnline: true,
    };

    const inCallMetadata = {
      inCall: true,
      callRoomName: normalizedRoomName,
      callType: String(callType || "video"),
    };

    const heartbeat = () => {
      void presenceApi.updatePresence({
        ...base,
        status: "in-meeting",
        statusText: "In a team call",
        metadata: inCallMetadata,
      });
    };

    heartbeat();
    const interval = setInterval(heartbeat, PRESENCE_HEARTBEAT_MS);

    return () => {
      clearInterval(interval);
      void presenceApi.updatePresence({
        ...base,
        status: "available",
        statusText: "",
        metadata: {
          inCall: false,
          callRoomName: "",
          callType: "",
        },
      });
    };
  }, [callType, isInCall, roomName, role, startupId, userId, userName]);
}
