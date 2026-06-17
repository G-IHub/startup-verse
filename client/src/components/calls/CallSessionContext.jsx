import React, { createContext, useContext, useMemo } from "react";

const CallSessionContext = createContext(null);

export function CallSessionProvider({
  children,
  roomName,
  callType,
  currentUserId,
  initiatorId,
  startupId,
  userName,
  userRole,
  teamRoster = [],
  onLeave,
}) {
  const normalizedUserId = String(currentUserId || "");
  const normalizedInitiatorId = String(initiatorId || "");

  const value = useMemo(
    () => ({
      roomName,
      callType,
      currentUserId: normalizedUserId,
      initiatorId: normalizedInitiatorId,
      startupId: String(startupId || ""),
      userName: String(userName || ""),
      userRole: String(userRole || "team-member"),
      isInitiator:
        Boolean(normalizedUserId) &&
        Boolean(normalizedInitiatorId) &&
        normalizedUserId === normalizedInitiatorId,
      teamRoster: Array.isArray(teamRoster) ? teamRoster : [],
      onLeave,
    }),
    [
      roomName,
      callType,
      normalizedUserId,
      normalizedInitiatorId,
      startupId,
      userName,
      userRole,
      teamRoster,
      onLeave,
    ],
  );

  return (
    <CallSessionContext.Provider value={value}>
      {children}
    </CallSessionContext.Provider>
  );
}

export function useCallSession() {
  const ctx = useContext(CallSessionContext);
  if (!ctx) {
    throw new Error("useCallSession must be used within CallSessionProvider");
  }
  return ctx;
}
