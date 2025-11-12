import { createPortal } from 'react-dom';
import { useEffect, useRef } from 'react';
import { FullscreenButton } from '../FullscreenButton';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import { KEYBOARD_SHORTCUTS } from '../../utils/constants';
import { logger } from '../../utils/logger';
import './style.css';

interface FullscreenEditorProps {
  textarea: HTMLTextAreaElement;
  isExpanded: boolean;
  onClose: () => void;
}

export function FullscreenEditor({
  textarea,
  isExpanded,
  onClose
}: FullscreenEditorProps) {
  const cloneRef = useRef<HTMLTextAreaElement>(null);

  // ===== Keyboard Shortcuts =====
  // Escape to close editor (only when expanded)
  useKeyboardShortcut(KEYBOARD_SHORTCUTS.closeEditor, onClose, { enabled: isExpanded });

  // ===== Content Synchronization =====
  useEffect(() => {
    if (isExpanded && textarea && cloneRef.current) {
      const clone = cloneRef.current;

      logger.group('📝 [FullscreenEditor] Initializing', true);

      // 1. Copy original content to clone
      clone.value = textarea.value;
      logger.debug('Content copied to clone', { length: clone.value.length });

      // 2. Auto-focus the clone
      clone.focus();
      logger.debug('Clone focused');

      // 3. Sync changes back to original
      const syncContent = (e: Event) => {
        const newValue = (e.target as HTMLTextAreaElement).value;
        textarea.value = newValue;
        logger.debug('Content synced to original', { length: newValue.length });
      };

      clone.addEventListener('input', syncContent);
      logger.success('Event listener attached');

      logger.groupEnd();

      // 4. Cleanup
      return () => {
        logger.debug('[FullscreenEditor] Removing event listener');
        clone.removeEventListener('input', syncContent);
      };
    }
  }, [isExpanded, textarea]);

  // Don't render if not expanded
  if (!isExpanded) {
    return null;
  }

  logger.debug('[FullscreenEditor] Rendering portal');

  // Render using React Portal to document.body
  return createPortal(
    <div className="tx-fullscreen-editor">
      <textarea
        ref={cloneRef}
        className="tx-fullscreen-textarea"
        defaultValue={textarea?.value}
        placeholder="Start typing..."
      />
      <FullscreenButton onClick={onClose} isExpanded={true} />
    </div>,
    document.body
  );
}
