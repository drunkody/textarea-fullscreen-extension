import { useEffect } from 'react';
import { Z_INDEX } from '../utils/constants';
import { logger } from '../utils/logger';

/**
 * Hook to fix z-index issues when textarea receives focus
 * Ensures button stays visible and clickable
 */
export function useZIndexFix(
  textareas: HTMLTextAreaElement[],
  containersRef: React.RefObject<Map<HTMLTextAreaElement, HTMLDivElement>>
) {
  useEffect(() => {
    const handleFocus = (textarea: HTMLTextAreaElement) => {
      logger.group('🔍 [useZIndexFix] Textarea focused - checking z-index', true);

      const container = containersRef.current?.get(textarea);
      if (!container) {
        logger.warn('No container found for focused textarea');
        logger.groupEnd();
        return;
      }

      // Verify button visibility
      const button = container.querySelector('.tx-fullscreen-btn') as HTMLElement;
      if (!button) {
        logger.warn('No button found in container');
        logger.groupEnd();
        return;
      }

      // Get element under button
      const buttonRect = button.getBoundingClientRect();
      const elementUnderButton = document.elementFromPoint(
        buttonRect.left + buttonRect.width / 2,
        buttonRect.top + buttonRect.height / 2
      );

      logger.log('Element under button:', elementUnderButton);
      logger.log('Button:', button);

      // If element under button is not the button - something is covering it
      if (elementUnderButton && elementUnderButton !== button) {
        const underStyles = window.getComputedStyle(elementUnderButton);
        logger.warn('Button is covered!', {
          coveringElement: elementUnderButton,
          coveringZIndex: underStyles.zIndex,
          buttonZIndex: window.getComputedStyle(button).zIndex,
          containerZIndex: window.getComputedStyle(container).zIndex
        });

        // Fix: Increase z-index if needed
        const coveringZIndex = parseInt(underStyles.zIndex) || 0;
        if (coveringZIndex >= Z_INDEX.button) {
          const newZIndex = coveringZIndex + 1;
          logger.info(`Increasing z-index to ${newZIndex}`);
          container.style.zIndex = String(newZIndex);
        }
      } else {
        logger.success('Button is visible and clickable');
      }

      logger.groupEnd();
    };

    // Add focus handlers to all textareas
    const focusHandlers = new Map<HTMLTextAreaElement, () => void>();

    textareas.forEach(textarea => {
      const handler = () => handleFocus(textarea);
      textarea.addEventListener('focus', handler);
      focusHandlers.set(textarea, handler);
    });

    // Cleanup
    return () => {
      focusHandlers.forEach((handler, textarea) => {
        textarea.removeEventListener('focus', handler);
      });
    };
  }, [textareas, containersRef]);
}