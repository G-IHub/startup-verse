import { useEffect, useRef } from "react";
import { useJourneyStore } from "../state/useJourneyStore";

/**
 * Hydrate founder journey (including homeUi.stageDrafts) and merge server draft into component state once.
 */
export function useHydrateStageDraft(user, draftKey, mergeDraft) {
  const uid = user?.id ?? user?._id;
  const mergeRef = useRef(mergeDraft);
  mergeRef.current = mergeDraft;

  useEffect(() => {
    if (!uid || !draftKey) return;
    let cancelled = false;
    const run = async () => {
      await useJourneyStore.getState().hydrate(String(uid));
      if (cancelled) return;
      const raw =
        useJourneyStore.getState().homeUi?.stageDrafts?.[draftKey];
      if (raw != null) mergeRef.current(raw);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [uid, draftKey]);
}

export function persistStageDraft(draftKey, value) {
  useJourneyStore.getState().patchStageDraft(draftKey, value);
}
