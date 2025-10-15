// modules/observer.js
const ObserverManager = (function() {
  'use strict';

  const Performance = window.TextareaFullscreen.Performance;
  const Detector = window.TextareaFullscreen.Detector;

  let observer = null;
  let isProcessing = false;
  let processTimeout = null;
  let scrollTimeout = null;

  /**
   * Setup mutation observer
   */
  function setup() {
    if (Performance.isKilled()) return;

    // Throttled process function
    const throttledProcess = () => {
      if (Performance.isKilled()) return;

      if (processTimeout) {
        clearTimeout(processTimeout);
      }

      processTimeout = setTimeout(() => {
        if (!isProcessing && !Performance.isKilled()) {
          Performance.incrementProcessCount();

          isProcessing = true;
          Detector.processTextareas();
          isProcessing = false;
        }
      }, 2000);
    };

    observer = new MutationObserver((mutations) => {
      if (Performance.isKilled()) {
        disconnect();
        return;
      }

      // Check only first 10 mutations
      const maxMutationsToCheck = 10;
      let hasNewTextarea = false;

      for (let i = 0; i < Math.min(mutations.length, maxMutationsToCheck); i++) {
        const mutation = mutations[i];

        // Skip our own modifications
        if (mutation.target.classList &&
            (mutation.target.classList.contains('tx-editor-wrapper') ||
             mutation.target.classList.contains('tx-editor') ||
             mutation.target.classList.contains('tx-editor-overlay') ||
             mutation.target.classList.contains('tx-icon'))) {
          continue;
        }

        // Check added nodes
        if (mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === 1) {
              if (node.tagName === 'TEXTAREA') {
                hasNewTextarea = true;
                break;
              }
              if (node.querySelector && node.querySelector('textarea')) {
                hasNewTextarea = true;
                break;
              }
            }
          }
        }

        if (hasNewTextarea) break;
      }

      if (hasNewTextarea) {
        throttledProcess();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });
  }

  /**
   * Disconnect observer
   */
  function disconnect() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (processTimeout) {
      clearTimeout(processTimeout);
      processTimeout = null;
    }
  }

  /**
   * Reconnect observer after delay
   */
  function reconnect() {
    if (!Performance.isKilled()) {
      setTimeout(() => {
        if (!Performance.isKilled()) {
          setup();
        }
      }, 500);
    }
  }

  /**
   * Handle scroll events to process textareas
   */
  function handleScroll() {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }

    scrollTimeout = setTimeout(() => {
      if (!isProcessing && !Performance.isKilled()) {
        // Re-check previously skipped textareas
        const skippedTextareas = document.querySelectorAll('textarea.tx-fullscreen-enabled');
        skippedTextareas.forEach(textarea => {
          if (!textarea.closest('.tx-editor-wrapper')) {
            textarea.classList.remove('tx-fullscreen-enabled');
          }
        });

        Detector.processTextareas();
      }
    }, 1000);
  }

  /**
   * Initialize scroll listener
   */
  function setupScrollListener() {
    window.addEventListener('scroll', handleScroll, { passive: true });
    window._txScrollHandler = handleScroll;
  }

  /**
   * Remove scroll listener
   */
  function removeScrollListener() {
    if (window._txScrollHandler) {
      window.removeEventListener('scroll', window._txScrollHandler);
      delete window._txScrollHandler;
    }
  }

  function isActive() {
      return observer !== null;
  }

  return {
    setup,
    disconnect,
    reconnect,
    setupScrollListener,
    removeScrollListener,
    isActive
  };
})();

window.TextareaFullscreen = window.TextareaFullscreen || {};
window.TextareaFullscreen.Observer = ObserverManager;