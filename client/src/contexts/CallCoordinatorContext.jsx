import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CallRoom from "../components/calls/CallRoom";
import IncomingCallBanner from "../components/calls/IncomingCallBanner";
import TeamCallModal from "../components/calls/TeamCallModal";
import useCallToken from "../hooks/useCallToken";
import { useAuth } from "./AuthContext.jsx";
import { subscribeToCallEvents } from "../utils/socketIoRealtime";
import { getStartupId } from "../utils/startupId";
import {
  buildOfficeCallPath,
  isOfficeCallPath,
  parseOfficeCallRoute,
} from "../utils/callRouteUtils";
import {
  clearStoredActiveCall,
  readStoredActiveCall,
  writeStoredActiveCall,
} from "../utils/callSessionStorage";
import { logCallStartedActivity } from "../utils/callActivity";
import { API_BASE_URL } from "../config/apiBase.js";

const CallCoordinatorContext = createContext(null);

function normalizeTeamLiveCall(data) {
  if (!data?.roomName) return null;
  return {
    roomName: String(data.roomName),
    callType: String(data.callType || "video"),
    initiatorId: String(data.initiatorId || ""),
    initiatorName: String(data.initiatorName || "A teammate"),
    invited: Boolean(data.invited),
  };
}

export function CallCoordinatorProvider({ user, children }) {
  const { createCall, joinCall, inviteToCall, endCall, loading, error } = useCallToken();
  const { isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showCallModal, setShowCallModal] = useState(false);
  const [activeCall, setActiveCall] = useState(null);
  const [teamLiveCall, setTeamLiveCall] = useState(null);
  const [bannerDismissedRoom, setBannerDismissedRoom] = useState("");
  const [teamRoster, setTeamRoster] = useState([]);
  const [restoringCall, setRestoringCall] = useState(false);
  const leaveInFlightRef = useRef(false);
  const skipNextUrlSyncRef = useRef(false);
  const hadActiveCallRef = useRef(false);

  const currentUserId = String(user?._id ?? user?.id ?? "");
  const startupId = getStartupId(user);

  const syncCallUrl = useCallback(
    (call) => {
      if (!call?.roomName) return;
      const targetPath = buildOfficeCallPath(call.roomName, call.callType);
      const current = `${location.pathname}${location.search}`;
      if (current === targetPath) return;
      skipNextUrlSyncRef.current = true;
      navigate(targetPath, { replace: true });
    },
    [location.pathname, location.search, navigate],
  );

  const clearCallUrl = useCallback(() => {
    if (!isOfficeCallPath(location.pathname)) return;
    skipNextUrlSyncRef.current = true;
    navigate("/office", { replace: true });
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (!currentUserId) return undefined;

    return subscribeToCallEvents({
      currentUserId,
      startupId,
      onStarted: (data) => {
        const live = normalizeTeamLiveCall(data);
        if (live) {
          setTeamLiveCall(live);
          setBannerDismissedRoom("");
        }
      },
      onInvited: (data) => {
        const live = normalizeTeamLiveCall({ ...data, invited: true });
        if (live) {
          setTeamLiveCall(live);
          setBannerDismissedRoom("");
        }
      },
      onEnded: (data) => {
        const endedRoom = String(data?.roomName || "");
        if (endedRoom) {
          setTeamLiveCall((prev) =>
            prev?.roomName === endedRoom ? null : prev,
          );
          setBannerDismissedRoom((prev) =>
            prev === endedRoom ? "" : prev,
          );
        }
        setActiveCall((prev) => {
          if (prev?.roomName !== endedRoom) return prev;
          clearStoredActiveCall();
          return null;
        });
      },
    });
  }, [currentUserId, startupId]);

  useEffect(() => {
    if (!activeCall?.roomName) return;
    setTeamLiveCall({
      roomName: activeCall.roomName,
      callType: activeCall.callType || "video",
      initiatorId: String(activeCall.initiatorId || currentUserId),
      initiatorName: String(user?.name || "A teammate"),
      invited: false,
    });
  }, [
    activeCall?.roomName,
    activeCall?.callType,
    activeCall?.initiatorId,
    currentUserId,
    user?.name,
  ]);

  useEffect(() => {
    if (!currentUserId || activeCall) return undefined;

    let cancelled = false;

    const syncActiveCalls = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/calls/active`, {
          credentials: "include",
        });
        if (!response.ok || cancelled) return;
        const payload = await response.json().catch(() => null);
        const calls = Array.isArray(payload?.calls) ? payload.calls : [];
        const live = calls.find((row) => Number(row?.participantCount) > 0);
        if (!live?.roomName || cancelled) return;
        setTeamLiveCall((prev) =>
          prev?.roomName
            ? prev
            : {
                roomName: String(live.roomName),
                callType: "video",
                initiatorId: "",
                initiatorName: "Your team",
                invited: false,
              },
        );
      } catch {
        // Best-effort recovery when socket events were missed.
      }
    };

    void syncActiveCalls();
    const intervalId = window.setInterval(syncActiveCalls, 45_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [activeCall, currentUserId]);

  const buildActiveCall = useCallback(
    (result, extras = {}) => ({
      token: result.token,
      roomName: result.roomName,
      callType: result.callType,
      initiatorId: String(result.initiatorId || extras.initiatorId || currentUserId),
      startupId: String(result.startupId || extras.startupId || startupId || ""),
      ...extras,
    }),
    [currentUserId, startupId],
  );

  useEffect(() => {
    if (activeCall?.roomName) {
      hadActiveCallRef.current = true;
      writeStoredActiveCall(activeCall);
      syncCallUrl(activeCall);
      return;
    }

    const onCallRoute = isOfficeCallPath(location.pathname);
    if (!onCallRoute) {
      writeStoredActiveCall(null);
    }

    if (hadActiveCallRef.current && onCallRoute) {
      clearCallUrl();
      hadActiveCallRef.current = false;
    }
  }, [activeCall, clearCallUrl, location.pathname, syncCallUrl]);

  useEffect(() => {
    if (skipNextUrlSyncRef.current) {
      skipNextUrlSyncRef.current = false;
      return;
    }
    if (authLoading || !currentUserId || activeCall) return;

    const fromUrl = parseOfficeCallRoute(location.pathname, location.search);
    const stored = readStoredActiveCall();
    const roomName = fromUrl?.roomName || stored?.roomName;
    if (!roomName) return;

    let cancelled = false;

    (async () => {
      setRestoringCall(true);
      try {
        const result = await joinCall(roomName);
        if (cancelled || !result) return;
        setActiveCall(
          buildActiveCall(
            {
              ...result,
              roomName: result.roomName || roomName,
              callType: result.callType || fromUrl?.callType || stored?.callType,
            },
            {
              initiatorId: stored?.initiatorId,
              startupId: stored?.startupId,
            },
          ),
        );
      } catch {
        if (cancelled) return;
        clearStoredActiveCall();
        if (fromUrl?.roomName) {
          skipNextUrlSyncRef.current = true;
          navigate("/office", { replace: true });
        }
      } finally {
        if (!cancelled) setRestoringCall(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    activeCall,
    authLoading,
    buildActiveCall,
    currentUserId,
    joinCall,
    location.pathname,
    location.search,
    navigate,
  ]);

  const startTeamCall = useCallback(
    async (callType) => {
      setShowCallModal(false);
      const result = await createCall(callType);
      if (result) {
        setActiveCall(buildActiveCall(result));
        void logCallStartedActivity({
          userId: currentUserId,
          startupId: result.startupId || startupId,
          userName: user?.name,
          role: user?.role,
        });
      }
    },
    [createCall, buildActiveCall, currentUserId, startupId, user?.name, user?.role],
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
      void logCallStartedActivity({
        userId: currentUserId,
        startupId: result.startupId || startupId,
        userName: user?.name,
        role: user?.role,
      });
    },
    [createCall, inviteToCall, buildActiveCall, currentUserId, startupId, user?.name, user?.role],
  );

  const joinCallByRoom = useCallback(
    async (roomName, callTypeHint = "video") => {
      if (!roomName) return;
      setBannerDismissedRoom(String(roomName));
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
    if (leaveInFlightRef.current) return;
    leaveInFlightRef.current = true;

    const call = activeCall;
    setActiveCall(null);
    clearStoredActiveCall();
    clearCallUrl();

    if (
      call?.roomName &&
      currentUserId &&
      String(call.initiatorId) === currentUserId
    ) {
      void endCall(call.roomName).catch(() => {});
    }

    window.setTimeout(() => {
      leaveInFlightRef.current = false;
    }, 0);
  }, [activeCall, clearCallUrl, currentUserId, endCall]);

  const registerTeamRoster = useCallback((roster) => {
    setTeamRoster(Array.isArray(roster) ? roster : []);
  }, []);

  const value = useMemo(
    () => ({
      activeCall,
      teamLiveCall,
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
      teamLiveCall,
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

  const bannerCall =
    teamLiveCall &&
    !activeCall &&
    teamLiveCall.roomName !== bannerDismissedRoom
      ? teamLiveCall
      : null;

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
        callData={bannerCall}
        onJoin={() =>
          joinCallByRoom(bannerCall?.roomName, bannerCall?.callType)
        }
        onDismiss={() => setBannerDismissedRoom(bannerCall?.roomName || "")}
      />
      {restoringCall && isOfficeCallPath(location.pathname) && !activeCall && (
        <div className="fixed inset-0 z-[998] flex items-center justify-center bg-surface-page/90 backdrop-blur-sm">
          <p className="font-body text-sm text-text-heading">Rejoining call…</p>
        </div>
      )}
      {activeCall && !restoringCall && (
        <div className="fixed inset-0 z-[999] h-dvh w-full">
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
