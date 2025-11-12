/**
 * Hook useTextareaDetector - detect and validate textareas on page
 * Main logic for textarea detection with MutationObserver support
 */
import { useState, useEffect, useCallback } from 'react';
import { TEXTAREA_MIN_SIZE, MAX_BATCH_SIZE, DATA_ATTRIBUTES } from '../utils/constants';
import { useMutationObserver } from './useMutationObserver';
import { useScrollDetection } from './useScrollDetection';
import { logger } from '../utils/logger';

export function useTextareaDetector() {
  const [textareas, setTextareas] = useState<HTMLTextAreaElement[]>([]);

  /**
   * Check if textarea is valid for processing
   */
  const isTextareaValid = useCallback((textarea: HTMLTextAreaElement): boolean => {
    logger.group(`🔍 Validating textarea`, true);

    // === CHECK 1: Visibility ===
    const style = window.getComputedStyle(textarea);
    if (style.display === 'none' || style.visibility === 'hidden') {
      logger.debug('❌ Hidden (display/visibility)');
      logger.groupEnd();
      return false;
    }
    if (parseFloat(style.opacity) === 0) {
      logger.debug('❌ Hidden (opacity: 0)');
      logger.groupEnd();
      return false;
    }

    // === CHECK 2: Size ===
    const rect = textarea.getBoundingClientRect();
    if (rect.width < TEXTAREA_MIN_SIZE.width || rect.height < TEXTAREA_MIN_SIZE.height) {
      logger.debug('❌ Too small', {
        width: rect.width,
        height: rect.height,
        min: TEXTAREA_MIN_SIZE,
      });
      logger.groupEnd();
      return false;
    }

    // === CHECK 3: Attributes ===
    if (textarea.hasAttribute('readonly') || textarea.hasAttribute('disabled')) {
      logger.debug('❌ Readonly or disabled');
      logger.groupEnd();
      return false;
    }

    // === CHECK 4: Parent Visibility ===
    let parent = textarea.parentElement;
    while (parent && parent !== document.body) {
      const parentStyle = window.getComputedStyle(parent);
      if (parentStyle.display === 'none' || parentStyle.visibility === 'hidden') {
        logger.debug('❌ Parent is hidden', parent);
        logger.groupEnd();
        return false;
      }
      parent = parent.parentElement;
    }

    logger.success('✅ Textarea is valid');
    logger.groupEnd();
    return true;
  }, []);

  /**
   * Process textareas on the page
   * Find and validate elements
   */
  const processTextareas = useCallback(() => {
    logger.time('⏱️ Process textareas');
    logger.group('[useTextareaDetector] Processing textareas...', true);
    const unprocessed = document.querySelectorAll<HTMLTextAreaElement>(
      `textarea:not([${DATA_ATTRIBUTES.processed}])`
    );
    logger.info(`Found ${unprocessed.length} unprocessed textarea(s)`);

    const validTextareas: HTMLTextAreaElement[] = [];

    for (const textarea of unprocessed) {
      textarea.setAttribute(DATA_ATTRIBUTES.processed, 'true');

      if (isTextareaValid(textarea)) {
        validTextareas.push(textarea);
        logger.debug('Added to valid list', {
          id: textarea.id,
          name: textarea.name,
        });
      }

      if (validTextareas.length >= MAX_BATCH_SIZE) {
        logger.warn(`Reached batch limit (${MAX_BATCH_SIZE})`);
        break;
      }
    }

    if (validTextareas.length > 0) {
      logger.success(`Found ${validTextareas.length} valid textarea(s)`);
      setTextareas(prev => {
        const existing = new Set(prev);
        const combined = [...prev];
        for (const ta of validTextareas) {
          if (!existing.has(ta)) {
            combined.push(ta);
          }
        }
        return combined;
      });
    } else {
      logger.info('No new valid textareas found');
    }
    logger.groupEnd();
    logger.timeEnd('⏱️ Process textareas');
  }, [isTextareaValid]);

  // Initial detection on mount
  useEffect(() => {
    logger.info('[useTextareaDetector] Hook mounted, starting detection...');
    processTextareas();
  }, [processTextareas]);

  // Watch for new textareas via MutationObserver
  useMutationObserver(processTextareas, {
    debounce: 150,
    filter: hasTextareaMutation,
    config: {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    }
  });

  // Watch for scroll events (lazy loading)
  useScrollDetection({
    debounce: 300,
    onScrollEnd: processTextareas
  });

  return { textareas, processTextareas };
}

/**
 * Filter function for MutationObserver
 * Only triggers for textarea-related mutations
 */
function hasTextareaMutation(mutations: MutationRecord[]): boolean {
  const mutationsToCheck = mutations.slice(0, 10);

  for (const mutation of mutationsToCheck) {
    // Ignore mutations from our own extension
    if (mutation.target instanceof Element) {
      if (mutation.target.closest('#textarea-fullscreen-root')) {
        continue;
      }
    }

    for (const node of Array.from(mutation.addedNodes)) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;

      const element = node as Element;
      if (element.tagName === 'TEXTAREA' || element.querySelector('textarea')) {
        return true;
      }
    }
  }

  return false;
}