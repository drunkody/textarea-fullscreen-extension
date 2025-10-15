// modules/performance.js
const PerformanceMonitor = (function() {
  'use strict';

  let processCount = 0;
  let lastProcessTime = Date.now();
  let isKilled = false;

  /**
   * Check if performance is acceptable
   */
  function checkPerformance() {
    const now = Date.now();
    const timeSinceLastProcess = now - lastProcessTime;

    // Kill switch - stop if processing too frequently
    if (processCount > 100 && timeSinceLastProcess < 5000) {
      console.error('[Performance] Issue detected - disabling extension');
      kill();
      return false;
    }

    // Reset counter every 5 seconds
    if (timeSinceLastProcess > 5000) {
      processCount = 0;
      lastProcessTime = now;
    }

    return true;
  }

  /**
   * Increment process counter
   */
  function incrementProcessCount() {
    processCount++;
  }

  /**
   * Kill the extension on current page
   */
  function kill() {
    isKilled = true;
    console.log('[Performance] Extension stopped on this page');
  }

  /**
   * Check if extension is killed
   */
  function isExtensionKilled() {
    return isKilled;
  }

  return {
    checkPerformance,
    incrementProcessCount,
    kill,
    isKilled: isExtensionKilled
  };
})();

window.TextareaFullscreen = window.TextareaFullscreen || {};
window.TextareaFullscreen.Performance = PerformanceMonitor;