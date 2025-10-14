(function() {
  'use strict';
    // Emergency cleanup function
  function cleanupAllOverlays() {
    const overlays = document.querySelectorAll('.tx-editor-overlay');
    console.log(`[Textarea Fullscreen] Cleaning up ${overlays.length} overlays`);
    
    overlays.forEach(overlay => {
      try {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      } catch (e) {
        console.error('[Textarea Fullscreen] Error removing overlay:', e);
      }
    });
  }

  // Add global cleanup on window events
  window.addEventListener('beforeunload', cleanupAllOverlays);
  window.addEventListener('pagehide', cleanupAllOverlays);

  // Performance monitoring
  let processCount = 0;
  let lastProcessTime = Date.now();
  let isKilled = false;

  // Default settings
  let settings = {
    enabled: true,
    overlay: true,
    maxWidth: '80%',
    maxHeight: '80%',
    shortcutKey: 'f',
    excludedDomains: [] // Add domains to exclude
  };

  let observer = null;
  let isProcessing = false;
  let processTimeout = null;

  // Check if we should run on this domain
  function shouldRunOnCurrentDomain() {
    const hostname = window.location.hostname;
    const excludePatterns = [
      ...settings.excludedDomains,
      // Add problematic domains by default
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

  // Load settings from storage
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.sync.get(settings, (items) => {
      settings = items;
      if (settings.enabled && shouldRunOnCurrentDomain()) {
        init();
      } else {
        console.log('[Textarea Fullscreen] Disabled on this domain');
      }
    });
  } else if (typeof browser !== 'undefined' && browser.storage) {
    browser.storage.sync.get(settings).then((items) => {
      settings = items;
      if (settings.enabled && shouldRunOnCurrentDomain()) {
        init();
      }
    });
  } else {
    if (shouldRunOnCurrentDomain()) {
      init();
    }
  }

  function init() {
    // Kill switch - stop if processing too frequently
    const checkPerformance = () => {
      const now = Date.now();
      const timeSinceLastProcess = now - lastProcessTime;
      
      if (processCount > 100 && timeSinceLastProcess < 5000) {
        console.error('[Textarea Fullscreen] Performance issue detected - disabling extension on this page');
        killExtension();
        return false;
      }
      
      // Reset counter every 5 seconds
      if (timeSinceLastProcess > 5000) {
        processCount = 0;
        lastProcessTime = now;
      }
      
      return true;
    };

    // Initial processing with delay
    setTimeout(() => {
      if (checkPerformance()) {
        processTextareas();
      }
    }, 1000);

    // Setup mutation observer with aggressive throttling
    setupObserver();
  }

  function killExtension() {
    isKilled = true;
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (processTimeout) {
      clearTimeout(processTimeout);
      processTimeout = null;
    }
    console.log('[Textarea Fullscreen] Extension stopped on this page to prevent performance issues');
  }

  function setupObserver() {
    if (isKilled) return;

    // Very aggressive throttling - only process every 2 seconds max
    const throttledProcess = () => {
      if (isKilled) return;
      
      if (processTimeout) {
        clearTimeout(processTimeout);
      }
      
      processTimeout = setTimeout(() => {
        if (!isProcessing && !isKilled) {
          processCount++;
          processTextareas();
        }
      }, 2000); // 2 second throttle
    };

    observer = new MutationObserver((mutations) => {
      if (isKilled) {
        observer.disconnect();
        return;
      }

      // Limit the number of mutations we check
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

        // Only check added nodes
        if (mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === 1) { // Element node
              if (node.tagName === 'TEXTAREA') {
                hasNewTextarea = true;
                break;
              }
              // Only check one level deep to avoid performance hit
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

    // Observe with minimal options
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false, // Don't watch attribute changes
      characterData: false // Don't watch text changes
    });
  }

  function processTextareas() {
    if (isProcessing || isKilled) return;
    
    isProcessing = true;

    try {
      // Temporarily disconnect observer
      if (observer) {
        observer.disconnect();
      }

      const textareas = document.querySelectorAll('textarea:not(.tx-fullscreen-enabled)');
      
      // Strict limit - only process 10 textareas at a time
      const maxProcess = 10;
      let processed = 0;

      textareas.forEach(textarea => {
        if (processed >= maxProcess || isKilled) return;
        
        try {
          // Skip if already wrapped
          if (textarea.closest('.tx-editor-wrapper')) {
            textarea.classList.add('tx-fullscreen-enabled');
            return;
          }

          // Quick visibility check
          const rect = textarea.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            addFullscreenButton(textarea);
            processed++;
          }
        } catch (e) {
          console.error('[Textarea Fullscreen] Error processing textarea:', e);
        }
      });

      if (processed > 0) {
        console.log(`[Textarea Fullscreen] Processed ${processed} textareas`);
      }
    } catch (e) {
      console.error('[Textarea Fullscreen] Error in processTextareas:', e);
    } finally {
      isProcessing = false;
      
      // Reconnect observer after a delay
      if (!isKilled) {
        setTimeout(() => {
          if (!isKilled && observer) {
            setupObserver();
          }
        }, 500);
      }
    }
  }

  function addFullscreenButton(textarea) {
    if (isKilled) return;
    
    // Mark immediately to prevent reprocessing
    textarea.classList.add('tx-fullscreen-enabled');

    try {
      const computedStyle = window.getComputedStyle(textarea);
      const originalDisplay = computedStyle.display;

      // Create wrapper
      const wrapper = document.createElement('div');
      wrapper.className = 'tx-editor-wrapper';
      wrapper.style.cssText = `
        position: relative !important;
        display: ${originalDisplay === 'inline' ? 'inline-block' : 'block'} !important;
        width: 100% !important;
      `;

      // Create editor container
      const editor = document.createElement('div');
      editor.className = 'tx-editor';
      editor.style.cssText = `
        position: relative !important;
        width: 100% !important;
        display: block !important;
      `;

      // Create fullscreen button
      const button = document.createElement('button');
      button.className = 'tx-icon';
      button.setAttribute('type', 'button');
      button.setAttribute('aria-label', 'Toggle Fullscreen');
      button.title = 'Toggle Fullscreen (Ctrl+F)';
      
      const expandIconUrl = getIconUrl('icons/expand.svg');
      
      button.style.cssText = `
        position: absolute !important;
        right: 5px !important;
        top: 5px !important;
        width: 30px !important;
        height: 30px !important;
        min-width: 30px !important;
        min-height: 30px !important;
        background-color: rgba(255, 255, 255, 0.95) !important;
        background-image: url("${expandIconUrl}") !important;
        background-size: 18px 18px !important;
        background-position: center !important;
        background-repeat: no-repeat !important;
        border: 1px solid rgba(204, 204, 204, 0.8) !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        z-index: 999999 !important;
        padding: 0 !important;
        margin: 0 !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
        opacity: 0.85 !important;
        transition: all 0.2s ease !important;
        outline: none !important;
        font-size: 0 !important;
        line-height: 1 !important;
        color: transparent !important;
        display: block !important;
      `;

      // Insert wrapper
      const parent = textarea.parentNode;
      if (!parent) return;
      
      parent.insertBefore(wrapper, textarea);
      wrapper.appendChild(editor);
      editor.appendChild(button);
      editor.appendChild(textarea);

      // Hover effects (use passive listeners for performance)
      button.addEventListener('mouseenter', () => {
        button.style.opacity = '1';
        button.style.transform = 'scale(1.05)';
        button.style.boxShadow = '0 3px 12px rgba(0,0,0,0.25)';
      }, { passive: true });

      button.addEventListener('mouseleave', () => {
        button.style.opacity = '0.85';
        button.style.transform = 'scale(1)';
        button.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
      }, { passive: true });

      // Click event
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFullscreen(editor, textarea, button);
      });

      // Keyboard shortcut
      textarea.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key.toLowerCase() === settings.shortcutKey) {
          e.preventDefault();
          toggleFullscreen(editor, textarea, button);
        }
      });

    } catch (e) {
      console.error('[Textarea Fullscreen] Error adding button:', e);
    }
  }

  function getIconUrl(path) {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
        return chrome.runtime.getURL(path);
      }
      if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.getURL) {
        return browser.runtime.getURL(path);
      }
    } catch (e) {
      console.error('[Textarea Fullscreen] Error getting icon URL:', e);
    }
    return '';
  }

  function toggleFullscreen(editor, textarea, button) {
    if (editor.classList.contains('tx-expanded')) {
      button.style.backgroundImage = `url("${getIconUrl('icons/expand.svg')}")`;
      minimizeEditor(editor, button);
    } else {
      button.style.backgroundImage = `url("${getIconUrl('icons/collapse.svg')}")`;
      expandEditor(editor, textarea, button);
    }
  }

function expandEditor(editor, textarea, button) {
  // Pause observer while in fullscreen mode
  if (observer) {
    observer.disconnect();
  }

  // CRITICAL: Remove any existing overlays first
  document.querySelectorAll('.tx-editor-overlay').forEach(old => {
    if (old.parentNode) {
      old.parentNode.removeChild(old);
    }
  });

  // Create overlay - append directly to body
  let overlay = null;
  if (settings.overlay) {
    overlay = document.createElement('div');
    overlay.className = 'tx-editor-overlay';
    overlay.setAttribute('data-tx-overlay', 'true'); // For easier cleanup
    overlay.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      background: rgba(0, 0, 0, 0.7) !important;
      z-index: 2147483646 !important;
      opacity: 0 !important;
      transition: opacity 0.3s ease !important;
      backdrop-filter: blur(3px) !important;
      cursor: pointer !important;
      isolation: isolate !important;
      pointer-events: auto !important;
    `;
    
    const handleOverlayClick = () => {
      button.style.backgroundImage = `url("${getIconUrl('icons/expand.svg')}")`;
      minimizeEditor(editor, button);
    };
    
    overlay.addEventListener('click', handleOverlayClick);
    editor._overlayClickHandler = handleOverlayClick;
    
    // Append to body, not to editor
    document.body.appendChild(overlay);
    
    // Fade in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (overlay) {
          overlay.style.opacity = '1';
        }
      });
    });
  }

  // Store original parent and position
  editor._originalParent = editor.parentNode;
  editor._originalNextSibling = editor.nextSibling;
  editor._overlay = overlay;

    // Store original textarea styles
    editor._originalTextareaStyles = {
      width: textarea.style.width,
      height: textarea.style.height,
      minHeight: textarea.style.minHeight,
      maxHeight: textarea.style.maxHeight,
      resize: textarea.style.resize,
      background: textarea.style.background,
      color: textarea.style.color,
      position: textarea.style.position,
      border: textarea.style.border,
      borderRadius: textarea.style.borderRadius,
      padding: textarea.style.padding,
      fontSize: textarea.style.fontSize,
      lineHeight: textarea.style.lineHeight,
      fontFamily: textarea.style.fontFamily
    };

    // CRITICAL: Move editor directly to body to escape stacking context
    document.body.appendChild(editor);

    // Add expanded class
    editor.classList.add('tx-expanded');
    
    // Apply fullscreen styles
    editor.style.cssText = `
      position: fixed !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      width: 90vw !important;
      height: 90vh !important;
      max-width: 1400px !important;
      max-height: 900px !important;
      z-index: 2147483647 !important;
      background: #1e1e1e !important;
      border: 2px solid #444 !important;
      border-radius: 8px !important;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5) !important;
      padding: 15px !important;
      box-sizing: border-box !important;
      display: flex !important;
      flex-direction: column !important;
      isolation: isolate !important;
      margin: 0 !important;
    `;

    // Style textarea for fullscreen
    textarea.style.cssText = `
      width: 100% !important;
      height: 100% !important;
      min-height: 100% !important;
      max-height: 100% !important;
      resize: none !important;
      border: 1px solid #444 !important;
      border-radius: 4px !important;
      padding: 15px !important;
      font-size: 16px !important;
      line-height: 1.6 !important;
      box-sizing: border-box !important;
      background: #2a2a2a !important;
      color: #e0e0e0 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace !important;
      outline: none !important;
      flex: 1 1 auto !important;
      position: relative !important;
    `;

    // Update button for fullscreen
    button.style.cssText = `
      position: absolute !important;
      right: 20px !important;
      top: 20px !important;
      width: 32px !important;
      height: 32px !important;
      min-width: 32px !important;
      min-height: 32px !important;
      background-color: rgba(255, 255, 255, 0.9) !important;
      background-image: url("${getIconUrl('icons/collapse.svg')}") !important;
      background-size: 20px 20px !important;
      background-position: center !important;
      background-repeat: no-repeat !important;
      border: 1px solid #666 !important;
      border-radius: 4px !important;
      cursor: pointer !important;
      z-index: 2147483647 !important;
      padding: 0 !important;
      margin: 0 !important;
      box-shadow: 0 3px 12px rgba(0,0,0,0.3) !important;
      opacity: 0.9 !important;
      display: block !important;
      transition: all 0.2s ease !important;
      outline: none !important;
      font-size: 0 !important;
    `;

    // Focus textarea
    setTimeout(() => textarea.focus(), 100);

    // ESC key handler
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        button.style.backgroundImage = `url("${getIconUrl('icons/expand.svg')}")`;
        minimizeEditor(editor, button);
      }
    };
    document.addEventListener('keydown', handleEsc);
    editor._escHandler = handleEsc;
  }

  function minimizeEditor(editor, button) {
  // Remove ALL overlays (in case multiple were created)
  const overlays = document.querySelectorAll('.tx-editor-overlay');
  overlays.forEach(overlay => {
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none'; // CRITICAL: Disable clicking immediately
    
    // Remove after fade animation
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }, 350); // Slightly longer than transition
  });

  // Also remove the stored reference
  if (editor._overlay) {
    if (editor._overlay.parentNode) {
      editor._overlay.parentNode.removeChild(editor._overlay);
    }
    editor._overlay = null;
  }

  const textarea = editor.querySelector('textarea');

  // Restore textarea styles
  if (editor._originalTextareaStyles) {
    Object.assign(textarea.style, editor._originalTextareaStyles);
    delete editor._originalTextareaStyles;
  } else {
    // Fallback: reset to empty
    textarea.style.cssText = '';
  }

  // Remove expanded class
  editor.classList.remove('tx-expanded');

  // Reset editor to minimal inline styles
  editor.style.cssText = `
    position: relative !important;
    width: 100% !important;
    display: block !important;
  `;

  // CRITICAL: Move editor back to original position
  if (editor._originalParent) {
    if (editor._originalNextSibling) {
      editor._originalParent.insertBefore(editor, editor._originalNextSibling);
    } else {
      editor._originalParent.appendChild(editor);
    }
    delete editor._originalParent;
    delete editor._originalNextSibling;
  }

  // Reset button
  const expandIconUrl = getIconUrl('icons/expand.svg');
  button.style.cssText = `
    position: absolute !important;
    right: 5px !important;
    top: 5px !important;
    width: 30px !important;
    height: 30px !important;
    min-width: 30px !important;
    min-height: 30px !important;
    background-color: rgba(255, 255, 255, 0.95) !important;
    background-image: url("${expandIconUrl}") !important;
    background-size: 18px 18px !important;
    background-position: center !important;
    background-repeat: no-repeat !important;
    border: 1px solid rgba(204, 204, 204, 0.8) !important;
    border-radius: 4px !important;
    cursor: pointer !important;
    z-index: 999999 !important;
    padding: 0 !important;
    margin: 0 !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
    opacity: 0.85 !important;
    transition: all 0.2s ease !important;
    outline: none !important;
    font-size: 0 !important;
    display: block !important;
  `;

  // Remove ESC handler
  if (editor._escHandler) {
    document.removeEventListener('keydown', editor._escHandler);
    delete editor._escHandler;
  }

  // Resume observer
  if (!isKilled) {
    setTimeout(() => {
      if (observer) {
        setupObserver();
      }
    }, 500);
  }
}

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    killExtension();
    
    // Cleanup all editors
    document.querySelectorAll('.tx-editor').forEach(editor => {
      if (editor._escHandler) {
        document.removeEventListener('keydown', editor._escHandler);
        delete editor._escHandler;
      }
      if (editor._overlay && editor._overlay.parentNode) {
        editor._overlay.remove();
      }
    });
  });

  // Cleanup on extension disable/reload
  window.addEventListener('pagehide', () => {
    killExtension();
  });
  // Listen for settings updates from popup
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'SETTINGS_UPDATED') {
        console.log('[Textarea Fullscreen] Settings updated:', message.settings);
        settings = message.settings;
        
        // If extension was just enabled, initialize
        if (settings.enabled && !observer) {
          init();
        }
        // If disabled, kill it
        else if (!settings.enabled) {
          killExtension();
        }
        
        sendResponse({ success: true });
      }
    });
  } else if (typeof browser !== 'undefined' && browser.runtime) {
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'SETTINGS_UPDATED') {
        console.log('[Textarea Fullscreen] Settings updated:', message.settings);
        settings = message.settings;
        
        if (settings.enabled && !observer) {
          init();
        } else if (!settings.enabled) {
          killExtension();
        }
        
        return Promise.resolve({ success: true });
      }
    });
  }
  
})();
