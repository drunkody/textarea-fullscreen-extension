// modules/cleanup.js
const CleanupManager = (function() {
  'use strict';

  /**
   * Remove all overlays from the page
   */
  function cleanupAllOverlays() {
    const overlays = document.querySelectorAll('.tx-editor-overlay');
    console.log(`[Cleanup] Removing ${overlays.length} overlays`);

    overlays.forEach(overlay => {
      try {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      } catch (e) {
        console.error('[Cleanup] Error removing overlay:', e);
      }
    });
  }

  /**
   * Cleanup all editors
   */
  function cleanupAllEditors() {
    document.querySelectorAll('.tx-editor').forEach(editor => {
      // Remove event handlers
      if (editor._escHandler) {
        document.removeEventListener('keydown', editor._escHandler);
        delete editor._escHandler;
      }

      if (editor._overlayClickHandler) {
        delete editor._overlayClickHandler;
      }

      // Remove overlay
      if (editor._overlay && editor._overlay.parentNode) {
        editor._overlay.remove();
      }
    });
  }

  /**
   * Complete cleanup on page unload
   */
  function cleanupAll() {
    cleanupAllOverlays();
    cleanupAllEditors();
  }

  /**
   * Initialize cleanup listeners
   */
  function init(shutdownCallback) {
    const cleanup = shutdownCallback || cleanupAll;
    window.addEventListener('beforeunload', cleanup);
    window.addEventListener('pagehide', cleanup);
  }

  return {
    init,
    cleanupAll,
    cleanupAllOverlays,
    cleanupAllEditors
  };
})();

window.TextareaFullscreen = window.TextareaFullscreen || {};
window.TextareaFullscreen.Cleanup = CleanupManager;