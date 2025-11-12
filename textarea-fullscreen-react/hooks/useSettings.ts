// hooks/useSettings.ts
import { useState, useEffect, useCallback } from 'react';
import browser from 'webextension-polyfill';
import { DEFAULT_SETTINGS, type Settings } from '../types/settings';
import { logger } from '../utils/logger';

/**
 * Type guard to check if storage data is valid Settings
 */
function isValidSettings(data: unknown): data is Partial<Settings> {
  if (typeof data !== 'object' || data === null) return false;
  
  const obj = data as Record<string, unknown>;
  
  // Check each field if it exists
  if ('enabled' in obj && typeof obj.enabled !== 'boolean') return false;
  if ('overlay' in obj && typeof obj.overlay !== 'boolean') return false;
  if ('shortcutKey' in obj && typeof obj.shortcutKey !== 'string') return false;
  if ('excludedDomains' in obj && typeof obj.excludedDomains !== 'string') return false;
  
  return true;
}

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
      .get(null) // Get all items
      .then((data) => {
        if (!isValidSettings(data)) {
          logger.warn('[useSettings] Invalid settings in storage, using defaults');
          setSettings(DEFAULT_SETTINGS);
          setLoading(false);
          return;
        }

        // Merge with defaults (stored values override defaults)
        const loadedSettings: Settings = {
          ...DEFAULT_SETTINGS,
          ...data
        };
        
        logger.success('[useSettings] Settings loaded', loadedSettings);
        setSettings(loadedSettings);
        setLoading(false);
      })
      .catch((err) => {
        logger.error('[useSettings] Failed to load settings', err);
        setError('Failed to load settings');
        setSettings(DEFAULT_SETTINGS); // Fallback to defaults
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
        // Create a new settings object with proper typing
        const updated: Settings = { ...prev };
        let hasChanges = false;

        // Type-safe update for each field
        if ('enabled' in changes && typeof changes.enabled.newValue === 'boolean') {
          updated.enabled = changes.enabled.newValue;
          hasChanges = true;
        }
        if ('overlay' in changes && typeof changes.overlay.newValue === 'boolean') {
          updated.overlay = changes.overlay.newValue;
          hasChanges = true;
        }
        if ('shortcutKey' in changes && typeof changes.shortcutKey.newValue === 'string') {
          updated.shortcutKey = changes.shortcutKey.newValue;
          hasChanges = true;
        }
        if ('excludedDomains' in changes && typeof changes.excludedDomains.newValue === 'string') {
          updated.excludedDomains = changes.excludedDomains.newValue;
          hasChanges = true;
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
      // Create plain object for storage
      const storageData = {
        enabled: newSettings.enabled,
        overlay: newSettings.overlay,
        shortcutKey: newSettings.shortcutKey,
        excludedDomains: newSettings.excludedDomains
      };

      await browser.storage.sync.set(storageData);
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