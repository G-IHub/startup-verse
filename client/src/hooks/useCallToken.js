import { useCallback, useState } from "react";
import { API_BASE_URL } from "../config/apiBase.js";
import { useAuth } from "../contexts/AuthContext.jsx";

const SIGN_IN_MESSAGE = "You must be signed in to start or join a call.";

function normalizeCallPayload(payload) {
  const data = payload?.data && typeof payload.data === "object" ? payload.data : payload;

  return {
    token: data?.token,
    roomName: data?.roomName,
    callType: data?.callType,
  };
}

function resolveErrorMessage(payload, fallback) {
  return payload?.message || payload?.error || fallback;
}

export default function useCallToken() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getAuthenticatedUser = useCallback(() => {
    const userId = user?._id ?? user?.id;
    const userName = user?.name;

    if (!userId || !userName) {
      throw new Error(SIGN_IN_MESSAGE);
    }

    return {
      userId,
      userName,
    };
  }, [user]);

  const requestCallToken = useCallback(
    async (endpoint, body, { requireCallType = true } = {}) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          const message = resolveErrorMessage(
            payload,
            `Call request failed with status ${response.status}.`,
          );
          throw new Error(message);
        }

        const callPayload = normalizeCallPayload(payload);

        if (!callPayload.token || !callPayload.roomName || (requireCallType && !callPayload.callType)) {
          throw new Error("Call response is missing token, room name, or call type.");
        }

        return callPayload;
      } catch (requestError) {
        const message = requestError?.message || "Call request failed.";
        setError(message);
        throw requestError;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const createCall = useCallback(
    async (callType) => {
      try {
        const { userId, userName } = getAuthenticatedUser();
        return await requestCallToken("/calls/create", {
          userId,
          userName,
          callType,
        });
      } catch (createError) {
        const message = createError?.message || "Failed to create call.";
        setError(message);
        throw createError;
      }
    },
    [getAuthenticatedUser, requestCallToken],
  );

  const joinCall = useCallback(
    async (roomName) => {
      try {
        const { userId, userName } = getAuthenticatedUser();
        return await requestCallToken(
          `/calls/join/${encodeURIComponent(roomName)}`,
          {
            userId,
            userName,
          },
          { requireCallType: false },
        );
      } catch (joinError) {
        const message = joinError?.message || "Failed to join call.";
        setError(message);
        throw joinError;
      }
    },
    [getAuthenticatedUser, requestCallToken],
  );

  return {
    createCall,
    joinCall,
    loading,
    error,
  };
}
