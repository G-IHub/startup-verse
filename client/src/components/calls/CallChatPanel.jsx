import React, { useEffect, useState } from "react";
import { ConnectionState } from "livekit-client";
import { useChat, useConnectionState, useLocalParticipant } from "@livekit/components-react";
import { callShell } from "./callStyles";
import CallChatMessageList from "./CallChatMessageList";
import CallChatInput from "./CallChatInput";

export default function CallChatPanel() {
  const { chatMessages, send, isSending } = useChat();
  const { localParticipant } = useLocalParticipant();
  const connectionState = useConnectionState();
  const [wasConnected, setWasConnected] = useState(false);
  const [showReconnectBanner, setShowReconnectBanner] = useState(false);

  const isConnected = connectionState === ConnectionState.Connected;
  const localIdentity = localParticipant?.identity || "";

  useEffect(() => {
    if (connectionState === ConnectionState.Connected) {
      if (wasConnected) {
        setShowReconnectBanner(true);
      }
      setWasConnected(true);
    }
  }, [connectionState, wasConnected]);

  const handleSend = async (message) => {
    await send(message);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {showReconnectBanner && (
        <p className={callShell.chatBanner}>
          Reconnected — earlier messages aren&apos;t shown.
        </p>
      )}
      <CallChatMessageList messages={chatMessages} localIdentity={localIdentity} />
      <CallChatInput
        onSend={handleSend}
        disabled={!isConnected}
        isSending={isSending}
      />
    </div>
  );
}
