import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import CallRoom from "../components/calls/CallRoom";
import IncomingCallBanner from "../components/calls/IncomingCallBanner";
import TeamCallModal from "../components/calls/TeamCallModal";
import useCallToken from "../hooks/useCallToken";
import { subscribeToCallEvents } from "../utils/socketIoRealtime";
import { getStartupId } from "../utils/startupId";

const CallCoordinatorContext = createContext(null);

export function CallCoordinatorProvider({ user, children }) {
  const { createCall, joinCall, inviteToCall, endCall, loading, error } = useCallToken();
  const [showCallModal, setShowCallModal] = useState(false);
  const [activeCall, setActiveCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [teamRoster, setTeamRoster] = useState([]);

  const currentUserId = String(user?._id ?? user?.id ?? "");
  const startupId = getStartupId(user);

  useEffect(() => {
    if (!currentUserId) return undefined;

    return subscribeToCallEvents({
      currentUserId,
      startupId,
      onStarted: (data) => {
        setIncomingCall(data);
      },
      onInvited: (data) => {
        setIncomingCall(data);
      },
      onEnded: (data) => {
        setIncomingCall((prev) =>
          prev?.roomName === data?.roomName ? null : prev,
        );
        setActiveCall((prev) =>
          prev?.roomName === data?.roomName ? null : prev,
        );
      },
    });
  }, [currentUserId, startupId]);

  const buildActiveCall = useCallback(
    (result, extras = {}) => ({
      token: result.token,
      roomName: result.roomName,
      callType: result.callType,
      initiatorId: String(result.initiatorId || currentUserId),
      startupId: String(result.startupId || startupId || ""),
      ...extras,
    }),
    [currentUserId, startupId],
  );

  const startTeamCall = useCallback(
    async (callType) => {
      setShowCallModal(false);
      const result = await createCall(callType);
      if (result) {
        setActiveCall(buildActiveCall(result));
      }
    },
    [createCall, buildActiveCall],
  );

  const startDirectCall = useCallback(
    async (peerUserId, callType = "video") => {
      if (!peerUserId) return;
      const result = await createCall(callType);
      if (!result) return;
      try {
        await inviteToCall(result.roomName, peerUserId);
      } catch {
        // Invite is best-effort; caller still joins the room.
      }
      setActiveCall(buildActiveCall(result));
    },
    [createCall, inviteToCall, buildActiveCall],
  );

  const joinCallByRoom = useCallback(
    async (roomName, callTypeHint = "video") => {
      if (!roomName) return;
      setIncomingCall(null);
      const result = await joinCall(roomName);
      if (result) {
        setActiveCall(
          buildActiveCall({
            ...result,
            callType: result.callType || callTypeHint,
          }),
        );
      }
    },
    [joinCall, buildActiveCall],
  );

  const leaveCall = useCallback(() => {
    const call = activeCall;
    setActiveCall(null);
    if (
      call?.roomName &&
      currentUserId &&
      String(call.initiatorId) === currentUserId
    ) {
      void endCall(call.roomName).catch(() => {});
    }
  }, [activeCall, currentUserId, endCall]);

  const registerTeamRoster = useCallback((roster) => {
    setTeamRoster(Array.isArray(roster) ? roster : []);
  }, []);

  const value = useMemo(
    () => ({
      activeCall,
      incomingCall,
      showCallModal,
      setShowCallModal,
      startTeamCall,
      startDirectCall,
      joinCall: joinCallByRoom,
      leaveCall,
      registerTeamRoster,
      loading,
      error,
    }),
    [
      activeCall,
      incomingCall,
      showCallModal,
      startTeamCall,
      startDirectCall,
      joinCallByRoom,
      leaveCall,
      registerTeamRoster,
      loading,
      error,
    ],
  );

  const callTitle = activeCall
    ? `Team ${activeCall.callType === "video" ? "Video" : "Voice"} Call`
    : "";

  return (
    <CallCoordinatorContext.Provider value={value}>
      {children}
      <TeamCallModal
        isOpen={showCallModal}
        onClose={() => setShowCallModal(false)}
        onStart={startTeamCall}
      />
      <IncomingCallBanner
        callData={incomingCall}
        onJoin={() =>
          joinCallByRoom(incomingCall?.roomName, incomingCall?.callType)
        }
        onDismiss={() => setIncomingCall(null)}
      />
      {activeCall && (
        <div className="fixed inset-0 z-[999]">
          <CallRoom
            token={activeCall.token}
            roomName={activeCall.roomName}
            callType={activeCall.callType}
            callTitle={callTitle}
            currentUserId={currentUserId}
            initiatorId={activeCall.initiatorId}
            startupId={activeCall.startupId || startupId}
            userName={user?.name}
            userRole={user?.role}
            teamRoster={teamRoster}
            onLeave={leaveCall}
          />
        </div>
      )}
    </CallCoordinatorContext.Provider>
  );
}

export function useCallCoordinator() {
  const ctx = useContext(CallCoordinatorContext);
  if (!ctx) {
    throw new Error("useCallCoordinator must be used within CallCoordinatorProvider");
  }
  return ctx;
}
