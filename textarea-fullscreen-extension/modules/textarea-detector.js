// modules/textarea-detector.js
const TextareaDetector = (function() {
  'use strict';

  const UI = window.TextareaFullscreen.UI;
  const Fullscreen = window.TextareaFullscreen.Fullscreen;
  const Settings = window.TextareaFullscreen.Settings;
  const Performance = window.TextareaFullscreen.Performance;

  /**
   * Get human-readable identifier for textarea
   */
  function getTextareaIdentifier(textarea) {
    const parts = [];

    if (textarea.id) parts.push(`id="${textarea.id}"`);
    if (textarea.name) parts.push(`name="${textarea.name}"`);
    if (textarea.className) parts.push(`class="${textarea.className.substring(0, 50)}..."`);
    if (textarea.placeholder) parts.push(`placeholder="${textarea.placeholder.substring(0, 30)}..."`);

    // If no identifying attributes, show position in DOM
    if (parts.length === 0) {
      const parent = textarea.parentElement;
      if (parent) {
        parts.push(`parent=<${parent.tagName.toLowerCase()}${parent.id ? '#' + parent.id : ''}>`);
      }
    }

    return parts.length > 0 ? parts.join(' ') : '<anonymous textarea>';
  }

  /**
   * Get parent chain for debugging
   */
  function getParentChain(element, maxDepth = 3) {
    const chain = [];
    let current = element.parentElement;
    let depth = 0;

    while (current && current !== document.body && depth < maxDepth) {
      const tag = current.tagName.toLowerCase();
      const id = current.id ? `#${current.id}` : '';
      const classes = current.className ? `.${current.className.split(' ').join('.')}` : '';
      chain.push(`${tag}${id}${classes}`);
      current = current.parentElement;
      depth++;
    }

    return chain.join(' > ');
  }

  /**
   * Check if textarea is visible and meets size requirements
   */
  function isTextareaValid(textarea) {
    const identifier = getTextareaIdentifier(textarea);

    // Check 1: Is element visible?
    const computedStyle = window.getComputedStyle(textarea);
    if (computedStyle.display === 'none') {
      console.log(`[Detector] ❌ Skipped (display:none): ${identifier}`);
      return false;
    }
    if (computedStyle.visibility === 'hidden') {
      console.log(`[Detector] ❌ Skipped (visibility:hidden): ${identifier}`);
      return false;
    }
    if (computedStyle.opacity === '0') {
      console.log(`[Detector] ❌ Skipped (opacity:0): ${identifier}`);
      return false;
    }

    // Check 2: Get dimensions
    const rect = textarea.getBoundingClientRect();

    // Check 3: Minimum size requirement (relaxed - accept even single-line inputs)
    const minWidth = 50;   // Very permissive - even small textareas can benefit
    const minHeight = 15;  // Single-line height is typically 20-30px

    if (rect.width < minWidth || rect.height < minHeight) {
      console.log(`[Detector] ❌ Skipped (too small ${Math.round(rect.width)}×${Math.round(rect.height)}px, min ${minWidth}×${minHeight}px): ${identifier}`);
      return false;
    }

    // Check 4: Maximum size limit - ONLY skip if already taking up most of the viewport
    // This means the textarea is already in "fullscreen" mode
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Consider "fullscreen" if textarea takes more than 80% of viewport in both dimensions
    const widthPercentage = (rect.width / viewportWidth) * 100;
    const heightPercentage = (rect.height / viewportHeight) * 100;

    const isAlreadyFullscreen = widthPercentage > 80 && heightPercentage > 80;

    if (isAlreadyFullscreen) {
      console.log(`[Detector] ❌ Skipped (already fullscreen-sized ${Math.round(rect.width)}×${Math.round(rect.height)}px = ${Math.round(widthPercentage)}%×${Math.round(heightPercentage)}% of viewport): ${identifier}`);
      return false;
    }

    // Check 5: Is in or near viewport?
    const buffer = 200;

    const isNearViewport = (
      rect.bottom > -buffer &&
      rect.top < viewportHeight + buffer &&
      rect.right > -buffer &&
      rect.left < viewportWidth + buffer
    );

    if (!isNearViewport) {
      const position = {
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        left: Math.round(rect.left),
        right: Math.round(rect.right)
      };
      console.log(`[Detector] ⏸️ Skipped (not in viewport, position: top=${position.top}, bottom=${position.bottom}, viewport height=${viewportHeight}): ${identifier}`);
      return false;
    }

    // Check 6: Parent visibility
    let parent = textarea.parentElement;
    let parentDepth = 0;
    while (parent && parent !== document.body) {
      const parentStyle = window.getComputedStyle(parent);
      const parentTag = `<${parent.tagName.toLowerCase()}${parent.id ? '#' + parent.id : ''}${parent.className ? '.' + parent.className.split(' ')[0] : ''}>`;

      if (parentStyle.display === 'none') {
        console.log(`[Detector] ❌ Skipped (parent display:none at depth ${parentDepth}): ${identifier}`);
        console.log(`[Detector]    └─ Hidden parent: ${parentTag}`);
        console.log(`[Detector]    └─ Parent chain: ${getParentChain(textarea)}`);
        return false;
      }
      if (parentStyle.visibility === 'hidden') {
        console.log(`[Detector] ❌ Skipped (parent visibility:hidden at depth ${parentDepth}): ${identifier}`);
        console.log(`[Detector]    └─ Hidden parent: ${parentTag}`);
        return false;
      }
      if (parentStyle.opacity === '0') {
        console.log(`[Detector] ❌ Skipped (parent opacity:0 at depth ${parentDepth}): ${identifier}`);
        console.log(`[Detector]    └─ Hidden parent: ${parentTag}`);
        return false;
      }

      parent = parent.parentElement;
      parentDepth++;
    }

    // Check 7: Skip readonly + disabled
    if (textarea.hasAttribute('readonly') && textarea.hasAttribute('disabled')) {
      console.log(`[Detector] ❌ Skipped (readonly AND disabled): ${identifier}`);
      return false;
    }

    // If we got here, textarea is valid
    console.log(`[Detector] ✅ Valid textarea: ${identifier}`);
    console.log(`[Detector]    └─ Size: ${Math.round(rect.width)}×${Math.round(rect.height)}px (${Math.round(widthPercentage)}%×${Math.round(heightPercentage)}% of viewport)`);
    console.log(`[Detector]    └─ Position: ${Math.round(rect.top)}px from top`);

    return true;
  }

  /**
   * Add fullscreen button to a textarea
   */
  function addFullscreenButton(textarea) {
    if (Performance.isKilled()) return;

    const identifier = getTextareaIdentifier(textarea);

    // Mark immediately
    textarea.classList.add('tx-fullscreen-enabled');

    try {
      // Skip if already wrapped
      if (textarea.closest('.tx-editor-wrapper')) {
        console.log(`[Detector] ⏭️ Skipped (already wrapped): ${identifier}`);
        return;
      }

      // Validate textarea
      if (!isTextareaValid(textarea)) {
        // Retry later for out-of-viewport textareas
        setTimeout(() => {
          textarea.classList.remove('tx-fullscreen-enabled');
        }, 5000);
        return;
      }

      const rect = textarea.getBoundingClientRect();
      console.log(`[Detector] 🎯 Adding button to: ${identifier}`);
      console.log(`[Detector]    └─ Final size: ${Math.round(rect.width)}×${Math.round(rect.height)}px`);

      // Create button
      const button = UI.createButton();

      // Wrap textarea
      const editor = UI.wrapTextarea(textarea, button);

      // Click event
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        Fullscreen.toggle(editor, textarea, button);
      });

      // Keyboard shortcut
      const settings = Settings.get();
      textarea.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key.toLowerCase() === settings.shortcutKey) {
          e.preventDefault();
          Fullscreen.toggle(editor, textarea, button);
        }
      });

      console.log(`[Detector] ✅ Successfully added button to: ${identifier}`);

    } catch (e) {
      console.error(`[Detector] ⚠️ Error adding button to ${identifier}:`, e);
    }
  }

  /**
   * Process all unprocessed textareas
   */
  function processTextareas() {
    const allTextareas = document.querySelectorAll('textarea');
    const unprocessedTextareas = document.querySelectorAll('textarea:not(.tx-fullscreen-enabled)');

    console.log(`[Detector] 📊 Scanning page: ${allTextareas.length} total textareas, ${unprocessedTextareas.length} unprocessed`);

    const maxProcess = 10;
    let processed = 0;
    let skipped = 0;
    let alreadyWrapped = 0;

    unprocessedTextareas.forEach((textarea, index) => {
      if (processed >= maxProcess) {
        console.log(`[Detector] ⏸️ Reached max process limit (${maxProcess}), stopping. ${unprocessedTextareas.length - index} textareas queued for next batch.`);
        return;
      }

      if (Performance.isKilled()) {
        console.log(`[Detector] 🛑 Extension killed, stopping processing.`);
        return;
      }

      try {
        const wasAlreadyWrapped = textarea.closest('.tx-editor-wrapper') !== null;
        if (wasAlreadyWrapped) {
          alreadyWrapped++;
        }

        addFullscreenButton(textarea);

        // Check if it was actually processed (not just skipped)
        if (textarea.closest('.tx-editor-wrapper')) {
          processed++;
        } else if (!wasAlreadyWrapped) {
          skipped++;
        }
      } catch (e) {
        const identifier = getTextareaIdentifier(textarea);
        console.error(`[Detector] ⚠️ Error processing textarea ${identifier}:`, e);
        skipped++;
      }
    });

    // Summary
    console.log(`[Detector] 📈 Processing complete:`);
    console.log(`[Detector]    ├─ ✅ Processed: ${processed}`);
    console.log(`[Detector]    ├─ ⏭️ Already wrapped: ${alreadyWrapped}`);
    console.log(`[Detector]    ├─ ❌ Skipped: ${skipped}`);
    console.log(`[Detector]    └─ 📊 Total checked: ${unprocessedTextareas.length}`);

    if (processed === 0 && unprocessedTextareas.length > 0) {
      console.log(`[Detector] ⚠️ Warning: Found ${unprocessedTextareas.length} textareas but processed 0. Check validation criteria.`);
    }

    return processed;
  }

  return {
    isTextareaValid,
    addFullscreenButton,
    processTextareas,
    getTextareaIdentifier // Export for debugging
  };
})();

window.TextareaFullscreen = window.TextareaFullscreen || {};
window.TextareaFullscreen.Detector = TextareaDetector;