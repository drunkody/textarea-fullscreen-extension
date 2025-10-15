// modules/ui-builder.js
const UIBuilder = (function() {
  'use strict';

  /**
   * Get icon URL from extension resources
   */
  function getIconUrl(path) {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
        return chrome.runtime.getURL(path);
      }
      if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.getURL) {
        return browser.runtime.getURL(path);
      }
    } catch (e) {
      console.error('[UI] Error getting icon URL:', e);
    }
    return '';
  }

  /**
   * Create fullscreen button
   */
  function createButton() {
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

    // Hover effects
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

    return button;
  }

  /**
   * Create wrapper and editor containers
   */
  function createContainers(computedStyle) {
    const originalDisplay = computedStyle.display;

    const wrapper = document.createElement('div');
    wrapper.className = 'tx-editor-wrapper';
    wrapper.style.cssText = `
      position: relative !important;
      display: ${originalDisplay === 'inline' ? 'inline-block' : 'block'} !important;
      width: 100% !important;
    `;

    const editor = document.createElement('div');
    editor.className = 'tx-editor';
    editor.style.cssText = `
      position: relative !important;
      width: 100% !important;
      display: block !important;
    `;

    return { wrapper, editor };
  }

  /**
   * Wrap textarea with editor containers
   */
  function wrapTextarea(textarea, button) {
    const computedStyle = window.getComputedStyle(textarea);
    const { wrapper, editor } = createContainers(computedStyle);

    const parentEl = textarea.parentNode;
    if (!parentEl) {
      throw new Error('Textarea has no parent');
    }

    parentEl.insertBefore(wrapper, textarea);
    wrapper.appendChild(editor);
    editor.appendChild(button);
    editor.appendChild(textarea);

    return editor;
  }

  return {
    getIconUrl,
    createButton,
    wrapTextarea
  };
})();

window.TextareaFullscreen = window.TextareaFullscreen || {};
window.TextareaFullscreen.UI = UIBuilder;