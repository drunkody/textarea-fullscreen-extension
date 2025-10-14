(function() {
  'use strict';

  // Default settings
  let settings = {
    enabled: true,
    overlay: true,
    maxWidth: '80%',
    maxHeight: '80%',
    shortcutKey: 'f'
  };

  let observer = null;
  let isProcessing = false;
  let processTimeout = null;

  // Load settings from storage
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.sync.get(settings, (items) => {
      settings = items;
      if (settings.enabled) {
        init();
      }
    });
  } else {
    // Firefox fallback
    init();
  }

  function init() {
    // Initial processing with delay
    setTimeout(() => {
      processTextareas();
    }, 500);

    // Setup mutation observer with throttling
    setupObserver();
  }

  function setupObserver() {
    // Throttled processing function
    const throttledProcess = () => {
      if (processTimeout) {
        clearTimeout(processTimeout);
      }
      processTimeout = setTimeout(() => {
        if (!isProcessing) {
          processTextareas();
        }
      }, 300); // 300ms throttle
    };

    observer = new MutationObserver((mutations) => {
      // Check if any mutations added textarea elements
      let hasNewTextarea = false;
      
      for (const mutation of mutations) {
        // Skip our own modifications
        if (mutation.target.classList && 
            (mutation.target.classList.contains('tx-editor-wrapper') ||
             mutation.target.classList.contains('tx-editor') ||
             mutation.target.classList.contains('tx-icon'))) {
          continue;
        }

        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1) { // Element node
            if (node.tagName === 'TEXTAREA' || 
                (node.querySelectorAll && node.querySelectorAll('textarea').length > 0)) {
              hasNewTextarea = true;
              break;
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
      subtree: true
    });
  }

  function processTextareas() {
    if (isProcessing) return;
    isProcessing = true;

    try {
      const textareas = document.querySelectorAll('textarea:not(.tx-fullscreen-enabled)');
      
      // Limit processing to prevent memory issues
      const maxProcess = 50;
      let processed = 0;

      textareas.forEach(textarea => {
        if (processed >= maxProcess) return;
        
        // Skip hidden textareas
        try {
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
    }
  }

  function addFullscreenButton(textarea) {
    // Double-check not already processed
    if (textarea.classList.contains('tx-fullscreen-enabled')) {
      return;
    }

    // Mark immediately to prevent reprocessing
    textarea.classList.add('tx-fullscreen-enabled');

    // Check if already wrapped
    if (textarea.closest('.tx-editor-wrapper')) {
      return;
    }

    try {
      // Temporarily disconnect observer to prevent infinite loop
      if (observer) {
        observer.disconnect();
      }

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
      textarea.parentNode.insertBefore(wrapper, textarea);
      wrapper.appendChild(editor);
      editor.appendChild(button);
      editor.appendChild(textarea);

      // Hover effects
      const handleMouseEnter = () => {
        button.style.opacity = '1';
        button.style.transform = 'scale(1.05)';
        button.style.boxShadow = '0 3px 12px rgba(0,0,0,0.25)';
      };

      const handleMouseLeave = () => {
        button.style.opacity = '0.85';
        button.style.transform = 'scale(1)';
        button.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
      };

      button.addEventListener('mouseenter', handleMouseEnter);
      button.addEventListener('mouseleave', handleMouseLeave);

      // Click event
      const handleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFullscreen(editor, textarea, button);
      };
      button.addEventListener('click', handleClick);

      // Keyboard shortcut
      const handleKeydown = (e) => {
        if (e.ctrlKey && e.key.toLowerCase() === settings.shortcutKey) {
          e.preventDefault();
          toggleFullscreen(editor, textarea, button);
        }
      };
      textarea.addEventListener('keydown', handleKeydown);

      // Store cleanup function
      editor._cleanup = () => {
        button.removeEventListener('mouseenter', handleMouseEnter);
        button.removeEventListener('mouseleave', handleMouseLeave);
        button.removeEventListener('click', handleClick);
        textarea.removeEventListener('keydown', handleKeydown);
      };

      // Reconnect observer after a delay
      setTimeout(() => {
        if (observer) {
          setupObserver();
        }
      }, 100);

    } catch (e) {
      console.error('[Textarea Fullscreen] Error adding button:', e);
      // Reconnect observer even on error
      setTimeout(() => {
        if (observer) {
          setupObserver();
        }
      }, 100);
    }
  }

  function getIconUrl(path) {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
        return chrome.runtime.getURL(path);
      }
      // Firefox/browser extension API fallback
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
    // Create overlay
    if (settings.overlay) {
      const overlay = document.createElement('div');
      overlay.className = 'tx-editor-overlay';
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
      `;
      
      const handleOverlayClick = () => {
        button.style.backgroundImage = `url("${getIconUrl('icons/expand.svg')}")`;
        minimizeEditor(editor, button);
      };
      
      overlay.addEventListener('click', handleOverlayClick);
      editor._overlayClickHandler = handleOverlayClick;
      
      document.body.appendChild(overlay);

      // Fade in
      requestAnimationFrame(() => {
        overlay.style.opacity = '1';
      });
    }

    // Store original textarea styles
    editor._originalTextareaStyles = {
      width: textarea.style.width,
      height: textarea.style.height,
      minHeight: textarea.style.minHeight,
      maxHeight: textarea.style.maxHeight,
      resize: textarea.style.resize,
      position: textarea.style.position,
      background: textarea.style.background,
      color: textarea.style.color
    };

    // Expand editor
    editor.classList.add('tx-expanded');
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
      flex: 1 !important;
    `;

    // Update button position for fullscreen
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
      transition: all 0.2s ease !important;
      outline: none !important;
      font-size: 0 !important;
      display: block !important;
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
    // Remove overlay
    const overlay = document.querySelector('.tx-editor-overlay');
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => {
        if (editor._overlayClickHandler) {
          overlay.removeEventListener('click', editor._overlayClickHandler);
          delete editor._overlayClickHandler;
        }
        overlay.remove();
      }, 300);
    }

    // Get textarea
    const textarea = editor.querySelector('textarea');

    // Restore textarea styles
    if (editor._originalTextareaStyles) {
      Object.assign(textarea.style, editor._originalTextareaStyles);
      delete editor._originalTextareaStyles;
    } else {
      textarea.style.cssText = '';
    }

    // Reset editor
    editor.classList.remove('tx-expanded');
    editor.style.cssText = `
      position: relative !important;
      width: 100% !important;
      display: block !important;
    `;

    // Reset button
    button.style.cssText = `
      position: absolute !important;
      right: 5px !important;
      top: 5px !important;
      width: 30px !important;
      height: 30px !important;
      min-width: 30px !important;
      min-height: 30px !important;
      background-color: rgba(255, 255, 255, 0.95) !important;
      background-image: url("${getIconUrl('icons/expand.svg')}") !important;
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
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    
    // Cleanup all editors
    document.querySelectorAll('.tx-editor').forEach(editor => {
      if (editor._cleanup) {
        editor._cleanup();
      }
      if (editor._escHandler) {
        document.removeEventListener('keydown', editor._escHandler);
      }
    });
  });

})();
