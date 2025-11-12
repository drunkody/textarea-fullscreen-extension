/**
 * Main content script component
 * Orchestrates textarea detection and fullscreen functionality
 */
import { useState, useCallback, useEffect } from 'react';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';

import { useZIndexFix } from '../../hooks/useZIndexFix';
import { StatusBadge } from '../../components/StatusBadge';
import { TextareaButtons } from '../../components/TextareaButtons';
import { FullscreenEditor } from '../../components/FullscreenEditor';
import { Overlay } from '../../components/Overlay';
import { KEYBOARD_SHORTCUTS } from '../../utils/constants';
import { logger } from '../../utils/logger';

export default function ContentApp() {
  // Detect textareas on the page
  const { textareas } = useTextareaDetector();

  // Track which textarea is expanded
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Create and manage button containers
  const { containersRef } = useButtonContainers(textareas);

  // Fix z-index issues on focus
  useZIndexFix(textareas, containersRef);

  // Log textarea detection
  useEffect(() => {
    if (textareas.length === 0) return;

    logger.group('🔍 [ContentApp] Textarea Detection');
    logger.info('Total textareas found', textareas.length);

    textareas.forEach((textarea, index) => {
      logger.group(`📝 Textarea #${index}`, true);
      logger.debug('Element', textarea);
      logger.log('Class:', textarea.className);
      logger.log('Placeholder:', textarea.placeholder);

      const rect = textarea.getBoundingClientRect();
      logger.log('Position:', { top: rect.top, left: rect.left });
      logger.log('Size:', { width: rect.width, height: rect.height });

      logger.groupEnd();
    });

    logger.groupEnd();
  }, [textareas]);

  // Handle button click
  const handleButtonClick = useCallback(
    (index: number) => {
      logger.group(`🖱️ [ContentApp] Button clicked for textarea #${index}`);
      logger.debug('State change', {
        current: expandedIndex,
        new: expandedIndex === index ? null : index
      });

      setExpandedIndex(expandedIndex === index ? null : index);
      logger.groupEnd();
    },
    [expandedIndex]
  );

  // ===== Keyboard Shortcut: Ctrl+F to toggle fullscreen =====
  useKeyboardShortcut(
    KEYBOARD_SHORTCUTS.toggleFullscreen,
    () => {
      logger.group('⌨️ [ContentApp] Ctrl+F pressed');

      // Find currently focused textarea
      const activeElement = document.activeElement;

      if (activeElement instanceof HTMLTextAreaElement) {
        // Find index of focused textarea
        const index = textareas.indexOf(activeElement);

        if (index !== -1) {
          logger.info('Toggling fullscreen for focused textarea', { index });

          // Toggle: close if already expanded, open if not
          setExpandedIndex(expandedIndex === index ? null : index);
        } else {
          logger.warn('Focused textarea not in our list');
        }
      } else {
        logger.debug('No textarea focused, ignoring shortcut');

        // Optional: expand first textarea if none focused
        if (textareas.length > 0 && expandedIndex === null) {
          logger.info('Expanding first textarea');
          setExpandedIndex(0);
        }
      }

      logger.groupEnd();
    },
    { ctrl: true }
  );

  // Handle editor close
  const handleEditorClose = useCallback(() => {
    logger.info('[ContentApp] Closing fullscreen editor');
    setExpandedIndex(null);
  }, []);

  return (
    <>
      {/* Status Badge */}
      <StatusBadge textareaCount={textareas.length} />

      {/* Fullscreen Buttons */}
      <TextareaButtons
        textareas={textareas}
        containersRef={containersRef}
        expandedIndex={expandedIndex}
        onButtonClick={handleButtonClick}
      />

      {/* Background Overlay */}
      {expandedIndex !== null && (
        <Overlay onClose={handleEditorClose} visible={true} />
      )}

      {/* Fullscreen Editor Modal */}
      {expandedIndex !== null && textareas[expandedIndex] && (
        <FullscreenEditor
          textarea={textareas[expandedIndex]}
          isExpanded={true}
          onClose={handleEditorClose}
        />
      )}
    </>
  );
}