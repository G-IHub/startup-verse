import React, { useCallback, useState } from "react";
import { Send } from "lucide-react";
import { callShell } from "./callStyles";
import { trimMessage } from "./callChatUtils";

export default function CallChatInput({ onSend, disabled = false, isSending = false }) {
  const [text, setText] = useState("");

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const message = trimMessage(text);
      if (!message || disabled || isSending) return;
      setText("");
      await onSend?.(message);
    },
    [text, disabled, isSending, onSend],
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSubmit(event);
      }
    },
    [handleSubmit],
  );

  return (
    <form className={callShell.chatInputFooter} onSubmit={handleSubmit}>
      <div className={callShell.chatInputRow}>
        <textarea
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a message…"
          disabled={disabled || isSending}
          className={callShell.chatTextInput}
          aria-label="Call chat message"
        />
        <button
          type="submit"
          disabled={disabled || isSending || !trimMessage(text)}
          className={callShell.chatSendBtn}
          aria-label="Send message"
        >
          <Send className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </form>
  );
}
