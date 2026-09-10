import React, { useEffect, useState } from "react";
import { ConnectionState } from "livekit-client";
import { useChat, useConnectionState, useLocalParticipant } from "@livekit/components-react";
import { v2CallShell } from "./v2CallStyles";
import V2CallChatMessageList from "./V2CallChatMessageList";
import V2CallChatInput from "./V2CallChatInput";

export default function V2CallChatPanel() {
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
        <p className={v2CallShell.chatBanner}>
          Reconnected — earlier messages aren&apos;t shown.
        </p>
      )}
      <V2CallChatMessageList messages={chatMessages} localIdentity={localIdentity} />
      <V2CallChatInput
        onSend={handleSend}
        disabled={!isConnected}
        isSending={isSending}
      />
    </div>
  );
}
