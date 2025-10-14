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
    // Use getComputedStyle for a more reliable size check
    const style = window.getComputedStyle(textarea);
    const height = parseFloat(style.height);
    const width = parseFloat(style.width);

    // Only add the button if the textarea is smaller than the defined limits
    if (height >= 400 || width >= 800) {
      return; // Skip large textareas
    }

    textarea.classList.add('tx-fullscreen-enabled');

    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'tx-editor-wrapper';

    // Create editor container
    const editor = document.createElement('div');
    editor.className = 'tx-editor';

    // Create fullscreen icon
    const icon = document.createElement('button');
    icon.className = 'tx-icon';
    icon.style.backgroundImage = `url(${chrome.runtime.getURL('icons/expand.svg')})`;
    icon.setAttribute('type', 'button');
    icon.setAttribute('aria-label', 'Toggle Fullscreen');
    icon.title = 'Toggle Fullscreen (Ctrl+F)';

    // Insert wrapper before textarea
    textarea.parentNode.insertBefore(wrapper, textarea);
    wrapper.appendChild(editor);
    editor.appendChild(icon);
    editor.appendChild(textarea);

    // Click event for icon
    icon.addEventListener('click', (e) => {
      e.preventDefault();
      toggleFullscreen(editor, textarea);
    });

    // Keyboard shortcut (Ctrl + configured key)
    textarea.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === settings.shortcutKey) {
        e.preventDefault();
        toggleFullscreen(editor, textarea);
      }
    });
  }

  function toggleFullscreen(editor, textarea) {
    const icon = editor.querySelector('.tx-icon');
    if (editor.classList.contains('expanded')) {
      icon.style.backgroundImage = `url(${chrome.runtime.getURL('icons/expand.svg')})`;
      minimizeEditor(editor);
    } else {
      icon.style.backgroundImage = `url(${chrome.runtime.getURL('icons/collapse.svg')})`;
      expandEditor(editor, textarea);
    }
  }

  function expandEditor(editor, textarea) {
    // Create overlay
    if (settings.overlay) {
      const overlay = document.createElement('div');
      overlay.className = 'tx-editor-overlay';
      overlay.addEventListener('click', () => {
        minimizeEditor(editor);
      });
      document.body.appendChild(overlay);

      // Fade in overlay
      setTimeout(() => {
        overlay.style.opacity = '1';
      }, 10);
    }

    // Expand editor
    editor.classList.add('expanded');

    if (settings.maxWidth) {
      editor.style.maxWidth = settings.maxWidth;
    }
    if (settings.maxHeight) {
      editor.style.maxHeight = settings.maxHeight;
    }

    // Position editor
    positionEditor(editor);

    // Focus textarea
    textarea.focus();

    // Handle ESC key
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        minimizeEditor(editor);
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);

    // Handle window resize
    const handleResize = () => {
      positionEditor(editor);
    };
    window.addEventListener('resize', handleResize);

    // Store event listeners for cleanup
    editor._escHandler = handleEsc;
    editor._resizeHandler = handleResize;
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
    editor.classList.remove('expanded');
    editor.style.maxWidth = '';
    editor.style.maxHeight = '';
    editor.style.top = '';
    editor.style.left = '';

    // Remove event listeners
    if (editor._escHandler) {
      document.removeEventListener('keydown', editor._escHandler);
      delete editor._escHandler;
    }
    if (editor._resizeHandler) {
      window.removeEventListener('resize', editor._resizeHandler);
      delete editor._resizeHandler;
    }
  }

  function positionEditor(editor) {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const editorWidth = editor.offsetWidth;
    const editorHeight = editor.offsetHeight;

    const top = (windowHeight - editorHeight) / 2;
    const left = (windowWidth - editorWidth) / 2;

    editor.style.top = Math.max(0, top) + 'px';
    editor.style.left = Math.max(0, left) + 'px';
  }

})();