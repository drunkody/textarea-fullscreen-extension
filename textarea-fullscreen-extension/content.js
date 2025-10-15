// content.js - Main orchestrator
(function() {
  'use strict';

  // Get references to all modules
  const Settings = window.TextareaFullscreen.Settings;
  const Performance = window.TextareaFullscreen.Performance;
  const Cleanup = window.TextareaFullscreen.Cleanup;
  const Observer = window.TextareaFullscreen.Observer;
  const Detector = window.TextareaFullscreen.Detector;

  /**
   * Initialize the extension
   */
  async function init() {
    console.log('[TextareaFullscreen] Initializing...');

    // Load settings from storage
    await Settings.load();
    const settings = Settings.get();

    // Check if should run on this domain
    if (!settings.enabled || !Settings.shouldRunOnCurrentDomain()) {
      console.log('[TextareaFullscreen] Disabled on this domain');
      return;
    }

    // Initialize cleanup handlers (beforeunload, pagehide)
    Cleanup.init();

    // Initial textarea processing with delay
    setTimeout(() => {
      if (Performance.checkPerformance()) {
        Detector.processTextareas();
      }
    }, 1000);

    // Setup mutation observer and scroll listener
    Observer.setup();
    Observer.setupScrollListener();

    // Listen for settings updates from popup
    Settings.listenForUpdates((newSettings) => {
      if (newSettings.enabled && !Observer.isActive()) {
        init();
      } else if (!newSettings.enabled) {
        shutdown();
      }
    });

    console.log('[TextareaFullscreen] Initialized successfully');
  }

  /**
   * Shutdown the extension
   */
  function shutdown() {
    console.log('[TextareaFullscreen] Shutting down...');
    
    Performance.kill();
    Observer.disconnect();
    Observer.removeScrollListener();
    Cleanup.cleanupAll();
  }

  /**
   * Cleanup on page unload
   */
  window.addEventListener('beforeunload', shutdown);
  window.addEventListener('pagehide', shutdown);

  // Start the extension
  init();

})();