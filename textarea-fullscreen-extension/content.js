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

  // Inline SVG icons as fallback
  const EXPAND_ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNOCAzSDVhMiAyIDAgMCAwLTIgMnYzbTE4IDBWNWEyIDIgMCAwIDAtMi0yaC0zbTAgMThoM2EyIDIgMCAwIDAgMi0ydi0zTTMgMTZ2M2EyIDIgMCAwIDAgMiAyaDMiLz48L3N2Zz4=';
  const COLLAPSE_ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNOCAzdjNhMiAyIDAgMCAxLTIgMkgzbTE4IDBoLTNhMiAyIDAgMCAxLTItMlYzbTAgMTh2LTNhMiAyIDAgMCAxIDItMmgzTTMgMTZoM2EyIDIgMCAwIDEgMiAydjMiLz48L3N2Zz4=';

  // Load settings from storage
  chrome.storage.sync.get(settings, (items) => {
    settings = items;
    if (settings.enabled) {
      init();
    }
  });

  function init() {
    // Find all textareas
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
      if (!textarea.classList.contains('tx-fullscreen-enabled')) {
        addFullscreenButton(textarea);
      }
    });

    // Watch for dynamically added textareas
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeName === 'TEXTAREA' && !node.classList.contains('tx-fullscreen-enabled')) {
            addFullscreenButton(node);
          }
          if (node.querySelectorAll) {
            const textareas = node.querySelectorAll('textarea');
            textareas.forEach(textarea => {
              if (!textarea.classList.contains('tx-fullscreen-enabled')) {
                addFullscreenButton(textarea);
              }
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function addFullscreenButton(textarea) {
    // Skip hidden textareas
    if (textarea.offsetParent === null) {
      return;
    }

    textarea.classList.add('tx-fullscreen-enabled');

    // Create wrapper if textarea doesn't already have one
    let wrapper = textarea.closest('.tx-editor-wrapper');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.className = 'tx-editor-wrapper';
      
      // Preserve textarea's display style
      const computedStyle = window.getComputedStyle(textarea);
      if (computedStyle.display === 'block') {
        wrapper.style.display = 'block';
      }
      
      textarea.parentNode.insertBefore(wrapper, textarea);
    }

    // Create editor container if it doesn't exist
    let editor = wrapper.querySelector('.tx-editor');
    if (!editor) {
      editor = document.createElement('div');
      editor.className = 'tx-editor';
      wrapper.appendChild(editor);
    }

    // Move textarea into editor if needed
    if (textarea.parentNode !== editor) {
      editor.appendChild(textarea);
    }

    // Check if button already exists
    if (editor.querySelector('.tx-icon')) {
      return;
    }

    // Create fullscreen icon button
    const icon = document.createElement('button');
    icon.className = 'tx-icon';
    icon.setAttribute('type', 'button');
    icon.setAttribute('aria-label', 'Toggle Fullscreen');
    icon.title = 'Toggle Fullscreen (Ctrl+F)';
    
    // Try to load SVG from extension, fallback to inline SVG
    const expandIconUrl = getIconUrl('icons/expand.svg', EXPAND_ICON);
    icon.style.backgroundImage = `url("${expandIconUrl}")`;

    // Insert icon before textarea
    editor.insertBefore(icon, textarea);

    // Click event for icon
    icon.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleFullscreen(editor, textarea, icon);
    });

    // Keyboard shortcut (Ctrl + configured key)
    textarea.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === settings.shortcutKey) {
        e.preventDefault();
        toggleFullscreen(editor, textarea, icon);
      }
    });
  }

  function getIconUrl(path, fallback) {
    try {
      return chrome.runtime.getURL(path);
    } catch (e) {
      return fallback;
    }
  }

  function toggleFullscreen(editor, textarea, icon) {
    if (editor.classList.contains('tx-expanded')) {
      icon.style.backgroundImage = `url("${getIconUrl('icons/expand.svg', EXPAND_ICON)}")`;
      minimizeEditor(editor);
    } else {
      icon.style.backgroundImage = `url("${getIconUrl('icons/collapse.svg', COLLAPSE_ICON)}")`;
      expandEditor(editor, textarea);
    }
  }

  function expandEditor(editor, textarea) {
    // Create overlay
    if (settings.overlay) {
      const overlay = document.createElement('div');
      overlay.className = 'tx-editor-overlay';
      overlay.addEventListener('click', () => {
        const icon = editor.querySelector('.tx-icon');
        minimizeEditor(editor);
        icon.style.backgroundImage = `url("${getIconUrl('icons/expand.svg', EXPAND_ICON)}")`;
      });
      document.body.appendChild(overlay);

      // Fade in overlay
      setTimeout(() => {
        overlay.style.opacity = '1';
      }, 10);
    }

    // Store original styles
    editor._originalStyles = {
      width: editor.style.width,
      height: editor.style.height,
      position: editor.style.position,
      top: editor.style.top,
      left: editor.style.left,
      transform: editor.style.transform,
      zIndex: editor.style.zIndex
    };

    // Expand editor
    editor.classList.add('tx-expanded');

    // Focus textarea
    textarea.focus();

    // Handle ESC key
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        const icon = editor.querySelector('.tx-icon');
        minimizeEditor(editor);
        icon.style.backgroundImage = `url("${getIconUrl('icons/expand.svg', EXPAND_ICON)}")`;
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);

    // Store event listener for cleanup
    editor._escHandler = handleEsc;
  }

  function minimizeEditor(editor) {
    // Remove overlay
    const overlay = document.querySelector('.tx-editor-overlay');
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.remove();
      }, 300);
    }

    // Minimize editor
    editor.classList.remove('tx-expanded');

    // Restore original styles
    if (editor._originalStyles) {
      Object.assign(editor.style, editor._originalStyles);
      delete editor._originalStyles;
    }

    // Remove event listener
    if (editor._escHandler) {
      document.removeEventListener('keydown', editor._escHandler);
      delete editor._escHandler;
    }
  }

})();
