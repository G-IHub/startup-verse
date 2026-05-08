import { useState, useEffect, useCallback } from "react";
import {
  fetchClientPreferences,
  mergeClientPreferencesPatch,
} from "../utils/api/clientPreferencesApi";

const defaultSettings = {
  showActivityFeed: true,
  showPresenceBar: true,
  activityNotifications: true,
  teamJoinLeaveAlerts: true,
};

const PREF_KEY = "startupverse_office_settings";

export function useOfficeSettings(userId) {
  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchClientPreferences(String(userId))
      .then((prefs) => {
        if (cancelled) return;
        const raw = prefs[PREF_KEY];
        if (raw && typeof raw === "object") {
          setSettings({ ...defaultSettings, ...raw });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const t = setTimeout(() => {
      mergeClientPreferencesPatch(String(userId), {
        [PREF_KEY]: settings,
      }).catch(() => {});
    }, 450);
    return () => clearTimeout(t);
  }, [settings, userId]);

  const updateSettings = useCallback((updates) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  return {
    settings,
    updateSettings,
    resetToDefaults,
  };
}
