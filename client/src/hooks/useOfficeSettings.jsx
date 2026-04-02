import { useState, useEffect, useCallback } from "react";

/**
 * Hook for managing Virtual Office collaboration and privacy settings
 *
 * Provides founder-level controls for:
 * - Activity feed
 * - Presence bar visibility
 * - Notifications
 *
 * Settings are persisted to localStorage and can be controlled by founders
 */

export function useOfficeSettings() {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("startupverse_office_settings");
    const defaultSettings = {
      showActivityFeed: true,
      showPresenceBar: true,
      activityNotifications: true,
      teamJoinLeaveAlerts: true,
    };

    if (saved) {
      return { ...defaultSettings, ...JSON.parse(saved) };
    }

    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem(
      "startupverse_office_settings",
      JSON.stringify(settings),
    );
  }, [settings]);

  const updateSettings = useCallback((updates) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetToDefaults = useCallback(() => {
    const defaultSettings = {
      showActivityFeed: true,
      showPresenceBar: true,
      activityNotifications: true,
      teamJoinLeaveAlerts: true,
    };
    setSettings(defaultSettings);
  }, []);

  return {
    settings,
    updateSettings,
    resetToDefaults,
  };
}
