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

  // Load settings from storage
  chrome.storage.sync.get(settings, (items) => {
    settings = items;
    if (settings.enabled) {
      init();
    }
  });

  function init() {
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      processTextareas();
    }, 100);

    // Watch for dynamically added textareas
    const observer = new MutationObserver((mutations) => {
      processTextareas();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function processTextareas() {
    const textareas = document.querySelectorAll('textarea:not(.tx-fullscreen-enabled)');
    textareas.forEach(textarea => {
      // Skip hidden textareas
      const rect = textarea.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        addFullscreenButton(textarea);
      }
    });
  }

  function addFullscreenButton(textarea) {
    // Mark as processed
    textarea.classList.add('tx-fullscreen-enabled');

    // Get computed style
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
    
    // Inline styles to ensure visibility
    button.style.cssText = `
      position: absolute !important;
      right: 5px !important;
      top: 5px !important;
      width: 30px !important;
      height: 30px !important;
      min-width: 30px !important;
      min-height: 30px !important;
      background-color: rgba(255, 255, 255, 0.95) !important;
      background-image: url("${chrome.runtime.getURL('icons/expand.svg')}") !important;
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

    // Hover effect
    button.addEventListener('mouseenter', () => {
      button.style.opacity = '1';
      button.style.transform = 'scale(1.05)';
      button.style.boxShadow = '0 3px 12px rgba(0,0,0,0.25)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.opacity = '0.85';
      button.style.transform = 'scale(1)';
      button.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    });

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

    // Log for debugging
    console.log('[Textarea Fullscreen] Button added to textarea:', textarea);
  }

  function toggleFullscreen(editor, textarea, button) {
    if (editor.classList.contains('tx-expanded')) {
      button.style.backgroundImage = `url("${chrome.runtime.getURL('icons/expand.svg')}")`;
      minimizeEditor(editor, button);
    } else {
      button.style.backgroundImage = `url("${chrome.runtime.getURL('icons/collapse.svg')}")`;
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
      
      overlay.addEventListener('click', () => {
        button.style.backgroundImage = `url("${chrome.runtime.getURL('icons/expand.svg')}")`;
        minimizeEditor(editor, button);
      });
      
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
      position: textarea.style.position
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
      background-image: url("${chrome.runtime.getURL('icons/collapse.svg')}") !important;
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
        button.style.backgroundImage = `url("${chrome.runtime.getURL('icons/expand.svg')}")`;
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
      setTimeout(() => overlay.remove(), 300);
    }

    // Get textarea
    const textarea = editor.querySelector('textarea');

    // Restore textarea styles
    if (editor._originalTextareaStyles) {
      Object.assign(textarea.style, editor._originalTextareaStyles);
      delete editor._originalTextareaStyles;
    } else {
      // Reset to defaults
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
      background-image: url("${chrome.runtime.getURL('icons/expand.svg')}") !important;
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

})();
