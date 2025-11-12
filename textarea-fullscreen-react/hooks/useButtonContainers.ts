import { useEffect, useRef, useState } from 'react';
import { DATA_ATTRIBUTES, Z_INDEX } from '../utils/constants';
import { logger } from '../utils/logger';

/**
 * Hook to manage button containers for textareas
 * Creates and cleans up DOM containers for portal rendering
 */
export function useButtonContainers(textareas: HTMLTextAreaElement[]) {
  const containersRef = useRef<Map<HTMLTextAreaElement, HTMLDivElement>>(new Map());
  const [containersReady, setContainersReady] = useState(0);

  useEffect(() => {
    if (textareas.length === 0) return;

    logger.time('⏱️ Button container creation');
    logger.info('[useButtonContainers] Creating button containers...');

    let newContainersCreated = 0;

    textareas.forEach((textarea, index) => {
      // Skip if container already exists
      if (containersRef.current.has(textarea)) {
        logger.debug(`Container already exists for textarea #${index}`);
        return;
      }

      logger.group(`📦 Creating button container for textarea #${index}`, true);

      const parent = textarea.parentElement;
      if (!parent) {
        logger.error('No parent element found for textarea', textarea);
        logger.groupEnd();
        return;
      }

      // Check if container already exists in DOM
      const existingContainer = parent.querySelector(
        `[${DATA_ATTRIBUTES.wrapper}][data-textarea-id="${textarea.id || index}"]`
      ) as HTMLDivElement;

      if (existingContainer) {
        logger.success('Container already exists in DOM');
        containersRef.current.set(textarea, existingContainer);
        newContainersCreated++;
        logger.groupEnd();
        return;
      }

      // Create new button container
      const buttonContainer = document.createElement('div');
      buttonContainer.setAttribute(DATA_ATTRIBUTES.wrapper, 'true');
      buttonContainer.setAttribute('data-textarea-id', textarea.id || String(index));

      buttonContainer.style.cssText = `
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100% !important;
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        background: none !important;
        pointer-events: none !important;
        z-index: ${Z_INDEX.button} !important;
      `.replace(/\s+/g, ' ').trim();

      // Debug outline
      if (logger.isEnabled()) {
        buttonContainer.style.outline = '1px dotted rgba(0, 255, 0, 0.3)';
        buttonContainer.style.outlineOffset = '0px';
      }

      // Make parent positioned if needed
      const parentStyles = window.getComputedStyle(parent);
      if (parentStyles.position === 'static') {
        logger.log('Making parent positioned (relative)');
        parent.style.position = 'relative';
      }

      logger.log('Parent:', parent.tagName);
      logger.log('Parent position:', window.getComputedStyle(parent).position);

      parent.appendChild(buttonContainer);

      logger.success('Button container created');
      logger.log('Container z-index:', Z_INDEX.button);

      containersRef.current.set(textarea, buttonContainer);
      newContainersCreated++;

      logger.groupEnd();
    });

    if (newContainersCreated > 0) {
      logger.success(
        `Created ${newContainersCreated} button container${newContainersCreated > 1 ? 's' : ''}`
      );
      logger.info(`Total containers in ref: ${containersRef.current.size}`);

      setContainersReady(prev => prev + 1);
    }

    logger.timeEnd('⏱️ Button container creation');

    // Cleanup
    return () => {
      logger.debug('[useButtonContainers] Cleanup: removing button containers...');

      const currentTextareas = new Set(textareas);
      const toRemove: HTMLTextAreaElement[] = [];

      containersRef.current.forEach((container, textarea) => {
        if (!currentTextareas.has(textarea)) {
          logger.debug('Removing container for deleted textarea');
          toRemove.push(textarea);
          container.remove();
        }
      });

      toRemove.forEach(ta => containersRef.current.delete(ta));

      if (toRemove.length > 0) {
        logger.info(`Cleaned up ${toRemove.length} container${toRemove.length > 1 ? 's' : ''}`);
      }
    };
  }, [textareas]);

  return {
    containersRef,
    containersReady
  };
}