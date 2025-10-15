// modules/settings.js
const SettingsManager = (function() {
  'use strict';

  // Default settings
  const defaultSettings = {
    enabled: true,
    overlay: true,
    maxWidth: '80%',
    maxHeight: '80%',
    shortcutKey: 'f',
    excludedDomains: []
  };

  let currentSettings = { ...defaultSettings };

  /**
   * Check if extension should run on current domain
   */
  function shouldRunOnCurrentDomain() {
    const hostname = window.location.hostname;
    const excludePatterns = [
      ...currentSettings.excludedDomains,
      // Problematic domains by default
      'mail.google.com',
      'docs.google.com',
      'sheets.google.com'
    ];

    return !excludePatterns.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(hostname);
      }
      return hostname.includes(pattern);
    });
  }

  /**
   * Load settings from storage
   */
  async function load() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.get(defaultSettings, (items) => {
          currentSettings = items;
          resolve(currentSettings);
        });
      } else if (typeof browser !== 'undefined' && browser.storage) {
        browser.storage.sync.get(defaultSettings).then((items) => {
          currentSettings = items;
          resolve(currentSettings);
        });
      } else {
        resolve(currentSettings);
      }
    });
  }

  /**
   * Get current settings
   */
  function get() {
    return currentSettings;
  }

  /**
   * Update settings
   */
  function update(newSettings) {
    currentSettings = { ...currentSettings, ...newSettings };
  }

  /**
   * Listen for settings changes from popup
   */
  function listenForUpdates(callback) {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'SETTINGS_UPDATED') {
          console.log('[Settings] Updated:', message.settings);
          update(message.settings);
          callback(message.settings);
          sendResponse({ success: true });
        }
      });
    } else if (typeof browser !== 'undefined' && browser.runtime) {
      browser.runtime.onMessage.addListener((message) => {
        if (message.type === 'SETTINGS_UPDATED') {
          console.log('[Settings] Updated:', message.settings);
          update(message.settings);
          callback(message.settings);
          return Promise.resolve({ success: true });
        }
      });
    }
  }

  return {
    load,
    get,
    update,
    shouldRunOnCurrentDomain,
    listenForUpdates
  };
})();

// Export to global scope for other modules
window.TextareaFullscreen = window.TextareaFullscreen || {};
window.TextareaFullscreen.Settings = SettingsManager;