// modules/fullscreen.js
const FullscreenManager = (function() {
  'use strict';

  const UI = window.TextareaFullscreen.UI;
  const Settings = window.TextareaFullscreen.Settings;

  /**
   * Toggle fullscreen mode
   */
  function toggle(editor, textarea, button) {
    if (editor.classList.contains('tx-expanded')) {
      button.style.backgroundImage = `url("${UI.getIconUrl('icons/expand.svg')}")`;
      minimize(editor, button);
    } else {
      button.style.backgroundImage = `url("${UI.getIconUrl('icons/collapse.svg')}")`;
      expand(editor, textarea, button);
    }
  }

  /**
   * Expand to fullscreen
   */
  function expand(editor, textarea, button) {
    const settings = Settings.get();

    // Remove existing overlays
    document.querySelectorAll('.tx-editor-overlay').forEach(old => {
      if (old.parentNode) {
        old.parentNode.removeChild(old);
      }
    });

    // Create overlay
    let overlay = null;
    if (settings.overlay) {
      overlay = createOverlay(editor, button);
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

    // Store original state
    storeOriginalState(editor, textarea, overlay);

    // Move to body and apply fullscreen styles
    document.body.appendChild(editor);
    editor.classList.add('tx-expanded');

    applyFullscreenStyles(editor, textarea, button);

    // Focus textarea
    setTimeout(() => textarea.focus(), 100);

    // ESC key handler
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        button.style.backgroundImage = `url("${UI.getIconUrl('icons/expand.svg')}")`;
        minimize(editor, button);
      }
    };
    document.addEventListener('keydown', handleEsc);
    editor._escHandler = handleEsc;
  }

  /**
   * Create overlay element
   */
  function createOverlay(editor, button) {
    const overlay = document.createElement('div');
    overlay.className = 'tx-editor-overlay';
    overlay.setAttribute('data-tx-overlay', 'true');
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
      button.style.backgroundImage = `url("${UI.getIconUrl('icons/expand.svg')}")`;
      minimize(editor, button);
    };

    overlay.addEventListener('click', handleOverlayClick);
    editor._overlayClickHandler = handleOverlayClick;

    return overlay;
  }

  /**
   * Store original state before fullscreen
   */
  function storeOriginalState(editor, textarea, overlay) {
    editor._originalParent = editor.parentNode;
    editor._originalNextSibling = editor.nextSibling;
    editor._overlay = overlay;

    const style = textarea.style;
    editor._originalTextareaStyles = {
      width: style.width,
      height: style.height,
      minHeight: style.minHeight,
      maxHeight: style.maxHeight,
      resize: style.resize,
      background: style.background,
      color: style.color,
      position: style.position,
      border: style.border,
      borderRadius: style.borderRadius,
      padding: style.padding,
      fontSize: style.fontSize,
      lineHeight: style.lineHeight,
      fontFamily: style.fontFamily
    };
  }

  /**
   * Apply fullscreen styles
   */
  function applyFullscreenStyles(editor, textarea, button) {
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

    button.style.cssText = `
      position: absolute !important;
      right: 20px !important;
      top: 20px !important;
      width: 32px !important;
      height: 32px !important;
      min-width: 32px !important;
      min-height: 32px !important;
      background-color: rgba(255, 255, 255, 0.9) !important;
      background-image: url("${UI.getIconUrl('icons/collapse.svg')}") !important;
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
  }

  /**
   * Minimize from fullscreen
   */
  function minimize(editor, button) {
    const UI = window.TextareaFullscreen.UI;
    // Remove overlays
    const overlays = document.querySelectorAll('.tx-editor-overlay');
    overlays.forEach(overlay => {
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';

      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 350);
    });

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
      textarea.style.cssText = '';
    }

    // Remove expanded class
    editor.classList.remove('tx-expanded');

    // Reset editor styles
    editor.style.cssText = `
      position: relative !important;
      width: 100% !important;
      display: block !important;
    `;

    // Move back to original position
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
    const expandIconUrl = UI.getIconUrl('icons/expand.svg');
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
  }

  return {
    toggle,
    expand,
    minimize
  };
})();

window.TextareaFullscreen = window.TextareaFullscreen || {};
window.TextareaFullscreen.Fullscreen = FullscreenManager;