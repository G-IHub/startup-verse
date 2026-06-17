import React, { useEffect, useRef } from "react";
import { cn } from "../ui/utils";
import { callShell, chatBubbleClass, chatMetaClass } from "./callStyles";
import { formatCallChatTime } from "./callChatUtils";

export default function CallChatMessageList({ messages, localIdentity }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (!messages.length) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-8 text-center font-body text-sm text-text-muted">
        No messages yet. Say hello to the team.
      </div>
    );
  }

  return (
    <div className={callShell.chatList}>
      {messages.map((msg) => {
        const identity = msg.from?.identity || "";
        const isLocal = identity && identity === localIdentity;
        const name = msg.from?.name || msg.from?.identity || "Participant";
        const key = `${identity}-${msg.timestamp}`;

        return (
          <div key={key} className={cn("flex flex-col", isLocal && "items-end")}>
            <div className={chatMetaClass(isLocal)}>
              <span className="font-medium">{isLocal ? "You" : name}</span>
              <span>{formatCallChatTime(msg.timestamp)}</span>
            </div>
            <div className={chatBubbleClass(isLocal)}>{msg.message}</div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
