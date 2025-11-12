// hooks/useSettings.ts
import { useState, useEffect, useCallback } from 'react';
import browser from 'webextension-polyfill';
import { DEFAULT_SETTINGS, type Settings } from '../types/settings';
import { logger } from '../utils/logger';

/**
 * Hook to manage extension settings with browser.storage
 */
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load settings on mount
  useEffect(() => {
    logger.info('[useSettings] Loading settings from storage...');
    
    browser.storage.sync
      .get(DEFAULT_SETTINGS)
      .then((data) => {
        const loadedSettings = data as Settings;
        logger.success('[useSettings] Settings loaded', loadedSettings);
        setSettings(loadedSettings);
        setLoading(false);
      })
      .catch((err) => {
        logger.error('[useSettings] Failed to load settings', err);
        setError('Failed to load settings');
        setLoading(false);
      });
  }, []);

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = (
      changes: Record<string, browser.Storage.StorageChange>,
      areaName: string
    ) => {
      if (areaName !== 'sync') return;

      logger.info('[useSettings] Storage changed', changes);

      setSettings((prev) => {
        const updated = { ...prev };
        let hasChanges = false;

        for (const key in changes) {
          if (key in DEFAULT_SETTINGS) {
            updated[key as keyof Settings] = changes[key].newValue;
            hasChanges = true;
          }
        }

        return hasChanges ? updated : prev;
      });
    };

    browser.storage.onChanged.addListener(handleStorageChange);

    return () => {
      browser.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  // Save settings
  const saveSettings = useCallback(async (newSettings: Settings) => {
    logger.info('[useSettings] Saving settings...', newSettings);

    try {
      await browser.storage.sync.set(newSettings);
      setSettings(newSettings);
      logger.success('[useSettings] Settings saved successfully');

      // Notify all tabs
      const tabs = await browser.tabs.query({});
      const message = { type: 'SETTINGS_UPDATED', settings: newSettings };

      tabs.forEach((tab) => {
        if (tab.id) {
          browser.tabs
            .sendMessage(tab.id, message)
            .catch(() => {}); // Ignore errors
        }
      });
    } catch (err) {
      logger.error('[useSettings] Failed to save settings', err);
      throw new Error('Failed to save settings');
    }
  }, []);

  return {
    settings,
    loading,
    error,
    saveSettings
  };
}