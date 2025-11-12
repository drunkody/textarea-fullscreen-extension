import { createPortal } from 'react-dom';
import { FullscreenButton } from '../FullscreenButton';
import { logger } from '../../utils/logger';

interface TextareaButtonsProps {
  textareas: HTMLTextAreaElement[];
  containersRef: React.RefObject<Map<HTMLTextAreaElement, HTMLDivElement>>;
  expandedIndex: number | null;
  onButtonClick: (index: number) => void;
}

/**
 * Renders fullscreen buttons for all textareas using portals
 */
export function TextareaButtons({
  textareas,
  containersRef,
  expandedIndex,
  onButtonClick
}: TextareaButtonsProps) {
  return (
    <>
      {textareas.map((textarea, index) => {
        const container = containersRef.current?.get(textarea);

        if (!container) {
          return null;
        }

        logger.debug(`Rendering portal for textarea #${index}`);

        return createPortal(
          <FullscreenButton
            onClick={() => onButtonClick(index)}
            isExpanded={expandedIndex === index}
          />,
          container,
          `button-${index}`
        );
      })}
    </>
  );
}
