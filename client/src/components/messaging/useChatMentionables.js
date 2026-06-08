import { useCallback, useEffect, useState } from "react";
import { getChatMentionables } from "../../utils/api/chatMentionApi";

export function useChatMentionables({ startupId, enabled = true }) {
  const [mentionables, setMentionables] = useState({ milestones: [], tasks: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!enabled || !startupId) {
      setMentionables({ milestones: [], tasks: [] });
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await getChatMentionables(startupId);
      setMentionables(data);
    } catch (err) {
      setError(err?.message || "Failed to load milestones and tasks");
      setMentionables({ milestones: [], tasks: [] });
    } finally {
      setLoading(false);
    }
  }, [enabled, startupId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!enabled || !startupId) return undefined;
    const onFocus = () => {
      void load();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [enabled, load, startupId]);

  return { mentionables, loading, error, refresh: load };
}
